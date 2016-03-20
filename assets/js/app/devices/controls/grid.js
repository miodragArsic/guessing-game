(function(ng) {
    ng
        .module('app')
        .directive('assetGrid', assetGrid);

    assetGrid.$inject = ['utility.deviceIcons', '$filter', '$state', 'utility.common'];

    function assetGrid(icons, $filter, $state, common) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/devices/controls/grid.html',
            scope: {
                assets: '=',
                model: '='
            },
            link: linker
        };

        return directive;

        ////////////////////////
        function linker(scope) {

            scope.howMany = 0;

            scope.categories = [{
                name: 'primary',
                exists: false,
                assets: []
            }, {
                name: 'secondary',
                exists: false,
                assets: []
            }, {
                name: 'management',
                exists: false,
                assets: []
            }, {
                name: 'battery',
                exists: false,
                assets: []
            }, {
                name: 'config',
                exists: false,
                assets: []
            }, {
                name: 'undefined',
                exists: false,
                assets: []
            }];

            function prepareSections() {

                for (var i = 0; i < scope.categories.length; i++) {
                    scope.categories[i].assets = [];
                    scope.categories[i].exists = false;
                    scope.howMany = 0;
                }

                if (scope.assets) {
                    for (var i = 0; i < scope.assets.length; i++) {
                        for (var j = 0; j < scope.categories.length; j++) {
                            if (scope.assets[i].style == scope.categories[j].name) {
                                scope.categories[j].exists = true;
                                scope.categories[j].assets.push(scope.assets[i]);
                            }
                        }
                    }
                }
            }

            scope.shortenString = function(value) {

                if (value !== null && value !== undefined) {
                    if (typeof(value) == 'object') {
                        var stringified = JSON.stringify(value);
                        return common.limitStringLength(stringified, 10);
                    } else {
                        return common.limitStringLength(value, 10);
                    }
                }
            };

            scope.getAssetIcon = function(iconKey) {
                if (iconKey) {
                    return icons.getIcon(iconKey);
                } else {
                    return icons.getIcon('asset');
                }
            };

            scope.isSectionVisible = function(category) {
                if (category.exists && (scope.howMany > 1)) {
                    return true;
                }

                return false;
            };

            scope.prepareNameForView = function(sectionName) {
                if (sectionName == 'Undefined' || sectionName == 'undefined') {
                    sectionName = 'Other';
                }

                return sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            };

            scope.goToAsset = function(assetId) {
                $state.go('main.asset', {
                    id: assetId
                });
            };

            scope.removeAsset = function(assetId) {

                for (var i = 0; i < scope.assets.length; i++) {
                    if (scope.assets[i].id == assetId) {
                        scope.assets.splice(i, 1);
                    }
                }

                for (var i = 0; i < scope.categories.length; i++) {
                    for (var y = 0; y < scope.categories[i].assets.length; y++) {
                        if (scope.categories[i].assets[y].id == assetId) {
                            scope.categories[i].assets.splice(y, 1);
                        }
                    }
                }
            };

            scope.$watchCollection('assets', function() {
                prepareSections();

                for (var i = 0; i < scope.categories.length; i++) {
                    if (scope.categories[i].exists === true) {
                        scope.howMany++;
                    }
                }

            });
        }
    }

}(window.angular));
