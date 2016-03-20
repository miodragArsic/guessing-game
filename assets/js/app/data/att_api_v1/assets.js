(function(ng) {
    ng.module('app').factory('api.assetsService', AssetsService);

    AssetsService.$inject = ['$http', 'api.url', 'exception', 'deviceActivityService', 'utils'];

    function AssetsService($http, apiUrl, exception, deviceActivityService, utils) {

        var assetTypes = [{
            name: 'Sensor',
            type: 'sensor',
            cssClass: 'sl-device-wall-plug'
        }, {
            name: 'Actuator',
            type: 'actuator',
            cssClass: 'sl-device-wall-plug'
        }, {
            name: 'Virtual',
            type: 'virtual'
        }, {
            name: 'Config',
            type: 'config'
        }];

        var service = {
            publishCommand: publishCommand,
            publishState: publishState,
            replaceProfile: replaceProfile,
            replaceControl: replaceControl,
            createAsset: createAsset,
            getAsset: getAsset,
            getAssetTypes: getAssetTypes,
            deleteAsset: deleteAsset,
            updateAsset: updateAsset,
            areSameProfiles: areSameProfiles,
            normalizeProfileType: normalizeProfileType,
            getAssetHistory: getAssetHistory,

            createAssetUsingToken: createAssetUsingToken,
            createAssetUsingTicket: createAssetUsingTicket

        };

        return service;

        //////////////////////////////

        function publishCommand(id, value) {
            var url = apiUrl + 'asset/' + id + '/command';

            var data = {
                value: value
            };

            return $http.put(url, data)
                .then(function(response) {
                    return true;
                });
        }

        function publishState(id, value) {

            var url = apiUrl + 'asset/' + id + '/state';

            var data = {
                value: value
            };

            return $http.put(url, data);
        }

        function replaceProfile(deviceId, assetName, profile) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetName + '/profile';

            return $http.put(url, profile);
        }

        function replaceControl(deviceId, assetName, value) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetName + '/control';

            var data = value;

            return $http.put(url, data);
        }

        function createAsset(deviceId, name, title, type, profile, control) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;

            var data = {};

            if (deviceId) {
                data.deviceId = deviceId;
            }

            if (title) {
                data.title = title;
            }

            if (type) {
                data.is = type;
            }

            if (profile !== null && profile !== undefined) {

                if ((typeof profile) === 'object') {

                    data.profile = profile;

                } else {

                    data.profile = {

                        type: profile

                    };
                }

            } else {

                data.profile = {

                    type: 'string'
                };

            }

            if (control !== null && control !== undefined) {

                data.control = {
                    name: control
                };

            }

            return $http.put(url, data);
        }

        function createAssetUsingToken(deviceId, assetConfig, token) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetConfig.name;

            var config = getConfig(token);

            return $http.put(url, assetConfig, config);
        }

        function getAsset(id) {
            var url = apiUrl + 'asset/' + id;

            return $http.get(url);
        }

        function getAssetTypes() {
            return assetTypes;
        }

        function deleteAsset(deviceId, name) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;
            return $http.delete(url);
        }

        function updateAsset(deviceId, assetId, name, assetIs, title) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;

            var data = {
                id: assetId,
                title: title,
                is: assetIs
            };

            return $http.put(url, data);
        }

        function getAssetHistory(id, from, to, resolution) {

            var url = apiUrl + 'asset/' + id + '/activity';

            var query = '?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to) + '&resolution=' + resolution;

            url = url + query;

            return $http.get(url).then(function(response) {
                return response.data;
            });

        }

        function createAssetUsingTicket(ticket, data){

            var url = apiUrl + 'asset/' + data.name;

            var config = getConfigForTicket(ticket);

            return $http.put(url, data, config)
        }

        function areSameProfiles(leftProfile, rightProfile) {

            if (!leftProfile || !rightProfile) {
                return false;
            }

            if (!leftProfile.type || !rightProfile.type) {
                return false;
            }

            var left = normalizeProfileType(leftProfile.type);
            var right = normalizeProfileType(rightProfile.type);

            return left == right;
        }

        function normalizeProfileType(profileType) {

            if (typeof profileType != 'string') {
                return null;
            }

            profileType = profileType.toLowerCase();

            if (profileType == 'bool' || profileType == 'boolean') {
                return 'bool';
            }

            if (profileType == 'int' || profileType == 'integer') {
                return 'int';
            }

            if (profileType == 'double' || profileType == 'float' || profileType == 'decimal' || profileType == 'number') {
                return 'number';
            }

            if (profileType == 'string' || profileType == 'text') {
                return 'string';
            }

            if (profileType == 'datetime' || profileType == 'date' || profileType == 'time') {
                return 'datetime';
            }

            if (profileType == 'timespan' || profileType == 'timerange' || profileType == 'duration') {
                return 'timespan';
            }

            return profileType;
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
