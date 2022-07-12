// This file is autogenerated. DO NOT EDIT.
//
// Run "make gen-cue" from repository root to regenerate.
//
// Derived from the Thema lineage at pkg/coremodel/pluginmeta

package pluginmeta

import (
	"embed"
	"path/filepath"

	"github.com/grafana/grafana/pkg/cuectx"
	"github.com/grafana/grafana/pkg/framework/coremodel"
	"github.com/grafana/thema"
)

// Defines values for PluginmetaCategory.
const (
	ModelCategoryCloud ModelCategory = "cloud"

	ModelCategoryEnterprise ModelCategory = "enterprise"

	ModelCategoryLogging ModelCategory = "logging"

	ModelCategoryOther ModelCategory = "other"

	ModelCategorySql ModelCategory = "sql"

	ModelCategoryTracing ModelCategory = "tracing"

	ModelCategoryTsdb ModelCategory = "tsdb"
)

// Defines values for PluginmetaDependenciesPluginsType.
const (
	ModelDependenciesPluginsTypeApp ModelDependenciesPluginsType = "app"

	ModelDependenciesPluginsTypeDatasource ModelDependenciesPluginsType = "datasource"

	ModelDependenciesPluginsTypePanel ModelDependenciesPluginsType = "panel"
)

// Defines values for PluginmetaIncludesRole.
const (
	ModelIncludesRoleAdmin ModelIncludesRole = "Admin"

	ModelIncludesRoleEditor ModelIncludesRole = "Editor"

	ModelIncludesRoleViewer ModelIncludesRole = "Viewer"
)

// Defines values for PluginmetaIncludesType.
const (
	ModelIncludesTypeDashboard ModelIncludesType = "dashboard"

	ModelIncludesTypeDatasource ModelIncludesType = "datasource"

	ModelIncludesTypePage ModelIncludesType = "page"

	ModelIncludesTypePanel ModelIncludesType = "panel"
)

// Defines values for PluginmetaState.
const (
	ModelStateAlpha ModelState = "alpha"

	ModelStateBeta ModelState = "beta"
)

// Defines values for PluginmetaType.
const (
	ModelTypeApp ModelType = "app"

	ModelTypeDatasource ModelType = "datasource"

	ModelTypePanel ModelType = "panel"
)

