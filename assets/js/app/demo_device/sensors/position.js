(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.position', Position);

    Position.$inject = ['$window', '$timeout'];

    function Position($window, $timeout) {

        var service = {
            isSupported: isSupported,
            subscribeOnPositionChange: subscribeOnPositionChange,
            unsubscribeOnPositionChange: unsubscribeOnPositionChange
        };

        var positionSubscribers = [];
        var lastPublishedPosition = null;
        var otherLastPublishedPos = null;
        var isListenerAttached = false;

        var alpha;
        var beta;
        var gamma;
        var x;
        var y;
        var z;

        var MOVE_BOUND = 0.3;
        var HORIZONTAL_BOUND = 2;

        return service;

        ///////////////////////////////////////////

        function isSupported() {
            var isIt = (('ondevicemotion' in $window) && ('ondeviceorientation' in $window));
            return isIt;
        }

        function subscribeOnPositionChange(positionChangeHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            positionSubscribers.push(positionChangeHandler);

        }

        function unsubscribeOnPositionChange() {
            positionSubscribers = [];
            $window.removeEventListener('devicemotion', positionHandler);
            $window.removeEventListener('deviceorientation', positionHandler);
            isListenerAttached = false;
        }

        function attachListener() {
            $window.addEventListener('devicemotion', positionHandler);
            $window.addEventListener('deviceorientation', positionHandler);
            isListenerAttached = true;
        }

        function positionHandler(event) {
            if (event.alpha || event.beta || event.gamma) {
                alpha = event.alpha;
                beta = event.beta;
                gamma = event.gamma;
            }

            if (event.acceleration) {
                x = event.acceleration.x;
                y = event.acceleration.y;
                z = event.acceleration.z;
            }

            if (isDataCollected(alpha, beta, gamma) && isDataCollected(x, y, z)) {
                if (isLayingDown(beta, gamma)) {
                    if (isStill(x, y, z)) {
                        pub(true);
                    }
                } else {
                    pub(false);
                }
            }
        }

        var trueTimeout = null;

        function pub(position) {

            if (lastPublishedPosition != position) {

                if (trueTimeout) {
                    $timeout.cancel(trueTimeout);
                }

                if (position) {

                    trueTimeout = $timeout(function() {

                        publishPosition(true);

                    }, 200);

                } else {
                    publishPosition(false);
                }

                lastPublishedPosition = position;
            }
        }

        function publishPosition(position) {
            if (otherLastPublishedPos != position) {
                for (var i = 0; i < positionSubscribers.length; i++) {
                    positionSubscribers[i](position);
                }

                otherLastPublishedPos = position;
            }

        }

        function isDataCollected(x, y, z) {
            if (x !== null && y !== null && z !== null) {
                return true;
            } else {
                return false;
            }
        }

        function isLayingDown(beta, gamma) {
            if (beta > -HORIZONTAL_BOUND && beta < HORIZONTAL_BOUND) {
                if (gamma > -HORIZONTAL_BOUND && gamma < HORIZONTAL_BOUND) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        function isStill(x, y, z) {
            if ((x < MOVE_BOUND && x > -MOVE_BOUND) || (y < MOVE_BOUND && y > -MOVE_BOUND) || (z < MOVE_BOUND && z > -MOVE_BOUND)) {
                return true;
            } else {
                return false;
            }
        }
    }
})();
