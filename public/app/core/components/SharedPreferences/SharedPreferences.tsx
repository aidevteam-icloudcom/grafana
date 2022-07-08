import { css } from '@emotion/css';
import { t, Trans } from '@lingui/macro';
import React, { PureComponent } from 'react';

import { FeatureState, SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import {
  Button,
  Field,
  FieldSet,
  Form,
  Icon,
  Label,
  RadioButtonGroup,
  Select,
  stylesFactory,
  TimeZonePicker,
  Tooltip,
  WeekStartPicker,
  FeatureBadge,
} from '@grafana/ui';
import { PreferencesService } from 'app/core/services/PreferencesService';
import { backendSrv } from 'app/core/services/backend_srv';
import { DashboardSearchHit, DashboardSearchItemType } from 'app/features/search/types';

import { UserPreferencesDTO } from '../../../types';

export interface Props {
  resourceUri: string;
  disabled?: boolean;
}

export type State = UserPreferencesDTO & {
  dashboards: DashboardSearchHit[];
};

const themes: SelectableValue[] = [
  { value: '', label: t({ id: 'shared-preferences.theme.default-label', message: 'Default' }) },
  { value: 'dark', label: t({ id: 'shared-preferences.theme.dark-label', message: 'Dark' }) },
  { value: 'light', label: t({ id: 'shared-preferences.theme.light-label', message: 'Light' }) },
];

const languages: Array<SelectableValue<string>> = [
  {
    value: '',
    label: t({
      id: 'common.locale.default',
      message: 'Default',
    }),
  },
  {
    value: 'en',
    label: t({
      id: 'common.locale.en',
      message: 'English',
    }),
  },
  {
    value: 'es',
    label: t({
      id: 'common.locale.es',
      message: 'Spanish',
    }),
  },
  {
    value: 'fr',
    label: t({
      id: 'common.locale.fr',
      message: 'French',
    }),
  },
];

const i18nFlag = Boolean(config.featureToggles.internationalization);

const DEFAULT_DASHBOARD_HOME: DashboardSearchHit = {
  id: 0,
  title: 'Default',
  tags: [],
  type: '' as DashboardSearchItemType,
  uid: undefined,
  uri: '',
  url: '',
  folderId: 0,
  folderTitle: '',
  folderUid: '',
  folderUrl: '',
  isStarred: false,
  slug: '',
  items: [],
};

export class SharedPreferences extends PureComponent<Props, State> {
  service: PreferencesService;

  constructor(props: Props) {
    super(props);

    this.service = new PreferencesService(props.resourceUri);
    this.state = {
      homeDashboardUID: DEFAULT_DASHBOARD_HOME.uid,
      theme: '',
      timezone: '',
      weekStart: '',
      locale: '',
      dashboards: [],
      queryHistory: { homeTab: '' },
    };
  }

  async componentDidMount() {
    const prefs = await this.service.load();
    const dashboards = await backendSrv.search({ starred: true });

    if (prefs.homeDashboardUID && !dashboards.find((d) => d.uid === prefs.homeDashboardUID)) {
      const missingDash = await backendSrv.getDashboardByUid(prefs.homeDashboardUID);

      if (missingDash?.dashboard) {
        dashboards.push({
          id: missingDash.dashboard.id,
          title: missingDash.dashboard.title,
          tags: [],
          type: DashboardSearchItemType.DashDB,
          uid: missingDash.dashboard.uid,
          uri: '', // uri is not part of dashboard metadata
          url: missingDash.meta.url || '',
          folderId: missingDash.meta.folderId,
          folderTitle: missingDash.meta.folderTitle,
          folderUid: missingDash.meta.folderUid,
          folderUrl: missingDash.meta.folderUrl,
          isStarred: missingDash.meta.isStarred || false,
          slug: missingDash.meta.slug,
          items: [],
        });
      }
    }

    this.setState({
      homeDashboardUID: prefs.homeDashboardUID,
      theme: prefs.theme,
      timezone: prefs.timezone,
      weekStart: prefs.weekStart,
      locale: prefs.locale,
      dashboards: [DEFAULT_DASHBOARD_HOME, ...dashboards],
      queryHistory: prefs.queryHistory,
    });
  }

  onSubmitForm = async () => {
    const { homeDashboardUID, theme, timezone, weekStart, locale, queryHistory } = this.state;
    await this.service.update({ homeDashboardUID, theme, timezone, weekStart, locale, queryHistory });
    window.location.reload();
  };

  onThemeChanged = (value: string) => {
    this.setState({ theme: value });
  };

  onTimeZoneChanged = (timezone?: string) => {
    if (!timezone) {
      return;
    }
    this.setState({ timezone: timezone });
  };

  onWeekStartChanged = (weekStart: string) => {
    this.setState({ weekStart: weekStart });
  };

  onHomeDashboardChanged = (dashboardId: string) => {
    this.setState({ homeDashboardUID: dashboardId });
  };

  onLocaleChanged = (locale: string) => {
    this.setState({ locale });
  };

  getFullDashName = (dashboard: SelectableValue<DashboardSearchHit>) => {
    if (typeof dashboard.folderTitle === 'undefined' || dashboard.folderTitle === '') {
      return dashboard.title;
    }
    return dashboard.folderTitle + ' / ' + dashboard.title;
  };

  render() {
    const { theme, timezone, weekStart, homeDashboardUID, locale, dashboards } = this.state;
    const { disabled } = this.props;
    const styles = getStyles();

    const homeDashboardTooltip = (
      <Tooltip
        content={
          <Trans id="shared-preferences.fields.home-dashboard-tooltip">
            Not finding the dashboard you want? Star it first, then it should appear in this select box.
          </Trans>
        }
      >
        <Icon name="info-circle" />
      </Tooltip>
    );

    return (
      <Form onSubmit={this.onSubmitForm}>
        {() => {
          return (
            <FieldSet label={<Trans id="shared-preferences.title">Preferences</Trans>} disabled={disabled}>
              <Field label={t({ id: 'shared-preferences.fields.theme-label', message: 'UI Theme' })}>
                <RadioButtonGroup
                  options={themes}
                  value={themes.find((item) => item.value === theme)?.value}
                  onChange={this.onThemeChanged}
                />
              </Field>

              <Field
                label={
                  <Label htmlFor="home-dashboard-select">
                    <span className={styles.labelText}>
                      <Trans id="shared-preferences.fields.home-dashboard-label">Home Dashboard</Trans>
                    </span>

                    {homeDashboardTooltip}
                  </Label>
                }
                data-testid="User preferences home dashboard drop down"
              >
                <Select
                  value={dashboards.find((dashboard) => dashboard.uid === homeDashboardUID)}
                  getOptionValue={(i) => i.uid}
                  getOptionLabel={this.getFullDashName}
                  onChange={(dashboard: SelectableValue<DashboardSearchHit>) =>
                    this.onHomeDashboardChanged(dashboard.uid)
                  }
                  options={dashboards}
                  placeholder={t({
                    id: 'shared-preferences.fields.home-dashboard-placeholder',
                    message: 'Choose default dashboard',
                  })}
                  inputId="home-dashboard-select"
                />
              </Field>

              <Field
                label={t({ id: 'shared-dashboard.fields.timezone-label', message: 'Timezone' })}
                data-testid={selectors.components.TimeZonePicker.containerV2}
              >
                <TimeZonePicker
                  includeInternal={true}
                  value={timezone}
                  onChange={this.onTimeZoneChanged}
                  inputId="shared-preferences-timezone-picker"
                />
              </Field>

              <Field
                label={t({ id: 'shared-preferences.fields.week-start-label', message: 'Week start' })}
                data-testid={selectors.components.WeekStartPicker.containerV2}
              >
                <WeekStartPicker
                  value={weekStart}
                  onChange={this.onWeekStartChanged}
                  inputId={'shared-preferences-week-start-picker'}
                />
              </Field>

              {i18nFlag ? (
                <Field
                  label={
                    <Label htmlFor="locale-select">
                      <span className={styles.labelText}>
                        <Trans id="shared-preferences.fields.locale-label">Language</Trans>
                      </span>
                      <FeatureBadge featureState={FeatureState.alpha} />
                    </Label>
                  }
                  data-testid="User preferences language drop down"
                >
                  <Select
                    value={languages.find((lang) => lang.value === locale)}
                    onChange={(locale: SelectableValue<string>) => this.onLocaleChanged(locale.value ?? '')}
                    options={languages}
                    placeholder={t({
                      id: 'shared-preferences.fields.locale-placeholder',
                      message: 'Choose language',
                    })}
                    inputId="locale-select"
                  />
                </Field>
              ) : null}

              <div className="gf-form-button-row">
                <Button
                  type="submit"
                  variant="primary"
                  data-testid={selectors.components.UserProfile.preferencesSaveButton}
                >
                  <Trans id="common.save">Save</Trans>
                </Button>
              </div>
            </FieldSet>
          );
        }}
      </Form>
    );
  }
}

export default SharedPreferences;

const getStyles = stylesFactory(() => {
  return {
    labelText: css`
      margin-right: 6px;
    `,
  };
});
