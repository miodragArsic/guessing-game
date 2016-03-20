(function() {
    'use strict';

    angular
        .module('app')
        .factory('membersService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {
        var service = {
            findAll: findAll,
            addMember: addMember,
            deleteMember: deleteMember

        };
        return service;

        ////////////////

        function findAll(groundId) {

            var url = appConfig.api.url + 'ground/' + groundId + '/members';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function addMember(groundId, memberEmail) {
            var url = appConfig.api.url + 'ground/' + groundId + '/members';
            var data = {
                email: memberEmail
            };
            return $http.post(url, data)
                .then(function(response) {
                    return response.data;
                });
        }

        function deleteMember(groundId, memberId) {
            var url = appConfig.api.url + 'ground/' + groundId + '/member/' + memberId;
            return $http.delete(url)
                .then(function(response) {
                    return response.data;
                });
        }

    }
})();
