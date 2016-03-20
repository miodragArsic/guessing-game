(function() {
    'use strict';

    angular
        .module('app')
        .controller('LoginController', LoginController);

    LoginController.$inject = [
        '$state',
        '$rootScope',
        'notifyService',
        'session'
    ];

    function LoginController($state, $rootScope, notifyService, session) {

        var vm = this;

        vm.login = login;

        vm.loginData = {
            deviceId: null,
            ticket: null
        };

        activate();

        ////////////////////////

        function activate() {


        }

        function login() {

            if (isInputIncomplete()) {

                notifyService.error('Login: ', 'deviceId and/or ticket must not be empty', null, true);

            } else {

                $rootScope.deviceId = vm.loginData.deviceId;

                $rootScope.ticket = vm.loginData.ticket;

                $state.go('main.quickDemo');

            }
        }

        function isInputIncomplete() {

            return vm.loginData.deviceId === '' || !vm.loginData.deviceId || vm.loginData.ticket === '' || !vm.loginData.ticket;

        }

    }

}());