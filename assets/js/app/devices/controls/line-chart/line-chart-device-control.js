(function() {
    'use strict';

    angular
        .module('app')
        .directive('lineChartDeviceControl', LineChartDirective);

    LineChartDirective.$inject = [];

    function LineChartDirective() {

        var directive = {
            bindToController: true,
            controller: LineChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/line-chart/line-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    LineChartDeviceControlController.$inject = [];

    function LineChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'line-chart'
        };

        activate();

        // ////////////////

        function activate() {

        }

    }
})();
