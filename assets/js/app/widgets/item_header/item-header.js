(function() {
    'use strict';

    angular
        .module('app')
        .directive('slHeaderItem', slHeaderItem);

    function slHeaderItem() {

        var directive = {
            templateUrl: '/assets/js/app/widgets/item_header/item-header.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            transclude: true,
            restrict: 'E',
            scope: {
                model: '=',
                toggleAction: '&',
                isActive: '&',
                config: '@',
                color: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['$state', '$parse'];

    function Controller($state, $parse) {

        var vm = this;

        vm.goBack = goBack;

        vm.configuration = {
            hideActions: false
        };

        if (vm.config) {

            vm.configuration = $parse(vm.config)();

        }

        function goBack() {

            if (vm.model.visibility === 'personal') {

                $state.go('main.devices');

            } else {

                $state.go(vm.model.backRoute.name, vm.model.backRoute.data);

            }
        }
    }
})();
