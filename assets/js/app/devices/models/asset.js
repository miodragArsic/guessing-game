(function() {
    'use strict';

    angular
        .module('app')
        .factory('assetModel', AssetModelFactory);

    AssetModelFactory.$inject = ['utility.deviceIcons', 'utils', 'messaging.relay'];

    function AssetModelFactory(icons, utils, messageRelay) {

        function AssetModel(data) {

            for (var attr in data) {
                if (data.hasOwnProperty(attr)) {
                    this[attr] = data[attr];
                }
            }

            this.subscriptions = [];
        }

        AssetModel.prototype.getIcon = function() {
            return icons.getIcon(this.is);
        };

        AssetModel.prototype.subscribe = function() {

            var that = this;

            var unsubscribeDelete = utils.$rootScope.$on('$messaging.asset.deleted', function(e, eventData) {

                if (that.id === eventData.assetId) {
                    that._deleted = true;
                }

                utils.$rootScope.$apply();
            });

            var unsubscribeState = utils.$rootScope.$on('$messaging.asset.state', function(e, eventData) {

                if (that.id !== eventData.assetId) {
                    return;
                }

                if (!that.state) {
                    that.state = {};
                }

                that.state.at = eventData.payload.At;
                that.state.value = eventData.payload.Value;

                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeDelete);
            that.subscriptions.push(unsubscribeState);
        };

        AssetModel.prototype.on = function(eventName, callbackFn) {

            var that = this;
            var unsubscribeHandler = utils.$rootScope.$on('$messaging.asset.{0}'.format(eventName), function(e, eventData) {

                if (that.id !== eventData.assetId) {
                    return;
                }

                callbackFn(eventData.payload);
                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeHandler);
        };

        AssetModel.prototype.send = function(sendData) {

            messageRelay.publishState(this, sendData);
        };

        AssetModel.prototype.sendCommand = function(commandData) {

            messageRelay.publishCommand(this, commandData);
        };

        AssetModel.prototype.unsubscribe = function() {

            angular.forEach(this.subscriptions, function(unsubscribeFn) {
                unsubscribeFn();
            });

            this.subscriptions = [];
        };

        return AssetModel;
    }
})();
