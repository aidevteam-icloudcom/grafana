package pluginproxy

import (
	"context"
	"strings"

	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/azcredentials"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/aztokenprovider"
)

type azureAccessTokenProvider struct {
	ctx           context.Context
	tokenProvider aztokenprovider.AzureTokenProvider
	scopes        []string
}

func newAzureAccessTokenProvider(ctx context.Context, cfg *setting.Cfg, authParams *plugins.JwtTokenAuth) (*azureAccessTokenProvider, error) {
	credentials := getAzureCredentials(cfg, authParams)
	tokenProvider, err := aztokenprovider.NewAzureAccessTokenProvider(cfg, credentials)
	if err != nil {
		return nil, err
	}
	return &azureAccessTokenProvider{
		ctx:           ctx,
		tokenProvider: tokenProvider,
		scopes:        authParams.Scopes,
	}, nil
}

func (provider *azureAccessTokenProvider) GetAccessToken() (string, error) {
	return provider.tokenProvider.GetAccessToken(provider.ctx, provider.scopes)
}

func getAzureCredentials(cfg *setting.Cfg, authParams *plugins.JwtTokenAuth) azcredentials.AzureCredentials {
	authType := strings.ToLower(authParams.Params["azure_auth_type"])
	clientId := authParams.Params["client_id"]

	// Type of authentication being determined by the following logic:
	// * If authType is set to 'msi' then user explicitly selected the managed identity authentication
	// * If authType isn't set but other fields are configured then it's a datasource which was configured
	//   before managed identities where introduced, therefore use client secret authentication
	// * If authType and other fields aren't set then it means the datasource never been configured
	//   and managed identity is the default authentication choice as long as managed identities are enabled
	isManagedIdentity := authType == "msi" || (authType == "" && clientId == "" && cfg.Azure.ManagedIdentityEnabled)
	isUserIdentity := authType == "userid" && cfg.Azure.UserIdentityEnabled

	if isManagedIdentity {
		return &azcredentials.AzureManagedIdentityCredentials{}
	} else if isUserIdentity {
		return &azcredentials.AzureUserIdentityCredentials{
			TokenEndpoint: cfg.Azure.UserIdentityTokenEndpoint,
			AuthHeader:    cfg.Azure.UserIdentityAuthHeader,
		}

	} else {
		return &azcredentials.AzureClientSecretCredentials{
			AzureCloud:   authParams.Params["azure_cloud"],
			Authority:    authParams.Url,
			TenantId:     authParams.Params["tenant_id"],
			ClientId:     authParams.Params["client_id"],
			ClientSecret: authParams.Params["client_secret"],
		}
	}
}
