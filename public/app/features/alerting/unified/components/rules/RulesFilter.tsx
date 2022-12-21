import { css } from '@emotion/css';
import { debounce } from 'lodash';
import React, { FormEvent, useState } from 'react';

import { DataSourceInstanceSettings, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { DataSourcePicker, logInfo } from '@grafana/runtime';
import { Button, Field, Icon, Input, Label, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { PromAlertingRuleState, PromRuleType } from 'app/types/unified-alerting-dto';

import { LogMessages } from '../../Analytics';
import { useRulesFilter } from '../../hooks/useFilteredRules';
import { getFiltersFromUrlParams } from '../../utils/misc';
import { alertStateToReadable } from '../../utils/rules';

const ViewOptions: SelectableValue[] = [
  {
    icon: 'folder',
    label: 'Grouped',
    value: 'grouped',
  },
  {
    icon: 'list-ul',
    label: 'List',
    value: 'list',
  },
  {
    icon: 'heart-rate',
    label: 'State',
    value: 'state',
  },
];

const RuleTypeOptions: SelectableValue[] = [
  {
    label: 'Alert ',
    value: PromRuleType.Alerting,
  },
  {
    label: 'Recording ',
    value: PromRuleType.Recording,
  },
];

interface RulesFilerProps {
  onFilterCleared?: () => void;
}

const RulesFilter = ({ onFilterCleared }: RulesFilerProps) => {
  const [queryParams, setQueryParams] = useQueryParams();
  // This key is used to force a rerender on the inputs when the filters are cleared
  const [filterKey, setFilterKey] = useState<number>(Math.floor(Math.random() * 100));
  const dataSourceKey = `dataSource-${filterKey}`;
  const queryStringKey = `queryString-${filterKey}`;

  const { filters, queryString } = useRulesFilter();

  const styles = useStyles2(getStyles);
  const stateOptions = Object.entries(PromAlertingRuleState).map(([key, value]) => ({
    label: alertStateToReadable(value),
    value,
  }));

  const handleDataSourceChange = (dataSourceValue: DataSourceInstanceSettings) => {
    setQueryParams({ dataSource: dataSourceValue.name });
  };

  const clearDataSource = () => {
    setQueryParams({ dataSource: null });
  };

  const handleQueryStringChange = debounce((e: FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setQueryParams({ queryString: target.value || null });
  }, 600);

  const handleAlertStateChange = (value: string) => {
    logInfo(LogMessages.clickingAlertStateFilters);
    setQueryParams({ alertState: value });
  };

  const handleViewChange = (view: string) => {
    setQueryParams({ view });
  };

  const handleRuleTypeChange = (ruleType: PromRuleType) => {
    setQueryParams({ ruleType });
  };

  const handleClearFiltersClick = () => {
    setQueryParams({
      alertState: null,
      queryString: null,
      dataSource: null,
      ruleType: null,
    });

    if (onFilterCleared) {
      onFilterCleared();
    }

    setTimeout(() => setFilterKey(filterKey + 1), 100);
  };

  const searchIcon = <Icon name={'search'} />;
  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={1}>
        <Field className={styles.dsPickerContainer} label="Search by data source">
          <DataSourcePicker
            key={dataSourceKey}
            alerting
            noDefault
            placeholder="All data sources"
            current={filters.dataSourceName}
            onChange={handleDataSourceChange}
            onClear={clearDataSource}
          />
        </Field>
        <div>
          <Label>State</Label>
          <RadioButtonGroup options={stateOptions} value={filters.ruleState} onChange={handleAlertStateChange} />
        </div>
        <div>
          <Label>Rule type</Label>
          <RadioButtonGroup options={RuleTypeOptions} value={filters.ruleType} onChange={handleRuleTypeChange} />
        </div>
      </Stack>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1}>
          <Field
            className={styles.searchInput}
            label={
              <Label>
                <Stack gap={0.5}>
                  <span>Search</span>
                  <Tooltip
                    content={
                      <div>
                        Filter rules and alerts using label querying, ex:
                        <code>{`{severity="critical", instance=~"cluster-us-.+"}`}</code>
                      </div>
                    }
                  >
                    <Icon name="info-circle" size="sm" />
                  </Tooltip>
                </Stack>
              </Label>
            }
          >
            <Input
              key={queryStringKey}
              prefix={searchIcon}
              onChange={handleQueryStringChange}
              defaultValue={queryString}
              placeholder="Search"
              data-testid="search-query-input"
            />
          </Field>
          <div>
            <Label>View as</Label>
            <RadioButtonGroup
              options={ViewOptions}
              value={String(queryParams['view'] ?? ViewOptions[0].value)}
              onChange={handleViewChange}
            />
          </div>
        </Stack>
        {(filters.query ||
          filters.dataSourceName ||
          filters.namespace ||
          filters.ruleType ||
          filters.ruleState ||
          filters.labels ||
          filters.groupName ||
          filters.ruleName) && (
          <div className={styles.flexRow}>
            <Button
              className={styles.clearButton}
              fullWidth={false}
              icon="times"
              variant="secondary"
              onClick={handleClearFiltersClick}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
    `,
    dsPickerContainer: css`
      width: 250px;
      flex-grow: 0;
      margin: 0;
    `,
    searchInput: css`
      flex: 1;
      margin: 0;
    `,
    flexRow: css`
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      width: 100%;
      flex-wrap: wrap;
    `,
    spaceBetween: css`
      justify-content: space-between;
    `,
    clearButton: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

export default RulesFilter;
