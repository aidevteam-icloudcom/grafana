package metrics

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/cloudwatch/cloudwatchiface"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/tests/testinfra"
	"github.com/grafana/grafana/pkg/tsdb/cloudwatch"

	cwapi "github.com/aws/aws-sdk-go/service/cloudwatch"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestQueryCloudWatchMetrics(t *testing.T) {
	grafDir, cfgPath := testinfra.CreateGrafDir(t)

	addr, sqlStore := testinfra.StartGrafana(t, grafDir, cfgPath)
	setUpDatabase(t, sqlStore, "metrics")

	origNewCWClient := cloudwatch.NewCWClient
	t.Cleanup(func() {
		cloudwatch.NewCWClient = origNewCWClient
	})
	var client cloudwatch.FakeCWClient
	cloudwatch.NewCWClient = func(sess *session.Session) cloudwatchiface.CloudWatchAPI {
		return client
	}

	t.Run("Custom metrics", func(t *testing.T) {
		client = cloudwatch.FakeCWClient{
			Metrics: []*cwapi.Metric{
				{
					MetricName: aws.String("Test_MetricName"),
					Dimensions: []*cwapi.Dimension{
						{
							Name: aws.String("Test_DimensionName"),
						},
					},
				},
			},
		}
		result := getCWMetrics(t, 1, addr)

		type suggestData struct {
			Text  string
			Value string
			Label string
		}
		expect := []suggestData{
			{Text: "Test_MetricName", Value: "Test_MetricName", Label: "Test_MetricName"},
		}
		actual := []suggestData{}
		err := json.Unmarshal(result, &actual)
		require.NoError(t, err)
		assert.Equal(t, expect, actual)
	})
}

func getCWMetrics(t *testing.T, datasourceId int, addr string) []byte {
	t.Helper()

	u := fmt.Sprintf("http://%s/api/datasources/%v/resources/metrics?region=us-east-1&namespace=custom", addr, datasourceId)
	t.Logf("Making GET request to %s", u)
	// nolint:gosec
	resp, err := http.Get(u)
	require.NoError(t, err)
	require.NotNil(t, resp)
	t.Cleanup(func() {
		err := resp.Body.Close()
		assert.NoError(t, err)
	})

	buf := bytes.Buffer{}
	_, err = io.Copy(&buf, resp.Body)
	require.NoError(t, err)
	require.Equal(t, 200, resp.StatusCode)

	return buf.Bytes()
}

func setUpDatabase(t *testing.T, store *sqlstore.SQLStore, uid string) {
	t.Helper()

	err := store.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		_, err := sess.Insert(&models.DataSource{
			Id:  1,
			Uid: uid,
			// This will be the ID of the main org
			OrgId:   2,
			Name:    "Test",
			Type:    "cloudwatch",
			Created: time.Now(),
			Updated: time.Now(),
		})
		return err
	})
	require.NoError(t, err)

	// Make sure changes are synced with other goroutines
	err = store.Sync()
	require.NoError(t, err)
}
