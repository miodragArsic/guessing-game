(function(ng) {

    ng
        .module('app')
        .directive('deviceOrServiceStep', deviceOrServiceStep);

    deviceOrServiceStep.$inject = ['$filter', 'utility.deviceIcons'];

    function deviceOrServiceStep($filter, icons) {

        return {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/device-or-service-step/view.html',
            scope: {
                title: '@',
                assetTypeFilter: '@',
                choiceType: '=',
                services: '=?',
                devices: '=?',
                deviceBoxTitle: '@',
                deviceBoxSubtext: '@',
                showNotify: '='
            },
            link: linker
        };

        function linker(scope) {

            scope.actionOrTrigger = null;
            scope.deviceTextAppend = null;

            scope.getIcon = function(iconKey) {
                return icons.getIcon(iconKey);
            };

            scope.onDeviceSelected = function() {
                scope.choiceType = 'device';
            };

            scope.onServiceSelected = function() {
                scope.choiceType = 'service';
            };

            scope.hasAvailableDevices = function() {

                var filteredDevices = $filter('devicesWithAssetFilter')(scope.devices, scope.assetTypeFilter);

                return filteredDevices.length > 0;
            };
        }
    }
}(window.angular));
