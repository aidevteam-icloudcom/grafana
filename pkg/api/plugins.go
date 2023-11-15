package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/plugindef"
	"github.com/grafana/grafana/pkg/plugins/repo"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginaccesscontrol"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

// pluginsCDNFallbackRedirectRequests is a metric counter keeping track of how many
// requests are received on the plugins CDN backend redirect fallback handler.
var pluginsCDNFallbackRedirectRequests = promauto.NewCounterVec(prometheus.CounterOpts{
	Namespace: "grafana",
	Name:      "plugins_cdn_fallback_redirect_requests_total",
	Help:      "Number of requests to the plugins CDN backend redirect fallback handler.",
}, []string{"plugin_id", "plugin_version"})

var ErrUnexpectedFileExtension = errors.New("unexpected file extension")

func (hs *HTTPServer) GetPluginList(c *contextmodel.ReqContext) response.Response {
	typeFilter := c.Query("type")
	enabledFilter := c.Query("enabled")
	embeddedFilter := c.Query("embedded")
	// "" => no filter
	// "0" => filter out core plugins
	// "1" => filter out non-core plugins
	coreFilter := c.Query("core")

	// FIXME: while we don't have permissions for listing plugins we need this complex check:
	// When using access control, should be able to list non-core plugins:
	//  * anyone that can create a data source
	//  * anyone that can install a plugin
	// Fallback to only letting admins list non-core plugins
	reqOrgAdmin := ac.ReqHasRole(org.RoleAdmin)
	hasAccess := ac.HasAccess(hs.AccessControl, c)
	canListNonCorePlugins := reqOrgAdmin(c) || hasAccess(ac.EvalAny(
		ac.EvalPermission(datasources.ActionCreate),
		ac.EvalPermission(pluginaccesscontrol.ActionInstall),
	))

	pluginSettingsMap, err := hs.pluginSettings(c.Req.Context(), c.SignedInUser.GetOrgID())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get list of plugins", err)
	}

	// Filter plugins
	pluginDefinitions := hs.pluginStore.Plugins(c.Req.Context())
	filteredPluginDefinitions := []pluginstore.Plugin{}
	filteredPluginIDs := map[string]bool{}
	for _, pluginDef := range pluginDefinitions {
		// filter out app sub plugins
		if embeddedFilter == "0" && pluginDef.IncludedInAppID != "" {
			continue
		}

		// filter out core plugins
		if (coreFilter == "0" && pluginDef.IsCorePlugin()) || (coreFilter == "1" && !pluginDef.IsCorePlugin()) {
			continue
		}

		// FIXME: while we don't have permissions for listing plugins we need this complex check:
		// When using access control, should be able to list non-core plugins:
		//  * anyone that can create a data source
		//  * anyone that can install a plugin
		// Should be able to list this installed plugin:
		//  * anyone that can edit its settings
		if !pluginDef.IsCorePlugin() && !canListNonCorePlugins && !hasAccess(ac.EvalPermission(pluginaccesscontrol.ActionWrite, pluginaccesscontrol.ScopeProvider.GetResourceScope(pluginDef.ID))) {
			continue
		}

		// filter on type
		if typeFilter != "" && typeFilter != string(pluginDef.Type) {
			continue
		}

		if pluginDef.State == plugins.ReleaseStateAlpha && !hs.Cfg.PluginsEnableAlpha {
			continue
		}

		// filter out built in plugins
		if pluginDef.BuiltIn {
			continue
		}

		// filter out disabled plugins
		if pluginSetting, exists := pluginSettingsMap[pluginDef.ID]; exists {
			if enabledFilter == "1" && !pluginSetting.Enabled {
				continue
			}
		}

		filteredPluginDefinitions = append(filteredPluginDefinitions, pluginDef)
		filteredPluginIDs[pluginDef.ID] = true
	}

	// Compute metadata
	pluginsMetadata := hs.getMultiAccessControlMetadata(c, pluginaccesscontrol.ScopeProvider.GetResourceScope(""), filteredPluginIDs)

	// Prepare DTO
	result := make(dtos.PluginList, 0)
	for _, pluginDef := range filteredPluginDefinitions {
		listItem := dtos.PluginListItem{
			Id:              pluginDef.ID,
			Name:            pluginDef.Name,
			Type:            string(pluginDef.Type),
			Category:        pluginDef.Category,
			Info:            pluginDef.Info,
			Dependencies:    pluginDef.Dependencies,
			DefaultNavUrl:   path.Join(hs.Cfg.AppSubURL, pluginDef.DefaultNavURL),
			State:           pluginDef.State,
			Signature:       pluginDef.Signature,
			SignatureType:   pluginDef.SignatureType,
			SignatureOrg:    pluginDef.SignatureOrg,
			AccessControl:   pluginsMetadata[pluginDef.ID],
			AngularDetected: pluginDef.Angular.Detected,
		}

		update, exists := hs.pluginsUpdateChecker.HasUpdate(c.Req.Context(), pluginDef.ID)
		if exists {
			listItem.LatestVersion = update
			listItem.HasUpdate = true
		}

		if pluginSetting, exists := pluginSettingsMap[pluginDef.ID]; exists {
			listItem.Enabled = pluginSetting.Enabled
			listItem.Pinned = pluginSetting.Pinned
		}

		if listItem.DefaultNavUrl == "" || !listItem.Enabled {
			listItem.DefaultNavUrl = hs.Cfg.AppSubURL + "/plugins/" + listItem.Id + "/"
		}

		result = append(result, listItem)
	}

	sort.Sort(result)
	return response.JSON(http.StatusOK, result)
}

