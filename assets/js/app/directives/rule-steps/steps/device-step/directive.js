(function(ng) {
    ng
        .module('app')
        .directive('deviceStep', deviceStep);

    deviceStep.$inject = ['utility.deviceIcons'];

    function deviceStep(icons) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/device-step/view.html',
            scope: {
                devices: '=',
                title: '@',
                selectedDevice: '=',
                assetTypeFilter: '@'

            },
            link: linker
        };

        return directive;

        ////////////////////////////////////

        function linker(scope) {

            scope.getIcon = function(iconKey) {
                return icons.getIcon(iconKey);
            };

            scope.onDeviceSelected = function(item, model) {
                scope.selectedDevice = item;
            };
        }
    }
}(window.angular));