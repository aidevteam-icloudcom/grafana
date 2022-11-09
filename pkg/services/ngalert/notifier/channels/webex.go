package channels

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/prometheus/alertmanager/template"
	"github.com/prometheus/alertmanager/types"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/notifications"
)

const webexAPIURL = "https://webexapis.com/v1/messages"

// WebexNotifier is responsible for sending alert notifications as webex messages.
type WebexNotifier struct {
	*Base
	ns       notifications.WebhookSender
	log      log.Logger
	images   ImageStore
	tmpl     *template.Template
	orgID    int64
	settings *webexSettings
}

// PLEASE do not touch these settings without taking a look at what we support as part of
// https://github.com/prometheus/alertmanager/blob/main/notify/webex/webex.go
// Currently, the Alerting team is unifying channels and (upstream) receivers - any discrepancy is detrimental to that.
type webexSettings struct {
	Message string `json:"message,omitempty" yaml:"message,omitempty"`
	RoomID  string `json:"room_id,omitempty" yaml:"room_id,omitempty"`
	APIURL  string `json:"api_url,omitempty" yaml:"api_url,omitempty"`
	Token   string `json:"bot_token" yaml:"bot_token"`
}

func buildWebexSettings(factoryConfig FactoryConfig) (*webexSettings, error) {
	settings := &webexSettings{}
	err := factoryConfig.Config.unmarshalSettings(&settings)
	if err != nil {
		return settings, fmt.Errorf("failed to unmarshal settings: %w", err)
	}

	if settings.APIURL == "" {
		settings.APIURL = webexAPIURL
	}

	if settings.Message == "" {
		settings.Message = DefaultMessageEmbed
	}

	settings.Token = factoryConfig.DecryptFunc(context.Background(), factoryConfig.Config.SecureSettings, "bot_token", settings.Token)

	u, err := url.Parse(settings.APIURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL %q", settings.APIURL)
	}
	settings.APIURL = u.String()

	return settings, err
}

func WebexFactory(fc FactoryConfig) (NotificationChannel, error) {
	notifier, err := buildWebexNotifier(fc)
	if err != nil {
		return nil, receiverInitError{
			Reason: err.Error(),
			Cfg:    *fc.Config,
		}
	}
	return notifier, nil
}

// buildWebexSettings is the constructor for the Webex notifier.
func buildWebexNotifier(factoryConfig FactoryConfig) (*WebexNotifier, error) {
	settings, err := buildWebexSettings(factoryConfig)
	if err != nil {
		return nil, err
	}

	logger := log.New("alerting.notifier.webex")

	return &WebexNotifier{
		Base: NewBase(&models.AlertNotification{
			Uid:                   factoryConfig.Config.UID,
			Name:                  factoryConfig.Config.Name,
			Type:                  factoryConfig.Config.Type,
			DisableResolveMessage: factoryConfig.Config.DisableResolveMessage,
			Settings:              factoryConfig.Config.Settings,
		}),
		orgID:    factoryConfig.Config.OrgID,
		log:      logger,
		ns:       factoryConfig.NotificationService,
		images:   factoryConfig.ImageStore,
		tmpl:     factoryConfig.Template,
		settings: settings,
	}, nil
}

// WebexMessage defines the JSON object to send to Webex endpoints.
type WebexMessage struct {
	RoomID  string   `json:"roomId,omitempty"`
	Message string   `json:"markdown"`
	Files   []string `json:"files"`
}

// Notify implements the Notifier interface.
func (wn *WebexNotifier) Notify(ctx context.Context, as ...*types.Alert) (bool, error) {
	var tmplErr error
	tmpl, data := TmplText(ctx, wn.tmpl, as, wn.log, &tmplErr)

	message := tmpl(wn.settings.Message)

	if tmplErr != nil {
		wn.log.Warn("failed to template webex message", "error", tmplErr.Error())
		tmplErr = nil
	}

	msg := &WebexMessage{
		RoomID:  wn.settings.RoomID,
		Message: message,
		Files:   []string{},
	}

	// Augment our Alert data with ImageURLs if available.
	_ = withStoredImages(ctx, wn.log, wn.images,
		func(index int, image ngmodels.Image) error {
			if len(image.URL) != 0 {
				data.Alerts[index].ImageURL = image.URL
				msg.Files = append(msg.Files, image.URL)
			}
			return nil
		},
		as...)

	body, err := json.Marshal(msg)
	if err != nil {
		return false, err
	}

	parsedURL := tmpl(wn.settings.APIURL)
	if tmplErr != nil {
		return false, tmplErr
	}

	cmd := &models.SendWebhookSync{
		Url:        parsedURL,
		Body:       string(body),
		HttpMethod: http.MethodPost,
	}

	if wn.settings.Token != "" {
		headers := make(map[string]string)
		headers["Authorization"] = fmt.Sprintf("Bearer %s", wn.settings.Token)
		cmd.HttpHeader = headers
	}

	if err := wn.ns.SendWebhookSync(ctx, cmd); err != nil {
		return false, err
	}

	return true, nil
}

func (wn *WebexNotifier) SendResolved() bool {
	return !wn.GetDisableResolveMessage()
}
