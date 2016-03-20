(function(ng) {
    'use strict';

    var app = ng.module('app', [
        'ui.router',
        'LocalStorageModule',
        'ui.bootstrap.modal',
        'angularMoment',
        'ui.select',
        'ngMaterial',
        'ui.knob',
        'jsonFormatter',
        'angularSpectrumColorpicker',
        'ja.qr',
        'nvd3',
        'btford.markdown',
        'angularRipple',
        'dndLists',
        'ngSmartlivingWidgets',
        '720kb.tooltips'
    ]);

    app.config([
        '$stateProvider',
        '$urlRouterProvider',
        '$locationProvider',
        '$sceProvider',
        function($stateProvider, $urlRouterProvider, $locationProvider, $sceProvider) {

            $sceProvider.enabled(false);

            $urlRouterProvider.otherwise('/signin');

            $stateProvider
                .state('login', {
                    url: '/signin',
                    templateUrl: '/assets/js/app/pages/login/view.html',
                    data: {}
                })
                .state('main', {
                    abstract: true,
                    templateUrl: '/assets/js/app/partials/main.html',
                    data: {
                        requireLogin: true,
                        section: 'devices'
                    }
                })
                .state('home', {
                    url: '/',
                    templateUrl: '/assets/js/app/pages/login/view.html',
                    data: {}
                })
                .state('main.quickDemo', {
                    url: '/apps/guessing-game',
                    templateUrl: '/assets/js/app/demo_device/game.html',
                    data: {}
                })
                .state('quickDemoLauncher', {
                    url: '/apps/quick-demo-launcher',
                    templateUrl: '/assets/js/app/demo_device/mobile_browser.html',
                    data: {}
                })

            $locationProvider.html5Mode(true);
        }

    ]);

    app.run([
        '$modalStack',
        '$rootScope',
        'session',
        'messaging.relay',
        'brandConfig',

        function(
            $modalStack,
            $rootScope,
            session,
            messageRelay,
            brandConfig) {

            session.init();
            messageRelay.init();
            brandConfig.init();

            $rootScope.$on('$stateChangeStart', function(event) {
                var top = $modalStack.getTop();
                if (top) {
                    $modalStack.dismissAll('routeChange');
                }
            });
        }

    ]);

}(window.angular));
