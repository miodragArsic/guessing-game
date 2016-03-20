(function() {
    'use strict';

    angular
        .module('app')
        .directive('assetName', assetName);

    assetName.$inject = ['asset.repository', 'nameCache'];

    function assetName(assetRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=assetName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.assets[scope.id]) {
                    $(element[0]).html(nameCache.assets[scope.id]);
                } else {

                    assetRepository.find(scope.id).then(function(asset) {
                        $(element[0]).html(asset.title);
                        nameCache.assets[scope.id] = asset.title;
                    });
                }
            });
        }
    }

})();
