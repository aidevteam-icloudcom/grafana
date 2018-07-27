package elasticsearch

import (
	"fmt"
	"testing"
	"time"

	"github.com/grafana/grafana/pkg/tsdb/elasticsearch/client"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/tsdb"
	. "github.com/smartystreets/goconvey/convey"
)

func TestExecuteTimeSeriesQuery(t *testing.T) {
	from := time.Date(2018, 5, 15, 17, 50, 0, 0, time.UTC)
	to := time.Date(2018, 5, 15, 17, 55, 0, 0, time.UTC)
	fromStr := fmt.Sprintf("%d", from.UnixNano()/int64(time.Millisecond))
	toStr := fmt.Sprintf("%d", to.UnixNano()/int64(time.Millisecond))

	Convey("Test execute time series query", t, func() {
		Convey("With defaults on es 2", func() {
			c := newFakeClient(2)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [{ "type": "date_histogram", "field": "@timestamp", "id": "2" }],
				"metrics": [{"type": "count", "id": "0" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]
			rangeFilter := sr.Query.Bool.Filters[0].(*es.RangeFilter)
			So(rangeFilter.Key, ShouldEqual, c.timeField)
			So(rangeFilter.Lte, ShouldEqual, toStr)
			So(rangeFilter.Gte, ShouldEqual, fromStr)
			So(rangeFilter.Format, ShouldEqual, es.DateFormatEpochMS)
			So(sr.Aggs[0].Key, ShouldEqual, "2")
			dateHistogramAgg := sr.Aggs[0].Aggregation.Aggregation.(*es.DateHistogramAgg)
			So(dateHistogramAgg.Field, ShouldEqual, "@timestamp")
			So(dateHistogramAgg.ExtendedBounds.Min, ShouldEqual, fromStr)
			So(dateHistogramAgg.ExtendedBounds.Max, ShouldEqual, toStr)
		})

		Convey("With defaults on es 5", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [{ "type": "date_histogram", "field": "@timestamp", "id": "2" }],
				"metrics": [{"type": "count", "id": "0" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]
			So(sr.Query.Bool.Filters[0].(*es.RangeFilter).Key, ShouldEqual, c.timeField)
			So(sr.Aggs[0].Key, ShouldEqual, "2")
			So(sr.Aggs[0].Aggregation.Aggregation.(*es.DateHistogramAgg).ExtendedBounds.Min, ShouldEqual, fromStr)
			So(sr.Aggs[0].Aggregation.Aggregation.(*es.DateHistogramAgg).ExtendedBounds.Max, ShouldEqual, toStr)
		})

		Convey("With multiple bucket aggs", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "terms", "field": "@host", "id": "2", "settings": { "size": "0", "order": "asc" } },
					{ "type": "date_histogram", "field": "@timestamp", "id": "3" }
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]
			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "2")
			termsAgg := firstLevel.Aggregation.Aggregation.(*es.TermsAggregation)
			So(termsAgg.Field, ShouldEqual, "@host")
			So(termsAgg.Size, ShouldEqual, 500)
			secondLevel := firstLevel.Aggregation.Aggs[0]
			So(secondLevel.Key, ShouldEqual, "3")
			So(secondLevel.Aggregation.Aggregation.(*es.DateHistogramAgg).Field, ShouldEqual, "@timestamp")
		})

		Convey("With select field", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "2" }
				],
				"metrics": [{"type": "avg", "field": "@value", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]
			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "2")
			So(firstLevel.Aggregation.Aggregation.(*es.DateHistogramAgg).Field, ShouldEqual, "@timestamp")
			secondLevel := firstLevel.Aggregation.Aggs[0]
			So(secondLevel.Key, ShouldEqual, "1")
			So(secondLevel.Aggregation.Type, ShouldEqual, "avg")
			So(secondLevel.Aggregation.Aggregation.(*es.MetricAggregation).Field, ShouldEqual, "@value")
		})

		Convey("With term agg and order by metric agg", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"type": "terms",
						"field": "@host",
						"id": "2",
						"settings": { "size": "5", "order": "asc", "orderBy": "5"	}
					},
					{ "type": "date_histogram", "field": "@timestamp", "id": "3" }
				],
				"metrics": [
					{"type": "count", "id": "1" },
					{"type": "avg", "field": "@value", "id": "5" }
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			avgAggOrderBy := sr.Aggs[0].Aggregation.Aggs[0]
			So(avgAggOrderBy.Key, ShouldEqual, "5")
			So(avgAggOrderBy.Aggregation.Type, ShouldEqual, "avg")

			avgAgg := sr.Aggs[0].Aggregation.Aggs[1].Aggregation.Aggs[0]
			So(avgAgg.Key, ShouldEqual, "5")
			So(avgAgg.Aggregation.Type, ShouldEqual, "avg")
		})

		Convey("With term agg and order by term", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"type": "terms",
						"field": "@host",
						"id": "2",
						"settings": { "size": "5", "order": "asc", "orderBy": "_term"	}
					},
					{ "type": "date_histogram", "field": "@timestamp", "id": "3" }
				],
				"metrics": [
					{"type": "count", "id": "1" },
					{"type": "avg", "field": "@value", "id": "5" }
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "2")
			termsAgg := firstLevel.Aggregation.Aggregation.(*es.TermsAggregation)
			So(termsAgg.Order["_term"], ShouldEqual, "asc")
		})

		Convey("With term agg and order by term with es6.x", func() {
			c := newFakeClient(60)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"type": "terms",
						"field": "@host",
						"id": "2",
						"settings": { "size": "5", "order": "asc", "orderBy": "_term"	}
					},
					{ "type": "date_histogram", "field": "@timestamp", "id": "3" }
				],
				"metrics": [
					{"type": "count", "id": "1" },
					{"type": "avg", "field": "@value", "id": "5" }
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "2")
			termsAgg := firstLevel.Aggregation.Aggregation.(*es.TermsAggregation)
			So(termsAgg.Order["_key"], ShouldEqual, "asc")
		})

		Convey("With metric percentiles", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "3" }
				],
				"metrics": [
					{
						"id": "1",
						"type": "percentiles",
						"field": "@load_time",
						"settings": {
							"percents": [ "1", "2", "3", "4" ]
						}
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			percentilesAgg := sr.Aggs[0].Aggregation.Aggs[0]
			So(percentilesAgg.Key, ShouldEqual, "1")
			So(percentilesAgg.Aggregation.Type, ShouldEqual, "percentiles")
			metricAgg := percentilesAgg.Aggregation.Aggregation.(*es.MetricAggregation)
			percents := metricAgg.Settings["percents"].([]interface{})
			So(percents, ShouldHaveLength, 4)
			So(percents[0], ShouldEqual, "1")
			So(percents[1], ShouldEqual, "2")
			So(percents[2], ShouldEqual, "3")
			So(percents[3], ShouldEqual, "4")
		})

		Convey("With filters aggs on es 2", func() {
			c := newFakeClient(2)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"id": "2",
						"type": "filters",
						"settings": {
							"filters": [ { "query": "@metric:cpu" }, { "query": "@metric:logins.count" } ]
						}
					},
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			filtersAgg := sr.Aggs[0]
			So(filtersAgg.Key, ShouldEqual, "2")
			So(filtersAgg.Aggregation.Type, ShouldEqual, "filters")
			fAgg := filtersAgg.Aggregation.Aggregation.(*es.FiltersAggregation)
			So(fAgg.Filters["@metric:cpu"].(*es.QueryStringFilter).Query, ShouldEqual, "@metric:cpu")
			So(fAgg.Filters["@metric:logins.count"].(*es.QueryStringFilter).Query, ShouldEqual, "@metric:logins.count")

			dateHistogramAgg := sr.Aggs[0].Aggregation.Aggs[0]
			So(dateHistogramAgg.Key, ShouldEqual, "4")
			So(dateHistogramAgg.Aggregation.Aggregation.(*es.DateHistogramAgg).Field, ShouldEqual, "@timestamp")
		})

		Convey("With filters aggs on es 5", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"id": "2",
						"type": "filters",
						"settings": {
							"filters": [ { "query": "@metric:cpu" }, { "query": "@metric:logins.count" } ]
						}
					},
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			filtersAgg := sr.Aggs[0]
			So(filtersAgg.Key, ShouldEqual, "2")
			So(filtersAgg.Aggregation.Type, ShouldEqual, "filters")
			fAgg := filtersAgg.Aggregation.Aggregation.(*es.FiltersAggregation)
			So(fAgg.Filters["@metric:cpu"].(*es.QueryStringFilter).Query, ShouldEqual, "@metric:cpu")
			So(fAgg.Filters["@metric:logins.count"].(*es.QueryStringFilter).Query, ShouldEqual, "@metric:logins.count")

			dateHistogramAgg := sr.Aggs[0].Aggregation.Aggs[0]
			So(dateHistogramAgg.Key, ShouldEqual, "4")
			So(dateHistogramAgg.Aggregation.Aggregation.(*es.DateHistogramAgg).Field, ShouldEqual, "@timestamp")
		})

		Convey("With raw document metric", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [],
				"metrics": [{ "id": "1", "type": "raw_document", "settings": {}	}]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			So(sr.Size, ShouldEqual, 500)
		})

		Convey("With raw document metric size set", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [],
				"metrics": [{ "id": "1", "type": "raw_document", "settings": { "size": 1337 }	}]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			So(sr.Size, ShouldEqual, 1337)
		})

		Convey("With date histogram agg", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"id": "2",
						"type": "date_histogram",
						"field": "@timestamp",
						"settings": { "interval": "auto", "min_doc_count": 2 }
					}
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "2")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")
			hAgg := firstLevel.Aggregation.Aggregation.(*es.DateHistogramAgg)
			So(hAgg.Field, ShouldEqual, "@timestamp")
			So(hAgg.Interval, ShouldEqual, "$__interval")
			So(hAgg.MinDocCount, ShouldEqual, 2)
		})

		Convey("With histogram agg", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"id": "3",
						"type": "histogram",
						"field": "bytes",
						"settings": { "interval": 10, "min_doc_count": 2, "missing": 5 }
					}
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "3")
			So(firstLevel.Aggregation.Type, ShouldEqual, "histogram")
			hAgg := firstLevel.Aggregation.Aggregation.(*es.HistogramAgg)
			So(hAgg.Field, ShouldEqual, "bytes")
			So(hAgg.Interval, ShouldEqual, 10)
			So(hAgg.MinDocCount, ShouldEqual, 2)
			So(*hAgg.Missing, ShouldEqual, 5)
		})

		Convey("With geo hash grid agg", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{
						"id": "3",
						"type": "geohash_grid",
						"field": "@location",
						"settings": { "precision": 3 }
					}
				],
				"metrics": [{"type": "count", "id": "1" }]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "3")
			So(firstLevel.Aggregation.Type, ShouldEqual, "geohash_grid")
			ghGridAgg := firstLevel.Aggregation.Aggregation.(*es.GeoHashGridAggregation)
			So(ghGridAgg.Field, ShouldEqual, "@location")
			So(ghGridAgg.Precision, ShouldEqual, 3)
		})

		Convey("With moving average", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "sum", "field": "@value" },
					{
						"id": "2",
						"type": "moving_avg",
						"field": "3",
						"pipelineAgg": "3"
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")
			So(firstLevel.Aggregation.Aggs, ShouldHaveLength, 2)

			sumAgg := firstLevel.Aggregation.Aggs[0]
			So(sumAgg.Key, ShouldEqual, "3")
			So(sumAgg.Aggregation.Type, ShouldEqual, "sum")
			mAgg := sumAgg.Aggregation.Aggregation.(*es.MetricAggregation)
			So(mAgg.Field, ShouldEqual, "@value")

			movingAvgAgg := firstLevel.Aggregation.Aggs[1]
			So(movingAvgAgg.Key, ShouldEqual, "2")
			So(movingAvgAgg.Aggregation.Type, ShouldEqual, "moving_avg")
			pl := movingAvgAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(pl.BucketPath, ShouldEqual, "3")
		})

		Convey("With moving average doc count", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "count", "field": "select field" },
					{
						"id": "2",
						"type": "moving_avg",
						"field": "3",
						"pipelineAgg": "3"
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")
			So(firstLevel.Aggregation.Aggs, ShouldHaveLength, 1)

			movingAvgAgg := firstLevel.Aggregation.Aggs[0]
			So(movingAvgAgg.Key, ShouldEqual, "2")
			So(movingAvgAgg.Aggregation.Type, ShouldEqual, "moving_avg")
			pl := movingAvgAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(pl.BucketPath, ShouldEqual, "_count")
		})

		Convey("With broken moving average", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "5" }
				],
				"metrics": [
					{ "id": "3", "type": "sum", "field": "@value" },
					{
						"id": "2",
						"type": "moving_avg",
						"pipelineAgg": "3"
					},
					{
						"id": "4",
						"type": "moving_avg",
						"pipelineAgg": "Metric to apply moving average"
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "5")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")

			So(firstLevel.Aggregation.Aggs, ShouldHaveLength, 2)

			movingAvgAgg := firstLevel.Aggregation.Aggs[1]
			So(movingAvgAgg.Key, ShouldEqual, "2")
			plAgg := movingAvgAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(plAgg.BucketPath, ShouldEqual, "3")
		})

		Convey("With derivative", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "sum", "field": "@value" },
					{
						"id": "2",
						"type": "derivative",
						"pipelineAgg": "3"
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")

			derivativeAgg := firstLevel.Aggregation.Aggs[1]
			So(derivativeAgg.Key, ShouldEqual, "2")
			plAgg := derivativeAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(plAgg.BucketPath, ShouldEqual, "3")
		})

		Convey("With derivative doc count", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "count", "field": "select field" },
					{
						"id": "2",
						"type": "derivative",
						"pipelineAgg": "3"
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")

			derivativeAgg := firstLevel.Aggregation.Aggs[0]
			So(derivativeAgg.Key, ShouldEqual, "2")
			plAgg := derivativeAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(plAgg.BucketPath, ShouldEqual, "_count")
		})

		Convey("With bucket_script", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "sum", "field": "@value" },
					{ "id": "5", "type": "max", "field": "@value" },
					{
						"id": "2",
						"type": "bucket_script",
						"pipelineVariables": [
							{ "name": "var1", "pipelineAgg": "3" },
							{ "name": "var2", "pipelineAgg": "5" }
						],
						"settings": { "script": "params.var1 * params.var2" }
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")

			bucketScriptAgg := firstLevel.Aggregation.Aggs[2]
			So(bucketScriptAgg.Key, ShouldEqual, "2")
			plAgg := bucketScriptAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(plAgg.BucketPath.(map[string]interface{}), ShouldResemble, map[string]interface{}{
				"var1": "3",
				"var2": "5",
			})
		})

		Convey("With bucket_script doc count", func() {
			c := newFakeClient(5)
			_, err := executeTsdbQuery(c, `{
				"timeField": "@timestamp",
				"bucketAggs": [
					{ "type": "date_histogram", "field": "@timestamp", "id": "4" }
				],
				"metrics": [
					{ "id": "3", "type": "count", "field": "select field" },
					{
						"id": "2",
						"type": "bucket_script",
						"pipelineVariables": [
							{ "name": "var1", "pipelineAgg": "3" }
						],
						"settings": { "script": "params.var1 * 1000" }
					}
				]
			}`, from, to, 15*time.Second)
			So(err, ShouldBeNil)
			sr := c.multisearchRequests[0].Requests[0]

			firstLevel := sr.Aggs[0]
			So(firstLevel.Key, ShouldEqual, "4")
			So(firstLevel.Aggregation.Type, ShouldEqual, "date_histogram")

			bucketScriptAgg := firstLevel.Aggregation.Aggs[0]
			So(bucketScriptAgg.Key, ShouldEqual, "2")
			plAgg := bucketScriptAgg.Aggregation.Aggregation.(*es.PipelineAggregation)
			So(plAgg.BucketPath.(map[string]interface{}), ShouldResemble, map[string]interface{}{
				"var1": "_count",
			})
		})
	})
}

