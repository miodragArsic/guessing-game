(function() {
    'use strict';

    angular
        .module('app')
        .factory('DeviceListViewModel', DeviceListViewModelFactory);

    DeviceListViewModelFactory.$inject = [
        '$state',
        'device.repository',
        'utils',
        'demo.configuration',
        'sl.listHeader',
        'sl.listItem',
        'api.rulesService',
        'GroundContext'
    ];

    function DeviceListViewModelFactory($state, devicesRepository, utils, gameConfiguration, ListHeaderViewModel, ListItemViewModel, rulesService, groundContext) {

        function DeviceListViewModel(devices, groundId) {

            this.devices = [];
            this.groundId = groundId;
            this.grounds = groundContext.grounds;
            this.init(devices);
        }

        DeviceListViewModel.prototype.init = function(devices) {

            var that = this;

            if (devices.length === 0) {
                this.headerModel = new ListHeaderViewModel('Devices', 'assets/img/devices-header.svg', 'Overview of all devices serving this ground. Currently you don\'t have any devices.');
            } else {
                this.headerModel = new ListHeaderViewModel('Devices', 'assets/img/devices-header.svg', 'Overview of all devices serving this ground.');
            }

            angular.forEach(that.grounds, function(ground) {
                if (ground.id === that.groundId) {
                    that.currentGroundVisibility = ground.visibility;
                }
            });

            angular.forEach(devices, function(device) {

                device.subscribe();

                rulesService.getDeviceRulesCount(device.id)
                    .then(function(response) {
                        device.rulesMeta = response.data;
                        that.devices.push(ListItemViewModel.fromDevice(device));
                    });
            });

            if (devices.length > 0) {
                that.headerModel.setHeaderMode('colapsed');
            } else {
                that.headerModel.setHeaderMode('expanded');
            }

            utils.$rootScope.$on('$messaging.device.created', function(e, eventData) {

                var deviceExists = false;
                angular.forEach(that.devices, function(device) {
                    if (device.itemId === eventData.deviceId) {
                        deviceExists = true;
                    }
                });

                if (!deviceExists) {
                    devicesRepository.find(eventData.deviceId).then(function(dev) {
                        dev.$isNew = true;
                        dev.subscribe();
                        that.devices.push(ListItemViewModel.fromDevice(dev));
                        if (that.devices.length > 0) {
                            that.headerModel.setHeaderMode('colapsed');
                        } else {
                            that.headerModel.setHeaderMode('expanded');
                        }

                    });
                }
            });

            utils.$rootScope.$on('$messaging.device.deleted', function(e, eventData) {

                var deletedDevice = null;
                angular.forEach(that.devices, function(device) {
                    if (device.itemId === eventData.deviceId) {
                        deletedDevice = device;
                    }
                });

                if (deletedDevice !== null) {
                    deletedDevice.setDeleted();
                }

            });

            utils.$rootScope.$on('demo.deviceAdopted', function(e, data) {
                devicesRepository.find(data).then(function(dev) {
                    dev.$isNew = true;
                    that.devices.push(ListItemViewModel.fromDevice(dev));
                });
            });

        };

        DeviceListViewModel.prototype.createDevice = function(name, type) {

            var that = this;

            if (name === null || name === '') {
                return;
            }

            var data = {
                name: name,
                type: type
            };

            return devicesRepository.createInGround(data, that.groundId).then(function(device) {

                utils.notify.success('Success.', 'New device is created');

                utils.$rootScope.$emit('user.created.device', device);

                return device;
            });
        };

        DeviceListViewModel.prototype.removeDevice = function(deletedDevice) {

            var index = this.devices.indexOf(deletedDevice);
            this.devices.splice(index, 1);
        };

        DeviceListViewModel.prototype.delete = function(device) {

            var that = this;
            var deviceDeleted = device;

            return devicesRepository.remove(deviceDeleted.id)
                .then(function() {

                    utils.notify.success('Success.', 'Device is deleted');

                    for (var i = 0; i < that.devices.length; i++) {

                        if (that.devices[i].device === deviceDeleted) {

                            that.devices.splice(i, 1);
                        }
                    }

                });

        };

        DeviceListViewModel.resolve = function(groundId) {

            return devicesRepository.findAllInGround(groundId).then(function(devices) {
                return new DeviceListViewModel(devices, groundId);
            });
        };

        return DeviceListViewModel;
    }
}());
