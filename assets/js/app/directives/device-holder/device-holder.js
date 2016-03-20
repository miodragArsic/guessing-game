(function(ng) {
    ng.module('app').directive('deviceHolder', [
        '$log',
        'utility.deviceIcons',
        function($log, deviceIcons) {
            function createDirectiveByType(element, type) {
                var el = document.createElement(type);
                element.appendChild(el);
            }

            function getPrimaryAsset(assets) {
                for (var i = 0; i < assets.length; i++) {
                    if (assets[i].style == 'primary') {
                        return assets[i];
                    }
                }
            }

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/device-holder/view.html',
                scope: {
                    deviceData: '='
                },
                link: function(scope, element, attrs) {
                    var deviceContent = element[0].querySelector('.device-content');

                    $log.log(scope.deviceData);

                    scope.deviceHeaderIcon = deviceIcons.getIcon(scope.deviceData.iconKey);
                    scope.primaryAsset = getPrimaryAsset(scope.deviceData.assets);

                    if (scope.deviceData.control.type) {
                        createDirectiveByType(deviceContent, scope.deviceData.control.type);
                    }
                }
            }
        }
    ]);
}(window.angular));
