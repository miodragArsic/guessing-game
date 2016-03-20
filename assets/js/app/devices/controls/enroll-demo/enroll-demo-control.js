(function() {
    'use strict';

    angular
        .module('app')
        .directive('enrollDemoDeviceControl', enrollDemoControl);

    enrollDemoControl.$inject = [];

    function enrollDemoControl() {

        var directive = {
            bindToController: true,
            controller: enrollDemoControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/enroll-demo/enroll-demo-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    enrollDemoControlController.$inject = ['urlShortenerService', 'session', 'origin'];

    function enrollDemoControlController(urlShortenerService, session, origin) {

        var vm = this;

        var sessionData = session.authentication();
        var gameToken = sessionData.accessToken;
        var gameTicket = vm.device.authorizations[0];

        vm.qrText = null;

        activate();

        // ////////////////

        function activate() {

            var longUrl = getQRCodeUrl(vm.device.name, gameTicket);
            urlShortenerService.shortenUrl(longUrl)
                .then(function(shortUrl) {
                    vm.qrText = shortUrl;
                });
        }

        function getQRCodeUrl(deviceName, gameToken) {

            return '{0}/apps/quick-demo-launcher?deviceName={1}&token={2}'.format(origin, deviceName, gameToken);
        }

    }
})();
