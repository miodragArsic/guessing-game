(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.configuration', configuration);

    function configuration() {

        var totalAssets = 7;
        var assetConfiguration = {
            shake: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'shake'
                }
            },
            position: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'ontable'
                }
            },
            visibility: {
                profile: {
                    type: 'boolean',
                    supported: false
                },
                control: {
                    name: 'onoff'
                }
            },
            control: {
                profile: {
                    type: 'string',
                    supported: true
                },
                control: {
                    name: 'label'
                }
            },
            handshake: {
                profile: {
                    type: 'string',
                    supported: true
                },
                control: {
                    name: 'label'
                }
            },
            rotation: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'rotate'
                }
            },
            deviceInfo: {
                profile: {
                    type: 'object',
                    supported: true
                },
                control: {
                    name: 'json'
                }
            }
        };

        var service = {
            deviceType: 'quick-demo',
            sessionKey: 'quick-demo-device-name',
            deviceIdKey: 'quick-demo-device-id',
            deviceDescription: 'ready',
            deviceNamePrefix: 'Game-',
            publicUser: 'gg',
            publicUserPassword: 'game1234',
            deviceControlName: 'qrcode',
            assetConfiguration: assetConfiguration,
            totalAssets: totalAssets
        };

        return service;
    }
})();
