(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.shake', shake);

    shake.$inject = ['$window', '$interval'];

    function shake($window, $interval) {

        var service = {
            isSupported: isSupported,
            subscribeOnShakeChange: subscribeShaker,
            unsubscribeOnShakeChange: unsubscribeShaker,
            subscribeOnSpeedChange: subscribeOnSpeedChange
        };

        var shakeSubscribers = [];
        var speedSubscribers = [];
        var lastUpdate = -1;
        var x;
        var y;
        var z;
        var lastX;
        var lastY;
        var lastZ;
        var isListenerAttached = false;
        var lastPublishedShakeValue = null;
        var lastPublishedSpeedValue = null;
        var timesShaken = 0;
        var intervalPromise = null;

        var SHAKE_THRESHOLD_SPEED = 500;
        var SAMPLE_INTERVAL = 50; //miliseconds
        var MOVE_THRESHOLD = 0.3;

        return service;

        /////////////////////////////

        function isSupported() {
            return ('ondevicemotion' in $window);
        }

        function subscribeShaker(shakeHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            shakeSubscribers.push(shakeHandler);
        }

        function unsubscribeShaker() {
            shakeSubscribers = [];
            $window.removeEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = false;

            if (intervalPromise !== null) {
                $interval.cancel(intervalPromise);
            }
        }

        function subscribeOnSpeedChange(speedHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            speedSubscribers.push(speedHandler);
        }

        function attachListener() {
            $window.addEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = true;

            intervalPromise = $interval(function() {

                console.log(timesShaken, 'Times Shaken');

                if (timesShaken > 4) {
                    publishShake(true);
                }

                if (timesShaken <= 2) {
                    publishShake(false);
                }

                timesShaken = 0;
            }, 1000);
        }

        function deviceMotionChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            x = event.acceleration.x;
            y = event.acceleration.y;
            z = event.acceleration.z;

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL) {

                var diffTime = currentTime - lastUpdate;
                lastUpdate = currentTime;

                var speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
                if (speed > SHAKE_THRESHOLD_SPEED) {
                    timesShaken++;
                }
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

        function publishShake(isShakin) {
            if (lastPublishedShakeValue !== isShakin) {
                for (var i = 0; i < shakeSubscribers.length; i++) {
                    shakeSubscribers[i](isShakin);
                }

                lastPublishedShakeValue = isShakin;
            }
        }

        function publishSpeed(speed) {
            if (lastPublishedSpeedValue !== speed) {
                for (var i = 0; i < speedSubscribers.length; i++) {
                    speedSubscribers[i](speed);
                }

                lastPublishedSpeedValue = speed;
            }

        }

    }
})();
