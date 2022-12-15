package azuremonitor

import (
	"fmt"

	"github.com/grafana/grafana-azure-sdk-go/azcredentials"
	"github.com/grafana/grafana-azure-sdk-go/azsettings"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/setting"
)

// Azure cloud names specific to Azure Monitor
const (
	azureMonitorPublic       = "azuremonitor"
	azureMonitorChina        = "chinaazuremonitor"
	azureMonitorUSGovernment = "govazuremonitor"
	azureMonitorGermany      = "germanyazuremonitor"
	azureMonitorCustomized   = "customizedazuremonitor"
)

func getAuthType(cfg *setting.Cfg, jsonData *simplejson.Json) string {
	if azureAuthType := jsonData.Get("azureAuthType").MustString(); azureAuthType != "" {
		return azureAuthType
	} else {
		tenantId := jsonData.Get("tenantId").MustString()
		clientId := jsonData.Get("clientId").MustString()

		// If authentication type isn't explicitly specified and datasource has client credentials,
		// then this is existing datasource which is configured for app registration (client secret)
		if tenantId != "" && clientId != "" {
			return azcredentials.AzureAuthClientSecret
		}

		// For newly created datasource with no configuration, managed identity is the default authentication type
		// if they are enabled in Grafana config
		if cfg.Azure.ManagedIdentityEnabled {
			return azcredentials.AzureAuthManagedIdentity
		} else {
			return azcredentials.AzureAuthClientSecret
		}
	}
}

func getDefaultAzureCloud(cfg *setting.Cfg) string {
	// Allow only known cloud names
	cloudName := ""
	if cfg != nil && cfg.Azure != nil {
		cloudName = cfg.Azure.Cloud
	}
	switch cloudName {
	case azsettings.AzurePublic:
		return azsettings.AzurePublic
	case azsettings.AzureChina:
		return azsettings.AzureChina
	case azsettings.AzureUSGovernment:
		return azsettings.AzureUSGovernment
	case "":
		// Not set cloud defaults to public
		return azsettings.AzurePublic
	default:
		return cloudName
	}
}

func normalizeAzureCloud(cloudName string) string {
	switch cloudName {
	case azureMonitorPublic:
		return azsettings.AzurePublic
	case azureMonitorChina:
		return azsettings.AzureChina
	case azureMonitorUSGovernment:
		return azsettings.AzureUSGovernment
	default:
		return cloudName
	}
}

func getAzureCloud(cfg *setting.Cfg, jsonData *simplejson.Json) (string, error) {
	authType := getAuthType(cfg, jsonData)
	switch authType {
	case azcredentials.AzureAuthManagedIdentity:
		// In case of managed identity, the cloud is always same as where Grafana is hosted
		return getDefaultAzureCloud(cfg), nil
	case azcredentials.AzureAuthClientSecret:
		if cloud := jsonData.Get("cloudName").MustString(); cloud != "" {
			return normalizeAzureCloud(cloud), nil
		} else {
			return getDefaultAzureCloud(cfg), nil
		}
	default:
		err := fmt.Errorf("the authentication type '%s' not supported", authType)
		return "", err
	}
}

func getAzureCredentials(cfg *setting.Cfg, jsonData *simplejson.Json, secureJsonData map[string]string) (azcredentials.AzureCredentials, error) {
	authType := getAuthType(cfg, jsonData)

	switch authType {
	case azcredentials.AzureAuthManagedIdentity:
		credentials := &azcredentials.AzureManagedIdentityCredentials{}
		return credentials, nil

	case azcredentials.AzureAuthClientSecret:
		cloud, err := getAzureCloud(cfg, jsonData)
		if err != nil {
			return nil, err
		}
		if secureJsonData["clientSecret"] == "" {
			return nil, fmt.Errorf("unable to instantiate credentials, clientSecret must be set")
		}
		credentials := &azcredentials.AzureClientSecretCredentials{
			AzureCloud:   cloud,
			TenantId:     jsonData.Get("tenantId").MustString(),
			ClientId:     jsonData.Get("clientId").MustString(),
			ClientSecret: secureJsonData["clientSecret"],
		}
		return credentials, nil

	default:
		err := fmt.Errorf("the authentication type '%s' not supported", authType)
		return nil, err
	}
}
