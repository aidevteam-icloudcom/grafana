package prometheus_test

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"math/rand"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/experimental"
	"github.com/grafana/grafana/pkg/tsdb/prometheus"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/require"
)

const updateMocks = false

func BenchmarkMatrixToDataFrames(b *testing.B) {
	results := generateMatrixData(100, 1_000)
	query := &prometheus.PrometheusQuery{
		LegendFormat: "",
	}
	for i := 0; i < b.N; i++ {
		frames := make([]*data.Frame, 0)
		frames = prometheus.MatrixToDataFrames(results, query, frames)
		if len(frames) != 1 {
			b.Fatal("wrong frame count", len(frames))
		}
		if len(frames[0].Fields) != 101 {
			b.Fatal("wrong field count", len(frames[0].Fields))
		}
		if count, err := frames[0].RowLen(); count != 1_000 || err != nil {
			b.Fatal("wrong row count", count, err)
		}
	}
}

func generateMatrixData(seriesCount, rowCount int) model.Matrix {
	ts := time.Now()
	results := model.Matrix{}

	for i := 0; i < seriesCount; i += 1 {
		samples := []model.SamplePair{}
		for j := 0; j < rowCount; j += 1 {
			s := model.SamplePair{
				Value:     model.SampleValue(rand.Float64()),
				Timestamp: model.TimeFromUnixNano(ts.Add(time.Duration(-1*j) * time.Second).UnixNano()),
			}
			if rand.Int()%10 == 0 {
				continue
			}
			samples = append(samples, s)
		}
		result := model.SampleStream{
			Metric: model.Metric{
				"__name__": model.LabelValue(fmt.Sprintf("name_%d", i)),
			},
			Values: samples,
		}
		if rand.Int()%10 == 0 {
			result.Metric[model.LabelName(fmt.Sprintf("random_%d", i))] = model.LabelValue(fmt.Sprintf("name_%d", i))
		}
		results = append(results, &result)
	}
	return results
}

func TestMatrixToDataFrames(t *testing.T) {
	t.Run("matrix.json golden response", func(t *testing.T) {
		var m model.Matrix
		err := loadTestData("matrix.json", &m)
		require.NoError(t, err)
		require.Equal(t, 5, m.Len())

		query := &prometheus.PrometheusQuery{
			LegendFormat: "",
		}
		frames := make(data.Frames, 0)
		frames = prometheus.MatrixToDataFrames(m, query, frames)
		res := &backend.DataResponse{Frames: frames}

		err = experimental.CheckGoldenDataResponse("./testdata/matrix.txt", res, updateMocks)
		require.NoError(t, err)
	})
}

func BenchmarkVectorToDataFrames(b *testing.B) {
	results := generateVectorData(10_000)
	query := &prometheus.PrometheusQuery{
		LegendFormat: "",
	}
	for i := 0; i < b.N; i++ {
		frames := make([]*data.Frame, 0)
		frames = prometheus.VectorToDataFrames(results, query, frames)
		if len(frames) != 1 {
			b.Fatal("wrong frame count", len(frames))
		}
		if frames[0].Rows() != 1 {
			b.Fatal("wrong row count", frames[0].Rows())
		}
	}
}

func generateVectorData(resultCount int) model.Vector {
	ts := model.TimeFromUnixNano(time.Now().UnixNano())
	results := make(model.Vector, 0)

	for i := 0; i < resultCount; i += 1 {
		s := model.Sample{
			Metric:    model.Metric(model.LabelSet{"traceID": model.LabelValue(fmt.Sprintf("test_%d", i))}),
			Value:     model.SampleValue(rand.Float64() + float64(i)),
			Timestamp: ts,
		}
		if rand.Int()%10 == 0 {
			s.Metric["label"] = model.LabelValue(fmt.Sprintf("test_%d", i))
		}
		if rand.Int()%5 == 0 {
			s.Value = model.SampleValue(math.NaN())
		}
		results = append(results, &s)
	}
	return results
}

func TestVectorToDataFrames(t *testing.T) {
	t.Run("vector.json golden response", func(t *testing.T) {
		var m model.Vector
		err := loadTestData("vector.json", &m)
		require.NoError(t, err)
		require.Equal(t, 6, m.Len())

		query := &prometheus.PrometheusQuery{
			LegendFormat: "",
		}
		frames := make(data.Frames, 0)
		frames = prometheus.VectorToDataFrames(m, query, frames)
		res := &backend.DataResponse{Frames: frames}

		err = experimental.CheckGoldenDataResponse("./testdata/vector.txt", res, updateMocks)
		require.NoError(t, err)
	})
}

func loadTestData(path string, res interface{}) error {
	// Ignore gosec warning G304 since it's a test
	// nolint:gosec
	bytes, err := ioutil.ReadFile("./testdata/" + path)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytes, &res)
}
