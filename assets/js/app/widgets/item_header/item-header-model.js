(function() {
    'use strict';

    angular
        .module('app')
        .factory('HeaderItemModel', HeaderItemModelFactory);

    HeaderItemModelFactory.$inject = ['$state', '$modal', 'userContext', 'pinRepository'];

    function HeaderItemModelFactory($state, $modal, userContext, pinRepository) {

        function HeaderItemModel() {

            this.showDetails = false;
            this.icon = null;
            this.tagIcons = [];
            this.titleLetterIconClass = null;
            this.useTitleLetterAsIcon = false;
            this.id = null;
            this.title = null;
            this.hasDetails = false;
            this.details = null;
            this.detailsActive = false;
            this.tags = [];
            this.info = [];
            this.boxActions = [];
            this.visibility = null;
            this.showSubscribeIndicator = false;

        }

        HeaderItemModel.prototype.update = function(title, details) {

            this.details = details;
            this.title = title;

            if (this.details) {
                this.hasDetails = true;
            } else {
                this.hasDetails = false;
            }
        };

        HeaderItemModel.prototype.toggleDetails = function() {

            this.detailsActive = !this.detailsActive;

        };

        HeaderItemModel.prototype.replaceInfo = function(key, value) {

            for (var i = 0; i < this.info.length; i++) {

                if (this.info[i].name === key) {

                    this.info[i].value = value;

                }

            }
        };

        HeaderItemModel.fromDevice = function(device) {

            var model = new HeaderItemModel();

            model.title = device.getTitle();

            model.id = device.id;

            model.device = device;

            if (device.ground) {

                model.visibility = device.ground.visibility;

            }

            if (device.type !== 'quick-demo') {
                model.showSetup = true;
                model.showStatus = true;
            } else {
                model.showSetup = true;
                model.showStatus = true;
            }

            model.backText = 'Back to Devices';
            model.stateControlIdentifier = 'device-details';

            model.backRoute = {
                name: model.visibility === 'personal' ? 'main.devices' : 'main.groundDevices',
                data: {
                    id: device.groundId
                }
            };

            model.icon = device.getIcon();
            model.hasDetails = device.description ? true : false;
            model.details = device.description;
            model.notificationsActive = device.hasNotificationRules;
            model.attachedRules = device.hasRules;

            if (model.attachedRules === true) {

                model.tagIcons.push({
                    class: 'sl-pen-outline clickable',
                    title: 'Click to view rules associated to this device',
                    clickHandler: function() {
                        var modalInstance = $modal.open({
                            templateUrl: '/assets/js/app/modals/rules_attached/view.html',
                            controller: 'modals.rulesAttached',
                            controllerAs: 'vm',
                            resolve: {
                                device: function() {
                                    return device;
                                }
                            }
                        });
                    }
                });

            }

            return model;
        };

        HeaderItemModel.fromGround = function(ground) {

            var model = new HeaderItemModel();
            model.title = ground.title;
            model.id = ground.id;
            model.backText = 'Back to Grounds';
            model.backRoute = {
                name: 'main.environment'
            };

            model.useTitleLetterAsIcon = true;
            model.titleLetterIconClass = ground.color;

            model.hasDetails = ground.description ? true : false;
            model.details = ground.description;
            model.showSubscribeIndicator = true;
            model.memberCount = ground.memberCount;
            model.deviceCount = ground.deviceCount;
            model.gatewayCount = ground.gatewayCount;

            if (model.hasDetails) {
                model.detailsActive = true;
            }

            model.showSetup = false;
            model.showStatus = false;

            var userId = userContext.user.id;

            if (ground.ownerId === userId) {
                model.tagIcons.push({
                    class: 'sl-face',
                    title: 'You are owner of this ground'
                });
            }

            if (model.gatewayCount > 0) {
                model.tagIcons.push({
                    class: 'sl-gateway-fill clickable',
                    title: model.gatewayCount + ((model.gatewayCount === 1) ? ' gateway ' : ' gateways ') + 'in this ground',
                    count: model.gatewayCount,
                    clickHandler: function() {
                        $state.go('main.groundGateways', {
                            id: model.id
                        });
                    }
                });
            }

            if (model.deviceCount >= 0) {
                model.tagIcons.push({
                    class: 'sl-devices-fill clickable',
                    title: model.deviceCount + ((model.deviceCount === 1) ? ' device ' : ' devices ') + 'in this ground',
                    count: model.deviceCount,
                    clickHandler: function() {
                        $state.go('main.groundDevices', {
                            id: model.id
                        });
                    }
                });
            }

            if (model.memberCount >= 0) {
                model.tagIcons.push({
                    class: 'sl-members-fill clickable',
                    title: model.memberCount + ((model.memberCount === 1) ? ' member ' : ' members ') + 'contributing this ground',
                    count: model.memberCount,
                    clickHandler: function() {
                        $state.go('main.groundMembers', {
                            id: model.id
                        });
                    }
                });
            }

            return model;
        };

        HeaderItemModel.fromAsset = function(asset, owner, ownerType, ground) {
            var model = new HeaderItemModel();

            model.header = 'asset';
            model.title = asset.title;
            model.id = asset.id;
            model.backText = 'Back to ' + owner.title;
            model.backRoute = {
                name: ownerType === 'Device' ? 'main.device' : 'main.gateway',
                data: {
                    id: owner.id
                }
            };
            model.icon = asset.getIcon();
            model.hasDetails = false;
            model.info.push({
                name: 'state',
                value: asset.state ? asset.state.value : null
            });
            model.tags.push({
                cssClass: 'tag-' + asset.is,
                text: asset.is
            });
            model.tags.push({
                cssClass: 'tag-light-gray',
                text: asset.profile.type
            });

            model.showSetup = false;
            model.showStatus = false;

            if (ground) {

                var isPinned = pinRepository.isPinned(owner.groundId, asset.id);

                var pinToGroundAction = {
                    handler: function() {

                        if (isPinned) {

                            pinRepository.unpin(owner.groundId, asset);
                            pinToGroundAction.title = 'Pin to ' + ground.title + ' board';
                            pinToGroundAction.cssClass = 'grid-box-btn sl-pin-outline secondary-action';
                            isPinned = false;

                        } else {

                            pinRepository.pin(owner.groundId, asset);
                            pinToGroundAction.title = 'Pinned to ' + ground.title + ' board';
                            pinToGroundAction.cssClass = 'grid-box-btn sl-pin secondary-action visible';
                            isPinned = true;
                        }
                    },

                    title: isPinned ? 'Pinned to ' + ground.title + ' board' : 'Pin to ' + ground.title + ' board',
                    cssClass: isPinned ? 'grid-box-btn sl-pin secondary-action visible' : 'grid-box-btn sl-pin-outline secondary-action'
                };

                model.boxActions.push(pinToGroundAction);

            }

            return model;
        };

        HeaderItemModel.fromGateway = function(gateway) {

            var model = new HeaderItemModel();
            model.title = gateway.getTitle();
            model.id = gateway.id;
            model.backText = 'Back to Gateways';
            model.backRoute = {
                name: 'main.groundGateways',
                data: {
                    id: gateway.groundId
                }
            };
            model.icon = gateway.getIcon();
            model.hasDetails = gateway.description ? true : false;
            model.details = gateway.description;
            model.info.push({
                name: 'id',
                value: gateway.id
            });

            if (model.hasDetails) {
                model.detailsActive = true;
            }

            model.showSetup = false;
            model.showStatus = false;

            model.boxActions.push({
                handler: function() {
                    $state.go('main.gateway_devices', {
                        id: gateway.id
                    });
                },

                text: 'view devices',

                cssClass: 'main-button light-btn'
            });

            return model;
        };

        return HeaderItemModel;
    }
})();
