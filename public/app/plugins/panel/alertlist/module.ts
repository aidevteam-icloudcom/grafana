import _ from 'lodash';
import moment from 'moment';
import alertDef from '../../../features/alerting/alert_def';
import { PanelCtrl } from 'app/plugins/sdk';

import * as dateMath from 'app/core/utils/datemath';

class AlertListPanel extends PanelCtrl {
  static templateUrl = 'module.html';
  static scrollable = true;

  showOptions = [{ text: 'Current state', value: 'current' }, { text: 'Recent state changes', value: 'changes' }];

  sortOrderOptions = [
    { text: 'Alphabetical (asc)', value: 1 },
    { text: 'Alphabetical (desc)', value: 2 },
    { text: 'Importance', value: 3 },
  ];

  soundOptions = [
    { text: 'Springboard', value: 'public/sound/sound1' },
    { text: 'Breaking glass', value: 'public/sound/sound2' },
    { text: 'Decay', value: 'public/sound/sound3' },
    { text: 'Strike', value: 'public/sound/sound4' },
    { text: 'System fault', value: 'public/sound/sound5' },
  ];

  stateFilter: any = {};
  currentAlerts: any = [];
  alertHistory: any = [];
  noAlertsMessage: string;
  audio: any;
  soundFile: any;
  lastRefreshAt: any;

  // Set and populate defaults
  panelDefaults = {
    show: 'current',
    limit: 10,
    stateFilter: [],
    onlyAlertsOnDashboard: false,
    sortOrder: 1,
    dashboardFilter: '',
    nameFilter: '',
    folderId: null,
    sound: false,
    soundFile: 'public/sound/sound1',
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

    this.audio = new Audio();
    this.setSoundFile();
    this.lastRefreshAt = moment();
  }

  updateSoundFile() {
    this.setSoundFile();
    this.playSound();
    this.onRefresh();
  }

  setSoundFile() {
    if (this.audio.canPlayType('audio/mpeg') === '') {
      this.audio.src = this.panel.soundFile + '.ogg';
    } else {
      this.audio.src = this.panel.soundFile + '.mp3';
    }
    this.audio.load();
  }

  playSound() {
    var playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(function() {}).catch(function(error) {});
    }
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
      this.lastRefreshAt = moment();
    });
  }

  onFolderChange(folder: any) {
    this.panel.folderId = folder.id;
    this.refresh();
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

      return this.alertHistory;
    });
  }

  getCurrentAlertState() {
    var soundFlag = false;
    var params: any = {
      state: this.panel.stateFilter,
    };

    if (this.panel.nameFilter) {
      params.query = this.panel.nameFilter;
    }

    if (this.panel.folderId >= 0) {
      params.folderId = this.panel.folderId;
    }

    if (this.panel.dashboardFilter) {
      params.dashboardQuery = this.panel.dashboardFilter;
    }

    if (this.panel.onlyAlertsOnDashboard) {
      params.dashboardId = this.dashboard.id;
    }

    if (this.panel.dashboardTags) {
      params.dashboardTag = this.panel.dashboardTags;
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
      if (this.currentAlerts.length > this.panel.limit) {
        this.currentAlerts = this.currentAlerts.slice(0, this.panel.limit);
      }
      this.noAlertsMessage = this.currentAlerts.length === 0 ? 'No alerts' : '';
      for (let _ in this.currentAlerts) {
        var alert = this.currentAlerts[_];
        var newStateDate = moment(alert.newStateDate).locale('en');
        if (this.lastRefreshAt < newStateDate && alert.stateModel.text === 'ALERTING') {
          soundFlag = true;
        }
      }
      if (soundFlag && this.panel.sound) {
        this.audio.load();
        this.playSound();
      }
      return this.currentAlerts;
    });
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/app/plugins/panel/alertlist/editor.html');
  }
}

export { AlertListPanel, AlertListPanel as PanelCtrl };
