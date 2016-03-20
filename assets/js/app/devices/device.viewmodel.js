(function() {
    'use strict';

    angular
        .module('app')
        .factory('DeviceViewModel', factory);

    factory.$inject = [
        'utils',
        'CreateAssetModel',
        'EditDeviceModel',
        'device.repository',
        'asset.repository',
        'HeaderItemModel',
        'roles.manager',
        'api.rulesService',
        'utility.common',
        'session',
        'controls.repository',
        'FirstAppDictionary'
    ];

    function factory(utils, CreateAssetModel, EditDeviceModel, deviceRepository, assetRepository, HeaderItemModel, rolesManager, rulesService, common, session, controlsRepository, FirstAppDictionary) {

        function DeviceViewModel(device, groundId) {

            var that = this;

            that.settings = {};

            that.selectedControl = null;

            that.client = {
                clientId: session.authentication().rmq.clientId,
                clientKey: session.authentication().rmq.clientKey
            };

            that.isOpen = null;

            that.configOpen = false;

            that.guideOpen = false;

            that.groundId = groundId;

            that.editorOptions = utils.viewConfigs.getJsonEditorOptions();

            that.editorOptions.readOnly = rolesManager.authorize('device-control-save', {
                groundId: groundId
            }) ? false : 'nocursor';

            that.activeControl = 'controls';

            that.createAssetDisabled = false;

            try {

                var isFileSaverSupported = !!new Blob;

                that.isDownloadSupported = true;

            } catch (e) {

                that.isDownloadSupported = false;

            }

            that.init(device);

            that.editorOptions = utils.viewConfigs.getJsonEditorOptions();
            that.editorModel = '';
            that.stepsUrl = getStepsUrl(device.type);

            var dictionary = new FirstAppDictionary();

            that.editorModel = dictionary.generateScript(device, { id: device.id, clientId: that.client.clientId, clientKey: that.client.clientKey });

            that.editorRefresh = false;
        }

        DeviceViewModel.prototype.init = function(device) {

            var that = this;

            that.device = device;

            that.assetModel = new CreateAssetModel();

            that.editDeviceModel = new EditDeviceModel(device.name, device.description, device.title);

            that.editorControl = JSON.stringify(device.control, null, that.editorOptions.tabSize);

            if (device.type === 'intel-edison') {

                //for Edison device 'credentials.json'
                setupIntelEdisonCredentialsFile(that, that.device, that.client);

            }

            if (device.type === 'proximus-lora') {

                //for LoRa device 'keys.h'
                var keysFileIsReady = setupProximusLoraKeysFile(that, that.device);

                if (!keysFileIsReady) {

                    that.isDownloadSupported = false;

                }
            }

            rulesService.getDeviceRulesCount(device.id)
                .then(function(response) {

                    that.device.hasRules = response.data.hasRules;

                    that.device.hasNotificationRules = response.data.hasNotificationRules;

                    that.headerModel = HeaderItemModel.fromDevice(device);

                });

            var promises = [];

            promises.push(deviceRepository.getDeviceSettings(device.id));
            promises.push(controlsRepository.findAllDeviceControls());

            utils.$q.all(promises).then(function(results) {

                that.settings = results[0];

                that.controls = results[1];

                angular.forEach(that.controls, function(control) {

                    if (control.name === that.settings.control) {

                        that.selectedControl = control;

                    }
                });

            });
        };

        DeviceViewModel.prototype.downloadKeysFile = function() {

            var blob = new Blob([this.keysText], {

                type: 'text/plain;charset=utf-8'

            });

            saveAs(blob, 'keys.h');

        };

        DeviceViewModel.prototype.downloadCredentialsFile = function() {

            var blob = new Blob([this.credentialsJsonText], {

                type: 'text/plain;charset=utf-8'

            });

            saveAs(blob, 'credentials.json');

        };

        DeviceViewModel.prototype.toggleConfig = function() {

            this.configOpen = !this.configOpen;

        };

        DeviceViewModel.prototype.toggleGuide = function() {

            this.guideOpen = !this.guideOpen;

        };

        DeviceViewModel.prototype.isConfigOpen = function() {

            return this.configOpen;

        };

        DeviceViewModel.prototype.setControl = function(control) {

            this.activeControl = control;
        };

        DeviceViewModel.prototype.createAsset = function() {

            var that = this;

            that.createAssetDisabled = true;

            return assetRepository.create(that.device.id, utils.normalizeAssetName(that.assetModel.name), that.assetModel.name, that.assetModel.type)
                .then(function(asset) {

                    common.markNew(that.device.assets, [asset]);

                    utils.notify.success('Success: ', 'Asset is created.');

                    that.device.assets.push(asset);

                    that.assetModel.name = '';

                    that.isOpen = false;

                    return true;
                })
                .catch(function(error) {

                    return false;

                }).finally(function() {

                    that.createAssetDisabled = false;

                });
        };

        DeviceViewModel.prototype.delete = function() {

            return deviceRepository.remove(this.device.id)
                .then(function(response) {

                    utils.notify.success('Success: ', 'Device is deleted.');

                });
        };

        DeviceViewModel.prototype.updateControl = function(ctrl) {

            this.settings.control = ctrl.name;

            deviceRepository.saveDeviceSettings(this.device.id, this.settings);

        };

        DeviceViewModel.prototype.updateTitle = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                    name: that.device.name,
                    title: that.editDeviceModel.title
                })
                .then(function(d) {

                    that.device.title = d.title;

                    that.device.description = d.description;

                    utils.notify.success('Success: ', 'Device Updated');

                    that.headerModel.update(that.device.title, that.device.description);

                });
        };

        DeviceViewModel.prototype.updateDescription = function() {

            var that = this;

            that.editDeviceModel.saved = true;

            return deviceRepository.update(that.device.id, {
                    name: that.device.name,
                    description: that.editDeviceModel.description
                })
                .then(function(d) {

                    that.device.name = d.name;

                    that.device.description = d.description;

                    utils.notify.success('Success: ', 'Device Updated');

                    that.headerModel.update(that.device.name, that.device.description);

                });

        };

        DeviceViewModel.prototype.enableActivity = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                name: that.device.name,
                activityEnabled: true
            }).then(function(response) {

                utils.notify.success('Success: ', 'Activity Log enabled.');

                that.device.activityEnabled = true;

            });
        };

        DeviceViewModel.prototype.disableActivity = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                name: that.device.name,
                activityEnabled: false
            }).then(function(response) {

                utils.notify.success('Success: ', 'Activity Log disabled.');

                that.device.activityEnabled = false;

            });
        };

        DeviceViewModel.prototype.allowAssetTypeCreation = function(assetType) {

            var that = this;
            var permission = true;

            if (that.device.type === 'proximus-lora' && assetType === 'actuator') {

                permission = false;

            }

            return permission;
        };

        DeviceViewModel.prototype.downloadScript = function() {

            var that = this;

            var blob = null;

            if (that.device.type === 'rpi') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain;charset=utf-8'

                });

                saveAs(blob, 'first_app.py');

            } else if (that.device.type === 'arduino') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain'

                });

                saveAs(blob, 'first_app.ino');

            } else if (that.device.type === 'intel-edison') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain'

                });

                saveAs(blob, 'main.js');

            }
        };

        DeviceViewModel.resolve = function(deviceId) {

            return deviceRepository.find(deviceId)
                .then(function(device) {

                    var viewModel = new DeviceViewModel(device, device.groundId);

                    return viewModel;

                });
        };

        function setupIntelEdisonCredentialsFile(model, device, client) {

            model.credentialsJsonText = '{\r\n' +
                '   "deviceId": "' + device.id + '",\r\n' +
                '   "clientId": "' + client.clientId + '",\r\n' +
                '   "clientKey": "' + client.clientKey + '"\r\n' +
                '}';

        }

        function setupProximusLoraKeysFile(model, device) {

            if (device.meta && device.meta.keys && device.meta.keys.DEV_ADDR && device.meta.keys.APPSKEY && device.meta.keys.NWKSKEY) {

                model.keysText = '#ifndef KEYS_h\r\n' +
                    '#define KEYS_h\r\n\r\n' +

                    'uint8_t DEV_ADDR[4] = ' + device.meta.keys.DEV_ADDR + ';\r\n' +
                    'uint8_t APPSKEY[16] = ' + device.meta.keys.APPSKEY + ';\r\n' +
                    'uint8_t NWKSKEY[16] = ' + device.meta.keys.NWKSKEY + ';\r\n\r\n' +

                    '#endif';

                return true;

            } else {

                model.keysText = 'Looks like data for keys.h file is not available.';

                return false;
            }
        }

        function getStepsUrl(deviceType) {

            var url = '/assets/js/app/devices/setup-steps/';

            url += deviceType + '-steps.html';

            return url;
        }

        return DeviceViewModel;
    }
})();
