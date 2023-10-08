package expr

import (
	"context"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/expr/mathexp"
	"github.com/grafana/grafana/pkg/infra/tracing"
)

func TestHysteresisExecute(t *testing.T) {
	number := func(label string, value float64) mathexp.Number {
		n := mathexp.NewNumber("A", data.Labels{"label": label})
		n.SetValue(&value)
		return n
	}
	fingerprint := func(label string) data.Fingerprint {
		return data.Labels{"label": label}.Fingerprint()
	}

	tracer := tracing.InitializeTracerForTest()

	var loadThreshold = 100.0
	var unloadThreshold = 30.0

	testCases := []struct {
		name             string
		loadedDimensions Fingerprints
		input            mathexp.Values
		expected         mathexp.Values
		expectedError    error
	}{
		{
			name:             "return NoData when no data",
			loadedDimensions: Fingerprints{0: struct{}{}},
			input:            mathexp.Values{mathexp.NewNoData()},
			expected:         mathexp.Values{mathexp.NewNoData()},
		},
		{
			name:             "use only loaded condition if no loaded metrics",
			loadedDimensions: Fingerprints{},
			input: mathexp.Values{
				number("value1", loadThreshold+1),
				number("value2", loadThreshold),
				number("value3", loadThreshold-1),
				number("value4", unloadThreshold+1),
				number("value5", unloadThreshold),
				number("value6", unloadThreshold-1),
			},
			expected: mathexp.Values{
				number("value1", 1),
				number("value2", 0),
				number("value3", 0),
				number("value4", 0),
				number("value5", 0),
				number("value6", 0),
			},
		},
		{
			name: "evaluate loaded metrics against unloaded threshold",
			loadedDimensions: Fingerprints{
				fingerprint("value4"): {},
				fingerprint("value5"): {},
				fingerprint("value6"): {},
			},
			input: mathexp.Values{
				number("value1", loadThreshold+1),
				number("value2", loadThreshold),
				number("value3", loadThreshold-1),
				number("value4", unloadThreshold+1),
				number("value5", unloadThreshold),
				number("value6", unloadThreshold-1),
			},
			expected: mathexp.Values{
				number("value1", 1),
				number("value2", 0),
				number("value3", 0),
				number("value4", 1),
				number("value5", 0),
				number("value6", 0),
			},
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			cmd := &HysteresisCommand{
				RefID:        "B",
				ReferenceVar: "A",
				LoadingThresholdFunc: ThresholdCommand{
					ReferenceVar:  "A",
					RefID:         "B",
					ThresholdFunc: ThresholdIsAbove,
					Conditions:    []float64{loadThreshold},
				},
				UnloadingThresholdFunc: ThresholdCommand{
					ReferenceVar:  "A",
					RefID:         "B",
					ThresholdFunc: ThresholdIsAbove,
					Conditions:    []float64{unloadThreshold},
				},
				LoadedDimensions: tc.loadedDimensions,
			}

			result, err := cmd.Execute(context.Background(), time.Now(), mathexp.Vars{
				"A": mathexp.Results{Values: tc.input},
			}, tracer)
			if tc.expectedError != nil {
				require.ErrorIs(t, err, tc.expectedError)
				return
			}
			require.NoError(t, err)
			require.EqualValues(t, result.Values, tc.expected)
		})
	}
}

func TestLoadedDimensionsFromFrame(t *testing.T) {
	testCases := []struct {
		name          string
		frame         *data.Frame
		expected      Fingerprints
		expectedError bool
	}{
		{
			name:          "should fail if frame has no fields",
			frame:         data.NewFrame("test"),
			expectedError: true,
		},
		{
			name: "should fail if frame has many fields",
			frame: data.NewFrame("test",
				data.NewField("fingerprints", nil, []uint64{}),
				data.NewField("test", nil, []string{}),
			),
			expectedError: true,
		},
		{
			name: "should fail if frame has field of a wrong type",
			frame: data.NewFrame("test",
				data.NewField("fingerprints", nil, []int64{}),
			),
			expectedError: true,
		},
		{
			name: "should fail if frame has nullable uint64 field",
			frame: data.NewFrame("test",
				data.NewField("fingerprints", nil, []*uint64{}),
			),
			expectedError: true,
		},
		{
			name: "should create LoadedMetrics",
			frame: data.NewFrame("test",
				data.NewField("fingerprints", nil, []uint64{1, 2, 3, 4, 5}),
			),
			expected: Fingerprints{1: {}, 2: {}, 3: {}, 4: {}, 5: {}},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			result, err := FingerprintsFromFrame(testCase.frame)
			if testCase.expectedError {
				require.Error(t, err)
			} else {
				require.EqualValues(t, testCase.expected, result)
			}
		})
	}
}
