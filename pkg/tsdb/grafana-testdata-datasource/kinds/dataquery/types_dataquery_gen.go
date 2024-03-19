// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     PluginGoTypesJenny
//
// Run 'make gen-cue' from repository root to regenerate.

package dataquery

// Defines values for NodesQueryType.
const (
	NodesQueryTypeRandom         NodesQueryType = "random"
	NodesQueryTypeRandomEdges    NodesQueryType = "random edges"
	NodesQueryTypeResponseMedium NodesQueryType = "response_medium"
	NodesQueryTypeResponseSmall  NodesQueryType = "response_small"
)

// Defines values for StreamingQueryType.
const (
	StreamingQueryTypeFetch  StreamingQueryType = "fetch"
	StreamingQueryTypeLogs   StreamingQueryType = "logs"
	StreamingQueryTypeSignal StreamingQueryType = "signal"
	StreamingQueryTypeTraces StreamingQueryType = "traces"
)

// Defines values for TestDataDataQueryErrorType.
const (
	TestDataDataQueryErrorTypeFrontendException  TestDataDataQueryErrorType = "frontend_exception"
	TestDataDataQueryErrorTypeFrontendObservable TestDataDataQueryErrorType = "frontend_observable"
	TestDataDataQueryErrorTypeServerPanic        TestDataDataQueryErrorType = "server_panic"
)

// Defines values for TestDataQueryType.
const (
	TestDataQueryTypeAnnotations                  TestDataQueryType = "annotations"
	TestDataQueryTypeArrow                        TestDataQueryType = "arrow"
	TestDataQueryTypeCsvContent                   TestDataQueryType = "csv_content"
	TestDataQueryTypeCsvFile                      TestDataQueryType = "csv_file"
	TestDataQueryTypeCsvMetricValues              TestDataQueryType = "csv_metric_values"
	TestDataQueryTypeDatapointsOutsideRange       TestDataQueryType = "datapoints_outside_range"
	TestDataQueryTypeExponentialHeatmapBucketData TestDataQueryType = "exponential_heatmap_bucket_data"
	TestDataQueryTypeFlameGraph                   TestDataQueryType = "flame_graph"
	TestDataQueryTypeGrafanaApi                   TestDataQueryType = "grafana_api"
	TestDataQueryTypeLinearHeatmapBucketData      TestDataQueryType = "linear_heatmap_bucket_data"
	TestDataQueryTypeLive                         TestDataQueryType = "live"
	TestDataQueryTypeLogs                         TestDataQueryType = "logs"
	TestDataQueryTypeManualEntry                  TestDataQueryType = "manual_entry"
	TestDataQueryTypeNoDataPoints                 TestDataQueryType = "no_data_points"
	TestDataQueryTypeNodeGraph                    TestDataQueryType = "node_graph"
	TestDataQueryTypePredictableCsvWave           TestDataQueryType = "predictable_csv_wave"
	TestDataQueryTypePredictablePulse             TestDataQueryType = "predictable_pulse"
	TestDataQueryTypeRandomWalk                   TestDataQueryType = "random_walk"
	TestDataQueryTypeRandomWalkTable              TestDataQueryType = "random_walk_table"
	TestDataQueryTypeRandomWalkWithError          TestDataQueryType = "random_walk_with_error"
	TestDataQueryTypeRawFrame                     TestDataQueryType = "raw_frame"
	TestDataQueryTypeServerError500               TestDataQueryType = "server_error_500"
	TestDataQueryTypeSimulation                   TestDataQueryType = "simulation"
	TestDataQueryTypeSlowQuery                    TestDataQueryType = "slow_query"
	TestDataQueryTypeStreamingClient              TestDataQueryType = "streaming_client"
	TestDataQueryTypeTableStatic                  TestDataQueryType = "table_static"
	TestDataQueryTypeTrace                        TestDataQueryType = "trace"
	TestDataQueryTypeUsa                          TestDataQueryType = "usa"
	TestDataQueryTypeVariablesQuery               TestDataQueryType = "variables-query"
)

// CSVWave defines model for CSVWave.
type CSVWave struct {
	Labels    *string `json:"labels,omitempty"`
	Name      *string `json:"name,omitempty"`
	TimeStep  *int64  `json:"timeStep,omitempty"`
	ValuesCSV *string `json:"valuesCSV,omitempty"`
}

// These are the common properties available to all queries in all datasources.
// Specific implementations will *extend* this interface, adding the required
// properties for the given context.
type DataQuery struct {
	// For mixed data sources the selected datasource is on the query level.
	// For non mixed scenarios this is undefined.
	// TODO find a better way to do this ^ that's friendly to schema
	// TODO this shouldn't be unknown but DataSourceRef | null
	Datasource *any `json:"datasource,omitempty"`

	// Hide true if query is disabled (ie should not be returned to the dashboard)
	// Note this does not always imply that the query should not be executed since
	// the results from a hidden query may be used as the input to other queries (SSE etc)
	Hide *bool `json:"hide,omitempty"`

	// Specify the query flavor
	// TODO make this required and give it a default
	QueryType *string `json:"queryType,omitempty"`

	// A unique identifier for the query within the list of targets.
	// In server side expressions, the refId is used as a variable name to identify results.
	// By default, the UI will assign A->Z; however setting meaningful names may be useful.
	RefId string `json:"refId"`
}