func (hs *HTTPServer) GetPluginSettingByID(c *contextmodel.ReqContext) response.Response {
	pluginID := web.Params(c.Req)[":pluginId"]

	plugin, exists := hs.pluginStore.Plugin(c.Req.Context(), pluginID)
	if !exists {
		return response.Error(http.StatusNotFound, "Plugin not found, no installed plugin with that id", nil)
	}

	// In a first iteration, we only have one permission for app plugins.
	// We will need a different permission to allow users to configure the plugin without needing access to it.
	if plugin.IsApp() {
		hasAccess := ac.HasAccess(hs.AccessControl, c)
		if !hasAccess(ac.EvalPermission(pluginaccesscontrol.ActionAppAccess, pluginaccesscontrol.ScopeProvider.GetResourceScope(plugin.ID))) {
			return response.Error(http.StatusForbidden, "Access Denied", nil)
		}
	}

	dto := &dtos.PluginSetting{
		Type:             string(plugin.Type),
		Id:               plugin.ID,
		Name:             plugin.Name,
		Info:             plugin.Info,
		Dependencies:     plugin.Dependencies,
		Includes:         plugin.Includes,
		BaseUrl:          plugin.BaseURL,
		Module:           plugin.Module,
		DefaultNavUrl:    path.Join(hs.Cfg.AppSubURL, plugin.DefaultNavURL),
		State:            plugin.State,
		Signature:        plugin.Signature,
		SignatureType:    plugin.SignatureType,
		SignatureOrg:     plugin.SignatureOrg,
		SecureJsonFields: map[string]bool{},
		AngularDetected:  plugin.Angular.Detected,
	}

	if plugin.IsApp() {
		dto.Enabled = plugin.AutoEnabled
		dto.Pinned = plugin.AutoEnabled
	}

	ps, err := hs.PluginSettings.GetPluginSettingByPluginID(c.Req.Context(), &pluginsettings.GetByPluginIDArgs{
		PluginID: pluginID,
		OrgID:    c.SignedInUser.GetOrgID(),
	})
	if err != nil {
		if !errors.Is(err, pluginsettings.ErrPluginSettingNotFound) {
			return response.Error(http.StatusInternalServerError, "Failed to get plugin settings", nil)
		}
	} else {
		dto.Enabled = ps.Enabled
		dto.Pinned = ps.Pinned
		dto.JsonData = ps.JSONData

		for k, v := range hs.PluginSettings.DecryptedValues(ps) {
			if len(v) > 0 {
				dto.SecureJsonFields[k] = true
			}
		}
	}

	update, exists := hs.pluginsUpdateChecker.HasUpdate(c.Req.Context(), plugin.ID)
	if exists {
		dto.LatestVersion = update
		dto.HasUpdate = true
	}

	return response.JSON(http.StatusOK, dto)
}

