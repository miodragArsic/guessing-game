(function(ng) {
    ng
        .module('app')
        .factory('utility.deviceIcons', deviceIcons);
    deviceIcons.$inject = [];

    function deviceIcons() {

        var service = {
            getIcon: getIcon
        };

        var icons = {
            'binary-sensor': 'sl-device-flood-sensor',
            'binary-switch': 'sl-device-relay',
            'flood-sensor': 'sl-device-flood-sensor',
            'motion-sensor': 'sl-device-motion-sensor',
            'wall-plug': 'sl-device-wall-plug',
            'device-custom': 'sl-device-custom',
            'intel-edison': 'sl-device-intel-edison',
            'quick-demo': 'sl-device-mobile',
            'proximus-lora': 'sl-device-lora',
            'device-proximus-lora': 'sl-device-lora',

            gateway: 'sl-device-gateway',

            arduino: 'sl-device-arduino',
            rpi: 'sl-device-rpi',
            fa_envelope: 'sl-service-email',
            fa_day_time: 'sl-service-calendar',
            asset: 'sl-asset-default',
            sensor: 'sl-asset-sensor',
            actuator: 'sl-asset-actuator',
            virtual: 'sl-asset-virtual',
            config: 'sl-asset-config',
            custom: 'sl-device-custom'
        };

        return service;

        //////////////////////////////

        function getIcon(deviceName) {
            if (deviceName === null) {
                return icons.custom;
            }

            var icon = icons[deviceName];

            if (icon) {
                return icon;
            } else {
                return icons.custom;
            }
        }

    }
}(window.angular));
