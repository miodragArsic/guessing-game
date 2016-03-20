(function(ng) {
    ng
        .module('app')
        .factory('api.GatewayService', GatewayService);

    GatewayService.$inject = ['$http', 'api.url', 'exception'];

    function GatewayService($http, apiUrl, exception) {
        var service = {

            listGateways: listGateways,
            getFromGround: getFromGround,
            getGateway: getGateway,
            claimGateway: claimGateway,
            enrollGateway: enrollGateway,
            updateGateway: updateGateway,
            deleteGateway: deleteGateway

        };

        return service;

        ////////////////////////////

        function deleteGateway(gatewayId) {
            var url = apiUrl + 'gateway/' + gatewayId;

            return $http.delete(url)
                .then(function(response) {
                    return true;
                });
        }

        function listGateways() {
            var url = apiUrl + 'gateway';

            return $http.get(url, {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });
        }

        function getFromGround(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/gateways';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getGateway(id, includeDevices, includeAssets) {
            var url = apiUrl + 'gateway/' + id;

            if (includeDevices && includeAssets) {
                url += '?includeDevices=true&includeAssets=true';
            } else if (includeDevices) {
                url += '?includeDevices=true';
            } else if (includeAssets) {
                url += '?includeAssets=true';
            }

            return $http.get(url, {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });

        }

        function claimGateway(groundId, claimCode) {
            var url = apiUrl + 'ground/' + groundId + '/claim';

            var data = {
                claimCode: claimCode
            };

            return $http.post(url, JSON.stringify(data), {
                headers: getHeaders()
            });
        }

        function enrollGateway(uid, id, name, description, key) {
            var url = apiUrl + 'gateway/';

            var data = {};

            if (id) {
                data.id = id;
            }

            if (name) {
                data.name = name;
            }

            if (description) {
                data.description = description;
            }

            if (key) {
                data.key = key;
            }

            return $http.post(url, JSON.stringify(data), {
                headers: getHeaders()
            });
        }

        function updateGateway(id, name, description) {
            var url = apiUrl + 'gateway/' + id;

            var data = {
                name: name,
                description: description
            };

            return $http.put(url, JSON.stringify(data), {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });
        }

        function getHeaders() {
            return {
                'Content-Type': 'application/json'
            };
        }

    }

}(window.angular));