func (hs *HTTPServer) UpdatePluginSetting(c *contextmodel.ReqContext) response.Response {
	cmd := pluginsettings.UpdatePluginSettingCmd{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	pluginID := web.Params(c.Req)[":pluginId"]

	if _, exists := hs.pluginStore.Plugin(c.Req.Context(), pluginID); !exists {
		return response.Error(404, "Plugin not installed", nil)
	}

	cmd.OrgId = c.SignedInUser.GetOrgID()
	cmd.PluginId = pluginID
	if err := hs.PluginSettings.UpdatePluginSetting(c.Req.Context(), &pluginsettings.UpdateArgs{
		Enabled:                 cmd.Enabled,
		Pinned:                  cmd.Pinned,
		JSONData:                cmd.JsonData,
		SecureJSONData:          cmd.SecureJsonData,
		PluginVersion:           cmd.PluginVersion,
		PluginID:                cmd.PluginId,
		OrgID:                   cmd.OrgId,
		EncryptedSecureJSONData: cmd.EncryptedSecureJsonData,
	}); err != nil {
		return response.Error(500, "Failed to update plugin setting", err)
	}

	hs.pluginContextProvider.InvalidateSettingsCache(c.Req.Context(), pluginID)

	return response.Success("Plugin settings updated")
}

func (hs *HTTPServer) GetPluginMarkdown(c *contextmodel.ReqContext) response.Response {
	pluginID := web.Params(c.Req)[":pluginId"]
	name := web.Params(c.Req)[":name"]

	content, err := hs.pluginMarkdown(c.Req.Context(), pluginID, name)
	if err != nil {
		var notFound plugins.NotFoundError
		if errors.As(err, &notFound) {
			return response.Error(http.StatusNotFound, notFound.Error(), nil)
		}

		return response.Error(http.StatusInternalServerError, "Could not get markdown file", err)
	}

	// fallback try readme
	if len(content) == 0 {
		content, err = hs.pluginMarkdown(c.Req.Context(), pluginID, "readme")
		if err != nil {
			if errors.Is(err, plugins.ErrFileNotExist) {
				return response.Error(http.StatusNotFound, plugins.ErrFileNotExist.Error(), nil)
			}
			return response.Error(http.StatusNotImplemented, "Could not get markdown file", err)
		}
	}

	resp := response.Respond(http.StatusOK, content)
	resp.SetHeader("Content-Type", "text/plain; charset=utf-8")
	return resp
}

// CollectPluginMetrics collect metrics from a plugin.
//
// /api/plugins/:pluginId/metrics
func (hs *HTTPServer) CollectPluginMetrics(c *contextmodel.ReqContext) response.Response {
	pluginID := web.Params(c.Req)[":pluginId"]
	resp, err := hs.pluginClient.CollectMetrics(c.Req.Context(), &backend.CollectMetricsRequest{PluginContext: backend.PluginContext{PluginID: pluginID}})
	if err != nil {
		return translatePluginRequestErrorToAPIError(err)
	}

	headers := make(http.Header)
	headers.Set("Content-Type", "text/plain")

	return response.CreateNormalResponse(headers, resp.PrometheusMetrics, http.StatusOK)
}

// getPluginAssets returns public plugin assets (images, JS, etc.)
//
// If the plugin has cdn = false in its config (default), it will always attempt to return the asset
// from the local filesystem.
//
// If the plugin has cdn = true and hs.Cfg.PluginsCDNURLTemplate is empty, it will get the file
// from the local filesystem. If hs.Cfg.PluginsCDNURLTemplate is not empty,
// this handler returns a redirect to the plugin asset file on the specified CDN.
//
// /public/plugins/:pluginId/*
func (hs *HTTPServer) getPluginAssets(c *contextmodel.ReqContext) {
	pluginID := web.Params(c.Req)[":pluginId"]
	plugin, exists := hs.pluginStore.Plugin(c.Req.Context(), pluginID)
	if !exists {
		c.JsonApiErr(404, "Plugin not found", nil)
		return
	}

	// prepend slash for cleaning relative paths
	requestedFile, err := util.CleanRelativePath(web.Params(c.Req)["*"])
	if err != nil {
		// slash is prepended above therefore this is not expected to fail
		c.JsonApiErr(500, "Failed to clean relative file path", err)
		return
	}

	if hs.pluginsCDNService.PluginSupported(pluginID) {
		// Send a redirect to the client
		hs.redirectCDNPluginAsset(c, plugin, requestedFile)
		return
	}

	// Send the actual file to the client from local filesystem
	hs.serveLocalPluginAsset(c, plugin, requestedFile)
}

// serveLocalPluginAsset returns the content of a plugin asset file from the local filesystem to the http client.
func (hs *HTTPServer) serveLocalPluginAsset(c *contextmodel.ReqContext, plugin pluginstore.Plugin, assetPath string) {
	f, err := hs.pluginFileStore.File(c.Req.Context(), plugin.ID, assetPath)
	if err != nil {
		if errors.Is(err, plugins.ErrFileNotExist) {
			c.JsonApiErr(404, "Plugin file not found", nil)
			return
		}
		c.JsonApiErr(500, "Could not open plugin file", err)
		return
	}

	if hs.Cfg.Env == setting.Dev {
		c.Resp.Header().Set("Cache-Control", "max-age=0, must-revalidate, no-cache")
	} else {
		c.Resp.Header().Set("Cache-Control", "public, max-age=3600")
	}

	http.ServeContent(c.Resp, c.Req, assetPath, f.ModTime, bytes.NewReader(f.Content))
}

// redirectCDNPluginAsset redirects the http request to specified asset path on the configured plugins CDN.
func (hs *HTTPServer) redirectCDNPluginAsset(c *contextmodel.ReqContext, plugin pluginstore.Plugin, assetPath string) {
	remoteURL, err := hs.pluginsCDNService.AssetURL(plugin.ID, plugin.Info.Version, assetPath)
	if err != nil {
		c.JsonApiErr(500, "Failed to get CDN plugin asset remote URL", err)
		return
	}
	hs.log.Warn(
		"plugin cdn redirect hit",
		"pluginID", plugin.ID,
		"pluginVersion", plugin.Info.Version,
		"assetPath", assetPath,
		"remoteURL", remoteURL,
		"referer", c.Req.Referer(),
		"user", c.Login,
	)
	pluginsCDNFallbackRedirectRequests.With(prometheus.Labels{
		"plugin_id":      plugin.ID,
		"plugin_version": plugin.Info.Version,
	}).Inc()
	http.Redirect(c.Resp, c.Req, remoteURL, http.StatusTemporaryRedirect)
}

// CheckHealth returns the health of a plugin.
// /api/plugins/:pluginId/health
func (hs *HTTPServer) CheckHealth(c *contextmodel.ReqContext) response.Response {
	pluginID := web.Params(c.Req)[":pluginId"]
	pCtx, err := hs.pluginContextProvider.Get(c.Req.Context(), pluginID, c.SignedInUser, c.SignedInUser.GetOrgID())
	if err != nil {
		return response.ErrOrFallback(http.StatusInternalServerError, "Failed to get plugin settings", err)
	}
	resp, err := hs.pluginClient.CheckHealth(c.Req.Context(), &backend.CheckHealthRequest{
		PluginContext: pCtx,
		Headers:       map[string]string{},
	})
	if err != nil {
		return translatePluginRequestErrorToAPIError(err)
	}

	payload := map[string]any{
		"status":  resp.Status.String(),
		"message": resp.Message,
	}

	// Unmarshal JSONDetails if it's not empty.
	if len(resp.JSONDetails) > 0 {
		var jsonDetails map[string]any
		err = json.Unmarshal(resp.JSONDetails, &jsonDetails)
		if err != nil {
			return response.Error(http.StatusInternalServerError, "Failed to unmarshal detailed response from backend plugin", err)
		}

		payload["details"] = jsonDetails
	}

	if resp.Status != backend.HealthStatusOk {
		return response.JSON(http.StatusBadRequest, payload)
	}

	return response.JSON(http.StatusOK, payload)
}

func (hs *HTTPServer) GetPluginErrorsList(c *contextmodel.ReqContext) response.Response {
	return response.JSON(http.StatusOK, hs.pluginErrorResolver.PluginErrors(c.Req.Context()))
}

func (hs *HTTPServer) InstallPlugin(c *contextmodel.ReqContext) response.Response {
	dto := dtos.InstallPluginCommand{}
	if err := web.Bind(c.Req, &dto); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}
	pluginID := web.Params(c.Req)[":pluginId"]

	jsonBody, err := hs.pluginJSON(c.Req.Context(), pluginID, dto.Version)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to fetch plugin json", err)
	}
	jsonData := struct {
		ExternalServiceRegistration *plugindef.ExternalServiceRegistration `json:"externalServiceRegistration"`
	}{}
	err = json.Unmarshal(jsonBody, &jsonData)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to read plugin json", err)
	}
	if jsonData.ExternalServiceRegistration != nil {
		hs.log.Info("plugin will to register an external service")
		hasAccess := accesscontrol.HasGlobalAccess(hs.AccessControl, hs.accesscontrolService, c)
		if !hasAccess(toEvalAll(jsonData.ExternalServiceRegistration.Permissions)) {
			return response.Error(http.StatusForbidden, "installer does not have the permission requested by the plugin", err)
		}
	}

	compatOpts := plugins.NewCompatOpts(hs.Cfg.BuildVersion, runtime.GOOS, runtime.GOARCH)
	err = hs.pluginInstaller.Add(c.Req.Context(), pluginID, dto.Version, compatOpts)
	if err != nil {
		var dupeErr plugins.DuplicateError
		if errors.As(err, &dupeErr) {
			return response.Error(http.StatusConflict, "Plugin already installed", err)
		}
		var versionUnsupportedErr repo.ErrVersionUnsupported
		if errors.As(err, &versionUnsupportedErr) {
			return response.Error(http.StatusConflict, "Plugin version not supported", err)
		}
		var versionNotFoundErr repo.ErrVersionNotFound
		if errors.As(err, &versionNotFoundErr) {
			return response.Error(http.StatusNotFound, "Plugin version not found", err)
		}
		var clientError repo.ErrResponse4xx
		if errors.As(err, &clientError) {
			return response.Error(clientError.StatusCode(), clientError.Message(), err)
		}
		if errors.Is(err, plugins.ErrInstallCorePlugin) {
			return response.Error(http.StatusForbidden, "Cannot install or change a Core plugin", err)
		}
		var archError repo.ErrArcNotFound
		if errors.As(err, &archError) {
			return response.Error(http.StatusNotFound, archError.Error(), nil)
		}

		return response.Error(http.StatusInternalServerError, "Failed to install plugin", err)
	}

	return response.JSON(http.StatusOK, []byte{})
}