// Pluginmeta defines model for pluginmeta.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type Model struct {
	// For data source plugins, if the plugin supports alerting.
	Alerting *bool `json:"alerting,omitempty"`

	// For data source plugins, if the plugin supports annotation
	// queries.
	Annotations *bool `json:"annotations,omitempty"`

	// Set to true for app plugins that should be enabled by default
	// in all orgs
	AutoEnabled *bool `json:"autoEnabled,omitempty"`

	// If the plugin has a backend component.
	Backend *bool `json:"backend,omitempty"`

	// Plugin category used on the Add data source page.
	Category *ModelCategory `json:"category,omitempty"`

	// Dependencies needed by the plugin.
	Dependencies struct {
		// Required Grafana version for this plugin. Validated using
		// https://github.com/npm/node-semver.
		GrafanaDependency string `json:"grafanaDependency"`

		// (Deprecated) Required Grafana version for this plugin, e.g.
		// `6.x.x 7.x.x` to denote plugin requires Grafana v6.x.x or
		// v7.x.x.
		GrafanaVersion *string `json:"grafanaVersion,omitempty"`

		// An array of required plugins on which this plugin depends.
		Plugins *[]struct {
			Id      string                       `json:"id"`
			Name    string                       `json:"name"`
			Type    ModelDependenciesPluginsType `json:"type"`
			Version string                       `json:"version"`
		} `json:"plugins,omitempty"`
	} `json:"dependencies"`

	// Grafana Enerprise specific features.
	EnterpriseFeatures *struct {
		// Enable/Disable health diagnostics errors. Requires Grafana
		// >=7.5.5.
		HealthDiagnosticsErrors *bool `json:"healthDiagnosticsErrors,omitempty"`
	} `json:"enterpriseFeatures,omitempty"`

	// The first part of the file name of the backend component
	// executable. There can be multiple executables built for
	// different operating system and architecture. Grafana will
	// check for executables named `<executable>_<$GOOS>_<lower case
	// $GOARCH><.exe for Windows>`, e.g. `plugin_linux_amd64`.
	// Combination of $GOOS and $GOARCH can be found here:
	// https://golang.org/doc/install/source#environment.
	Executable *string `json:"executable,omitempty"`

	// For data source plugins, include hidden queries in the data
	// request.
	HiddenQueries *bool `json:"hiddenQueries,omitempty"`

	// Unique name of the plugin. If the plugin is published on
	// grafana.com, then the plugin id has to follow the naming
	// conventions.
	Id string `json:"id"`

	// Resources to include in plugin.
	Includes *[]struct {
		// Add the include to the side menu.
		AddToNav *bool `json:"addToNav,omitempty"`

		// (Legacy) The Angular component to use for a page.
		Component *string `json:"component,omitempty"`

		// Page or dashboard when user clicks the icon in the side menu.
		DefaultNav *bool `json:"defaultNav,omitempty"`

		// Icon to use in the side menu. For information on available
		// icon, refer to [Icons
		// Overview](https://developers.grafana.com/ui/latest/index.html?path=/story/docs-overview-icon--icons-overview).
		Icon *string `json:"icon,omitempty"`
		Name *string `json:"name,omitempty"`

		// Used for app plugins.
		Path *string            `json:"path,omitempty"`
		Role *ModelIncludesRole `json:"role,omitempty"`
		Type *ModelIncludesType `json:"type,omitempty"`

		// Unique identifier of the included resource
		Uid *string `json:"uid,omitempty"`
	} `json:"includes,omitempty"`

	// Metadata for the plugin. Some fields are used on the plugins
	// page in Grafana and others on grafana.com if the plugin is
	// published.
	Info struct {
		// Information about the plugin author.
		Author *struct {
			// Author's name.
			Email *string `json:"email,omitempty"`

			// Author's name.
			Name *string `json:"name,omitempty"`

			// Link to author's website.
			Url *string `json:"url,omitempty"`
		} `json:"author,omitempty"`

		// Build information
		Build *struct {
			// Git branch the plugin was built from.
			Branch *string `json:"branch,omitempty"`

			// Git hash of the commit the plugin was built from
			Hash    *string  `json:"hash,omitempty"`
			Numberr *float32 `json:"numberr,omitempty"`

			// GitHub pull request the plugin was built from
			Pr   *float32 `json:"pr,omitempty"`
			Repo *string  `json:"repo,omitempty"`

			// Time when the plugin was built, as a Unix timestamp.
			Time *float32 `json:"time,omitempty"`
		} `json:"build,omitempty"`

		// Description of plugin. Used on the plugins page in Grafana and
		// for search on grafana.com.
		Description *string `json:"description,omitempty"`

		// Array of plugin keywords. Used for search on grafana.com.
		Keywords []string `json:"keywords"`

		// An array of link objects to be displayed on this plugin's
		// project page in the form `{name: 'foo', url:
		// 'http://example.com'}`
		Links *[]struct {
			Name *string `json:"name,omitempty"`
			Url  *string `json:"url,omitempty"`
		} `json:"links,omitempty"`

		// SVG images that are used as plugin icons.
		Logos struct {
			// Link to the "large" version of the plugin logo, which must be
			// an SVG image. "Large" and "small" logos can be the same image.
			Large string `json:"large"`

			// Link to the "small" version of the plugin logo, which must be
			// an SVG image. "Large" and "small" logos can be the same image.
			Small string `json:"small"`
		} `json:"logos"`

		// An array of screenshot objects in the form `{name: 'bar', path:
		// 'img/screenshot.png'}`
		Screenshots *[]struct {
			Name *string `json:"name,omitempty"`
			Path *string `json:"path,omitempty"`
		} `json:"screenshots,omitempty"`

		// Date when this plugin was built.
		Updated string `json:"updated"`

		// Project version of this commit, e.g. `6.7.x`.
		Version string `json:"version"`
	} `json:"info"`

	// For data source plugins, if the plugin supports logs.
	Logs *bool `json:"logs,omitempty"`

	// For data source plugins, if the plugin supports metric queries.
	// Used in Explore.
	Metrics *bool `json:"metrics,omitempty"`

	// Human-readable name of the plugin that is shown to the user in
	// the UI.
	Name string `json:"name"`

	// Initialize plugin on startup. By default, the plugin
	// initializes on first use.
	Preload *bool `json:"preload,omitempty"`

	// For data source plugins. There is a query options section in
	// the plugin's query editor and these options can be turned on
	// if needed.
	QueryOptions *struct {
		// For data source plugins. If the `cache timeout` option should
		// be shown in the query options section in the query editor.
		CacheTimeout *bool `json:"cacheTimeout,omitempty"`

		// For data source plugins. If the `max data points` option should
		// be shown in the query options section in the query editor.
		MaxDataPoints *bool `json:"maxDataPoints,omitempty"`

		// For data source plugins. If the `min interval` option should be
		// shown in the query options section in the query editor.
		MinInterval *bool `json:"minInterval,omitempty"`
	} `json:"queryOptions,omitempty"`

	// For data source plugins. Proxy routes used for plugin
	// authentication and adding headers to HTTP requests made by the
	// plugin. For more information, refer to [Authentication for
	// data source
	// plugins](https://grafana.com/docs/grafana/latest/developers/plugins/authentication/).
	Routes *[]struct {
		// For data source plugins. Route headers set the body content and
		// length to the proxied request.
		Body *map[string]interface{} `json:"body,omitempty"`

		// For data source plugins. Route headers adds HTTP headers to the
		// proxied request.
		Headers *[]interface{} `json:"headers,omitempty"`

		// For data source plugins. Token authentication section used with
		// an JWT OAuth API.
		JwtTokenAuth *struct {
			// Parameters for the JWT token authentication request.
			Params *struct {
				ClientEmail *string `json:"client_email,omitempty"`
				PrivateKey  *string `json:"private_key,omitempty"`
				TokenUri    *string `json:"token_uri,omitempty"`
			} `json:"params,omitempty"`

			// The list of scopes that your application should be granted
			// access to.
			Scopes *[]string `json:"scopes,omitempty"`

			// URL to fetch the JWT token.
			Url *string `json:"url,omitempty"`
		} `json:"jwtTokenAuth,omitempty"`

		// For data source plugins. Route method matches the HTTP verb
		// like GET or POST. Multiple methods can be provided as a
		// comma-separated list.
		Method *string `json:"method,omitempty"`

		// For data source plugins. The route path that is replaced by the
		// route URL field when proxying the call.
		Path        *string `json:"path,omitempty"`
		ReqRole     *string `json:"reqRole,omitempty"`
		ReqSignedIn *bool   `json:"reqSignedIn,omitempty"`

		// For data source plugins. Token authentication section used with
		// an OAuth API.
		TokenAuth *struct {
			// Parameters for the token authentication request.
			Params *struct {
				// OAuth client ID
				ClientId *string `json:"client_id,omitempty"`

				// OAuth client secret. Usually populated by decrypting the secret
				// from the SecureJson blob.
				ClientSecret *string `json:"client_secret,omitempty"`

				// OAuth grant type
				GrantType *string `json:"grant_type,omitempty"`

				// OAuth resource
				Resource *string `json:"resource,omitempty"`
			} `json:"params,omitempty"`

			// The list of scopes that your application should be granted
			// access to.
			Scopes *[]string `json:"scopes,omitempty"`

			// URL to fetch the authentication token.
			Url *string `json:"url,omitempty"`
		} `json:"tokenAuth,omitempty"`

		// For data source plugins. Route URL is where the request is
		// proxied to.
		Url *string `json:"url,omitempty"`
	} `json:"routes,omitempty"`

	// For panel plugins. Hides the query editor.
	SkipDataQuery *bool `json:"skipDataQuery,omitempty"`

	// Marks a plugin as a pre-release.
	State *ModelState `json:"state,omitempty"`

	// For data source plugins, if the plugin supports streaming.
	Streaming *bool `json:"streaming,omitempty"`

	// This is an undocumented feature.
	Tables *bool `json:"tables,omitempty"`

	// For data source plugins, if the plugin supports tracing.
	Tracing *bool `json:"tracing,omitempty"`

	// Plugin type.
	Type ModelType `json:"type"`
}

