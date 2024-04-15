package datasource

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/rest"

	datasource "github.com/grafana/grafana/pkg/apis/datasource/v0alpha1"
)

type subHealthREST struct {
	builder *DataSourceAPIBuilder
	handle  HTTPRequestHandlerFunc
}

var (
	_ = rest.Connecter(&subHealthREST{})
	_ = rest.StorageMetadata(&subHealthREST{})
)

func (r *subHealthREST) New() runtime.Object {
	return &datasource.HealthCheckResult{}
}

func (r *subHealthREST) Destroy() {
}

func (r *subHealthREST) ConnectMethods() []string {
	return []string{"GET"}
}

func (r *subHealthREST) ProducesMIMETypes(verb string) []string {
	return nil
}

func (r *subHealthREST) ProducesObject(verb string) interface{} {
	return &datasource.HealthCheckResult{}
}

func (r *subHealthREST) NewConnectOptions() (runtime.Object, bool, string) {
	return nil, false, ""
}

func (r *subHealthREST) Connect(ctx context.Context, name string, opts runtime.Object, responder rest.Responder) (http.Handler, error) {
	pluginCtx, err := r.builder.getPluginContext(ctx, name)
	if err != nil {
		return nil, err
	}

	ctx = backend.WithGrafanaConfig(ctx, pluginCtx.GrafanaConfig)
	ctx = contextualMiddlewares(ctx)

	return r.handle(ctx, pluginCtx, responder)
}
