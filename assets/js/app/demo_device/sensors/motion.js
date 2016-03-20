(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.motion', Motion);

    Motion.$inject = ['$window'];

    function Motion($window) {

        var service = {
            isSupported: isSupported,
            subscribeOnMoveChange: subscribeOnMoveChange
        };

        var moveSubscribers = [];
        var lastUpdate = -1;
        var x;
        var y;
        var z;
        var lastX;
        var lastY;
        var lastZ;
        var isListenerAttached = false;
        var lastPublishedMoveValue = null;
        var lastKnownDirection = null;
        var numRight = 0;
        var numLeft = 0;
        var isStill = null;
        var sampleCount = 0;

        var SAMPLE_INTERVAL = 20; //miliseconds
        var MOVE_THRESHOLD = 0.6;

        return service;

        /////////////////////////////

        function isSupported() {
            return ('ondevicemotion' in $window);
        }

        function subscribeOnMoveChange(moveHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            moveSubscribers.push(moveHandler);
        }

        function attachListener() {
            $window.addEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = true;
        }

        function deviceMotionChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            x = event.acceleration.x;
            y = event.acceleration.y;
            z = event.acceleration.z;

            //one update every 100ms
            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL) {

                var diffTime = currentTime - lastUpdate;
                lastUpdate = currentTime;

                var xDiff = lastX - x;
                sampleCount++;

                //decide direction
                if (xDiff > MOVE_THRESHOLD) {
                    numRight++;
                } else if (xDiff < -MOVE_THRESHOLD) {
                    numLeft++;
                }

            }

            if (sampleCount > 4) {
                if (numRight > numLeft) {
                    lastKnownDirection = 'right';
                } else if (numLeft > numRight) {
                    lastKnownDirection = 'left';
                } else {
                    publishMove(lastKnownDirection);
                }

                numRight = 0;
                numLeft = 0;
                sampleCount = 0;
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

        function publishMove(isMoving) {
            if (lastPublishedMoveValue !== isMoving) {
                for (var i = 0; i < moveSubscribers.length; i++) {
                    moveSubscribers[i](isMoving);
                }

                lastPublishedMoveValue = isMoving;
            }
        }
    }
})();
