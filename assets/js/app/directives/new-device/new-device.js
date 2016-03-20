(function(ng) {
    ng
        .module('app')
        .directive('newDevice', NewDevice);
    NewDevice.$inject = ['utility.deviceIcons'];

    function NewDevice(icons) {

        var directive = {
            restrict: 'EA',
            templateUrl: '/assets/js/app/directives/new-device/view.html',
            scope: {
                onDeviceAdd: '&',
                onDeviceNameChange: '&',
                deviceError: '=',
                deviceType: '=',
                showCustom: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////////

        function linker($scope, iElm, iAttrs, controller) {

            $scope.deviceType = 'arduino';
            $scope.deviceName = null;
            var custom = {
                type: 'custom',
                text: 'Custom',
                icon: 'sl-device-custom'
            };

            var de = $scope.deviceError;

            $scope.deviceTypes = [{
                type: 'arduino',
                text: 'Arduino',
                icon: 'sl-device-arduino'
            }, {
                type: 'rpi',
                text: 'Raspberry Pi',
                icon: 'sl-device-rpi'
            }, {
                type: 'intel-edison',
                text: 'Intel Edison',
                icon: 'sl-device-intel-edison'
            }];
            if($scope.showCustom){
                $scope.deviceTypes.push(custom);
            }

            $scope.setDeviceType = function(deviceType) {
                $scope.deviceType = deviceType;
            };

            $scope.deviceAdd = function() {
                $scope.onDeviceAdd({
                    name: $scope.deviceName,
                    type: $scope.deviceType
                });
                $scope.deviceName = null;
            };

            $scope.isActiveDeviceType = function(dType) {
                return dType == $scope.deviceType;
            };

            $scope.deviceChangeName = function() {

                $scope.onDeviceNameChange({
                    name: $scope.deviceName,
                    type: $scope.deviceType
                });
            };

            $scope.getDeviceTypeIcon = function(dType) {
                return icons.getIcon(dType);
            };

            var el = iElm[0];
        }
    }
}(window.angular));