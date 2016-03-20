(function(ng) {

    ng.module('app').controller('modals.confirmItemDelete', ConfirmItemDelete);

    ConfirmItemDelete.$inject = ['$modalInstance', '$state', 'utils', 'item', 'model'];

    function ConfirmItemDelete($modalInstance, $state, utils, item, model) {

        var vm = this;

        utils.$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $modalInstance.dismiss();
        });

        vm.itemModel = item;

        vm.model = model;

        vm.selection = false;

        vm.CONFIRM_DELETION_TEXT = 'DELETE';
        vm.confirmInput = null;
        vm.errorMsg = null;

        vm.selectModalDissmisal = selectModalDissmisal;

        vm.confirmItemDelete = confirmItemDelete;

        //////////////////////////////////////

        function confirmItemDelete(device) {

            if (device) {

                vm.model.delete(vm.itemModel.device)
                    .then(function() {

                        $modalInstance.close();

                    });

            } else {

                vm.itemModel.delete().then(function() {
                    if (vm.itemModel.hasOwnProperty('device')) {
                        $state.go('main.groundDevices', {
                            id: vm.itemModel.groundId
                        });
                    } else if (vm.itemModel.hasOwnProperty('gateway')) {
                        $state.go('main.groundGateways', {
                            id: vm.itemModel.groundId
                        });
                    }
                });
            }
        }

        function selectModalDissmisal() {


            utils.preferences.rememberGlobal('DeleteDeviceModalStatus', vm.selection);

        }
    }

}(window.angular));
