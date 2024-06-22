import { selectors } from '@grafana/e2e-selectors';
import { expect, test } from '@grafana/plugin-e2e';

import {
  tablesResponse,
  fieldsResponse,
  datasetResponse,
  normalTableName,
  tableNameWithSpecialCharacter,
} from './mocks/mysql.mocks';

test.beforeEach(async ({ context, selectors, explorePage }) => {
  await explorePage.datasource.set('gdev-mysql');
  await context.route(selectors.apis.DataSource.queryPattern, async (route, request) => {
    const refId = request.postDataJSON().queries[0].refId;
    if (/fields-.*/g.test(refId)) {
      return route.fulfill({ json: fieldsResponse(refId), status: 200 });
    }
    switch (refId) {
      case 'tables':
        return route.fulfill({ json: tablesResponse, status: 200 });
      case 'datasets':
        return route.fulfill({ json: datasetResponse, status: 200 });
      default:
        return route.continue();
    }
  });
});

test('code editor autocomplete should handle table name escaping/quoting', async ({ explorePage, selectors, page }) => {
  await page.getByLabel('Code').check();

  const editor = explorePage.getByGrafanaSelector(selectors.components.CodeEditor.container).getByRole('textbox');
  await editor.fill('S');
  await page.getByLabel('SELECT <column> FROM <table>').locator('a').click();
  await expect(page.getByLabel(tableNameWithSpecialCharacter)).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(editor).toHaveValue(`SELECT  FROM grafana.\`${tableNameWithSpecialCharacter}\``);

  for (let i = 0; i < tableNameWithSpecialCharacter.length + 2; i++) {
    await page.keyboard.press('Backspace');
  }

  await page.keyboard.press('Control+I');
  await expect(page.getByLabel(tableNameWithSpecialCharacter)).toBeVisible();
});

test('visual query builder should handle time filter macro', async ({ explorePage, page }) => {
  await explorePage.getByGrafanaSelector(selectors.components.SQLQueryEditor.headerTableSelector).click();
  await page.getByText(normalTableName, { exact: true }).click();

  // Open column selector
  await explorePage.getByGrafanaSelector(selectors.components.SQLQueryEditor.selectColumn).click();
  const select = page.getByLabel('Select options menu');
  await select.locator(page.getByText('createdAt')).click();

  // Toggle where row
  await page.getByLabel('Filter').last().click();

  // Click add filter button
  await page.getByRole('button', { name: 'Add filter' }).click();
  await page.getByRole('button', { name: 'Add filter' }).click(); // For some reason we need to click twice

  // Open field selector
  await explorePage.getByGrafanaSelector(selectors.components.SQLQueryEditor.filterField).click();
  await select.locator(page.getByText('createdAt')).click();

  // Open operator selector
  await explorePage.getByGrafanaSelector(selectors.components.SQLQueryEditor.filterOperator).click();
  await select.locator(page.getByText('Macros')).click();

  // Open macros value selector
  await explorePage.getByGrafanaSelector('Macros value selector').click();
  await select.locator(page.getByText('timeFilter', { exact: true })).click();

  // Validate that the timeFilter macro was added
  await expect(
    explorePage.getByGrafanaSelector(selectors.components.CodeEditor.container).getByRole('textbox')
  ).toHaveValue(`SELECT\n  createdAt\nFROM\n  DataMaker.normalTable\nWHERE\n  $__timeFilter(createdAt)\nLIMIT\n  50`);

  // Validate that the timeFilter macro was removed when changed to equals operator
  await explorePage.getByGrafanaSelector(selectors.components.SQLQueryEditor.filterOperator).click();
  await select.locator(page.getByText('==')).click();

  await explorePage.getByGrafanaSelector(selectors.components.DateTimePicker.input).click();
  await explorePage.getByGrafanaSelector(selectors.components.DateTimePicker.input).blur();

  await expect(
    explorePage.getByGrafanaSelector(selectors.components.CodeEditor.container).getByRole('textbox')
  ).not.toHaveValue(`SELECT\n  createdAt\nFROM\n  DataMaker.normalTable\nWHERE\n  createdAt = NULL\nLIMIT\n  50`);
});
