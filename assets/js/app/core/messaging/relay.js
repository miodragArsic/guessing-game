(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.relay', factory);

    factory.$inject = ['messaging.gateway', 'utils', 'session', 'userContext', 'messaging.parser', 'NotificationModel'];

    function factory(messagingGateway, utils, session, userContext, parser, Notification) {

        var notificationSubscription = null;
        var groundSubscription = null;

        var reconnectAttemptCount = 0;

        //how many times to try to reconnect before aborting
        var reconnectAttemptThreshold = 3;

        //wait interval between reconnect attempts
        var reconnectAttemptInterval = 5000;

        function MessageRelay() {
            this.items = [];
        }

        MessageRelay.prototype.init = function() {

            var that = this;

            if (session.authentication().isAuth) {

                connect();
            }

            utils.$rootScope.$on('user.login', function() {

                messagingGateway.disconnect().then(function() {
                    connect();
                });

            });

            utils.$rootScope.$on('user.logout', function() {

                messagingGateway.disconnect();

            });

            function connect() {

                messagingGateway.connect(session.authentication().rmq.clientId, session.authentication().rmq.clientKey, connectionFailHandler)
                    .then(function() {

                        that.subscribeForUserNotifications();

                        that.subscribeForAllNotifications();

                        reconnectAttemptCount = 0;

                        utils.$rootScope.$emit('$messaging.connection.connected');

                    });

            }

            function connectionFailHandler() {

                if (reconnectAttemptCount >= reconnectAttemptThreshold) {

                    console.log('###MESSAGING### - FAILED TO RECONNECT, ABORTING. ');

                    utils.$rootScope.$emit('$messaging.connection.disconnected');

                } else {

                    utils.$timeout(function() {

                        reconnectAttemptCount++;

                        console.log('###MESSAGING### - RECONNECT ATTEMPT ' + reconnectAttemptCount);

                        connect();

                    }, reconnectAttemptInterval);
                }
            }
        };

        MessageRelay.prototype.subscribeForUserNotifications = function() {

            if (!userContext.user) {
                return;
            }

            notificationSubscription = messagingGateway.subscribe(
                'client.{0}.in.user.{1}.notifications'.format(messagingGateway.clientId, userContext.user.id),
                handleNotificationMessage);

            function handleNotificationMessage(payload) {
                //HACK!
                var normalizedMessage = {
                    at: payload.At,
                    data: payload.Value
                };

                utils.$rootScope.$emit('$messaging.notification', new Notification(normalizedMessage));
            }
        };

        MessageRelay.prototype.subscribeForGroundNotifications = function(groundId) {

            if (groundSubscription) {

                messagingGateway.unsubscribe(groundSubscription);

                groundSubscription = null;

            }

            messagingGateway.subscribe(
                'ground.{0}.in.#'.format(groundId),
                handleGroundMessage,
                handleSubscribed);

            function handleGroundMessage(payload, topic) {

                var message = parser.parseMessage(topic, payload);

                if (message.name) {

                    utils.$rootScope.$emit('$messaging.' + message.name, message.data);

                }
            }

            function handleSubscribed(subscription) {

                groundSubscription = subscription;

            }
        };

        //Obsolete - will be removed when all messages are transferred under ground.{id}.in.#
        MessageRelay.prototype.subscribeForAllNotifications = function() {

            messagingGateway.subscribe(
                'client.{0}.in.#'.format(messagingGateway.clientId),
                handleMessage);

            function handleMessage(payload, topic) {

                var message = parser.parseMessage(topic, payload);

                if (message.name) {

                    utils.$rootScope.$emit('$messaging.' + message.name, message.data);

                }
            }
        };

        MessageRelay.prototype.unsubscribeFromGroundNotifications = function() {

            if (groundSubscription) {

                messagingGateway.unsubscribe(groundSubscription);

                groundSubscription = null;

            }
        };

        MessageRelay.prototype.publishState = function(asset, stateData) {

            var topic = parser.getMessageTopic(messagingGateway.clientId, 'state', asset);

            messagingGateway.publish(topic, stateData);

        };

        MessageRelay.prototype.publishCommand = function(asset, commandData) {

            var topic = parser.getMessageTopic(messagingGateway.clientId, 'command', asset);

            messagingGateway.publish(topic, commandData);

        };

        return new MessageRelay();
    }
})();
