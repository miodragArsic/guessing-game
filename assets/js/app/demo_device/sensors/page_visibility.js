(function(ng) {
    ng
        .module('app')
        .factory('demo.pageVisibility', pageVisibility);

    pageVisibility.$inject = ['$window'];

    function pageVisibility($window) {

        var visibilitySubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = true;
        var eventName = null;

        var service = {
            subscribeOnPageVisibility: subscribeOnPageVisibility,
            unsubscribeOnPageVisibility: unsubscribeOnPageVisibility
        };

        return service;

        ////////////////////////////

        function getHiddenProp() {
            var prefixes = ['webkit', 'moz', 'ms', 'o'];

            if ('hidden' in document) {
                return 'hidden';
            }

            for (var i = 0; i < prefixes.length; i++) {
                if ((prefixes[i] + 'Hidden') in document) {
                    return prefixes[i] + 'Hidden';
                }
            }

            return null;
        }

        function subscribeOnPageVisibility(visibilityHandler) {

            if (!isListenerAttached) {
                attachListener();
            }

            visibilitySubscribers.push(visibilityHandler);
        }

        function unsubscribeOnPageVisibility() {
            visibilitySubscribers = [];
            document.removeEventListener(eventName, pageVisibilityChanges);
            isListenerAttached = false;
        }

        function attachListener() {
            var visProp = getHiddenProp();
            if (visProp) {
                eventName = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
                document.addEventListener(eventName, pageVisibilityChanges);
            }

            isListenerAttached = true;
        }

        function pageVisibilityChanges(event) {
            publishVisibility(!lastPublishedValue);

        }

        function publishVisibility(message) {
            if (lastPublishedValue !== message) {
                for (var i = 0; i < visibilitySubscribers.length; i++) {
                    visibilitySubscribers[i](message);
                }

                lastPublishedValue = message;
            }
        }

    }
}(window.angular));
