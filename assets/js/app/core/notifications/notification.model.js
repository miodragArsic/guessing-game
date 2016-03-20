(function() {
    'use strict';

    angular
        .module('app')
        .factory('NotificationModel', factory);

    factory.$inject = ['$state'];

    function factory($state) {

        function Notification(data) {

            this.at = data.at;
            this.value = data.data;

            if (this.value.event === 'DeviceAssetNewState') {
                this.template = '/assets/js/app/core/notifications/asset-state-change.template.html';
            }

            if (this.value.event === 'RuleEngineExecutionNotification') {
                this.template = '/assets/js/app/core/notifications/message.template.html';
            }
        }

        Notification.prototype.view = function(replaceLocation) {

            var routeOptions = {};
            var routeName = null;
            var routeParams = {};

            if (replaceLocation) {
                routeOptions.location = 'replace';
            }

            if (this.value.data.asset) {
                routeName = 'main.asset';
                routeParams.id = this.value.data.asset.Id;
            }

            if (this.value.data.ground) {

                routeName = 'main.ground';
                routeParams.id = this.value.data.ground.Id;
            }

            if (routeName) {
                $state.go(
                    routeName,
                    routeParams,
                    routeOptions);
            }
        };

        return Notification;
    }
})();
