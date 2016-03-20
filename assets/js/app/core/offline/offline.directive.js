(function() {
    'use strict';

    angular
        .module('app')
        .directive('offline', offline);

    function offline() {
        var directive = {
            templateUrl: '/assets/js/app/core/offline/offline.template.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope:{}
        };
        return directive;
    }

    Controller.$inject = ['offline'];

    function Controller(offline) {

        var vm = this;
        vm.status = offline;
    }
})();
