package models

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestQueryJSON(t *testing.T) {
	jsonString := []byte(`{
		"type": "timeSeriesQuery"
	}`)
	var res metricsDataQuery
	err := json.Unmarshal(jsonString, &res)
	require.NoError(t, err)
	assert.Equal(t, "timeSeriesQuery", res.QueryType)
}

func TestRequestParser(t *testing.T) {
	t.Run("legacy statistics field is migrated: migrates first stat only", func(t *testing.T) {
		oldQuery := []backend.DataQuery{
			{
				MaxDataPoints: 0,
				QueryType:     "timeSeriesQuery",
				Interval:      0,
				RefID:         "A",
				JSON: json.RawMessage(`{
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "dimensions":{
						"InstanceId": ["test"]
					},
				   "statistics":["Average", "Sum"],
				   "period":"600",
				   "hide":false
				}`),
			},
		}

		migratedQuery, err := ParseMetricDataQueries(oldQuery, time.Now(), time.Now(), false)
		assert.NoError(t, err)
		require.Len(t, migratedQuery, 1)
		require.NotNil(t, migratedQuery[0])

		assert.Equal(t, "A", migratedQuery[0].RefId)
		assert.Equal(t, "Average", migratedQuery[0].Statistic)
	})

	t.Run("New dimensions structure", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				RefID: "ref1",
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "id": "",
				   "expression": "",
				   "dimensions":{
					  "InstanceId":["test"],
					  "InstanceType":["test2","test3"]
				   },
				   "statistic":"Average",
				   "period":"600"
				}`),
			},
		}

		results, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		require.NoError(t, err)
		require.Len(t, results, 1)
		res := results[0]
		require.NotNil(t, res)

		assert.Equal(t, "us-east-1", res.Region)
		assert.Equal(t, "ref1", res.RefId)
		assert.Equal(t, "ec2", res.Namespace)
		assert.Equal(t, "CPUUtilization", res.MetricName)
		assert.Equal(t, "queryref1", res.Id)
		assert.Empty(t, res.Expression)
		assert.Equal(t, 600, res.Period)
		assert.True(t, res.ReturnData)
		assert.Len(t, res.Dimensions, 2)
		assert.Len(t, res.Dimensions["InstanceId"], 1)
		assert.Len(t, res.Dimensions["InstanceType"], 2)
		assert.Equal(t, "test3", res.Dimensions["InstanceType"][1])
		assert.Equal(t, "Average", res.Statistic)
	})

	t.Run("Old dimensions structure (backwards compatibility)", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				RefID: "ref1",
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "id": "",
				   "expression": "",
				   "dimensions":{
					  "InstanceId":["test"],
					  "InstanceType":["test2"]
				   },
				   "statistic":"Average",
				   "period":"600",
				   "hide": false
				}`),
			},
		}

		results, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)
		require.Len(t, results, 1)
		res := results[0]
		require.NotNil(t, res)

		assert.Equal(t, "us-east-1", res.Region)
		assert.Equal(t, "ref1", res.RefId)
		assert.Equal(t, "ec2", res.Namespace)
		assert.Equal(t, "CPUUtilization", res.MetricName)
		assert.Equal(t, "queryref1", res.Id)
		assert.Empty(t, res.Expression)
		assert.Equal(t, 600, res.Period)
		assert.True(t, res.ReturnData)
		assert.Len(t, res.Dimensions, 2)
		assert.Len(t, res.Dimensions["InstanceId"], 1)
		assert.Len(t, res.Dimensions["InstanceType"], 1)
		assert.Equal(t, "test2", res.Dimensions["InstanceType"][0])
		assert.Equal(t, "Average", res.Statistic)
	})

	t.Run("parseDimensions returns error for non-string type dimension value", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "dimensions":{
					  "InstanceId":3
				   },
				   "statistic":"Average"
				}`),
			},
		}

		_, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		require.Error(t, err)

		assert.Equal(t, `error parsing query "", failed to parse dimensions: unknown type as dimension value`, err.Error())
	})
}

func Test_ParseMetricDataQueries_periods(t *testing.T) {
	t.Run("Period defined in the editor by the user is being used when time range is short", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "id": "",
				   "expression": "",
				   "dimensions":{
					  "InstanceId":["test"],
					  "InstanceType":["test2"]
				   },
				   "statistic":"Average",
				   "period":"900",
				   "hide":false
				}`),
			},
		}

		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)
		require.Len(t, res, 1)
		require.NotNil(t, res[0])

		assert.Equal(t, 900, res[0].Period)
	})

	t.Run("Period is parsed correctly if not defined by user", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "id": "",
				   "expression": "",
				   "dimensions":{
					  "InstanceId":["test"],
					  "InstanceType":["test2"]
				   },
				   "statistic":"Average",
				   "period":"auto"
				}`),
			},
		}

		t.Run("Time range is 5 minutes", func(t *testing.T) {
			to := time.Now()
			from := to.Local().Add(time.Minute * time.Duration(5))

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)

			require.Len(t, res, 1)
			assert.Equal(t, 60, res[0].Period)
		})

		t.Run("Time range is 1 day", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(0, 0, -1)

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 60, res[0].Period)
		})

		t.Run("Time range is 2 days", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(0, 0, -2)
			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 300, res[0].Period)
		})

		t.Run("Time range is 7 days", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(0, 0, -7)

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 900, res[0].Period)
		})

		t.Run("Time range is 30 days", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(0, 0, -30)

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 3600, res[0].Period)
		})

		t.Run("Time range is 90 days", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(0, 0, -90)

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 21600, res[0].Period)
		})

		t.Run("Time range is 1 year", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(-1, 0, 0)

			res, err := ParseMetricDataQueries(query, from, to, false)
			require.Nil(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 21600, res[0].Period)
		})

		t.Run("Time range is 2 years", func(t *testing.T) {
			to := time.Now()
			from := to.AddDate(-2, 0, 0)

			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 86400, res[0].Period)
		})

		t.Run("Time range is 2 days, but 16 days ago", func(t *testing.T) {
			to := time.Now().AddDate(0, 0, -14)
			from := to.AddDate(0, 0, -2)
			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 300, res[0].Period)
		})

		t.Run("Time range is 2 days, but 90 days ago", func(t *testing.T) {
			to := time.Now().AddDate(0, 0, -88)
			from := to.AddDate(0, 0, -2)
			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 3600, res[0].Period)
		})

		t.Run("Time range is 2 days, but 456 days ago", func(t *testing.T) {
			to := time.Now().AddDate(0, 0, -454)
			from := to.AddDate(0, 0, -2)
			res, err := ParseMetricDataQueries(query, from, to, false)
			assert.NoError(t, err)
			require.Len(t, res, 1)
			assert.Equal(t, 21600, res[0].Period)
		})

		t.Run("returns error if period is invalid duration", func(t *testing.T) {
			query := []backend.DataQuery{
				{
					JSON: json.RawMessage(`{
				   "statistic":"Average",
				   "period":"invalid"
				}`),
				},
			}

			_, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
			require.Error(t, err)

			assert.Equal(t, `error parsing query "", failed to parse period as duration: time: invalid duration "invalid"`, err.Error())
		})

		t.Run("returns parsed duration in seconds", func(t *testing.T) {
			query := []backend.DataQuery{
				{
					JSON: json.RawMessage(`{
				   "statistic":"Average",
				   "period":"2h45m"
				}`),
				},
			}

			res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
			assert.NoError(t, err)

			require.Len(t, res, 1)
			assert.Equal(t, 9900, res[0].Period)
		})
	})
}

func Test_ParseMetricDataQueries_query_type_and_metric_editor_mode_and_GMD_query_api_mode(t *testing.T) {
	const dummyTestEditorMode MetricEditorMode = 99
	testCases := map[string]struct {
		extraDataQueryJson       string
		expectedMetricQueryType  MetricQueryType
		expectedMetricEditorMode MetricEditorMode
		expectedGMDApiMode       GMDApiMode
	}{
		"no metric query type, no metric editor mode, no expression": {
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: MetricEditorModeBuilder,
			expectedGMDApiMode:       GMDApiModeMetricStat,
		},
		"no metric query type, no metric editor mode, has expression": {
			extraDataQueryJson:       `"expression":"SUM(a)",`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: MetricEditorModeRaw,
			expectedGMDApiMode:       GMDApiModeMathExpression,
		},
		"no metric query type, has metric editor mode, has expression": {
			extraDataQueryJson:       `"expression":"SUM(a)","metricEditorMode":99,`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: dummyTestEditorMode,
			expectedGMDApiMode:       GMDApiModeMetricStat,
		},
		"no metric query type, has metric editor mode, no expression": {
			extraDataQueryJson:       `"metricEditorMode":99,`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: dummyTestEditorMode,
			expectedGMDApiMode:       GMDApiModeMetricStat,
		},
		"has metric query type, has metric editor mode, no expression": {
			extraDataQueryJson:       `"type":"timeSeriesQuery","metricEditorMode":99,`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: dummyTestEditorMode,
			expectedGMDApiMode:       GMDApiModeMetricStat,
		},
		"has metric query type, no metric editor mode, has expression": {
			extraDataQueryJson:       `"type":"timeSeriesQuery","expression":"SUM(a)",`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: MetricEditorModeRaw,
			expectedGMDApiMode:       GMDApiModeMathExpression,
		},
		"has metric query type, has metric editor mode, has expression": {
			extraDataQueryJson:       `"type":"timeSeriesQuery","metricEditorMode":99,"expression":"SUM(a)",`,
			expectedMetricQueryType:  MetricQueryTypeSearch,
			expectedMetricEditorMode: dummyTestEditorMode,
			expectedGMDApiMode:       GMDApiModeMetricStat,
		},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			query := []backend.DataQuery{
				{
					JSON: json.RawMessage(fmt.Sprintf(`{
								   "refId":"ref1",
								   "region":"us-east-1",
								   "namespace":"ec2",
								   "metricName":"CPUUtilization",
								   "statistic":"Average",
									%s
								   "period":"900"
								}`, tc.extraDataQueryJson)),
				},
			}
			res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), false)
			assert.NoError(t, err)

			require.Len(t, res, 1)
			require.NotNil(t, res[0])
			assert.Equal(t, tc.expectedMetricQueryType, res[0].MetricQueryType)
			assert.Equal(t, tc.expectedMetricEditorMode, res[0].MetricEditorMode)
			assert.Equal(t, tc.expectedGMDApiMode, res[0].GetGMDAPIMode())
		})
	}
}

func Test_ParseMetricDataQueries_hide_and_ReturnData(t *testing.T) {
	t.Run("for query type timeSeriesQuery, default ReturnData is true", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900",
				   "type":"timeSeriesQuery"
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.True(t, res[0].ReturnData)
	})
	t.Run("when hide is true, ReturnData is false", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900",
				   "type":"timeSeriesQuery",
				   "hide":true
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.False(t, res[0].ReturnData)
	})
	t.Run("when hide is false, ReturnData is true", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900",
				   "type":"timeSeriesQuery",
				   "hide":false
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.True(t, res[0].ReturnData)
	})
	t.Run("when query type is empty and hide is missing, ReturnData is true", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900"
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.True(t, res[0].ReturnData)
	})

	t.Run("when query type is empty and hide is false, ReturnData is true", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"auto",
				   "hide":false
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.True(t, res[0].ReturnData)
	})

	t.Run("when query type is empty and hide is true, ReturnData is true", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"auto",
				   "hide":true
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.True(t, res[0].ReturnData)
	})
}

func Test_ParseMetricDataQueries_id(t *testing.T) {
	t.Run("ID is the string `query` appended with refId if refId is a valid MetricData ID", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				RefID: "ref1",
				JSON: json.RawMessage(`{
				   "refId":"ref1",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900"
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.Equal(t, "ref1", res[0].RefId)
		assert.Equal(t, "queryref1", res[0].Id)
	})
	t.Run("Valid id is generated if ID is not provided and refId is not a valid MetricData ID", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				RefID: "$$",
				JSON: json.RawMessage(`{
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "statistic":"Average",
				   "period":"900",
				   "refId":"$$"
				}`),
			},
		}
		res, err := ParseMetricDataQueries(query, time.Now().Add(-2*time.Hour), time.Now().Add(-time.Hour), false)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.Equal(t, "$$", res[0].RefId)
		assert.Regexp(t, validMetricDataID, res[0].Id)
	})
}

