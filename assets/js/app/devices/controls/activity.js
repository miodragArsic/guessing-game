(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceActivity', deviceActivity);

    deviceActivity.$inject = [];

    function deviceActivity() {

        var directive = {
            bindToController: true,
            controller: DeviceActivityController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/activity.html',
            restrict: 'E',
            scope: {
                device: '=',
                config: '='
            }
        };
        return directive;
    }

    DeviceActivityController.$inject = ['device.repository', 'utils'];

    function DeviceActivityController(deviceRepository, utils) {

        var vm = this;
        vm.assets = [];

        vm.colors = ['#56646D', '#2670E0', '#25C2D5', '#43C399', '#A8C14D', '#F4C45B', '#FF855A', '#FF6458', '#ED4D73', '#9068C8'];

        vm.assetChartConfig = {
            type: vm.config.type,
            refreshChart: false,
            timeScale: '60m',
            page: 0
        };

        var settings = {
            assetsToShow: [],
            control: vm.config.type
        };

        var showDefault = true;

        vm.numberOfNumericAssets = 0;

        vm.assetClicked = assetClicked;
        vm.generateColor = generateColor;
        vm.enableActivity = enableActivity;
        vm.setControl = setControl;
        vm.timeSelected = timeSelected;
        vm.setTimeLabel = setTimeLabel;
        vm.toggleFullscreen = toggleFullscreen;

        vm.scrollLeft = scrollLeft;
        vm.scrollRight = scrollRight;

        activate();

        // ////////////////

        function activate() {

            var deviceAssets = vm.device.assets;

            deviceRepository.getDeviceSettings(vm.device.id)
                .then(function(sett) {

                    if (sett.assetsToShow) {
                        settings.assetsToShow = sett.assetsToShow;
                        showDefault = false;
                    }

                    if (sett.page) {

                        settings.page = sett.page;

                    } else {

                        settings.page = 0;

                    }

                    if (sett.timeScale) {
                        settings.timeScale = sett.timeScale;
                    } else {
                        settings.timeScale = '60m';
                    }

                    for (var i = 0; i < deviceAssets.length; i++) {
                        if (isProfileNumeric(deviceAssets[i].profile)) {

                            vm.numberOfNumericAssets++;

                            var j = i;

                            if (showDefault === false) {

                                deviceAssets[i]._showAsset = false;

                                for (var m = 0; m < settings.assetsToShow.length; m++) {
                                    if (settings.assetsToShow[m] === deviceAssets[i].id) {
                                        deviceAssets[i]._showAsset = true;
                                    }
                                }
                            } else {

                                deviceAssets[i]._showAsset = true;

                                settings.assetsToShow.push(deviceAssets[i].id);

                                deviceRepository.saveDeviceSettings(vm.device.id, settings);

                                showDefault = false;
                            }

                            if (i < vm.colors.length) {

                                deviceAssets[i]._assetColor = vm.colors[i];

                            } else {

                                deviceAssets[i]._assetColor = vm.colors[j - vm.colors.length];

                            }

                            vm.assets.push(deviceAssets[i]);
                        }
                    }

                    vm.assetChartConfig.timeScale = settings.timeScale;

                    vm.assetChartConfig.page = settings.page;

                });

            utils.$rootScope.$on('timeScaleUpdated', function(event, params) {

                settings.timeScale = params;

                setTimeLabel();

                deviceRepository.saveDeviceSettings(vm.device.id, settings);

            });
        }

        function isProfileNumeric(profile) {

            if (profile.type === 'integer' || profile.type === 'number') {

                return true;

            } else {

                return false;

            }
        }

        function assetClicked(asset) {

            for (var i = 0; i < vm.assets.length; i++) {

                if (vm.assets[i].id === asset.id) {

                    vm.assets[i]._showAsset = !vm.assets[i]._showAsset;

                    vm.assetChartConfig.refreshChart = true;

                    if (vm.assets[i]._showAsset) {

                        settings.assetsToShow.push(vm.assets[i].id);

                        deviceRepository.saveDeviceSettings(vm.device.id, settings);

                    } else {

                        var index = settings.assetsToShow.indexOf(vm.assets[i].id);

                        if (index > -1) {
                            settings.assetsToShow.splice(index, 1);
                        }

                        deviceRepository.saveDeviceSettings(vm.device.id, settings);

                    }
                }

            }
        }

        function generateColor(asset) {

            var colorStyle = {
                'background-color': null
            };

            if (asset._assetColor) {
                colorStyle['background-color'] = asset._assetColor;
            } else {
                colorStyle['background-color'] = vm.colors[0];
            }

            return colorStyle;
        }

        function enableActivity(device) {

            return deviceRepository.update(device.id, {
                    name: device.name,
                    activityEnabled: true
                }).then(function(response) {

                    utils.notify.success('Success: ', 'Activity Log enabled.');

                    device.activityEnabled = true;

                })
                .catch(function(error) {

                    utils.notify.error('Error: ', 'Error updating device', null, true);

                });
        }

        function setControl(control) {

            vm.assetChartConfig.type = control;

            settings.control = control;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;

        }

        function timeSelected(time) {

            vm.assetChartConfig.timeScale = time;

            vm.assetChartConfig.page = 0;

            settings.timeScale = time;
            settings.page = 0;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;
        }

        function setTimeLabel() {

            var label = null;

            if (settings.timeScale === '24h') {

                label = '24 hours';

            }

            if (settings.timeScale === '60m') {
                label = '1 hour';
            }

            if (settings.timeScale === '7d') {

                label = '1 week';

            }

            if (settings.timeScale === '30d') {

                label = '1 month';

            }

            if (settings.timeScale !== '24h' && settings.timeScale !== '60m' && settings.timeScale !== '7d' && settings.timeScale !== '30d') {

                label = settings.timeScale;

            }

            return label;

        }

        function toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            vm.assetChartConfig.refreshChart = true;
        }

        function scrollLeft() {

            vm.assetChartConfig.page++;

            settings.page = vm.assetChartConfig.page;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;

        }

        function scrollRight() {

            if (vm.assetChartConfig.page > 0) {
                vm.assetChartConfig.page--;

                settings.page = vm.assetChartConfig.page;

                deviceRepository.saveDeviceSettings(vm.device.id, settings);

                vm.assetChartConfig.refreshChart = true;
            }

        }
    }
})();
