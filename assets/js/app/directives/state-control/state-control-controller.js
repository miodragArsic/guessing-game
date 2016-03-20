(function(ng) {

    ng
        .module('app')
        .controller('StateControlController', StateControlController);

    StateControlController.$inject = ['$scope', '$rootScope', 'stateControlManager'];

    function StateControlController($scope, $rootScope, stateControlManager, el) {

        var modifierClass = $scope.modifierClass;
        var morphEl = $('[state-control-type="morph"]');

        var ctrl = this;

        ctrl.identifier = $scope.identifier;
        ctrl.containers = [];
        ctrl.triggers = [];
        ctrl.morphs = [];
        ctrl.parentStateControlIdentifiers = [];
        ctrl.registerContainer = registerContainer;
        ctrl.registerTrigger = registerTrigger;
        ctrl.registerMorph = registerMorph;

        ctrl.toggle = toggle;
        ctrl.hide = hide;

        ctrl.addParentStateControlId = addParentStateControlId;
        ctrl.getParentStateControlIds = getParentStateControlIds;

        stateControlManager.register(ctrl);

        //////////////

        $scope.$on('$destroy', function() {

            stateControlManager.unregister(ctrl);
        });

        $scope.$watch('state', function(newValue, oldValue) {

            var isOldValueUndefined = typeof oldValue === 'undefined';

            if (!isOldValueUndefined && (oldValue != newValue)) {

                toggle();
            }

        }, true);

        $rootScope.$on('stateControlButtonEvent', function(event, args) {

            if (args.identifier === ctrl.identifier) {

                toggle();

            }
        });

        function toggleFromBeyond() {

            var elements = getAllElementsWithAttribute('state-control-type');

            return elements;

        };

        function getAllElementsWithAttribute(attribute) {

            var matchingElements = [];
            var allElements = document.getElementsByTagName('*');
            for (var i = 0, n = allElements.length; i < n; i++) {
                if (allElements[i].getAttribute(attribute) !== null) {
                    // Element exists with attribute. Add to array.
                    matchingElements.push(allElements[i]);
                }
            }

            return matchingElements;
        }

        function hideMorph() {
            if (morphEl.hasClass(modifierClass)) {
                morphEl.removeAttr('style');
            }
        }

        function toggle() {

            if ($scope.onToggle) {
                $scope.onToggle();
            }

            angular.forEach(ctrl.containers, function(container) {
                container.toggle(modifierClass);
            });

            angular.forEach(ctrl.triggers, function(trigger) {
                trigger.toggle(modifierClass);
            });

            angular.forEach(ctrl.morphs, function(morph) {
                morph.toggle(modifierClass);
            });

            hideMorph();

            stateControlManager.reportStateChange(ctrl);
        }

        function hide() {

            angular.forEach(ctrl.containers, function(container) {
                container.hide(modifierClass);
            });

            angular.forEach(ctrl.triggers, function(trigger) {
                trigger.hide(modifierClass);
            });

            angular.forEach(ctrl.morphs, function(morph) {
                morph.hide(modifierClass);
            });

            hideMorph();
        }

        function registerContainer(container) {

            ctrl.containers.push(container);
        }

        function registerTrigger(trigger) {

            ctrl.triggers.push(trigger);
        }

        function registerMorph(morph) {

            ctrl.morphs.push(morph);
        }

        function addParentStateControlId(parentId) {

            ctrl.parentStateControlIdentifiers.push(parentId);
        }

        function getParentStateControlIds() {
            return ctrl.parentStateControlIdentifiers;
        }
    }

}(window.angular));
