(function(ng) {
    ng
        .module('app')
        .factory('demo.adoptService', adoptService);

    adoptService.$inject = ['$rootScope', 'utils', 'demo.configuration', 'api.devicesService'];

    function adoptService($rootScope, utils, gameConfiguration, devicesService) {
        var service = {
            init: init
        };

        return service;

        ///////////////////////////////////////////

        function init() {

            $rootScope.$on('user.login', function() {
                var deviceId = utils.preferences.readGlobal(gameConfiguration.deviceIdKey, true);
                if (deviceId) {
                    adoptDevice(deviceId);
                }
            });
        }

        function adoptDevice(deviceId) {

            devicesService.adopt(deviceId).then(function() {
                utils.preferences.rememberGlobal(gameConfiguration.deviceIdKey, null, true);

                $rootScope.$emit('demo.deviceAdopted', deviceId);
            });
        }

    }
}(window.angular));