type fakeClient struct {
	version                 int
	timeField               string
	multiSearchResponse     *es.MultiSearchResponse
	multiSearchError        error
	builder                 *es.MultiSearchRequestBuilder
	multisearchRequests     []*es.MultiSearchRequest
	searchBuilder           *es.SearchRequestBuilder
	searchRequests          []*es.SearchRequest
	searchResponse          *es.SearchResponse
	searchError             error
	getIndexMappingResponse *es.IndexMappingResponse
	getIndexMappingError    error
}

func newFakeClient(version int) *fakeClient {
	return &fakeClient{
		version:                 version,
		timeField:               "@timestamp",
		multisearchRequests:     make([]*es.MultiSearchRequest, 0),
		multiSearchResponse:     &es.MultiSearchResponse{},
		searchRequests:          make([]*es.SearchRequest, 0),
		searchResponse:          &es.SearchResponse{},
		getIndexMappingResponse: &es.IndexMappingResponse{},
	}
}

func (c *fakeClient) GetVersion() int {
	return c.version
}

func (c *fakeClient) GetTimeField() string {
	return c.timeField
}

func (c *fakeClient) GetMinInterval(queryInterval string) (time.Duration, error) {
	return 15 * time.Second, nil
}

func (c *fakeClient) GetMeta() map[string]interface{} {
	return map[string]interface{}{}
}

