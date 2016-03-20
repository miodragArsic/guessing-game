(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationContext', factory);

    factory.$inject = ['utils', 'session', 'notificationsRepository', 'NotificationModel', 'userContext'];

    function factory(utils, session, notificationsRepository, Notification, userContext) {

        function NotificationContext() {
            this.notifications = [];
        }

        NotificationContext.prototype.getUnreadCount = function() {

            var unreadCount = 0;

            angular.forEach(this.notifications, function(notification) {
                if (!notification.value.isRead) {
                    unreadCount++;
                }
            });

            return unreadCount;
        };

        NotificationContext.prototype.markAsRead = function(notification) {

            notification.value.isRead = true;

            notificationsRepository.markAsRead(notification);
        };

        NotificationContext.prototype.markAllAsRead = function() {

            angular.forEach(this.notifications, function(notification) {
                notification.value.isRead = true;
            });

            notificationsRepository.markAllAsRead();
        };

        NotificationContext.prototype.init = function() {

            var that = this;

            utils.$rootScope.$on('user.login', userLoginHandler);
            utils.$rootScope.$on('user.logout', userLogoutHandler);
            utils.$rootScope.$on('$messaging.notification', userNotificationHandler);

            if (session.authentication().isAuth) {
                setupNotifications();
            }

            function userLoginHandler() {

                setupNotifications();
            }

            function userLogoutHandler() {

                that.notifications = [];
            }

            function userNotificationHandler(event, notification) {

                that.notifications.push(notification);
                utils.$rootScope.$apply();
            }

            function setupNotifications() {

                return notificationsRepository.find().then(function(notifications) {
                    that.notifications = notifications;
                });
            }
        };

        return new NotificationContext();
    }
})();