// NodesQuery defines model for NodesQuery.
type NodesQuery struct {
	Count *int64          `json:"count,omitempty"`
	Seed  *int64          `json:"seed,omitempty"`
	Type  *NodesQueryType `json:"type,omitempty"`
}

// NodesQueryType defines model for NodesQuery.Type.
type NodesQueryType string

// PulseWaveQuery defines model for PulseWaveQuery.
type PulseWaveQuery struct {
	OffCount *int64   `json:"offCount,omitempty"`
	OffValue *float64 `json:"offValue,omitempty"`
	OnCount  *int64   `json:"onCount,omitempty"`
	OnValue  *float64 `json:"onValue,omitempty"`
	TimeStep *int64   `json:"timeStep,omitempty"`
}

// TODO: Should this live here given it's not used in the dataquery?
type Scenario struct {
	Description    *string `json:"description,omitempty"`
	HideAliasField *bool   `json:"hideAliasField,omitempty"`
	Id             string  `json:"id"`
	Name           string  `json:"name"`
	StringInput    string  `json:"stringInput"`
}

// SimulationQuery defines model for SimulationQuery.
type SimulationQuery struct {
	Config map[string]any `json:"config,omitempty"`
	Key    struct {
		Tick float64 `json:"tick"`
		Type string  `json:"type"`
		Uid  *string `json:"uid,omitempty"`
	} `json:"key"`
	Last   *bool `json:"last,omitempty"`
	Stream *bool `json:"stream,omitempty"`
}

// StreamingQuery defines model for StreamingQuery.
type StreamingQuery struct {
	Bands  *int32             `json:"bands,omitempty"`
	Noise  int32              `json:"noise"`
	Speed  int32              `json:"speed"`
	Spread int32              `json:"spread"`
	Type   StreamingQueryType `json:"type"`
	Url    *string            `json:"url,omitempty"`
}

// StreamingQueryType defines model for StreamingQuery.Type.
type StreamingQueryType string

// TestDataDataQuery defines model for TestDataDataQuery.
type TestDataDataQuery struct {
	Alias       *string   `json:"alias,omitempty"`
	Channel     *string   `json:"channel,omitempty"`
	CsvContent  *string   `json:"csvContent,omitempty"`
	CsvFileName *string   `json:"csvFileName,omitempty"`
	CsvWave     []CSVWave `json:"csvWave,omitempty"`

	// For mixed data sources the selected datasource is on the query level.
	// For non mixed scenarios this is undefined.
	// TODO find a better way to do this ^ that's friendly to schema
	// TODO this shouldn't be unknown but DataSourceRef | null
	Datasource *any `json:"datasource,omitempty"`

	// Drop percentage (the chance we will lose a point 0-100)
	DropPercent    *float64                    `json:"dropPercent,omitempty"`
	ErrorType      *TestDataDataQueryErrorType `json:"errorType,omitempty"`
	FlamegraphDiff *bool                       `json:"flamegraphDiff,omitempty"`

	// Hide true if query is disabled (ie should not be returned to the dashboard)
	// Note this does not always imply that the query should not be executed since
	// the results from a hidden query may be used as the input to other queries (SSE etc)
	Hide        *bool           `json:"hide,omitempty"`
	Labels      *string         `json:"labels,omitempty"`
	LevelColumn *bool           `json:"levelColumn,omitempty"`
	Lines       *int64          `json:"lines,omitempty"`
	Nodes       *NodesQuery     `json:"nodes,omitempty"`
	Points      [][]any         `json:"points,omitempty"`
	PulseWave   *PulseWaveQuery `json:"pulseWave,omitempty"`

	// Specify the query flavor
	// TODO make this required and give it a default
	QueryType       *string `json:"queryType,omitempty"`
	RawFrameContent *string `json:"rawFrameContent,omitempty"`

	// A unique identifier for the query within the list of targets.
	// In server side expressions, the refId is used as a variable name to identify results.
	// By default, the UI will assign A->Z; however setting meaningful names may be useful.
	RefId       *string            `json:"refId,omitempty"`
	ScenarioId  *TestDataQueryType `json:"scenarioId,omitempty"`
	SeriesCount *int32             `json:"seriesCount,omitempty"`
	Sim         *SimulationQuery   `json:"sim,omitempty"`
	SpanCount   *int32             `json:"spanCount,omitempty"`
	Stream      *StreamingQuery    `json:"stream,omitempty"`
	StringInput *string            `json:"stringInput,omitempty"`
	Usa         *USAQuery          `json:"usa,omitempty"`
}

// TestDataDataQueryErrorType defines model for TestDataDataQuery.ErrorType.
type TestDataDataQueryErrorType string

// TestDataQueryType defines model for TestDataQueryType.
type TestDataQueryType string

// USAQuery defines model for USAQuery.
type USAQuery struct {
	Fields []string `json:"fields,omitempty"`
	Mode   *string  `json:"mode,omitempty"`
	Period *string  `json:"period,omitempty"`
	States []string `json:"states,omitempty"`
}
