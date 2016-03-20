(function() {
    'use strict';

    angular
        .module('app')
        .directive('qrcodeDeviceControl', qrcodeDeviceControl);

    function qrcodeDeviceControl() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            templateUrl: '/assets/js/app/demo_device/qrcodeDeviceControl.html',
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;

        function link(scope, element, attrs) {}
    }

    Controller.$inject = ['session', 'urlShortenerService', 'origin'];

    function Controller(session, urlShortenerService, origin) {

        var vm = this;
        var sessionData = session.authentication();
        var gameToken = null;

        vm.qrCodeUrl = '';

        activate();

        ///////////////////////////////////////////////

        function activate() {

            if (sessionData.isAuth) {
                gameToken = sessionData.accessToken;
            } else {
                gameToken = publicToken;
            }

            var longUrl = getQRCodeUrl(vm.device.name, gameToken);
            urlShortenerService.shortenUrl(longUrl)
                .then(function(shortUrl) {
                    vm.qrCodeUrl = shortUrl;
                });
        }

        function getQRCodeUrl(deviceName, token) {

            return '{0}/mobilebrowserdevice?deviceName={1}&token={2}'.format(origin, deviceName, token);
        }
    }
})();
