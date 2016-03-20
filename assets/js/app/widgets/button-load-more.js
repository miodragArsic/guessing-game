(function() {
    'use strict';

    angular
        .module('app')
        .directive('buttonLoadMore', buttonLoadMore);

    function buttonLoadMore() {

        // Usage:
        // function 'load', linked using scope property 'load' needs to return promise
        var directive = {
            templateUrl: '/assets/js/app/widgets/button-load-more.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                load: '&',
                size: '='
            }
        };
        return directive;
    }

    function Controller() {

        var vm = this;
        vm.isLoading = false;
        vm.hasError = false;
        vm.loadMore = loadMore;
        vm.thereIsNoMoreItems = false;

        function loadMore() {

            if (vm.load) {

                vm.isLoading = true;
                vm.hasError = false;

                vm.load().then(function(result) {
                    if (result && angular.isArray(result)) {

                        if (vm.size > result.length) {
                            vm.thereIsNoMoreItems = true;
                        }
                    }

                    return result;
                }).catch(function() {
                    vm.hasError = true;
                }).
                finally(function() {
                    vm.isLoading = false;
                });
            }
        }
    }
})();
