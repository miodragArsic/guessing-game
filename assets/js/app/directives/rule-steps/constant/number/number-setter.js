(function(ng) {

    ng
        .module('app')
        .directive('numberSetter', numberSetter);

    function numberSetter() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/constant/number/number-setter.html',
            scope: {
                numValue: '='
            }
        };

        return directive;
    };

}(window.angular));
