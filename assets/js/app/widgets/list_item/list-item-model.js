(function() {
    'use strict';

    angular
        .module('app')
        .factory('sl.listItem', ListItemViewModelFactory);

    ListItemViewModelFactory.$inject = ['$rootScope', '$state', '$timeout', '$modal', 'utility.common', 'userContext'];

    function ListItemViewModelFactory($rootScope, $state, $timeout, $modal, common, userContext) {

        function ListItemViewModel() {

            this.itemTitle = null;
            this.itemIcons = [];
            this.itemIcon = null;
            this.tagIcons = [];
            this.itemId = null;
            this.itemDetails = null;
            this.hasItemDetails = false;
            this.itemDetailsBoxActive = false;
            this.clickHandler = false;
            this.itemIsDeleted = false;
            this.createdOn = false;
            this.info = false;
            this.tag = false;
            this.useTitleLetterAsIcon = false;
            this.groundId = null;
            this.groundName = null;
            this.showSubscribeIndicator = false;
            this.clickable = true;
        }

        ListItemViewModel.prototype.toggleItemDetailsBox = function() {
            this.itemDetailsBoxActive = !this.itemDetailsBoxActive;
        };

        ListItemViewModel.prototype.setDeleted = function() {
            this.itemIsDeleted = true;
        };

        ListItemViewModel.fromDevice = function(deviceModel) {
            var viewModel = new ListItemViewModel();

            viewModel.device = deviceModel;

            viewModel.showDeviceStatus = true;

            viewModel.itemTitle = deviceModel.getTitle();
            viewModel.itemIcon = deviceModel.getIcon();
            viewModel.itemDetails = deviceModel.description;
            viewModel.hasItemDetails = deviceModel.description ? true : false;
            viewModel.itemId = deviceModel.id;
            viewModel.itemIsDeleted = deviceModel._deleted;
            viewModel.createdOn = deviceModel.createdOn;
            viewModel.groundId = deviceModel.groundId;

            if (deviceModel.ground) {
                viewModel.groundTitle = deviceModel.ground.title;
            }

            if (deviceModel.hasOwnProperty('rulesMeta')) {
                viewModel.notificationsActive = deviceModel.rulesMeta.hasNotificationRules;
                viewModel.attachedRules = deviceModel.rulesMeta.hasRules;

                $rootScope.$on('isUserSubscribedOnRule', function(event, data) {
                    if (viewModel.itemId === data.deviceId) {
                        viewModel.notificationsActive = data.isCurrentUserSubscribed;
                    }
                });
            }

            viewModel.info = {
                multipleIcons: false,
                isNew: deviceModel.$isNew
            };

            if (viewModel.info.isNew === true) {
                $timeout(function() {
                    viewModel.info.isNew = false;
                }, 2000);
            }

            viewModel.clickHandler = function() {
                if (viewModel.itemIsDeleted) {
                    return;
                }

                $state.go('main.device', {
                    id: viewModel.itemId
                });
            };

            if (viewModel.attachedRules === true) {
                viewModel.tagIcons.push({
                    class: 'sl-pen-outline clickable',
                    title: 'View rules associated to this device',
                    clickHandler: function() {
                        var modalInstance = $modal.open({
                            templateUrl: '/assets/js/app/modals/rules_attached/view.html',
                            controller: 'modals.rulesAttached',
                            controllerAs: 'vm',
                            resolve: {
                                device: function() {
                                    return deviceModel;
                                }
                            }
                        });
                    }
                });
            }

            return viewModel;
        };

        ListItemViewModel.fromMember = function(memberModel) {
            var viewModel = new ListItemViewModel();

            viewModel.itemTitle = memberModel.username;
            viewModel.itemId = memberModel.id;
            viewModel.useTitleLetterAsIcon = true;
            viewModel.isGroundOwner = memberModel.isGroundOwner;
            viewModel.clickable = false;

            viewModel.info = {
                multipleIcons: false
            };

            if (viewModel.isGroundOwner) {
                viewModel.tagIcons.push({
                    class: 'sl-face',
                    title: 'Owner of this ground'
                });
            }

            return viewModel;
        };

        ListItemViewModel.fromGround = function(ground) {

            var viewModel = new ListItemViewModel();

            viewModel.itemTitle = ground.title;
            viewModel.itemDetails = ground.description;
            viewModel.hasItemDetails = ground.description ? true : false;
            viewModel.itemId = ground.id;
            viewModel.itemIcon = '';
            viewModel.itemIsDeleted = ground._deleted;
            viewModel.createdOn = ground.createdOn;

            if (ground.visibility == 'personal') {
                viewModel.useTitleLetterAsIcon = true;
                viewModel.titleLetterIconClass = 'ground-personal';
            } else {
                viewModel.useTitleLetterAsIcon = true;
                viewModel.titleLetterIconClass = ground.color;
            }

            viewModel.showSubscribeIndicator = true;
            viewModel.memberCount = ground.memberCount;
            viewModel.deviceCount = ground.deviceCount;
            viewModel.gatewayCount = ground.gatewayCount;

            var userId = userContext.user.id;

            viewModel.info = {
                multipleIcons: false,
                isNew: ground.$isNew
            };

            if (ground.ownerId === userId) {
                viewModel.tagIcons.push({
                    class: 'sl-face',
                    title: 'You are owner of this ground'
                });
            }

            if (viewModel.gatewayCount > 0) {
                viewModel.tagIcons.push({
                    class: 'sl-gateway-fill clickable',
                    title: viewModel.gatewayCount + ((viewModel.gatewayCount === 1) ? ' gateway ' : ' gateways ') + 'in this ground',
                    count: viewModel.gatewayCount,
                    clickHandler: function() {
                        $state.go('main.groundGateways', {
                            id: viewModel.itemId
                        });
                    }
                });
            }

            if (viewModel.deviceCount >= 0) {
                viewModel.tagIcons.push({
                    class: 'sl-devices-fill clickable',
                    title: viewModel.deviceCount + ((viewModel.deviceCount === 1) ? ' device ' : ' devices ') + 'in this ground',
                    count: viewModel.deviceCount,
                    clickHandler: function() {
                        $state.go('main.groundDevices', {
                            id: viewModel.itemId
                        });
                    }
                });
            }

            if (viewModel.memberCount >= 0) {
                viewModel.tagIcons.push({
                    class: 'sl-members-fill clickable',
                    title: viewModel.memberCount + ((viewModel.memberCount === 1) ? ' member ' : ' members ') + 'contributing this ground',
                    count: viewModel.memberCount,
                    clickHandler: function() {
                        $state.go('main.groundMembers', {
                            id: viewModel.itemId
                        });
                    }
                });
            }

            if (viewModel.info.isNew === true) {
                $timeout(function() {
                    viewModel.info.isNew = false;
                }, 2000);
            }

            viewModel.clickHandler = function() {

                if (viewModel.itemIsDeleted) {
                    return;
                }

                $state.go('main.ground', {
                    id: viewModel.itemId
                });
            };

            return viewModel;
        };

        ListItemViewModel.fromGateway = function(gatewayModel) {
            var viewModel = new ListItemViewModel();

            viewModel.itemTitle = gatewayModel.getTitle();
            viewModel.itemIcon = gatewayModel.getIcon();
            viewModel.itemDetails = gatewayModel.description;
            viewModel.hasItemDetails = gatewayModel.description ? true : false;
            viewModel.itemId = gatewayModel.id;
            viewModel.itemIsDeleted = gatewayModel._deleted;
            viewModel.createdOn = gatewayModel.createdOn;
            viewModel.groundId = gatewayModel.groundId;

            if (gatewayModel.ground) {
                viewModel.groundTitle = gatewayModel.ground.title;
            }

            viewModel.info = {
                multipleIcons: false,
                isNew: gatewayModel.$isNew
            };

            if (viewModel.info.isNew === true) {
                $timeout(function() {
                    viewModel.info.isNew = false;
                }, 2000);
            }

            viewModel.clickHandler = function() {

                if (viewModel.itemIsDeleted) {
                    return;
                }

                $state.go('main.gateway', {
                    id: viewModel.itemId
                });
            };

            return viewModel;
        };

        ListItemViewModel.fromRule = function(ruleModel, ruleDefinition) {

            var viewModel = new ListItemViewModel();
            viewModel.itemTitle = ruleModel.name;
            viewModel.itemId = ruleModel.id;

            viewModel.itemIcons.push({
                icon: getIcon(ruleModel, 'when'),
                arrow: true
            });

            viewModel.itemIcons.push({
                icon: getIcon(ruleModel, 'then'),
                arrow: elseExists(ruleDefinition)
            });

            viewModel.itemIcons.push({
                icon: getIcon(ruleModel, 'else')
            });

            viewModel.info = {
                multipleIcons: true,
                actionAvailible: true
            };

            viewModel.tag = getTagInfo(ruleModel.status);

            $rootScope.$on('rootScope:rule:statusChanged', function(event, data) {
                if (viewModel.itemId === data.id) {
                    viewModel.tag = getTagInfo(data.status);
                }
            });

            viewModel.clickHandler = function() {
                var modalInstance = $modal.open({
                    templateUrl: '/assets/js/app/modals/rule_options/view.html',
                    controller: 'modals.rule.Options',
                    controllerAs: 'vm',
                    resolve: {
                        rule: function() {
                            return ruleModel;
                        }
                    }
                });
            };

            function getIcon(ruleModel, section) {
                var targetedSection = null;

                if (section === 'when') {
                    targetedSection = getSection(section, 0, ruleDefinition);
                    if (targetedSection) {
                        if (targetedSection.left && targetedSection.left.device) {
                            return 'sl-device-custom';
                        } else {
                            if (targetedSection.device) {
                                return 'sl-device-custom';
                            }

                            return 'sl-service-calendar';
                        }
                    }
                } else if (section === 'then') {
                    targetedSection = getSection(section, 1, ruleDefinition);
                    if (targetedSection) {
                        if (targetedSection.left && targetedSection.left.device) {
                            return 'sl-device-custom';
                        } else {
                            if (targetedSection.device) {
                                return 'sl-device-custom';
                            }

                            return 'sl-service-email';
                        }
                    }
                } else if (section === 'else') {
                    if (elseExists(ruleDefinition)) {
                        targetedSection = getSection(section, 2, ruleDefinition);
                        if (targetedSection) {
                            if (targetedSection.left && targetedSection.left.device) {
                                return 'sl-device-custom';
                            } else {
                                if (targetedSection.device) {
                                    return 'sl-device-custom';
                                }

                                return 'sl-service-email';
                            }
                        }
                    }
                }
            }

            function getSection(sectionName, index, rule) {
                var sectionContainer = rule.definition[index][sectionName];
                if (!sectionContainer) {
                    sectionContainer = rule.definition[index][common.toPascalCase(sectionName)];
                }

                if (!sectionContainer) {
                    return null;
                }

                return sectionContainer[0];
            }

            function elseExists(rule) {
                var isElseInRule = rule.definition[2];

                if (isElseInRule) {
                    return true;
                }
            }

            function getTagInfo(ruleStatus) {
                switch (ruleStatus) {
                    case 0:
                        return {
                            tagClass: 'tag-light-gray',
                            tagText: 'undefined'
                        };
                    case 1:
                        return {
                            tagClass: 'tag-green',
                            tagText: 'running'
                        };
                    case 2:
                        return {
                            tagClass: 'tag-yellow',
                            tagText: 'idle'
                        };
                    case 3:
                        return {
                            tagClass: 'tag-red',
                            tagText: 'compilation error'
                        };
                    case 4:
                        return {
                            tagClass: 'tag-red',
                            tagText: 'missing assets'
                        };

                }
            }

            return viewModel;
        };

        return ListItemViewModel;

    }
})();
