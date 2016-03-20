(function(ng) {
    ng
        .module('app')
        .factory('api.servicesService', servicesService);

    servicesService.$inject = ['$http', 'session', 'api.url', '$q'];

    function servicesService($http, session, apiUrl, $q) {

        var service = {
            getAll: getAll,
            get: get
        };

        return service;
        //////////////////////////////

        function getAll() {
            var url = apiUrl + 'services';
            return $http.get(url);
        }

        function get(serviceAlias) {
            var url = apiUrl + 'services/' + serviceAlias;
            return $http.get(url);
        }

        /////////Fakes until the API is available
        function getAllFake() {
            var deferred = $q.defer();

            deferred.resolve({
                data: [{
                    "id": "5497eacfd1510009ece8369b",
                    "name": "Email Me",
                    "type": "emailMe",
                    "is": "actuator",
                    "iconKey": "fa-envelope",
                    "description": "View the details of your notify-me email service",
                    "detailsPage": "services/emailme",
                    "profile": {
                        "type": {
                            "to": "string",
                            "subject": "string",
                            "body": "string"
                        }
                    }
                }]
            });

            return deferred.promise;
        }

        function getFake(serviceAlias) {
            var deferred = $q.defer();

            deferred.resolve({
                data: {
                    "id": "demo",
                    "name": "email me",
                    "is": "actuator",
                    "description": null,
                    "createdOn": "0001-01-01T00:00:00",
                    "createdBy": null,
                    "updatedOn": "0001-01-01T00:00:00",
                    "updatedBy": null,
                    "profile": {
                        "type": {
                            "to": "string",
                            "subject": "string",
                            "body": "string"
                        }
                    }
                }
            });

            return deferred.promise;
        }
    }

}(window.angular));
