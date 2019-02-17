package middleware

import (
	m "github.com/grafana/grafana/pkg/models"
	macaron "gopkg.in/macaron.v1"
)

const (
	HeaderNameNoBackendCache = "X-Grafana-NoCache"
	HeaderWebAuthUser        = "X-WEBAUTH-USER"
	HeaderUsername           = "username"
	HeaderEmail              = "email"
)

func HandleNoCacheHeader() macaron.Handler {
	return func(ctx *m.ReqContext) {
		ctx.SkipCache = ctx.Req.Header.Get(HeaderNameNoBackendCache) == "true"
	}
}
