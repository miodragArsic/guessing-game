(function() {
    'use strict';

    angular
        .module('app')
        .directive('pageLoader', pageLoader);

    function pageLoader() {

        return {
            restrict: 'EA',
            link: function(scope, element) {
                // Store original display mode of element
                var shownType = element.css('display');

                scope.$on('$routeChangeStart', function() {
                    element.removeClass('hidden');
                });

                scope.$on('$routeChangeError', function() {
                    element.addClass('hidden');
                });

                scope.$on('$routeChangeEnd', function() {
                    element.addClass('hidden');
                });

                // Initially hidden
                hideElement();
            }
        };
    }
})();
