(function(ng){

	ng.module('app').directive('dateSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/date/date-setter.html',
                scope: {
                    dateValue: '='
                },
                link: linker
            };
        }
    ]);
}(window.angular));