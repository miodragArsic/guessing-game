(function() {
    'use strict';

    angular
        .module('app')
        .directive('groundName', groundName);

    groundName.$inject = ['ground.repository', 'nameCache'];

    function groundName(groundRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=groundName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.grounds[scope.id]) {
                    $(element[0]).html(nameCache.grounds[scope.id]);
                } else {
                    groundRepository.find(scope.id).then(function(ground) {
                        $(element[0]).html(ground.title);
                        nameCache.grounds[scope.id] = ground.title;
                    });
                }

            });
        }
    }

})();
