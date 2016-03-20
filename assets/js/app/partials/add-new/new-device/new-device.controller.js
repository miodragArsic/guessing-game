(function(ng) {
    ng
        .module('app')
        .controller('NewDeviceController', NewDeviceController);

    NewDeviceController.$inject = [
        '$state',
        '$rootScope',
        '$scope',
        'device.repository',
        'asset.repository',
        'GroundContext',
        'utils'
    ];

    function NewDeviceController($state, $rootScope, $scope, DeviceRepository, AssetRepository, GroundContext, utils) {

        var vm = this;

        vm.groundId = null;
        vm.isIntroOnDevicesHidden = false;

        vm.hasMobileDevice = false;
        vm.hasKitDevice = false;
        vm.hasCustomDevice = false;
        vm.deviceType = null;

        vm.isOnGround = $state.$current.self.name === 'main.ground' ? true : false;

        vm.createDevice = createDevice;
        vm.createKitDevice = createKitDevice;
        vm.createMobileDevice = createMobileDevice;
        vm.toggleIntroOnDevices = toggleIntroOnDevices;

        activate();

        function activate() {

            vm.groundId = GroundContext.currentId;

            vm.isIntroOnDevicesHidden = utils.preferences.readPage('IntroOnDeviceStatus');

            if (vm.isIntroOnDevicesHidden) {

                vm.isIntroOnDevicesHidden = vm.isIntroOnDevicesHidden === 'true';

            }

            DeviceRepository.findAllInGround(vm.groundId)
                .then(function(devices) {

                    for (var i = 0; i < devices.length; i++) {

                        if (devices[i].type === 'quick-demo') {
                            vm.hasMobileDevice = true;
                        }

                        if (devices[i].type === 'arduino' || devices[i].type === 'rpi' || devices[i].type === 'intel-edison' || devices[i].type === 'proximus-lora') {
                            vm.hasKitDevice = true;
                        }

                        if (devices[i].type === 'custom') {
                            vm.hasCustomDevice = true;
                        }

                    }

                });

            $rootScope.$on('IntroOnDeviceStatusToggled', function(event, args) {

                vm.isIntroOnDevicesHidden = args;

            });
        }

        function createKitDevice(name, type) {

            vm.data = {
                name: name,
                type: type
            };


            DeviceRepository.createInGround(vm.data, vm.groundId)
                .then(function(device) {

                    if (type !== 'custom') {
                        createAssets(device);
                    } else {
                        $state.go('main.device', {
                            id: device.id
                        }).then(function() {
                            triggerStateControl('device-details');
                        });
                    }
                });

        }

        function createAssets(device) {

            var ledPromise = null;
            var knobPromise = null;

            if (vm.isOnGround) {
                $rootScope.$broadcast('user.onboarded.kitDevice', device);
            } else {
                $rootScope.$broadcast('user.created.device', device);
            }

            if (vm.data.type === 'arduino') {

                ledPromise = AssetRepository.create(device.id, '4', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, '0', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            } else if (vm.data.type === 'intel-edison') {

                ledPromise = AssetRepository.create(device.id, '4', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, '0', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            } else {

                ledPromise = AssetRepository.create(device.id, 'led', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, 'rotary_knob', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            }

            return utils.$q.all([ledPromise, knobPromise])
                .then(function(data) {
                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                        });
                });
        }

        function createDevice(name, type) {

            var data = {
                name: name,
                type: type
            };

            DeviceRepository.createInGround(data, vm.groundId)
                .then(function(device) {

                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                        });

                    if (vm.isOnGround) {
                        $rootScope.$broadcast('user.onboarded.customDevice', device);
                    } else {
                        $rootScope.$broadcast('user.created.device', device);
                    }
                });
        }

        function createMobileDevice(deviceName) {

            var data = {

                name: null,
                type: 'quick-demo'

            };

            if (deviceName) {

                data.name = deviceName;

            } else {

                data.name = 'Your smartphone';
            }

            DeviceRepository.createInGround(data, vm.groundId)
                .then(function(device) {

                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                            if (vm.isOnGround) {

                                $rootScope.$broadcast('user.onboarded.mobile', device);

                            } else {

                                $rootScope.$broadcast('user.created.device', device);

                            }
                        });
                });

        }

        function triggerStateControl(triggerId) {

            setTimeout(function() {
                var triggers = angular.element('[state-control-button]');

                for (var i = 0; i < triggers.length; i++) {

                    if (triggers[i].attributes['identifier'].value == triggerId) {

                        angular.element(triggers[i]).trigger('click');

                        setTimeout(clickOnTab('custom'), 400);
                    }

                }
            }, 600);
        }

        function clickOnTab(tabName) {

            angular.element(document.getElementById(tabName)).trigger('click');

        }

        function toggleIntroOnDevices() {

            vm.isIntroOnDevicesHidden = !vm.isIntroOnDevicesHidden;

            $rootScope.$broadcast('IntroOnDeviceStatusToggled', vm.isIntroOnDevicesHidden);

            utils.preferences.rememberPage('IntroOnDeviceStatus', vm.isIntroOnDevicesHidden);
        }

    }

}(window.angular));
