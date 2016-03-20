(function() {

    angular
        .module('app')
        .factory('api.clientAuthorizationService', ClientAuthorizationService);

    ClientAuthorizationService.$inject = ['$http', 'api.url', 'exception'];

    function ClientAuthorizationService($http, apiUrl, exception) {

        var service = {
            getClients: getClients,
            revokeClientAuthorization: revokeClientAuthorization
        };

        return service;

        ///////////////////////////////////////////

        // - /authorizations gets all authorized clients

        function getClients() {

            var url = apiUrl + 'me/clients';

            return $http.get(url)
                .then(function(response) {

                    return response.data;

                })
                .catch(exception.catcher('There was a problem to load authorized clients.'));
        }

        function revokeClientAuthorization(clientId) {

            var url = apiUrl + 'client/' + clientId;

            return $http.delete(url)
                .catch(exception.catcher('There was a problem to load authorized clients.'));

        }
    }
}());
