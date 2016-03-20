(function(ng) {

    ng
        .module('app')
        .directive('slRuleSectionPreview', slRuleSectionPreview);

    slRuleSectionPreview.$inject = ['$filter'];

    function slRuleSectionPreview($filter) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/rule-section-preview/view.html',
            scope: {
                sectionData: '=',
                sectionName: '@'
            },
            link: linker
        };

        return directive;

        //////////////////

        function linker(scope) {

            scope.sectionDataApplied = [];

            scope.$watch('sectionData', function(newValue, oldValue) {
                if (newValue.constructor === Array) {
                    scope.sectionDataApplied = scope.sectionData;
                } else {
                    scope.sectionDataApplied.push(newValue);
                }
            });

            scope.getHeaderText = function(sectionData) {
                if (sectionData.selectedDevice) {
                    return sectionData.selectedDevice.title;
                }

                if (sectionData.selectedService) {
                    return sectionData.selectedService.name;
                }
            };

            scope.getLeftName = function(sectionData) {

                var leftName = '';
                if (sectionData.selectedAsset) {
                    leftName = sectionData.selectedAsset.title;
                }

                if (sectionData.selectedService) {
                    leftName = 'is';
                }

                return leftName;
            };

            scope.getComparatorName = function(sectionData) {

                var comparatorName = '';

                if (sectionData.selectedCompareType == 'constant' || sectionData.selectedCompareType == null) {
                    if (sectionData.constantCompareOperation.op && sectionData.selectedAsset) {
                        comparatorName = translateOperator(sectionData.constantCompareOperation.op);
                    }
                }

                if (sectionData.selectedCompareType == 'reference') {
                    if (sectionData.referenceCompareOperation.op && sectionData.referenceCompareOperation.asset) {
                        comparatorName = translateOperator(sectionData.referenceCompareOperation.op);
                    }
                }

                if (sectionData.selectedCompareType === 'onEveryChange') {

                    if (sectionData.constantCompareOperation.op && sectionData.selectedAsset) {
                        comparatorName = translateOperator(sectionData.constantCompareOperation.op);
                    }

                }

                return comparatorName;
            };

            scope.getValue = function(sectionData) {

                var value = '';

                if (sectionData.selectedCompareType == 'constant') {
                    if (sectionData.constantCompareOperation.value) {

                        var profile = sectionData.selectedAsset ? sectionData.selectedAsset.profile : null;

                        if (!profile) {
                            profile = sectionData.selectedService.profile;
                        }

                        value = $filter('assetValueFormat')(sectionData.constantCompareOperation.value, profile);
                    }
                }

                if (sectionData.selectedCompareType == 'reference') {
                    value = sectionData.referenceCompareOperation.device.title + ' / ' + sectionData.referenceCompareOperation.asset.title;
                }

                return value;

            };

            function translateOperator(rawOperator) {

                var realComparatorName = rawOperator;

                if (rawOperator === 'OEC') {
                    realComparatorName = 'value is changed';
                }

                if (rawOperator === '>') {
                    realComparatorName = 'is greater than';
                }

                if (rawOperator === '<') {
                    realComparatorName = 'is lower than';
                }

                if (rawOperator === '==') {
                    realComparatorName = 'equals to';
                }

                if (rawOperator === '=') {
                    realComparatorName = 'set to';
                }

                return realComparatorName;

            }
        }
    }

}(window.angular));
