(function() {

    angular
        .module('app')
        .factory('session', session);

    session.$inject = ['$q', '$log', 'localStorageService', '$rootScope', 'notifyService'];

    function session($q, $log, localStorageService, $rootScope, notifyService) {

        var service = {
            init: init,
            authentication: getAuthenticationData,
            saveAuthenticationData: saveAuthenticationData,
            clearAuthenticationData: clearAuthenticationData,
            getUserDetails: getUserDetails,
            setUserDetails: setUserDetails
        };

        return service;

        //////////////////////////////////////////////

        function init() {

            if (!getAuthenticationData()) {

                clearAuthenticationData();

            }

            $rootScope.getCurrentUser = function() {

                return getAuthenticationData();

            };
        }

        function getAuthenticationData() {

            var data = localStorageService.get('authenticationData');

            if (isValidAccessToken(data)) {

                data.isAuth = true;

            }

            return data;
        }

        function saveAuthenticationData(data) {

            if (data) {

                data.isAuth = true;

            }

            localStorageService.set('authenticationData', {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                issued: data['.issued'],
                expires: data['.expires'],
                rmq: {
                    clientId: data['rmq:clientId'],
                    clientKey: data['rmq:clientKey']
                },
                userName: data.userName,
                isAuth: data.isAuth
            });
        }

        function clearAuthenticationData() {

            localStorageService.set('authenticationData', {
                accessToken: null,
                refreshToken: null,
                issued: null,
                expires: null,
                rmq: null,
                userName: '',
                isAuth: false
            });

            localStorageService.set('userDetails', null);
        }

        function setUserDetails(data) {

            localStorageService.set('userDetails', data);

        }

        function getUserDetails() {

            return localStorageService.get('userDetails');

        }

        function isValidAccessToken(data) {

            if (data) {

                return new Date(data.expires) > new Date();

            } else {

                return false;

            }
        }

    }
}());
