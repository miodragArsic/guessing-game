(function(ng) {
    ng.module('app').controller('modals.rule.Options', [
        '$modalInstance',
        '$state',
        'api.rulesService',
        'api.devicesService',
        'api.servicesService',
        'notifyService',
        'utility.common',
        '$q',
        'rule',
        'service.dayTime',
        '$rootScope',

        function($modalInstance, $state, rulesService, devicesService, servicesService, notifyService, common, $q, rule, dayTime, $rootScope) {

            var vm = this;
            $rootScope.$on('$stateChangeStart',
                function(event, toState, toParams, fromState, fromParams) {
                    $modalInstance.dismiss();

                });

            vm.rule = rule;
            vm.newRuleName = rule.name;
            vm.isRuleEditEnabled = true;
            vm.deleteOpen = true;

            vm.toggleRuleStatus = toggleRuleStatus;
            vm.updateRule = updateRule;
            vm.editRuleInJSON = editRuleInJSON;
            vm.editRuleInWizard = editRuleInWizard;
            vm.viewRuleHistory = viewRuleHistory;
            vm.deleteRule = deleteRule;
            vm.isEnabled = isEnabled();
            vm.isDefinitionLoaded = false;
            vm.hasIssues = false;
            vm.isRuleSimple = null;

            vm.definitionModel = {
                when: [],
                then: [],
                else: []
            };

            vm.definitionModel.else.isSectionLoaded = false;

            var devices = null;
            var services = null;
            var ruleDefinition = null;

            if (vm.rule.definition) {
                ruleDefinition = JSON.parse(vm.rule.definition);
            }

            activate();

            //////////////////////////////////////////////////////

            function activate() {

                var promises = [];

                promises.push(devicesService.getAll());
                promises.push(servicesService.getAll());

                if (!rule.definition) {
                    promises.push(rulesService.get(rule.id));
                }

                $q.all(promises)
                    .then(function(responses) {
                        devices = responses[0].data;
                        services = responses[1].data;
                        if (responses[2]) {
                            vm.rule.definition = responses[2].data.definition;

                            if (vm.rule.definition) {
                                ruleDefinition = JSON.parse(rule.definition);

                            }
                        }

                        if (ruleDefinition) {
                            vm.isRuleSimple = isRuleSimple(ruleDefinition);
                            map('when', ruleDefinition);
                            map('then', ruleDefinition);
                            map('else', ruleDefinition);

                            if (hasMissingDependables()) {

                                notifyService.error('Error: ', 'Rule ' + vm.rule.name + ' has issues with missing assets or devices.', null, true);
                                vm.hasIssues = true;
                            }
                        }

                        vm.isDefinitionLoaded = true;
                    })
                    .catch(function(error) {
                        var errorMessage = 'There was an error contacting server. ';
                        if (error.data && error.data.message) {
                            errorMessage += error.data.message;
                        }

                        notifyService.error('Error: ', errorMessage, null, true);
                    });

            }

            function map(sectionName, ruleDefinition) {

                var sectionViewModel = vm.definitionModel[sectionName];

                sectionViewModel.isSectionLoaded = common.mapRulePreviewToViewModel(ruleDefinition, sectionName, sectionViewModel, devices, services);
            }

            function hasMissingDependables() {

                return hasSectionMissingDependables('when') || hasSectionMissingDependables('then') || hasSectionMissingDependables('else');
            }

            function hasSectionMissingDependables(sectionName) {
                var sectionViewModel = vm.definitionModel[sectionName];

                if (sectionViewModel.misingLeftDevice || sectionViewModel.missingLeftAsset || sectionViewModel.missingRightDevice || sectionViewModel.missingRightAsset) {
                    return true;
                }

                return false;
            }

            function toggleRuleStatus() {

                if (vm.isEnabled) {

                    vm.isEnabled = false;
                    rulesService.enabled(vm.rule.id, false)
                        .then(function(data) {
                            notifyService.success('Success: ', 'Rule is Idle');
                            rule.status = 2;
                            $rootScope.$emit('rootScope:rule:statusChanged', {status: rule.status, id: rule.id});
                        })
                        .catch(function(error) {
                            notifyService.error('Error: ', 'There was a problem disabling the Rule.', null, true);
                        });
                } else {
                    vm.isEnabled = true;
                    rulesService.enabled(vm.rule.id, true)
                        .then(function(data) {
                            notifyService.success('Success: ', 'Rule is Running');
                            rule.status = 1;
                            $rootScope.$emit('rootScope:rule:statusChanged', {status: rule.status, id: rule.id});
                        })
                        .catch(function(error) {
                            notifyService.error('Error: ', 'There was a problem enabling the Rule.', null, true);
                        });
                }
            }

            function updateRule() {

                rulesService.update(vm.rule.id, vm.newRuleName, vm.rule.description, JSON.parse(vm.rule.definition))
                    .then(function() {
                        notifyService.success('Success: ', 'Rule Updated');
                        $state.reload();

                    })
                    .catch(function(error) {
                        notifyService.error('Error: ', 'There was an error updating the rule.', null, true);
                    });
            }

            function editRuleInJSON() {

                var ruleDefinition = vm.rule.definition;

                if (vm.rule.definition) {
                    ruleDefinition = JSON.parse(vm.rule.definition);
                }

                $state.go('main.ruleEditJSON', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function editRuleInWizard() {

                var ruleDefinition = vm.rule.definition;

                if (vm.rule.definition) {
                    ruleDefinition = JSON.parse(vm.rule.definition);
                }

                $state.go('main.ruleEditWizard', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function viewRuleHistory() {

                $state.go('main.ruleHistory', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function deleteRule() {

                rulesService.delete(vm.rule.id)
                    .then(function(response) {
                        notifyService.success('Success: ', 'Rule is deleted.');
                        $modalInstance.close();
                        $state.reload();
                    })
                    .catch(function(error) {
                        notifyService.error('Error: ', 'Error while deleting the rule.', null, true);
                    });
            }

            function isEnabled() {
                return rule.status == 1;
            }

            function isRuleSimple(ruleDefinition) {

                var isSimple = true;

                angular.forEach(ruleDefinition, function(ruleSection) {
                    if (ruleSection.hasOwnProperty('when')) {
                        if (ruleSection.when.length > 1) {
                            isSimple = false;
                        }
                    }

                    if (ruleSection.hasOwnProperty('then')) {
                        if (ruleSection.then.length > 1) {
                            isSimple = false;
                        }
                    }

                    if (ruleSection.hasOwnProperty('else')) {
                        if (ruleSection.else.length > 1) {
                            isSimple = false;
                        }
                    }

                });

                return isSimple;

            }
        }

    ]);
}(window.angular));
