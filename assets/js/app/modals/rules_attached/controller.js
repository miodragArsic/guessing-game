(function(ng) {

    ng.module('app').controller('modals.rulesAttached', RulesAttached);

    RulesAttached.$inject = ['$modalInstance', '$rootScope', 'device', 'api.rulesService', 'session'];

    function RulesAttached($modalInstance, $rootScope, device, rulesService, session) {

        var vm = this;

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $modalInstance.dismiss();
        });

        vm.deviceModel = device;
        vm.deviceRules = null;
        vm.currentUser = null;
        vm.quantity = 3;
        vm.page = 0;
        vm.showLoadMore = false;

        vm.loadMore = loadMore;
        vm.subscribe = subscribe;

        activate();

        //////////////////////////////////////

        function activate() {

            vm.currentUser = session.getUserDetails();

            rulesService.getDeviceRules(vm.deviceModel.id, vm.quantity)
                .then(function(data) {
                    vm.deviceRules = data.items;

                    if (vm.deviceRules.length === vm.quantity) {
                        vm.showLoadMore = true;
                    }

                    angular.forEach(vm.deviceRules, function(deviceRule) {
                        deviceRule.isCurrentUserSubscribed = false;

                        if (deviceRule.stepDefinitions.then.users) {
                            angular.forEach(deviceRule.stepDefinitions.then.users, function(user) {
                                if (user.id === vm.currentUser.id) {
                                    deviceRule.isCurrentUserSubscribed = true;
                                }
                            });
                        }

                        if (deviceRule.stepDefinitions.else) {
                            angular.forEach(deviceRule.stepDefinitions.else.users, function(user) {
                                if (user.id === vm.currentUser.id) {
                                    deviceRule.isCurrentUserSubscribed = true;
                                }
                            });
                        }
                    });
                });

        }

        function subscribe(deviceRule) {
            deviceRule.isCurrentUserSubscribed = !deviceRule.isCurrentUserSubscribed;

            var activeNotificationRulesExist = false;
            angular.forEach(vm.deviceRules, function(deviceRule) {

                if (deviceRule.isCurrentUserSubscribed) {
                    activeNotificationRulesExist = true;
                }
            });

            $rootScope.$emit('isUserSubscribedOnRule', {
                isCurrentUserSubscribed: activeNotificationRulesExist,
                deviceId: vm.deviceModel.id
            });

            if (deviceRule.isCurrentUserSubscribed) {
                rulesService.subscribeOnRuleNotifications(deviceRule.id);
            } else {
                rulesService.unsubscribeFromRuleNotifications(deviceRule.id);
            }
        }

        function loadMore() {
            vm.page++;
            return rulesService.getDeviceRules(vm.deviceModel.id, vm.quantity, vm.page)
                .then(function(data) {

                    if (data.items.length < vm.quantity) {
                        vm.showLoadMore = false;
                    }

                    angular.forEach(data.items, function(deviceRule) {
                        deviceRule.isCurrentUserSubscribed = false;

                        if (deviceRule.stepDefinitions.then.users) {
                            angular.forEach(deviceRule.stepDefinitions.then.users, function(user) {
                                if (user.id === vm.currentUser.id) {
                                    deviceRule.isCurrentUserSubscribed = true;
                                }
                            });
                        }

                        if (deviceRule.stepDefinitions.else) {
                            angular.forEach(deviceRule.stepDefinitions.else.users, function(user) {
                                if (user.id === vm.currentUser.id) {
                                    deviceRule.isCurrentUserSubscribed = true;
                                }
                            });
                        }
                    });

                    vm.deviceRules = vm.deviceRules.concat(data.items);
                });
        }
    }

}(window.angular));
