(function() {

    angular
        .module('app')
        .controller('NavigationController', NavigationController);

    NavigationController.$inject = ['$rootScope', 'session', '$state', 'authService', 'GroundContext', 'userContext'];

    function NavigationController($rootScope, session, $state, authService, groundContext, userContext) {

        var vm = this;

        vm.logout = logout;
        vm.loggedIn = false;
        vm.groundContext = groundContext;
        vm.user = session.authentication().userName;
        vm.route = $state.current.name;
        vm.menuItems = {
            users: 'main.admin',
            account: 'main.accountSettings',
            authorizedClients: 'main.authorizedClients',
            devices: 'main.devices',
            gateways: 'main.gateways',
            rules: 'main.rules'
        };

        vm.selectedMenuItem = '';

        vm.isAdmin = isAdmin;
        vm.showSelectedMenuItem = showSelectedItem;

        /////////////////////////////

        $rootScope.$on('user.login', function() {
            vm.loggedIn = session.authentication().isAuth;
            vm.user = session.authentication().userName;
        });

        $rootScope.$on('user.logout', function() {
            vm.loggedIn = session.authentication().isAuth;
            vm.user = null;
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            vm.route = toState.name;

            if (vm.route == vm.menuItems.users) {
                vm.selectedMenuItem = 'God mode';
            } else if (vm.route == vm.menuItems.account) {
                vm.selectedMenuItem = 'Account settings';
            } else if (vm.route == vm.menuItems.authorizedClients) {
                vm.selectedMenuItem = 'Authorized clients';
            } else if (vm.route == vm.menuItems.metrics) {
                vm.selectedMenuItem = 'Metrics';
            } else if (vm.route == vm.menuItems.devices) {
                vm.selectedMenuItem = 'Your devices';
            } else if (vm.route == vm.menuItems.gateways) {
                vm.selectedMenuItem = 'Your gateways';
            } else if (vm.route == vm.menuItems.rules) {
                vm.selectedMenuItem = 'Your rules';
            }

        });

        $rootScope.$watch('inGround', function(newValue) {
            vm.inGround = newValue;
        });

        if (session.authentication().isAuth) {
            vm.loggedIn = true;
        }

        function showMenu() {

            if (groundContext.current) {
                return true;
            } else {
                return false;
            }
        }

        function isAdmin() {
            var user = userContext.user;
            if (user) {
                if (user.role == 'Administrator') {
                    return true;
                }
            } else {
                return false;
            }
        }

        function showSelectedItem() {
            if (vm.route == vm.menuItems.users) {
                return true;
            } else if (vm.route == vm.menuItems.account) {
                return true;
            } else if (vm.route == vm.menuItems.authorizedClients) {
                return true;
            } else if (vm.route == vm.menuItems.devices) {
                return true;
            } else if (vm.route == vm.menuItems.gateways) {
                return true;
            } else if (vm.route == vm.menuItems.rules) {
                return true;
            }

        }

        function logout() {

            authService.logout().then(function() {
                $state.go('login');
            });
        }
    }
}());
