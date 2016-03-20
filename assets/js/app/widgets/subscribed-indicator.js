(function() {
    'use strict';

    angular
        .module('app')
        .directive('subscribedIndicator', subscribedIndicator);

    function subscribedIndicator() {

        var directive = {
            bindToController: true,
            controller: Controller,
            templateUrl: '/assets/js/app/widgets/subscribed-indicator.html',
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                itemId: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['GroundContext'];

    function Controller(groundContext) {

        var vm = this;
        vm.isSubscribed = isSubscribed;

        function isSubscribed() {

            var ground = groundContext.find(vm.itemId);

            if (!ground) {
                return false;
            }

            return ground.isSubscribed();
        }
    }
})();
