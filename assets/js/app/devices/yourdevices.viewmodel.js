(function() {
    'use strict';

    angular
        .module('app')
        .factory('YourDevicesViewModel', YourDevicesViewModelFactory);

    YourDevicesViewModelFactory.$inject = [
        'device.repository',
        'utils',
        'sl.listHeader',
        'sl.listItem'
    ];

    function YourDevicesViewModelFactory(devicesRepository, utils, ListHeaderViewModel, ListItemViewModel) {

        function YourDevicesViewModel(devices) {

            this.devices = [];
            this.headerModel = null;
            this.callToAction = false;
            this.init(devices);
        }

        YourDevicesViewModel.prototype.init = function(devices) {
            var that = this;

            angular.forEach(devices, function(device) {
                that.devices.push(ListItemViewModel.fromDevice(device));
            });

            if (devices.length > 0) {
                that.headerModel = new ListHeaderViewModel('Your devices', 'assets/img/devices-header.svg', 'Overview of all devices that you own.');
                that.headerModel.setHeaderMode('colapsed');
                that.callToAction = false;
            } else {
                that.headerModel = new ListHeaderViewModel('Your Devices', 'assets/img/devices-header.svg', 'Overview of all devices that you own.. Currently you don\'t have any devices. To create grounds and devices navigate to environment');
                that.headerModel.setHeaderMode('expanded');
                that.callToAction = true;
            }

        };

        YourDevicesViewModel.resolve = function() {

            return devicesRepository.findAll()
                .then(function(devices) {
                    return new YourDevicesViewModel(devices);
                });

        };

        return YourDevicesViewModel;
    }
}());