func (hs *HTTPServer) UninstallPlugin(c *contextmodel.ReqContext) response.Response {
	pluginID := web.Params(c.Req)[":pluginId"]

	err := hs.pluginInstaller.Remove(c.Req.Context(), pluginID)
	if err != nil {
		if errors.Is(err, plugins.ErrPluginNotInstalled) {
			return response.Error(http.StatusNotFound, "Plugin not installed", err)
		}
		if errors.Is(err, plugins.ErrUninstallCorePlugin) {
			return response.Error(http.StatusForbidden, "Cannot uninstall a Core plugin", err)
		}
		return response.Error(http.StatusInternalServerError, "Failed to uninstall plugin", err)
	}
	return response.JSON(http.StatusOK, []byte{})
}

func translatePluginRequestErrorToAPIError(err error) response.Response {
	return response.ErrOrFallback(http.StatusInternalServerError, "Plugin request failed", err)
}

func (hs *HTTPServer) pluginMarkdown(ctx context.Context, pluginID string, name string) ([]byte, error) {
	file, err := mdFilepath(strings.ToUpper(name))
	if err != nil {
		return make([]byte, 0), err
	}

	md, err := hs.pluginFileStore.File(ctx, pluginID, file)
	if err != nil {
		if errors.Is(err, plugins.ErrPluginNotInstalled) {
			return make([]byte, 0), plugins.NotFoundError{PluginID: pluginID}
		}

		md, err = hs.pluginFileStore.File(ctx, pluginID, strings.ToLower(file))
		if err != nil {
			return make([]byte, 0), nil
		}
	}
	return md.Content, nil
}

