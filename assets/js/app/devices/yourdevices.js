(function(ng) {
    ng
        .module('app')
        .controller('YourDevicesController', YourDevicesController);

    YourDevicesController.$inject = [
        '$state',
        '$scope',
        'YourDevicesViewModel'
    ];

    function YourDevicesController($state, $scope, YourDevicesViewModel) {

        var vm = this;

        vm.model = null;
        vm.goToEnvironment = goToEnvironment;

        activate();

        function activate() {

            YourDevicesViewModel.resolve().then(function(model) {
                vm.model = model;
            });

        }

        function goToEnvironment() {
            $state.go('main.environment');
        }

    }

}(window.angular));
