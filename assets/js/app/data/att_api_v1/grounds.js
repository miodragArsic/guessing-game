(function() {
    'use strict';

    angular
        .module('app')
        .factory('groundsService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {
        var service = {
            find: find,
            findAll: findAll,
            findAllPublic: findAllPublic,
            findAllShared: findAllShared,
            delete: deleteGround,
            create: create,
            update: update
        };
        return service;

        ////////////////

        function findAll() {

            var url = appConfig.api.url + 'me/grounds';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function findAllPublic() {

            var url = appConfig.api.url + 'grounds';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function findAllShared() {

            var url = appConfig.api.url + 'me/grounds?type=shared';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function find(id) {
            var url = appConfig.api.url + 'ground/' + id;
            return $http.get(url);
        }

        function deleteGround(id) {
            var url = appConfig.api.url + 'ground/' + id;
            return $http.delete(url);
        }

        function create(name, visibility) {
            var url = appConfig.api.url + 'me/grounds';

            return $http.post(url, {
                name: name,
                title: name,
                visibility: visibility
            });
        }

        function update(id, data) {
            var url = appConfig.api.url + 'ground/' + id;

            return $http.post(url, data);
        }
    }
})();
