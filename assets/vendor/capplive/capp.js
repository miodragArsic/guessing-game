if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

(function(window) {

    var CappLive = {};
    var pendingSubscribers = [];
    var pendingSenders = [];

    CappLive.clientId = null;
    CappLive.clientKey = null;
    CappLive.brokerUrl = 'http://att-2.cloudapp.net';
    CappLive.brokerPort = 15674;
    CappLive.sourceRoot = '/exchange/root/';

    CappLive.asset = createAssetModel;
    CappLive.device = createDeviceModel;
    CappLive.gateway = createGatewayModel;

    CappLive.connect = connect;
    CappLive.disconnect = disconnect;
    CappLive.all = all;
    CappLive.subscribe = subscribeToTopic;

    ////////////////////////////////////////

    var isConnecting = false;
    var stompClient = null;

    function createAssetModel(assetData) {

        return createModel(assetData, 'asset');
    }

    function createDeviceModel(deviceData) {

        return createModel(deviceData, 'device');
    }

    function createGatewayModel(gatewayData) {

        return createModel(gatewayData, 'gateway');
    }

    function createModel(modelData, modelName) {

        var topicPattern = 'client.{0}.in.{1}.{2}.{3}';

        var subscriptions = [];

        var model = {
            on: onHandler,
            send: sendHandler,
            command: commandHandler,
            sendCommand: sendCommandHandler,
            unsubscribe: unsubscribe
        };

        return $.extend(model, modelData);

        /////////

        function commandHandler(callback) {

            var commandPattern = 'client.{0}.in.device.{1}.asset.{2}.command';
            var topic = commandPattern.format(CappLive.clientId, model.deviceId, modelData.id);

            var completeTopic = CappLive.sourceRoot + topic;

            connectAndSubscribe(completeTopic, callback, function(sub) {
                subscriptions.push(sub);
            });
        }

        function onHandler(eventName, callback) {

            var topic = topicPattern.format(CappLive.clientId, modelName, modelData.id, eventName);

            var completeTopic = CappLive.sourceRoot + topic;

            connectAndSubscribe(completeTopic, callback, function(sub) {
                subscriptions.push(sub);
            });
        }

        function sendHandler(sendData) {

            var sendTopicPattern = 'client.{0}.out.asset.{1}.state';
            var topic = sendTopicPattern.format(CappLive.clientId, model.id);
            var completeTopic = CappLive.sourceRoot + topic;

            if (stompClient && stompClient.connected) {
                stompClient.send(completeTopic, {}, sendData);
                return;
            }

            pendingSenders.push({
                topic: completeTopic,
                data: sendData
            });

            if (!isConnecting) {
                connect();
            }
        }

        function sendCommandHandler(commandData) {
            var sendTopicPattern = 'client.{0}.in.device.{1}.asset.{2}.command';
            var topic = sendTopicPattern.format(CappLive.clientId, model.deviceId, model.id);
            var completeTopic = CappLive.sourceRoot + topic;

            if (stompClient && stompClient.connected) {
                stompClient.send(completeTopic, {}, commandData);
                return;
            }

            pendingSenders.push({
                topic: completeTopic,
                data: commandData
            });

            if (!isConnecting) {
                connect();
            }
        }

        function unsubscribe() {

            for (var i = 0; i < subscriptions.length; i++) {
                subscriptions[i].unsubscribe();
            }

            subscriptions = [];
        }
    }

    function all(entityType, entityId, eventName, callback) {

        var topicPattern = 'client.{0}.in.{1}.{2}.{3}';

        var topic = topicPattern.format(CappLive.clientId, entityType, entityId, eventName);

        var completeTopic = CappLive.sourceRoot + topic;

        connectAndSubscribe(completeTopic, callback);
    }

    function subscribeToTopic(resource, callback) {

        var topicPattern = 'client.{0}.in.{1}';
        var topic = topicPattern.format(CappLive.clientId, resource);
        var completeTopic = CappLive.sourceRoot + topic;
        connectAndSubscribe(completeTopic, callback);
    }

    function connectAndSubscribe(topic, callback, onCallbackSubscribed) {

        if (stompClient && stompClient.connected) {
            subscribe(topic, callback, onCallbackSubscribed);
            return;
        }

        pendingSubscribers.push({
            topic: topic,
            callback: callback,
            subscribed: onCallbackSubscribed
        });

        if (!isConnecting) {

            connect();
        }
    }

    function connect(clientId, clientKey, successHandler, failHandler) {

        if (!clientId && !clientKey) {
            clientId = CappLive.clientId;
            clientKey = CappLive.clientKey;
        } else {
            CappLive.clientId = clientId;
            CappLive.clientKey = clientKey;
        }

        isConnecting = true;

        var ws = new SockJS(CappLive.brokerUrl + ':' + CappLive.brokerPort + '/stomp');
        stompClient = Stomp.over(ws);
        stompClient.heartbeat.outgoing = 5000;
        stompClient.heartbeat.incoming = 0;

        stompClient.connect(
            clientId,
            clientKey,
            stompConnectionSuccessHandler,
            stompConnectionFailHandler,
            clientId);

        function stompConnectionSuccessHandler(data) {

            isConnecting = false;
            console.log('Stomp connection is succesfull.');

            for (var i = 0; i < pendingSubscribers.length; i++) {
                subscribe(pendingSubscribers[i].topic, pendingSubscribers[i].callback, pendingSubscribers[i].subscribed);
            }

            for (var y = 0; y < pendingSenders.length; y++) {
                stompClient.send(pendingSenders[y].topic, {}, pendingSenders[y].data);
            }

            pendingSubscribers = [];
            pendingSenders = [];

            if (successHandler) {
                successHandler(data);
            }
        }

        function stompConnectionFailHandler(data) {

            isConnecting = false;
            console.log('Stomp connection has failed.');

            if (failHandler) {
                failHandler(data);
            }
        }
    }

    function disconnect(callback) {
        if (stompClient && stompClient.connected) {
            if (callback) {
                stompClient.disconnect(callback);
            } else {
                stompClient.disconnect();
            }
        } else {
            callback();
        }
    }

    function subscribe(topic, callback, subscribedCallback) {

        var sub = stompClient.subscribe(topic, function(message) {

            callback(JSON.parse(message.body));

        });

        if (subscribedCallback) {
            subscribedCallback(sub);
        }
    }

    window.CappLive = CappLive;

})(window);
