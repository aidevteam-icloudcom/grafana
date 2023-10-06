import { createDashboardModelFixture, createPanelJSONFixture } from '../../state/__fixtures__/dashboardFixtures';

import { openai } from './llms';
import { getDashboardChanges, isLLMPluginEnabled } from './utils';

// Mock the llms.openai module
jest.mock('./llms', () => ({
  openai: {
    streamChatCompletions: jest.fn(),
    accumulateContent: jest.fn(),
    enabled: jest.fn(),
  },
}));

describe('getDashboardChanges', () => {
  it('should correctly split user changes and migration changes', () => {
    // Mock data for testing
    const deprecatedOptions = {
      legend: { displayMode: 'hidden', showLegend: false },
    };
    const deprecatedVersion = 37;
    const dashboard = createDashboardModelFixture({
      schemaVersion: deprecatedVersion,
      panels: [createPanelJSONFixture({ title: 'Panel 1', options: deprecatedOptions })],
    });

    // Update title for the first panel
    dashboard.updatePanels([
      {
        ...dashboard.panels[0],
        title: 'New title',
      },
      ...dashboard.panels.slice(1),
    ]);

    // Call the function to test
    const result = getDashboardChanges(dashboard);
    // Assertions
    expect(result.migrationChanges).toEqual(
      '===================================================================\n' +
        '--- Before migration changes\t\n' +
        '+++ After migration changes\t\n' +
        '@@ -1,25 +1,21 @@\n' +
        ' {\n' +
        '   "editable": true,\n' +
        '   "graphTooltip": 0,\n' +
        '-  "schemaVersion": 37,\n' +
        '+  "schemaVersion": 38,\n' +
        '   "timezone": "",\n' +
        '   "panels": [\n' +
        '     {\n' +
        '-      "fieldConfig": {\n' +
        '-        "defaults": {},\n' +
        '-        "overrides": []\n' +
        '-      },\n' +
        '+      "id": 1,\n' +
        '       "options": {\n' +
        '         "legend": {\n' +
        '           "displayMode": "hidden",\n' +
        '           "showLegend": false\n' +
        '         }\n' +
        '       },\n' +
        '       "repeatDirection": "h",\n' +
        '+      "title": "Panel 1",\n' +
        '       "transformations": [],\n' +
        '-      "transparent": false,\n' +
        '-      "type": "timeseries",\n' +
        '-      "title": "Panel 1"\n' +
        '+      "type": "timeseries"\n' +
        '     }\n' +
        '   ]\n' +
        ' }\n' +
        '\\ No newline at end of file\n'
    );
    expect(result.userChanges).toEqual(
      '===================================================================\n' +
        '--- Before user changes\t\n' +
        '+++ After user changes\t\n' +
        '@@ -11,11 +11,11 @@\n' +
        '           "displayMode": "hidden",\n' +
        '           "showLegend": false\n' +
        '         }\n' +
        '       },\n' +
        '       "repeatDirection": "h",\n' +
        '-      "title": "Panel 1",\n' +
        '+      "title": "New title",\n' +
        '       "transformations": [],\n' +
        '       "type": "timeseries"\n' +
        '     }\n' +
        '   ]\n' +
        ' }\n' +
        '\\ No newline at end of file\n'
    );
    expect(result.migrationChanges).toBeDefined();
  });
});

describe('isLLMPluginEnabled', () => {
  it('should return true if LLM plugin is enabled', async () => {
    // Mock llms.openai.enabled to return true
    jest.mocked(openai.enabled).mockResolvedValue(true);

    const enabled = await isLLMPluginEnabled();

    expect(enabled).toBe(true);
  });

  it('should return false if LLM plugin is not enabled', async () => {
    // Mock llms.openai.enabled to return false
    jest.mocked(openai.enabled).mockResolvedValue(false);

    const enabled = await isLLMPluginEnabled();

    expect(enabled).toBe(false);
  });
});
