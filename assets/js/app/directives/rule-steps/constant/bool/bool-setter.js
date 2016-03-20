(function(ng){

	ng.module('app').directive('boolSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/bool/bool-setter.html',
                scope: {
                    boolValue: '='
                },
                link: linker
            };
        }
    ]);
}(window.angular));