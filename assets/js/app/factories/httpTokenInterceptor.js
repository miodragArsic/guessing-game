(function() {

    var app = angular
        .module('app')
        .factory('httpTokenInterceptor', HttpTokenInterceptor);

    HttpTokenInterceptor.$inject = [
        '$q',
        '$injector',
        'api.url',
        'localStorageService',
        'session'
    ];

    function HttpTokenInterceptor($q, $injector, apiUrl, localStorageService, session) {

        var service = {
            request: request,
            responseError: responseError
        };

        return service;

        ///////////////////////

        function request(config) {

            if (isAttApi(config.url)) {
                config.headers = config.headers || {};

                var accessToken = session.authentication().accessToken;

                if (accessToken && !config.headers.Authorization) {
                    config.headers.Authorization = 'Bearer ' + accessToken;
                }
            }

            return config || $q.when(config);
        }

        function responseError(rejection) {

            var deferred = $q.defer();

            if (rejection.status === 401 && isAttApi(rejection.config.url)) {

                if (rejection.config.__donotrefreshtoken) {
                    deferred.reject(rejection);
                    return deffered.promise;
                }

                var state = $injector.get('$state');

                if (!rejection.config.__tokenrefreshed) {

                    var authService = $injector.get('authService');
                    var refreshToken = session.authentication().refreshToken;

                    session.clearAuthenticationData();

                    if (refreshToken !== null) {
                        authService.refreshToken(refreshToken)
                            .then(function() {
                                rejection.config.__tokenrefreshed = true;
                                var config = rejection.config;
                                delete config.headers.Authorization;
                                retryHttpRequest(rejection.config, deferred);
                            })
                            .catch(function() {
                                state.go('login');
                            });
                    } else {
                        state.go('login');
                    }

                } else {
                    state.go('unauthorized');
                }

            } else {

                deferred.reject(rejection);
            }

            return deferred.promise;
        }

        function isAttApi(url) {
            return url.substring(0, apiUrl.length) == apiUrl;
        }

        function retryHttpRequest(config, deferred) {

            var $http = $injector.get('$http');

            $http(config)
                .then(function(response) {
                    deferred.resolve(response);
                })
                .catch(function(response) {
                    deferred.reject(response);
                });
        }

        function getKeyFromLocalStorageAuth(key) {

            var auth = session.authentication();

            return (auth && auth[key]) ? auth[key] : null;
        }
    }

    app.config(['$httpProvider', function($httpProvider) {

        $httpProvider.interceptors.push('httpTokenInterceptor');

    }]);

}());
