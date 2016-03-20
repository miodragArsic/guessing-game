(function() {
    'use strict';

    angular
        .module('app')
        .factory('roles.manager', factory);

    function factory() {

        return new RoleManager();
    }

    function RoleManager() {

        this.roles = {};
        this.permissions = {};
    }

    RoleManager.prototype.registerRole = function(name, grantFn) {

        this.roles[name] = {
            grant: grantFn
        };
    };

    RoleManager.prototype.registerPermission = function(name, roles) {

        this.permissions[name] = {
            roles: roles
        };
    };

    RoleManager.prototype.authorize = function(permissionName, payload) {

        var that = this;

        var permission = this.permissions[permissionName];

        var authorized = false;

        angular.forEach(permission.roles, function(role) {
            if (that.roles[role].grant(payload)) {
                authorized = true;
            }
        });

        return authorized;
    };
})();
