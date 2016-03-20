(function() {
    'use strict';

    angular
        .module('app')
        .directive('barChartDeviceControl', BarChartDirective);

    BarChartDirective.$inject = [];

    function BarChartDirective() {

        var directive = {
            bindToController: true,
            controller: BarChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/bar-chart/bar-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    BarChartDeviceControlController.$inject = [];

    function BarChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'bar-chart'
        };

        activate();

        // ////////////////

        function activate() {
        }

    }
})();
