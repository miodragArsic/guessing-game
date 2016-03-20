(function(ng) {

    ng
        .module('app')
        .controller('MainPageController', MainPageController);

    MainPageController.$inject = ['$scope', '$rootScope', 'session'];

    function MainPageController($scope, $rootScope, session) {

        var vm = this;

        vm.isNavigationVisible = isNavigationVisible;
        vm.groundModel = null;
        vm.groundMenuOpen = false;
        vm.inGround = null;

        activate();

        /////////////////////////////

        function activate() {
        }

        function isNavigationVisible() {

        }

    }

}(window.angular));
