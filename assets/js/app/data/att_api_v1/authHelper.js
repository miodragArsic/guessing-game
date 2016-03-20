(function() {

    angular
        .module('app')
        .factory('authHelper', authenticationHelper);

    authenticationHelper.$inject = ['$rootScope', 'session', '$state'];

    function authenticationHelper($rootScope, session, $state) {

        var attemptedRoute = {
            name: null,
            params: null
        };

        var service = {
            getAttemptedRoute: getAttemptedRoute
        };

        $rootScope.$on('$stateChangeStart', stateChangeHandler);

        return service;

        function getAttemptedRoute() {

            return attemptedRoute;

        }

        function stateChangeHandler(event, toState, toParams, fromState, fromParams) {

            if (typeof toState.data === 'undefined' || typeof toState.data.requireLogin === 'undefined') {

                return;

            }

            if (!session.authentication().isAuth) {

                event.preventDefault();

                attemptedRoute.name = toState.name;

                attemptedRoute.params = toParams;

                $state.transitionTo('login');

            }

        }
    }

})();
