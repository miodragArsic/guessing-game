(function(ng) {
    ng
        .module('app')
        .factory('utility.common', utilityCommon);

    utilityCommon.$inject = ['$rootScope', '$timeout', '$filter', 'service.dayTime'];

    function utilityCommon($rootScope, $timeout, $filter, dayTime) {

        var service = {
            tryParseJSON: tryParseJSON,
            markNew: markNew,
            markNewDevices: markNewDevices,
            findDevice: findDevice,
            findAsset: findAsset,
            mapRuleSectionDefinitionToViewModel: mapRuleSection,
            createRuleSectionViewModel: createRuleSectionViewModel,
            resetRuleSectionViewModel: resetRuleSectionViewModel,
            toPascalCase: toPascalCase,
            limitStringLength: limitStringLength,
            mapRulePreviewToViewModel: mapRulePreview
        };

        return service;

        ////////////////////////////

        function tryParseJSON(str, successHandler, failHandler) {
            var obj;
            try {

                obj = JSON.parse(str);
                if (successHandler) {
                    successHandler(obj);
                }

            } catch (e) {

                if (failHandler) {
                    failHandler();
                }
            }

            return obj;
        }

        function limitStringLength(stringToLimit, sizeToLimit) {

            if (stringToLimit != null || stringToLimit != undefined) {

                if (stringToLimit.length > sizeToLimit) {
                    return stringToLimit.slice(0, sizeToLimit) + '...';
                } else {
                    return stringToLimit;
                }
            }
        }

        function markNewDevices(a, b) {
            var aIds = {};

            ng.forEach(a, function(obj) {
                aIds[obj.id] = obj;
            });

            ng.forEach(b, function(obj) {
                if (!aIds.hasOwnProperty(obj.id)) {
                    obj.$isNew = true;
                    $timeout(function() {
                        $rootScope.$apply(function() {
                            obj.$isNew = false;
                        });
                    }, 2000);
                }
            });
        }

        function markNew(a, b) {
            var aIds = {};

            ng.forEach(a, function(obj) {
                aIds[obj.id] = obj;
            });

            ng.forEach(b, function(obj) {
                if (!aIds.hasOwnProperty(obj.id)) {
                    obj.$isNew = true;
                    $timeout(function() {
                        $rootScope.$apply(function() {
                            obj.$isNew = false;
                        });
                    }, 2000);
                }
            });
        }

        function findDevice(devices, deviceId) {
            var found = $filter('filter')(devices, {
                id: deviceId
            }, true);

            if (found.length) {
                return found[0];
            }

            return null;
        }

        function findAsset(devices, deviceId, assetId) {
            var device = findDevice(devices, deviceId);

            if (device) {
                var foundAssets = $filter('filter')(device.assets, {
                    id: assetId
                }, true);

                if (foundAssets.length) {
                    return foundAssets[0];
                }
            }

            return null;
        }

        function findService(services, serviceId) {
            var found = $filter('filter')(services, {
                id: serviceId
            }, true);

            if (found.length) {
                return found[0];
            }

            return null;
        }

        function toPascalCase(s) {
            return s.replace(/\w+/g,
                function(w) {
                    return w[0].toUpperCase() + w.slice(1).toLowerCase();
                });
        }

        function isProfileNumeric(profileType) {

            if (profileType == 'int' || profileType == 'integer') {
                return true;
            }

            if (profileType == 'double' || profileType == 'float' || profileType == 'decimal' || profileType == 'number') {
                return true;
            }

            return false;
        }

        function isProfileBoolean(profileType) {
            if (profileType == 'bool' || profileType == 'boolean') {
                return true;
            }

            return false;
        }

        function mapRuleSection(ruleDefinition, sectionName, sectionViewModel, devices, services) {

            var defSection = null;

            var dayTimeService = dayTime.dayTime();

            for (var i = 0; i < ruleDefinition.length; i++) {
                if (ruleDefinition[i].hasOwnProperty(sectionName)) {
                    defSection = ruleDefinition[i][sectionName][0];
                } else {

                    var upperCaseSectionName = toPascalCase(sectionName);
                    if (ruleDefinition[i].hasOwnProperty(upperCaseSectionName)) {
                        defSection = ruleDefinition[i][upperCaseSectionName][0];
                    }
                }
            }

            if (!defSection) {
                return false;
            }

            var profile = null;

            if (!defSection.left) { //if there is no 'left' part in section it is assumed the rule is DeviceStateChange rule and that OnEveryChange was selected.

                mapDeviceStatePart(sectionViewModel, defSection, devices);

                sectionViewModel.selectedCompareType = 'onEveryChange';
                sectionViewModel.constantCompareOperation.op = 'OEC';

                if (!sectionViewModel.selectedAsset) {
                    sectionViewModel.missingLeftAsset = true;
                } else {
                    profile = sectionViewModel.selectedAsset.profile;
                }

                return sectionViewModel;
            }

            //Mapping left part
            if (defSection.left.service == 'asset') {

                mapDeviceStatePart(sectionViewModel, defSection.left, devices);

                if (!sectionViewModel.selectedAsset) {
                    sectionViewModel.missingLeftAsset = true;
                } else {
                    profile = sectionViewModel.selectedAsset.profile;
                }

            }

            if (defSection.left.service == 'dayTime') {
                sectionViewModel.deviceOrServiceChoice = 'service';

                if (defSection.left.sensor) {
                    sectionViewModel.selectedService = dayTimeService[0];
                }

                profile = sectionViewModel.selectedService.profile;

            }

            if (defSection.left.service == 'notify') {
                sectionViewModel.deviceOrServiceChoice = 'service';

                if (defSection.left.actuator) {
                    // sectionViewModel.selectedService = findService(services, defSection.left.actuator);
                    sectionViewModel.selectedService = services[0];
                    sectionViewModel.selectedNotifications.web = getSelectedNotifications(defSection.left.actuator, 'web');
                    sectionViewModel.selectedNotifications.push = getSelectedNotifications(defSection.left.actuator, 'push');
                    sectionViewModel.selectedNotifications.email = getSelectedNotifications(defSection.left.actuator, 'email');
                    sectionViewModel.serviceActuatorValue = defSection.left.actuator;
                }

                if (defSection.left.sensor) {
                    // sectionViewModel.selectedService = findService(services, defSection.left.sensor);
                    sectionViewModel.selectedService = services[0];
                    sectionViewModel.selectedNotifications.web = getSelectedNotifications(defSection.left.actuator, 'web');
                    sectionViewModel.selectedNotifications.push = getSelectedNotifications(defSection.left.actuator, 'push');
                    sectionViewModel.selectedNotifications.email = getSelectedNotifications(defSection.left.actuator, 'email');
                    sectionViewModel.serviceActuatorValue = defSection.left.actuator;
                }

                // profile = sectionViewModel.selectedService.profile;
            }

            //Mapping right part
            if (!defSection.right.hasOwnProperty('service')) {
                sectionViewModel.selectedCompareType = 'constant';
                sectionViewModel.constantCompareOperation.op = defSection.op;

                if (profile && profile.type == 'date') {
                    sectionViewModel.constantCompareOperation.value = new Date(defSection.right);
                } else if (profile && isProfileNumeric(profile.type)) {
                    sectionViewModel.constantCompareOperation.value = Number(defSection.right);
                } else if (profile && isProfileBoolean(profile.type)) {

                    if (typeof defSection.right == 'boolean') {
                        sectionViewModel.constantCompareOperation.value = defSection.right.toString();
                    } else {
                        sectionViewModel.constantCompareOperation.value = defSection.right;
                    }
                } else if (defSection.left.service == 'dayTime') {
                    sectionViewModel.constantCompareOperation.value = dayTime.utcCronToLocalTime(defSection.right);
                } else {
                    sectionViewModel.constantCompareOperation.value = defSection.right;
                }

            } else {

                sectionViewModel.selectedCompareType = 'reference';
                sectionViewModel.referenceCompareOperation.op = defSection.op;

                if (defSection.right.service == 'asset') {

                    sectionViewModel.referenceCompareOperation.device = findDevice(devices, defSection.right.device);

                    if (!sectionViewModel.referenceCompareOperation.device) {
                        sectionViewModel.missingRightDevice = true;
                    }

                    if (defSection.right.actuator) {
                        sectionViewModel.referenceCompareOperation.asset = findAsset(devices, defSection.right.device, defSection.right.actuator);
                    }

                    if (defSection.right.sensor) {
                        sectionViewModel.referenceCompareOperation.asset = findAsset(devices, defSection.right.device, defSection.right.sensor);
                    }

                    if (!sectionViewModel.referenceCompareOperation.asset) {
                        sectionViewModel.missingRightAsset = true;
                    }
                }

                if (defSection.right.service == 'notify') {

                    if (defSection.right.actuator) {
                        // sectionViewModel.referenceCompareOperation.service = findService(services, defSection.right.actuator);
                        sectionViewModel.referenceCompareOperation.service = services[0];
                    }

                    if (defSection.right.sensor) {
                        // sectionViewModel.referenceCompareOperation.service = findService(services, defSection.right.sensor);
                        sectionViewModel.referenceCompareOperation.service = services[0];
                    }
                }
            }

            return true;
        }

        function getSelectedNotifications(actuator, notificationType) {
            var notifications = actuator.split('/')[2].split(',');
            var isNotificationSelected = false;

            for (var i = 0; i < notifications.length; i++) {
                if (notifications[i] === notificationType) {
                    isNotificationSelected = true;
                }
            }

            return isNotificationSelected;
        }

        function mapDeviceStatePart(sectionViewModel, deviceStateConfig, devices) {

            sectionViewModel.selectedDevice = findDevice(devices, deviceStateConfig.device);
            sectionViewModel.deviceOrServiceChoice = 'device';

            if (!sectionViewModel.selectedDevice) {
                sectionViewModel.missingLeftDevice = true;
            }

            if (deviceStateConfig.actuator) {
                sectionViewModel.selectedAsset = findAsset(devices, deviceStateConfig.device, deviceStateConfig.actuator);
            }

            if (deviceStateConfig.sensor) {
                sectionViewModel.selectedAsset = findAsset(devices, deviceStateConfig.device, deviceStateConfig.sensor);
            }
        }

        function createRuleSectionViewModel(operator) {
            var sectionViewModel = {
                deviceOrServiceChoice: null,
                selectedDevice: null,
                selectedService: null,
                selectedNotifications: {
                    web: true,
                    push: false,
                    email: false
                },
                selectedCompareType: null,
                selectedAsset: null,
                constantCompareOperation: {
                    op: operator ? operator : null,
                    value: null
                },
                referenceCompareOperation: {
                    op: operator ? operator : null,
                    device: null,
                    service: null,
                    asset: null
                },
                sectionOperand: null,
                serviceActuatorValue: null
            };

            return sectionViewModel;
        }

        function mapRulePreview(ruleDefinition, sectionName, wholeSectionViewModel, devices, services) {

            var defSection = null;

            var result = null;

            var dayTimeService = dayTime.dayTime();

            for (var i = 0; i < ruleDefinition.length; i++) {
                if (ruleDefinition[i].hasOwnProperty(sectionName)) {
                    for (var j = 0; j < ruleDefinition[i][sectionName].length; j++) {
                        if (sectionName === 'when') {
                            wholeSectionViewModel.push(createRuleSectionViewModel());
                        } else {
                            wholeSectionViewModel.push(createRuleSectionViewModel('='));
                        }

                        defSection = ruleDefinition[i][sectionName][j];
                        result = mapSingleSection(defSection, sectionName, wholeSectionViewModel[j], devices, services, dayTimeService);
                    }
                } else {

                    var upperCaseSectionName = toPascalCase(sectionName);
                    if (ruleDefinition[i].hasOwnProperty(upperCaseSectionName)) {

                        for (var j = 0; j < ruleDefinition[i][sectionName].length; j++) {
                            if (sectionName === 'when') {
                                wholeSectionViewModel.push(createRuleSectionViewModel());
                            } else {
                                wholeSectionViewModel.push(createRuleSectionViewModel('='));
                            }

                            defSection = ruleDefinition[i][upperCaseSectionName][j];
                            result = mapSingleSection(defSection, sectionName, wholeSectionViewModel[j], devices, services, dayTimeService);
                        }

                        // defSection = ruleDefinition[i][upperCaseSectionName][0];
                    }
                }
            }

            return result;
        }

        function mapSingleSection(defSection, sectionName, sectionViewModel, devices, services, dayTimeService) {
            if (!defSection) {
                return false;
            }

            if (defSection.hasOwnProperty('and')) {
                defSection = defSection.and;
                sectionViewModel.sectionOperand = 'and';
            }

            if (defSection.hasOwnProperty('or')) {
                defSection = defSection.or;
                sectionViewModel.sectionOperand = 'or';
            }

            var profile = null;

            if (!defSection.left) { //if there is no 'left' part in section it is assumed the rule is DeviceStateChange rule and that OnEveryChange was selected.

                mapDeviceStatePart(sectionViewModel, defSection, devices);

                sectionViewModel.selectedCompareType = 'constant';
                sectionViewModel.constantCompareOperation.op = 'OEC';

                if (!sectionViewModel.selectedAsset) {
                    sectionViewModel.missingLeftAsset = true;
                } else {
                    profile = sectionViewModel.selectedAsset.profile;
                }

                return sectionViewModel;
            }

            //Mapping left part
            if (defSection.left.service == 'asset') {

                mapDeviceStatePart(sectionViewModel, defSection.left, devices);

                if (!sectionViewModel.selectedAsset) {
                    sectionViewModel.missingLeftAsset = true;
                } else {
                    profile = sectionViewModel.selectedAsset.profile;
                }

            }

            if (defSection.left.service == 'dayTime') {
                sectionViewModel.deviceOrServiceChoice = 'service';

                if (defSection.left.sensor) {
                    sectionViewModel.selectedService = dayTimeService[0];
                }

                profile = sectionViewModel.selectedService.profile;

            }

            if (defSection.left.service == 'notify') {
                sectionViewModel.deviceOrServiceChoice = 'service';

                if (defSection.left.actuator) {
                    // sectionViewModel.selectedService = findService(services, defSection.left.actuator);
                    sectionViewModel.selectedService = services[0];
                }

                if (defSection.left.sensor) {
                    // sectionViewModel.selectedService = findService(services, defSection.left.sensor);
                    sectionViewModel.selectedService = services[0];
                }

                // profile = sectionViewModel.selectedService.profile;
            }

            //Mapping right part
            if (!defSection.right.hasOwnProperty('service')) {
                sectionViewModel.selectedCompareType = 'constant';
                sectionViewModel.constantCompareOperation.op = defSection.op;

                if (profile && profile.type == 'date') {
                    sectionViewModel.constantCompareOperation.value = new Date(defSection.right);
                } else if (profile && isProfileNumeric(profile.type)) {
                    sectionViewModel.constantCompareOperation.value = Number(defSection.right);
                } else if (profile && isProfileBoolean(profile.type)) {

                    if (typeof defSection.right == 'boolean') {
                        sectionViewModel.constantCompareOperation.value = defSection.right.toString();
                    } else {
                        sectionViewModel.constantCompareOperation.value = defSection.right;
                    }
                } else if (defSection.left.service == 'dayTime') {
                    sectionViewModel.constantCompareOperation.value = dayTime.utcCronToLocalTime(defSection.right);
                } else {
                    sectionViewModel.constantCompareOperation.value = defSection.right;
                }

            } else {

                sectionViewModel.selectedCompareType = 'reference';
                sectionViewModel.referenceCompareOperation.op = defSection.op;

                if (defSection.right.service == 'asset') {

                    sectionViewModel.referenceCompareOperation.device = findDevice(devices, defSection.right.device);

                    if (!sectionViewModel.referenceCompareOperation.device) {
                        sectionViewModel.missingRightDevice = true;
                    }

                    if (defSection.right.actuator) {
                        sectionViewModel.referenceCompareOperation.asset = findAsset(devices, defSection.right.device, defSection.right.actuator);
                    }

                    if (defSection.right.sensor) {
                        sectionViewModel.referenceCompareOperation.asset = findAsset(devices, defSection.right.device, defSection.right.sensor);
                    }

                    if (!sectionViewModel.referenceCompareOperation.asset) {
                        sectionViewModel.missingRightAsset = true;
                    }
                }

                if (defSection.right.service == 'notify') {

                    if (defSection.right.actuator) {
                        // sectionViewModel.referenceCompareOperation.service = findService(services, defSection.right.actuator);
                        sectionViewModel.referenceCompareOperation.service = services[0];
                    }

                    if (defSection.right.sensor) {
                        // sectionViewModel.referenceCompareOperation.service = findService(services, defSection.right.sensor);
                        sectionViewModel.referenceCompareOperation.service = services[0];
                    }
                }
            }

            return true;

        }

        function resetRuleSectionViewModel(viewModel) {
            viewModel.deviceOrServiceChoice = null;
            viewModel.selectedDevice = null;
            viewModel.selectedService = null;
            viewModel.selectedNotifications.web = null;
            viewModel.selectedNotifications.push = null;
            viewModel.selectedNotifications.email = null;
            viewModel.selectedCompareType = null;
            viewModel.selectedAsset = null;
            viewModel.constantCompareOperation.op = null;
            viewModel.constantCompareOperation.value = null;
            viewModel.referenceCompareOperation.op = null;
            viewModel.referenceCompareOperation.device = null;
            viewModel.referenceCompareOperation.asset = null;
            viewModel.referenceCompareOperation.service = null;
            viewModel.sectionOperand = null;
            viewModel.serviceActuatorValue = null;

        }

    }
}(window.angular));
