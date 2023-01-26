import { PreferredVisualisationType } from './data';
import { DataQuery } from './query';
import { RawTimeRange, TimeRange } from './time';

type AnyQuery = DataQuery & Record<string, any>;

/** @internal */
export interface ExploreUrlState<T extends DataQuery = AnyQuery> {
  datasource: string;
  queries: T[];
  range: RawTimeRange;
  context?: string;
  panelsState?: ExplorePanelsState;
  isFromCompactUrl?: boolean;
}

export interface ExplorePanelsState extends Partial<Record<PreferredVisualisationType, {}>> {
  trace?: ExploreTracePanelState;
}

export interface ExploreTracePanelState {
  spanId?: string;
}

export interface SplitOpenOptions<T> {
  datasourceUid: string;
  query: T | T[];
  range?: TimeRange;
  panelsState?: ExplorePanelsState;
}

/**
 * SplitOpen type is used in Explore and related components.
 */
export type SplitOpen = <T extends DataQuery = any>(options?: SplitOpenOptions<T> | undefined) => void;
