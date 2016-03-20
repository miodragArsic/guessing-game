(function() {
    'use strict';

    angular
        .module('app')
        .controller('GuessingGameController', GuessingGameController);

    GuessingGameController.$inject = [
        '$scope',
        '$stateParams',
        'utils',
        'device.repository',
        'demo.game',
        '$window'
    ];

    function GuessingGameController($scope, $stateParams, utils, deviceRepository, Game, $window) {

        var vm = this;

        vm.gameDevice = null;

        vm.status = 'playing';

        vm.errorMessage = null;

        vm.game = new Game();

        vm.simulate = simulate;
        vm.suspend = suspend;
        vm.resetGame = resetGame;
        vm.reload = reload;
        vm.getConnectedDeviceInfo = getConnectedDeviceInfo;
        vm.connectedDevice = null;

        vm.disconnectDevice = disconnectDevice;

        var deviceId = utils.$rootScope.deviceId;

        var deviceTicket = utils.$rootScope.ticket;

        var HANDSHAKE_FAIL_THRESHOLD = 30000;
        var isSubscribedToAssets = false;

        var handshakeFailTimer = null;

        activate();

        ////////////////

        function activate() {

            loadGameDevice(deviceTicket);

            $scope.$on('$destroy', function() {
                if (vm.gameDevice) {
                    vm.gameDevice.unsubscribe();
                }
            });
        }

        function loadGameDevice(id) {

            return deviceRepository.findAllUsingToken( 'Your smartphone',id).then(function(device) {

                vm.gameDevice = device;
                vm.gameDevice.subscribe(true);

                init();

            }).catch(function() {
                setError();
            });
        }

        function init() {

            var engagerActiveAsset = vm.gameDevice.getAsset('sendingdata');

            if (engagerActiveAsset.state && engagerActiveAsset.state.value === false) {

                vm.game.suspend();

                processGame();

            } else {

                startGame();

                processGame();
            }
        }

        function processGame() {

            var engagerActiveAsset = vm.gameDevice.getAsset('sendingdata');

            if (vm.game.status === 'suspended') {

                var isStillSuspended = engagerActiveAsset.state && engagerActiveAsset.state.value === false;

                if (!isStillSuspended) {

                    vm.game.unsuspend();

                }
            }

            if (vm.status === 'playing') {

                if (engagerActiveAsset.state && engagerActiveAsset.state.value === true) {

                    vm.game.unsuspend();

                } else {

                    vm.game.suspend();

                }
            }

            if (!isSubscribedToAssets) {

                angular.forEach(vm.gameDevice.assets, function(asset) {

                    if (asset.name === 'sendingdata') {

                        asset.on('state', isEnagerActiveStateChangeHandler);

                    } else {

                        asset.on('state', function(state) {

                            vm.game.play(asset.name, state.Value);
                            $scope.$apply();

                        });
                    }
                });

                isSubscribedToAssets = true;
            }
        }

        function getConnectedDeviceInfo() {

            var deviceInfo = {
                os: '',
                browser: ''
            };

            var deviceInfoAsset = vm.gameDevice.getAsset('deviceinfoasset');

            if (deviceInfoAsset.state) {

                deviceInfo = deviceInfoAsset.state.value;

            }

            return deviceInfo;
        }

        function simulate(a, v) {

            vm.game.play(a, v);

        }

        function setError(message) {

            vm.status = 'error';

            vm.errorMessage = message;

        }

        function reload() {

            $window.location.reload(true);

        }

        function suspend(s) {

            if (s) {

                vm.game.suspend();

            } else {

                vm.game.unsuspend();

            }
        }

        function isEnagerActiveStateChangeHandler(state) {

            if (state.Value === false) {

                vm.game.suspend();

            } else {

                vm.game.unsuspend();

            }

            $scope.$apply();
        }

        function startGame() {

            vm.game.start();

            vm.status = 'playing';

        }

        function resetGame() {

            vm.game.reset();

        }

        function disconnectDevice() {

            var controlAsset = vm.gameDevice.getAsset('controlasset');

            controlAsset.send(JSON.stringify({
                Value: 'disconnect'
            }));

            vm.status = 'awaiting';

        }

    }
})();
