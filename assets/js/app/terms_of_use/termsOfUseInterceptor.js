(function() {

    var app = angular
        .module('app')
        .factory('ToUInterceptor', ToUInterceptor);

    ToUInterceptor.$inject = [
        '$q',
        '$injector',
        'api.url',
        'localStorageService',
        'session'
    ];

    function ToUInterceptor($q, $injector, apiUrl, localStorageService, session) {

        var service = {
            request: request
        };

        return service;

        ///////////////////////

        function request(config) {

            if (isAttApi(config.url)) {

                var userDetails = session.getUserDetails();

                if (userDetails && !userDetails.termsAcceptedOn && !config.__ingoreTermsOfUseAcceptance) {

                    var state = $injector.get('$state');

                    state.go('termsOfUse');

                    return $q.reject({ isSilentError: true });
                }

            }

            return config || $q.when(config);
        }

        function isAttApi(url) {

            return url.substring(0, apiUrl.length) == apiUrl;

        }
    }

    app.config(['$httpProvider', function($httpProvider) {

        $httpProvider.interceptors.push('ToUInterceptor');

    }]);

}());