func (hs *HTTPServer) pluginJSON(ctx context.Context, pluginID, version string) ([]byte, error) {
	client := &http.Client{
		Timeout:   time.Second * 10,
		Transport: &http.Transport{Proxy: http.ProxyFromEnvironment},
	}
	path := hs.Cfg.GrafanaComAPIURL + "/plugins/" + pluginID
	if version != "" {
		path = path + "versions/" + version
	}

	req, err := http.NewRequest(http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	defer func() {
		if err := resp.Body.Close(); err != nil {
			hs.log.Warn("Failed to close response body", "err", err)
		}
	}()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid status %v", resp.Status)
	}
	data, err := io.ReadAll(resp.Body)
	data = fakePluginJson

	return data, err

}

func toEvalAll(ps []plugindef.Permission) ac.Evaluator {
	if len(ps) == 0 {
		return nil
	}
	res := []ac.Evaluator{}
	for _, p := range ps {
		scope := ""
		if p.Scope != nil {
			scope = *p.Scope
		}
		res = append(res, ac.EvalPermission(p.Action, scope))
	}
	return ac.EvalAll(res...)
}

func mdFilepath(mdFilename string) (string, error) {
	fileExt := filepath.Ext(mdFilename)
	switch fileExt {
	case "md":
		return util.CleanRelativePath(mdFilename)
	case "":
		return util.CleanRelativePath(fmt.Sprintf("%s.md", mdFilename))
	default:
		return "", ErrUnexpectedFileExtension
	}
}

