(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceName', deviceName);

    deviceName.$inject = ['device.repository', 'nameCache'];

    function deviceName(deviceRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=deviceName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.devices[scope.id]) {
                    $(element[0]).html(nameCache.devices[scope.id]);
                } else {

                    deviceRepository.find(scope.id).then(function(device) {
                        $(element[0]).html(device.title);
                        nameCache.devices[scope.id] = device.title;
                    });
                }
            });
        }
    }

})();
