(function() {

    angular
        .module('app')
        .factory('logger', logger);

    logger.$inject = ['$log', 'notifyService'];

    function logger($log, notifyService) {

        var service = {

            error: error,
            info: info,
            success: success,
            warning: warning

        };

        return service;

        /////////////////////

        function error(message, data, title) {

            notifyService.error(title, message, null, true);

            $log.error('Error: ' + message, data);

        }

        function info(message, data, title) {

            notifyService.info(title, message);

            $log.info('Info: ' + message, data);

        }

        function success(message, data, title) {

            notifyService.success(title, message);

            $log.info('Success: ' + message, data);

        }

        function warning(message, data, title) {

            notifyService.warning(title, message);

            $log.warn('Warning: ' + message, data);

        }
    }

}());
