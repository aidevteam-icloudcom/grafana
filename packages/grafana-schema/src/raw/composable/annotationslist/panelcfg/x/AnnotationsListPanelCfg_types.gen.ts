// Code generated - EDITING IS FUTILE. DO NOT EDIT.
//
// Generated by:
//     public/app/plugins/gen.go
// Using jennies:
//     TSTypesJenny
//     LatestMajorsOrXJenny
//     PluginEachMajorJenny
//
// Run 'make gen-cue' from repository root to regenerate.

export const pluginVersion = "10.1.11";

export interface Options {
  limit: number;
  navigateAfter: string;
  navigateBefore: string;
  navigateToPanel: boolean;
  onlyFromThisDashboard: boolean;
  onlyInTimeRange: boolean;
  showTags: boolean;
  showTime: boolean;
  showUser: boolean;
  tags: Array<string>;
}

export const defaultOptions: Partial<Options> = {
  limit: 10,
  navigateAfter: '10m',
  navigateBefore: '10m',
  navigateToPanel: true,
  onlyFromThisDashboard: false,
  onlyInTimeRange: false,
  showTags: true,
  showTime: true,
  showUser: true,
  tags: [],
};
