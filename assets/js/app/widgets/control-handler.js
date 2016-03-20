(function() {

    angular
        .module('app')
        .directive('controlHandler', controlHandler);

    controlHandler.$inject = ['$compile', 'asset.repository', 'api.controlsService', 'utils'];

    function controlHandler($compile, assetRepository, controlsService, utils) {

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                controlName: '=',
                asset: '=',
                enabled: '='
            }
        };

        return directive;

        ///////////////////////////

        function getControl(asset) {

            var widgetName = null;

            if (asset.control && asset.control.name) {

                widgetName = asset.control.name;

            } else {

                widgetName = controlsService.getDefaultControl(asset);

            }

            var template = '<{0}-control enabled="enabled" value="asset.state.value" profile="asset.profile" id="asset.id" on-change="onChange(val)" asset="asset" configuration="asset.control.extras"></{0}-control>'.format(widgetName);

            return template;

        }

        function linker(scope, element, attrs) {

            scope.onChange = function(val) {

                if (scope.enabled) {

                    return assetRepository.publishCommand(scope.asset.id, val);

                }

                return utils.$q.when();

            };

            scope.$watch('asset.control.name', function() {
                element.html(getControl(scope.asset));

                $compile(element.contents())(scope);

            });
        }
    }

})();
