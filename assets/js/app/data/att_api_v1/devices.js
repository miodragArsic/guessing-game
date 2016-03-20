(function(ng) {
    ng
        .module('app')
        .factory('api.devicesService', DeviceService);

    DeviceService.$inject = ['$http', 'session', 'api.url', 'public.token'];

    function DeviceService($http, session, apiUrl, publicToken) {

        var service = {
            getAll: getAll,
            create: create,
            createInGround: createInGround,
            getFromGround: getFromGround,
            get: get,
            refresh: refresh,
            enable: enable,
            disable: disable,
            deleteDevice: deleteDevice,
            updateDeviceControl: updateDeviceControl,
            updateDevice: updateDevice,
            adopt: adopt,

            ///using token
            getAllUsingToken: getAllUsingToken,
            getSelfUsingTicket: getSelfUsingTicket,
            createUsingToken: createUsingToken,
            updateUsingToken: updateUsingToken
        };

        return service;

        /////////////////////////////////////

        function getAll(gatewayId, newDevicesOnly) {
            var url = apiUrl + 'device?includeAssets=true';

            var config = {
                params: {}
            };

            if (gatewayId) {
                config.params.gatewayId = gatewayId;
            }

            if (newDevicesOnly) {
                config.params.new = true;
            }

            return $http.get(url, config);
        }

        function create(data) {
            var url = apiUrl + 'device';

            return $http.post(url, data);
        }

        function createInGround(data, groundId) {
            var url = apiUrl + 'ground/' + groundId + '/devices';

            return $http.post(url, data);
        }

        function get(id) {
            return $http.get(apiUrl + 'device/' + id)
                .then(function(response) {
                    return response.data;
                });
        }

        function getFromGround(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/devices';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function doDeviceAction(actionName, deviceId) {
            return $http.put(apiUrl + 'device/' + deviceId + '/' + actionName);
        }

        function refresh(id) {
            return doDeviceAction('refresh', id);
        }

        function enable(id) {
            return doDeviceAction('enable', id);
        }

        function disable(id) {
            return doDeviceAction('disable', id);
        }

        function deleteDevice(id) {
            var url = apiUrl + 'device/' + id;
            return $http.delete(url);
        }

        function updateDeviceControl(id, control) {

            var data = {};

            if (control) {
                data.control = control;
            }

            return $http.put(apiUrl + 'device/' + id + '/control', data);
        }

        function updateDevice(id, data) {

            return $http.put(apiUrl + 'device/' + id, data);
        }

        function adopt(deviceId) {
            var url = apiUrl + 'device/' + deviceId + '/adopt';

            return $http.post(url);
        }

        function getAllUsingToken(byName, token) {

            var url = apiUrl + 'device?includeAssets=true';

            if (byName) {
                url += '&name=' + byName;
            }

            var config = getConfigForTicket(token);

            return $http.get(url, config);
        }

        function createUsingToken(deviceConfig, token) {
            var url = apiUrl + 'device';

            var config = getConfigForTicket(token);

            return $http.post(url, deviceConfig, config);
        }

        function updateUsingToken(deviceConfig, token) {

            var data = {};

            if (deviceConfig.name) {
                data.name = deviceConfig.name;
            }

            if (deviceConfig.description) {
                data.description = deviceConfig.description;
            }

            if (deviceConfig.activityEnabled !== undefined && deviceConfig.activityEnabled !== null) {
                data.activityEnabled = deviceConfig.activityEnabled;
            }

            if (deviceConfig.assets) {
                data.assets = deviceConfig.assets;
            }

            if (deviceConfig.title) {
                data.title = deviceConfig.title;
            }

            var config = getConfig(token);

            return $http.put(apiUrl + 'device/' + deviceConfig.id, data, config);
        }

        function getSelfUsingTicket(ticket) {

            var config = getConfigForTicket(ticket);

            var url = apiUrl + 'self';

            return $http.get(url, config);

        }

        function getConfigForTicket(ticket) {

            var config = {
                headers: {}
            };

            if (ticket) {
                config.headers.Authorization = 'Ticket {0}'.format(ticket);
            }

            return config;

        }

        function getConfig(token) {
            var config = {
                headers: {}
            };

            if (token) {
                config.headers.Authorization = 'Bearer {0}'.format(token);
            }

            return config;
        }
    }
}(window.angular));
