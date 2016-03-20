(function(ng) {
    ng
        .module('app')
        .factory('demo.orientation', orientation);

    orientation.$inject = ['$window'];

    function orientation($window) {

        var UPPER_BETA_POSITION_BOUND = 120;
        var LOWER_BETA_POSITION_BOUND = 60;
        var UPPER_BETA_LAYING_ON_TABLE = 10;
        var LOWER_BETA_LAYING_ON_TABLE = -5;
        var UPPER_ROTATION_BOUND = 5;
        var LOWER_ROTATION_BOUND = -5;
        var ROTATION_SENSITIVITY = 30;
        var SAMPLE_INTERVAL = 100; //ms

        var rotationSubscribers = [];
        var verticalSubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = null;

        var alpha, beta, gamma;
        var pAlpha, pBeta, pGamma;

        var service = {
            isSupported: isSupported,
            subscribeOnRotation: subscribeRotation,
            subscribeOnVerticalOrientationChange: subscribeVertical
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

        function subscribeVertical(verticalHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            verticalSubscribers.push(verticalHandler);
        }

        function attachListener() {
            $window.addEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = true;
        }

        function deviceOrientationChanged(event) {
            var date = new Date();
            var currentTime = date.getTime();

            alpha = Math.round(event.alpha);
            beta = Math.round(event.beta);
            gamma = Math.round(event.gamma);

            if (pAlpha === undefined || pBeta === undefined || pGamma === undefined) {
                pAlpha = alpha;
                pBeta = beta;
                pGamma = gamma;
            }

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL && (isValidRotation(alpha - pAlpha) || isValidRotation(beta - pBeta) || isValidRotation(gamma - pGamma))) {

                lastUpdate = currentTime;

                if (isRotating()) {
                    publishRotation('ROTATING');
                }

                if (isOnTable(beta)) {
                    publishVertical('ON TABLE RESTING');
                } else {
                    publishVertical('I AM NOT RESTING');
                }

                pAlpha = alpha;
                pBeta = beta;
                pGamma = gamma;
            }
        }

        function publishRotation(message) {

            for (var i = 0; i < rotationSubscribers.length; i++) {
                rotationSubscribers[i](message);
            }
        }

        function publishVertical(message) {

            if (lastPublishedValue !== message) {
                for (var i = 0; i < verticalSubscribers.length; i++) {
                    verticalSubscribers[i](message);
                }

                lastPublishedValue = message;
            }
        }

        function isVertical(value) {

            if (value > LOWER_BETA_POSITION_BOUND && value < UPPER_BETA_POSITION_BOUND) {
                return true;
            } else {
                return false;
            }
        }

        function isOnTable(value) {
            if (value > LOWER_BETA_LAYING_ON_TABLE && value < UPPER_BETA_LAYING_ON_TABLE) {
                return true;
            } else {
                return false;
            }
        }

        function isRotating() {

            alphaDiff = alpha - pAlpha;
            betaDiff = beta - pBeta;
            gammaDiff = gamma - pGamma;

            if (inRotationBound(alphaDiff) || inRotationBound(betaDiff) || inRotationBound(gammaDiff)) {
                return true;
            } else {
                return false;
            }
        }

        function isValidRotation(difference) {

            if (Math.abs(difference) > ROTATION_SENSITIVITY) {
                return true;
            } else {
                return false;
            }
        }

        function inRotationBound(value) {

            if (value < UPPER_ROTATION_BOUND && value > LOWER_ROTATION_BOUND) {
                return false;
            } else {
                return true;
            }
        }
    }
}(window.angular));
