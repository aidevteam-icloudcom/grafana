package api

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/grafana/grafana/pkg/setting"
)

func TestHTTPServer_MetricsBasicAuth(t *testing.T) {
	ts := &HTTPServer{
		Cfg: setting.NewCfg(),
	}

	t.Run("enabled", func(t *testing.T) {
		ts.Cfg.MetricsEndpointBasicAuthUsername = "foo"
		ts.Cfg.MetricsEndpointBasicAuthPassword = "bar"

		assert.True(t, ts.metricsEndpointBasicAuthEnabled())
	})

	t.Run("disabled", func(t *testing.T) {
		ts.Cfg.MetricsEndpointBasicAuthUsername = ""
		ts.Cfg.MetricsEndpointBasicAuthPassword = ""

		assert.False(t, ts.metricsEndpointBasicAuthEnabled())
	})
}

func TestHTTPServer_readCertificates(t *testing.T) {
	ts := &HTTPServer{
		Cfg: setting.NewCfg(),
	}
	t.Run("ReadCertificates should return error when cert files are not configured", func(t *testing.T) {
		_, err := ts.readCertificates()
		assert.NotNil(t, err)
	})
}
