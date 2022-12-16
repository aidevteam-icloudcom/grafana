package channels

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/grafana/alerting/alerting/notifier/channels"
	"github.com/prometheus/alertmanager/template"
	"github.com/prometheus/alertmanager/types"
	"github.com/prometheus/common/model"

	"github.com/grafana/grafana/pkg/components/simplejson"
)

type AlertmanagerConfig struct {
	*channels.NotificationChannelConfig
	URLs              []*url.URL
	BasicAuthUser     string
	BasicAuthPassword string
}

func NewAlertmanagerConfig(config *channels.NotificationChannelConfig, fn channels.GetDecryptedValueFn) (*AlertmanagerConfig, error) {
	simpleConfig, err := simplejson.NewJson(config.Settings)
	if err != nil {
		return nil, err
	}
	urlStr := simpleConfig.Get("url").MustString()
	if urlStr == "" {
		return nil, errors.New("could not find url property in settings")
	}

	urlParts := strings.Split(urlStr, ",")
	urls := make([]*url.URL, 0, len(urlParts))

	for _, uS := range urlParts {
		uS = strings.TrimSpace(uS)
		if uS == "" {
			continue
		}
		uS = strings.TrimSuffix(uS, "/") + "/api/v1/alerts"
		u, err := url.Parse(uS)
		if err != nil {
			return nil, fmt.Errorf("invalid url property in settings: %w", err)
		}
		urls = append(urls, u)
	}
	return &AlertmanagerConfig{
		NotificationChannelConfig: config,
		URLs:                      urls,
		BasicAuthUser:             simpleConfig.Get("basicAuthUser").MustString(),
		BasicAuthPassword:         fn(context.Background(), config.SecureSettings, "basicAuthPassword", simpleConfig.Get("basicAuthPassword").MustString()),
	}, nil
}

func AlertmanagerFactory(fc channels.FactoryConfig) (channels.NotificationChannel, error) {
	config, err := NewAlertmanagerConfig(fc.Config, fc.DecryptFunc)
	if err != nil {
		return nil, receiverInitError{
			Reason: err.Error(),
			Cfg:    *fc.Config,
		}
	}
	return NewAlertmanagerNotifier(config, fc.Logger, fc.ImageStore, nil, fc.DecryptFunc), nil
}

// NewAlertmanagerNotifier returns a new Alertmanager notifier.
func NewAlertmanagerNotifier(config *AlertmanagerConfig, l channels.Logger, images channels.ImageStore, _ *template.Template, fn channels.GetDecryptedValueFn) *AlertmanagerNotifier {
	return &AlertmanagerNotifier{
		Base:              channels.NewBase(config.NotificationChannelConfig),
		images:            images,
		urls:              config.URLs,
		basicAuthUser:     config.BasicAuthUser,
		basicAuthPassword: config.BasicAuthPassword,
		logger:            l,
	}
}

// AlertmanagerNotifier sends alert notifications to the alert manager
type AlertmanagerNotifier struct {
	*channels.Base
	images channels.ImageStore

	urls              []*url.URL
	basicAuthUser     string
	basicAuthPassword string
	logger            channels.Logger
}

// Notify sends alert notifications to Alertmanager.
func (n *AlertmanagerNotifier) Notify(ctx context.Context, as ...*types.Alert) (bool, error) {
	n.logger.Debug("sending Alertmanager alert", "alertmanager", n.Name)
	if len(as) == 0 {
		return true, nil
	}

	_ = withStoredImages(ctx, n.logger, n.images,
		func(index int, image channels.Image) error {
			// If there is an image for this alert and the image has been uploaded
			// to a public URL then include it as an annotation
			if image.URL != "" {
				as[index].Annotations["image"] = model.LabelValue(image.URL)
			}
			return nil
		}, as...)

	body, err := json.Marshal(as)
	if err != nil {
		return false, err
	}

	var (
		lastErr error
		numErrs int
	)
	for _, u := range n.urls {
		if _, err := sendHTTPRequest(ctx, u, httpCfg{
			user:     n.basicAuthUser,
			password: n.basicAuthPassword,
			body:     body,
		}, n.logger); err != nil {
			n.logger.Warn("failed to send to Alertmanager", "error", err, "alertmanager", n.Name, "url", u.String())
			lastErr = err
			numErrs++
		}
	}

	if numErrs == len(n.urls) {
		// All attempts to send alerts have failed
		n.logger.Warn("all attempts to send to Alertmanager failed", "alertmanager", n.Name)
		return false, fmt.Errorf("failed to send alert to Alertmanager: %w", lastErr)
	}

	return true, nil
}

func (n *AlertmanagerNotifier) SendResolved() bool {
	return !n.GetDisableResolveMessage()
}
