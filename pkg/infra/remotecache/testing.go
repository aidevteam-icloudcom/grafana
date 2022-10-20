package remotecache

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/setting"
)

// NewFakeStore creates store for testing
func NewFakeStore(t *testing.T) *RemoteCache {
	t.Helper()

	opts := &setting.RemoteCacheOptions{
		Name:    "database",
		ConnStr: "",
	}

	sqlStore := db.InitTestDB(t)

	dc, err := ProvideService(&setting.Cfg{
		RemoteCacheOptions: opts,
	}, sqlStore)
	require.NoError(t, err, "Failed to init remote cache for test")

	return dc
}