func (c *fakeClient) ExecuteSearch(r *es.SearchRequest) (*es.SearchResponse, error) {
	c.searchRequests = append(c.searchRequests, r)
	return c.searchResponse, c.searchError
}

func (c *fakeClient) ExecuteMultisearch(r *es.MultiSearchRequest) (*es.MultiSearchResponse, error) {
	c.multisearchRequests = append(c.multisearchRequests, r)
	return c.multiSearchResponse, c.multiSearchError
}

func (c *fakeClient) Search(interval tsdb.Interval) *es.SearchRequestBuilder {
	c.searchBuilder = es.NewSearchRequestBuilder(c.version, interval)
	return c.searchBuilder
}

func (c *fakeClient) MultiSearch() *es.MultiSearchRequestBuilder {
	c.builder = es.NewMultiSearchRequestBuilder(c.version)
	return c.builder
}

func (c *fakeClient) GetIndexMapping() (*es.IndexMappingResponse, error) {
	return c.getIndexMappingResponse, c.getIndexMappingError
}

func newTsdbQuery(body string) (*tsdb.TsdbQuery, error) {
	json, err := simplejson.NewJson([]byte(body))
	if err != nil {
		return nil, err
	}
	return &tsdb.TsdbQuery{
		Queries: []*tsdb.Query{
			{
				Model: json,
			},
		},
	}, nil
}

