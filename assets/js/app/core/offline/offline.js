(function() {
    'use strict';

    angular
        .module('app')
        .factory('offline', factory);

    factory.$inject = ['$window', 'utils'];

    function factory($window, utils) {

        var service = {
            isOffline: false,
            isMessagingDisconnected: false,
            init: init
        };
        return service;

        ////////////////

        function init() {

            utils.$rootScope.$on('$messaging.connection.connected', function() {
                service.isMessagingDisconnected = false;
            });

            utils.$rootScope.$on('$messaging.connection.disconnected', function() {

                if (!service.isMessagingDisconnected) {

                    utils.notify.warning(
                        'Connection',
                        'Server connection has dropped.',
                        null,
                        true,
                        function() {
                            $window.location.reload();
                        },

                        'Reload page');

                    utils.$rootScope.$apply();
                }

                service.isMessagingDisconnected = true;

            });
        }

        function setOffline() {

            if (!service.isOffline) {
                utils.notify.warning('Connection', 'Server does not respond at the moment. Changes that you make now, may not be applied.', null, true);
            }

            service.isOffline = true;
            utils.$rootScope.$apply();
        }

        function setOnline() {

            service.isOffline = false;
            utils.$rootScope.$apply();
        }
    }
})();
