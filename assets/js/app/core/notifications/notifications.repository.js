(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationsRepository', notificationsRepository);

    notificationsRepository.$inject = ['NotificationModel', 'notificationService', 'utils', 'exception'];

    function notificationsRepository(Notification, notificationService, utils, exception) {

        var service = {
            find: find,
            markAsRead: markAsRead,
            markAllAsRead: markAllAsRead
        };

        return service;

        ////////////////

        function find(count, page) {

            return notificationService.find(count, page).then(function(body) {

                var models = [];
                angular.forEach(body.items, function(item) {
                    models.push(new Notification(item));
                });

                return models;
            }).catch(exception.catcher('There was a problem to load notifications.'));
        }

        function markAsRead(notification) {

            return notificationService.markAsRead(notification.at)
                .catch(exception.catcher('There was a problem to mark notification as read'));
        }

        function markAllAsRead() {

            return notificationService.markAllAsRead()
                .catch(exception.catcher('There was a problem to mark all notifications as read'));
        }
    }
})();