func Test_ParseMetricDataQueries_sets_label_when_label_is_present_in_json_query(t *testing.T) {
	query := []backend.DataQuery{
		{
			JSON: json.RawMessage(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"some alias",
				   "label":"some label",
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`),
		},
	}

	res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), true)
	assert.NoError(t, err)

	require.Len(t, res, 1)
	require.NotNil(t, res[0])
	assert.Equal(t, "some alias", res[0].Alias) // untouched
	assert.Equal(t, "some label", res[0].Label)
}

func Test_migrateAliasToDynamicLabel_single_query_preserves_old_alias_and_creates_new_label(t *testing.T) {
	testCases := map[string]struct {
		inputAlias    string
		expectedLabel string
	}{
		"one known alias pattern: metric":             {inputAlias: "{{metric}}", expectedLabel: "${PROP('MetricName')}"},
		"one known alias pattern: namespace":          {inputAlias: "{{namespace}}", expectedLabel: "${PROP('Namespace')}"},
		"one known alias pattern: period":             {inputAlias: "{{period}}", expectedLabel: "${PROP('Period')}"},
		"one known alias pattern: region":             {inputAlias: "{{region}}", expectedLabel: "${PROP('Region')}"},
		"one known alias pattern: stat":               {inputAlias: "{{stat}}", expectedLabel: "${PROP('Stat')}"},
		"one known alias pattern: label":              {inputAlias: "{{label}}", expectedLabel: "${LABEL}"},
		"one unknown alias pattern becomes dimension": {inputAlias: "{{any_other_word}}", expectedLabel: "${PROP('Dim.any_other_word')}"},
		"one known alias pattern with spaces":         {inputAlias: "{{ metric   }}", expectedLabel: "${PROP('MetricName')}"},
		"multiple alias patterns":                     {inputAlias: "some {{combination }}{{ label}} and {{metric}}", expectedLabel: "some ${PROP('Dim.combination')}${LABEL} and ${PROP('MetricName')}"},
		"empty alias still migrates to empty label":   {inputAlias: "", expectedLabel: ""},
	}
	for name, tc := range testCases {
		t.Run(name, func(t *testing.T) {
			average := "Average"
			false := false

			queryToMigrate := metricsDataQuery{
				Region:     "us-east-1",
				Namespace:  "ec2",
				MetricName: "CPUUtilization",
				Alias:      tc.inputAlias,
				Dimensions: map[string]interface{}{
					"InstanceId": []interface{}{"test"},
				},
				Statistic: &average,
				Period:    "600",
				Hide:      &false,
			}

			migrateAliasToDynamicLabel(&queryToMigrate)

			require.NotNil(t, queryToMigrate.Label)
			assert.Equal(t, tc.expectedLabel, *queryToMigrate.Label)
		})
	}
}

func Test_ParseMetricDataQueries_alias_to_label_migration(t *testing.T) {
	t.Run("migrates alias to label when label does not already exist and feature toggle enabled", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"{{period}} {{any_other_word}}",
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`),
			},
		}

		res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), true)
		assert.NoError(t, err)

		require.Len(t, res, 1)
		require.NotNil(t, res[0])
		assert.Equal(t, "{{period}} {{any_other_word}}", res[0].Alias) // untouched
		assert.Equal(t, "${PROP('Period')} ${PROP('Dim.any_other_word')}", res[0].Label)
	})

	t.Run("successfully migrates alias to dynamic label for multiple queries", func(t *testing.T) {
		query := []backend.DataQuery{
			{
				JSON: json.RawMessage(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"{{period}} {{any_other_word}}",
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`),
			},
			{
				JSON: json.RawMessage(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"{{  label }}",
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`),
			},
		}

		res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), true)
		assert.NoError(t, err)

		require.Len(t, res, 2)

		require.NotNil(t, res[0])
		assert.Equal(t, "{{period}} {{any_other_word}}", res[0].Alias)
		assert.Equal(t, "${PROP('Period')} ${PROP('Dim.any_other_word')}", res[0].Label)

		require.NotNil(t, res[1])
		assert.Equal(t, "{{  label }}", res[1].Alias)
		assert.Equal(t, "${LABEL}", res[1].Label)
	})

	t.Run("does not migrate alias to label", func(t *testing.T) {
		testCases := map[string]struct {
			labelJson                         string
			dynamicLabelsFeatureToggleEnabled bool
		}{
			"when label already exists, feature toggle enabled":     {labelJson: `"label":"some label",`, dynamicLabelsFeatureToggleEnabled: true},
			"when label already exists, feature toggle is disabled": {labelJson: `"label":"some label",`, dynamicLabelsFeatureToggleEnabled: false},
		}

		for name, tc := range testCases {
			t.Run(name, func(t *testing.T) {
				query := []backend.DataQuery{
					{
						JSON: json.RawMessage(fmt.Sprintf(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"{{period}} {{any_other_word}}",
				   %s
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`, tc.labelJson)),
					},
				}
				res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), tc.dynamicLabelsFeatureToggleEnabled)
				assert.NoError(t, err)

				require.Len(t, res, 1)
				require.NotNil(t, res[0])
				assert.Equal(t, "some label", res[0].Label) // input label is unchanged
				require.NotNil(t, res[0].Alias)
				assert.Equal(t, "{{period}} {{any_other_word}}", res[0].Alias)
			})
		}

		t.Run("when label does not exist, feature toggle is disabled", func(t *testing.T) {
			query := []backend.DataQuery{
				{
					JSON: json.RawMessage(`{
				   "refId":"A",
				   "region":"us-east-1",
				   "namespace":"ec2",
				   "metricName":"CPUUtilization",
				   "alias":"{{period}} {{any_other_word}}",
				   "dimensions":{"InstanceId":["test"]},
				   "statistic":"Average",
				   "period":"600",
				   "hide":false
				}`),
				},
			}
			res, err := ParseMetricDataQueries(query, time.Now(), time.Now(), false)
			assert.NoError(t, err)

			require.Len(t, res, 1)
			require.NotNil(t, res[0])
			assert.Empty(t, res[0].Label)
			require.NotNil(t, res[0].Alias)
			assert.Equal(t, "{{period}} {{any_other_word}}", res[0].Alias)
		})
	})
}

func Test_ParseMetricDataQueries_statistics_and_query_type_validation_and_MatchExact_initialization(t *testing.T) {
	t.Run("requires statistics or statistic field", func(t *testing.T) {
		actual, err := ParseMetricDataQueries(
			[]backend.DataQuery{
				{
					JSON: []byte("{}"),
				},
			}, time.Now(), time.Now(), false)
		assert.Error(t, err)
		assert.Equal(t, "query must have either statistic or statistics field", err.Error())

		assert.Nil(t, actual)
	})

	t.Run("ignores query types which are not timeSeriesQuery", func(t *testing.T) {
		actual, err := ParseMetricDataQueries(
			[]backend.DataQuery{
				{
					JSON: []byte(`{"type":"some other type", "statistic":"Average", "matchExact":false}`),
				},
			}, time.Now(), time.Now(), false)
		assert.NoError(t, err)

		assert.Empty(t, actual)
	})

	t.Run("accepts empty query type", func(t *testing.T) {
		actual, err := ParseMetricDataQueries(
			[]backend.DataQuery{
				{
					JSON: []byte(`{"statistic":"Average"}`),
				},
			}, time.Now(), time.Now(), false)
		assert.NoError(t, err)

		assert.NotEmpty(t, actual)
	})

	t.Run("sets MatchExact nil to MatchExact true", func(t *testing.T) {
		actual, err := ParseMetricDataQueries(
			[]backend.DataQuery{
				{
					JSON: []byte(`{"statistic":"Average"}`),
				},
			}, time.Now(), time.Now(), false)
		assert.NoError(t, err)

		assert.Len(t, actual, 1)
		assert.NotNil(t, actual[0])
		assert.True(t, actual[0].MatchExact)
	})

	t.Run("sets MatchExact", func(t *testing.T) {
		actual, err := ParseMetricDataQueries(
			[]backend.DataQuery{
				{
					JSON: []byte(`{"statistic":"Average","matchExact":false}`),
				},
			}, time.Now(), time.Now(), false)
		assert.NoError(t, err)

		assert.Len(t, actual, 1)
		assert.NotNil(t, actual[0])
		assert.False(t, actual[0].MatchExact)
	})
}
