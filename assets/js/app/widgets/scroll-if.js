(function(ng) {
    ng
        .module('app')
        .directive('scrollIf', scrollIf);

    scrollIf.$inject = ['$timeout', '$window'];

    function scrollIf($timeout, $window) {

        return function(scope, el, attrs) {

            scope.$watch(attrs.scrollIf, watchHandler);

            function watchHandler(value) {

                $timeout(function() {

                    if (value) {

                        var scrollingParent = getScrollingParent(el[0]);
                        var centerScroll = scrollingParent.scrollHeight;
                        
                        $(scrollingParent).animate({
                            scrollTop: centerScroll
                        }, 1000);
                    }
                });
            }

            function getScrollingParent(element) {
                element = element.parentElement;
                while (element) {
                    if (element.scrollHeight !== element.clientHeight) {
                        return element;
                    }
                    element = element.parentElement;
                }
                return null;
            };
        };
    };

}(window.angular));
