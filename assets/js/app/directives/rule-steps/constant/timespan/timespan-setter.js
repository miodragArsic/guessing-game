(function(ng) {

    ng.module('app').directive('timespanSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/timespan/timespan-setter.html',
                scope: {
                    timespanValue: '='
                },
                link: linker
            };
        }
    ]);

}(window.angular));