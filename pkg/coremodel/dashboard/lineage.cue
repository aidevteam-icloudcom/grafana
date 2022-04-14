package dashboard

import "github.com/grafana/thema"

thema.#Lineage
name: "dashboard"
seqs: [
	{
		schemas: [
			{ // 0.0
                // Unique numeric identifier for the dashboard.
                // TODO must isolate or remove identifiers local to a Grafana instance...?
                id?: int64
                // Unique dashboard identifier that can be generated by anyone. string (8-40)
                uid?: string
                // Title of dashboard.
                title?: string
                // Description of dashboard.
                description?: string

                gnetId?: string
                // Tags associated with dashboard.
                tags?: [...string]
                // Theme of dashboard.
                style: *"light" | "dark"
                // Timezone of dashboard,
                timezone?: *"browser" | "utc" | ""
                // Whether a dashboard is editable or not.
                editable: bool | *true
                // 0 for no shared crosshair or tooltip (default).
                // 1 for shared crosshair.
                // 2 for shared crosshair AND shared tooltip.
                graphTooltip: uint8 & >=0 & <=2 | *0
                // Time range for dashboard, e.g. last 6 hours, last 7 days, etc
                time?: {
                    from: string | *"now-6h"
                    to:   string | *"now"
                }
                // Timepicker metadata.
                timepicker?: {
                    // Whether timepicker is collapsed or not.
                    collapse: bool | *false
                    // Whether timepicker is enabled or not.
                    enable: bool | *true
                    // Whether timepicker is visible or not.
                    hidden: bool | *false
                    // Selectable intervals for auto-refresh.
                    refresh_intervals: [...string] | *["5s", "10s", "30s", "1m", "5m", "15m", "30m", "1h", "2h", "1d"]
                }
                // Templating.
                templating?: list: [...{...}]
                // Annotations.
                annotations?: list: [...{
                    builtIn: uint8 | *0
                    // Datasource to use for annotation.
                    datasource: {
                    	type?: string
                    	uid?: string
                    }
                    // Whether annotation is enabled.
                    enable: bool | *true
                    // Whether to hide annotation.
                    hide?: bool | *false
                    // Annotation icon color.
                    iconColor?: string
                    // Name of annotation.
                    name?: string
                    type: string | *"dashboard"
                    // Query for annotation data.
                    rawQuery?: string
                    showIn:   uint8 | *0
                }]
                // Auto-refresh interval.
                refresh?: string | false
                // Version of the JSON schema, incremented each time a Grafana update brings
                // changes to said schema.
                // FIXME this is the old schema numbering system, and will be replaced by Thema's themaVersion
                schemaVersion: uint16 | *33
                // Version of the dashboard, incremented each time the dashboard is updated.
                version?: uint32
                panels?: [...(#Panel | #GraphPanel | #HeatmapPanel | #RowPanel)]

                // TODO docs
                #FieldColorModeId: "thresholds" | "palette-classic" | "palette-saturated" | "continuous-GrYlRd" | "fixed" @cuetsy(kind="enum")

                // TODO docs
                #FieldColorSeriesByMode: "min" | "max" | "last" @cuetsy(kind="type")

                // TODO docs
                #FieldColor: {
                    // The main color scheme mode
                    mode: #FieldColorModeId | string
                    // Stores the fixed color value if mode is fixed
                    fixedColor?: string
                    // Some visualizations need to know how to assign a series color from by value color schemes
                    seriesBy?: #FieldColorSeriesByMode
                } @cuetsy(kind="interface")

                // TODO docs
                #Threshold: {
                    // TODO docs
                    // FIXME the corresponding typescript field is required/non-optional, but nulls currently appear here when serializing -Infinity to JSON
                    value?: number
                    // TODO docs
                    color: string
                    // TODO docs
                    // TODO are the values here enumerable into a disjunction?
                    // Some seem to be listed in typescript comment
                    state?: string
                } @cuetsy(kind="interface")

                #ThresholdsMode: "absolute" | "percentage" @cuetsy(kind="enum")

                #ThresholdsConfig: {
                    mode: #ThresholdsMode

                    // Must be sorted by 'value', first value is always -Infinity
                    steps: [...#Threshold]
                } @cuetsy(kind="interface")

                // TODO docs
                // FIXME this is extremely underspecfied; wasn't obvious which typescript types corresponded to it
                #Transformation: {
                    id: string
                    options: {...}
                }

                // Schema for panel targets is specified by datasource
                // plugins. We use a placeholder definition, which the Go
                // schema loader either left open/as-is with the Base
                // variant of the Dashboard and Panel families, or filled
                // with types derived from plugins in the Instance variant.
                // When working directly from CUE, importers can extend this
                // type directly to achieve the same effect.
                #Target: {...}

                // Dashboard panels. Panels are canonically defined inline
                // because they share a version timeline with the dashboard
                // schema; they do not evolve independently.
                #Panel: {
                    // The panel plugin type id.
                    type: !=""

                    // TODO docs
                    id?: uint32

                    // FIXME this almost certainly has to be changed in favor of scuemata versions
                    pluginVersion?: string

                    // TODO docs
                    tags?: [...string]

                    // Internal - the exact major and minor versions of the panel plugin
                    // schema. Hidden and therefore not a part of the data model, but
                    // expected to be filled with panel plugin schema versions so that it's
                    // possible to figure out which schema version matched on a successful
                    // unification.
                    // _pv: { maj: int, min: int }
                    // The major and minor versions of the panel plugin for this schema.
                    // TODO 2-tuple list instead of struct?
                    // panelSchema?: { maj: number, min: number }
                    panelSchema?: [number, number]

                    // TODO docs
                    targets?: [...#Target]

                    // Panel title.
                    title?: string
                    // Description.
                    description?: string
                    // Whether to display the panel without a background.
                    transparent: bool | *false
                    // The datasource used in all targets.
                    datasource?: {
                      type?: string
                      uid?: string
                    }
                    // Grid position.
                    gridPos?: {
                        // Panel
                        h: uint32 & >0 | *9
                        // Panel
                        w: uint32 & >0 & <=24 | *12
                        // Panel x
                        x: uint32 & >=0 & <24 | *0
                        // Panel y
                        y: uint32 & >=0 | *0
                        // true if fixed
                        static?: bool
                    }
                    // Panel links.
                    // FIXME this is temporarily specified as a closed list so
                    // that validation will pass when no links are present, but
                    // to force a failure as soon as it's checked against there
                    // being anything in the list so it can be fixed in
                    // accordance with that object
                    links?: []

                    // Name of template variable to repeat for.
                    repeat?: string
                    // Direction to repeat in if 'repeat' is set.
                    // "h" for horizontal, "v" for vertical.
                    repeatDirection: *"h" | "v"

                    // TODO docs
                    maxDataPoints?: number

                    // TODO docs
                    thresholds?: [...]

                    // TODO docs
                    timeRegions?: [...]

                    transformations: [...#Transformation]

                    // TODO docs
                    // TODO tighter constraint
                    interval?: string

                    // TODO docs
                    // TODO tighter constraint
                    timeFrom?: string

                    // TODO docs
                    // TODO tighter constraint
                    timeShift?: string

                    // options is specified by the PanelOptions field in panel
                    // plugin schemas.
                    options: {...}

                    fieldConfig: {
                        defaults: {
                            // The display value for this field.  This supports template variables blank is auto
                            displayName?: string

                            // This can be used by data sources that return and explicit naming structure for values and labels
                            // When this property is configured, this value is used rather than the default naming strategy.
                            displayNameFromDS?: string

                            // Human readable field metadata
                            description?: string

                            // An explict path to the field in the datasource.  When the frame meta includes a path,
                            // This will default to `${frame.meta.path}/${field.name}
                            //
                            // When defined, this value can be used as an identifier within the datasource scope, and
                            // may be used to update the results
                            path?: string

                            // True if data source can write a value to the path.  Auth/authz are supported separately
                            writeable?: bool

                            // True if data source field supports ad-hoc filters
                            filterable?: bool

                            // Numeric Options
                            unit?: string

                            // Significant digits (for display)
                            decimals?: number

                            min?: number
                            max?: number

                            // Convert input values into a display string
                            //
                            // TODO this one corresponds to a complex type with
                            // generics on the typescript side. Ouch. Will
                            // either need special care, or we'll just need to
                            // accept a very loosely specified schema. It's very
                            // unlikely we'll be able to translate cue to
                            // typescript generics in the general case, though
                            // this particular one *may* be able to work.
                            mappings?: [...{...}]

                            // Map numeric values to states
                            thresholds?: #ThresholdsConfig

                            //   // Map values to a display color
                            color?: #FieldColor

                            //   // Used when reducing field values
                            //   nullValueMode?: NullValueMode

                            //   // The behavior when clicking on a result
                            links?: [...]

                            // Alternative to empty string
                            noValue?: string

                            // custom is specified by the PanelFieldConfig field
                            // in panel plugin schemas.
                            custom?: {...}
                        }
                        overrides: [...{
                            matcher: {
                                id: string | *""
                                options?: _
                            }
                            properties: [...{
                                id: string | *""
                                value?: _
                            }]
                        }]
                    }
                }

                // Row panel
                #RowPanel: {
                    type: "row"
                    collapsed: bool | *false
                    title?: string

                    // Name of default datasource.
                    datasource?: {
                    	type?: string
                    	uid?: string
                    }

                    gridPos?: {
                        // Panel
                        h: uint32 & >0 | *9
                        // Panel
                        w: uint32 & >0 & <=24 | *12
                        // Panel x
                        x: uint32 & >=0 & <24 | *0
                        // Panel y
                        y: uint32 & >=0 | *0
                        // true if fixed
                        static?: bool
                    }
                    id: uint32
                    panels: [...(#Panel | #GraphPanel | #HeatmapPanel)]
                    // Name of template variable to repeat for.
                    repeat?: string
                }
                // Support for legacy graph and heatmap panels.
                #GraphPanel: {
                    ...
                    type: "graph"
                }
                #HeatmapPanel: {
                    ...
                    type: "heatmap"
                }
            }
				]
    }
]
