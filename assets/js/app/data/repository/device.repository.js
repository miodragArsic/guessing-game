(function() {

    angular
        .module('app')
        .factory('device.repository', devicesRepository);

    devicesRepository.$inject = ['api.devicesService', 'exception', 'deviceModel', 'utils', 'controls.repository'];

    function devicesRepository(devicesService, exception, DeviceModel, utils, controlsRepository) {

        var _defaultDeviceSettings = {

            control: controlsRepository.defaultDeviceControlName

        };

        var service = {
            create: create,
            createInGround: createInGround,
            update: update,
            updateControl: updateControl,
            remove: remove,
            find: find,
            findAll: findAll,
            findAllInGround: findAllInGround,

            //using token
            createUsingToken: createUsingToken,
            updateUsingToken: updateUsingToken,
            findAllUsingToken: findAllUsingToken,
            findSelfUsingTicket: findSelfUsingTicket,

            saveDeviceSettings: saveDeviceSettings,
            getDeviceSettings: getDeviceSettings
        };

        return service;

        //////////////////////////////

        function create(data) {

            return devicesService.create(data)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function subscribeDevice(device) {

            device.subscribe(true);

            return device;

        }

        function createInGround(data, groundId) {

            return devicesService.createInGround(data, groundId)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function update(deviceId, data) {

            return devicesService.updateDevice(deviceId, data)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error updating device.'));

        }

        function updateControl(id, control) {

            return devicesService.updateDeviceControl(id, control)
                .catch(exception.catcher('Error updating device control.'));

        }

        function remove(id) {

            return devicesService.deleteDevice(id)
                .catch(exception.catcher('Error deleting device'));

        }

        function createUsingToken(deviceConfig, token) {

            return devicesService.createUsingToken(deviceConfig, token)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function updateUsingToken(deviceConfig, token) {

            return devicesService.updateUsingToken(deviceConfig, token)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error updating device.'));

        }

        function find(deviceId) {

            return devicesService.get(deviceId)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice);

        }

        function findAll(byName) {

            return devicesService.getAll(byName)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading devices'));

        }

        function findAllInGround(groundId) {

            return devicesService.getFromGround(groundId)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading devices'));

        }

        function findAllUsingToken(byName, token) {

            return devicesService.getAllUsingToken(byName, token)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading public devices'));

        }

        function saveDeviceSettings(deviceId, settings) {

            var key = getDeviceSettingsKey(deviceId);

            var existingSettings = utils.preferences.readGlobal(key);

            if (existingSettings) {

                angular.extend(existingSettings, settings);

            } else {

                existingSettings = settings;

            }

            utils.preferences.rememberGlobal(key, existingSettings);

            return utils.$q.when();

        }

        function getDeviceSettings(deviceId) {

            var key = getDeviceSettingsKey(deviceId);

            var existingSettings = utils.preferences.readGlobal(key);

            var settings = null;

            if (existingSettings) {

                settings = angular.extend({}, _defaultDeviceSettings, existingSettings);

            } else {

                settings = angular.extend({}, _defaultDeviceSettings);

            }

            return utils.$q.when(settings);
        }

        function findSelfUsingTicket(ticket) {

            return devicesService.getSelfUsingTicket(ticket)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice);

        }

        function getDeviceSettingsKey(deviceId) {

            return 'device-settings-{0}'.format(deviceId);

        }
    }

}());
