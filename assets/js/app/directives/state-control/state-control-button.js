(function() {
    'use strict';

    angular
        .module('app')
        .directive('stateControlButton', stateControlButton);

    stateControlButton.$inject = ['$rootScope'];

    function stateControlButton($rootScope) {

        var directive = {
            restrict: 'A',
            scope: {
                identifier: '@'
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attrs) {

            var eventArgs = {
                identifier: scope.identifier,
                state: false
            };

            element.bind('click', function() {

                eventArgs.state = !eventArgs.state;

                $rootScope.$broadcast('stateControlButtonEvent', eventArgs);
            });

        }
    }
})();
