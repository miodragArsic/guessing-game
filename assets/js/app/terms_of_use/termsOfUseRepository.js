(function() {
    'use strict';

    angular
        .module('app')
        .factory('termsOfUseRepository', factory);

    factory.$inject = ['utils', 'session', '$http', 'api.url', 'termsOfUseCDNUrl'];

    function factory(utils, session, $http, apiUrl, termsOfUseCDNUrl) {

        var service = {
            getTermsOfUse: getTermsOfUse,
            acceptTermsOfUse: acceptTermsOfUse
        };

        return service;

        ////////////////

        function getTermsOfUse() {

            return $http.get(termsOfUseCDNUrl)
                .then(function(response) {

                    return response.data;

                });
        }

        function acceptTermsOfUse() {

            var url = apiUrl + 'terms/latest/acceptance';

            return $http.post(url, null, {

                __ingoreTermsOfUseAcceptance: true

            });

        }
    }
})();
