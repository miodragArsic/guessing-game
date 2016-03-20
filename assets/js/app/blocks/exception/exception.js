(function() {

    angular
        .module('app')
        .factory('exception', exception);

    exception.$inject = ['$log', 'logger', 'utils'];

    function exception($log, logger, utils) {

        var service = {
            catcher: catcher
        };

        return service;

        /////////////////////////

        function catcher(message) {

            return function(reason) {

                var errorMessage = message;

                if (isClientError(reason)) {

                    var msg = getErrorMessage(reason);

                    if (msg) {

                        errorMessage = msg;

                    }

                }

                if (!reason.isSilentError) {

                    logger.error(errorMessage, reason, 'Error: ');

                }

                return utils.$q.reject(reason);
            };
        }

        function isClientError(reason) {

            return reason.status >= 400 && reason.status <= 499;

        }

        function getErrorMessage(reason) {

            if (reason.data) {

                if (reason.data.error_description) {

                    return reason.data.error_description;

                }

                if (reason.data.error) {

                    return reason.data.error;

                }

                if (reason.data.message) {

                    return reason.data.message;

                }

            }

            return undefined;

        }
    }

}());