// Plugin category used on the Add data source page.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelCategory string

// PluginmetaDependenciesPluginsType defines model for Pluginmeta.Dependencies.Plugins.Type.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelDependenciesPluginsType string

// PluginmetaIncludesRole defines model for Pluginmeta.Includes.Role.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelIncludesRole string

// PluginmetaIncludesType defines model for Pluginmeta.Includes.Type.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelIncludesType string

// Marks a plugin as a pre-release.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelState string

// Plugin type.
//
// THIS TYPE IS INTENDED FOR INTERNAL USE BY THE GRAFANA BACKEND, AND IS SUBJECT TO BREAKING CHANGES.
// Equivalent Go types at stable import paths are provided in https://github.com/grafana/grok.
type ModelType string

//go:embed coremodel.cue
var cueFS embed.FS

// codegen ensures that this is always the latest Thema schema version
var currentVersion = thema.SV(0, 0)

// Lineage returns the Thema lineage representing a Grafana pluginmeta.
//
// The lineage is the canonical specification of the current pluginmeta schema,
// all prior schema versions, and the mappings that allow migration between
// schema versions.
func Lineage(lib thema.Library, opts ...thema.BindOption) (thema.Lineage, error) {
	return cuectx.LoadGrafanaInstancesWithThema(filepath.Join("pkg", "coremodel", "dashboard"), cueFS, lib, opts...)
}

var _ thema.LineageFactory = Lineage
var _ coremodel.Interface = &Coremodel{}

// Coremodel contains the foundational schema declaration for pluginmetas.
// It implements coremodel.Interface.
type Coremodel struct {
	lin thema.Lineage
}

// Lineage returns the canonical dashboard Lineage.
func (c *Coremodel) Lineage() thema.Lineage {
	return c.lin
}

// CurrentSchema returns the current (latest) pluginmeta Thema schema.
func (c *Coremodel) CurrentSchema() thema.Schema {
	return thema.SchemaP(c.lin, currentVersion)
}

// GoType returns a pointer to an empty Go struct that corresponds to
// the current Thema schema.
func (c *Coremodel) GoType() interface{} {
	return &Model{}
}

// New returns a new instance of the pluginmeta coremodel.
//
// Note that this function does not cache, and initially loading a Thema lineage
// can be expensive. As such, the Grafana backend should prefer to access this
// coremodel through a registry (pkg/framework/coremodel/registry), which does cache.
func New(lib thema.Library) (*Coremodel, error) {
	lin, err := Lineage(lib)
	if err != nil {
		return nil, err
	}

	return &Coremodel{
		lin: lin,
	}, nil
}
