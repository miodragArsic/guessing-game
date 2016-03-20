(function() {
    'use strict';

    angular
        .module('app')
        .factory('validatorHelper', factory);

    factory.$inject = [];

    function factory() {

        function ValidatorHelper() {
            this.hideUsernameInputError = true;
            this.hideFullNameInputError = true;
            this.hideEmailInputError = true;
            this.hidePasswordInputError = true;
            this.hideGroundNameInputError = true;
            this.usernamePattern = '^[a-zA-Z0-9_]{1,30}$';

        }

        ValidatorHelper.prototype.onUsernameFocus = function() {
            var that = this;
            that.hideUsernameInputError = false;
        };

        ValidatorHelper.prototype.onUsernameBlur = function() {
            var that = this;
            that.hideUsernameInputError = true;
        };

        ValidatorHelper.prototype.onFullNameFocus = function() {
            var that = this;
            that.hideFullNameInputError = false;
        };

        ValidatorHelper.prototype.onFullNameBlur = function() {
            var that = this;
            that.hideFullNameInputError = true;
        };

        ValidatorHelper.prototype.onEmailFocus = function() {
            var that = this;
            that.hideEmailInputError = false;
        };

        ValidatorHelper.prototype.onEmailBlur = function() {
            var that = this;
            that.hideEmailInputError = true;
        };

        ValidatorHelper.prototype.onPasswordFocus = function() {
            var that = this;
            that.hidePasswordInputError = false;
        };

        ValidatorHelper.prototype.onPasswordBlur = function() {
            var that = this;
            that.hidePasswordInputError = true;
        };

        ValidatorHelper.prototype.onGroundNameFocus = function() {
            var that = this;
            that.hideGroundNameInputError = false;
        };

        ValidatorHelper.prototype.onGroundNameBlur = function() {
            var that = this;
            that.hideGroundNameInputError = true;
        };

        return ValidatorHelper;
    }
})();
