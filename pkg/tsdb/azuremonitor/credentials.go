package azuremonitor

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/tokenprovider"
)

// Azure cloud names specific to Azure Monitor
const (
	azureMonitorPublic       = "azuremonitor"
	azureMonitorChina        = "chinaazuremonitor"
	azureMonitorUSGovernment = "govazuremonitor"
	azureMonitorGermany      = "germanyazuremonitor"
)

// Azure cloud query types
const (
	azureMonitor       = "Azure Monitor"
	appInsights        = "Application Insights"
	azureLogAnalytics  = "Azure Log Analytics"
	insightsAnalytics  = "Insights Analytics"
	azureResourceGraph = "Azure Resource Graph"
)

func httpCliProvider(ctx context.Context, route azRoute, model datasourceInfo, cfg *setting.Cfg) *httpclient.Provider {
	tokenAuth := &plugins.JwtTokenAuth{
		Url:    route.URL,
		Scopes: route.Scopes,
		Params: map[string]string{
			"azure_auth_type": model.Settings.AzureAuthType,
			"azure_cloud":     cfg.Azure.Cloud,
			"tenant_id":       model.Settings.TenantId,
			"client_id":       model.Settings.ClientId,
			"client_secret":   model.DecryptedSecureJSONData["clientSecret"],
		},
	}
	tokenProvider := tokenprovider.NewAzureAccessTokenProvider(ctx, cfg, tokenAuth)
	return httpclient.NewProvider(httpclient.ProviderOptions{
		Middlewares: []httpclient.Middleware{
			tokenprovider.AuthMiddleware(tokenProvider),
		},
	})
}

func newHTTPClient(ctx context.Context, route azRoute, model datasourceInfo, cfg *setting.Cfg) (*http.Client, error) {
	model.HTTPCliOpts.Headers = route.Headers
	return httpCliProvider(ctx, route, model, cfg).New(model.HTTPCliOpts)
}
