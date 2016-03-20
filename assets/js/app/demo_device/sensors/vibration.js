(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.vibration', vibration);

    vibration.$inject = ['$window'];

    function vibration($window) {

        var service = {
            isSupported: isSupported,
            vibrate: vibrate
        };
        return service;

        ////////////////

        function isSupported() {
            return $window.navigator && $window.navigator.vibrate;
        }

        function vibrate(ms) {

            if (!isSupported()) {
                return;
            }

            if (!ms) {
                ms = 500;
            }

            $window.navigator.vibrate(ms);
        }

    }
})();
