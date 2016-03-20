(function() {
    'use strict';

    angular
        .module('app')
        .factory('AllNotificationsViewModel', factory);

    factory.$inject = ['notificationsRepository', 'notificationContext', 'utils'];

    function factory(notificationsRepository, notificationContext, utils) {

        var PAGE_SIZE = 10;
        var unsubscribeHandler = null;

        function AllNotificationsViewModel(notifications) {

            var that = this;
            that.notifications = notifications;
            that.pageSize = PAGE_SIZE;
            that.page = 0;
        }

        AllNotificationsViewModel.prototype.markAsRead = function(notification) {

            notificationContext.markAsRead(notification);
        };

        AllNotificationsViewModel.prototype.viewNotification = function(notification) {

            this.markAsRead(notification);
            notification.view(true);
        };

        AllNotificationsViewModel.prototype.loadMore = function() {

            var that = this;

            that.page++;

            return notificationsRepository.find(PAGE_SIZE, that.page)
                .then(function(result) {
                    that.notifications = that.notifications.concat(result);
                    return result;
                });
        };

        AllNotificationsViewModel.prototype.destroy = function() {

            if (unsubscribeHandler) {
                unsubscribeHandler();
                unsubscribeHandler = null;
            }
        };

        AllNotificationsViewModel.prototype.subscribe = function() {

            var that = this;

            unsubscribeHandler = utils.$rootScope.$on('user.notification', userNotificationHandler);

            function userNotificationHandler(event, notification) {
                that.notifications.push(notification);
            }
        };

        AllNotificationsViewModel.resolve = function() {

            return notificationsRepository.find(PAGE_SIZE)
                .then(function(result) {
                    return new AllNotificationsViewModel(result);
                });
        };

        return AllNotificationsViewModel;
    }
})();