func executeTsdbQuery(c es.Client, body string, from, to time.Time, minInterval time.Duration) (*tsdb.Response, error) {
	json, err := simplejson.NewJson([]byte(body))
	if err != nil {
		return nil, err
	}
	fromStr := fmt.Sprintf("%d", from.UnixNano()/int64(time.Millisecond))
	toStr := fmt.Sprintf("%d", to.UnixNano()/int64(time.Millisecond))
	tsdbQuery := &tsdb.TsdbQuery{
		Queries: []*tsdb.Query{
			{
				Model: json,
			},
		},
		TimeRange: tsdb.NewTimeRange(fromStr, toStr),
	}
	query := newTimeSeriesQuery(c, tsdbQuery, tsdb.NewIntervalCalculator(&tsdb.IntervalOptions{MinInterval: minInterval}))
	return query.execute()
}

func TestTimeSeriesQueryParser(t *testing.T) {
	Convey("Test time series query parser", t, func() {
		p := newTimeSeriesQueryParser()

		Convey("Should be able to parse query", func() {
			body := `{
				"timeField": "@timestamp",
				"query": "@metric:cpu",
				"alias": "{{@hostname}} {{metric}}",
				"metrics": [
					{
						"field": "@value",
						"id": "1",
						"meta": {},
						"settings": {
							"percents": [
								"90"
							]
						},
						"type": "percentiles"
					},
					{
						"type": "count",
						"field": "select field",
						"id": "4",
						"settings": {},
						"meta": {}
					}
				],
				"bucketAggs": [
					{
						"fake": true,
						"field": "@hostname",
						"id": "3",
						"settings": {
							"min_doc_count": 1,
							"order": "desc",
							"orderBy": "_term",
							"size": "10"
						},
						"type": "terms"
					},
					{
						"field": "@timestamp",
						"id": "2",
						"settings": {
							"interval": "5m",
							"min_doc_count": 0,
							"trimEdges": 0
						},
						"type": "date_histogram"
					}
				]
			}`
			tsdbQuery, err := newTsdbQuery(body)
			So(err, ShouldBeNil)
			queries, err := p.parse(tsdbQuery)
			So(err, ShouldBeNil)
			So(queries, ShouldHaveLength, 1)

			q := queries[0]

			So(q.timeField, ShouldEqual, "@timestamp")
			So(q.queryString, ShouldEqual, "@metric:cpu")
			So(q.alias, ShouldEqual, "{{@hostname}} {{metric}}")

			So(q.metrics, ShouldHaveLength, 2)
			So(q.metrics[0].field, ShouldEqual, "@value")
			So(q.metrics[0].id, ShouldEqual, "1")
			So(q.metrics[0].aggType, ShouldEqual, "percentiles")
			So(q.metrics[0].hide, ShouldBeFalse)
			So(q.metrics[0].pipelineAggregate, ShouldEqual, "")
			So(q.metrics[0].settings.Get("percents").MustStringArray()[0], ShouldEqual, "90")

			So(q.metrics[1].field, ShouldEqual, "select field")
			So(q.metrics[1].id, ShouldEqual, "4")
			So(q.metrics[1].aggType, ShouldEqual, "count")
			So(q.metrics[1].hide, ShouldBeFalse)
			So(q.metrics[1].pipelineAggregate, ShouldEqual, "")
			So(q.metrics[1].settings.MustMap(), ShouldBeEmpty)

			So(q.bucketAggs, ShouldHaveLength, 2)
			So(q.bucketAggs[0].field, ShouldEqual, "@hostname")
			So(q.bucketAggs[0].id, ShouldEqual, "3")
			So(q.bucketAggs[0].aggType, ShouldEqual, "terms")
			So(q.bucketAggs[0].settings.Get("min_doc_count").MustInt64(), ShouldEqual, 1)
			So(q.bucketAggs[0].settings.Get("order").MustString(), ShouldEqual, "desc")
			So(q.bucketAggs[0].settings.Get("orderBy").MustString(), ShouldEqual, "_term")
			So(q.bucketAggs[0].settings.Get("size").MustString(), ShouldEqual, "10")

			So(q.bucketAggs[1].field, ShouldEqual, "@timestamp")
			So(q.bucketAggs[1].id, ShouldEqual, "2")
			So(q.bucketAggs[1].aggType, ShouldEqual, "date_histogram")
			So(q.bucketAggs[1].settings.Get("interval").MustString(), ShouldEqual, "5m")
			So(q.bucketAggs[1].settings.Get("min_doc_count").MustInt64(), ShouldEqual, 0)
			So(q.bucketAggs[1].settings.Get("trimEdges").MustInt64(), ShouldEqual, 0)
		})
	})
}
