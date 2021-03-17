package api

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"

	apimodels "github.com/grafana/alerting-api/pkg/api"
	"gopkg.in/macaron.v1"
	"gopkg.in/yaml.v3"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/datasourceproxy"
)

type LotexRuler struct {
	DataProxy *datasourceproxy.DatasourceProxyService
}

// withBufferedRW is a hack to work around the type signature exposed by the datasource proxy
// which uses the underlying ResponseWriter vs what we need to expose implementing the API services
// (which return a response.Response). Therefore, we replace the response writer so that we can return it.
func withBufferedRW(ctx *models.ReqContext) (*models.ReqContext, response.Response) {
	resp := response.CreateNormalResponse(make(http.Header), nil, 0)
	cpy := *ctx

	cpy.Resp = macaron.NewResponseWriter(ctx.Req.Method, resp)
	return &cpy, resp
}

// unmodofiedProxy passes a request to a datasource unaltered.
func (r *LotexRuler) unmodifiedProxy(ctx *models.ReqContext) response.Response {
	newCtx, resp := withBufferedRW(ctx)
	r.DataProxy.ProxyDatasourceRequestWithID(newCtx, ctx.ParamsInt64("DatasourceId"))
	return resp
}

// withReq proxies a different request
func (r *LotexRuler) withReq(ctx *models.ReqContext, req *http.Request) response.Response {
	newCtx, resp := withBufferedRW(ctx)
	newCtx.Req.Request = req
	r.DataProxy.ProxyDatasourceRequestWithID(newCtx, ctx.ParamsInt64("DatasourceId"))
	return resp
}

func (r *LotexRuler) RouteDeleteNamespaceRulesConfig(ctx *models.ReqContext) response.Response {
	return r.unmodifiedProxy(ctx)
}

func (r *LotexRuler) RouteDeleteRuleGroupConfig(ctx *models.ReqContext) response.Response {
	return r.unmodifiedProxy(ctx)
}

func (r *LotexRuler) RouteGetNamespaceRulesConfig(ctx *models.ReqContext) response.Response {
	return r.unmodifiedProxy(ctx)
}

func (r *LotexRuler) RouteGetRulegGroupConfig(ctx *models.ReqContext) response.Response {
	return r.unmodifiedProxy(ctx)
}

func (r *LotexRuler) RouteGetRulesConfig(ctx *models.ReqContext) response.Response {
	return r.unmodifiedProxy(ctx)
}

func (r *LotexRuler) RoutePostNameRulesConfig(ctx *models.ReqContext, conf apimodels.RuleGroupConfig) response.Response {

	yml, err := yaml.Marshal(conf)
	if err != nil {
		return response.Error(500, "Failed marshal rule group", err)
	}
	body, ln := payload(yml)

	ns := ctx.Params("Namespace")

	// use the legacy rule path as it's the same for cortex & loki
	u := *ctx.Req.URL
	u.Path = fmt.Sprintf("/api/prom/rules/%s", ns)
	if escaped := url.PathEscape(u.Path); escaped != u.Path {
		u.RawPath = escaped
	}

	req := &http.Request{
		Method:        "POST",
		URL:           &u,
		Body:          body,
		ContentLength: ln,
	}
	return r.withReq(ctx, req)
}

func payload(b []byte) (io.ReadCloser, int64) {
	return ioutil.NopCloser(bytes.NewBuffer(b)), int64(len(b))
}
