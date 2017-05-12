define([
  'angular',
  'moment',
  'lodash',
  'app/core/utils/datemath'
],
function (angular, moment, _, dateMath) {
  'use strict';

  var module = angular.module('grafana.controllers');

  module.controller('AlertStatusCtrl', function ($scope, alertMgrSrv, datasourceSrv, contextSrv) {
    $scope.init = function () {
      $scope.correlationThreshold = 100;
      alertMgrSrv.loadTriggeredAlerts().then(function onSuccess(response) {
        for (var i = 0; i < response.data.length; i++) {
          var alertDetail = response.data[i];
          if (alertDetail.status.level === "CRITICAL") {
            alertDetail.definition.alertDetails.threshold = alertDetail.definition.alertDetails.crit.threshold;
          } else {
            alertDetail.definition.alertDetails.threshold = alertDetail.definition.alertDetails.warn.threshold;
          }
          // Only show 2 digits. +0.00001 is to avoid floating point weirdness on rounding number.
          alertDetail.status.triggeredValue = Math.round((alertDetail.status.triggeredValue + 0.00001) * 100) / 100;
        }
        $scope.alertRows = response.data;
        $scope.getCurrent();
      });
    };
    $scope.resetCurrentThreshold = function (alertDetails) {
      alertMgrSrv.resetCurrentThreshold(alertDetails);
    };

    $scope.handleAlert = function (alertDetail) {
      var newScope = $scope.$new();
      newScope.alertData = alertDetail;
      newScope.closeAlert = $scope.closeAlert;
      $scope.appEvent('show-modal', {
        src: './app/partials/handle_alert.html',
        modalClass: 'modal-no-header confirm-modal',
        scope: newScope
      });
    };

    $scope.closeAlert = function() {
      var status = $scope.alertData.status;
      alertMgrSrv.closeAlert(status.alertId, status.monitoredEntity, $scope.reason, contextSrv.user.name).then(function(response) {
        console.log(response);
      });
    };

    $scope.handleSnooze = function(alertDetails) {
      var newScope = $scope.$new();
      newScope.alertDetails = alertDetails;
      $scope.appEvent('show-modal', {
        src: './app/partials/snooze_alert.html',
        modalClass: 'modal-no-header confirm-modal',
        scope: newScope
      });
    };
    $scope.random = function () {
      // There would be something problems when render the page;
      return Math.floor(Math.random() * 100) + 20;
    };

    $scope.formatDate = function (mSecond) {
      return moment(mSecond).format("YYYY-MM-DD HH:mm:ss");
    };

    $scope.timeFrom = function (mSecond, snoozeMin) {
      return moment(mSecond).add(snoozeMin, 'm').format("YYYY-MM-DD HH:mm");
    };

    $scope.getCurrent = function () {
      _.each(datasourceSrv.getAll(), function (ds) {
        if (ds.type === 'opentsdb') {
          datasourceSrv.get(ds.name).then(function (datasource) {
            $scope.datasource = datasource;
          }).then(function () {
            _.each($scope.alertRows, function (alertData) {
              var queries = [{
                "metric": alertData.metric,
                "aggregator": "avg",
                "downsample": "1m-avg",
                "tags": {"host": alertData.status.monitoredEntity}
              }];

              $scope.datasource.performTimeSeriesQuery(queries, dateMath.parse('now-2m', false).valueOf(), null).then(function (response) {
                if (_.isEmpty(response.data)) {
                  throw Error;
                }
                _.each(response.data, function (currentData) {
                  if (_.isObject(currentData)) {
                    alertData.curr = Math.floor(currentData.dps[Object.keys(currentData.dps)[0]] * 1000) / 1000;
                    if(isNaN(alertData.curr)){
                      alertData.curr = "没有数据";
                    }
                  }
                });
              }).catch(function () {
                alertData.curr = "没有数据";
              });
            });
          });
        }
      });
    }

    $scope.getLevel = function(alert) {
      if(alert.status.level === 'CRITICAL') {
        return '严重';
      } else {
        return '警告';
      }
    };

    $scope.init();
  });
});
