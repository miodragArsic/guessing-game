(function(ng) {
    ng
        .module('app')
        .factory('notifyService', NotifyService);

    NotifyService.$inject = ['$filter'];

    function NotifyService($filter) {

        var subscribers = [];

        var service = {
            error: error,
            warning: warning,
            info: info,
            success: success,
            offer: offer,
            subscribe: subscribe
        };

        return service;

        //////////////////////////////////////////////

        function error(title, msg, action, isPermanent) {
            publish('error', title, msg, action, isPermanent);
        }

        function warning(title, msg, action, isPermanent, actionHandler, actionText, closeHandler) {
            publish('warning', title, msg, action, isPermanent, actionHandler, actionText, closeHandler);
        }

        function info(title, msg, action, isPermanent) {
            publish('info', title, msg, action, isPermanent);
        }

        function success(title, msg, action, isPermanent) {
            publish('success', title, msg, action, isPermanent);
        }

        function offer(title, msg, actionHandler, actionText, closeHandler) {
            publish('offer', title, msg, null, true, actionHandler, actionText, closeHandler);
        }

        function subscribe(subscriberId, subscriberfn) {

            var foundSubscriber = $filter('filter')(subscribers, {
                id: subscriberId
            });

            if (!(foundSubscriber.length > 0)) {

                subscribers.push({
                    id: subscriberId,
                    fn: subscriberfn
                });
            }
        }

        function publish(type, title, msg, action, isPermanent, actionHandler, actionText, closeHandler) {

            for (var i = 0; i < subscribers.length; i++) {
                subscribers[i].fn({
                    title: title,
                    type: type,
                    msg: msg,
                    action: action,
                    isPermanent: isPermanent,
                    actionHandler: actionHandler,
                    actionText: actionText,
                    closeHandler: closeHandler
                });
            }
        }
    }
}(window.angular));
