(function() {
    'use strict';

    angular
        .module('app')
        .directive('assetControlGrid', assetControlGrid);

    function assetControlGrid() {

        var directive = {
            bindToController: true,
            controller: AssetControlGridController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/controlgrid.html',
            restrict: 'E',
            scope: {
                assets: '=',
                groundId: '=',
                model: '='
            }
        };

        return directive;
    }

    AssetControlGridController.$inject = ['$scope', 'pinRepository', 'assetModel', 'GroundContext'];

    function AssetControlGridController($scope, pinRepository, AssetModel, groundContext) {

        var vm = this;

        vm.removeAsset = removeAsset;
        vm.isPinned = isPinned;
        vm.togglePin = togglePin;
        vm.bindableAssets = [];
        vm.currentGround = null;

        activate();

        ////////////////////////////

        function activate() {

            $scope.model = vm.model;

            $scope.$watchCollection('vm.assets', function(newAssets) {

                if (!newAssets) {

                    return;

                }

                for (var i = 0; i < newAssets.length; i++) {

                    var asset = newAssets[i];

                    asset._isPinned = isPinned(asset);

                }

                vm.bindableAssets = newAssets;

            });

            $scope.$watch('vm.groundId', function(newGroundId) {

                if (newGroundId) {

                    vm.currentGround = groundContext.find(newGroundId);

                }

            });
        }

        function removeAsset(assetId) {

            for (var i = 0; i < vm.assets.length; i++) {

                if (vm.assets[i].id == assetId) {

                    vm.assets.splice(i, 1);

                }
            }
        }

        function isPinned(asset) {

            return pinRepository.isPinned(vm.groundId, asset.id);

        }

        function togglePin(asset) {

            if (isPinned(asset)) {

                pinRepository.unpin(vm.groundId, asset);

                asset._isPinned = false;

                if (vm.removeOnUnpin) {

                    removeAsset(asset.id);

                }

            } else {

                pinRepository.pin(vm.groundId, asset);

                asset._isPinned = true;

            }
        }
    }

})();
