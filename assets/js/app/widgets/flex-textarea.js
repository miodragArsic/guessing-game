(function() {
    'use strict';

    angular
        .module('app')
        .directive('flexTextarea', flexTextarea);

    flexTextarea.$inject = ['$timeout'];

    function flexTextarea($timeout) {

        var directive = {
            bindToController: true,
            transclude: true,
            controller: FlexTextController,
            templateUrl: '/assets/js/app/widgets/flex-textarea.html',
            controllerAs: 'vm',
            link: link,
            replace: true,
            restrict: 'E',
            scope: {
                data: '=',
                saved: '='
            }
        };
        return directive;

        function link(scope, element, attrs, ctrl, transclude) {

            var textarea = element.find('textarea');
            var oldValue = '';

            if (textarea) {

                $(textarea).click(function() {
                    $timeout(function() {
                        oldValue = textarea.val();
                    }, 1);
                });

                element.find('to-replace').replaceWith(transclude());

                if (textarea) {
                    $(textarea).focusout(function(e) {

                        $timeout(function() {

                            if (!scope.vm.saved) {
                                scope.$apply(function() {
                                    scope.vm.data = oldValue;
                                });
                            }
                        }, 100);
                    });
                }
            }
        }

        function FlexTextController() {

        }
    }
})();
