(function(ng) {
    ng
        .module('app')
        .controller('DevicesController', DevicesController);

    DevicesController.$inject = [
        '$state',
        '$scope',
        '$modal',
        'model',
        'utils'
    ];

    function DevicesController($state, $scope, $modal, model, utils) {

        var vm = this;

        vm.model = model;
        vm.createDevice = createDevice;
        vm.openDeleteDeviceModal = openDeleteDeviceModal;

        var status = utils.preferences.readGlobal('DeleteDeviceModalStatus');

        activate();

        function activate() {
            $scope.$on('$destroy', function() {
                angular.forEach(vm.model.devices, function(device) {
                    // device.unsubscribe();
                });
            });
        }

        function createDevice(name, type) {

            vm.model.createDevice(name, type)
                .then(function(device) {

                    $state.go('main.device', {
                        id: device.id
                    });
                });
        }

        function openDeleteDeviceModal(device) {

            if (status !== 'true') {

                var modalInstance = $modal.open({
                    templateUrl: '/assets/js/app/modals/confirm_item_delete/view.html',
                    controller: 'modals.confirmItemDelete',
                    controllerAs: 'vm',
                    resolve: {
                        item: function() {
                            return device;
                        },
                        model: function() {
                            return vm.model;
                        }
                    }
                });

            } else {

                vm.model.delete(device.device);
            }

        }
    }

}(window.angular));
