(function() {
    'use strict';

    angular
        .module('app')
        .factory('deviceModel', DeviceModelFactory);

    DeviceModelFactory.$inject = ['utility.deviceIcons', 'utils', 'assetModel'];

    function DeviceModelFactory(icons, utils, AssetModel) {

        function DeviceModel(data) {

            for (var attr in data) {
                if (data.hasOwnProperty(attr)) {
                    this[attr] = data[attr];
                }
            }

            for (var i = 0; i < this.assets.length; i++) {
                this.assets[i] = new AssetModel(this.assets[i]);
            }

            this.subscriptions = [];
        }

        DeviceModel.prototype.getIcon = function() {
            return icons.getIcon(this.type);
        };

        DeviceModel.prototype.getAsset = function(name) {

            var foundAsset = null;

            angular.forEach(this.assets, function(asset) {
                if (asset.name === name) {
                    foundAsset = asset;
                }
            });

            return foundAsset;
        };

        DeviceModel.prototype.getTitle = function() {

            if (this.title) {
                return this.title;
            }

            return this.name;
        };

        DeviceModel.prototype.subscribe = function(includingAssets) {

            var that = this;

            var unsubscribeDelete = utils.$rootScope.$on('$messaging.device.deleted', function(e, eventData) {

                if (that.id === eventData.deviceId) {
                    that._deleted = true;
                }

                utils.$rootScope.$apply();
            });

            var unsubscribeAssetCreate = utils.$rootScope.$on('$messaging.asset.created', function(e, eventData) {

                var asset = normalizePayloadData(eventData.payload.Data);

                if (that.id === asset.deviceId) {

                    var isAssetInArray = false;

                    for (var i = 0; i < that.assets.length; i++) {

                        if (that.assets[i].id === asset.id) {

                            isAssetInArray = true;
                            break;
                        }

                    }

                    if (!isAssetInArray) {

                        var assetModel = new AssetModel(asset);

                        assetModel.subscribe();

                        that.assets.push(assetModel);

                    }

                    utils.$rootScope.$apply();
                }

            });

            that.subscriptions.push(unsubscribeDelete);

            if (includingAssets) {
                angular.forEach(that.assets, function(asset) {
                    asset.subscribe();
                });
            }
        };

        DeviceModel.prototype.on = function(eventName, callback) {

            var that = this;
            var unsubscribeHandler = utils.$rootScope.$on('$messaging.device.{0}'.format(eventName), function(e, eventData) {

                if (that.id !== eventData.deviceId) {
                    return;
                }

                callbackFn(eventData.payload);
                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeHandler);
        };

        DeviceModel.prototype.unsubscribe = function() {

            var that = this;

            angular.forEach(that.subscriptions, function(unsubscribeFn) {
                unsubscribeFn();
            });

            that.subscriptions = [];

            angular.forEach(that.assets, function(asset) {
                asset.unsubscribe();
            });
        };

        function normalizePayloadData(payloadData) {

            var data = {};

            for (var attr in payloadData) {
                if (payloadData.hasOwnProperty(attr)) {
                    data[utils.toCamelCase(attr)] = payloadData[attr];
                }
            }

            return data;
        }

        return DeviceModel;
    }
})();
