(function() {
    'use strict';

    angular
        .module('app')
        .directive('listHeader', listHeader);

    listHeader.$inject = [];

    function listHeader() {

        var directive = {
            transclude: true,
            templateUrl: '/assets/js/app/widgets/list_header/list-header.html',
            link: link,
            restrict: 'E',
            scope: {
                viewModel: '='
            }
        };

        return directive;

        function link() {

        }
    }
})();
