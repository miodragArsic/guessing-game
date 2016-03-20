(function(ng) {

    ng.module('app').directive('assetStep', ['$filter', 'utility.deviceIcons',

        function($filter, icons) {

            var linker = function(scope) {

                scope.getIcon = function(iconKey) {
                    return icons.getIcon(iconKey);
                };

                scope.onAssetSelected = function(item, model) {
                    scope.selectedAsset = item;
                };
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/steps/asset-step/view.html',
                scope: {
                    assets: '=',
                    title: '@',
                    selectedAsset: '=',
                    filterByType: '@'
                },
                link: linker
            };
        }
    ]);

}(window.angular));
