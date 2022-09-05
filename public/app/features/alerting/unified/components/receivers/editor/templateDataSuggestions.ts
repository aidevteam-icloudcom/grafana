import type { Monaco } from '@grafana/ui';

import {
  alertDetailsSnippet,
  alertsLoopSnippet,
  annotationsLoopSnippet,
  commonAnnotationsLoopSnippet,
  commonLabelsLoopSnippet,
  groupLabelsLoopSnippet,
  labelsLoopSnippet,
} from './snippets';
import { SuggestionDefinition } from './suggestionDefinition';

// Suggestions available at the top level of a template
export function getGlobalSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    {
      label: 'Alerts',
      kind,
      detail: 'Alert[]',
      documentation: { value: 'An Array containing all alerts' },
    },
    { label: 'Receiver', kind, detail: 'string' },
    { label: 'Status', kind, detail: 'string' },
    { label: 'GroupLabels', kind, detail: '[]KeyValue' },
    { label: 'CommonLabels', kind, detail: '[]KeyValue' },
    { label: 'CommonAnnotations', kind, detail: '[]KeyValue' },
    { label: 'ExternalURL', kind, detail: 'string' },
  ];
}

// Suggestions that are valid only in the scope of an alert (e.g. in the .Alerts loop)
export function getAlertSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    {
      label: { label: 'Status', detail: '(Alert)', description: 'string' },
      kind,
      detail: 'string',
      documentation: { value: 'Status of the alert. It can be `firing` or `resolved`' },
    },
    {
      label: { label: 'Labels', detail: '(Alert)' },
      kind,
      detail: '[]KeyValue',
      documentation: { value: 'A set of labels attached to the alert.' },
    },
    {
      label: { label: 'Annotations', detail: '(Alert)' },
      kind,
      detail: '[]KeyValue',
      documentation: 'A set of annotations attached to the alert.',
    },
    {
      label: { label: 'StartsAt', detail: '(Alert)' },
      kind,
      detail: 'time.Time',
      documentation: 'Time the alert started firing.',
    },
    {
      label: { label: 'EndsAt', detail: '(Alert)' },
      kind,
      detail: 'time.Time',
      documentation:
        'Only set if the end time of an alert is known. Otherwise set to a configurable timeout period from the time since the last alert was received.',
    },
    {
      label: { label: 'GeneratorURL', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation: 'A back link to Grafana or external Alertmanager.',
    },
    {
      label: { label: 'SilenceURL', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation:
        'Link to grafana silence for with labels for this alert pre-filled. Only for Grafana managed alerts.',
    },
    {
      label: { label: 'DashboardURL', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation: 'Link to grafana dashboard, if alert rule belongs to one. Only for Grafana managed alerts.',
    },
    {
      label: { label: 'PanelURL', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation: 'Link to grafana dashboard panel, if alert rule belongs to one. Only for Grafana managed alerts.',
    },
    {
      label: { label: 'Fingerprint', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation: 'Fingerprint that can be used to identify the alert.',
    },
    {
      label: { label: 'ValueString', detail: '(Alert)' },
      kind,
      detail: 'string',
      documentation: 'A string that contains the labels and value of each reduced expression in the alert.',
    },
  ];
}

// Suggestions for .Alerts
export function getAlertsSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    { label: 'Firing', kind, detail: 'Alert[]' },
    { label: 'Resolved', kind, detail: 'Alert[]' },
  ];
}

// Suggestions for the KeyValue types
export function getKeyValueSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const kind = monaco.languages.CompletionItemKind.Field;

  return [
    { label: 'SortedPairs', kind, detail: '[]KeyValue' },
    { label: 'Names', kind, detail: '[]string' },
    { label: 'Values', kind, detail: '[]string' },
    {
      label: 'Remove',
      detail: 'KeyValue[] function(keys []string)',
      kind: monaco.languages.CompletionItemKind.Method,
    },
  ];
}

// Snippets
export function getSnippetsSuggestions(monaco: Monaco): SuggestionDefinition[] {
  const snippetKind = monaco.languages.CompletionItemKind.Snippet;
  const snippetInsertRule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

  return [
    {
      label: 'alertsloop',
      documentation: 'Renders a loop through alerts',
      kind: snippetKind,
      insertText: alertsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: {
        label: 'alertdetails',
        detail: '(Alert)',
      },
      documentation: 'Renders all the information available about the alert',
      kind: snippetKind,
      insertText: alertDetailsSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: 'grouplabelsloop',
      documentation: 'Renders a loop through group labels',
      kind: snippetKind,
      insertText: groupLabelsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: 'commonlabelsloop',
      documentation: 'Renders a loop through common labels',
      kind: snippetKind,
      insertText: commonLabelsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: 'commonannotationsloop',
      documentation: 'Renders a loop through common annotations',
      kind: snippetKind,
      insertText: commonAnnotationsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: { label: 'labelsloop', detail: '(Alert)' },
      documentation: 'Renders a loop through labels',
      kind: snippetKind,
      insertText: labelsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
    {
      label: { label: 'annotationsloop', detail: '(Alert)' },
      documentation: 'Renders a loop through annotations',
      kind: snippetKind,
      insertText: annotationsLoopSnippet,
      insertTextRules: snippetInsertRule,
    },
  ];
}
