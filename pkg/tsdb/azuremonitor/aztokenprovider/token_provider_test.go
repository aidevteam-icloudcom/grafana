package aztokenprovider

import (
	"context"
	"testing"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/azcredentials"
	"github.com/grafana/grafana/pkg/util/proxyutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var getAccessTokenFunc func(credential TokenRetriever, scopes []string)

type tokenCacheFake struct{}

func (c *tokenCacheFake) GetAccessToken(_ context.Context, credential TokenRetriever, scopes []string) (string, error) {
	getAccessTokenFunc(credential, scopes)
	return "4cb83b87-0ffb-4abd-82f6-48a8c08afc53", nil
}

func TestAzureTokenProvider_GetAccessToken(t *testing.T) {
	ctx := context.Background()

	cfg := &setting.Cfg{}

	scopes := []string{
		"https://management.azure.com/.default",
	}

	original := azureTokenCache
	azureTokenCache = &tokenCacheFake{}
	t.Cleanup(func() { azureTokenCache = original })

	t.Run("when managed identities enabled", func(t *testing.T) {
		cfg.Azure.ManagedIdentityEnabled = true
		cfg.Azure.UserIdentityEnabled = true

		t.Run("should resolve managed identity retriever if auth type is managed identity", func(t *testing.T) {
			credentials := &azcredentials.AzureManagedIdentityCredentials{}

			provider, err := NewAzureAccessTokenProvider(cfg, credentials)
			require.NoError(t, err)

			getAccessTokenFunc = func(credential TokenRetriever, scopes []string) {
				assert.IsType(t, &managedIdentityTokenRetriever{}, credential)
			}

			_, err = provider.GetAccessToken(ctx, scopes)
			require.NoError(t, err)
		})

		t.Run("should resolve user identity retriever if auth type is user identity", func(t *testing.T) {
			credentials := &azcredentials.AzureUserIdentityCredentials{}

			provider, err := NewAzureAccessTokenProvider(cfg, credentials)
			require.NoError(t, err)

			getAccessTokenFunc = func(credential TokenRetriever, scopes []string) {
				assert.IsType(t, &userIdentityTokenRetriever{}, credential)
			}

			_, err = provider.GetAccessToken(ctx, scopes)
			require.NoError(t, err)
		})

		t.Run("should resolve client secret retriever if auth type is client secret", func(t *testing.T) {
			credentials := &azcredentials.AzureClientSecretCredentials{}

			provider, err := NewAzureAccessTokenProvider(cfg, credentials)
			require.NoError(t, err)

			getAccessTokenFunc = func(credential TokenRetriever, scopes []string) {
				assert.IsType(t, &clientSecretTokenRetriever{}, credential)
			}

			_, err = provider.GetAccessToken(ctx, scopes)
			require.NoError(t, err)
		})
	})

	t.Run("when managed identities disabled", func(t *testing.T) {
		cfg.Azure.ManagedIdentityEnabled = false

		t.Run("should return error if auth type is managed identity", func(t *testing.T) {
			credentials := &azcredentials.AzureManagedIdentityCredentials{}

			_, err := NewAzureAccessTokenProvider(cfg, credentials)
			assert.Error(t, err, "managed identity authentication is not enabled in Grafana config")
		})
	})

	t.Run("when user identities disabled", func(t *testing.T) {
		cfg.Azure.UserIdentityEnabled = false

		t.Run("should return error if auth type is user identity", func(t *testing.T) {
			credentials := &azcredentials.AzureUserIdentityCredentials{}

			_, err := NewAzureAccessTokenProvider(cfg, credentials)
			assert.Error(t, err, "user identity authentication is not enabled in Grafana config")
		})
	})
}

func TestAzureTokenProvider_getClientSecretCredential(t *testing.T) {
	credentials := &azcredentials.AzureClientSecretCredentials{
		AzureCloud:   setting.AzurePublic,
		Authority:    "",
		TenantId:     "7dcf1d1a-4ec0-41f2-ac29-c1538a698bc4",
		ClientId:     "1af7c188-e5b6-4f96-81b8-911761bdd459",
		ClientSecret: "0416d95e-8af8-472c-aaa3-15c93c46080a",
	}

	t.Run("should return clientSecretTokenRetriever with values", func(t *testing.T) {
		result := getClientSecretTokenRetriever(credentials)
		assert.IsType(t, &clientSecretTokenRetriever{}, result)

		credential := (result).(*clientSecretTokenRetriever)

		assert.Equal(t, "https://login.microsoftonline.com/", credential.authority)
		assert.Equal(t, "7dcf1d1a-4ec0-41f2-ac29-c1538a698bc4", credential.tenantId)
		assert.Equal(t, "1af7c188-e5b6-4f96-81b8-911761bdd459", credential.clientId)
		assert.Equal(t, "0416d95e-8af8-472c-aaa3-15c93c46080a", credential.clientSecret)
	})

	t.Run("authority should selected based on cloud", func(t *testing.T) {
		originalCloud := credentials.AzureCloud
		defer func() { credentials.AzureCloud = originalCloud }()

		credentials.AzureCloud = setting.AzureChina

		result := getClientSecretTokenRetriever(credentials)
		assert.IsType(t, &clientSecretTokenRetriever{}, result)

		credential := (result).(*clientSecretTokenRetriever)

		assert.Equal(t, "https://login.chinacloudapi.cn/", credential.authority)
	})

	t.Run("explicitly set authority should have priority over cloud", func(t *testing.T) {
		originalCloud := credentials.AzureCloud
		defer func() { credentials.AzureCloud = originalCloud }()

		credentials.AzureCloud = setting.AzureChina
		credentials.Authority = "https://another.com/"

		result := getClientSecretTokenRetriever(credentials)
		assert.IsType(t, &clientSecretTokenRetriever{}, result)

		credential := (result).(*clientSecretTokenRetriever)

		assert.Equal(t, "https://another.com/", credential.authority)
	})
}

func TestAzureTokenProvider_GetUserIdAccessToken(t *testing.T) {
	cfg := &setting.Cfg{
		Azure: setting.AzureSettings{
			UserIdentityEnabled:       true,
			UserIdentityTokenEndpoint: "https://test.io",
			UserIdentityAuthHeader:    "Bear xxxxx",
		},
	}
	ctx := context.Background()
	scope := []string{"testresource/.default"}

	t.Run("return error if there is no signed in user", func(t *testing.T) {
		tokenRetriver := getUserIdentityTokenRetriever(cfg)
		assert.IsType(t, &userIdentityTokenRetriever{}, tokenRetriver)

		_, err := tokenRetriver.GetAccessToken(ctx, scope)
		assert.Error(t, err, "failed to get signed-in user")
	})

	t.Run("return error if there is empty signed in user", func(t *testing.T) {
		tokenRetriver := getUserIdentityTokenRetriever(cfg)
		assert.IsType(t, &userIdentityTokenRetriever{}, tokenRetriver)

		ctx = context.WithValue(ctx, proxyutil.ContextKeyLoginUser{}, "")
		_, err := tokenRetriver.GetAccessToken(ctx, scope)
		assert.Error(t, err, "empty signed-in userId")
	})

	t.Run("return emtpty cache key if there is no signed in user", func(t *testing.T) {
		tokenRetriver := getUserIdentityTokenRetriever(cfg)
		assert.IsType(t, &userIdentityTokenRetriever{}, tokenRetriver)

		cacheKey := tokenRetriver.GetCacheKey(ctx)
		assert.Equal(t, cacheKey, "", "failed to get empty cache key when there is no signed in user")
	})

	t.Run("return error if there is empty signed in user", func(t *testing.T) {
		tokenRetriver := getUserIdentityTokenRetriever(cfg)
		assert.IsType(t, &userIdentityTokenRetriever{}, tokenRetriver)

		ctx = context.WithValue(ctx, proxyutil.ContextKeyLoginUser{}, "")
		cacheKey := tokenRetriver.GetCacheKey(ctx)
		assert.Equal(t, cacheKey, "", "failed to get empty cache key when there is empty signed in user")
	})
}
