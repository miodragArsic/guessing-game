(function() {
    'use strict';

    angular
        .module('app')
        .factory('controls.repository', controlsRepository);

    controlsRepository.$inject = ['utils'];

    function controlsRepository(utils) {

        var defaultDeviceControlName = 'bar-chart';

        var deviceControls = [{
            name: 'bar-chart',
            title: 'Bar Chart',
            description: 'Shows numerical assets activity in bar chart.'
        }, {
            name: 'line-chart',
            title: 'Line Chart',
            description: 'Shows numerical assets activity in line chart.'
        }, {
            name: 'area-range-chart',
            title: 'Area Graph Chart',
            description: 'Shows numerical assets activity with minimum and maximum values.'
        }];

        var service = {

            findAllDeviceControls: findAllDeviceControls,
            defaultDeviceControlName: defaultDeviceControlName

        };

        return service;

        ////////////////

        function findAllDeviceControls() {

            return utils.$q.when(deviceControls);

        }
    }
})();
