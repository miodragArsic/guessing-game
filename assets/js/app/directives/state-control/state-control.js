(function(ng) {

    ng
        .module('app')
        .directive('stateControl', StateControl);

    function StateControl() {

        var directive = {
            restrict: 'E',
            controller: 'StateControlController',
            scope: {
                modifierClass: '@',
                identifier: '@',
                state: '=?',
                onToggle: '&'
            },
            link: linker
        };

        return directive;

        //////////

        function linker(scope, element, attrs, ctrl) {

            var parentStateControls = $(element).parents('state-control');

            for (var i = 0; i < parentStateControls.length; i++) {
                var parentIdentifier = $(parentStateControls[i]).attr('identifier');
                ctrl.addParentStateControlId(parentIdentifier);
            }

        }
    }
}(window.angular));