var fakePluginJson = []byte(`{
  "status": "active",
  "id": 778,
  "typeId": 1,
  "typeName": "Application",
  "typeCode": "app",
  "slug": "aws-datasource-provisioner-app",
  "name": "AWS Data Sources",
  "description": "AWS Datasource Provisioner",
  "version": "1.13.1",
  "versionStatus": "active",
  "versionSignatureType": "grafana",
  "versionSignedByOrg": "grafana",
  "versionSignedByOrgName": "Grafana Labs",
  "userId": 0,
  "orgId": 321556,
  "orgName": "Amazon Web Services",
  "orgSlug": "aws",
  "orgUrl": "",
  "url": "https://github.com/grafana/aws-datasource-provisioner-app/",
  "createdAt": "2022-01-31T17:33:37.000Z",
  "updatedAt": "2023-10-25T20:21:25.000Z",
  "json": {
    "backend": true,
    "dependencies": {
      "grafanaDependency": ">=7.3.0",
      "grafanaVersion": ">=7.3.0"
    },
    "executable": "gpx_AWS_Datasource_Provisioner",
    "id": "aws-datasource-provisioner-app",
    "includes": [
      {
        "addToNav": true,
        "defaultNav": true,
        "icon": "cube",
        "name": "AWS services",
        "path": "/a/aws-datasource-provisioner-app/?tab=services",
        "role": "Admin",
        "type": "page"
      },
      {
        "addToNav": true,
        "icon": "database",
        "name": "Data sources",
        "path": "/a/aws-datasource-provisioner-app/?tab=datasources",
        "role": "Admin",
        "type": "page"
      },
      {
        "addToNav": true,
        "icon": "sliders-v-alt",
        "name": "Settings",
        "path": "/a/aws-datasource-provisioner-app/?tab=settings",
        "role": "Admin",
        "type": "page"
      }
    ],
    "info": {
      "author": {
        "name": "Grafana Labs",
        "url": "https://grafana.com/"
      },
      "build": {
        "time": 1698220907343,
        "repo": "https://github.com/grafana/aws-datasource-provisioner-app",
        "branch": "master",
        "hash": "22a0b787bcf9c38ba5df2fd17c9103dbe149738e",
        "build": 507
      },
      "description": "AWS Datasource Provisioner",
      "links": [],
      "logos": {
        "large": "assets/logo-large.svg",
        "small": "assets/logo-small.svg"
      },
      "updated": "2023-10-25",
      "version": "1.13.1"
    },
    "name": "AWS Data Sources",
    "role": "",
    "routes": [],
    "type": "app"
  },
  "readme": "<h2>AWS Data Sources Plugin</h2>\n<p>The AWS Data Sources plugin allows you to create data sources for all AWS services with Grafana plugins.</p>\n<p>Read more about it <a href=\"https://docs.aws.amazon.com/grafana/latest/userguide/AMG-data-sources.html\" target=\"_blank\" rel=\"noopener nofollow\">here</a>.</p>\n",
  "changelog": "<h1>Changelog</h1>\n<h2>v1.13.1 (2023-10-24)</h2>\n<ul>\n<li><strong>Chore</strong> Support Node 18 https://github.com/grafana/aws-datasource-provisioner-app/pull/164</li>\n<li><strong>Fix</strong> Fix Install Now host url https://github.com/grafana/aws-datasource-provisioner-app/pull/166</li>\n</ul>\n<h2>v1.13.0 (2023-08-18)</h2>\n<ul>\n<li><strong>Feature</strong> Adds the ability to provision a Redshift Serverless datasource by @yota-p https://github.com/grafana/aws-datasource-provisioner-app/pull/162</li>\n</ul>\n<h2>v1.12.0 (2023-07-12)</h2>\n<ul>\n<li><strong>Feature</strong> Add monitoring flags to cloudwatch accounts https://github.com/grafana/aws-datasource-provisioner-app/pull/158 (note requires additional OAM permissions to work, documented in contributing.md)</li>\n<li><strong>Feature</strong> OpenSearch: auto detect version https://github.com/grafana/aws-datasource-provisioner-app/pull/156</li>\n</ul>\n<h2>v1.11.0 (2023-05-17)</h2>\n<ul>\n<li><strong>Fix</strong> Bump aws-sdk-go to fix issue with regions https://github.com/grafana/aws-datasource-provisioner-app/pull/148</li>\n</ul>\n<h2>v1.10.0 (2023-01-26)</h2>\n<ul>\n<li><strong>Feature</strong> Add ability to provision an OpenSearch Serverless data source https://github.com/grafana/aws-datasource-provisioner-app/pull/139</li>\n</ul>\n<h2>v1.9.0 (2022-12-07)</h2>\n<ul>\n<li><strong>Feature</strong> Add new open search versions in https://github.com/grafana/aws-datasource-provisioner-app/pull/132</li>\n<li><strong>Fix</strong> Fix regionId used while fetching resources for multiple regions and no accountIds in https://github.com/grafana/aws-datasource-provisioner-app/pull/130</li>\n<li><strong>Fix</strong> TwinMaker: Fix multiple workspaces resource listing in https://github.com/grafana/aws-datasource-provisioner-app/pull/128</li>\n<li><strong>Chore</strong> Change twinMakerInfo to pointer, add test for resource handler in https://github.com/grafana/aws-datasource-provisioner-app/pull/127</li>\n<li><strong>Feature</strong> Add TwinMaker info box in https://github.com/grafana/aws-datasource-provisioner-app/pull/125</li>\n<li><strong>Feature</strong>: Add support for TwinMaker in https://github.com/grafana/aws-datasource-provisioner-app/pull/122</li>\n</ul>\n<h2>v1.8.0 (2022-07-21)</h2>\n<ul>\n<li><strong>Chore</strong> Use aws/aws-sdk-go instead of Grafana internal repo by @fridgepoet in https://github.com/grafana/aws-datasource-provisioner-app/pull/119</li>\n<li><strong>Chore</strong> Paginate calls to DescribeElasticsearchDomains (#118) by @joanlopez in https://github.com/grafana/aws-datasource-provisioner-app/pull/121</li>\n</ul>\n<h2>v1.7.1 (2022-05-06)</h2>\n<ul>\n<li><strong>UI</strong>: Surface AWS SDK errors to UI as warning messages (#114).</li>\n</ul>\n<h2>v1.7.0 (2022-01-31)</h2>\n<ul>\n<li><strong>Chore</strong>: Update Grafana SDK (JS/Go) dependencies.</li>\n</ul>\n<h2>v1.6.1 (2022-01-25)</h2>\n<ul>\n<li><strong>Bug fixes</strong>: Fix account id and name mapping when listing resources.</li>\n</ul>\n<h2>v1.6.0 (2022-01-14)</h2>\n<ul>\n<li><strong>Bug fixes</strong>: Use the default credentials when listing non-flat resources for the account that owns the workspace.</li>\n</ul>\n<h2>v1.5.0 (2021-10-29)</h2>\n<ul>\n<li><strong>Athena</strong>: Support for provisioning Athena data sources.</li>\n<li><strong>Redshift</strong>: Support for provisioning Redshift data sources.</li>\n</ul>\n<h2>v1.4.1 (2021-10-11)</h2>\n<ul>\n<li><strong>OpenSearch</strong>: Fix datasource provisioning when version is autodetected.</li>\n</ul>\n<h2>v1.4.0 (2021-10-08)</h2>\n<ul>\n<li><strong>OpenSearch</strong>: Fix detected Elasticsearch version when migrating from OpenDistro or Elasticsearch datasource.</li>\n<li><strong>OpenSearch</strong>: Autodetect Elasticsearch and OpenSearch versions when provisioning OpenSearch datasources.</li>\n</ul>\n<h2>v1.3.0 (2021-07-27)</h2>\n<ul>\n<li><strong>OpenSearch</strong>: Multiple changes introduced into the migration dialogue box and the underlying logics.</li>\n<li><strong>OpenSearch</strong>: Replaced <code>grafana-es-open-distro-datasource</code> plugin support in favor of <code>grafana-opensearch-datasource</code>.</li>\n<li><strong>Bug fixes</strong>: Minor UI fixes.</li>\n</ul>\n<h2>v1.2.0 (2021-03-30)</h2>\n<ul>\n<li><strong>Open Distro</strong>: Multiple changes introduced into the migration dialogue box and the underlying logics.</li>\n<li><strong>Amazon Web Services</strong>: The <code>default</code> auth type has been replaced with the new <code>ec2_iam_role</code> type.</li>\n<li><strong>Amazon Web Services</strong>: The name of some services has been updated (e.g. Amazon Managed Service for Prometheus).</li>\n<li><strong>Assets</strong>: Set up different service icons based on the Grafana theme (dark vs light).</li>\n<li><strong>Bug fixes</strong>: Minor UI fixes with the light theme.</li>\n</ul>\n<h2>v1.1.0 (2021-03-23)</h2>\n<ul>\n<li><strong>Open Distro</strong>: Support for provisioning Open Distro data sources and migrating the old ones.</li>\n<li><strong>Bug fixes</strong>: Minor bug fixes on navigation and provisioning.</li>\n</ul>\n<h2>v1.0.0 (2020-12-21)</h2>\n<ul>\n<li><strong>Amazon Web Services</strong>: Support for single accounts and organizational accounts.</li>\n<li><strong>Provisioning</strong>: Support for CloudWatch, IoT SiteWise, Timestream, X-Ray, Elasticsearch and Prometheus.</li>\n<li><strong>Settings</strong>: Bulk settings for CloudWatch (custom metrics) and Prometheus (scrape interval, query timeout).</li>\n</ul>\n",
  "statusContext": "",
  "downloads": 545916,
  "verified": false,
  "featured": 0,
  "internal": false,
  "downloadSlug": "aws-datasource-provisioner-app",
  "popularity": 0.0152,
  "signatureType": "private",
  "grafanaDependency": ">=7.3.0",
  "packages": {
    "linux-amd64": {
      "md5": "fd9468e3fd9a964322650430aaac6050",
      "sha256": "65abeeb102221c3a497aec10ae6ccefa17635ad722b1c60ec869dc3ffc1cb2c5",
      "packageName": "linux-amd64",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=linux&arch=amd64"
    },
    "linux-arm64": {
      "md5": "9d6e2193de83c29854fe26e1eed859bf",
      "sha256": "720c08350097a52406de93cc0cf57b783a4a41fa55db019d92b581cc295d733a",
      "packageName": "linux-arm64",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=linux&arch=arm64"
    },
    "linux-arm": {
      "md5": "d83d98e51fa63718aa549a4a5fd85d4e",
      "sha256": "2c6929255f84d77c8bfe4c9d88689323f0130efeddff4d3f4389b573783afbf7",
      "packageName": "linux-arm",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=linux&arch=arm"
    },
    "windows-amd64": {
      "md5": "02a004c9984f13973e6ba4614d192b21",
      "sha256": "02f0e91787ccb622d83fc6ccd3fd940588aa200bca453ad01fe4214e3fecb593",
      "packageName": "windows-amd64",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=windows&arch=amd64"
    },
    "darwin-amd64": {
      "md5": "ff14dfa152b8c8a09716e34e32852227",
      "sha256": "7329971c1080946c8aa972ca8d6761b3264adc22b446e21756c58500cbc324a5",
      "packageName": "darwin-amd64",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=darwin&arch=amd64"
    },
    "darwin-arm64": {
      "md5": "261afe827d2edec12e0fe6bd93353900",
      "sha256": "2d427d4204c56783dfab25d69e1b12ce0861aa40381245ce6a018df2552032cf",
      "packageName": "darwin-arm64",
      "downloadUrl": "/api/plugins/aws-datasource-provisioner-app/versions/1.13.1/download?os=darwin&arch=arm64"
    }
  },
  "externalServiceRegistration": {
    "permissions": [{"action": "users:read", "scope": "org.users:*"}]
  },
  "links": [
    {
      "rel": "self",
      "href": "/plugins/aws-datasource-provisioner-app"
    },
    {
      "rel": "versions",
      "href": "/plugins/aws-datasource-provisioner-app/versions"
    },
    {
      "rel": "latest",
      "href": "/plugins/aws-datasource-provisioner-app/versions/1.13.1"
    },
    {
      "rel": "download",
      "href": "/plugins/aws-datasource-provisioner-app/versions/1.13.1/download"
    }
  ],
  "angularDetected": false
}
`)
