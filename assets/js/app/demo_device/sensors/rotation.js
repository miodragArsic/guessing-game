(function(ng) {
    ng
        .module('app')
        .factory('demo.rotation', rotation);

    rotation.$inject = ['$window', '$interval'];

    function rotation($window, $interval) {

        var UPPER_ROTATION_BOUND = 100;
        var LOWER_ROTATION_BOUND = -100;
        var SAMPLE_INTERVAL = 40; //ms
        var HORIZONTAL_BOUND = 5;

        var rotationSubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = null;
        var sampleCount = 0;
        var rightCount = 0;
        var leftCount = 0;

        var alpha;
        var beta;
        var gamma;
        var pAlpha;
        var pBeta;
        var pGamma;
        var alphaDiffSum = null;

        var service = {
            isSupported: isSupported,
            subscribeOnRotation: subscribeRotation,
            unsubscribeOnRotationChange: unsubscribeOnRotationChange
        };

        return service;

        ////////////////////////////

        function isSupported() {
            return ('ondeviceorientation' in $window);
        }

        function subscribeRotation(rotationHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            rotationSubscribers.push(rotationHandler);
        }

        function unsubscribeOnRotationChange() {
            rotationSubscribers = [];
            $window.removeEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = false;
        }

        function attachListener() {
            $window.addEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = true;

            $interval(function() {

                if (Math.abs(alphaDiffSum) > 20) {
                    if (isPhoneHorizontal(beta, gamma)) {
                        if (alphaDiffSum > 0) {
                            publishRotation('leftRotation');
                        } else {
                            publishRotation('rightRotation');
                        }
                    }
                }

                alphaDiffSum = null;

            }, 1000);
        }

        function deviceOrientationChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            alpha = Math.round(event.alpha);
            beta = Math.round(event.beta);
            gamma = Math.round(event.gamma);

            if (pAlpha === undefined) {
                pAlpha = alpha;
            }

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL && alpha !== pAlpha) {

                lastUpdate = currentTime;
                var alphaDiff = alpha - pAlpha;

                if (Math.abs(alphaDiff) < 100) {
                    if (alphaDiffSum === null) {
                        alphaDiffSum = 0;
                    }

                    alphaDiffSum += alphaDiff;
                }
            }

            pAlpha = alpha;
        }

        function publishRotation(message) {

            for (var i = 0; i < rotationSubscribers.length; i++) {
                rotationSubscribers[i](message);
            }

        }

        function isPhoneHorizontal(beta, gamma) {
            if ((beta > -HORIZONTAL_BOUND && beta < HORIZONTAL_BOUND) && (gamma > -HORIZONTAL_BOUND && gamma < HORIZONTAL_BOUND)) {
                return true;
            } else {
                return false;
            }
        }

    }
}(window.angular));
