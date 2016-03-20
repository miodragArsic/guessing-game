(function() {

    angular
        .module('app')
        .controller('MobileBrowserDeviceController', MobileBrowserDeviceController);

    MobileBrowserDeviceController.$inject = [
        'device.repository',
        'asset.repository',
        'demo.sensors',
        'demo.configuration',
        '$location',
        'messaging.gateway',
        'utils'
    ];

    function MobileBrowserDeviceController(deviceRepository, assetRepository, sensors, gameConfiguration, $location, messagingGateway, utils) {

        var deviceInfo = utils.getDeviceInfo();

        var deviceName = $location.search().deviceName;
        var token = $location.search().token;

        var deviceTitle = deviceInfo.os + ' ' + deviceInfo.browser;

        var deviceDescription = '# "Quick demo" device\n';

        var vm = this;

        vm.gameDevice = null;
        vm.showLog = false;
        vm.logs = [];
        vm.status = 'connecting';
        vm.errorMessage = null;
        vm.disconnect = null;

        vm.reload = reload;
        vm.restart = restartGame;
        vm.play = playGame;
        vm.toggleShowLog = toggleShowLog;
        vm.deviceInfo = deviceInfo;

        activate();

        ////////////////

        function activate() {

            if (!token || !deviceName) {
                utils.notify.error('Game Initialization', 'Game paramteres are missing.', null, true);
                return;
            }

            if (!deviceInfo.mobile) {
                vm.status = 'notmobile';
                return;
            }

            configureSensorProfiles();

            getDevice()
                .then(initializeDevice)
                .then(connect)
                .then(initializeAssets)
                .then(setupForGame);
        }

        function configureSensorProfiles() {

            if (sensors.shake.isSupported()) {

                gameConfiguration.assetConfiguration.shake.profile.supported = true;

            }

            if (sensors.position.isSupported()) {

                gameConfiguration.assetConfiguration.position.profile.supported = true;

            }

            if (sensors.rotation.isSupported()) {

                gameConfiguration.assetConfiguration.rotation.profile.supported = true;

            }

            gameConfiguration.assetConfiguration.visibility.profile.supported = true;

        }

        function getDevice() {

            return deviceRepository.findSelfUsingTicket(token).catch(function() {

                setError('Error contacting server, try reloading the page.');

            });
        }

        function initializeDevice(device) {

            vm.gameDevice = device;

            return utils.$q(function(resolve, reject) {

                resolve(device);

            });
        }

        function connect(device) {

            var client = device.client;

            if (!messagingGateway.isConnected) {

                return messagingGateway.connect(client.clientId, client.clientSecret).catch(function() {

                    setError('Looks like something went wrong while connecting to the server. Try reloading your page.');

                });
            } else {

                return utils.$q(function(resolve, reject) {

                    resolve(true);

                });
            }
        }

        function setDescription(device) {

            deviceDescription = deviceDescription.format(device.id);

            return deviceRepository.updateUsingToken({
                id: vm.gameDevice.id,
                name: deviceName,
                description: deviceDescription
            }, token).then(function() {

                return device;

            });
        }

        function initializeAssets() {

            var gameAssets = getGameAssets();

            var promises = [];

            function handleAssetCreated(createdAsset) {

                vm.gameDevice.assets.push(createdAsset);

                return createdAsset;

            }

            for (var i = 0; i < gameAssets.length; i++) {

                var asset = gameAssets[i];
                var existingAsset = vm.gameDevice.getAsset(asset.name);

                if (!existingAsset) {

                    asset.deviceId = vm.gameDevice.id;

                    var assetCreatePromise = assetRepository.createUsingTicket(token, asset)
                        .then(handleAssetCreated);

                    promises.push(assetCreatePromise);

                }
            }

            return utils.$q.all(promises);

        }

        function getGameAssets() {

            var gameAssets = [];

            gameAssets.push(createAssetDefinition('amishaking', 'Shaking', 'sensor', gameConfiguration.assetConfiguration.shake.profile, gameConfiguration.assetConfiguration.shake.control));

            gameAssets.push(createAssetDefinition('position', 'Position', 'sensor', gameConfiguration.assetConfiguration.position.profile, gameConfiguration.assetConfiguration.position.control));

            gameAssets.push(createAssetDefinition('sendingdata', 'Sending data', 'sensor', gameConfiguration.assetConfiguration.visibility.profile, gameConfiguration.assetConfiguration.visibility.control));

            gameAssets.push(createAssetDefinition('rotation', 'Rotation', 'sensor', gameConfiguration.assetConfiguration.rotation.profile, gameConfiguration.assetConfiguration.rotation.control));

            return gameAssets;
        }

        function createAssetDefinition(name, title, is, profile, control, style) {

            var assetObject = {};

            if (name) {

                assetObject.name = name;

            }

            if (title) {

                assetObject.title = title;

            }

            if (is) {

                assetObject.is = is;

            }

            if (profile) {

                assetObject.profile = profile;

            }

            if (control) {

                assetObject.control = control;

            }

            if (style) {

                assetObject.style = style;

            }

            return assetObject;
        }

        function subscribeToHtml5Sensors() {

            if (sensors.shake.isSupported()) {

                sensors.shake.subscribeOnShakeChange(function(isShakin) {

                    var shakeAsset = vm.gameDevice.getAsset('amishaking');

                    var data = {};

                    if (isShakin) {

                        data.Value = 'shaking';

                    } else {

                        data.Value = 'still';

                    }

                    shakeAsset.send(JSON.stringify(data));

                    logMessage(data.Value);

                });
            }

            if (sensors.position.isSupported()) {

                sensors.position.subscribeOnPositionChange(function(position) {

                    var positionAsset = vm.gameDevice.getAsset('position');

                    var data = {};

                    if (position) {

                        data.Value = 'ontable';

                    } else {

                        data.Value = 'notontable';

                    }

                    positionAsset.send(JSON.stringify(data));

                    logMessage(data.Value);

                });
            }

            if (sensors.rotation.isSupported()) {

                sensors.rotation.subscribeOnRotation(function(rotation) {

                    var rotationAsset = vm.gameDevice.getAsset('rotation');

                    rotationAsset.send(JSON.stringify({
                        Value: rotation
                    }));

                    logMessage(rotation);

                });
            }

            sensors.pageVisibility.subscribeOnPageVisibility(function(message) {

                var visibilityAsset = vm.gameDevice.getAsset('sendingdata');

                if (message === true) {

                    visibilityAsset.send(JSON.stringify({
                        Value: message
                    }));

                    vm.status = 'playing';

                } else {

                    visibilityAsset.send(JSON.stringify({
                        Value: message
                    }));
                }

            });
        }

        function setupForGame() {

            vm.status = 'ready';

            playGame();

        }

        function sendInitialStatesAndSubscribe() {

            var deviceInfoAsset = vm.gameDevice.getAsset('deviceinfoasset');

            deviceInfoAsset.send(JSON.stringify({
                Value: deviceInfo
            }));
        }

        function restartGame() {

            var activityAsset = vm.gameDevice.getAsset('controlasset');

            var data = {
                Value: 'restart'
            };

            activityAsset.send(JSON.stringify(data));

        }

        function setError(message) {

            vm.status = 'error';

            vm.errorMessage = message;

        }

        function reload() {

            window.location.reload(true);

        }

        function toggleShowLog() {

            vm.showLog = !vm.showLog;

        }

        function playGame() {

            subscribeToHtml5Sensors();

            vm.status = 'playing';

            utils.$timeout(function() {

                var visibilityAsset = vm.gameDevice.getAsset('sendingdata');

                visibilityAsset.send(JSON.stringify({
                    Value: true
                }));

            }, 500);

        }

        function logMessage(message, data) {

            var datetime = getTime();

            vm.logs.push({
                time: datetime,
                message: message,
                data: data
            });

        }

        function getTime() {

            var currentdate = new Date();

            var datetime = currentdate.getDate() + '/' + (currentdate.getMonth() + 1) + '/' + currentdate.getFullYear() + ' @ ' + currentdate.getHours() + ':' + currentdate.getMinutes() + ':' + currentdate.getSeconds() + ' ' + currentdate.getMilliseconds();

            return datetime;

        }
    }
}());
