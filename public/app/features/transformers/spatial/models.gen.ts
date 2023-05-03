import { FrameGeometrySource, FrameGeometrySourceMode } from '@grafana/schema';

// This file should be generated by cue schema

export enum SpatialAction {
  Prepare = 'prepare',
  Calculate = 'calculate',
  Modify = 'modify',
}

export enum SpatialCalculation {
  Heading = 'heading',
  Distance = 'distance',
  Area = 'area',
}

export enum SpatialOperation {
  AsLine = 'asLine',
  LineBuilder = 'lineBuilder',
}

export interface SpatialCalculationOption {
  calc?: SpatialCalculation;
  field?: string;
}

export interface ModifyOptions {
  op: SpatialOperation;
  target?: FrameGeometrySource;
}

/** The main transformer options */
export interface SpatialTransformOptions {
  action?: SpatialAction;
  source?: FrameGeometrySource;
  calculate?: SpatialCalculationOption;
  modify?: ModifyOptions;
}

export const defaultOptions: SpatialTransformOptions = {
  action: SpatialAction.Prepare,
  source: {
    mode: FrameGeometrySourceMode.Auto,
  },
};
