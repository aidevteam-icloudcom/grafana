define([
  'angular',
  'lodash',
  'app/core/utils/datemath',
],
function (angular, _, dateMath) {
  'use strict';

  var module = angular.module('grafana.controllers');
  module.controller('ServiceAgentCtrl', function ($scope, backendSrv, datasourceSrv, contextSrv) {
    $scope.init = function() {
      datasourceSrv.get("opentsdb").then(function (datasource) {
        $scope.datasource = datasource;
      }).then(function () {
        $scope.getService();
      });
    };

    $scope.getService = function() {
      backendSrv.get('/api/dashboards/home').then(function(result) {
        $scope.services = result.dashboard.service;
        $scope.getServiceStatus(result.dashboard.service);
      });
    };

    $scope.getServiceStatus = function(services) {
      _.each(services, function (service, index) {
        var queries = [{
          "metric": contextSrv.user.orgId + "." + contextSrv.system + "." + service.id + ".state",
          "aggregator": "sum",
          "downsample": "10m-sum",
        }];

        $scope.datasource.performTimeSeriesQuery(queries, dateMath.parse('now-10m', false).valueOf(), null).then(function (response) {
          if (_.isEmpty(response.data)) {
            throw Error;
          }
          _.each(response.data, function (metricData) {
            if (_.isObject(metricData)) {
              if (metricData.dps[Object.keys(metricData.dps)[0]] > 0) {
                // 安装成功,但未获取数据
                $scope.services[index].status = 2;
              } else {
                // 安装成功,且配置正确
                $scope.services[index].status = 0;
              }
            }
          });
        }).catch(function () {
        // nothing to do
        });
      });
    };

    $scope.showDetail = function() {
      $scope.appEvent('show-modal', {
        src: 'app/features/setup/partials/service_detail.html',
        modalClass: 'modal-no-header invite-modal',
        scope: $scope.$new(),
      });
    };

    $scope.init();
  });

});
