(function() {
    'use strict';

    angular
        .module('app')
        .factory('AssetViewModel', factory);

    factory.$inject = [
        'utils',
        'device.repository',
        'asset.repository',
        'ground.repository',
        'gateway.repository',
        'HeaderItemModel',
        'api.controlsService',
        'roles.manager'
    ];

    function factory(utils, deviceRepository, assetRepository, groundRepository, gatewayRepository, HeaderItemModel, ctrlsService, rolesManager) {

        function AssetViewModel(asset, parent, origin, controls, ground) {

            this.configOpen = false;

            if (ground) {

                this.groundId = ground.id;

                this.ground = ground;

            }

            this.drawerActiveTab = 0;
            this.editorOptions = utils.viewConfigs.getJsonEditorOptions();

            //Temporary solution to show JSON editors in read-only mode.
            //Each editor (State, Command, Profile) should have it's own editor configuration
            //because it will be possible users not to have permission to update asset state, but
            //do have permission to change profile.
            this.editorOptions.readOnly = rolesManager.authorize('device-asset-state') ? false : 'nocursor';
            this.editorRefresh = null;
            this.publishCommandJson = null;
            this.publishFeedJson = null;
            this.jsonEditorRefresh = null;

            var that = this;
            asset.on('state', function(stateData) {
                that.headerModel.replaceInfo('state', stateData.Value);
            });

            this.init(asset, parent, origin, controls);
        }

        AssetViewModel.prototype.init = function(asset, parent, origin, controls) {

            this.asset = asset;

            this.newAssetTitle = asset.title;

            this.profileJson = JSON.stringify(asset.profile, null, this.editorOptions.tabSize);

            this.controlJson = JSON.stringify(asset.control, null, this.editorOptions.tabSize);

            this.headerModel = HeaderItemModel.fromAsset(asset, parent, origin, this.ground);

            this.controls = controls;

            if (this.asset.control && this.asset.control.name) {

                this.controlName = this.asset.control.name;

            }

            this.control = this.getControlLabel();

            this.parent = parent;

            this.origin = origin;

        };

        AssetViewModel.prototype.toggleConfig = function() {

            var that = this;

            that.configOpen = !that.configOpen;

            if (that.configOpen) {

                utils.$timeout(function() {

                    that.editorRefresh = Math.random().toString();

                });

            } else {

                that.editorRefresh = false;

            }
        };

        AssetViewModel.prototype.isConfigOpen = function() {

            return this.configOpen;

        };

        AssetViewModel.prototype.getControlLabel = function() {

            var lbl = 'Select control...';

            if (this.asset.control && this.asset.control.name) {

                for (var i = 0; i < this.controls.length; i++) {

                    if (this.controls[i].name == this.asset.control.name) {

                        lbl = this.controls[i].title;

                    }
                }
            }

            return lbl;
        };

        AssetViewModel.prototype.publishFeed = function() {

            var that = this;

            return utils.tryParseJSON(that.publishFeedJson)
                .then(parseSuccessHandler, parseFailHandler);

            function parseSuccessHandler(obj) {

                return assetRepository.publishState(that.asset.id, obj)
                    .then(function() {

                        utils.notify.success('Success: ', 'Asset feed has been published.');

                        return true;

                    }).catch(function() {

                        return false;

                    });
            }

            function parseFailHandler() {

                utils.notify.error('JSON: ', 'JSON not valid.');

                return false;

            }
        };

        AssetViewModel.prototype.publishCommand = function() {

            var that = this;

            return utils.tryParseJSON(that.publishCommandJson)
                .then(parseSuccessHandler, parseFailHandler);

            function parseSuccessHandler(obj) {
                return assetRepository.publishCommand(that.asset.id, obj)
                    .then(function() {

                        return true;

                    })
                    .catch(function(error) {

                        return false;

                    });
            }

            function parseFailHandler() {

                utils.notify.error('JSON: ', 'JSON not valid.');

                return false;

            }
        };

        AssetViewModel.prototype.replaceProfile = function() {

            var that = this;

            return utils.tryParseJSON(that.profileJson)
                .then(parseSuccessHandler, parseFailHandler);

            function parseSuccessHandler(obj) {

                return assetRepository.replaceProfile(that.asset.deviceId, that.asset.name, obj)
                    .then(function() {

                        utils.notify.success('Success: ', 'Asset profile has been replaced.');

                        assetRepository.find(that.asset.id).then(function(asset) {

                            return asset;

                        }).then(function(asset) {

                            ctrlsService.getControlsForAsset(that.asset.id)
                                .then(function(controls) {

                                    that.init(asset, that.parent, that.origin, controls);

                                });
                        });

                        return true;
                    })
                    .catch(function(error) {

                        return false;

                    });
            }

            function parseFailHandler() {

                utils.notify.error('JSON: ', 'JSON not valid.');

                return false;

            }
        };

        AssetViewModel.prototype.replaceControl = function() {

            var that = this;

            return utils.tryParseJSON(that.controlJson)
                .then(parseSuccessHandler, parseFailHandler);

            function parseSuccessHandler(obj) {
                return assetRepository.replaceControl(that.asset.deviceId, that.asset.name, obj)
                    .then(function() {

                        utils.notify.success('Success: ', 'Asset control has been replaced.');

                        assetRepository.find(that.asset.id).then(function(asset) {

                            that.init(asset, that.parent, that.origin, that.controls);

                        });

                        return true;
                    })
                    .catch(function(error) {

                        return false;

                    });
            }

            function parseFailHandler() {

                utils.notify.error('JSON: ', 'JSON not valid.');

                return false;

            }
        };

        AssetViewModel.prototype.delete = function() {

            return assetRepository.remove(this.asset.deviceId, this.asset.name).then(function() {

                utils.notify.success('Success: ', 'Asset is deleted.');

            });
        };

        AssetViewModel.prototype.update = function() {

            var that = this;

            return assetRepository.update(that.asset.deviceId, that.asset.id, that.asset.name, that.asset.is, that.newAssetTitle)
                .then(function(a) {

                    that.asset.title = a.title;

                    utils.notify.success('Success: ', 'Asset is updated');

                    that.headerModel.update(that.asset.title);

                });
        };

        AssetViewModel.prototype.setControl = function(item) {

            var that = this;

            var assetControl = that.asset.control;

            if (!assetControl) {

                assetControl = {};

            }

            assetControl.name = item.name;

            return assetRepository.replaceControl(that.asset.deviceId, that.asset.name, assetControl)
                .then(function() {

                    that.init(that.asset, that.parent, that.origin, that.controls);

                    return true;

                })
                .catch(function(error) {

                    return false;

                });
        };

        AssetViewModel.prototype.refreshEditors = function() {

            var that = this;

            that.editorRefresh = false;

            utils.$timeout(function() {

                that.editorRefresh = Math.random().toString();

            }, 100);

        };

        AssetViewModel.resolve = function(assetId) {

            var foundAsset = null;
            var foundParent = null;
            var foundControls = null;
            var foundOrigin = null;
            var foundGround = null;

            return getAsset(assetId)
                .then(getParent)
                .then(getGround)
                .then(getControls)
                .then(function() {
                    return new AssetViewModel(foundAsset, foundParent, foundOrigin, foundControls, foundGround);
                });

            function getAsset(assetId) {

                return assetRepository.find(assetId)
                    .then(function(asset) {

                        foundAsset = asset;

                    });
            }

            function getParent() {

                return findDevice(foundAsset.deviceId)
                    .then(null, findGateway);

                function findDevice(deviceId) {

                    return deviceRepository.find(foundAsset.deviceId)
                        .then(function(device) {

                            if (device) {

                                foundOrigin = 'Device';

                                foundParent = device;

                            }

                            return device;
                        });
                }

                function findGateway(reject) {

                    return gatewayRepository.find(foundAsset.deviceId)
                        .then(function(gateway) {

                            if (gateway) {

                                foundOrigin = 'Gateway';

                                foundParent = gateway;

                            }

                            return gateway;
                        });
                }

            }

            function getControls() {

                return ctrlsService.getControlsForAsset(foundAsset.id)
                    .then(function(controls) {

                        foundControls = controls;

                    });
            }

            function getGround(device) {

                if (device.groundId) {

                    return groundRepository.find(device.groundId)
                        .then(function(ground) {

                            foundGround = ground;

                            return ground;

                        });

                }

                return utils.$q.when();

            }
        };

        return AssetViewModel;
    }
})();
