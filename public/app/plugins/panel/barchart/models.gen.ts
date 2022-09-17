// This file is autogenerated. DO NOT EDIT.
//
// Generated by public/app/plugins/gen.go
//
// Derived from the Thema lineage declared in models.cue
//
// Run `make gen-cue` from repository root to regenerate.


import * as ui from '@grafana/schema';

export const PanelModelVersion = Object.freeze([0, 0]);


export interface PanelOptions extends ui.OptionsWithLegend, ui.OptionsWithTooltip, ui.OptionsWithTextFormatting {
  barRadius?: number;
  barWidth: number;
  colorByField?: string;
  groupWidth: number;
  orientation: ui.VizOrientation;
  showValue: ui.VisibilityMode;
  stacking: ui.StackingMode;
  xField?: string;
  xTickLabelMaxLength: number;
  xTickLabelRotation: number;
  xTickLabelSpacing?: number;
}

export const defaultPanelOptions: Partial<PanelOptions> = {
  barRadius: 0,
  barWidth: 0.97,
  groupWidth: 0.7,
  orientation: ui.VizOrientation.Auto,
  showValue: ui.VisibilityMode.Auto,
  stacking: ui.StackingMode.None,
  xTickLabelRotation: 0,
  xTickLabelSpacing: 0,
};

export interface PanelFieldConfig extends ui.AxisConfig, ui.HideableFieldConfig {
  fillOpacity?: number;
  gradientMode?: ui.GraphGradientMode;
  lineWidth?: number;
}

export const defaultPanelFieldConfig: Partial<PanelFieldConfig> = {
  fillOpacity: 80,
  gradientMode: ui.GraphGradientMode.None,
  lineWidth: 1,
};

