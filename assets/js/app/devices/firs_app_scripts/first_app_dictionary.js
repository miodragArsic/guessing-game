(function() {
    'use strict';

    angular
        .module('app')
        .factory('FirstAppDictionary', factory);

    factory.$inject = ['firstAppRepository'];

    function factory(firstAppRepository) {

        function FirstAppDictionary() {

            this.rpiParts = firstAppRepository.getRPIParts();

            this.arduinoParts = firstAppRepository.getArduinoParts();

            this['intel-edisonParts'] = firstAppRepository.getEdisonParts();

        }

        FirstAppDictionary.prototype.getHeader = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.header;

        };

        FirstAppDictionary.prototype.getAsset = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.asset;
        };

        FirstAppDictionary.prototype.getCredentials = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.credentials;
        };

        FirstAppDictionary.prototype.getPinModes = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.pinModes;
        };

        FirstAppDictionary.prototype.getCallback = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.callback;

        };

        FirstAppDictionary.prototype.getConnect = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.connect;

        };

        FirstAppDictionary.prototype.getWhileLoop = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.while;
        };

        FirstAppDictionary.prototype.generateScript = function(device, auth) {

            var that = this;

            var script = null;

            if (device.type === 'arduino') {

                script = that.generateArduinoScript(device, auth);

            } else if (device.type === 'rpi') {

                script = that.generateRPIScript(device, auth);

            } else if (device.type === 'intel-edison') {

                script = that.generateEdisonScript(device, auth);

            }

            return script;

        };

        FirstAppDictionary.prototype.generateRPIScript = function(device, auth) {

            var that = this;

            var script = '';

            script += that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            var asset1 = null;
            var asset2 = null;

            if (device.assets.length > 0) {

                for (var i = 0; i < device.assets.length; i++) {

                    var currentAsset = device.assets[i];

                    if (currentAsset.name === 'led' && asset1 === null) {

                        asset1 = configureAsset(that.getAsset(device.type), currentAsset.name, currentAsset.is, 4, currentAsset.title, 'digital');
                    }

                    if (currentAsset.name === 'rotary_knob' && asset2 === null) {

                        asset2 = configureAsset(that.getAsset(device.type), currentAsset.name, currentAsset.is, 0, currentAsset.title, 'analog');

                    }
                }
            }

            script += asset1 + asset2 + that.getPinModes(device.type);

            script += that.getCallback(device.type) + that.getConnect(device.type) + that.getWhileLoop(device.type);

            return script;
        };

        FirstAppDictionary.prototype.generateArduinoScript = function(device, auth) {

            var that = this;

            var script = null;

            script = that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            script += that.getPinModes(device.type);

            script += that.getConnect(device.type);

            script += that.getWhileLoop(device.type) + that.getCallback(device.type);

            return script;
        };

        FirstAppDictionary.prototype.generateEdisonScript = function(device, auth) {

            var that = this;

            var script = '';

            script += that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            var asset = null;

            if (device.assets.length > 0) {

                for (var i = 0; i < device.assets.length; i++) {

                    var assetName = device.assets[i].name;

                    var assetNameTrail = assetName.slice(-1);

                    if (assetNameTrail === '4' && asset === null) {

                        asset = that.getAsset(device.type);

                        asset = asset.replace('ACTUATOR_ID', assetNameTrail);
                    }
                }
            }

            script += asset;

            script += that.getPinModes(device.type);

            script += that.getCallback(device.type);

            script += that.getConnect(device.type);

            script += that.getWhileLoop(device.type);

            return script;
        };

        function configureAsset(assetScript, assetName, assetType, pinNumber, assetTitle, assetMode) {

            assetScript = assetScript.replace('ASSET_NAME', assetName);

            assetScript = assetScript.replace(new RegExp('PIN_NUMBER', 'g'), pinNumber);

            assetScript = assetScript.replace(new RegExp('ASSET_TYPE', 'g'), assetType);

            if (assetMode !== null && assetMode !== undefined) {

                assetScript = assetScript.replace('ASSET_MODE', assetMode);

            } else {

                assetScript = assetScript.replace('ASSET_MODE', 'digital');
            }

            if (assetTitle !== null && assetTitle !== undefined) {

                assetScript = assetScript.replace('ASSET_TITLE', assetTitle);

            } else {

                assetScript = assetScript.replace('ASSET_TITLE', assetName);
            }

            return assetScript;

        }

        FirstAppDictionary.prototype.create = function() {

            return new FirstAppDictionary();
        };

        return FirstAppDictionary;
    }
})();
