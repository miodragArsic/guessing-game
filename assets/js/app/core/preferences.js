(function() {
    'use strict';

    angular
        .module('app')
        .factory('user.preferences', userPreferences);

    userPreferences.$inject = ['session', '$state', '$stateParams', 'localStorageService'];

    function userPreferences(session, $state, $stateParams, localStorage) {

        var service = {
            rememberPage: rememberPage,
            readPage: readPage,
            rememberGlobal: rememberGlobal,
            readGlobal: readGlobal
        };
        return service;

        ////////////////

        function rememberPage(key, value) {

            var uniqueKey = generateUniqueKey(key, false);

            localStorage.set(uniqueKey, value);
        }

        function readPage(key) {

            var uniqueKey = generateUniqueKey(key, false);

            return localStorage.get(uniqueKey);
        }

        function rememberGlobal(key, value, ignoreLoggedUser) {

            var ignore = false;

            if (ignoreLoggedUser !== undefined && ignoreLoggedUser !== null) {
                ignore = ignoreLoggedUser;
            }

            var uniqueKey = generateUniqueKey(key, true, ignore);

            localStorage.set(uniqueKey, value);
        }

        function readGlobal(key, ignoreLoggedUser) {

            var ignore = false;

            if (ignoreLoggedUser !== undefined && ignoreLoggedUser !== null) {
                ignore = ignoreLoggedUser;
            }

            var uniqueKey = generateUniqueKey(key, true, ignore);

            return localStorage.get(uniqueKey);
        }

        function generateUniqueKey(key, isGlobal, ignoreLoggedUser) {

            var user = 'guest';

            var auth = session.authentication();

            if (auth.isAuth) {
                user = auth.userName;
            }

            var uniqueKey = null;

            if (isGlobal) {
                if (ignoreLoggedUser) {
                    uniqueKey = 'preference_global_{0}'.format(key);
                } else {
                    uniqueKey = 'preference_global_{0}_{1}'.format(user, key);
                }

            } else {
                if (ignoreLoggedUser) {
                    uniqueKey = 'preference_{0}_{1}'.format(getStateKey(), key);
                } else {
                    uniqueKey = 'preference_{0}_{1}_{2}'.format(user, getStateKey(), key);
                }

            }

            return uniqueKey;
        }

        function getStateKey() {

            var stateKey = $state.current.name;

            for (var p in $stateParams) {
                if ($stateParams.hasOwnProperty(p)) {
                    stateKey += $stateParams[p];
                }
            }

            return stateKey;
        }
    }
})();
