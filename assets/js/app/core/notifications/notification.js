(function() {
    'use strict';

    angular
        .module('app')
        .controller('NotificationController', NotificationController);

    NotificationController.$inject = ['$state', '$modal', 'notificationContext', 'AllNotificationsViewModel', 'GroundContext'];

    function NotificationController($state, $modal, notificationContext, AllNotificationsViewModel, groundContext) {

        var vm = this;
        vm.context = notificationContext;
        vm.notificationLimit = 5;
        vm.viewNotification = viewNotification;
        vm.markAsRead = markAsRead;
        vm.markAllAsRead = markAllAsRead;
        vm.showAll = showAll;

        ////////////////////////////////

        function viewNotification(notification) {

            markAsRead(notification);
            notification.view();
        }

        function markAsRead(notification) {

            notificationContext.markAsRead(notification);
        }

        function markAllAsRead() {

            notificationContext.markAllAsRead();
        }

        function showAll() {

            if ($state.current.name === 'main.notifications') {
                return;
            }

            var previousStateName = $state.current.name;
            var previousStateParams = angular.copy($state.params);

            var modalInstance = $modal.open({
                templateUrl: '/assets/js/app/core/notifications/all-notifications.html',
                controller: 'AllNotificationsController',
                controllerAs: 'vm',
                resolve: {
                    model: function() {

                        return new AllNotificationsViewModel.resolve().then(function(anvm) {
                            return anvm;
                        });
                    },

                    viewNotificationCallback: function() {

                        function closeModal(notification) {
                            modalInstance.close();
                        }

                        return closeModal;
                    }
                }
            });

            modalInstance.result.then(function(a, b, c) {
                //modal result promise is resolved as success if
                //link is clicked (state changed) from within the modal content
            }, function(reason) {

                //user clicked x or outside of the bounds of the modal
                //so we should return to previous state

                if (reason !== 'routeChange') {
                    $state.go(previousStateName, previousStateParams);
                }
            });

            $state.go('main.notifications', {}, {
                notify: false
            });
        }

    }
})();
