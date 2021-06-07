package opentsdb

import (
	"io/ioutil"
	"net/http"
	"strings"
	"testing"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/stretchr/testify/require"
)

func TestOpenTsdbExecutor(t *testing.T) {
	exec := &OpenTsdbExecutor{}

	t.Run("Parse response should handle invalid JSON", func(t *testing.T) {
		response := `{ invalid }`

		query := OpenTsdbQuery{}

		result, err := exec.parseResponse(query, &http.Response{Body: ioutil.NopCloser(strings.NewReader(response))})
		require.Nil(t, result["A"].Dataframes)
		require.Error(t, err)
	})

	t.Run("Parse response should handle invalid JSON", func(t *testing.T) {
		response := `
		[
			{
				"metric": "test",
				"dps": {
					"58": 50.0
				}
			}
		]`

		query := OpenTsdbQuery{}

		resp := http.Response{Body: ioutil.NopCloser(strings.NewReader(response))}
		resp.StatusCode = 200
		result, err := exec.parseResponse(query, &resp)
		require.NoError(t, err)

		decoded, err := result["A"].Dataframes.Decoded()
		require.NoError(t, err)
		require.Len(t, decoded, 1)

		frame := decoded[0]

		require.Len(t, frame.Fields, 2)

		field1 := frame.Fields[0]
		field2 := frame.Fields[1]

		require.Equal(t, field1.Len(), 1)
		require.Equal(t, field2.Len(), 1)

		require.Equal(t, field2.At(0).(float64), 50.0)

		require.Nil(t, err)
	})

	t.Run("Build metric with downsampling enabled", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", false)
		query.Model.Set("downsampleInterval", "")
		query.Model.Set("downsampleAggregator", "avg")
		query.Model.Set("downsampleFillPolicy", "none")

		metric := exec.buildMetric(query)

		require.Len(t, metric, 3)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])
		require.Equal(t, "1m-avg", metric["downsample"])
	})

	t.Run("Build metric with downsampling disabled", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", true)
		query.Model.Set("downsampleInterval", "")
		query.Model.Set("downsampleAggregator", "avg")
		query.Model.Set("downsampleFillPolicy", "none")

		metric := exec.buildMetric(query)

		require.Len(t, metric, 2)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])
	})

	t.Run("Build metric with downsampling enabled with params", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", false)
		query.Model.Set("downsampleInterval", "5m")
		query.Model.Set("downsampleAggregator", "sum")
		query.Model.Set("downsampleFillPolicy", "null")

		metric := exec.buildMetric(query)

		require.Len(t, metric, 3)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])
		require.Equal(t, "5m-sum-null", metric["downsample"])
	})

	t.Run("Build metric with tags with downsampling disabled", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", true)
		query.Model.Set("downsampleInterval", "5m")
		query.Model.Set("downsampleAggregator", "sum")
		query.Model.Set("downsampleFillPolicy", "null")

		tags := simplejson.New()
		tags.Set("env", "prod")
		tags.Set("app", "grafana")
		query.Model.Set("tags", tags.MustMap())

		metric := exec.buildMetric(query)

		require.Len(t, metric, 3)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])
		require.Nil(t, metric["downsample"])

		metricTags := metric["tags"].(map[string]interface{})
		require.Len(t, metricTags, 2)
		require.Equal(t, "prod", metricTags["env"])
		require.Equal(t, "grafana", metricTags["app"])
		require.Nil(t, metricTags["ip"])
	})

	t.Run("Build metric with rate enabled but counter disabled", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", true)
		query.Model.Set("shouldComputeRate", true)
		query.Model.Set("isCounter", false)

		tags := simplejson.New()
		tags.Set("env", "prod")
		tags.Set("app", "grafana")
		query.Model.Set("tags", tags.MustMap())

		metric := exec.buildMetric(query)

		require.Len(t, metric, 5)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])

		metricTags := metric["tags"].(map[string]interface{})
		require.Len(t, metricTags, 2)
		require.Equal(t, "prod", metricTags["env"])
		require.Equal(t, "grafana", metricTags["app"])
		require.Nil(t, metricTags["ip"])

		require.True(t, metric["rate"].(bool))
		require.False(t, metric["rateOptions"].(map[string]interface{})["counter"].(bool))
	})

	t.Run("Build metric with rate and counter enabled", func(t *testing.T) {
		query := plugins.DataSubQuery{
			Model: simplejson.New(),
		}

		query.Model.Set("metric", "cpu.average.percent")
		query.Model.Set("aggregator", "avg")
		query.Model.Set("disableDownsampling", true)
		query.Model.Set("shouldComputeRate", true)
		query.Model.Set("isCounter", true)
		query.Model.Set("counterMax", 45)
		query.Model.Set("counterResetValue", 60)

		tags := simplejson.New()
		tags.Set("env", "prod")
		tags.Set("app", "grafana")
		query.Model.Set("tags", tags.MustMap())

		metric := exec.buildMetric(query)

		require.Len(t, metric, 5)
		require.Equal(t, "cpu.average.percent", metric["metric"])
		require.Equal(t, "avg", metric["aggregator"])

		metricTags := metric["tags"].(map[string]interface{})
		require.Len(t, metricTags, 2)
		require.Equal(t, "prod", metricTags["env"])
		require.Equal(t, "grafana", metricTags["app"])
		require.Nil(t, metricTags["ip"])

		require.True(t, metric["rate"].(bool))
		metricRateOptions := metric["rateOptions"].(map[string]interface{})
		require.Len(t, metricRateOptions, 3)
		require.True(t, metricRateOptions["counter"].(bool))
		require.Equal(t, float64(45), metricRateOptions["counterMax"])
		require.Equal(t, float64(60), metricRateOptions["resetValue"])
	})
}
