(function() {

    angular
        .module('app')
        .factory('authService', AuthService);

    AuthService.$inject = [
        '$http',
        'api.url',
        'session',
        'api.clientId',
        'userContext',
        'exception'
    ];

    function AuthService($http, apiUrl, session, apiClientId, userContext, exception) {

        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        var service = {
            register: register,
            refreshToken: refreshToken,
            login: login,
            logout: logout,
            getDataFromHash: getDataFromHash,
            continueActivation: continueActivation,
            root: root
        };

        return service;

        ///////////////////////////

        function register(registration) {

            return $http.post(apiUrl + 'register', registration)
                .catch(exception.catcher('There was problem to create your account.'));
        }

        function refreshToken(token) {

            var data = 'grant_type=refresh_token&refresh_token=' + token + '&client_id=' + apiClientId;

            return $http.post(apiUrl + 'login', data, {
                headers: headers
            }).then(function(response) {
                session.saveAuthenticationData(response.data);
                return response.data;
            });
        }

        function login(loginData) {

            var data = 'grant_type=password&username=' + encodeURIComponent(loginData.username) + '&password=' + encodeURIComponent(loginData.password) + '&client_id=' + apiClientId;

            return $http.post(apiUrl + 'login', data, {
                    headers: headers
                })
                .then(onSuccessfullLogin)
                .then(loadUserInformation)
                .catch(exception.catcher('Could not login with credentials provided.'));
        }

        function onSuccessfullLogin(response) {

            session.saveAuthenticationData(response.data);

            return response.data;
        }

        function loadUserInformation() {

            return userContext.load();
        }

        function logout() {

            return $http.post(apiUrl + 'logout', null, {
                    headers: headers
                }).then(function(response) {

                    session.clearAuthenticationData();
                    userContext.unload();
                })
                .catch(exception.catcher('There was a problem to sign you out.'));
        }

        function getDataFromHash(hash) {

            var url = apiUrl + 'account/completion/' + hash;
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem with your activation link.'));
        }

        function continueActivation(hash, newUsername, newPassword) {

            var url = apiUrl + 'account/completion/' + hash;

            var data = {
                username: newUsername,
                password: newPassword
            };

            return $http.put(url, data)
                .catch(exception.catcher('There was a problem to continue activation process.'));
        }

        function root() {

            var url = apiUrl;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

    }
}());
