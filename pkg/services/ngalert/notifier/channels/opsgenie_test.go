package channels

import (
	"context"
	"net/url"
	"testing"

	"github.com/prometheus/alertmanager/notify"
	"github.com/prometheus/alertmanager/types"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/alerting"
)

func TestOpsgenieNotifier(t *testing.T) {
	tmpl := templateForTests(t)

	externalURL, err := url.Parse("http://localhost")
	require.NoError(t, err)
	tmpl.ExternalURL = externalURL

	cases := []struct {
		name         string
		settings     string
		alerts       []*types.Alert
		expMsg       string
		expInitError error
		expMsgError  error
	}{
		{
			name:     "Default config with one alert",
			settings: `{"apiKey": "abcdefgh0123456789"}`,
			alerts: []*types.Alert{
				{
					Alert: model.Alert{
						Labels:      model.LabelSet{"alertname": "alert1", "lbl1": "val1"},
						Annotations: model.LabelSet{"ann1": "annv1"},
					},
				},
			},
			expMsg: `{
				"alias": "6e3538104c14b583da237e9693b76debbc17f0f8058ef20492e5853096cf8733",
				"description": "[FIRING:1]  (val1)\nhttp://localhost/alerting/list\n\n\n**Firing**\nLabels:\n - alertname = alert1\n - lbl1 = val1\nAnnotations:\n - ann1 = annv1\nSource: \n\n\n\n\n",
				"details": {
					"url": "http://localhost/alerting/list"
				},
				"message": "[FIRING:1]  (val1)",
				"source": "Grafana",
				"tags": ["ann1:annv1"]
			}`,
		},
		{
			name: "Default config with one alert and send tags as tags",
			settings: `{
				"apiKey": "abcdefgh0123456789",
				"sendTagsAs": "tags"
			}`,
			alerts: []*types.Alert{
				{
					Alert: model.Alert{
						Labels:      model.LabelSet{"alertname": "alert1", "lbl1": "val1"},
						Annotations: model.LabelSet{"ann1": "annv1"},
					},
				},
			},
			expMsg: `{
				"alias": "6e3538104c14b583da237e9693b76debbc17f0f8058ef20492e5853096cf8733",
				"description": "[FIRING:1]  (val1)\nhttp://localhost/alerting/list\n\n\n**Firing**\nLabels:\n - alertname = alert1\n - lbl1 = val1\nAnnotations:\n - ann1 = annv1\nSource: \n\n\n\n\n",
				"details": {
					"url": "http://localhost/alerting/list"
				},
				"message": "[FIRING:1]  (val1)",
				"source": "Grafana",
				"tags": ["ann1:annv1"]
			}`,
		},
		{
			name: "Default config with one alert and send tags as details",
			settings: `{
				"apiKey": "abcdefgh0123456789",
				"sendTagsAs": "details"
			}`,
			alerts: []*types.Alert{
				{
					Alert: model.Alert{
						Labels:      model.LabelSet{"alertname": "alert1", "lbl1": "val1"},
						Annotations: model.LabelSet{"ann1": "annv1"},
					},
				},
			},
			expMsg: `{
				"alias": "6e3538104c14b583da237e9693b76debbc17f0f8058ef20492e5853096cf8733",
				"description": "[FIRING:1]  (val1)\nhttp://localhost/alerting/list\n\n\n**Firing**\nLabels:\n - alertname = alert1\n - lbl1 = val1\nAnnotations:\n - ann1 = annv1\nSource: \n\n\n\n\n",
				"details": {
					"ann1": "annv1",
					"url": "http://localhost/alerting/list"
				},
				"message": "[FIRING:1]  (val1)",
				"source": "Grafana",
				"tags": []
			}`,
		},
		{
			name: "Custom config with multiple alerts and send tags as both details and tag",
			settings: `{
				"apiKey": "abcdefgh0123456789",
				"sendTagsAs": "both"
			}`,
			alerts: []*types.Alert{
				{
					Alert: model.Alert{
						Labels:      model.LabelSet{"alertname": "alert1", "lbl1": "val1"},
						Annotations: model.LabelSet{"ann1": "annv1"},
					},
				}, {
					Alert: model.Alert{
						Labels:      model.LabelSet{"alertname": "alert1", "lbl1": "val2"},
						Annotations: model.LabelSet{"ann1": "annv1"},
					},
				},
			},
			expMsg: `{
				"alias": "6e3538104c14b583da237e9693b76debbc17f0f8058ef20492e5853096cf8733",
				"description": "[FIRING:2]  \nhttp://localhost/alerting/list\n\n\n**Firing**\nLabels:\n - alertname = alert1\n - lbl1 = val1\nAnnotations:\n - ann1 = annv1\nSource: \nLabels:\n - alertname = alert1\n - lbl1 = val2\nAnnotations:\n - ann1 = annv1\nSource: \n\n\n\n\n",
				"details": {
					"ann1": "annv1",
					"url": "http://localhost/alerting/list"
				},
				"message": "[FIRING:2]  ",
				"source": "Grafana",
				"tags": ["ann1:annv1"]
			}`,
			expInitError: nil,
			expMsgError:  nil,
		}, {
			name:         "Error when incorrect settings",
			settings:     `{}`,
			expInitError: alerting.ValidationError{Reason: "Could not find api key property in settings"},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			settingsJSON, err := simplejson.NewJson([]byte(c.settings))
			require.NoError(t, err)

			m := &NotificationChannelConfig{
				Name:     "opsgenie_testing",
				Type:     "opsgenie",
				Settings: settingsJSON,
			}

			pn, err := NewOpsgenieNotifier(m, tmpl)
			if c.expInitError != nil {
				require.Error(t, err)
				require.Equal(t, c.expInitError.Error(), err.Error())
				return
			}
			require.NoError(t, err)

			body := ""
			bus.AddHandlerCtx("test", func(ctx context.Context, webhook *models.SendWebhookSync) error {
				body = webhook.Body
				return nil
			})

			ctx := notify.WithGroupKey(context.Background(), "alertname")
			ctx = notify.WithGroupLabels(ctx, model.LabelSet{"alertname": ""})
			ok, err := pn.Notify(ctx, c.alerts...)
			if c.expMsgError != nil {
				require.False(t, ok)
				require.Error(t, err)
				require.Equal(t, c.expMsgError.Error(), err.Error())
				return
			}
			require.True(t, ok)
			require.NoError(t, err)
			require.JSONEq(t, c.expMsg, body)
		})
	}
}
