define([
    'jquery',
    'lodash',
    '../core_module'
  ],
  function ($, _, coreModule) {
    'use strict';

    coreModule.directive('overviewPanel', function ($parse, $compile) {
      return {
        restrict: 'EA',
        templateUrl: '/app/features/systemoverview/partials/system_host_panel.html',
        link: function (scope, elem) {
          scope.$on('toggle-panel', function() {
            $compile(elem.contents())(scope);
          });
        }
      };
    });
  });