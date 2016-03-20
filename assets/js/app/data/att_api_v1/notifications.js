(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {

        var service = {
            find: find,
            markAsRead: markAsRead,
            markAllAsRead: markAllAsRead
        };
        return service;

        ////////////////

        function find(count, page) {

            var url = appConfig.api.url + 'me/notifications';

            url = url + getQuery(count, page);

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getQuery(count, page) {
            if (!page && !count) {
                return '';
            }

            var query = '?';
            var items = [];

            if (page) {
                items.push('page=' + page);
            }

            if (count) {
                items.push('count=' + count);
            }

            query = query + items.join('&');

            return query;
        }

        function markAsRead(timestamp) {

            var url = appConfig.api.url + 'me/notifications';

            return $http.patch(url, {
                at: timestamp
            });
        }

        function markAllAsRead() {

            var url = appConfig.api.url + 'me/notifications';
            return $http.patch(url, {});
        }
    }
})();
