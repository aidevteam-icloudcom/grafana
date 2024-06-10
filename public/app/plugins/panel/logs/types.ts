import { DataFrame } from '@grafana/data';

export { Options } from './panelcfg.gen';

type onClickFilterLabelType = (key: string, value: string, frame?: DataFrame) => void;
type onClickFilterOutLabelType = (key: string, value: string, frame?: DataFrame) => void;
type onClickFilterValueType = (value: string, refId?: string) => void;
type onClickFilterOutValueType = (value: string, refId?: string) => void;
type isFilterLabelActiveType = (key: string, value: string, refId?: string) => Promise<boolean>;

export function isOnClickFilterLabel(callback: unknown): callback is onClickFilterLabelType {
  return typeof callback === 'function';
}

export function isOnClickFilterOutLabel(callback: unknown): callback is onClickFilterOutLabelType {
  return typeof callback === 'function';
}

export function isOnClickFilterValue(callback: unknown): callback is onClickFilterValueType {
  return typeof callback === 'function';
}

export function isOnClickFilterOutValue(callback: unknown): callback is onClickFilterOutValueType {
  return typeof callback === 'function';
}

export function isIsFilterLabelActive(callback: unknown): callback is isFilterLabelActiveType {
  return typeof callback === 'function';
}
