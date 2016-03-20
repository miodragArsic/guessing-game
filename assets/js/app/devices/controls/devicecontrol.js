(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceControl', deviceControl);

    deviceControl.$inject = ['$compile'];

    function deviceControl($compile) {

        var directive = {
            restrict: 'E',
            scope: {
                device: '=',
                control: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('control', function(newValue) {
                if (scope.device) {
                    var ctrl = getControl(scope.control);
                    if (ctrl) {
                        element.html(ctrl);
                        $compile(element.contents())(scope);
                    }
                }
            });
        }

        function getControl(control) {

            if (!control) {
                return null;
            }

            return '<{0}-device-control device="device"></{0}-device-control>'.format(control);
        }
    }

})();
