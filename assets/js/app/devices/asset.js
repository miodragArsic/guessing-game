(function(ng) {

    ng
        .module('app')
        .controller('AssetController', AssetController);

    AssetController.$inject = ['$scope', '$stateParams', '$state', 'session', 'utils', 'model'];

    function AssetController($scope, $stateParams, $state, session, utils, model) {

        var vm = this;

        vm.model = null;
        vm.goBack = goBack;
        vm.deleteAsset = deleteAsset;

        vm.client = {
            clientId: session.authentication().rmq.clientId,
            clientKey: session.authentication().rmq.clientKey
        };

        activate();

        ////////////////////////////////////////////

        function activate() {

            vm.model = model;

            $scope.$on('$destroy', function() {
                if (vm.model.asset) {
                    vm.model.asset.unsubscribe();
                }
            });
        }

        function goBack() {

            if (vm.model.origin == 'Device') {
                $state.go('main.device', {
                    id: vm.model.asset.deviceId
                });
            } else {
                $state.go('main.gateway', {
                    id: vm.model.asset.deviceId
                });
            }
        }

        function deleteAsset() {

            vm.model.delete().then(function() {
                goBack();
            });
        }
    }

}(window.angular));
