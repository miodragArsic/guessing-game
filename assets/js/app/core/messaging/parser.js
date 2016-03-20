(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.parser', factory);

    factory.$inject = ['utils'];

    function factory(utils) {

        var service = {
            parseMessage: parseMessage,
            getMessageTopic: getMessageTopic
        };

        return service;

        ////////////////

        function parseMessage(topic, payload) {

            var topicElements = topic.split('.');
            var info = {
                name: '',
                data: {
                    payload: payload
                }
            };

            if (isMatch('ground.%.in.asset.%.state', topicElements)) {
                info.name = 'asset.state';
                info.data.groundId = topicElements[1];
                info.data.assetId = topicElements[4];
                return info;
            }

            if (isMatch('client.%.in.asset.%.state', topicElements)) {
                info.name = 'asset.state';
                info.data.assetId = topicElements[4];
                return info;
            }

            if (isMatch('ground.%.in.activity', topicElements)) {
                info.name = 'ground.activity';
                info.data.groundId = topicElements[1];
                return info;
            }

            if (isMatch('client.%.in.asset.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'asset.created';
                    info.data.assetId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'asset.deleted';
                    info.data.assetId = topicElements[4];
                }

                return info;
            }

            if (isMatch('client.%.in.device.%.asset.%.command', topicElements)) {
                info.name = 'asset.command';
                info.data.assetId = topicElements[6];
                return info;
            }

            if (isMatch('client.%.in.device.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'device.created';
                    info.data.deviceId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'device.deleted';
                    info.data.deviceId = topicElements[4];
                }

                return info;
            }

            if (isMatch('client.%.in.gateway.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'gateway.created';
                    info.data.gatewayId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'gateway.deleted';
                    info.data.gatewayId = topicElements[4];
                }

                return info;
            }

            return info;
        }

        function isMatch(topicPattern, topicElements) {

            var patternElements = topicPattern.split('.');

            if (patternElements.length !== topicElements.length) {
                return false;
            }

            var match = true;
            for (var i = 0; i < patternElements.length; i++) {

                if (patternElements[i] !== topicElements[i]) {

                    if (patternElements[i] !== '%') {
                        match = false;
                    }
                }
            }

            return match;
        }

        function getMessageTopic(clientId, action, entity) {

            var topic = null;

            if (action === 'command') {
                topic = 'client.{0}.in.device.{1}.asset.{2}.command'.format(
                    clientId,
                    entity.deviceId,
                    entity.id);
            }

            if (action === 'state') {
                topic = 'client.{0}.out.asset.{1}.state'.format(
                    clientId,
                    entity.id);
            }

            return topic;
        }
    }
})();
