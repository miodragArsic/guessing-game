(function() {

    angular
        .module('app')
        .controller('DeviceController', DeviceController);

    DeviceController.$inject = [
        '$scope',
        '$state',
        '$stateParams',
        '$modal',
        'session',
        'utils',
        'model'
    ];

    function DeviceController($scope, $state, $stateParams, $modal, session, utils, model) {

        var PREFERENCE_CONTROL_KEY = 'device_tab';

        var vm = this;

        vm.model = null;
        vm.goToAsset = goToAsset;
        vm.openDeleteDeviceModal = openDeleteDeviceModal;
        vm.setControl = setControl;
        vm.qrControl = 'enroll-demo';

        vm.modalStatus = utils.preferences.readGlobal('DeleteDeviceModalStatus');

        //TODO: refactor to $root
        vm.client = {
            clientId: session.authentication().rmq.clientId,
            clientKey: session.authentication().rmq.clientKey
        };

        activate();

        ////////////////

        function activate() {

            vm.model = model;

            var controlToShow = getControlToShow();

            if (controlToShow === 'device-control' && (!vm.model.device.control || !vm.model.device.control.name)) {

                controlToShow = 'device-control';

            }

            vm.model.setControl(controlToShow);

            $scope.$on('$destroy', function() {

                if (vm.model.device) {

                    vm.model.device.unsubscribe();

                    for (var i = 0; i < vm.model.device.assets.length; i++) {

                        vm.model.device.assets[i].unsubscribe();

                    }
                }
            });
        }

        function getControlToShow() {

            var defaultControl = 'asset-controls';

            var supportedControls = ['asset-controls', 'asset-list', 'activity', 'device-control'];

            if ($stateParams.assetCtrl && supportedControls.indexOf($stateParams.assetCtrl) >= 0) {

                return $stateParams.assetCtrl;

            } else {

                var userPref = utils.preferences.readPage(PREFERENCE_CONTROL_KEY);

                if (supportedControls.indexOf(userPref) >= 0) {

                    return userPref;

                }
            }

            return defaultControl;
        }

        function setControl(ctrl) {

            vm.model.setControl(ctrl);

            utils.preferences.rememberPage(PREFERENCE_CONTROL_KEY, ctrl);

            $state.go('main.deviceOpt', {
                id: vm.model.device.id,
                assetCtrl: ctrl

            }, {
                notify: false,
                reload: false
            });
        }

        function goToAsset(assetId) {

            $state.go('main.asset', {
                id: assetId
            });

        }

        function openDeleteDeviceModal() {

            if (vm.modalStatus !== 'true') {

                var modalInstance = $modal.open({
                    templateUrl: '/assets/js/app/modals/confirm_item_delete/view.html',
                    controller: 'modals.confirmItemDelete',
                    controllerAs: 'vm',
                    resolve: {
                        item: function() {
                            return vm.model;
                        },
                        model: function() {
                            return null;
                        }
                    }
                });
            } else {

                vm.model.delete().then(function() {
                    if (vm.model.hasOwnProperty('device')) {
                        $state.go('main.groundDevices', {
                            id: vm.model.groundId
                        });
                    } else if (vm.model.hasOwnProperty('gateway')) {
                        $state.go('main.groundGateways', {
                            id: vm.model.groundId
                        });
                    }
                });
            }

        }
    }

}());
