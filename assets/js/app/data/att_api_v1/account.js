(function(ng) {
    ng
        .module('app')
        .factory('api.accountService', AccountService);

    AccountService.$inject = [
        '$http',
        'session',
        'api.url',
        'exception'
    ];

    function AccountService($http, session, apiUrl, exception) {

        var service = {
            activate: activate,
            resendActivation: resendActivation,
            recoverPassword: recoverPassword,
            changePassword: changePassword
        };

        return service;

        /////////////////////////

        function activate(token) {

            var url = apiUrl + 'account/activation/' + token;
            return $http.put(url)
                .catch(exception.catcher('There was a problem to activate account.'));
        }

        function resendActivation(userNameEmail) {

            var url = apiUrl + 'account/resendactivation';
            var data = {
                email: userNameEmail
            };

            return $http.put(url, data)
                .then(handleSuccess)
                .catch(exception.catcher('There was a problem to send activation mail.'));
        }

        function recoverPassword(userName) {

            var url = apiUrl + 'account/recoverpassword';
            var data = {
                username: userName
            };

            return $http.put(url, data)
                .then(handleSuccess)
                .catch(exception.catcher('There was a problem to recover password.'));
        }

        function changePassword(oldPassword, newPassword, confirmedPassword) {

            var url = apiUrl + 'account/changepassword';
            var data = {
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmedPassword
            };

            return $http.post(url, data)
                .catch(exception.catcher('There was a problem to change password.'));
        }

        function handleSuccess(response) {
            return {
                success: true
            };
        }
    }

}(window.angular));
