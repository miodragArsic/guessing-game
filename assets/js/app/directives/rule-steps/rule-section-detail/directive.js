(function(ng) {

    ng
        .module('app')
        .directive('slRuleSectionDetail', slRuleSectionDetail);

    slRuleSectionDetail.$inject = ['$filter', 'userContext'];

    function slRuleSectionDetail($filter, userContext) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/rule-section-detail/view.html',
            scope: {
                sectionData: '=',
                sectionName: '@',
                sectionTitle: '@',
                currentStep: '=',
                currentSection: '=',
                isSectionReady: '&',
                isEditMode: '=?'
            },
            link: linker
        };

        return directive;
        ///////////////
        function linker(scope) {

            scope.steps = [];

            initSteps();

            scope.isReady = function() {
                return scope.isSectionReady(scope.sectionName);
            };

            scope.getHeaderText = function() {
                if (scope.sectionData.selectedDevice) {
                    return scope.sectionData.selectedDevice.name;
                }

                if (scope.sectionData.selectedService) {

                    if (scope.sectionData.selectedService.type == 'emailMe') {
                        var email = userContext.user.email;
                        return scope.sectionData.selectedService.name + ' to ' + email;
                    }

                    if (scope.sectionData.selectedService.type == 'notify') {
                        var user = userContext.user.name;
                        return 'Send ' + scope.sectionData.selectedService.name + ' to ' + user;
                    }

                    return scope.sectionData.selectedService.name;
                }
            };

            scope.getDetails = function() {

                var detailsText = '';

                if (scope.sectionData.selectedAsset) {
                    detailsText += scope.sectionData.selectedAsset.title;
                    detailsText += getCompareText();
                } else if (scope.sectionData.selectedService) {
                    detailsText += getCompareText();
                }

                return detailsText;
            };

            function getCompareText() {

                var text = '';

                if (scope.sectionData.selectedCompareType == 'constant' || scope.sectionData.selectedCompareType == null) {

                    if (scope.sectionData.constantCompareOperation.op && scope.sectionData.selectedAsset) {

                        text += scope.sectionData.constantCompareOperation.op;

                    }

                    if (scope.sectionData.constantCompareOperation.value) {

                        var profile = scope.sectionData.selectedAsset ? scope.sectionData.selectedAsset.profile : null;
                        if (!profile) {
                            profile = scope.sectionData.selectedService.profile;
                        }

                        var formattedValue = $filter('assetValueFormat')(scope.sectionData.constantCompareOperation.value, profile);

                        text += formattedValue;
                    }
                }

                if (scope.sectionData.selectedCompareType == 'reference') {

                    if (scope.sectionData.referenceCompareOperation.op) {
                        text += ' ' + scope.sectionData.referenceCompareOperation.op + ' ';
                    }

                    if (scope.sectionData.referenceCompareOperation.device) {
                        text += scope.sectionData.referenceCompareOperation.device.name;
                    }

                    if (scope.sectionData.referenceCompareOperation.asset) {
                        text += ' / ' + scope.sectionData.referenceCompareOperation.asset.title;
                    }
                }

                if (scope.sectionData.selectedCompareType == 'onEveryChange') {

                    if (scope.sectionData.constantCompareOperation.op == 'OEC') {
                        text += ' - On Every Change';
                    }
                }

                return text;
            }

            scope.isSubstepActive = function(stepName) {

                if (scope.currentSection != scope.sectionName)
                    return false;

                if (scope.currentStep.name == stepName)
                    return true;

                return false;
            };

            scope.isSubstepVisible = function(stepName) {

                if (stepName == 'deviceOrServiceStep') {
                    if (scope.isEditMode) {
                        return false;
                    }
                    return true;
                }

                if (stepName == 'dayTimeDefineStep') {
                    if (scope.sectionData.selectedService) {
                        if (scope.sectionData.selectedService.type == 'dayTime') {
                            return true;
                        }

                    }
                    return false;
                }

                if (stepName == 'deviceDefineStep') {
                    if (scope.sectionData.selectedService) {
                        return false;
                    }
                    return true;
                }

                if (stepName == 'eMailMeDefineStep') {
                    if (scope.sectionData.selectedService) {
                        if (scope.sectionData.selectedService.type == 'emailMe') {
                            return true;
                        }

                    }
                    return false;
                }


            };

            function initSteps() {

                scope.steps.push({
                    name: 'deviceOrServiceStep'
                });

                scope.steps.push({
                    name: 'dayTimeDefineStep'
                });

                scope.steps.push({
                    name: 'deviceDefineStep'
                });

                scope.steps.push({
                    name: 'eMailMeDefineStep'
                });

                return scope.steps;
            };
        }
    }

}(window.angular));
