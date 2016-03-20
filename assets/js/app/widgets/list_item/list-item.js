(function() {
    'use strict';

    angular
        .module('app')
        .directive('listItem', listItem);

    listItem.$inject = [];

    function listItem() {

        var directive = {
            transclude: true,
            templateUrl: '/assets/js/app/widgets/list_item/list-item.html',
            restrict: 'E',
            scope: {
                viewModel: '=',
                groundTag: '=',
                color: '='
            }
        };

        return directive;
    }
})();
