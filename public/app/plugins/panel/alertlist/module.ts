import _ from 'lodash';
import moment from 'moment';
import alertDef from '../../../features/alerting/alert_def';
import { PanelCtrl } from 'app/plugins/sdk';

import * as dateMath from 'app/core/utils/datemath';

class AlertListPanel extends PanelCtrl {
  static templateUrl = 'module.html';
  static scrollable = true;
  searchDashboards: any;
  searchFolders: any;
  dashboardIds: any = [];

  showOptions = [{ text: 'Current state', value: 'current' }, { text: 'Recent state changes', value: 'changes' }];

  sortOrderOptions = [
    { text: 'Alphabetical (asc)', value: 1 },
    { text: 'Alphabetical (desc)', value: 2 },
    { text: 'Importance', value: 3 },
  ];

  stateFilter: any = {};
  currentAlerts: any = [];
  alertHistory: any = [];
  noAlertsMessage: string;

  // Set and populate defaults
  panelDefaults = {
    show: 'current',
    limit: 10,
    stateFilter: [],
    onlyAlertsOnDashboard: false,
    sortOrder: 1,
    dashboardFilter: '',
    nameFilter: '',
  };

  /** @ngInject */
  constructor($scope, $injector, private backendSrv) {
    super($scope, $injector);
    _.defaults(this.panel, this.panelDefaults);

    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    this.events.on('refresh', this.onRefresh.bind(this));

    for (let key in this.panel.stateFilter) {
      this.stateFilter[this.panel.stateFilter[key]] = true;
    }

    this.searchDashboards = (queryStr, callback) => {
      this.backendSrv.search({ query: queryStr, type: 'dash-db' }).then(hits => {
        var dashboards = _.map(hits, dash => {
          if (dash.folderTitle) {
            this.dashboardIds.push([dash.title + ' (' + dash.folderTitle + ')', dash.id]);
            return dash.title + ' (' + dash.folderTitle + ')';
          }
          this.dashboardIds.push([dash.title, dash.id]);
          return dash.title;
        });

        callback(dashboards);
      });
    };

    this.searchFolders = (queryStr, callback) => {
      this.backendSrv.search({ query: queryStr, type: 'dash-folder' }).then(hits => {
        var folders = _.map(hits, dash => {
          return dash.title;
        });

        callback(folders);
      });
    };
  }

  sortResult(alerts) {
    if (this.panel.sortOrder === 3) {
      return _.sortBy(alerts, a => {
        return alertDef.alertStateSortScore[a.state];
      });
    }

    var result = _.sortBy(alerts, a => {
      return a.name.toLowerCase();
    });
    if (this.panel.sortOrder === 2) {
      result.reverse();
    }

    return result;
  }

  updateStateFilter() {
    var result = [];

    for (let key in this.stateFilter) {
      if (this.stateFilter[key]) {
        result.push(key);
      }
    }

    this.panel.stateFilter = result;
    this.onRefresh();
  }

  onRefresh() {
    let getAlertsPromise;

    if (this.panel.show === 'current') {
      getAlertsPromise = this.getCurrentAlertState();
    }

    if (this.panel.show === 'changes') {
      getAlertsPromise = this.getStateChanges();
    }

    getAlertsPromise.then(() => {
      this.renderingCompleted();
    });
  }

  getStateChanges() {
    var params: any = {
      limit: this.panel.limit,
      type: 'alert',
      newState: this.panel.stateFilter,
    };

    if (this.panel.onlyAlertsOnDashboard) {
      params.dashboardId = this.dashboard.id;
    }

    params.from = dateMath.parse(this.dashboard.time.from).unix() * 1000;
    params.to = dateMath.parse(this.dashboard.time.to).unix() * 1000;

    return this.backendSrv.get(`/api/annotations`, params).then(res => {
      this.alertHistory = _.map(res, al => {
        al.time = this.dashboard.formatDate(al.time, 'MMM D, YYYY HH:mm:ss');
        al.stateModel = alertDef.getStateDisplayModel(al.newState);
        al.info = alertDef.getAlertAnnotationInfo(al);
        return al;
      });

      this.noAlertsMessage = this.alertHistory.length === 0 ? 'No alerts in current time range' : '';

      if (this.panel.nameFilter) {
        this.alertHistory = this.filterAlerts(this.alertHistory);
      }

      if (this.panel.dashboardFilter) {
        this.alertHistory = this.dashboardAlertFilter(this.alertHistory);
      }

      return this.alertHistory;
    });
  }

  filterAlerts(alertList) {
    let regex = new RegExp(this.panel.nameFilter, 'i');
    return alertList.filter(alert => {
      if (alert.alertName) {
        return regex.test(alert.alertName);
      }
      return regex.test(alert.name);
    });
  }

  dashboardAlertFilter(alertList) {
    let dashId;
    for (var i = 0; i < this.dashboardIds.length; i++) {
      if (this.dashboardIds[i][0] === this.panel.dashboardFilter) {
        dashId = this.dashboardIds[i][1];
      }
    }

    return alertList.filter(alert => {
      if (alert.dashboardId === dashId) {
        return alert;
      }
    });
  }

  getCurrentAlertState() {
    var params: any = {
      state: this.panel.stateFilter,
    };

    if (this.panel.onlyAlertsOnDashboard) {
      params.dashboardId = this.dashboard.id;
    }

    return this.backendSrv.get(`/api/alerts`, params).then(res => {
      this.currentAlerts = this.sortResult(
        _.map(res, al => {
          al.stateModel = alertDef.getStateDisplayModel(al.state);
          al.newStateDateAgo = moment(al.newStateDate)
            .locale('en')
            .fromNow(true);
          return al;
        })
      );
      this.noAlertsMessage = this.currentAlerts.length === 0 ? 'No alerts' : '';

      if (this.panel.nameFilter) {
        this.currentAlerts = this.filterAlerts(this.currentAlerts);
      }

      if (this.panel.dashboardFilter) {
        this.currentAlerts = this.dashboardAlertFilter(this.currentAlerts);
      }

      return this.currentAlerts;
    });
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/app/plugins/panel/alertlist/editor.html');
  }
}

export { AlertListPanel, AlertListPanel as PanelCtrl };
