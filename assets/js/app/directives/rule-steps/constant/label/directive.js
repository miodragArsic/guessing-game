(function(ng) {

    ng
        .module('app')
        .directive('labelSetter', labelSetter);

    function labelSetter() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/constant/label/view.html',
            scope: {
                value: '=',
                profile: '='
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attrs) {

            scope.labels = [];

            scope.onValueSelected = function(item, model) {
                scope.value = item.value;
            };

            scope.$watch('profile', function(newProfile) {
                
                if (!newProfile || !newProfile.labels) {
                    scope.labels = [];
                } else {

                    for (var i = 0; i < newProfile.labels.length; i++) {

                        var lbl = newProfile.labels[i];

                        if (lbl.value) {
                            scope.labels.push({
                                name: lbl.label,
                                value: lbl.value
                            });
                        } else if (lbl.from && lbl.to) {

                            for (var iterator = lbl.from; iterator < lbl.to; iterator++) {
                                scope.labels.push({
                                    name: lbl.label + ' ' + iterator,
                                    value: iterator
                                });
                            }
                        }
                    }
                }

            });
        };
    };

}(window.angular));
