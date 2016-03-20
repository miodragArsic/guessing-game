(function() {

    angular
        .module('app')
        .factory('api.usersService', UserService);

    UserService.$inject = ['$http', 'api.url', 'exception', '$q'];

    function UserService($http, apiUrl, exception, $q) {

        var service = {
            getAll: getAll,
            deleteUser: deleteUser,
            getMe: getMe,
            getClients: getClients,
            godCreatesUser: godCreatesUser
        };

        return service;

        //////////////////////////////////////

        function getAll() {

            var url = apiUrl + 'users';

            return $http.get(url)
                .catch(exception.catcher('There was a problem to get all users.'));
        }

        function deleteUser(id) {

            var url = apiUrl + 'user/' + id;

            return $http.delete(url)
                .catch(exception.catcher('There was a problem to delete user.'));

        }

        function getMe() {

            var url = apiUrl + 'me';

            return $http.get(url, {
                    __ingoreTermsOfUseAcceptance: true
                })
                .then(function(response) {

                    return response.data;

                })
                .catch(exception.catcher('There was a problem while getting your data.'));
        }

        function getClients(token) {

            var deffered = $q.defer();

            var url = apiUrl + 'user/clients';
            var config = getConfig(token);

            $http.get(url, config)
                .then(function(response) {
                    deffered.resolve(response.data);
                })
                .catch(function(error) {
                    deffered.reject('Token is invalid.');
                });

            return deffered.promise;
        }

        function godCreatesUser(user) {

            var url = apiUrl + 'users';

            var data = {
                username: user.username,
                password: user.password,
                email: user.email,
                organizationName: user.organisation,
                name: user.fullName
            };

            return $http.post(url, data)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem create new user.'));
        }

        function getConfig(token) {

            var config = {
                headers: {},
                __donotrefreshtoken: true
            };

            if (token) {

                config.headers.Authorization = 'Bearer {0}'.format(token);

            }

            return config;
        }
    }

}());
