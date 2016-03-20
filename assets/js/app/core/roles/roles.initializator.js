(function() {
    'use strict';

    angular
        .module('app')
        .factory('roles.initializator', roleInitializator);

    roleInitializator.$inject = ['roles.manager', 'GroundContext', 'userContext', 'utils'];

    function roleInitializator(roleManager, groundContext, userContext, utils) {

        var service = {
            init: init
        };

        return service;

        ///////////////////////////////////////////////////////////////

        function init() {

            roleManager.registerRole('ground-owner', function(payload) {

                var ground = null;

                if (!userContext.user) {
                    return false;
                }

                if (payload && payload.groundId) {
                    ground = groundContext.find(payload.groundId);
                } else {
                    ground = groundContext.current;
                }

                if (!ground) {
                    return true;
                }

                if (ground.ownerId === userContext.user.id) {
                    return true;
                }

                return false;
            });

            roleManager.registerRole('self', function(payload) {

                if (!userContext.user) {
                    return false;
                }

                return payload.relatedUserId === userContext.user.id;
            });

            roleManager.registerRole('god', function(payload) {

                if (!userContext.user) {
                    return false;
                }

                return userContext.user.role === 'Administrator';
            });

            roleManager.registerPermission('ground-view-devices', ['ground-owner']);
            roleManager.registerPermission('ground-member-remove', ['self', 'ground-owner']);
            roleManager.registerPermission('ground-delete', ['ground-owner']);
            roleManager.registerPermission('ground-save', ['ground-owner']);
            roleManager.registerPermission('ground-member-add', ['ground-owner']);

            roleManager.registerPermission('devices-add', ['ground-owner']);
            roleManager.registerPermission('device-save', ['ground-owner']);
            roleManager.registerPermission('device-delete', ['ground-owner']);
            roleManager.registerPermission('device-control-save', ['ground-owner']);
            roleManager.registerPermission('device-profile-save', ['ground-owner']);

            roleManager.registerPermission('device-assets-add', ['ground-owner']);
            roleManager.registerPermission('device-asset-remove', ['ground-owner']);

            roleManager.registerPermission('device-asset-save', ['ground-owner']);
            roleManager.registerPermission('device-asset-command', ['ground-owner']);
            roleManager.registerPermission('device-asset-control-save', ['ground-owner']);
            roleManager.registerPermission('device-asset-profile-save', ['ground-owner']);
            roleManager.registerPermission('device-asset-state', ['ground-owner', 'god']);
            roleManager.registerPermission('device-command', ['ground-owner']);

            roleManager.registerPermission('gateway-claim', ['ground-owner']);
            roleManager.registerPermission('gateway-save', ['ground-owner']);
            roleManager.registerPermission('gateway-delete', ['ground-owner']);

            roleManager.registerPermission('usermenu-godsection', ['god']);

            utils.$rootScope.hasPermission = function(permissionName, payload) {
                return roleManager.authorize(permissionName, payload);
            };
        }
    }
})();
