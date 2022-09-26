// This file is autogenerated. DO NOT EDIT.
//
// Generated by public/app/plugins/gen.go
//
// Derived from the Thema lineage declared in models.cue
//
// Run `make gen-cue` from repository root to regenerate.



import * as ui from '@grafana/schema';

export const PanelModelVersion = Object.freeze([0, 0]);

export interface PanelOptions extends ui.SingleStatBaseOptions {
  showThresholdLabels: boolean;
  showThresholdMarkers: boolean;
}

export const defaultPanelOptions: Partial<PanelOptions> = {
  showThresholdLabels: false,
  showThresholdMarkers: true,
};
