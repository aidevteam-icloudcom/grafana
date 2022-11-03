// Raw generated types from Dashboard kind.
export type {
  AnnotationTarget,
  AnnotationQuery,
  VariableModel,
  DashboardLink,
  DashboardLinkType,
  VariableType,
  FieldColorModeId,
  FieldColorSeriesByMode,
  FieldColor,
  GridPos,
  Threshold,
  ThresholdsMode,
  ThresholdsConfig,
  ValueMapping,
  MappingType,
  ValueMap,
  RangeMap,
  RegexMap,
  SpecialValueMap,
  SpecialValueMatch,
  ValueMappingResult,
  Transformation,
  DashboardCursorSync,
  MatcherConfig,
  RowPanel
} from './raw/dashboard/x/dashboard_types.gen';

// Raw generated default consts from dashboard kind.
export {
  defaultAnnotationTarget,
  defaultAnnotationQuery,
  defaultDashboardLink,
  defaultGridPos,
  defaultThresholdsConfig,
  defaultDashboardCursorSync,
  defaultMatcherConfig,
  defaultRowPanel
} from './raw/dashboard/x/dashboard_types.gen';

// The following exported declarations correspond to types in the dashboard@0.0 kind's
// schema with attribute @grafana(TSVeneer="type").
//
// The handwritten file for these type and default veneers is expected to be at
// packages/grafana-schema/src/veneer/dashboard.types.ts.
// This re-export declaration enforces that the handwritten veneer file exists,
// and exports all the symbols in the list.
//
// TODO generate code such that tsc enforces type compatibility between raw and veneer decls
export type {
  Dashboard,
  Panel,
  FieldConfigSource,
  FieldConfig
} from './veneer/dashboard.types';

// The following exported declarations correspond to types in the dashboard@0.0 kind's
// schema with attribute @grafana(TSVeneer="type").
//
// The handwritten file for these type and default veneers is expected to be at
// packages/grafana-schema/src/veneer/dashboard.types.ts.
// This re-export declaration enforces that the handwritten veneer file exists,
// and exports all the symbols in the list.
//
// TODO generate code such that tsc enforces type compatibility between raw and veneer decls
export {
  defaultDashboard,
  defaultPanel,
  defaultFieldConfigSource,
  defaultFieldConfig
} from './veneer/dashboard.types';

// Raw generated types from Playlist kind.
export type {
  Playlist,
  PlaylistItem
} from './raw/playlist/x/playlist_types.gen';

// Raw generated default consts from playlist kind.
export { defaultPlaylist } from './raw/playlist/x/playlist_types.gen';
