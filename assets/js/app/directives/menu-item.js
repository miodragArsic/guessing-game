(function(ng) {
    ng
        .module('app')
        .directive('menuItem', menuItem);

    menuItem.$inject = ['$location', '$state', '$rootScope'];

    function menuItem($location, $state, $rootScope) {

        var directive = {
            restrict: 'EA',
            link: linker
        };

        return directive;

        ///////////////////////

        function linker(scope, element, attrs) {

            var menuPath = element.attr('menu-path') || element.find('a').attr('menu-path');

            var activeClass = attrs.activeClass || 'active';

            var currentState = $state.current;

            function isActive(toState, fromState) {

                var link = '/' + menuPath;

                var location = $location.$$path;

                var asset = '/asset';

                if (menuPath === toState.data.section) {

                    element.addClass(activeClass);

                } else {

                    element.removeClass(activeClass);

                }
            }

            if (currentState.data && currentState.data.section) {

                isActive(currentState);

            }

            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

                if (toState.data && toState.data.section) {

                    isActive(toState);

                }

                if (toState.data && fromState.data && toState.data.section && toState.data.section) {

                    isActive(toState, fromState);

                }
            });

        }
    }
}(window.angular));
