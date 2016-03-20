(function() {
    'use strict';

    angular
        .module('app')
        .directive('areaRangeChartDeviceControl', AreaRangeChartDirective);

    AreaRangeChartDirective.$inject = [];

    function AreaRangeChartDirective() {

        var directive = {
            bindToController: true,
            controller: AreaRangeChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/area-range-chart/area-range-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    AreaRangeChartDeviceControlController.$inject = [];

    function AreaRangeChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'area-range-chart'
        };

        activate();

        // ////////////////

        function activate() {
        }

    }
})();
