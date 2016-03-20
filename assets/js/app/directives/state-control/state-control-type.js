(function(ng) {

    ng
        .module('app')
        .directive('stateControlType', StateControlType);

    function StateControlType() {

        var directive = {
            restrict: 'A',
            require: '^stateControl',
            scope: {
                type: '@stateControlType'
            },
            compile: function(elm, attrs, transclude) {
                return linker;
            }

        };

        return directive;

        ////////////////////

        function linker(scope, elm, attrs, stateController) {
            var type = scope.type;
            var stateEl = elm[0];

            scope.hide = hide;
            scope.toggle = toggle;

            if (type == 'trigger') {
                stateController.registerTrigger(scope);
                $(stateEl).click(function(e) {
                    stateController.toggle();
                    e.stopPropagation();
                });
            }

            if (type == 'container') {
                stateController.registerContainer(scope);
            }

            if (type == 'morph') {
                stateController.registerMorph(scope);
            }

            if (type == 'close') {
                $(stateEl).click(function(e) {
                    stateController.hide();
                    e.stopPropagation();
                });
            }

            function hide(className) {

                $(stateEl).removeClass(className);
            }

            function toggle(className) {

                if (stateEl.classList.contains(className)) {
                    stateEl.classList.remove(className);
                } else {
                    stateEl.classList.add(className);
                    $(document).one('click', documentClickHandler);
                    $(document).one('keyup', documentKeyUpHandler);
                }
            }

            function documentClickHandler(e) {

                var $el = $(e.target);

                var isInsideStateControl = $el.parents('state-control').length > 0;

                //if trigger to toggle state-control is outside of the state-control
                //it is required to set  'state-control-trigger' attribute
                //in order to prevent document.click to close the state-control
                var attr = $el.attr('state-control-toggler');

                var button = $el.attr('state-control-button');

                var isStateControlToggler = typeof attr !== typeof undefined && attr !== false;

                var isStateControlButton = typeof button !== typeof undefined && button !== false;

                if (isInsideStateControl || isStateControlToggler || isStateControlButton) {

                    $(document).one('click', documentClickHandler);

                } else {

                    stateController.hide();
                }
            }

            function documentKeyUpHandler(e) {

                if (e.keyCode === 27) {
                    stateController.hide();
                }
            }

            scope.$on('$destroy', function() {

                $(stateEl).off();
            });
        }
    }

}(window.angular));
