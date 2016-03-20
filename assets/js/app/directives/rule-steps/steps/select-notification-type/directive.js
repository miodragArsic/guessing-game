(function(ng) {
    ng
        .module('app')
        .directive('selectNotificationType', selectNotificationType);

    selectNotificationType.$inject = [];

    function selectNotificationType() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/select-notification-type/view.html',
            scope: {
                selectedNotifications: '='
            },
            link: linker
        };

        return directive;

        ////////////////////////////////////

        function linker(scope) {

            scope.onWebItemClick = function() {
                scope.selectedNotifications.web = !scope.selectedNotifications.web;
            };

            scope.onPushItemClick = function() {
                scope.selectedNotifications.push = !scope.selectedNotifications.push;
            };

            scope.onEmailItemClick = function() {
                scope.selectedNotifications.email = !scope.selectedNotifications.email;
            };

        }
    }
}(window.angular));
