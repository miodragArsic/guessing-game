(function(ng){

	ng.module('app').directive('textSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/text/text-setter.html',
                scope: {
                    textValue: '='
                },
                link: linker
            };
        }
    ]);




}(window.angular));