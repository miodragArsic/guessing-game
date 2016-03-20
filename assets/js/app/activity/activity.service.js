(function() {
    'use strict';

    angular
        .module('app')
        .factory('activityService', activityService);

    activityService.$inject = ['$http', 'api.url'];

    function activityService($http, apiUrl) {

        var service = {
            getSubscriptions: getSubscriptions,
            subscribeOnGroundActivity: subscribeOnGroundActivity,
            unsubscribeOnGroundActivity: unsubscribeOnGroundActivity,
            getGroundActivity: getGroundActivity
        };
        return service;

        ////////////////

        function getGroundActivity(groundId, page) {
            var url = apiUrl + 'ground/' + groundId + '/activity';

            url = url + getQuery(page);

            return $http.get(url).then(function(response) {
                return response.data;
            });
        }

        function getSubscriptions() {
            var url = apiUrl + 'me/subscriptions';
            return $http.get(url).then(function(response) {

                if (response.data) {
                    return response.data;
                } else {
                    return [];
                }
            });
        }

        function subscribeOnGroundActivity(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/subscription';
            return $http.put(url);
        }

        function unsubscribeOnGroundActivity(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/subscription';
            return $http.delete(url);
        }

        function getQuery(page) {
            if (!page) {
                return '';
            }

            var query = '?page=' + page;

            return query;
        }
    }
})();
