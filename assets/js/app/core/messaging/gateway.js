(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.gateway', factory);

    factory.$inject = ['$window', 'app.config', 'utils'];

    function factory($window, appConfig, utils) {

        function Gateway() {

            this.isConnected = false;
            this.clientId = null;
            this.clientKey = null;
            $window.CappMessaging.brokerUrl = appConfig.broker.url;
            $window.CappMessaging.brokerPort = appConfig.broker.port;
            $window.CappMessaging.sourceRoot = appConfig.broker.sourceRoot;
        }

        Gateway.prototype.connect = function(clientId, clientKey, failHandler) {

            this.clientId = clientId;
            this.clientKey = clientKey;

            saveClient(clientId, clientKey);

            var that = this;

            var deffered = utils.$q.defer();

            var disconnectPromise = that.disconnect();

            disconnectPromise.then(function() {

                $window.CappMessaging.connect(clientId, clientKey, function() {
                        deffered.resolve();
                        that.connected = true;
                    },

                    function() {
                        deffered.reject();
                        that.connected = false;

                        if (failHandler) {
                            failHandler();
                        }
                    });
            });

            return deffered.promise;
        };

        Gateway.prototype.disconnect = function() {

            var that = this;
            var deffered = utils.$q.defer();

            $window.CappMessaging.disconnect(function() {
                deffered.resolve();
                that.connected = false;
            });

            return deffered.promise;
        };

        Gateway.prototype.subscribe = function(topic, callbackFn, subscriptionCallbackFn) {

            $window.CappMessaging.subscribe(topic, callbackFn, subscriptionCallbackFn);
        };

        Gateway.prototype.unsubscribe = function(sub) {

            $window.CappMessaging.unsubscribe(sub);
        };

        Gateway.prototype.publish = function(topic, payload) {

            $window.CappMessaging.publish(topic, payload);
        };

        function saveClient(clientId, clientKey) {

            $window.CappMessaging.clientId = clientId;
            $window.CappMessaging.clientKey = clientKey;
        }

        return new Gateway();
    }
})();
