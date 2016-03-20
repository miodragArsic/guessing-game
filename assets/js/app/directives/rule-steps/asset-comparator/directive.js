(function(ng) {

    ng.module('app').directive('assetComparator', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {

                function getComparators(type) {
                    var comparators = [];

                    if (type == 'bool' || type == 'boolean' || type == 'text' || type == 'string' || type == 'object') {
                        comparators.push({
                            name: 'Equal to',
                            id: '=='
                        });
                        comparators.push({
                            name: 'Not Equal to',
                            id: '!='
                        });
                    }

                    if (type == 'integer' || type == 'int' || type == 'number' || type == 'num' || type == 'date' || type == 'timespan' || type == 'double') {
                        comparators.push({
                            name: 'Equal to',
                            id: '=='
                        });
                        comparators.push({
                            name: 'Not Equal to',
                            id: '!='
                        });
                        comparators.push({
                            name: 'Less than',
                            id: '<'
                        });
                        comparators.push({
                            name: 'Less or equal than',
                            id: '<='
                        });
                        comparators.push({
                            name: 'Greater than',
                            id: '>'
                        });
                        comparators.push({
                            name: 'Greater or equal than',
                            id: '=>'
                        });

                    }

                    return comparators;
                }

                scope.comparatorSelected = function(item, model) {
                    scope.comparatorValue = item.id;
                };

                scope.$watch('profile', function(newProfile, oldProfile) {

                    if (newProfile) {
                        scope.comparators = getComparators(newProfile.type);
                    }
                });
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/asset-comparator/view.html',
                scope: {
                    profile: '=',
                    comparatorValue: '='
                },
                link: linker
            };
        }

    ]);
}(window.angular));
