(function() {
    'use strict';

    angular
        .module('app')
        .controller('AllNotificationsController', AllNotificationsController);

    AllNotificationsController.$inject = ['$scope', 'model', 'viewNotificationCallback'];

    function AllNotificationsController($scope, model, viewNotificationCallback) {

        var vm = this;
        vm.model = model;
        vm.viewNotification = viewNotification;

        activate();

        ///////////////////////////////////

        function activate() {

            vm.model.subscribe();

            $scope.$on('$destroy', function() {
                vm.model.destroy();
            });
        }

        function viewNotification(notification) {
            vm.model.viewNotification(notification);

            if (viewNotificationCallback) {
                viewNotificationCallback(notification);
            }
        }

    }
})();
