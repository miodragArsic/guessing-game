(function(ng) {
    ng
        .module('app')
        .directive('notifyControl', NotifyControl);

    NotifyControl.$inject = [
        'notifyService',
        '$animate',
        '$timeout',
        '$rootScope'
    ];

    function NotifyControl(notify, $animate, $timeout, $rootScope) {

        var settings = {
            duration: 2000 //3 seconds
        };

        var directive = {

            restrict: 'E',
            templateUrl: '/assets/js/app/directives/notify-control/view.html',
            link: linker,
            scope: {}
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var el = element[0];
            var hideNotificationTimeout = null;

            scope.isClosed = true;
            scope.isPermanent = false;
            scope.title = null;
            scope.msg = null;
            scope.type = null;

            scope.close = onClosed;
            scope.onMouseOver = onMouseOver;
            scope.onMouseLeave = onMouseLeave;

            notify.subscribe('notificationControl', function(notificationData) {

                processNotification(notificationData);
            });

            $rootScope.$on('$stateChangeSuccess', function() {
                closeNotification();
            });

            function onClosed() {

                closeNotification();

                if (scope.closeHandler) {
                    scope.closeHandler();
                }
            }

            function closeNotification() {

                var container = el.querySelector('.alert');

                if (container) {
                    $animate.addClass(container, 'alert-hidden').then(function() {
                        scope.isClosed = true;
                    });
                }
            }

            function onMouseOver() {
                if (hideNotificationTimeout) {
                    $timeout.cancel(hideNotificationTimeout);
                }
            }

            function onMouseLeave() {
                if (!scope.isPermanent) {
                    setCloseTimeout();
                }
            }

            function processNotification(data) {

                if (hideNotificationTimeout) {
                    $timeout.cancel(hideNotificationTimeout);
                }

                scope.title = data.title;
                scope.msg = data.msg;
                scope.type = data.type;
                scope.isPermanent = data.isPermanent;
                scope.isClosed = false;

                if (data.closeHandler) {
                    scope.closeHandler = data.closeHandler;
                    scope.showCloseButton = true;
                } else {
                    scope.closeHandler = null;
                    scope.showCloseButton = false;
                }

                if (data.actionHandler) {
                    scope.actionHandler = data.actionHandler;
                    scope.showActionButton = true;
                    scope.actionText = data.actionText;
                } else {
                    scope.actionHandler = null;
                    scope.showActionButton = false;
                    scope.actionText = null;
                }

                if (!scope.isPermanent) {

                    //delaying setting up mouse move event or 1s because
                    //the move that caused the notification is detected as movement.
                    setTimeout(function() {
                        $(document).one('touchmove', function() {
                            setCloseTimeout();
                        });

                        $(document).one('mousemove', function() {
                            setCloseTimeout();
                        });

                    }, 1000);
                }

            }

            function setCloseTimeout() {
                hideNotificationTimeout = $timeout(closeNotification, settings.duration);
            }
        }
    }

}(window.angular));
