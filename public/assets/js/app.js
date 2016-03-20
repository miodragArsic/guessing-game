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

(function() {
    'use strict';

    angular
        .module('app')
        .factory('activityRepository', activityRepository);

    activityRepository.$inject = ['activityService', 'utils', 'exception'];

    function activityRepository(activityService, utils, exception) {

        var service = {
            findGroundActivity: findGroundActivity,
            getSubscriptions: getSubscriptions,
            unsubscribeOnGroundActivity: unsubscribeOnGroundActivity,
            subscribeOnGroundActivity: subscribeOnGroundActivity
        };
        return service;

        ////////////////

        function findGroundActivity(groundId, page) {

            return activityService.getGroundActivity(groundId, page)
                .then(function(body) {
                    return body.items;
                })
                .catch(exception.catcher('There was a problem to load ground activity.'));
        }

        function getSubscriptions() {

            return activityService.getSubscriptions()
                .then(function(body) {
                    return body.items;
                })
                .catch(exception.catcher('There was a problem to get ground subscriptions.'));
        }

        function unsubscribeOnGroundActivity(groundId) {

            return activityService.unsubscribeOnGroundActivity(groundId)
                .catch(exception.catcher('There was a problem to unsubscribe from ground activity.'));

        }

        function subscribeOnGroundActivity(groundId) {

            return activityService.subscribeOnGroundActivity(groundId)
                .catch(exception.catcher('There was a problem to subsubscribe to ground activity.'));

        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('activityService', activityService);

    activityService.$inject = ['$http', 'api.url'];

    function activityService($http, apiUrl) {

        var service = {
            getSubscriptions: getSubscriptions,
            subscribeOnGroundActivity: subscribeOnGroundActivity,
            unsubscribeOnGroundActivity: unsubscribeOnGroundActivity,
            getGroundActivity: getGroundActivity
        };
        return service;

        ////////////////

        function getGroundActivity(groundId, page) {
            var url = apiUrl + 'ground/' + groundId + '/activity';

            url = url + getQuery(page);

            return $http.get(url).then(function(response) {
                return response.data;
            });
        }

        function getSubscriptions() {
            var url = apiUrl + 'me/subscriptions';
            return $http.get(url).then(function(response) {

                if (response.data) {
                    return response.data;
                } else {
                    return [];
                }
            });
        }

        function subscribeOnGroundActivity(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/subscription';
            return $http.put(url);
        }

        function unsubscribeOnGroundActivity(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/subscription';
            return $http.delete(url);
        }

        function getQuery(page) {
            if (!page) {
                return '';
            }

            var query = '?page=' + page;

            return query;
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('userContext', factory);

    factory.$inject = ['utils', 'activityRepository', 'session', 'api.usersService'];

    function factory(utils, activityRepository, session, users) {

        function UserContext() {

            this.subscriptions = [];
            this.user = null;
        }

        function getSubscriptions(context) {

            return activityRepository.getSubscriptions().then(function(subscriptions) {
                context.subscriptions = subscriptions;
            });
        }

        function getUserDetails(context) {

            return users.getMe()
                .then(function(userData) {

                    context.user = userData;

                    session.setUserDetails(userData);

                    return userData;

                });

        }

        UserContext.prototype.init = function() {

            var that = this;

            if (session.authentication().isAuth) {

                //get user details from session
                that.user = session.getUserDetails();

                //call server to refresh user details
                getUserDetails(that);

                //call server to get user subscriptions
                getSubscriptions(that);
            }

            utils.$rootScope.getCurrentUserDetails = function() {
                return that.user;
            };
        };

        UserContext.prototype.load = function() {

            var defered = utils.$q.defer();

            var that = this;
            if (session.authentication().isAuth) {

                getUserDetails(that).then(function() {
                    utils.$rootScope.$emit('user.login');
                    defered.resolve();
                }).catch(function() {
                    defered.reject('There was a problem to load user information.');
                });

                getSubscriptions(that);
            } else {
                defered.resolve();
            }

            return defered.promise;
        };

        UserContext.prototype.unload = function() {
            this.subscriptions = [];
            this.user = null;
            utils.$rootScope.$emit('user.logout');
        };

        UserContext.prototype.refresh = function() {

            var that = this;
            getSubscriptions(that);
        };

        UserContext.prototype.isSubscribedToGround = function(groundId) {

            var groundSubscriptionKey = 'ground/' + groundId + '/activity';
            return this.subscriptions.indexOf(groundSubscriptionKey) >= 0;
        };

        return new UserContext();
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('brandConfig', factory);

    factory.$inject = ['$rootScope'];

    function factory($rootScope) {

        var brandConfig = {"favicon":"assets/img/brand/smartliving/favicon.png","logoIcon":"assets/img/brand/smartliving/sl-logo.svg","logoType":"assets/img/brand/smartliving/sl-typo.svg","logoAlt":"smartliving","brandColor":"#2670e0","name":"SmartLiving","loginBgClass":"login-bg"};

        var service = {
            init: init,
            config: brandConfig
        };

        return service;

        function init() {

            $rootScope.brand = brandConfig;

        }
    }

})();

(function(ng) {

    ng
        .module('app')
        .controller('MainPageController', MainPageController);

    MainPageController.$inject = ['$scope', '$rootScope', 'session'];

    function MainPageController($scope, $rootScope, session) {

        var vm = this;

        vm.isNavigationVisible = isNavigationVisible;
        vm.groundModel = null;
        vm.groundMenuOpen = false;
        vm.inGround = null;

        activate();

        /////////////////////////////

        function activate() {
        }

        function isNavigationVisible() {

        }

    }

}(window.angular));

(function() {

    angular
        .module('app')
        .controller('NavigationController', NavigationController);

    NavigationController.$inject = ['$rootScope', 'session', '$state', 'authService', 'GroundContext', 'userContext'];

    function NavigationController($rootScope, session, $state, authService, groundContext, userContext) {

        var vm = this;

        vm.logout = logout;
        vm.loggedIn = false;
        vm.groundContext = groundContext;
        vm.user = session.authentication().userName;
        vm.route = $state.current.name;
        vm.menuItems = {
            users: 'main.admin',
            account: 'main.accountSettings',
            authorizedClients: 'main.authorizedClients',
            devices: 'main.devices',
            gateways: 'main.gateways',
            rules: 'main.rules'
        };

        vm.selectedMenuItem = '';

        vm.isAdmin = isAdmin;
        vm.showSelectedMenuItem = showSelectedItem;

        /////////////////////////////

        $rootScope.$on('user.login', function() {
            vm.loggedIn = session.authentication().isAuth;
            vm.user = session.authentication().userName;
        });

        $rootScope.$on('user.logout', function() {
            vm.loggedIn = session.authentication().isAuth;
            vm.user = null;
        });

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            vm.route = toState.name;

            if (vm.route == vm.menuItems.users) {
                vm.selectedMenuItem = 'God mode';
            } else if (vm.route == vm.menuItems.account) {
                vm.selectedMenuItem = 'Account settings';
            } else if (vm.route == vm.menuItems.authorizedClients) {
                vm.selectedMenuItem = 'Authorized clients';
            } else if (vm.route == vm.menuItems.metrics) {
                vm.selectedMenuItem = 'Metrics';
            } else if (vm.route == vm.menuItems.devices) {
                vm.selectedMenuItem = 'Your devices';
            } else if (vm.route == vm.menuItems.gateways) {
                vm.selectedMenuItem = 'Your gateways';
            } else if (vm.route == vm.menuItems.rules) {
                vm.selectedMenuItem = 'Your rules';
            }

        });

        $rootScope.$watch('inGround', function(newValue) {
            vm.inGround = newValue;
        });

        if (session.authentication().isAuth) {
            vm.loggedIn = true;
        }

        function showMenu() {

            if (groundContext.current) {
                return true;
            } else {
                return false;
            }
        }

        function isAdmin() {
            var user = userContext.user;
            if (user) {
                if (user.role == 'Administrator') {
                    return true;
                }
            } else {
                return false;
            }
        }

        function showSelectedItem() {
            if (vm.route == vm.menuItems.users) {
                return true;
            } else if (vm.route == vm.menuItems.account) {
                return true;
            } else if (vm.route == vm.menuItems.authorizedClients) {
                return true;
            } else if (vm.route == vm.menuItems.devices) {
                return true;
            } else if (vm.route == vm.menuItems.gateways) {
                return true;
            } else if (vm.route == vm.menuItems.rules) {
                return true;
            }

        }

        function logout() {

            authService.logout().then(function() {
                $state.go('login');
            });
        }
    }
}());

(function(ng) {
    ng
        .module('app')
        .factory('notifyService', NotifyService);

    NotifyService.$inject = ['$filter'];

    function NotifyService($filter) {

        var subscribers = [];

        var service = {
            error: error,
            warning: warning,
            info: info,
            success: success,
            offer: offer,
            subscribe: subscribe
        };

        return service;

        //////////////////////////////////////////////

        function error(title, msg, action, isPermanent) {
            publish('error', title, msg, action, isPermanent);
        }

        function warning(title, msg, action, isPermanent, actionHandler, actionText, closeHandler) {
            publish('warning', title, msg, action, isPermanent, actionHandler, actionText, closeHandler);
        }

        function info(title, msg, action, isPermanent) {
            publish('info', title, msg, action, isPermanent);
        }

        function success(title, msg, action, isPermanent) {
            publish('success', title, msg, action, isPermanent);
        }

        function offer(title, msg, actionHandler, actionText, closeHandler) {
            publish('offer', title, msg, null, true, actionHandler, actionText, closeHandler);
        }

        function subscribe(subscriberId, subscriberfn) {

            var foundSubscriber = $filter('filter')(subscribers, {
                id: subscriberId
            });

            if (!(foundSubscriber.length > 0)) {

                subscribers.push({
                    id: subscriberId,
                    fn: subscriberfn
                });
            }
        }

        function publish(type, title, msg, action, isPermanent, actionHandler, actionText, closeHandler) {

            for (var i = 0; i < subscribers.length; i++) {
                subscribers[i].fn({
                    title: title,
                    type: type,
                    msg: msg,
                    action: action,
                    isPermanent: isPermanent,
                    actionHandler: actionHandler,
                    actionText: actionText,
                    closeHandler: closeHandler
                });
            }
        }
    }
}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('user.preferences', userPreferences);

    userPreferences.$inject = ['session', '$state', '$stateParams', 'localStorageService'];

    function userPreferences(session, $state, $stateParams, localStorage) {

        var service = {
            rememberPage: rememberPage,
            readPage: readPage,
            rememberGlobal: rememberGlobal,
            readGlobal: readGlobal
        };
        return service;

        ////////////////

        function rememberPage(key, value) {

            var uniqueKey = generateUniqueKey(key, false);

            localStorage.set(uniqueKey, value);
        }

        function readPage(key) {

            var uniqueKey = generateUniqueKey(key, false);

            return localStorage.get(uniqueKey);
        }

        function rememberGlobal(key, value, ignoreLoggedUser) {

            var ignore = false;

            if (ignoreLoggedUser !== undefined && ignoreLoggedUser !== null) {
                ignore = ignoreLoggedUser;
            }

            var uniqueKey = generateUniqueKey(key, true, ignore);

            localStorage.set(uniqueKey, value);
        }

        function readGlobal(key, ignoreLoggedUser) {

            var ignore = false;

            if (ignoreLoggedUser !== undefined && ignoreLoggedUser !== null) {
                ignore = ignoreLoggedUser;
            }

            var uniqueKey = generateUniqueKey(key, true, ignore);

            return localStorage.get(uniqueKey);
        }

        function generateUniqueKey(key, isGlobal, ignoreLoggedUser) {

            var user = 'guest';

            var auth = session.authentication();

            if (auth.isAuth) {
                user = auth.userName;
            }

            var uniqueKey = null;

            if (isGlobal) {
                if (ignoreLoggedUser) {
                    uniqueKey = 'preference_global_{0}'.format(key);
                } else {
                    uniqueKey = 'preference_global_{0}_{1}'.format(user, key);
                }

            } else {
                if (ignoreLoggedUser) {
                    uniqueKey = 'preference_{0}_{1}'.format(getStateKey(), key);
                } else {
                    uniqueKey = 'preference_{0}_{1}_{2}'.format(user, getStateKey(), key);
                }

            }

            return uniqueKey;
        }

        function getStateKey() {

            var stateKey = $state.current.name;

            for (var p in $stateParams) {
                if ($stateParams.hasOwnProperty(p)) {
                    stateKey += $stateParams[p];
                }
            }

            return stateKey;
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('utils', utils);

    utils.$inject = ['$q', '$timeout', '$interval', '$rootScope', '$state', 'notifyService', 'user.preferences', 'utility.viewConfigs'];

    function utils($q, $timeout, $interval, $rootScope, $state, notifyService, preferences, viewConfigs) {
        var service = {
            //common angular dependaencies
            $q: $q,
            $timeout: $timeout,
            $interval: $interval,
            $rootScope: $rootScope,

            //common app dependaencies
            notify: notifyService,
            preferences: preferences,
            viewConfigs: viewConfigs,

            //helpers
            getDeviceInfo: getDeviceInfo,
            getRandomString: getRandomString,
            isBot: isBot,
            tryParseJSON: tryParseJSON,
            transformResponse: transformResponse,
            handleViewModelInitializtionError: handleViewModelInitializtionError,
            normalizeAssetName: normalizeAssetName,
            generateRandomString: generateRandomString,
            toCamelCase: toCamelCase,

            whenAll: whenAll
        };
        return service;

        //////////////////////////////////////////////////

        function getDeviceInfo() {
            var unknown = '-';

            // screen
            var screenSize = '';
            if (screen.width) {
                var width = (screen.width) ? screen.width : '';
                var height = (screen.height) ? screen.height : '';
                screenSize += '' + width + ' x ' + height;
            }

            //browser
            var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browser = navigator.appName;
            var version = '' + parseFloat(navigator.appVersion);
            var majorVersion = parseInt(navigator.appVersion, 10);
            var nameOffset;
            var verOffset;
            var ix;

            // Opera
            if ((verOffset = nAgt.indexOf('Opera')) != -1) {
                browser = 'Opera';
                version = nAgt.substring(verOffset + 6);
                if ((verOffset = nAgt.indexOf('Version')) != -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }

            // MSIE
            else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(verOffset + 5);
            }

            // Chrome
            else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
                browser = 'Chrome';
                version = nAgt.substring(verOffset + 7);
            }

            // Safari
            else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
                browser = 'Safari';
                version = nAgt.substring(verOffset + 7);
                if ((verOffset = nAgt.indexOf('Version')) != -1) {
                    version = nAgt.substring(verOffset + 8);
                }
            }

            // Firefox
            else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
                browser = 'Firefox';
                version = nAgt.substring(verOffset + 8);
            }

            // MSIE 11+
            else if (nAgt.indexOf('Trident/') != -1) {
                browser = 'Microsoft Internet Explorer';
                version = nAgt.substring(nAgt.indexOf('rv:') + 3);
            }

            // Other browsers
            else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
                browser = nAgt.substring(nameOffset, verOffset);
                version = nAgt.substring(verOffset + 1);
                if (browser.toLowerCase() == browser.toUpperCase()) {
                    browser = navigator.appName;
                }
            }

            // trim the version string
            if ((ix = version.indexOf(';')) != -1) {
                version = version.substring(0, ix);
            }

            if ((ix = version.indexOf(' ')) != -1) {
                version = version.substring(0, ix);
            }

            if ((ix = version.indexOf(')')) != -1) {
                version = version.substring(0, ix);
            }

            majorVersion = parseInt('' + version, 10);
            if (isNaN(majorVersion)) {
                version = '' + parseFloat(navigator.appVersion);
                majorVersion = parseInt(navigator.appVersion, 10);
            }

            // mobile version
            var mobile = /Mobile|mini|Fennec|WPDesktop|Android|iP(ad|od|hone)/.test(nVer);

            // cookie
            var cookieEnabled = (navigator.cookieEnabled) ? true : false;

            if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
                document.cookie = 'testcookie';
                cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
            }

            // system
            var os = unknown;
            var clientStrings = [{
                s: 'Windows 3.11',
                r: /Win16/
            }, {
                s: 'Windows 95',
                r: /(Windows 95|Win95|Windows_95)/
            }, {
                s: 'Windows ME',
                r: /(Win 9x 4.90|Windows ME)/
            }, {
                s: 'Windows 98',
                r: /(Windows 98|Win98)/
            }, {
                s: 'Windows CE',
                r: /Windows CE/
            }, {
                s: 'Windows 2000',
                r: /(Windows NT 5.0|Windows 2000)/
            }, {
                s: 'Windows XP',
                r: /(Windows NT 5.1|Windows XP)/
            }, {
                s: 'Windows Server 2003',
                r: /Windows NT 5.2/
            }, {
                s: 'Windows Vista',
                r: /Windows NT 6.0/
            }, {
                s: 'Windows 7',
                r: /(Windows 7|Windows NT 6.1)/
            }, {
                s: 'Windows 8.1',
                r: /(Windows 8.1|Windows NT 6.3)/
            }, {
                s: 'Windows 8',
                r: /(Windows 8|Windows NT 6.2)/
            }, {
                s: 'Windows NT 4.0',
                r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
            }, {
                s: 'Windows ME',
                r: /Windows ME/
            }, {
                s: 'Android',
                r: /Android/
            }, {
                s: 'Open BSD',
                r: /OpenBSD/
            }, {
                s: 'Sun OS',
                r: /SunOS/
            }, {
                s: 'Linux',
                r: /(Linux|X11)/
            }, {
                s: 'iOS',
                r: /(iPhone|iPad|iPod)/
            }, {
                s: 'Mac OS X',
                r: /Mac OS X/
            }, {
                s: 'Mac OS',
                r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
            }, {
                s: 'QNX',
                r: /QNX/
            }, {
                s: 'UNIX',
                r: /UNIX/
            }, {
                s: 'BeOS',
                r: /BeOS/
            }, {
                s: 'OS/2',
                r: /OS\/2/
            }, {
                s: 'Search Bot',
                r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
            }];
            for (var id in clientStrings) {
                var cs = clientStrings[id];
                if (cs.r.test(nAgt)) {
                    os = cs.s;
                    break;
                }
            }

            var osVersion = unknown;

            if (/Windows/.test(os)) {
                osVersion = /Windows (.*)/.exec(os)[1];
                os = 'Windows';
            }

            switch (os) {
                case 'Mac OS X':
                    osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                    break;

                case 'Android':

                    var androidVersion = /Android ([\.\_\d]+)/.exec(nAgt);
                    if (androidVersion) {
                        osVersion = androidVersion[1];
                    }

                    break;

                case 'iOS':
                    osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                    osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                    break;
            }

            // flash (you'll need to include swfobject)
            /* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
            var flashVersion = 'no check';
            if (typeof swfobject != 'undefined') {
                var fv = swfobject.getFlashPlayerVersion();
                if (fv.major > 0) {
                    flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
                } else {
                    flashVersion = unknown;
                }
            }

            return {
                screenSize: screenSize,
                browser: browser,
                browserVersion: version,
                mobile: mobile,
                os: os,
                osVersion: osVersion,
                cookies: cookieEnabled,
                flashVersion: flashVersion,
                nVer: nVer
            };
        }

        function getRandomString(length) {

            var l = 10;
            if (length && angular.isNumber(length)) {
                l = length;
            }

            var hash = '';
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            for (var i = 0; i < l; i++) {
                hash += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return hash;
        }

        function isBot() {

            return /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
        }

        function tryParseJSON(str) {

            var deferred = $q.defer();

            try {
                var obj = JSON.parse(str);
                deferred.resolve(obj);

            } catch (e) {

                deferred.reject();
            }

            return deferred.promise;
        }

        function transformResponse(ModelConstructor) {

            return function(responseData) {

                if (responseData === null || responseData === undefined) {
                    return;
                }

                if (responseData.items && responseData.items.constructor === Array) {
                    return processArray(responseData.items, ModelConstructor);
                } else if (responseData.data && responseData.data.constructor === Array) {
                    return processArray(responseData.data, ModelConstructor);
                } else if (responseData.constructor === Array) {
                    return processArray(responseData, ModelConstructor);
                } else if (responseData.data) {
                    return new ModelConstructor(responseData.data);
                } else {
                    return new ModelConstructor(responseData);
                }

                function processArray(items, ModelConstructor) {

                    var result = [];
                    for (var i = 0; i < items.length; i++) {
                        var model = new ModelConstructor(items[i]);
                        result.push(model);
                    }

                    return result;
                }
            };
        }

        function handleViewModelInitializtionError(err) {

            if (err && err.status === 404) {
                $state.transitionTo('error', {}, {
                    location: false
                });
            }
        }

        //Returns a single promise that will be resolved with an array/hash of values,
        //each value corresponding to the promise at the same index/key in the promises array/hash. Unlike angular $q.all, this method will
        //resolve even if some of the promises in array/hash are rejected:
        //Promises resloved with success will be included in resulting promises with { isSuccess:true, data: dataReturned }
        //Promises resolved with a rejection will also be included in resulting promises with { isSuccess: false, error: error }
        function whenAll(promises) {

            var wrappedPromises = [];

            angular.forEach(promises, function(promise) {

                var wrappedPromise = promise
                    .then(function(res) {

                        return {
                            isSuccess: true,
                            data: res
                        };

                    })
                    .catch(function(err) {

                        return {
                            isSuccess: false,
                            error: err
                        };

                    });

                wrappedPromises.push(wrappedPromise);

            });

            return $q.all(wrappedPromises);
        }

        function normalizeAssetName(assetTitle) {

            var generatedName = null;
            var pattern = /[^a-z0-9]+/gi;

            if (assetTitle === null || assetTitle === undefined) {
                return null;
            }

            generatedName = assetTitle.replace(pattern, '_').replace(/^_+/, '').replace(/_+$/, '');

            return generatedName;
        }

        function generateRandomString(length, chars) {

            var mask = '';
            var result = '';

            if (chars.indexOf('a') > -1) {
                mask += 'abcdefghijklmnopqrstuvwxyz';
            }

            if (chars.indexOf('A') > -1) {
                mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            }

            if (chars.indexOf('#') > -1) {
                mask += '0123456789';
            }

            if (chars.indexOf('!') > -1) {
                mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
            }

            for (var i = length; i > 0; --i) {

                result += mask[Math.floor(Math.random() * mask.length)];

            }

            return result;
        }

        function toCamelCase(str) {
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
            }).replace(/\s+/g, '');
        }

    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('demo.adoptService', adoptService);

    adoptService.$inject = ['$rootScope', 'utils', 'demo.configuration', 'api.devicesService'];

    function adoptService($rootScope, utils, gameConfiguration, devicesService) {
        var service = {
            init: init
        };

        return service;

        ///////////////////////////////////////////

        function init() {

            $rootScope.$on('user.login', function() {
                var deviceId = utils.preferences.readGlobal(gameConfiguration.deviceIdKey, true);
                if (deviceId) {
                    adoptDevice(deviceId);
                }
            });
        }

        function adoptDevice(deviceId) {

            devicesService.adopt(deviceId).then(function() {
                utils.preferences.rememberGlobal(gameConfiguration.deviceIdKey, null, true);

                $rootScope.$emit('demo.deviceAdopted', deviceId);
            });
        }

    }
}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.configuration', configuration);

    function configuration() {

        var totalAssets = 7;
        var assetConfiguration = {
            shake: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'shake'
                }
            },
            position: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'ontable'
                }
            },
            visibility: {
                profile: {
                    type: 'boolean',
                    supported: false
                },
                control: {
                    name: 'onoff'
                }
            },
            control: {
                profile: {
                    type: 'string',
                    supported: true
                },
                control: {
                    name: 'label'
                }
            },
            handshake: {
                profile: {
                    type: 'string',
                    supported: true
                },
                control: {
                    name: 'label'
                }
            },
            rotation: {
                profile: {
                    type: 'string',
                    supported: false
                },
                control: {
                    name: 'rotate'
                }
            },
            deviceInfo: {
                profile: {
                    type: 'object',
                    supported: true
                },
                control: {
                    name: 'json'
                }
            }
        };

        var service = {
            deviceType: 'quick-demo',
            sessionKey: 'quick-demo-device-name',
            deviceIdKey: 'quick-demo-device-id',
            deviceDescription: 'ready',
            deviceNamePrefix: 'Game-',
            publicUser: 'gg',
            publicUserPassword: 'game1234',
            deviceControlName: 'qrcode',
            assetConfiguration: assetConfiguration,
            totalAssets: totalAssets
        };

        return service;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .controller('GuessingGameController', GuessingGameController);

    GuessingGameController.$inject = [
        '$scope',
        '$stateParams',
        'utils',
        'device.repository',
        'demo.game',
        '$window'
    ];

    function GuessingGameController($scope, $stateParams, utils, deviceRepository, Game, $window) {

        var vm = this;

        vm.gameDevice = null;

        vm.status = 'playing';

        vm.errorMessage = null;

        vm.game = new Game();

        vm.simulate = simulate;
        vm.suspend = suspend;
        vm.resetGame = resetGame;
        vm.reload = reload;
        vm.getConnectedDeviceInfo = getConnectedDeviceInfo;
        vm.connectedDevice = null;

        vm.disconnectDevice = disconnectDevice;

        var deviceId = utils.$rootScope.deviceId;

        var deviceTicket = utils.$rootScope.ticket;

        var HANDSHAKE_FAIL_THRESHOLD = 30000;
        var isSubscribedToAssets = false;

        var handshakeFailTimer = null;

        activate();

        ////////////////

        function activate() {

            loadGameDevice(deviceTicket);

            $scope.$on('$destroy', function() {
                if (vm.gameDevice) {
                    vm.gameDevice.unsubscribe();
                }
            });
        }

        function loadGameDevice(id) {

            return deviceRepository.findAllUsingToken( 'Your smartphone',id).then(function(device) {

                vm.gameDevice = device;
                vm.gameDevice.subscribe(true);

                init();

            }).catch(function() {
                setError();
            });
        }

        function init() {

            var engagerActiveAsset = vm.gameDevice.getAsset('sendingdata');

            if (engagerActiveAsset.state && engagerActiveAsset.state.value === false) {

                vm.game.suspend();

                processGame();

            } else {

                startGame();

                processGame();
            }
        }

        function processGame() {

            var engagerActiveAsset = vm.gameDevice.getAsset('sendingdata');

            if (vm.game.status === 'suspended') {

                var isStillSuspended = engagerActiveAsset.state && engagerActiveAsset.state.value === false;

                if (!isStillSuspended) {

                    vm.game.unsuspend();

                }
            }

            if (vm.status === 'playing') {

                if (engagerActiveAsset.state && engagerActiveAsset.state.value === true) {

                    vm.game.unsuspend();

                } else {

                    vm.game.suspend();

                }
            }

            if (!isSubscribedToAssets) {

                angular.forEach(vm.gameDevice.assets, function(asset) {

                    if (asset.name === 'sendingdata') {

                        asset.on('state', isEnagerActiveStateChangeHandler);

                    } else {

                        asset.on('state', function(state) {

                            vm.game.play(asset.name, state.Value);
                            $scope.$apply();

                        });
                    }
                });

                isSubscribedToAssets = true;
            }
        }

        function getConnectedDeviceInfo() {

            var deviceInfo = {
                os: '',
                browser: ''
            };

            var deviceInfoAsset = vm.gameDevice.getAsset('deviceinfoasset');

            if (deviceInfoAsset.state) {

                deviceInfo = deviceInfoAsset.state.value;

            }

            return deviceInfo;
        }

        function simulate(a, v) {

            vm.game.play(a, v);

        }

        function setError(message) {

            vm.status = 'error';

            vm.errorMessage = message;

        }

        function reload() {

            $window.location.reload(true);

        }

        function suspend(s) {

            if (s) {

                vm.game.suspend();

            } else {

                vm.game.unsuspend();

            }
        }

        function isEnagerActiveStateChangeHandler(state) {

            if (state.Value === false) {

                vm.game.suspend();

            } else {

                vm.game.unsuspend();

            }

            $scope.$apply();
        }

        function startGame() {

            vm.game.start();

            vm.status = 'playing';

        }

        function resetGame() {

            vm.game.reset();

        }

        function disconnectDevice() {

            var controlAsset = vm.gameDevice.getAsset('controlasset');

            controlAsset.send(JSON.stringify({
                Value: 'disconnect'
            }));

            vm.status = 'awaiting';

        }

    }
})();

(function() {

    angular
        .module('app')
        .controller('MobileBrowserDeviceController', MobileBrowserDeviceController);

    MobileBrowserDeviceController.$inject = [
        'device.repository',
        'asset.repository',
        'demo.sensors',
        'demo.configuration',
        '$location',
        'messaging.gateway',
        'utils'
    ];

    function MobileBrowserDeviceController(deviceRepository, assetRepository, sensors, gameConfiguration, $location, messagingGateway, utils) {

        var deviceInfo = utils.getDeviceInfo();

        var deviceName = $location.search().deviceName;
        var token = $location.search().token;

        var deviceTitle = deviceInfo.os + ' ' + deviceInfo.browser;

        var deviceDescription = '# "Quick demo" device\n';

        var vm = this;

        vm.gameDevice = null;
        vm.showLog = false;
        vm.logs = [];
        vm.status = 'connecting';
        vm.errorMessage = null;
        vm.disconnect = null;

        vm.reload = reload;
        vm.restart = restartGame;
        vm.play = playGame;
        vm.toggleShowLog = toggleShowLog;
        vm.deviceInfo = deviceInfo;

        activate();

        ////////////////

        function activate() {

            if (!token || !deviceName) {
                utils.notify.error('Game Initialization', 'Game paramteres are missing.', null, true);
                return;
            }

            if (!deviceInfo.mobile) {
                vm.status = 'notmobile';
                return;
            }

            configureSensorProfiles();

            getDevice()
                .then(initializeDevice)
                .then(connect)
                .then(initializeAssets)
                .then(setupForGame);
        }

        function configureSensorProfiles() {

            if (sensors.shake.isSupported()) {

                gameConfiguration.assetConfiguration.shake.profile.supported = true;

            }

            if (sensors.position.isSupported()) {

                gameConfiguration.assetConfiguration.position.profile.supported = true;

            }

            if (sensors.rotation.isSupported()) {

                gameConfiguration.assetConfiguration.rotation.profile.supported = true;

            }

            gameConfiguration.assetConfiguration.visibility.profile.supported = true;

        }

        function getDevice() {

            return deviceRepository.findSelfUsingTicket(token).catch(function() {

                setError('Error contacting server, try reloading the page.');

            });
        }

        function initializeDevice(device) {

            vm.gameDevice = device;

            return utils.$q(function(resolve, reject) {

                resolve(device);

            });
        }

        function connect(device) {

            var client = device.client;

            if (!messagingGateway.isConnected) {

                return messagingGateway.connect(client.clientId, client.clientSecret).catch(function() {

                    setError('Looks like something went wrong while connecting to the server. Try reloading your page.');

                });
            } else {

                return utils.$q(function(resolve, reject) {

                    resolve(true);

                });
            }
        }

        function setDescription(device) {

            deviceDescription = deviceDescription.format(device.id);

            return deviceRepository.updateUsingToken({
                id: vm.gameDevice.id,
                name: deviceName,
                description: deviceDescription
            }, token).then(function() {

                return device;

            });
        }

        function initializeAssets() {

            var gameAssets = getGameAssets();

            var promises = [];

            function handleAssetCreated(createdAsset) {

                vm.gameDevice.assets.push(createdAsset);

                return createdAsset;

            }

            for (var i = 0; i < gameAssets.length; i++) {

                var asset = gameAssets[i];
                var existingAsset = vm.gameDevice.getAsset(asset.name);

                if (!existingAsset) {

                    asset.deviceId = vm.gameDevice.id;

                    var assetCreatePromise = assetRepository.createUsingTicket(token, asset)
                        .then(handleAssetCreated);

                    promises.push(assetCreatePromise);

                }
            }

            return utils.$q.all(promises);

        }

        function getGameAssets() {

            var gameAssets = [];

            gameAssets.push(createAssetDefinition('amishaking', 'Shaking', 'sensor', gameConfiguration.assetConfiguration.shake.profile, gameConfiguration.assetConfiguration.shake.control));

            gameAssets.push(createAssetDefinition('position', 'Position', 'sensor', gameConfiguration.assetConfiguration.position.profile, gameConfiguration.assetConfiguration.position.control));

            gameAssets.push(createAssetDefinition('sendingdata', 'Sending data', 'sensor', gameConfiguration.assetConfiguration.visibility.profile, gameConfiguration.assetConfiguration.visibility.control));

            gameAssets.push(createAssetDefinition('rotation', 'Rotation', 'sensor', gameConfiguration.assetConfiguration.rotation.profile, gameConfiguration.assetConfiguration.rotation.control));

            return gameAssets;
        }

        function createAssetDefinition(name, title, is, profile, control, style) {

            var assetObject = {};

            if (name) {

                assetObject.name = name;

            }

            if (title) {

                assetObject.title = title;

            }

            if (is) {

                assetObject.is = is;

            }

            if (profile) {

                assetObject.profile = profile;

            }

            if (control) {

                assetObject.control = control;

            }

            if (style) {

                assetObject.style = style;

            }

            return assetObject;
        }

        function subscribeToHtml5Sensors() {

            if (sensors.shake.isSupported()) {

                sensors.shake.subscribeOnShakeChange(function(isShakin) {

                    var shakeAsset = vm.gameDevice.getAsset('amishaking');

                    var data = {};

                    if (isShakin) {

                        data.Value = 'shaking';

                    } else {

                        data.Value = 'still';

                    }

                    shakeAsset.send(JSON.stringify(data));

                    logMessage(data.Value);

                });
            }

            if (sensors.position.isSupported()) {

                sensors.position.subscribeOnPositionChange(function(position) {

                    var positionAsset = vm.gameDevice.getAsset('position');

                    var data = {};

                    if (position) {

                        data.Value = 'ontable';

                    } else {

                        data.Value = 'notontable';

                    }

                    positionAsset.send(JSON.stringify(data));

                    logMessage(data.Value);

                });
            }

            if (sensors.rotation.isSupported()) {

                sensors.rotation.subscribeOnRotation(function(rotation) {

                    var rotationAsset = vm.gameDevice.getAsset('rotation');

                    rotationAsset.send(JSON.stringify({
                        Value: rotation
                    }));

                    logMessage(rotation);

                });
            }

            sensors.pageVisibility.subscribeOnPageVisibility(function(message) {

                var visibilityAsset = vm.gameDevice.getAsset('sendingdata');

                if (message === true) {

                    visibilityAsset.send(JSON.stringify({
                        Value: message
                    }));

                    vm.status = 'playing';

                } else {

                    visibilityAsset.send(JSON.stringify({
                        Value: message
                    }));
                }

            });
        }

        function setupForGame() {

            vm.status = 'ready';

            playGame();

        }

        function sendInitialStatesAndSubscribe() {

            var deviceInfoAsset = vm.gameDevice.getAsset('deviceinfoasset');

            deviceInfoAsset.send(JSON.stringify({
                Value: deviceInfo
            }));
        }

        function restartGame() {

            var activityAsset = vm.gameDevice.getAsset('controlasset');

            var data = {
                Value: 'restart'
            };

            activityAsset.send(JSON.stringify(data));

        }

        function setError(message) {

            vm.status = 'error';

            vm.errorMessage = message;

        }

        function reload() {

            window.location.reload(true);

        }

        function toggleShowLog() {

            vm.showLog = !vm.showLog;

        }

        function playGame() {

            subscribeToHtml5Sensors();

            vm.status = 'playing';

            utils.$timeout(function() {

                var visibilityAsset = vm.gameDevice.getAsset('sendingdata');

                visibilityAsset.send(JSON.stringify({
                    Value: true
                }));

            }, 500);

        }

        function logMessage(message, data) {

            var datetime = getTime();

            vm.logs.push({
                time: datetime,
                message: message,
                data: data
            });

        }

        function getTime() {

            var currentdate = new Date();

            var datetime = currentdate.getDate() + '/' + (currentdate.getMonth() + 1) + '/' + currentdate.getFullYear() + ' @ ' + currentdate.getHours() + ':' + currentdate.getMinutes() + ':' + currentdate.getSeconds() + ' ' + currentdate.getMilliseconds();

            return datetime;

        }
    }
}());

(function() {
    'use strict';

    angular
        .module('app')
        .directive('qrcodeDeviceControl', qrcodeDeviceControl);

    function qrcodeDeviceControl() {
        // Usage:
        //
        // Creates:
        //
        var directive = {
            bindToController: true,
            controller: Controller,
            templateUrl: '/assets/js/app/demo_device/qrcodeDeviceControl.html',
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;

        function link(scope, element, attrs) {}
    }

    Controller.$inject = ['session', 'urlShortenerService', 'origin'];

    function Controller(session, urlShortenerService, origin) {

        var vm = this;
        var sessionData = session.authentication();
        var gameToken = null;

        vm.qrCodeUrl = '';

        activate();

        ///////////////////////////////////////////////

        function activate() {

            if (sessionData.isAuth) {
                gameToken = sessionData.accessToken;
            } else {
                gameToken = publicToken;
            }

            var longUrl = getQRCodeUrl(vm.device.name, gameToken);
            urlShortenerService.shortenUrl(longUrl)
                .then(function(shortUrl) {
                    vm.qrCodeUrl = shortUrl;
                });
        }

        function getQRCodeUrl(deviceName, token) {

            return '{0}/mobilebrowserdevice?deviceName={1}&token={2}'.format(origin, deviceName, token);
        }
    }
})();

(function(ng) {

    ng
        .module('app')
        .controller('AssetController', AssetController);

    AssetController.$inject = ['$scope', '$stateParams', '$state', 'session', 'utils', 'model'];

    function AssetController($scope, $stateParams, $state, session, utils, model) {

        var vm = this;

        vm.model = null;
        vm.goBack = goBack;
        vm.deleteAsset = deleteAsset;

        vm.client = {
            clientId: session.authentication().rmq.clientId,
            clientKey: session.authentication().rmq.clientKey
        };

        activate();

        ////////////////////////////////////////////

        function activate() {

            vm.model = model;

            $scope.$on('$destroy', function() {
                if (vm.model.asset) {
                    vm.model.asset.unsubscribe();
                }
            });
        }

        function goBack() {

            if (vm.model.origin == 'Device') {
                $state.go('main.device', {
                    id: vm.model.asset.deviceId
                });
            } else {
                $state.go('main.gateway', {
                    id: vm.model.asset.deviceId
                });
            }
        }

        function deleteAsset() {

            vm.model.delete().then(function() {
                goBack();
            });
        }
    }

}(window.angular));

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

(function() {

    angular
        .module('app')
        .controller('DeviceController', DeviceController);

    DeviceController.$inject = [
        '$scope',
        '$state',
        '$stateParams',
        '$modal',
        'session',
        'utils',
        'model'
    ];

    function DeviceController($scope, $state, $stateParams, $modal, session, utils, model) {

        var PREFERENCE_CONTROL_KEY = 'device_tab';

        var vm = this;

        vm.model = null;
        vm.goToAsset = goToAsset;
        vm.openDeleteDeviceModal = openDeleteDeviceModal;
        vm.setControl = setControl;
        vm.qrControl = 'enroll-demo';

        vm.modalStatus = utils.preferences.readGlobal('DeleteDeviceModalStatus');

        //TODO: refactor to $root
        vm.client = {
            clientId: session.authentication().rmq.clientId,
            clientKey: session.authentication().rmq.clientKey
        };

        activate();

        ////////////////

        function activate() {

            vm.model = model;

            var controlToShow = getControlToShow();

            if (controlToShow === 'device-control' && (!vm.model.device.control || !vm.model.device.control.name)) {

                controlToShow = 'device-control';

            }

            vm.model.setControl(controlToShow);

            $scope.$on('$destroy', function() {

                if (vm.model.device) {

                    vm.model.device.unsubscribe();

                    for (var i = 0; i < vm.model.device.assets.length; i++) {

                        vm.model.device.assets[i].unsubscribe();

                    }
                }
            });
        }

        function getControlToShow() {

            var defaultControl = 'asset-controls';

            var supportedControls = ['asset-controls', 'asset-list', 'activity', 'device-control'];

            if ($stateParams.assetCtrl && supportedControls.indexOf($stateParams.assetCtrl) >= 0) {

                return $stateParams.assetCtrl;

            } else {

                var userPref = utils.preferences.readPage(PREFERENCE_CONTROL_KEY);

                if (supportedControls.indexOf(userPref) >= 0) {

                    return userPref;

                }
            }

            return defaultControl;
        }

        function setControl(ctrl) {

            vm.model.setControl(ctrl);

            utils.preferences.rememberPage(PREFERENCE_CONTROL_KEY, ctrl);

            $state.go('main.deviceOpt', {
                id: vm.model.device.id,
                assetCtrl: ctrl

            }, {
                notify: false,
                reload: false
            });
        }

        function goToAsset(assetId) {

            $state.go('main.asset', {
                id: assetId
            });

        }

        function openDeleteDeviceModal() {

            if (vm.modalStatus !== 'true') {

                var modalInstance = $modal.open({
                    templateUrl: '/assets/js/app/modals/confirm_item_delete/view.html',
                    controller: 'modals.confirmItemDelete',
                    controllerAs: 'vm',
                    resolve: {
                        item: function() {
                            return vm.model;
                        },
                        model: function() {
                            return null;
                        }
                    }
                });
            } else {

                vm.model.delete().then(function() {
                    if (vm.model.hasOwnProperty('device')) {
                        $state.go('main.groundDevices', {
                            id: vm.model.groundId
                        });
                    } else if (vm.model.hasOwnProperty('gateway')) {
                        $state.go('main.groundGateways', {
                            id: vm.model.groundId
                        });
                    }
                });
            }

        }
    }

}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('DeviceViewModel', factory);

    factory.$inject = [
        'utils',
        'CreateAssetModel',
        'EditDeviceModel',
        'device.repository',
        'asset.repository',
        'HeaderItemModel',
        'roles.manager',
        'api.rulesService',
        'utility.common',
        'session',
        'controls.repository',
        'FirstAppDictionary'
    ];

    function factory(utils, CreateAssetModel, EditDeviceModel, deviceRepository, assetRepository, HeaderItemModel, rolesManager, rulesService, common, session, controlsRepository, FirstAppDictionary) {

        function DeviceViewModel(device, groundId) {

            var that = this;

            that.settings = {};

            that.selectedControl = null;

            that.client = {
                clientId: session.authentication().rmq.clientId,
                clientKey: session.authentication().rmq.clientKey
            };

            that.isOpen = null;

            that.configOpen = false;

            that.guideOpen = false;

            that.groundId = groundId;

            that.editorOptions = utils.viewConfigs.getJsonEditorOptions();

            that.editorOptions.readOnly = rolesManager.authorize('device-control-save', {
                groundId: groundId
            }) ? false : 'nocursor';

            that.activeControl = 'controls';

            that.createAssetDisabled = false;

            try {

                var isFileSaverSupported = !!new Blob;

                that.isDownloadSupported = true;

            } catch (e) {

                that.isDownloadSupported = false;

            }

            that.init(device);

            that.editorOptions = utils.viewConfigs.getJsonEditorOptions();
            that.editorModel = '';
            that.stepsUrl = getStepsUrl(device.type);

            var dictionary = new FirstAppDictionary();

            that.editorModel = dictionary.generateScript(device, { id: device.id, clientId: that.client.clientId, clientKey: that.client.clientKey });

            that.editorRefresh = false;
        }

        DeviceViewModel.prototype.init = function(device) {

            var that = this;

            that.device = device;

            that.assetModel = new CreateAssetModel();

            that.editDeviceModel = new EditDeviceModel(device.name, device.description, device.title);

            that.editorControl = JSON.stringify(device.control, null, that.editorOptions.tabSize);

            if (device.type === 'intel-edison') {

                //for Edison device 'credentials.json'
                setupIntelEdisonCredentialsFile(that, that.device, that.client);

            }

            if (device.type === 'proximus-lora') {

                //for LoRa device 'keys.h'
                var keysFileIsReady = setupProximusLoraKeysFile(that, that.device);

                if (!keysFileIsReady) {

                    that.isDownloadSupported = false;

                }
            }

            rulesService.getDeviceRulesCount(device.id)
                .then(function(response) {

                    that.device.hasRules = response.data.hasRules;

                    that.device.hasNotificationRules = response.data.hasNotificationRules;

                    that.headerModel = HeaderItemModel.fromDevice(device);

                });

            var promises = [];

            promises.push(deviceRepository.getDeviceSettings(device.id));
            promises.push(controlsRepository.findAllDeviceControls());

            utils.$q.all(promises).then(function(results) {

                that.settings = results[0];

                that.controls = results[1];

                angular.forEach(that.controls, function(control) {

                    if (control.name === that.settings.control) {

                        that.selectedControl = control;

                    }
                });

            });
        };

        DeviceViewModel.prototype.downloadKeysFile = function() {

            var blob = new Blob([this.keysText], {

                type: 'text/plain;charset=utf-8'

            });

            saveAs(blob, 'keys.h');

        };

        DeviceViewModel.prototype.downloadCredentialsFile = function() {

            var blob = new Blob([this.credentialsJsonText], {

                type: 'text/plain;charset=utf-8'

            });

            saveAs(blob, 'credentials.json');

        };

        DeviceViewModel.prototype.toggleConfig = function() {

            this.configOpen = !this.configOpen;

        };

        DeviceViewModel.prototype.toggleGuide = function() {

            this.guideOpen = !this.guideOpen;

        };

        DeviceViewModel.prototype.isConfigOpen = function() {

            return this.configOpen;

        };

        DeviceViewModel.prototype.setControl = function(control) {

            this.activeControl = control;
        };

        DeviceViewModel.prototype.createAsset = function() {

            var that = this;

            that.createAssetDisabled = true;

            return assetRepository.create(that.device.id, utils.normalizeAssetName(that.assetModel.name), that.assetModel.name, that.assetModel.type)
                .then(function(asset) {

                    common.markNew(that.device.assets, [asset]);

                    utils.notify.success('Success: ', 'Asset is created.');

                    that.device.assets.push(asset);

                    that.assetModel.name = '';

                    that.isOpen = false;

                    return true;
                })
                .catch(function(error) {

                    return false;

                }).finally(function() {

                    that.createAssetDisabled = false;

                });
        };

        DeviceViewModel.prototype.delete = function() {

            return deviceRepository.remove(this.device.id)
                .then(function(response) {

                    utils.notify.success('Success: ', 'Device is deleted.');

                });
        };

        DeviceViewModel.prototype.updateControl = function(ctrl) {

            this.settings.control = ctrl.name;

            deviceRepository.saveDeviceSettings(this.device.id, this.settings);

        };

        DeviceViewModel.prototype.updateTitle = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                    name: that.device.name,
                    title: that.editDeviceModel.title
                })
                .then(function(d) {

                    that.device.title = d.title;

                    that.device.description = d.description;

                    utils.notify.success('Success: ', 'Device Updated');

                    that.headerModel.update(that.device.title, that.device.description);

                });
        };

        DeviceViewModel.prototype.updateDescription = function() {

            var that = this;

            that.editDeviceModel.saved = true;

            return deviceRepository.update(that.device.id, {
                    name: that.device.name,
                    description: that.editDeviceModel.description
                })
                .then(function(d) {

                    that.device.name = d.name;

                    that.device.description = d.description;

                    utils.notify.success('Success: ', 'Device Updated');

                    that.headerModel.update(that.device.name, that.device.description);

                });

        };

        DeviceViewModel.prototype.enableActivity = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                name: that.device.name,
                activityEnabled: true
            }).then(function(response) {

                utils.notify.success('Success: ', 'Activity Log enabled.');

                that.device.activityEnabled = true;

            });
        };

        DeviceViewModel.prototype.disableActivity = function() {

            var that = this;

            return deviceRepository.update(that.device.id, {
                name: that.device.name,
                activityEnabled: false
            }).then(function(response) {

                utils.notify.success('Success: ', 'Activity Log disabled.');

                that.device.activityEnabled = false;

            });
        };

        DeviceViewModel.prototype.allowAssetTypeCreation = function(assetType) {

            var that = this;
            var permission = true;

            if (that.device.type === 'proximus-lora' && assetType === 'actuator') {

                permission = false;

            }

            return permission;
        };

        DeviceViewModel.prototype.downloadScript = function() {

            var that = this;

            var blob = null;

            if (that.device.type === 'rpi') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain;charset=utf-8'

                });

                saveAs(blob, 'first_app.py');

            } else if (that.device.type === 'arduino') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain'

                });

                saveAs(blob, 'first_app.ino');

            } else if (that.device.type === 'intel-edison') {

                blob = new Blob([this.editorModel], {

                    type: 'text/plain'

                });

                saveAs(blob, 'main.js');

            }
        };

        DeviceViewModel.resolve = function(deviceId) {

            return deviceRepository.find(deviceId)
                .then(function(device) {

                    var viewModel = new DeviceViewModel(device, device.groundId);

                    return viewModel;

                });
        };

        function setupIntelEdisonCredentialsFile(model, device, client) {

            model.credentialsJsonText = '{\r\n' +
                '   "deviceId": "' + device.id + '",\r\n' +
                '   "clientId": "' + client.clientId + '",\r\n' +
                '   "clientKey": "' + client.clientKey + '"\r\n' +
                '}';

        }

        function setupProximusLoraKeysFile(model, device) {

            if (device.meta && device.meta.keys && device.meta.keys.DEV_ADDR && device.meta.keys.APPSKEY && device.meta.keys.NWKSKEY) {

                model.keysText = '#ifndef KEYS_h\r\n' +
                    '#define KEYS_h\r\n\r\n' +

                    'uint8_t DEV_ADDR[4] = ' + device.meta.keys.DEV_ADDR + ';\r\n' +
                    'uint8_t APPSKEY[16] = ' + device.meta.keys.APPSKEY + ';\r\n' +
                    'uint8_t NWKSKEY[16] = ' + device.meta.keys.NWKSKEY + ';\r\n\r\n' +

                    '#endif';

                return true;

            } else {

                model.keysText = 'Looks like data for keys.h file is not available.';

                return false;
            }
        }

        function getStepsUrl(deviceType) {

            var url = '/assets/js/app/devices/setup-steps/';

            url += deviceType + '-steps.html';

            return url;
        }

        return DeviceViewModel;
    }
})();

(function(ng) {
    ng
        .module('app')
        .controller('DevicesController', DevicesController);

    DevicesController.$inject = [
        '$state',
        '$scope',
        '$modal',
        'model',
        'utils'
    ];

    function DevicesController($state, $scope, $modal, model, utils) {

        var vm = this;

        vm.model = model;
        vm.createDevice = createDevice;
        vm.openDeleteDeviceModal = openDeleteDeviceModal;

        var status = utils.preferences.readGlobal('DeleteDeviceModalStatus');

        activate();

        function activate() {
            $scope.$on('$destroy', function() {
                angular.forEach(vm.model.devices, function(device) {
                    // device.unsubscribe();
                });
            });
        }

        function createDevice(name, type) {

            vm.model.createDevice(name, type)
                .then(function(device) {

                    $state.go('main.device', {
                        id: device.id
                    });
                });
        }

        function openDeleteDeviceModal(device) {

            if (status !== 'true') {

                var modalInstance = $modal.open({
                    templateUrl: '/assets/js/app/modals/confirm_item_delete/view.html',
                    controller: 'modals.confirmItemDelete',
                    controllerAs: 'vm',
                    resolve: {
                        item: function() {
                            return device;
                        },
                        model: function() {
                            return vm.model;
                        }
                    }
                });

            } else {

                vm.model.delete(device.device);
            }

        }
    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('DeviceListViewModel', DeviceListViewModelFactory);

    DeviceListViewModelFactory.$inject = [
        '$state',
        'device.repository',
        'utils',
        'demo.configuration',
        'sl.listHeader',
        'sl.listItem',
        'api.rulesService',
        'GroundContext'
    ];

    function DeviceListViewModelFactory($state, devicesRepository, utils, gameConfiguration, ListHeaderViewModel, ListItemViewModel, rulesService, groundContext) {

        function DeviceListViewModel(devices, groundId) {

            this.devices = [];
            this.groundId = groundId;
            this.grounds = groundContext.grounds;
            this.init(devices);
        }

        DeviceListViewModel.prototype.init = function(devices) {

            var that = this;

            if (devices.length === 0) {
                this.headerModel = new ListHeaderViewModel('Devices', 'assets/img/devices-header.svg', 'Overview of all devices serving this ground. Currently you don\'t have any devices.');
            } else {
                this.headerModel = new ListHeaderViewModel('Devices', 'assets/img/devices-header.svg', 'Overview of all devices serving this ground.');
            }

            angular.forEach(that.grounds, function(ground) {
                if (ground.id === that.groundId) {
                    that.currentGroundVisibility = ground.visibility;
                }
            });

            angular.forEach(devices, function(device) {

                device.subscribe();

                rulesService.getDeviceRulesCount(device.id)
                    .then(function(response) {
                        device.rulesMeta = response.data;
                        that.devices.push(ListItemViewModel.fromDevice(device));
                    });
            });

            if (devices.length > 0) {
                that.headerModel.setHeaderMode('colapsed');
            } else {
                that.headerModel.setHeaderMode('expanded');
            }

            utils.$rootScope.$on('$messaging.device.created', function(e, eventData) {

                var deviceExists = false;
                angular.forEach(that.devices, function(device) {
                    if (device.itemId === eventData.deviceId) {
                        deviceExists = true;
                    }
                });

                if (!deviceExists) {
                    devicesRepository.find(eventData.deviceId).then(function(dev) {
                        dev.$isNew = true;
                        dev.subscribe();
                        that.devices.push(ListItemViewModel.fromDevice(dev));
                        if (that.devices.length > 0) {
                            that.headerModel.setHeaderMode('colapsed');
                        } else {
                            that.headerModel.setHeaderMode('expanded');
                        }

                    });
                }
            });

            utils.$rootScope.$on('$messaging.device.deleted', function(e, eventData) {

                var deletedDevice = null;
                angular.forEach(that.devices, function(device) {
                    if (device.itemId === eventData.deviceId) {
                        deletedDevice = device;
                    }
                });

                if (deletedDevice !== null) {
                    deletedDevice.setDeleted();
                }

            });

            utils.$rootScope.$on('demo.deviceAdopted', function(e, data) {
                devicesRepository.find(data).then(function(dev) {
                    dev.$isNew = true;
                    that.devices.push(ListItemViewModel.fromDevice(dev));
                });
            });

        };

        DeviceListViewModel.prototype.createDevice = function(name, type) {

            var that = this;

            if (name === null || name === '') {
                return;
            }

            var data = {
                name: name,
                type: type
            };

            return devicesRepository.createInGround(data, that.groundId).then(function(device) {

                utils.notify.success('Success.', 'New device is created');

                utils.$rootScope.$emit('user.created.device', device);

                return device;
            });
        };

        DeviceListViewModel.prototype.removeDevice = function(deletedDevice) {

            var index = this.devices.indexOf(deletedDevice);
            this.devices.splice(index, 1);
        };

        DeviceListViewModel.prototype.delete = function(device) {

            var that = this;
            var deviceDeleted = device;

            return devicesRepository.remove(deviceDeleted.id)
                .then(function() {

                    utils.notify.success('Success.', 'Device is deleted');

                    for (var i = 0; i < that.devices.length; i++) {

                        if (that.devices[i].device === deviceDeleted) {

                            that.devices.splice(i, 1);
                        }
                    }

                });

        };

        DeviceListViewModel.resolve = function(groundId) {

            return devicesRepository.findAllInGround(groundId).then(function(devices) {
                return new DeviceListViewModel(devices, groundId);
            });
        };

        return DeviceListViewModel;
    }
}());

(function(ng) {
    ng
        .module('app')
        .controller('YourDevicesController', YourDevicesController);

    YourDevicesController.$inject = [
        '$state',
        '$scope',
        'YourDevicesViewModel'
    ];

    function YourDevicesController($state, $scope, YourDevicesViewModel) {

        var vm = this;

        vm.model = null;
        vm.goToEnvironment = goToEnvironment;

        activate();

        function activate() {

            YourDevicesViewModel.resolve().then(function(model) {
                vm.model = model;
            });

        }

        function goToEnvironment() {
            $state.go('main.environment');
        }

    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('YourDevicesViewModel', YourDevicesViewModelFactory);

    YourDevicesViewModelFactory.$inject = [
        'device.repository',
        'utils',
        'sl.listHeader',
        'sl.listItem'
    ];

    function YourDevicesViewModelFactory(devicesRepository, utils, ListHeaderViewModel, ListItemViewModel) {

        function YourDevicesViewModel(devices) {

            this.devices = [];
            this.headerModel = null;
            this.callToAction = false;
            this.init(devices);
        }

        YourDevicesViewModel.prototype.init = function(devices) {
            var that = this;

            angular.forEach(devices, function(device) {
                that.devices.push(ListItemViewModel.fromDevice(device));
            });

            if (devices.length > 0) {
                that.headerModel = new ListHeaderViewModel('Your devices', 'assets/img/devices-header.svg', 'Overview of all devices that you own.');
                that.headerModel.setHeaderMode('colapsed');
                that.callToAction = false;
            } else {
                that.headerModel = new ListHeaderViewModel('Your Devices', 'assets/img/devices-header.svg', 'Overview of all devices that you own.. Currently you don\'t have any devices. To create grounds and devices navigate to environment');
                that.headerModel.setHeaderMode('expanded');
                that.callToAction = true;
            }

        };

        YourDevicesViewModel.resolve = function() {

            return devicesRepository.findAll()
                .then(function(devices) {
                    return new YourDevicesViewModel(devices);
                });

        };

        return YourDevicesViewModel;
    }
}());

    (function (ng) {
    ng.module('app').directive('balloonError', [
        function () {
            var RIGHT_OFFSET = 62;
            //var BALLON = 'balloon';
            var BALLOON_ERROR = 'balloon-error';
            var SAD_SMILE_ICON = 'sl-emotion-sad';

            function BalloonError(parentElement) {
                this.element = null;
                this.textElement = null;
                this.parentElement = parentElement instanceof ng.element ? parentElement[0] : parentElement;
            }

            BalloonError.prototype.getTopRightPosition = function () {
                var clientRect = this.parentElement.getBoundingClientRect();
                var x = Math.round(clientRect.width + clientRect.left) - RIGHT_OFFSET;
                var y = Math.round(clientRect.top);

                return {x: x, y: y};
            };

            BalloonError.prototype.setPosition = function (balloon) {
                if (balloon) {
                    var position = this.getTopRightPosition();

                    balloon.style.position = 'absolute';
                    balloon.style.top = position.y + 'px';
                    balloon.style.left = position.x + 'px';
                }
            };

            BalloonError.prototype.createErrorObject = function () {
                var balloon = this.element = document.createElement('div');
                var arrow = document.createElement('span');
                var icon = document.createElement('i');

                this.textElement = document.createElement('span');

                //balloon.classList.add(BALLON);
                balloon.classList.add(BALLOON_ERROR);
                icon.classList.add(SAD_SMILE_ICON);
                arrow.classList.add('arrow');

                balloon.appendChild(arrow);
                balloon.appendChild(icon);
                balloon.appendChild(this.textElement);

                this.setPosition(balloon);
                this.parentElement.parentNode.appendChild(balloon);
            };

            BalloonError.prototype.destroyErrorObject = function () {
                this.parentElement.parentNode.removeChild(this.element);
                this.element = null;
                this.textElement = null;
            };

            BalloonError.prototype.setErrorMessage = function (message) {
                if (this.element && message) {
                    this.textElement.innerHTML = message;
                }
            };

            BalloonError.prototype.clearErrorMessage = function () {
                this.textElement.innerHTML = null;
            };

            return {
                restrict: 'A',
                scope: {
                    message: '=balloonError'
                },
                link: function (scope, element, attrs) {
                    var balloon = null;

                    scope.$watch('message', function (value) {
                        if (value) {
                            if (!balloon) {
                                balloon = new BalloonError(element);
                                balloon.createErrorObject();
                            }

                            balloon.setErrorMessage(value);
                        }
                        else {
                            if (balloon) {
                                balloon.destroyErrorObject();
                                balloon = null;
                            }
                        }
                    });

                    function setBallonPositionOnEvent() {
                        if (balloon) {
                            balloon.setPosition(balloon.element);
                        }
                    }

                    window.addEventListener('resize', setBallonPositionOnEvent);

                    var container = window.document.body.querySelector(".grid-col-container");

                    if (container) {
                        container.addEventListener('scroll', setBallonPositionOnEvent);
                    }

                    scope.$on('$destroy', function () {
                        if (balloon) {
                            balloon.destroyErrorObject();
                        }

                        window.removeEventListener('resize', setBallonPositionOnEvent);
                        window.removeEventListener('scroll', setBallonPositionOnEvent);
                    });
                }
            };
        }
    ]);
}(window.angular));
(function(ng) {
        ng.module('app').directive('counterInput', [
            '$rootScope',
            function($rootScope) {
                return {
                    restrict: 'A',
                    scope: {
                        time: '='
                    },
                    link: function(scope, element) {
                        var el = element[0];
                        var ch = element.children();
                        var height = element.height();
                        var value = element.children().height();
                        var identifyClass = 'this';

                        scope.$watch('time', function() {
                                for (var i = 0; i < ch.length; i++) {
                                    var oneElement = ch[i];
                                    if ($(ch[i]).hasClass(identifyClass)) {
                                        $(ch[i]).removeClass(identifyClass);
                                    };
                                    if (ch[i].getAttribute('data-value') == scope.time) {
                                        $(ch[i]).addClass(identifyClass);
                                        var position = (i - 1) * value;
                                        var newPosition = position + value;
                                        el.style.top = '-' + newPosition + 'px';
                                        break;
                                    }
                                }
                            }
                        );



                    function resetCounterTop() {
                        el.style.top = '0px';
                        ch.removeClass(identifyClass);
                        ch.first().addClass(identifyClass);
                        scope.$apply(function() {
                            scope.time = ch.first().attr("data-value");

                        });
                    }

                    function resetCounterBottom() {
                        el.style.top = '-' + (height - value) + 'px';
                        ch.removeClass(identifyClass);
                        ch.last().addClass(identifyClass);
                        scope.$apply(function() {
                            scope.time = ch.last().attr("data-value");

                        });
                    }

                    function countForward() {
                        var current = element.find('.' + identifyClass + '');
                        scope.$apply(function() {
                            scope.time = current.next().attr("data-value");

                        });

                        var index = current.index();
                        var currentPosition = index * value;
                        var move = currentPosition + value;

                        function animateCountForward() {
                            el.style.top = '-' + move + 'px';
                            current.removeClass(identifyClass);
                            current.next().addClass(identifyClass);
                        }

                        if (move < height) {
                            animateCountForward();
                        } else {
                            resetCounterTop();
                        }

                    }

                    function countBack() {
                        var current = element.find('.' + identifyClass + '');
                        scope.$apply(function() {
                            scope.time = current.prev().attr("data-value");

                        });
                        var index = current.index();
                        var currentPosition = index * value;
                        var move = currentPosition - value;

                        function animateCountBack() {
                            el.style.top = '-' + move + 'px';
                            current.removeClass(identifyClass);
                            current.prev().addClass(identifyClass);
                        }

                        if (move >= 0) {
                            animateCountBack();
                        } else {
                            resetCounterBottom();
                        }

                    }

                    ng.element(ch).on('click', function() {
                        value = element.children().height();
                        height = element.height();
                        countForward();
                    });
                    ng.element(ch).on('mousewheel', function(e, direction) {
                        value = element.children().height();
                        height = element.height();
                        if (direction < 0) {
                            countForward();
                        } else {
                            countBack();
                        }
                        e.preventDefault()
                    });
                }
            };
        }]);
}(window.angular));
(function() {

    angular
        .module('app')
        .directive('deviceStatus', deviceStatus);

    deviceStatus.$inject = ['$rootScope'];

    function deviceStatus($rootScope) {
        var directive = {
            restrict: 'A',
            scope: {
                device: '='
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attribute) {

            scope.$watch('device.deviceActiveAt', function() {
                scope.setStatusLabel(scope.device.lastActiveAt);
            });

            scope.isFirstTime = true;

            $rootScope.$on('$messaging.asset.state', function(event, payload) {

                var isAssetFromThisDevice = false;
                var asset = null;

                for (var i = 0; i < scope.device.assets.length; i++) {

                    if (payload.assetId === scope.device.assets[i].id) {

                        isAssetFromThisDevice = true;
                        asset = scope.device.assets[i];
                        break;
                    }

                }

                if (asset) {

                    if (asset.name === 'sendingdata' && scope.isFirstTime) {

                        $rootScope.$broadcast('user.playing.quick-demo', asset.state);

                        scope.isFirstTime = false;
                    }

                }

                if (isAssetFromThisDevice && asset.is === 'sensor') {

                    scope.setStatusLabel(payload.payload.State.At);

                }

            });

            scope.setStatusLabel = function(time) {

                var status = null;

                if (time !== null && time !== undefined && time !== '') {

                    var offsetTime = moment(time).add(-4, 's');
                    var timeEdited = moment(offsetTime, moment.ISO_8601);
                    var finalTime = timeEdited.fromNow();
                    element[0].innerHTML = 'active ' + finalTime;

                    $(element[0]).attr('title', timeEdited.format('DD.MM.YYYY. [at] HH:MM'));

                }

            };

        }
    }
}());

(function(ng) {
    ng.module('app').directive('drag', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                    var t = element;

                    $(function() {
                        $(t).mousedown(function (event) {
                            $(t)
                                .data('down', true)
                                .data('x', event.pageX)
                                .data('y', event.pageY)
                                .data('scrollLeft', this.scrollLeft)
                                .data('scrollTop', this.scrollTop)
                                .css('cursor', 'move');
                        }),

                            $(t).mouseup(function (event) {
                                $(t)
                                    .data('down', false)
                                    .removeAttr('style');
                            }),

                            $(t).mousemove(function (event) {
                                if ($(t).data('down') == true) {
                                    this.scrollLeft = $(t).data('scrollLeft') + $(t).data('x') - event.pageX;
                                }

                                if ($(t).data('down') == true) {
                                    this.scrollTop = $(t).data('scrollTop') + $(t).data('y') - event.pageY;
                                }
                            });

                    });


            }
        };
    });
}(window.angular));






(function(ng) {
    ng
        .module('app')
        .directive('fromNow', fromNow);

    fromNow.$inject = ['$interval'];

    function fromNow($interval) {
        var directive = {
            restrict: 'A',
            scope: {
                fromNow: '='
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attribute) {

            scope.$watch('fromNow', function() {
                scope.setTimeLabel(scope.fromNow);
            });

            var refreshTimer = $interval(function() {
                scope.setTimeLabel(scope.fromNow);
            }, 30000);

            scope.setTimeLabel = function(time) {
                if (time) {
                    var offsetTime = moment(time).add(-4, 's');
                    var timeEdited = moment(offsetTime, moment.ISO_8601);
                    var finalTime = timeEdited.fromNow();
                    element[0].innerHTML = finalTime;

                    $(element[0]).attr('title', timeEdited.format('DD.MM.YYYY. [at] HH:MM'));
                }
            };

            scope.$on('$destroy', function() {
                $interval.cancel(refreshTimer);
            });
        }
    }
}(window.angular));

//(function (ng) {
//    ng.module('app').directive('fullHeight',
//        ['$window',
//            function ($window) {
//                return {
//                    restrict: 'A',
//                    link: function (scope, element, attrs) {
//                        var el = element[0];
//
//                        scope.onResize = function () {
//                            resizeElement();
//                        };
//
//                        function resizeElement() {
//                            if (el) {
//                                el.style.height = (window.innerHeight - el.offsetTop) + 'px';
//                            }
//                        }
//
//                        ng.element($window).on('resize', function () {
//                            scope.onResize();
//                        });
//
//                        resizeElement();
//                    }
//                };
//            }]
//    );
//}(window.angular));

(function(ng) {
    ng.module('app').directive('inlineControl', [
        '$log',
        '$compile',
        function($log, $compile) {
            function addArrayToElement(array, el) {
                if (array.length > 0 && el) {
                    for (var i = 0; i < array.length; i++) {
                        if (!el.classList.contains(array[i])) {
                            el.classList.add(array[i]);
                        }
                    }
                }
            }

            function removeArrayFromElement(array, el) {
                if (array.length > 0 && el) {
                    for (var i = 0; i < array.length; i++) {
                        if (el.classList.contains(array[i])) {
                            el.classList.remove(array[i]);
                        }
                    }
                }
            }

            function hideChildren(el) {
                var elements = el.querySelectorAll("article");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.display = 'none';
                }
            }

            function showChildren(el) {
                var elements = el.querySelectorAll("article");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.display = 'block';
                }
            }

            return {
                restrict: 'E',
                scope: {
                    firstState: '@', // css classes that are always "active" on element
                    secondState: '@', // css classes that are added and removed according to state
                    confirmElementId: '@',
                    confirmAction: '&',
                    declineElementId: '@',
                    declineAction: '&',
                    clearData: '&',
                    state: '=?'
                },

                link: function(scope, element, attrs) {
                    var el = element[0];

                    var firstStateClasses = null;
                    var secondStateClasses = null;
                    scope.state = true;

                    if (scope.firstState) {
                        firstStateClasses = scope.firstState.split(' ');
                    }

                    if (scope.secondState) {
                        secondStateClasses = scope.secondState.split(' ');
                    }

                    if (scope.confirmElementId) {
                        var confirmElement = el.querySelector('#' + scope.confirmElementId);
                        if (confirmElement) {
                            $(confirmElement).on('click', function(e) {
                                scope.confirmAction();
                                e.stopPropagation();
                            });
                        }
                    }

                    if (scope.declineElementId) {
                        var declineElement = el.querySelector('#' + scope.declineElementId);
                        if (declineElement) {
                            $(declineElementId).on('click', function() {
                                scope.declineAction();
                            });
                        }
                    }

                    var inputs = el.querySelectorAll('input');
                    for (var i = 0; i < inputs.length; i++) {
                        $(inputs[i]).click(function(e) {
                            e.stopImmediatePropagation();
                        });
                        $(inputs[i]).keypress(function(e) {
                            if (e.which == 13) {
                                scope.confirmAction();
                            }
                        });
                    }

                    addArrayToElement(firstStateClasses, el);

                    el.addEventListener('click', onClick);

                    function onClick(e) {
                        scope.state = !scope.state;
                        changeState(scope.state);
                    }

                    function firstState() {
                        addArrayToElement(secondStateClasses, el);

                    }

                    function secondState() {
                        removeArrayFromElement(secondStateClasses, el);

                        scope.clearData();
                    }

                    function changeState(newState) {
                        if (!newState) {
                            firstState();
                        } else {
                            secondState();
                        }
                    }

                    scope.$watch('state', function(newState, oldState) {
                        changeState(newState);
                    });

                    scope.$on('$destroy', function() {
                        $(el).off();
                        if (inputs) {
                            for (var i = 0; i < inputs.length; i++) {
                                $(inputs[i]).off();
                            }
                        }
                        if (confirmElement) {
                            $(confirmElement).off();
                        }

                        if (declineElement) {
                            $(declineElement).off();
                        }
                    });
                }
            };
        }
    ]);
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .directive('menuItem', menuItem);

    menuItem.$inject = ['$location', '$state', '$rootScope'];

    function menuItem($location, $state, $rootScope) {

        var directive = {
            restrict: 'EA',
            link: linker
        };

        return directive;

        ///////////////////////

        function linker(scope, element, attrs) {

            var menuPath = element.attr('menu-path') || element.find('a').attr('menu-path');

            var activeClass = attrs.activeClass || 'active';

            var currentState = $state.current;

            function isActive(toState, fromState) {

                var link = '/' + menuPath;

                var location = $location.$$path;

                var asset = '/asset';

                if (menuPath === toState.data.section) {

                    element.addClass(activeClass);

                } else {

                    element.removeClass(activeClass);

                }
            }

            if (currentState.data && currentState.data.section) {

                isActive(currentState);

            }

            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

                if (toState.data && toState.data.section) {

                    isActive(toState);

                }

                if (toState.data && fromState.data && toState.data.section && toState.data.section) {

                    isActive(toState, fromState);

                }
            });

        }
    }
}(window.angular));

(function (ng) {
    ng.module('app').directive('modalHeight',
        ['$window',
            function ($window, $modal) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {
                        var el = element[0];

                        function resizeElement() {
                            setTimeout(function(){
                                var hgt = el.offsetHeight;
                                if (el) {
                                    if (el.offsetHeight < window.innerHeight) {
                                        el.classList.add('center');
                                        $(el).css({top:'50%', 'margin-top': '-' +hgt/2+ 'px'});
                                    }
                                    else {
                                        el.classList.remove('center');
                                        $(el).removeAttr('style');
                                    }
                                }

                            }, 300);
                        }
                        ng.element($window).on('resize', function () {
                            resizeElement();
                        });


                        ng.element($modal).on('click', function () {
                            resizeElement();
                        });

                        scope.$watch(function () {
                                return el.offsetHeight;
                            },
                            function (newValue, oldValue) {
                                if (newValue != oldValue) {
                                    resizeElement();
                                }
                            });

                    }
                };
            }]
    );
}(window.angular));

(function(ng) {
    ng.module('app').directive('randomColor', [
        function() {
            function getRandomColor() {
                return "#" + Math.random().toString(16).slice(2, 8);
            }

            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    element[0].style.color = getRandomColor();
                }
            };
        }
    ]);
}(window.angular));

(function(ng) {
    ng.module('app').directive('scrollTo', function() {
        return function(scope, element, attrs) {
            scope.$watch(attrs.scrollTo, function(value) {
                if (value) {
                    var pos = $(element).position().top + $(element).closest('.grid-col-container').scrollTop();
                    $(element).closest('.grid-col-container').animate({
                        scrollTop: pos
                    }, 500);
                }
            });
        }
    });
}(window.angular));

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

(function(ng) {
    ng
        .module('app')
        .factory('service.dayTime', serviceDayTime);

    serviceDayTime.$inject = [];

    function serviceDayTime() {

        var service = {
            dayTime: returnDayTimeService,
            localTimeCronToUTCTime: generateCronForUTC,
            utcCronToLocalTime: generateCronForLocalTime
        };

        return service;
        ////////////////////////////

       function returnDayTimeService() {
           var dayTime = [{
                is: 'sensor',
                profile: {
                    type: 'cron'
                },
                id: '5412eab3da8ab71d14bfffff',
                name: 'Day and Time',
                type: 'dayTime',
                iconKey: 'fa-day-time',
                description: 'Set day and time to trigger this rule',
                detailsPage: ''
            }];

            return dayTime;
       };

       function generateCronForLocalTime (utcCron){
        var  utcTimeCron = utcCron.split(" ");
            var min = utcTimeCron[1];
            var hour = utcTimeCron[2];
            var dayOfMonth = utcTimeCron[3];
            var month = utcTimeCron[4];
            var daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            var selectedDays;

            if (utcCron[5]) {
                selectedDays = utcTimeCron[5].split(",");
            }

            var offset = new Date().getTimezoneOffset();
            var localMinutes = 0;
            var cron = '0 ';
            var hours = parseInt(hour);
            var minutes = parseInt(min);


            localMinutes = hours * 60 + minutes;


            var diff = localMinutes - offset;

            var shiftDays;

            if (diff < 0) {
                if (hours == 0) {
                    hours = 24 + Math.floor(diff / 60);
                    minutes = (((minutes + 60) + offset) % 60);
                } else {
                    minutes = ((diff) % 60) * (-1);
                }
                shiftDays = 'previous';
            } else if (diff >= 1440) {
                hours = Math.floor(diff / 60) - 24;
                minutes = (diff) % 60;
                shiftDays = 'next';

            } else {

                hours = Math.floor(diff / 60);
                minutes = diff % 60;
            }


            cron += minutes + ' ';
            cron += hours + ' ';
            cron += '? * ';

            for (var i = 0; i < selectedDays.length; i++) {
                var dayOrder = daysOfWeek.indexOf(selectedDays[i]);

                if (shiftDays == 'previous') {
                    if (dayOrder > 0) {
                        cron += daysOfWeek[dayOrder - 1] + ',';
                    } else {
                        cron += daysOfWeek[daysOfWeek.length - 1] + ',';
                    }
                } else if (shiftDays == 'next') {
                    if (dayOrder == (daysOfWeek.length - 1)) {
                        cron += daysOfWeek[0] + ',';
                    } else {
                        cron += daysOfWeek[dayOrder + 1] + ',';
                    }
                } else {
                    cron += selectedDays[i] + ',';
                }

            };
            cron = cron.slice(0, -1);

            return cron;
       };



        function generateCronForUTC(localTimeCron) {

            var localCron = localTimeCron.split(" ");
            var min = localCron[1];
            var hour = localCron[2];
            var dayOfMonth = localCron[3];
            var month = localCron[4];
            var daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            var selectedDays;

            if (localCron[5]) {
                selectedDays = localCron[5].split(",");
            }

            var offset = new Date().getTimezoneOffset();
            var localMinutes = 0;
            var cron = '0 ';
            var hours = parseInt(hour);
            var minutes = parseInt(min);


            localMinutes = hours * 60 + minutes;


            var diff = localMinutes + offset;

            var shiftDays;

            if (diff < 0) {
                if (hours == 0) {
                    hours = 24 + Math.floor(diff / 60);
                    minutes = (((minutes + 60) + offset) % 60);
                } else {
                    minutes = ((diff) % 60) * (-1);
                }
                shiftDays = 'previous';
            } else if (diff > 1440) {
                hours = Math.floor(diff / 60) - 24;
                minutes = (diff) % 60;
                shiftDays = 'next';

            } else {

                hours = Math.floor(diff / 60);
                minutes = diff % 60;
            }


            cron += minutes + ' ';
            cron += hours + ' ';
            cron += '? * ';

            for (var i = 0; i < selectedDays.length; i++) {
                var dayOrder = daysOfWeek.indexOf(selectedDays[i]);

                if (shiftDays == 'previous') {
                    if (dayOrder > 0) {
                        cron += daysOfWeek[dayOrder - 1] + ',';
                    } else {
                        cron += daysOfWeek[daysOfWeek.length - 1] + ',';
                    }
                } else if (shiftDays == 'next') {
                    if (dayOrder == (daysOfWeek.length - 1)) {
                        cron += daysOfWeek[0] + ',';
                    } else {
                        cron += daysOfWeek[dayOrder + 1] + ',';
                    }
                } else {
                    cron += selectedDays[i] + ',';
                }

            };
            cron = cron.slice(0, -1);

            return cron;
        }

    };
}(window.angular));
(function(ng) {
    ng
        .module('app')
        .factory('utility.deviceIcons', deviceIcons);
    deviceIcons.$inject = [];

    function deviceIcons() {

        var service = {
            getIcon: getIcon
        };

        var icons = {
            'binary-sensor': 'sl-device-flood-sensor',
            'binary-switch': 'sl-device-relay',
            'flood-sensor': 'sl-device-flood-sensor',
            'motion-sensor': 'sl-device-motion-sensor',
            'wall-plug': 'sl-device-wall-plug',
            'device-custom': 'sl-device-custom',
            'intel-edison': 'sl-device-intel-edison',
            'quick-demo': 'sl-device-mobile',
            'proximus-lora': 'sl-device-lora',
            'device-proximus-lora': 'sl-device-lora',

            gateway: 'sl-device-gateway',

            arduino: 'sl-device-arduino',
            rpi: 'sl-device-rpi',
            fa_envelope: 'sl-service-email',
            fa_day_time: 'sl-service-calendar',
            asset: 'sl-asset-default',
            sensor: 'sl-asset-sensor',
            actuator: 'sl-asset-actuator',
            virtual: 'sl-asset-virtual',
            config: 'sl-asset-config',
            custom: 'sl-device-custom'
        };

        return service;

        //////////////////////////////

        function getIcon(deviceName) {
            if (deviceName === null) {
                return icons.custom;
            }

            var icon = icons[deviceName];

            if (icon) {
                return icon;
            } else {
                return icons.custom;
            }
        }

    }
}(window.angular));

(function(ng) {
    ng.module('app').factory('utility.geoLocation', [
        '$q',
        function($q) {
            return {
                getLocation: function() {
                    if (!navigator.geolocation) {
                        return;
                    }
                    var deferred = $q.defer();
                    navigator.geolocation.getCurrentPosition(deferred.resolve, deferred.reject);
                    return deferred.promise;
                }
            }
        }
    ]);
}(window.angular));

(function (ng) {
    ng.module('app').factory('utility.googleMaps', [
        '$q',
        '$log',
        '$rootScope',
        '$document',
        '$window',
        function ($q, $log, $rootScope, $document, $window) {
            var apiKey = "AIzaSyBbahKWU9YY3eAQ2yHNJW3QENyZNG_SY8w";
            var deferred = $q.defer();

            $window.googleMapsLoadDone = function () {
                deferred.resolve($window.google);
            };

            function loadScript() {
                var script = $document[0].createElement('script');

                script.type = 'text/javascript';
                script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=googleMapsLoadDone&libraries=places,geometry&key=' + apiKey;

                $document[0].head.appendChild(script);
            }

            if (!ng.isDefined($window.google)) {
                loadScript();
            }

            return deferred.promise;
        }
    ]);
}(window.angular));

(function() {

    var app = angular
        .module('app')
        .factory('httpTokenInterceptor', HttpTokenInterceptor);

    HttpTokenInterceptor.$inject = [
        '$q',
        '$injector',
        'api.url',
        'localStorageService',
        'session'
    ];

    function HttpTokenInterceptor($q, $injector, apiUrl, localStorageService, session) {

        var service = {
            request: request,
            responseError: responseError
        };

        return service;

        ///////////////////////

        function request(config) {

            if (isAttApi(config.url)) {
                config.headers = config.headers || {};

                var accessToken = session.authentication().accessToken;

                if (accessToken && !config.headers.Authorization) {
                    config.headers.Authorization = 'Bearer ' + accessToken;
                }
            }

            return config || $q.when(config);
        }

        function responseError(rejection) {

            var deferred = $q.defer();

            if (rejection.status === 401 && isAttApi(rejection.config.url)) {

                if (rejection.config.__donotrefreshtoken) {
                    deferred.reject(rejection);
                    return deffered.promise;
                }

                var state = $injector.get('$state');

                if (!rejection.config.__tokenrefreshed) {

                    var authService = $injector.get('authService');
                    var refreshToken = session.authentication().refreshToken;

                    session.clearAuthenticationData();

                    if (refreshToken !== null) {
                        authService.refreshToken(refreshToken)
                            .then(function() {
                                rejection.config.__tokenrefreshed = true;
                                var config = rejection.config;
                                delete config.headers.Authorization;
                                retryHttpRequest(rejection.config, deferred);
                            })
                            .catch(function() {
                                state.go('login');
                            });
                    } else {
                        state.go('login');
                    }

                } else {
                    state.go('unauthorized');
                }

            } else {

                deferred.reject(rejection);
            }

            return deferred.promise;
        }

        function isAttApi(url) {
            return url.substring(0, apiUrl.length) == apiUrl;
        }

        function retryHttpRequest(config, deferred) {

            var $http = $injector.get('$http');

            $http(config)
                .then(function(response) {
                    deferred.resolve(response);
                })
                .catch(function(response) {
                    deferred.reject(response);
                });
        }

        function getKeyFromLocalStorageAuth(key) {

            var auth = session.authentication();

            return (auth && auth[key]) ? auth[key] : null;
        }
    }

    app.config(['$httpProvider', function($httpProvider) {

        $httpProvider.interceptors.push('httpTokenInterceptor');

    }]);

}());

(function(ng) {
    ng.module('app').factory('utility.inputStateValidator', [
        function() {
            function isEmpty(val) {
                if (val == '' || !val) {
                    return false;
                }
                return true;
            }

            return {
                isValidInteger: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }
                    return !isNaN(val);
                },

                isValidString: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }
                    return true;
                },

                isValidBoolean: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }

                    if (val == 'true' || val == 'false') {
                        return true;
                    }
                    return false;
                },

                isValidJson: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }

                    try {
                        ng.fromJSON(val);
                        return true;
                    } catch (e) {
                        return false;
                    }
                },


                validateByType: function(type, val) {
                    switch (type) {
                        case 'bool':
                            return this.isValidBoolean(val);
                        case 'int':
                            return this.isValidInteger(val);
                        case 'string':
                            return this.isValidString(val);
                        case 'json':
                            return this.isValidJson(val);
                    }
                    return false;
                }

            };
        }
    ]);
}(window.angular));

(function() {

    angular
        .module('app')
        .factory('session', session);

    session.$inject = ['$q', '$log', 'localStorageService', '$rootScope', 'notifyService'];

    function session($q, $log, localStorageService, $rootScope, notifyService) {

        var service = {
            init: init,
            authentication: getAuthenticationData,
            saveAuthenticationData: saveAuthenticationData,
            clearAuthenticationData: clearAuthenticationData,
            getUserDetails: getUserDetails,
            setUserDetails: setUserDetails
        };

        return service;

        //////////////////////////////////////////////

        function init() {

            if (!getAuthenticationData()) {

                clearAuthenticationData();

            }

            $rootScope.getCurrentUser = function() {

                return getAuthenticationData();

            };
        }

        function getAuthenticationData() {

            var data = localStorageService.get('authenticationData');

            if (isValidAccessToken(data)) {

                data.isAuth = true;

            }

            return data;
        }

        function saveAuthenticationData(data) {

            if (data) {

                data.isAuth = true;

            }

            localStorageService.set('authenticationData', {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                issued: data['.issued'],
                expires: data['.expires'],
                rmq: {
                    clientId: data['rmq:clientId'],
                    clientKey: data['rmq:clientKey']
                },
                userName: data.userName,
                isAuth: data.isAuth
            });
        }

        function clearAuthenticationData() {

            localStorageService.set('authenticationData', {
                accessToken: null,
                refreshToken: null,
                issued: null,
                expires: null,
                rmq: null,
                userName: '',
                isAuth: false
            });

            localStorageService.set('userDetails', null);
        }

        function setUserDetails(data) {

            localStorageService.set('userDetails', data);

        }

        function getUserDetails() {

            return localStorageService.get('userDetails');

        }

        function isValidAccessToken(data) {

            if (data) {

                return new Date(data.expires) > new Date();

            } else {

                return false;

            }
        }

    }
}());

(function(ng) {
    ng.module('app').factory('utility.typeConverter', function() {
        return function(toType, fromType) {
            switch (toType) {
                case 'int':
                    return parseInt(fromType);
                case 'string':
                    return fromType;
                case 'bool':
                    if (fromType == 'true') return true;
                    else return false;
                case 'json':
                    return fromType;
            }
        };
    });
}(window.angular));

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

(function(ng) {
    ng.module('app').factory('utility.viewConfigs', [

        function() {

            var jsonEditorOptions = {
                lineWrapping: true,
                lineNumbers: false,
                mode: 'application/json',
                theme: 'neo',
                smartIndent: true,
                indentUnit: 4,
                tabSize: 4
            };

            return {
                getJsonEditorOptions: function() {
                    return jsonEditorOptions;
                }
            }
        }
    ]);
}(window.angular));

(function(ng) {

    ng.module('app').filter('assetTypeFilter', function() {
        return function(items, assetType) {
            var filtered = [];

            if (!items) {
                return filtered;
            }

            if (!assetType) {
                return items;
            }

            for (var assetIndex = 0; assetIndex < items.length; assetIndex++) {
                if (items[assetIndex].is == assetType || items[assetIndex].is == 'virtual') {
                    filtered.push(items[assetIndex]);
                }
            }

            return filtered;
        };
    });

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .filter('assetValueFormat', assetValueFormatFilter);

    assetValueFormatFilter.$inject = ['api.assetsService', '$filter'];

    function assetValueFormatFilter(assetsService, $filter) {
        return function(item, profile) {

            if (!profile) {
                return item;
            }

            if (!profile.type) {
                return item;
            }

            var profileType = assetsService.normalizeProfileType(profile.type);

            if (profileType == 'datetime') {
                return $filter('amDateFormat')(item, 'MMMM Do YYYY');
            }

            if (profileType == 'cron') {
                return $filter('cronFilter')(item);
            }

            return item;
        };
    }
}(window.angular));

(function(ng) {

    ng.module('app').filter('capitalize', function() {
        return function(input, scope) {
            if (!input) {
                return;
            }

            input = input.toLowerCase();
            return input.substring(0, 1).toUpperCase() + input.substring(1);
        };
    });

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .filter('cronFilter', cronFilter);

    cronFilter.$inject = [];

    function cronFilter() {
        return function(item) {
            var prettyCron = '';

            if (item) {

                var cron = item.split(" ");
                var min = cron[1];
                var hour = cron[2];
                var dayOfMonth = cron[3];
                var month = cron[4];
                var daysOfWeek;
                var timeOfDay = 'AM';

                var days = '';
                if (cron[5]) {
                    daysOfWeek = cron[5].split(",");

                    for (var i = 0; i < daysOfWeek.length; i++) {

                        switch (daysOfWeek[i]) {
                            case 'MON':
                                days += "Monday, ";
                                break;
                            case 'TUE':
                                days += "Tuesday, ";
                                break;
                            case 'WED':
                                days += "Wednesday, ";
                                break;
                            case 'THU':
                                days += "Thursday, ";
                                break;
                            case 'FRI':
                                days += "Friday, ";
                                break;
                            case 'SAT':
                                days += "Saturday, ";
                                break;
                            case 'SUN':
                                days += "Sunday, ";
                                break;
                        }
                    }
                }

                if (daysOfWeek) {
                    if (daysOfWeek[0] == '*') {
                        return "This rule will not trigger without any selected day!"
                    }
                }

                if (days == 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, ') {
                    prettyCron += 'Every weekday';
                } else if (days == 'Saturday, Sunday, ') {
                    prettyCron += 'Every weekend';
                } else if (days == 'Monday, Tuesday, Wednesday, Thursday, Friday, ') {
                    prettyCron += 'Every workday';
                } else {
                    prettyCron += days.slice(0, -2);
                }

                prettyCron += ' at ';

                var cHour = parseInt(hour);
                var normalizedHours = null;
                var normalizedMinutes = null;

                if (min == '0' || min == '5') {
                    normalizedMinutes = '0' + min;
                } else {
                    normalizedMinutes = min;
                }

                if (cHour > 12 && cHour < 24) {
                    timeOfDay = 'PM';
                    normalizedHours = (hour - 12).toString();
                    if (parseInt(normalizedHours) < 10) {
                        prettyCron += '0' + normalizedHours + ':' + normalizedMinutes + ' ' + timeOfDay;
                    } else {
                        prettyCron += normalizedHours + ':' + normalizedMinutes + ' ' + timeOfDay;
                    }

                } else if (cHour < 12) {
                    timeOfDay = 'AM';
                    if (cHour < 10) {
                        prettyCron += '0' + cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                    } else {
                        prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                    }
                } else if (cHour == 12) {
                    timeOfDay = 'PM';
                    prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;

                } else if (cHour == 0) {
                    timeOfDay = 'AM';
                    prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                } else if (cHour == 24) {
                    timeOfDay = 'AM';
                    prettyCron += '00' + ':' + normalizedMinutes + ' ' + timeOfDay;
                }
            }

            return prettyCron;
        };
    }
}(window.angular));

(function(ng) {

    ng
        .module('app')
        .filter('devicesWithAssetFilter', devicesWithAssetFilterFactory);

    function devicesWithAssetFilterFactory() {

        return filterMethod;

        ////////

        function filterMethod(items, assetType) {

            if (!items) {
                return [];
            }

            if (!assetType) {
                return items;
            }

            if (assetType == '*') {
                return findDevicesContainingAnyAsset(items);
            }

            return findDevicesContainingAssetsOfType(items, assetType);
        }

        function findDevicesContainingAnyAsset(items) {

            var filtered = [];

            for (var deviceIndex = 0; deviceIndex < items.length; deviceIndex++) {
                if (items[deviceIndex].assets.length > 0) {
                    filtered.push(items[deviceIndex]);
                }
            }

            return filtered;
        }

        function findDevicesContainingAssetsOfType(items, assetType) {

            var filtered = [];

            for (var deviceIndex = 0; deviceIndex < items.length; deviceIndex++) {
                for (var assetIndex = 0; assetIndex < items[deviceIndex].assets.length; assetIndex++) {
                    if (items[deviceIndex].assets[assetIndex].is == assetType || items[deviceIndex].assets[assetIndex].is == 'virtual') {
                        filtered.push(items[deviceIndex]);
                        break;
                    }

                }
            }

            return filtered;
        }
    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .controller('TermsOfUseController', TermsOfUseController);

    TermsOfUseController.$inject = ['$state', 'termsOfUseRepository', 'userContext'];

    function TermsOfUseController($state, termsOfUseRepository, userContext) {

        var vm = this;

        vm.termsOfUseHtml = null;

        vm.acceptTerms = acceptTerms;

        vm.showAcceptButton = userContext.user && !userContext.user.termsAcceptedOn;

        activate();

        ////////////////

        function activate() {

            termsOfUseRepository.getTermsOfUse()
                .then(function(termsOfUseHtml) {

                    vm.termsOfUseHtml = termsOfUseHtml;

                });
        }

        function acceptTerms() {

            termsOfUseRepository.acceptTermsOfUse()
                .then(function() {

                    userContext.load().then(function() {

                        $state.go('home');

                    });

                });

        }
    }
})();

(function() {

    var app = angular
        .module('app')
        .factory('ToUInterceptor', ToUInterceptor);

    ToUInterceptor.$inject = [
        '$q',
        '$injector',
        'api.url',
        'localStorageService',
        'session'
    ];

    function ToUInterceptor($q, $injector, apiUrl, localStorageService, session) {

        var service = {
            request: request
        };

        return service;

        ///////////////////////

        function request(config) {

            if (isAttApi(config.url)) {

                var userDetails = session.getUserDetails();

                if (userDetails && !userDetails.termsAcceptedOn && !config.__ingoreTermsOfUseAcceptance) {

                    var state = $injector.get('$state');

                    state.go('termsOfUse');

                    return $q.reject({ isSilentError: true });
                }

            }

            return config || $q.when(config);
        }

        function isAttApi(url) {

            return url.substring(0, apiUrl.length) == apiUrl;

        }
    }

    app.config(['$httpProvider', function($httpProvider) {

        $httpProvider.interceptors.push('ToUInterceptor');

    }]);

}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('termsOfUseRepository', factory);

    factory.$inject = ['utils', 'session', '$http', 'api.url', 'termsOfUseCDNUrl'];

    function factory(utils, session, $http, apiUrl, termsOfUseCDNUrl) {

        var service = {
            getTermsOfUse: getTermsOfUse,
            acceptTermsOfUse: acceptTermsOfUse
        };

        return service;

        ////////////////

        function getTermsOfUse() {

            return $http.get(termsOfUseCDNUrl)
                .then(function(response) {

                    return response.data;

                });
        }

        function acceptTermsOfUse() {

            var url = apiUrl + 'terms/latest/acceptance';

            return $http.post(url, null, {

                __ingoreTermsOfUseAcceptance: true

            });

        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('awaitingContent', awaitingContent);

    awaitingContent.$inject = [];

    function awaitingContent() {

        var directive = {
            link: link,
            restrict: 'A'
        };

        return directive;

        function link(scope, element, attrs) {

            attrs.$observe('awaitingContent', function(val) {

                if (!val) {

                    var loaderElement = element.find('loader-wrapper');

                    if (loaderElement.length) {

                        loaderElement.show();

                    } else {

                        element.append('<loader-wrapper class="small overlay-loader">' +
                            '<loader>' +
                            '<ld/>' +
                            '<ld/>' +
                            '<ld/>' +
                            '</loader>' +
                            '</loader-wrapper>');

                    }
                } else {

                    element.find('loader-wrapper').hide();

                }
            });
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('buttonLoadMore', buttonLoadMore);

    function buttonLoadMore() {

        // Usage:
        // function 'load', linked using scope property 'load' needs to return promise
        var directive = {
            templateUrl: '/assets/js/app/widgets/button-load-more.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                load: '&',
                size: '='
            }
        };
        return directive;
    }

    function Controller() {

        var vm = this;
        vm.isLoading = false;
        vm.hasError = false;
        vm.loadMore = loadMore;
        vm.thereIsNoMoreItems = false;

        function loadMore() {

            if (vm.load) {

                vm.isLoading = true;
                vm.hasError = false;

                vm.load().then(function(result) {
                    if (result && angular.isArray(result)) {

                        if (vm.size > result.length) {
                            vm.thereIsNoMoreItems = true;
                        }
                    }

                    return result;
                }).catch(function() {
                    vm.hasError = true;
                }).
                finally(function() {
                    vm.isLoading = false;
                });
            }
        }
    }
})();

(function() {

    angular
        .module('app')
        .directive('controlHandler', controlHandler);

    controlHandler.$inject = ['$compile', 'asset.repository', 'api.controlsService', 'utils'];

    function controlHandler($compile, assetRepository, controlsService, utils) {

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                controlName: '=',
                asset: '=',
                enabled: '='
            }
        };

        return directive;

        ///////////////////////////

        function getControl(asset) {

            var widgetName = null;

            if (asset.control && asset.control.name) {

                widgetName = asset.control.name;

            } else {

                widgetName = controlsService.getDefaultControl(asset);

            }

            var template = '<{0}-control enabled="enabled" value="asset.state.value" profile="asset.profile" id="asset.id" on-change="onChange(val)" asset="asset" configuration="asset.control.extras"></{0}-control>'.format(widgetName);

            return template;

        }

        function linker(scope, element, attrs) {

            scope.onChange = function(val) {

                if (scope.enabled) {

                    return assetRepository.publishCommand(scope.asset.id, val);

                }

                return utils.$q.when();

            };

            scope.$watch('asset.control.name', function() {
                element.html(getControl(scope.asset));

                $compile(element.contents())(scope);

            });
        }
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('flexTextarea', flexTextarea);

    flexTextarea.$inject = ['$timeout'];

    function flexTextarea($timeout) {

        var directive = {
            bindToController: true,
            transclude: true,
            controller: FlexTextController,
            templateUrl: '/assets/js/app/widgets/flex-textarea.html',
            controllerAs: 'vm',
            link: link,
            replace: true,
            restrict: 'E',
            scope: {
                data: '=',
                saved: '='
            }
        };
        return directive;

        function link(scope, element, attrs, ctrl, transclude) {

            var textarea = element.find('textarea');
            var oldValue = '';

            if (textarea) {

                $(textarea).click(function() {
                    $timeout(function() {
                        oldValue = textarea.val();
                    }, 1);
                });

                element.find('to-replace').replaceWith(transclude());

                if (textarea) {
                    $(textarea).focusout(function(e) {

                        $timeout(function() {

                            if (!scope.vm.saved) {
                                scope.$apply(function() {
                                    scope.vm.data = oldValue;
                                });
                            }
                        }, 100);
                    });
                }
            }
        }

        function FlexTextController() {

        }
    }
})();

(function(ng) {

    ng
        .module('app')
        .directive('focusIf', FocusIf);

    FocusIf.$inject = ['$timeout'];

    function FocusIf($timeout) {

        var directive = {
            restrict: 'A',
            link: linker
        };

        return directive;
        
        ////////////////////////

        function linker(scope, element, attrs) {

            var focusClass = attrs.focusClass;

            if (!focusClass)
                focusClass = 'focus';

            scope.$watch(attrs.focusIf, watchHandler);

            function watchHandler(value) {

                if (value) {

                    $(element[0]).addClass(focusClass);

                    $timeout(function() {
                        $(element[0]).removeClass(focusClass);
                    }, 1000);
                }
            }
        }

        function randomString(length, chars) {
            var mask = '';
            if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
            if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (chars.indexOf('#') > -1) mask += '0123456789';
            if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
            var result = '';
            for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
            return result;
        }

    }
}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .directive('pageLoader', pageLoader);

    function pageLoader() {

        return {
            restrict: 'EA',
            link: function(scope, element) {
                // Store original display mode of element
                var shownType = element.css('display');

                scope.$on('$routeChangeStart', function() {
                    element.removeClass('hidden');
                });

                scope.$on('$routeChangeError', function() {
                    element.addClass('hidden');
                });

                scope.$on('$routeChangeEnd', function() {
                    element.addClass('hidden');
                });

                // Initially hidden
                hideElement();
            }
        };
    }
})();

(function(ng) {
    ng
        .module('app')
        .directive('scrollIf', scrollIf);

    scrollIf.$inject = ['$timeout', '$window'];

    function scrollIf($timeout, $window) {

        return function(scope, el, attrs) {

            scope.$watch(attrs.scrollIf, watchHandler);

            function watchHandler(value) {

                $timeout(function() {

                    if (value) {

                        var scrollingParent = getScrollingParent(el[0]);
                        var centerScroll = scrollingParent.scrollHeight;
                        
                        $(scrollingParent).animate({
                            scrollTop: centerScroll
                        }, 1000);
                    }
                });
            }

            function getScrollingParent(element) {
                element = element.parentElement;
                while (element) {
                    if (element.scrollHeight !== element.clientHeight) {
                        return element;
                    }
                    element = element.parentElement;
                }
                return null;
            };
        };
    };

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .directive('subscribedIndicator', subscribedIndicator);

    function subscribedIndicator() {

        var directive = {
            bindToController: true,
            controller: Controller,
            templateUrl: '/assets/js/app/widgets/subscribed-indicator.html',
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                itemId: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['GroundContext'];

    function Controller(groundContext) {

        var vm = this;
        vm.isSubscribed = isSubscribed;

        function isSubscribed() {

            var ground = groundContext.find(vm.itemId);

            if (!ground) {
                return false;
            }

            return ground.isSubscribed();
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('slTabs', slTabs);

    function slTabs() {

        var directive = {

            template: '<div class="tab-panel">' +
                '<ul class="tab-control-header">' +
                ' <li ng-class="{ active:tab.active }" ng-repeat="tab in vm.tabs | orderBy:\'order\' track by $index">' +
                ' <a id="{{tab.name}}" ng-click="vm.select(tab)"><i ng-if="tab.icon" class="{{tab.icon}}"></i><span>{{tab.heading}}</span></a>' +
                ' </li>' +
                '</ul>' +
                '<ng-transclude class="tab-holder">' +
                '</ng-transclude>' +
                '</div>',
            bindToController: true,
            replace: true,
            transclude: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                onTabClick: '&',
                activeTab: '=?'
            }
        };
        return directive;
    }

    Controller.$inject = ['$scope', 'orderByFilter'];

    function Controller($scope, orderByFilter) {

        var vm = this;
        vm.tabs = [];
        vm.activeTab = null;
        vm.select = select;
        vm.selectByName = selectByName;
        vm.addTab = addTab;
        vm.removeTab = removeTab;

        $scope.$watch('vm.activeTab', function(tabName) {
            if (tabName) {
                selectByName(tabName);
            }
        });

        function select(selectedTab) {

            vm.activeTab = selectedTab.name;

            if (vm.onTabClick) {
                vm.onTabClick();
            }
        }

        function selectByName(tabName) {
            angular.forEach(vm.tabs, function(tab) {

                if (tab.name !== tabName) {
                    tab.active = false;
                } else {
                    tab.active = true;
                }
            });
        }

        function addTab(tab) {

            vm.tabs.push(tab);
            if (vm.tabs.length === 1) {
                tab.active = true;
            }

            if (!vm.activeTab) {
                if (vm.tabs.length === 1) {
                    tab.active = true;
                } else {
                    if (tab.order) {
                        selectByName(orderByFilter(vm.tabs, 'order')[0].name);
                    }
                }
            }

        }

        function removeTab(tab) {

            var index = vm.tabs.indexOf(tab);
            if (index !== -1) {

                vm.tabs.splice(index, 1);

                if (tab.active && vm.tabs.length > 0) {
                    vm.tabs[0].active = true;
                }
            }
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('slTab', slTab);

    function slTab() {

        var directive = {
            link: link,
            restrict: 'E',
            transclude: true,
            template: '<div role="tabpanel" ng-show="active" ng-transclude></div>',
            require: '^slTabs',
            scope: {
                heading: '@',
                icon: '@',
                name: '@',
                order: '@'
            }
        };
        return directive;

        function link($scope, elem, attr, tabsetCtrl) {

            $scope.active = false;
            tabsetCtrl.addTab($scope);

            $scope.$on('$destroy', function() {
                console.log('destroy tab has been called');
                tabsetCtrl.removeTab($scope);
            });
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('app.config', appConfig);

    appConfig.$inject = [
        'api.url',
        'api.clientId',
        'broker.url',
        'broker.port',
        'broker.sourceRoot',
        'public.token',
        'public.clientId',
        'public.clientKey',
        'public.urlShortenerApiKey',
        'public.urlShortenerApiUrl',
        'origin'
    ];

    function appConfig(apiUrl, apiClientId, brokerUrl, brokerPort, brokerSourceRoot, publicToken, publicClientId, publicClientKey, urlShortenerApiKey, urlShortenerApiUrl, origin) {
        var service = {
            api: {
                url: apiUrl,
                clientId: apiClientId
            },
            broker: {
                url: brokerUrl,
                port: brokerPort,
                sourceRoot: brokerSourceRoot
            },
            guest: {
                token: publicToken,
                clientId: publicClientId,
                clientKey: publicClientKey
            },
            urlShortener: {
                key: urlShortenerApiKey,
                url: urlShortenerApiUrl
            },
            origin: origin
        };
        return service;
    }
})();

(function() {

    angular
        .module('app')
        .factory('exception', exception);

    exception.$inject = ['$log', 'logger', 'utils'];

    function exception($log, logger, utils) {

        var service = {
            catcher: catcher
        };

        return service;

        /////////////////////////

        function catcher(message) {

            return function(reason) {

                var errorMessage = message;

                if (isClientError(reason)) {

                    var msg = getErrorMessage(reason);

                    if (msg) {

                        errorMessage = msg;

                    }

                }

                if (!reason.isSilentError) {

                    logger.error(errorMessage, reason, 'Error: ');

                }

                return utils.$q.reject(reason);
            };
        }

        function isClientError(reason) {

            return reason.status >= 400 && reason.status <= 499;

        }

        function getErrorMessage(reason) {

            if (reason.data) {

                if (reason.data.error_description) {

                    return reason.data.error_description;

                }

                if (reason.data.error) {

                    return reason.data.error;

                }

                if (reason.data.message) {

                    return reason.data.message;

                }

            }

            return undefined;

        }
    }

}());

// (function(ng) {

//     ng
//         .module('app')
//         .provider('exceptionHandler', exceptionHandlerProvider)
//         .config(config);

//     /**
//      * Must configure the exception handling
//      * @return {[type]}
//      */
//     function exceptionHandlerProvider() {
//         /* jshint validthis:true */
//         this.config = {
//             appErrorPrefix: undefined
//         };

//         this.configure = function(appErrorPrefix) {
//             this.config.appErrorPrefix = appErrorPrefix;
//         };

//         this.$get = function() {
//             return {
//                 config: this.config
//             };
//         };
//     }

//     /**
//      * Configure by setting an optional string value for appErrorPrefix.
//      * Accessible via config.appErrorPrefix (via config value).
//      * @param  {[type]} $provide
//      * @return {[type]}
//      */

//     config.inject = ['$provide'];

//     function config($provide) {
//         $provide.decorator('$exceptionHandler', extendExceptionHandler);
//     }

//     *
//      * Extend the $exceptionHandler service to also display a toast.
//      * @param  {Object} $delegate
//      * @param  {Object} exceptionHandler
//      * @param  {Object} logger
//      * @return {Function} the decorated $exceptionHandler service
     

//     extendExceptionHandler.$inject = ['$delegate', 'exceptionHandler', 'logger'];

//     function extendExceptionHandler($delegate, exceptionHandler, logger) {
//         return function(exception, cause) {
//             var appErrorPrefix = exceptionHandler.config.appErrorPrefix || '';
//             var errorData = {
//                 exception: exception,
//                 cause: cause
//             };
//             exception.message = appErrorPrefix + exception.message;
//             $delegate(exception, cause);
//             /**
//              * Could add the error to a service's collection,
//              * add errors to $rootScope, log errors to remote web server,
//              * or log locally. Or throw hard. It is entirely up to you.
//              * throw exception;
//              *
//              * @example
//              *     throw { message: 'error message we added' };
//              */
//             logger.error(exception.message, errorData, 'Error');
//         };
//     }
// }(window.angular));
(function() {

    angular
        .module('app')
        .factory('logger', logger);

    logger.$inject = ['$log', 'notifyService'];

    function logger($log, notifyService) {

        var service = {

            error: error,
            info: info,
            success: success,
            warning: warning

        };

        return service;

        /////////////////////

        function error(message, data, title) {

            notifyService.error(title, message, null, true);

            $log.error('Error: ' + message, data);

        }

        function info(message, data, title) {

            notifyService.info(title, message);

            $log.info('Info: ' + message, data);

        }

        function success(message, data, title) {

            notifyService.success(title, message);

            $log.info('Success: ' + message, data);

        }

        function warning(message, data, title) {

            notifyService.warning(title, message);

            $log.warn('Warning: ' + message, data);

        }
    }

}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.gateway', factory);

    factory.$inject = ['$window', 'app.config', 'utils'];

    function factory($window, appConfig, utils) {

        function Gateway() {

            this.isConnected = false;
            this.clientId = null;
            this.clientKey = null;
            $window.CappMessaging.brokerUrl = appConfig.broker.url;
            $window.CappMessaging.brokerPort = appConfig.broker.port;
            $window.CappMessaging.sourceRoot = appConfig.broker.sourceRoot;
        }

        Gateway.prototype.connect = function(clientId, clientKey, failHandler) {

            this.clientId = clientId;
            this.clientKey = clientKey;

            saveClient(clientId, clientKey);

            var that = this;

            var deffered = utils.$q.defer();

            var disconnectPromise = that.disconnect();

            disconnectPromise.then(function() {

                $window.CappMessaging.connect(clientId, clientKey, function() {
                        deffered.resolve();
                        that.connected = true;
                    },

                    function() {
                        deffered.reject();
                        that.connected = false;

                        if (failHandler) {
                            failHandler();
                        }
                    });
            });

            return deffered.promise;
        };

        Gateway.prototype.disconnect = function() {

            var that = this;
            var deffered = utils.$q.defer();

            $window.CappMessaging.disconnect(function() {
                deffered.resolve();
                that.connected = false;
            });

            return deffered.promise;
        };

        Gateway.prototype.subscribe = function(topic, callbackFn, subscriptionCallbackFn) {

            $window.CappMessaging.subscribe(topic, callbackFn, subscriptionCallbackFn);
        };

        Gateway.prototype.unsubscribe = function(sub) {

            $window.CappMessaging.unsubscribe(sub);
        };

        Gateway.prototype.publish = function(topic, payload) {

            $window.CappMessaging.publish(topic, payload);
        };

        function saveClient(clientId, clientKey) {

            $window.CappMessaging.clientId = clientId;
            $window.CappMessaging.clientKey = clientKey;
        }

        return new Gateway();
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.parser', factory);

    factory.$inject = ['utils'];

    function factory(utils) {

        var service = {
            parseMessage: parseMessage,
            getMessageTopic: getMessageTopic
        };

        return service;

        ////////////////

        function parseMessage(topic, payload) {

            var topicElements = topic.split('.');
            var info = {
                name: '',
                data: {
                    payload: payload
                }
            };

            if (isMatch('ground.%.in.asset.%.state', topicElements)) {
                info.name = 'asset.state';
                info.data.groundId = topicElements[1];
                info.data.assetId = topicElements[4];
                return info;
            }

            if (isMatch('client.%.in.asset.%.state', topicElements)) {
                info.name = 'asset.state';
                info.data.assetId = topicElements[4];
                return info;
            }

            if (isMatch('ground.%.in.activity', topicElements)) {
                info.name = 'ground.activity';
                info.data.groundId = topicElements[1];
                return info;
            }

            if (isMatch('client.%.in.asset.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'asset.created';
                    info.data.assetId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'asset.deleted';
                    info.data.assetId = topicElements[4];
                }

                return info;
            }

            if (isMatch('client.%.in.device.%.asset.%.command', topicElements)) {
                info.name = 'asset.command';
                info.data.assetId = topicElements[6];
                return info;
            }

            if (isMatch('client.%.in.device.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'device.created';
                    info.data.deviceId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'device.deleted';
                    info.data.deviceId = topicElements[4];
                }

                return info;
            }

            if (isMatch('client.%.in.gateway.%.event', topicElements)) {

                if (payload.Name === 'create') {
                    info.name = 'gateway.created';
                    info.data.gatewayId = topicElements[4];
                }

                if (payload.Name === 'delete') {
                    info.name = 'gateway.deleted';
                    info.data.gatewayId = topicElements[4];
                }

                return info;
            }

            return info;
        }

        function isMatch(topicPattern, topicElements) {

            var patternElements = topicPattern.split('.');

            if (patternElements.length !== topicElements.length) {
                return false;
            }

            var match = true;
            for (var i = 0; i < patternElements.length; i++) {

                if (patternElements[i] !== topicElements[i]) {

                    if (patternElements[i] !== '%') {
                        match = false;
                    }
                }
            }

            return match;
        }

        function getMessageTopic(clientId, action, entity) {

            var topic = null;

            if (action === 'command') {
                topic = 'client.{0}.in.device.{1}.asset.{2}.command'.format(
                    clientId,
                    entity.deviceId,
                    entity.id);
            }

            if (action === 'state') {
                topic = 'client.{0}.out.asset.{1}.state'.format(
                    clientId,
                    entity.id);
            }

            return topic;
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('messaging.relay', factory);

    factory.$inject = ['messaging.gateway', 'utils', 'session', 'userContext', 'messaging.parser', 'NotificationModel'];

    function factory(messagingGateway, utils, session, userContext, parser, Notification) {

        var notificationSubscription = null;
        var groundSubscription = null;

        var reconnectAttemptCount = 0;

        //how many times to try to reconnect before aborting
        var reconnectAttemptThreshold = 3;

        //wait interval between reconnect attempts
        var reconnectAttemptInterval = 5000;

        function MessageRelay() {
            this.items = [];
        }

        MessageRelay.prototype.init = function() {

            var that = this;

            if (session.authentication().isAuth) {

                connect();
            }

            utils.$rootScope.$on('user.login', function() {

                messagingGateway.disconnect().then(function() {
                    connect();
                });

            });

            utils.$rootScope.$on('user.logout', function() {

                messagingGateway.disconnect();

            });

            function connect() {

                messagingGateway.connect(session.authentication().rmq.clientId, session.authentication().rmq.clientKey, connectionFailHandler)
                    .then(function() {

                        that.subscribeForUserNotifications();

                        that.subscribeForAllNotifications();

                        reconnectAttemptCount = 0;

                        utils.$rootScope.$emit('$messaging.connection.connected');

                    });

            }

            function connectionFailHandler() {

                if (reconnectAttemptCount >= reconnectAttemptThreshold) {

                    console.log('###MESSAGING### - FAILED TO RECONNECT, ABORTING. ');

                    utils.$rootScope.$emit('$messaging.connection.disconnected');

                } else {

                    utils.$timeout(function() {

                        reconnectAttemptCount++;

                        console.log('###MESSAGING### - RECONNECT ATTEMPT ' + reconnectAttemptCount);

                        connect();

                    }, reconnectAttemptInterval);
                }
            }
        };

        MessageRelay.prototype.subscribeForUserNotifications = function() {

            if (!userContext.user) {
                return;
            }

            notificationSubscription = messagingGateway.subscribe(
                'client.{0}.in.user.{1}.notifications'.format(messagingGateway.clientId, userContext.user.id),
                handleNotificationMessage);

            function handleNotificationMessage(payload) {
                //HACK!
                var normalizedMessage = {
                    at: payload.At,
                    data: payload.Value
                };

                utils.$rootScope.$emit('$messaging.notification', new Notification(normalizedMessage));
            }
        };

        MessageRelay.prototype.subscribeForGroundNotifications = function(groundId) {

            if (groundSubscription) {

                messagingGateway.unsubscribe(groundSubscription);

                groundSubscription = null;

            }

            messagingGateway.subscribe(
                'ground.{0}.in.#'.format(groundId),
                handleGroundMessage,
                handleSubscribed);

            function handleGroundMessage(payload, topic) {

                var message = parser.parseMessage(topic, payload);

                if (message.name) {

                    utils.$rootScope.$emit('$messaging.' + message.name, message.data);

                }
            }

            function handleSubscribed(subscription) {

                groundSubscription = subscription;

            }
        };

        //Obsolete - will be removed when all messages are transferred under ground.{id}.in.#
        MessageRelay.prototype.subscribeForAllNotifications = function() {

            messagingGateway.subscribe(
                'client.{0}.in.#'.format(messagingGateway.clientId),
                handleMessage);

            function handleMessage(payload, topic) {

                var message = parser.parseMessage(topic, payload);

                if (message.name) {

                    utils.$rootScope.$emit('$messaging.' + message.name, message.data);

                }
            }
        };

        MessageRelay.prototype.unsubscribeFromGroundNotifications = function() {

            if (groundSubscription) {

                messagingGateway.unsubscribe(groundSubscription);

                groundSubscription = null;

            }
        };

        MessageRelay.prototype.publishState = function(asset, stateData) {

            var topic = parser.getMessageTopic(messagingGateway.clientId, 'state', asset);

            messagingGateway.publish(topic, stateData);

        };

        MessageRelay.prototype.publishCommand = function(asset, commandData) {

            var topic = parser.getMessageTopic(messagingGateway.clientId, 'command', asset);

            messagingGateway.publish(topic, commandData);

        };

        return new MessageRelay();
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .controller('AllNotificationsController', AllNotificationsController);

    AllNotificationsController.$inject = ['$scope', 'model', 'viewNotificationCallback'];

    function AllNotificationsController($scope, model, viewNotificationCallback) {

        var vm = this;
        vm.model = model;
        vm.viewNotification = viewNotification;

        activate();

        ///////////////////////////////////

        function activate() {

            vm.model.subscribe();

            $scope.$on('$destroy', function() {
                vm.model.destroy();
            });
        }

        function viewNotification(notification) {
            vm.model.viewNotification(notification);

            if (viewNotificationCallback) {
                viewNotificationCallback(notification);
            }
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('AllNotificationsViewModel', factory);

    factory.$inject = ['notificationsRepository', 'notificationContext', 'utils'];

    function factory(notificationsRepository, notificationContext, utils) {

        var PAGE_SIZE = 10;
        var unsubscribeHandler = null;

        function AllNotificationsViewModel(notifications) {

            var that = this;
            that.notifications = notifications;
            that.pageSize = PAGE_SIZE;
            that.page = 0;
        }

        AllNotificationsViewModel.prototype.markAsRead = function(notification) {

            notificationContext.markAsRead(notification);
        };

        AllNotificationsViewModel.prototype.viewNotification = function(notification) {

            this.markAsRead(notification);
            notification.view(true);
        };

        AllNotificationsViewModel.prototype.loadMore = function() {

            var that = this;

            that.page++;

            return notificationsRepository.find(PAGE_SIZE, that.page)
                .then(function(result) {
                    that.notifications = that.notifications.concat(result);
                    return result;
                });
        };

        AllNotificationsViewModel.prototype.destroy = function() {

            if (unsubscribeHandler) {
                unsubscribeHandler();
                unsubscribeHandler = null;
            }
        };

        AllNotificationsViewModel.prototype.subscribe = function() {

            var that = this;

            unsubscribeHandler = utils.$rootScope.$on('user.notification', userNotificationHandler);

            function userNotificationHandler(event, notification) {
                that.notifications.push(notification);
            }
        };

        AllNotificationsViewModel.resolve = function() {

            return notificationsRepository.find(PAGE_SIZE)
                .then(function(result) {
                    return new AllNotificationsViewModel(result);
                });
        };

        return AllNotificationsViewModel;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationContext', factory);

    factory.$inject = ['utils', 'session', 'notificationsRepository', 'NotificationModel', 'userContext'];

    function factory(utils, session, notificationsRepository, Notification, userContext) {

        function NotificationContext() {
            this.notifications = [];
        }

        NotificationContext.prototype.getUnreadCount = function() {

            var unreadCount = 0;

            angular.forEach(this.notifications, function(notification) {
                if (!notification.value.isRead) {
                    unreadCount++;
                }
            });

            return unreadCount;
        };

        NotificationContext.prototype.markAsRead = function(notification) {

            notification.value.isRead = true;

            notificationsRepository.markAsRead(notification);
        };

        NotificationContext.prototype.markAllAsRead = function() {

            angular.forEach(this.notifications, function(notification) {
                notification.value.isRead = true;
            });

            notificationsRepository.markAllAsRead();
        };

        NotificationContext.prototype.init = function() {

            var that = this;

            utils.$rootScope.$on('user.login', userLoginHandler);
            utils.$rootScope.$on('user.logout', userLogoutHandler);
            utils.$rootScope.$on('$messaging.notification', userNotificationHandler);

            if (session.authentication().isAuth) {
                setupNotifications();
            }

            function userLoginHandler() {

                setupNotifications();
            }

            function userLogoutHandler() {

                that.notifications = [];
            }

            function userNotificationHandler(event, notification) {

                that.notifications.push(notification);
                utils.$rootScope.$apply();
            }

            function setupNotifications() {

                return notificationsRepository.find().then(function(notifications) {
                    that.notifications = notifications;
                });
            }
        };

        return new NotificationContext();
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .controller('NotificationController', NotificationController);

    NotificationController.$inject = ['$state', '$modal', 'notificationContext', 'AllNotificationsViewModel', 'GroundContext'];

    function NotificationController($state, $modal, notificationContext, AllNotificationsViewModel, groundContext) {

        var vm = this;
        vm.context = notificationContext;
        vm.notificationLimit = 5;
        vm.viewNotification = viewNotification;
        vm.markAsRead = markAsRead;
        vm.markAllAsRead = markAllAsRead;
        vm.showAll = showAll;

        ////////////////////////////////

        function viewNotification(notification) {

            markAsRead(notification);
            notification.view();
        }

        function markAsRead(notification) {

            notificationContext.markAsRead(notification);
        }

        function markAllAsRead() {

            notificationContext.markAllAsRead();
        }

        function showAll() {

            if ($state.current.name === 'main.notifications') {
                return;
            }

            var previousStateName = $state.current.name;
            var previousStateParams = angular.copy($state.params);

            var modalInstance = $modal.open({
                templateUrl: '/assets/js/app/core/notifications/all-notifications.html',
                controller: 'AllNotificationsController',
                controllerAs: 'vm',
                resolve: {
                    model: function() {

                        return new AllNotificationsViewModel.resolve().then(function(anvm) {
                            return anvm;
                        });
                    },

                    viewNotificationCallback: function() {

                        function closeModal(notification) {
                            modalInstance.close();
                        }

                        return closeModal;
                    }
                }
            });

            modalInstance.result.then(function(a, b, c) {
                //modal result promise is resolved as success if
                //link is clicked (state changed) from within the modal content
            }, function(reason) {

                //user clicked x or outside of the bounds of the modal
                //so we should return to previous state

                if (reason !== 'routeChange') {
                    $state.go(previousStateName, previousStateParams);
                }
            });

            $state.go('main.notifications', {}, {
                notify: false
            });
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('NotificationModel', factory);

    factory.$inject = ['$state'];

    function factory($state) {

        function Notification(data) {

            this.at = data.at;
            this.value = data.data;

            if (this.value.event === 'DeviceAssetNewState') {
                this.template = '/assets/js/app/core/notifications/asset-state-change.template.html';
            }

            if (this.value.event === 'RuleEngineExecutionNotification') {
                this.template = '/assets/js/app/core/notifications/message.template.html';
            }
        }

        Notification.prototype.view = function(replaceLocation) {

            var routeOptions = {};
            var routeName = null;
            var routeParams = {};

            if (replaceLocation) {
                routeOptions.location = 'replace';
            }

            if (this.value.data.asset) {
                routeName = 'main.asset';
                routeParams.id = this.value.data.asset.Id;
            }

            if (this.value.data.ground) {

                routeName = 'main.ground';
                routeParams.id = this.value.data.ground.Id;
            }

            if (routeName) {
                $state.go(
                    routeName,
                    routeParams,
                    routeOptions);
            }
        };

        return Notification;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationsRepository', notificationsRepository);

    notificationsRepository.$inject = ['NotificationModel', 'notificationService', 'utils', 'exception'];

    function notificationsRepository(Notification, notificationService, utils, exception) {

        var service = {
            find: find,
            markAsRead: markAsRead,
            markAllAsRead: markAllAsRead
        };

        return service;

        ////////////////

        function find(count, page) {

            return notificationService.find(count, page).then(function(body) {

                var models = [];
                angular.forEach(body.items, function(item) {
                    models.push(new Notification(item));
                });

                return models;
            }).catch(exception.catcher('There was a problem to load notifications.'));
        }

        function markAsRead(notification) {

            return notificationService.markAsRead(notification.at)
                .catch(exception.catcher('There was a problem to mark notification as read'));
        }

        function markAllAsRead() {

            return notificationService.markAllAsRead()
                .catch(exception.catcher('There was a problem to mark all notifications as read'));
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('offline', offline);

    function offline() {
        var directive = {
            templateUrl: '/assets/js/app/core/offline/offline.template.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope:{}
        };
        return directive;
    }

    Controller.$inject = ['offline'];

    function Controller(offline) {

        var vm = this;
        vm.status = offline;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('offline', factory);

    factory.$inject = ['$window', 'utils'];

    function factory($window, utils) {

        var service = {
            isOffline: false,
            isMessagingDisconnected: false,
            init: init
        };
        return service;

        ////////////////

        function init() {

            utils.$rootScope.$on('$messaging.connection.connected', function() {
                service.isMessagingDisconnected = false;
            });

            utils.$rootScope.$on('$messaging.connection.disconnected', function() {

                if (!service.isMessagingDisconnected) {

                    utils.notify.warning(
                        'Connection',
                        'Server connection has dropped.',
                        null,
                        true,
                        function() {
                            $window.location.reload();
                        },

                        'Reload page');

                    utils.$rootScope.$apply();
                }

                service.isMessagingDisconnected = true;

            });
        }

        function setOffline() {

            if (!service.isOffline) {
                utils.notify.warning('Connection', 'Server does not respond at the moment. Changes that you make now, may not be applied.', null, true);
            }

            service.isOffline = true;
            utils.$rootScope.$apply();
        }

        function setOnline() {

            service.isOffline = false;
            utils.$rootScope.$apply();
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('permission', permission);

    permission.$inject = ['$animate', 'utils', 'roles.manager'];

    function permission($animate, utils, roleManager) {
        var directive = {
            restrict: 'A',
            multiElement: true,
            priority: 599,
            terminal: true,
            transclude: 'element',
            link: linker,
            $$tlb: true
        };
        return directive;

        function linker($scope, $element, $attr, ctrl, $transclude) {

            var block;
            var childScope;
            var previousElements;

            var permission = parsePermissionRef($attr.permission);

            if (permission.payloadExpr) {
                $scope.$watch(permission.payloadExpr, function(val) {
                    if (val !== permission.payload) {
                        update(val);
                    }
                }, true);

                permission.payload = angular.copy($scope.$eval(permission.payloadExpr));
            } else {

                permission.payload = {};
            }

            utils.$rootScope.$on('user.login', function() {
                update(permission.payload);
            });

            utils.$rootScope.$on('user.logout', function() {
                update(permission.payload);
            });

            update(permission.payload);

            function parsePermissionRef(ref) {

                var parsed = ref.replace(/\n/g, ' ').match(/^([^(]+?)\s*(\((.*)\))?$/);
                if (!parsed || parsed.length !== 4) {
                    throw new Error('Invalid permission ref "' + ref + '"');
                }

                return {
                    name: parsed[1],
                    payloadExpr: parsed[3] || null
                };
            }

            function update(newPermissionPayload) {

                if (newPermissionPayload) {
                    permission.payload = angular.copy(newPermissionPayload);
                }

                var authorized = roleManager.authorize(permission.name, permission.payload);

                //run ngIf to remove elements and child scopes if not authorized or to add elements
                runNgIf(authorized);
            }

            //Code entirely taken from angular ngIf directive
            function runNgIf(value) {
                if (value) {
                    if (!childScope) {
                        $transclude(function(clone, newScope) {
                            childScope = newScope;
                            clone[clone.length++] = document.createComment(' end permission: ' + $attr.permission + ' ');

                            // Note: We only need the first/last node of the cloned nodes.
                            // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                            // by a directive with templateUrl when its template arrives.
                            block = {
                                clone: clone
                            };
                            $animate.enter(clone, $element.parent(), $element);
                        });
                    }
                } else {
                    if (previousElements) {
                        previousElements.remove();
                        previousElements = null;
                    }

                    if (childScope) {
                        childScope.$destroy();
                        childScope = null;
                    }

                    if (block) {
                        previousElements = getBlockNodes(block.clone);
                        $animate.leave(previousElements).then(function() {
                            previousElements = null;
                        });

                        block = null;
                    }
                }
            }

            //Code entirely take from angular core, as ngIf was using it internally
            function getBlockNodes(nodes) {
                // TODO(perf): update `nodes` instead of creating a new object?
                var node = nodes[0];
                var endNode = nodes[nodes.length - 1];
                var blockNodes;

                for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
                    if (blockNodes || nodes[i] !== node) {
                        if (!blockNodes) {
                            blockNodes = jqLite(slice.call(nodes, 0, i));
                        }

                        blockNodes.push(node);
                    }
                }

                return blockNodes || nodes;
            }
        }
    }

})();

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

(function() {
    'use strict';

    angular
        .module('app')
        .directive('assetName', assetName);

    assetName.$inject = ['asset.repository', 'nameCache'];

    function assetName(assetRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=assetName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.assets[scope.id]) {
                    $(element[0]).html(nameCache.assets[scope.id]);
                } else {

                    assetRepository.find(scope.id).then(function(asset) {
                        $(element[0]).html(asset.title);
                        nameCache.assets[scope.id] = asset.title;
                    });
                }
            });
        }
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceName', deviceName);

    deviceName.$inject = ['device.repository', 'nameCache'];

    function deviceName(deviceRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=deviceName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.devices[scope.id]) {
                    $(element[0]).html(nameCache.devices[scope.id]);
                } else {

                    deviceRepository.find(scope.id).then(function(device) {
                        $(element[0]).html(device.title);
                        nameCache.devices[scope.id] = device.title;
                    });
                }
            });
        }
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('groundName', groundName);

    groundName.$inject = ['ground.repository', 'nameCache'];

    function groundName(groundRepository, nameCache) {

        var directive = {
            link: link,
            restrict: 'A',
            scope: {
                id: '=groundName'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            scope.$watch('id', function(newId) {

                if (!scope.id) {
                    return;
                }

                if (nameCache.grounds[scope.id]) {
                    $(element[0]).html(nameCache.grounds[scope.id]);
                } else {
                    groundRepository.find(scope.id).then(function(ground) {
                        $(element[0]).html(ground.title);
                        nameCache.grounds[scope.id] = ground.title;
                    });
                }

            });
        }
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('nameCache', nameCache);

    function nameCache() {
        var service = {
            assets: [],
            grounds: [],
            devices: []
        };
        return service;

        ////////////////
    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('api.accountService', AccountService);

    AccountService.$inject = [
        '$http',
        'session',
        'api.url',
        'exception'
    ];

    function AccountService($http, session, apiUrl, exception) {

        var service = {
            activate: activate,
            resendActivation: resendActivation,
            recoverPassword: recoverPassword,
            changePassword: changePassword
        };

        return service;

        /////////////////////////

        function activate(token) {

            var url = apiUrl + 'account/activation/' + token;
            return $http.put(url)
                .catch(exception.catcher('There was a problem to activate account.'));
        }

        function resendActivation(userNameEmail) {

            var url = apiUrl + 'account/resendactivation';
            var data = {
                email: userNameEmail
            };

            return $http.put(url, data)
                .then(handleSuccess)
                .catch(exception.catcher('There was a problem to send activation mail.'));
        }

        function recoverPassword(userName) {

            var url = apiUrl + 'account/recoverpassword';
            var data = {
                username: userName
            };

            return $http.put(url, data)
                .then(handleSuccess)
                .catch(exception.catcher('There was a problem to recover password.'));
        }

        function changePassword(oldPassword, newPassword, confirmedPassword) {

            var url = apiUrl + 'account/changepassword';
            var data = {
                oldPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmedPassword
            };

            return $http.post(url, data)
                .catch(exception.catcher('There was a problem to change password.'));
        }

        function handleSuccess(response) {
            return {
                success: true
            };
        }
    }

}(window.angular));

(function(ng) {
    ng.module('app').factory('api.assetsService', AssetsService);

    AssetsService.$inject = ['$http', 'api.url', 'exception', 'deviceActivityService', 'utils'];

    function AssetsService($http, apiUrl, exception, deviceActivityService, utils) {

        var assetTypes = [{
            name: 'Sensor',
            type: 'sensor',
            cssClass: 'sl-device-wall-plug'
        }, {
            name: 'Actuator',
            type: 'actuator',
            cssClass: 'sl-device-wall-plug'
        }, {
            name: 'Virtual',
            type: 'virtual'
        }, {
            name: 'Config',
            type: 'config'
        }];

        var service = {
            publishCommand: publishCommand,
            publishState: publishState,
            replaceProfile: replaceProfile,
            replaceControl: replaceControl,
            createAsset: createAsset,
            getAsset: getAsset,
            getAssetTypes: getAssetTypes,
            deleteAsset: deleteAsset,
            updateAsset: updateAsset,
            areSameProfiles: areSameProfiles,
            normalizeProfileType: normalizeProfileType,
            getAssetHistory: getAssetHistory,

            createAssetUsingToken: createAssetUsingToken,
            createAssetUsingTicket: createAssetUsingTicket

        };

        return service;

        //////////////////////////////

        function publishCommand(id, value) {
            var url = apiUrl + 'asset/' + id + '/command';

            var data = {
                value: value
            };

            return $http.put(url, data)
                .then(function(response) {
                    return true;
                });
        }

        function publishState(id, value) {

            var url = apiUrl + 'asset/' + id + '/state';

            var data = {
                value: value
            };

            return $http.put(url, data);
        }

        function replaceProfile(deviceId, assetName, profile) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetName + '/profile';

            return $http.put(url, profile);
        }

        function replaceControl(deviceId, assetName, value) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetName + '/control';

            var data = value;

            return $http.put(url, data);
        }

        function createAsset(deviceId, name, title, type, profile, control) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;

            var data = {};

            if (deviceId) {
                data.deviceId = deviceId;
            }

            if (title) {
                data.title = title;
            }

            if (type) {
                data.is = type;
            }

            if (profile !== null && profile !== undefined) {

                if ((typeof profile) === 'object') {

                    data.profile = profile;

                } else {

                    data.profile = {

                        type: profile

                    };
                }

            } else {

                data.profile = {

                    type: 'string'
                };

            }

            if (control !== null && control !== undefined) {

                data.control = {
                    name: control
                };

            }

            return $http.put(url, data);
        }

        function createAssetUsingToken(deviceId, assetConfig, token) {

            var url = apiUrl + 'device/' + deviceId + '/asset/' + assetConfig.name;

            var config = getConfig(token);

            return $http.put(url, assetConfig, config);
        }

        function getAsset(id) {
            var url = apiUrl + 'asset/' + id;

            return $http.get(url);
        }

        function getAssetTypes() {
            return assetTypes;
        }

        function deleteAsset(deviceId, name) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;
            return $http.delete(url);
        }

        function updateAsset(deviceId, assetId, name, assetIs, title) {
            var url = apiUrl + 'device/' + deviceId + '/asset/' + name;

            var data = {
                id: assetId,
                title: title,
                is: assetIs
            };

            return $http.put(url, data);
        }

        function getAssetHistory(id, from, to, resolution) {

            var url = apiUrl + 'asset/' + id + '/activity';

            var query = '?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to) + '&resolution=' + resolution;

            url = url + query;

            return $http.get(url).then(function(response) {
                return response.data;
            });

        }

        function createAssetUsingTicket(ticket, data){

            var url = apiUrl + 'asset/' + data.name;

            var config = getConfigForTicket(ticket);

            return $http.put(url, data, config)
        }

        function areSameProfiles(leftProfile, rightProfile) {

            if (!leftProfile || !rightProfile) {
                return false;
            }

            if (!leftProfile.type || !rightProfile.type) {
                return false;
            }

            var left = normalizeProfileType(leftProfile.type);
            var right = normalizeProfileType(rightProfile.type);

            return left == right;
        }

        function normalizeProfileType(profileType) {

            if (typeof profileType != 'string') {
                return null;
            }

            profileType = profileType.toLowerCase();

            if (profileType == 'bool' || profileType == 'boolean') {
                return 'bool';
            }

            if (profileType == 'int' || profileType == 'integer') {
                return 'int';
            }

            if (profileType == 'double' || profileType == 'float' || profileType == 'decimal' || profileType == 'number') {
                return 'number';
            }

            if (profileType == 'string' || profileType == 'text') {
                return 'string';
            }

            if (profileType == 'datetime' || profileType == 'date' || profileType == 'time') {
                return 'datetime';
            }

            if (profileType == 'timespan' || profileType == 'timerange' || profileType == 'duration') {
                return 'timespan';
            }

            return profileType;
        }

        function getConfigForTicket(ticket) {

            var config = {
                headers: {}
            };

            if (ticket) {
                config.headers.Authorization = 'Ticket {0}'.format(ticket);
            }

            return config;

        }

        function getConfig(token) {
            var config = {
                headers: {}
            };

            if (token) {
                config.headers.Authorization = 'Bearer {0}'.format(token);
            }

            return config;
        }
    }

}(window.angular));

(function() {

    angular
        .module('app')
        .factory('authHelper', authenticationHelper);

    authenticationHelper.$inject = ['$rootScope', 'session', '$state'];

    function authenticationHelper($rootScope, session, $state) {

        var attemptedRoute = {
            name: null,
            params: null
        };

        var service = {
            getAttemptedRoute: getAttemptedRoute
        };

        $rootScope.$on('$stateChangeStart', stateChangeHandler);

        return service;

        function getAttemptedRoute() {

            return attemptedRoute;

        }

        function stateChangeHandler(event, toState, toParams, fromState, fromParams) {

            if (typeof toState.data === 'undefined' || typeof toState.data.requireLogin === 'undefined') {

                return;

            }

            if (!session.authentication().isAuth) {

                event.preventDefault();

                attemptedRoute.name = toState.name;

                attemptedRoute.params = toParams;

                $state.transitionTo('login');

            }

        }
    }

})();

(function() {

    angular
        .module('app')
        .factory('authService', AuthService);

    AuthService.$inject = [
        '$http',
        'api.url',
        'session',
        'api.clientId',
        'userContext',
        'exception'
    ];

    function AuthService($http, apiUrl, session, apiClientId, userContext, exception) {

        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        var service = {
            register: register,
            refreshToken: refreshToken,
            login: login,
            logout: logout,
            getDataFromHash: getDataFromHash,
            continueActivation: continueActivation,
            root: root
        };

        return service;

        ///////////////////////////

        function register(registration) {

            return $http.post(apiUrl + 'register', registration)
                .catch(exception.catcher('There was problem to create your account.'));
        }

        function refreshToken(token) {

            var data = 'grant_type=refresh_token&refresh_token=' + token + '&client_id=' + apiClientId;

            return $http.post(apiUrl + 'login', data, {
                headers: headers
            }).then(function(response) {
                session.saveAuthenticationData(response.data);
                return response.data;
            });
        }

        function login(loginData) {

            var data = 'grant_type=password&username=' + encodeURIComponent(loginData.username) + '&password=' + encodeURIComponent(loginData.password) + '&client_id=' + apiClientId;

            return $http.post(apiUrl + 'login', data, {
                    headers: headers
                })
                .then(onSuccessfullLogin)
                .then(loadUserInformation)
                .catch(exception.catcher('Could not login with credentials provided.'));
        }

        function onSuccessfullLogin(response) {

            session.saveAuthenticationData(response.data);

            return response.data;
        }

        function loadUserInformation() {

            return userContext.load();
        }

        function logout() {

            return $http.post(apiUrl + 'logout', null, {
                    headers: headers
                }).then(function(response) {

                    session.clearAuthenticationData();
                    userContext.unload();
                })
                .catch(exception.catcher('There was a problem to sign you out.'));
        }

        function getDataFromHash(hash) {

            var url = apiUrl + 'account/completion/' + hash;
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem with your activation link.'));
        }

        function continueActivation(hash, newUsername, newPassword) {

            var url = apiUrl + 'account/completion/' + hash;

            var data = {
                username: newUsername,
                password: newPassword
            };

            return $http.put(url, data)
                .catch(exception.catcher('There was a problem to continue activation process.'));
        }

        function root() {

            var url = apiUrl;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

    }
}());

(function() {

    angular
        .module('app')
        .factory('api.clientAuthorizationService', ClientAuthorizationService);

    ClientAuthorizationService.$inject = ['$http', 'api.url', 'exception'];

    function ClientAuthorizationService($http, apiUrl, exception) {

        var service = {
            getClients: getClients,
            revokeClientAuthorization: revokeClientAuthorization
        };

        return service;

        ///////////////////////////////////////////

        // - /authorizations gets all authorized clients

        function getClients() {

            var url = apiUrl + 'me/clients';

            return $http.get(url)
                .then(function(response) {

                    return response.data;

                })
                .catch(exception.catcher('There was a problem to load authorized clients.'));
        }

        function revokeClientAuthorization(clientId) {

            var url = apiUrl + 'client/' + clientId;

            return $http.delete(url)
                .catch(exception.catcher('There was a problem to load authorized clients.'));

        }
    }
}());

(function() {

    angular
        .module('app')
        .factory('api.controlsService', ControlsService);

    ControlsService.$inject = ['$http', 'api.url', 'widgetsCommon', 'exception'];

    function ControlsService($http, apiUrl, widgetsCommon, exception) {

        var service = {
            getAll: getAll,
            getControl: getControl,
            getControlsForAsset: getControlsForAsset,
            getControlsForProfile: getControlsForProfile,
            getDefaultControl: getDefaultControl
        };

        return service;

        ///////////////////////////////////////////

        // - /controls gets all controls
        // - /controls/ {id} gets control by it's name
        // - /controls/asset / {id} gets controls for asset by it 's id
        // - POST / controls / profile gets controls for profile in the body

        function getAll() {
            var url = apiUrl + 'controls';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load controls.'));
        }

        function getControl(controlName) {
            var url = apiUrl + 'controls/' + controlName;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load control.'));
        }

        function getControlsForAsset(assetId) {
            var url = apiUrl + 'controls/asset/' + assetId;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load asset controls.'));
        }

        function getControlsForProfile(profile) {
            var url = apiUrl + 'controls/profile';

            return $http.post(url, profile)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load controls for a profile.'));
        }

        function getDefaultControl(asset) {

            return widgetsCommon.findDefaultControl(asset);

        }
    }

}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('deviceActivityService', deviceActivityService);

    deviceActivityService.$inject = ['$http', 'api.url', '$q'];

    function deviceActivityService($http, apiUrl, $q) {

        var service = {
            getAssetActivity: getAssetActivity
        };

        var testData = [{
            at: '2015-08-20T13:00:00.000Z',
            data: {
                min: 0,
                avg: 1.5,
                max: 2
            }
        }, {
            at: '2015-08-20T14:00:00.000Z',
            data: {
                min: 0,
                avg: 1.6,
                max: 2.2
            }
        }, {
            at: '2015-08-20T15:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 2.9
            }
        }, {
            at: '2015-08-20T16:00:00.000Z',
            data: null
        }, {
            at: '2015-08-20T17:00:00.000Z',
            data: null
        }, {
            at: '2015-08-20T18:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 3.5
            }
        }, {
            at: '2015-08-20T19:00:00.000Z',
            data: {
                min: 0,
                avg: 7,
                max: 14
            }
        }, {
            at: '2015-08-20T20:00:00.000Z',
            data: {
                min: 0,
                avg: 2.5,
                max: 3.7
            }
        }, {
            at: '2015-08-20T21:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 3.5
            }
        }, {
            at: '2015-08-20T22:00:00.000Z',
            data: {
                min: 0,
                avg: 4,
                max: 7
            }
        }];

        return service;

        ////////////////

        function getAssetActivity() {
            return $q(function(resolve, reject) {
                resolve(testData);
            });
        }

    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('api.devicesService', DeviceService);

    DeviceService.$inject = ['$http', 'session', 'api.url', 'public.token'];

    function DeviceService($http, session, apiUrl, publicToken) {

        var service = {
            getAll: getAll,
            create: create,
            createInGround: createInGround,
            getFromGround: getFromGround,
            get: get,
            refresh: refresh,
            enable: enable,
            disable: disable,
            deleteDevice: deleteDevice,
            updateDeviceControl: updateDeviceControl,
            updateDevice: updateDevice,
            adopt: adopt,

            ///using token
            getAllUsingToken: getAllUsingToken,
            getSelfUsingTicket: getSelfUsingTicket,
            createUsingToken: createUsingToken,
            updateUsingToken: updateUsingToken
        };

        return service;

        /////////////////////////////////////

        function getAll(gatewayId, newDevicesOnly) {
            var url = apiUrl + 'device?includeAssets=true';

            var config = {
                params: {}
            };

            if (gatewayId) {
                config.params.gatewayId = gatewayId;
            }

            if (newDevicesOnly) {
                config.params.new = true;
            }

            return $http.get(url, config);
        }

        function create(data) {
            var url = apiUrl + 'device';

            return $http.post(url, data);
        }

        function createInGround(data, groundId) {
            var url = apiUrl + 'ground/' + groundId + '/devices';

            return $http.post(url, data);
        }

        function get(id) {
            return $http.get(apiUrl + 'device/' + id)
                .then(function(response) {
                    return response.data;
                });
        }

        function getFromGround(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/devices';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function doDeviceAction(actionName, deviceId) {
            return $http.put(apiUrl + 'device/' + deviceId + '/' + actionName);
        }

        function refresh(id) {
            return doDeviceAction('refresh', id);
        }

        function enable(id) {
            return doDeviceAction('enable', id);
        }

        function disable(id) {
            return doDeviceAction('disable', id);
        }

        function deleteDevice(id) {
            var url = apiUrl + 'device/' + id;
            return $http.delete(url);
        }

        function updateDeviceControl(id, control) {

            var data = {};

            if (control) {
                data.control = control;
            }

            return $http.put(apiUrl + 'device/' + id + '/control', data);
        }

        function updateDevice(id, data) {

            return $http.put(apiUrl + 'device/' + id, data);
        }

        function adopt(deviceId) {
            var url = apiUrl + 'device/' + deviceId + '/adopt';

            return $http.post(url);
        }

        function getAllUsingToken(byName, token) {

            var url = apiUrl + 'device?includeAssets=true';

            if (byName) {
                url += '&name=' + byName;
            }

            var config = getConfigForTicket(token);

            return $http.get(url, config);
        }

        function createUsingToken(deviceConfig, token) {
            var url = apiUrl + 'device';

            var config = getConfigForTicket(token);

            return $http.post(url, deviceConfig, config);
        }

        function updateUsingToken(deviceConfig, token) {

            var data = {};

            if (deviceConfig.name) {
                data.name = deviceConfig.name;
            }

            if (deviceConfig.description) {
                data.description = deviceConfig.description;
            }

            if (deviceConfig.activityEnabled !== undefined && deviceConfig.activityEnabled !== null) {
                data.activityEnabled = deviceConfig.activityEnabled;
            }

            if (deviceConfig.assets) {
                data.assets = deviceConfig.assets;
            }

            if (deviceConfig.title) {
                data.title = deviceConfig.title;
            }

            var config = getConfig(token);

            return $http.put(apiUrl + 'device/' + deviceConfig.id, data, config);
        }

        function getSelfUsingTicket(ticket) {

            var config = getConfigForTicket(ticket);

            var url = apiUrl + 'self';

            return $http.get(url, config);

        }

        function getConfigForTicket(ticket) {

            var config = {
                headers: {}
            };

            if (ticket) {
                config.headers.Authorization = 'Ticket {0}'.format(ticket);
            }

            return config;

        }

        function getConfig(token) {
            var config = {
                headers: {}
            };

            if (token) {
                config.headers.Authorization = 'Bearer {0}'.format(token);
            }

            return config;
        }
    }
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .factory('api.GatewayService', GatewayService);

    GatewayService.$inject = ['$http', 'api.url', 'exception'];

    function GatewayService($http, apiUrl, exception) {
        var service = {

            listGateways: listGateways,
            getFromGround: getFromGround,
            getGateway: getGateway,
            claimGateway: claimGateway,
            enrollGateway: enrollGateway,
            updateGateway: updateGateway,
            deleteGateway: deleteGateway

        };

        return service;

        ////////////////////////////

        function deleteGateway(gatewayId) {
            var url = apiUrl + 'gateway/' + gatewayId;

            return $http.delete(url)
                .then(function(response) {
                    return true;
                });
        }

        function listGateways() {
            var url = apiUrl + 'gateway';

            return $http.get(url, {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });
        }

        function getFromGround(groundId) {
            var url = apiUrl + 'ground/' + groundId + '/gateways';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getGateway(id, includeDevices, includeAssets) {
            var url = apiUrl + 'gateway/' + id;

            if (includeDevices && includeAssets) {
                url += '?includeDevices=true&includeAssets=true';
            } else if (includeDevices) {
                url += '?includeDevices=true';
            } else if (includeAssets) {
                url += '?includeAssets=true';
            }

            return $http.get(url, {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });

        }

        function claimGateway(groundId, claimCode) {
            var url = apiUrl + 'ground/' + groundId + '/claim';

            var data = {
                claimCode: claimCode
            };

            return $http.post(url, JSON.stringify(data), {
                headers: getHeaders()
            });
        }

        function enrollGateway(uid, id, name, description, key) {
            var url = apiUrl + 'gateway/';

            var data = {};

            if (id) {
                data.id = id;
            }

            if (name) {
                data.name = name;
            }

            if (description) {
                data.description = description;
            }

            if (key) {
                data.key = key;
            }

            return $http.post(url, JSON.stringify(data), {
                headers: getHeaders()
            });
        }

        function updateGateway(id, name, description) {
            var url = apiUrl + 'gateway/' + id;

            var data = {
                name: name,
                description: description
            };

            return $http.put(url, JSON.stringify(data), {
                    headers: getHeaders()
                })
                .then(function(response) {
                    return response.data;
                });
        }

        function getHeaders() {
            return {
                'Content-Type': 'application/json'
            };
        }

    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('groundsService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {
        var service = {
            find: find,
            findAll: findAll,
            findAllPublic: findAllPublic,
            findAllShared: findAllShared,
            delete: deleteGround,
            create: create,
            update: update
        };
        return service;

        ////////////////

        function findAll() {

            var url = appConfig.api.url + 'me/grounds';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function findAllPublic() {

            var url = appConfig.api.url + 'grounds';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function findAllShared() {

            var url = appConfig.api.url + 'me/grounds?type=shared';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function find(id) {
            var url = appConfig.api.url + 'ground/' + id;
            return $http.get(url);
        }

        function deleteGround(id) {
            var url = appConfig.api.url + 'ground/' + id;
            return $http.delete(url);
        }

        function create(name, visibility) {
            var url = appConfig.api.url + 'me/grounds';

            return $http.post(url, {
                name: name,
                title: name,
                visibility: visibility
            });
        }

        function update(id, data) {
            var url = appConfig.api.url + 'ground/' + id;

            return $http.post(url, data);
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('membersService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {
        var service = {
            findAll: findAll,
            addMember: addMember,
            deleteMember: deleteMember

        };
        return service;

        ////////////////

        function findAll(groundId) {

            var url = appConfig.api.url + 'ground/' + groundId + '/members';
            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function addMember(groundId, memberEmail) {
            var url = appConfig.api.url + 'ground/' + groundId + '/members';
            var data = {
                email: memberEmail
            };
            return $http.post(url, data)
                .then(function(response) {
                    return response.data;
                });
        }

        function deleteMember(groundId, memberId) {
            var url = appConfig.api.url + 'ground/' + groundId + '/member/' + memberId;
            return $http.delete(url)
                .then(function(response) {
                    return response.data;
                });
        }

    }
})();

(function() {

    angular
        .module('app')
        .factory('api.metricsService', MetricsService);

    MetricsService.$inject = [
        '$http',
        'api.url'
    ];

    function MetricsService($http, apiUrl) {

        var service = {
            getPerformance: getPerformance
        };

        return service;

        function getPerformance() {
            var url = apiUrl + 'metrics/performance/current';
            return $http.get(url);
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('notificationService', factory);

    factory.$inject = ['$http', 'app.config'];

    function factory($http, appConfig) {

        var service = {
            find: find,
            markAsRead: markAsRead,
            markAllAsRead: markAllAsRead
        };
        return service;

        ////////////////

        function find(count, page) {

            var url = appConfig.api.url + 'me/notifications';

            url = url + getQuery(count, page);

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getQuery(count, page) {
            if (!page && !count) {
                return '';
            }

            var query = '?';
            var items = [];

            if (page) {
                items.push('page=' + page);
            }

            if (count) {
                items.push('count=' + count);
            }

            query = query + items.join('&');

            return query;
        }

        function markAsRead(timestamp) {

            var url = appConfig.api.url + 'me/notifications';

            return $http.patch(url, {
                at: timestamp
            });
        }

        function markAllAsRead() {

            var url = appConfig.api.url + 'me/notifications';
            return $http.patch(url, {});
        }
    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('api.rulesService', RulesService);

    RulesService.$inject = [
        '$http',
        'api.url'
    ];

    function RulesService($http, apiUrl) {

        var service = {
            getAll: getAll,
            get: get,
            getHistory: getHistory,
            create: create,
            update: update,
            delete: deleteRule,
            enabled: enabled,
            hasIssue: hasIssue,
            getDeviceRulesCount: getDeviceRulesCount,
            getDeviceRules: getDeviceRules,
            subscribeOnRuleNotifications: subscribe,
            unsubscribeFromRuleNotifications: unsubscribe
        };

        return service;

        ///////////////////////////////////////////

        function getAll() {

            var url = apiUrl + 'rules';
            return $http.get(url);
        }

        function get(ruleId) {

            var url = apiUrl + 'rules/' + ruleId;
            return $http.get(url);
        }

        function getHistory(ruleId) {

            var url = '{0}rules/{1}/history'.format(apiUrl, ruleId);
            return $http.get(url);
        }

        function create(name, description, definition) {

            var url = apiUrl + 'rules';
            var data = {
                Name: name,
                Description: description,
                Definition: definition
            };

            return $http.post(url, data);
        }

        function update(id, name, description, definition) {
            var url = apiUrl + 'rules/' + id;

            var data = {};

            if (name) {
                data.Name = name;
            }

            if (description) {
                data.Description = description;
            }

            if (definition) {
                data.Definition = definition;
            }

            return $http.put(url, data);
        }

        function deleteRule(id) {
            var url = apiUrl + 'rules/' + id;

            return $http.delete(url);
        }

        function enabled(id, value) {
            var url = apiUrl + 'rules/enabled/' + id + '?value=' + value;

            return $http.post(url);
        }

        function hasIssue(rule) {

            //undefined, compliation error, missing assets
            if (rule.status === 0 || rule.status === 3 || rule.status === 4) {
                return true;
            }

            return false;
        }

        function getDeviceRules(deviceID, pageSize, page) {

            var url = apiUrl + 'device/' + deviceID + '/rules';

            url = url + getQuery(pageSize, page);

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                });
        }

        function getDeviceRulesCount(deviceID) {

            var url = apiUrl + 'device/' + deviceID + '/rules/meta';

            return $http.get(url);
        }

        function subscribe(ruleId) {
            var url = apiUrl + 'device/notifications/' + ruleId + '/subscription';

            return $http.put(url);
        }

        function unsubscribe(ruleId) {
            var url = apiUrl + 'device/notifications/' + ruleId + '/subscription';

            return $http.delete(url);
        }

        function getQuery(count, page) {
            if (!page && !count) {
                return '';
            }

            var query = '?';
            var items = [];

            if (count) {
                items.push('perPage=' + count);
            }

            if (page) {
                items.push('page=' + page);
            }

            query = query + items.join('&');

            return query;
        }
    }
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .factory('api.servicesService', servicesService);

    servicesService.$inject = ['$http', 'session', 'api.url', '$q'];

    function servicesService($http, session, apiUrl, $q) {

        var service = {
            getAll: getAll,
            get: get
        };

        return service;
        //////////////////////////////

        function getAll() {
            var url = apiUrl + 'services';
            return $http.get(url);
        }

        function get(serviceAlias) {
            var url = apiUrl + 'services/' + serviceAlias;
            return $http.get(url);
        }

        /////////Fakes until the API is available
        function getAllFake() {
            var deferred = $q.defer();

            deferred.resolve({
                data: [{
                    "id": "5497eacfd1510009ece8369b",
                    "name": "Email Me",
                    "type": "emailMe",
                    "is": "actuator",
                    "iconKey": "fa-envelope",
                    "description": "View the details of your notify-me email service",
                    "detailsPage": "services/emailme",
                    "profile": {
                        "type": {
                            "to": "string",
                            "subject": "string",
                            "body": "string"
                        }
                    }
                }]
            });

            return deferred.promise;
        }

        function getFake(serviceAlias) {
            var deferred = $q.defer();

            deferred.resolve({
                data: {
                    "id": "demo",
                    "name": "email me",
                    "is": "actuator",
                    "description": null,
                    "createdOn": "0001-01-01T00:00:00",
                    "createdBy": null,
                    "updatedOn": "0001-01-01T00:00:00",
                    "updatedBy": null,
                    "profile": {
                        "type": {
                            "to": "string",
                            "subject": "string",
                            "body": "string"
                        }
                    }
                }
            });

            return deferred.promise;
        }
    }

}(window.angular));

(function() {

    angular.module('app').constant('api.url', 'https://apidev.smartliving.io/');
    angular.module('app').constant('api.clientId', 'maker_local');
    angular.module('app').constant('broker.url', 'https://brokerdev.smartliving.io');
    angular.module('app').constant('broker.port', 15671);
    angular.module('app').constant('broker.sourceRoot', '/exchange/root/');
    angular.module('app').constant('widget.hostUrl', 'http://widget.smartliving.io');
    angular.module('app').constant('origin', 'https://feature-create-kit-device.firebaseapp.com');
    angular.module('app').constant('public.token', '0LLHtj3ytaYIg2XyAB-5NjyTY1edZVL1td3l2SJx7wKwEG');
    angular.module('app').constant('public.clientId', 'guest_user');
    angular.module('app').constant('public.clientKey', 'guest_user');
    angular.module('app').constant('public.urlShortenerApiKey', 'AIzaSyDLqgICAbnq75SJF5NfpNqzpjwPXQo7YgA');
    angular.module('app').constant('public.urlShortenerApiUrl', 'https://www.googleapis.com/urlshortener/v1/url');
    angular.module('app').constant('termsOfUseCDNUrl', 'https://59ac97f6ca65569bb2d9a82888280ff3814a4274.googledrive.com/host/0B6z8XZULtV7xRGpyNktrM3hDWnc/Terms_of_Use/tou-text.html');
}());



(function() {

    angular
        .module('app')
        .factory('urlShortenerService', urlShortenerService);

    urlShortenerService.$inject = [
        '$http',
        'public.urlShortenerApiKey',
        'public.urlShortenerApiUrl',
        'exception'
    ];

    function urlShortenerService($http, shortenerApiKey, urlShortenerApiUrl, exception) {

        var service = {
            shortenUrl: shortenUrl
        };

        return service;

        ///////////////////////////////////////////

        function shortenUrl(url) {

            var body = {
                longUrl: url
            };

            return $http.post(urlShortenerApiUrl + '?key=' + shortenerApiKey, body)
                .then(function(response) {
                    return response.data.id;
                })
                .catch(exception.catcher('There was a problem generating short url'));
        }

    }

}());

(function() {

    angular
        .module('app')
        .factory('api.usersService', UserService);

    UserService.$inject = ['$http', 'api.url', 'exception', '$q'];

    function UserService($http, apiUrl, exception, $q) {

        var service = {
            getAll: getAll,
            deleteUser: deleteUser,
            getMe: getMe,
            getClients: getClients,
            godCreatesUser: godCreatesUser
        };

        return service;

        //////////////////////////////////////

        function getAll() {

            var url = apiUrl + 'users';

            return $http.get(url)
                .catch(exception.catcher('There was a problem to get all users.'));
        }

        function deleteUser(id) {

            var url = apiUrl + 'user/' + id;

            return $http.delete(url)
                .catch(exception.catcher('There was a problem to delete user.'));

        }

        function getMe() {

            var url = apiUrl + 'me';

            return $http.get(url, {
                    __ingoreTermsOfUseAcceptance: true
                })
                .then(function(response) {

                    return response.data;

                })
                .catch(exception.catcher('There was a problem while getting your data.'));
        }

        function getClients(token) {

            var deffered = $q.defer();

            var url = apiUrl + 'user/clients';
            var config = getConfig(token);

            $http.get(url, config)
                .then(function(response) {
                    deffered.resolve(response.data);
                })
                .catch(function(error) {
                    deffered.reject('Token is invalid.');
                });

            return deffered.promise;
        }

        function godCreatesUser(user) {

            var url = apiUrl + 'users';

            var data = {
                username: user.username,
                password: user.password,
                email: user.email,
                organizationName: user.organisation,
                name: user.fullName
            };

            return $http.post(url, data)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem create new user.'));
        }

        function getConfig(token) {

            var config = {
                headers: {},
                __donotrefreshtoken: true
            };

            if (token) {

                config.headers.Authorization = 'Bearer {0}'.format(token);

            }

            return config;
        }
    }

}());

(function(ng) {

    ng
        .module('app')
        .factory('asset.repository', assetsRepository);

    assetsRepository.$inject = ['api.assetsService', 'exception', 'assetModel'];

    function assetsRepository(assetsService, exception, AssetModel) {

        var service = {
            find: find,
            create: create,
            createUsingToken: createUsingToken,
            createUsingTicket: createUsingTicket,
            replaceControl: replaceControl,
            replaceProfile: replaceProfile,
            publishCommand: publishCommand,
            publishState: publishState,
            remove: remove,
            update: update
        };

        return service;

        //////////////////////////////

        function find(assetId) {

            return assetsService.getAsset(assetId)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                });
        }

        function create(deviceId, name, title, type, profile, control) {

            return assetsService.createAsset(deviceId, name, title, type, profile, control)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                })
                .catch(exception.catcher('Error creating new asset.'));
        }

        function createUsingToken(deviceId, asset, token) {

            return assetsService.createAssetUsingToken(deviceId, asset, token)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                })
                .catch(exception.catcher('Error creating new asset.'));

        }

        function createUsingTicket(ticket, data) {

            return assetsService.createAssetUsingTicket(ticket, data)
                .then (function(response) {

                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;

                })
                .catch(exception.catcher('Error creating new asset.'));

        }

        function replaceControl(deviceId, assetName, value) {

            return assetsService.replaceControl(deviceId, assetName, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error replacing control asset.'));
        }

        function replaceProfile(deviceId, assetName, value) {

            return assetsService.replaceProfile(deviceId, assetName, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error replacing asset profile.'));
        }

        function publishCommand(id, value) {

            return assetsService.publishCommand(id, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error publishing command.'));
        }

        function publishState(id, value) {

            return assetsService.publishState(id, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error publishing state.'));
        }

        function remove(deviceId, assetName) {
            return assetsService.deleteAsset(deviceId, assetName);
        }

        function update(deviceId, assetId, assetName, assetIs, title) {
            return assetsService.updateAsset(deviceId, assetId, assetName, assetIs, title)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                });
        }
    }

}(window.angular));

 (function(ng) {
     ng
         .module('app')
         .factory('capp.live', cappLive);

     //cappLive.$inject = ['$window', '$rootScope', 'session', 'broker.url', 'broker.port', 'broker.sourceRoot', 'public.clientId', 'public.clientKey', '$q'];
     cappLive.$inject = ['$window', '$rootScope', 'session', 'app.config', '$q'];

     function cappLive($window, $rootScope, session, appConfig, $q) {

         var connected = false;
         var service = {
             init: init,
             entity: $window.CappLive,
             connect: connect,
             disconnect: disconnect,
             isConnected: isConnected,
             all: $window.CappLive.all,
             subscribe: $window.CappLive.subscribe
         };

         return service;

         /////////////////////

         function init() {

             $window.CappLive.brokerUrl = appConfig.broker.url;
             $window.CappLive.brokerPort = appConfig.broker.port;
             $window.CappLive.sourceRoot = appConfig.broker.sourceRoot;

             if (session.authentication().isAuth) {
                 save(session.authentication().rmq.clientId, session.authentication().rmq.clientKey);
                 connect(session.authentication().rmq.clientId, session.authentication().rmq.clientKey);
             }

             $rootScope.$on('user.login', function() {

                 disconnect().then(function() {
                     save(session.authentication().rmq.clientId, session.authentication().rmq.clientKey);
                     connect(session.authentication().rmq.clientId, session.authentication().rmq.clientKey);
                 });
             });

             $rootScope.$on('user.logout', function() {

                 disconnect();
             });
         }

         function connect(clientId, clientKey) {

             var deffered = $q.defer();

             var disconnectPromise = disconnect();

             disconnectPromise.then(function() {
                 $window.CappLive.connect(clientId, clientKey, function() {
                         deffered.resolve();
                         connected = true;
                     },

                     function() {
                         deffered.reject();
                         connected = false;
                     });
             });

             return deffered.promise;
         }

         function disconnect() {
             var deffered = $q.defer();

             $window.CappLive.disconnect(function() {
                 deffered.resolve();
                 connected = false;
             });

             return deffered.promise;
         }

         function isConnected() {
             return connected;
         }

         function save(clientId, clientKey) {

             $window.CappLive.clientId = clientId;
             $window.CappLive.clientKey = clientKey;
         }
     }

 }(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('controls.repository', controlsRepository);

    controlsRepository.$inject = ['utils'];

    function controlsRepository(utils) {

        var defaultDeviceControlName = 'bar-chart';

        var deviceControls = [{
            name: 'bar-chart',
            title: 'Bar Chart',
            description: 'Shows numerical assets activity in bar chart.'
        }, {
            name: 'line-chart',
            title: 'Line Chart',
            description: 'Shows numerical assets activity in line chart.'
        }, {
            name: 'area-range-chart',
            title: 'Area Graph Chart',
            description: 'Shows numerical assets activity with minimum and maximum values.'
        }];

        var service = {

            findAllDeviceControls: findAllDeviceControls,
            defaultDeviceControlName: defaultDeviceControlName

        };

        return service;

        ////////////////

        function findAllDeviceControls() {

            return utils.$q.when(deviceControls);

        }
    }
})();

(function() {

    angular
        .module('app')
        .factory('device.repository', devicesRepository);

    devicesRepository.$inject = ['api.devicesService', 'exception', 'deviceModel', 'utils', 'controls.repository'];

    function devicesRepository(devicesService, exception, DeviceModel, utils, controlsRepository) {

        var _defaultDeviceSettings = {

            control: controlsRepository.defaultDeviceControlName

        };

        var service = {
            create: create,
            createInGround: createInGround,
            update: update,
            updateControl: updateControl,
            remove: remove,
            find: find,
            findAll: findAll,
            findAllInGround: findAllInGround,

            //using token
            createUsingToken: createUsingToken,
            updateUsingToken: updateUsingToken,
            findAllUsingToken: findAllUsingToken,
            findSelfUsingTicket: findSelfUsingTicket,

            saveDeviceSettings: saveDeviceSettings,
            getDeviceSettings: getDeviceSettings
        };

        return service;

        //////////////////////////////

        function create(data) {

            return devicesService.create(data)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function subscribeDevice(device) {

            device.subscribe(true);

            return device;

        }

        function createInGround(data, groundId) {

            return devicesService.createInGround(data, groundId)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function update(deviceId, data) {

            return devicesService.updateDevice(deviceId, data)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error updating device.'));

        }

        function updateControl(id, control) {

            return devicesService.updateDeviceControl(id, control)
                .catch(exception.catcher('Error updating device control.'));

        }

        function remove(id) {

            return devicesService.deleteDevice(id)
                .catch(exception.catcher('Error deleting device'));

        }

        function createUsingToken(deviceConfig, token) {

            return devicesService.createUsingToken(deviceConfig, token)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error creating new device.'));

        }

        function updateUsingToken(deviceConfig, token) {

            return devicesService.updateUsingToken(deviceConfig, token)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice)
                .catch(exception.catcher('Error updating device.'));

        }

        function find(deviceId) {

            return devicesService.get(deviceId)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice);

        }

        function findAll(byName) {

            return devicesService.getAll(byName)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading devices'));

        }

        function findAllInGround(groundId) {

            return devicesService.getFromGround(groundId)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading devices'));

        }

        function findAllUsingToken(byName, token) {

            return devicesService.getAllUsingToken(byName, token)
                .then(utils.transformResponse(DeviceModel))
                .catch(exception.catcher('Error loading public devices'));

        }

        function saveDeviceSettings(deviceId, settings) {

            var key = getDeviceSettingsKey(deviceId);

            var existingSettings = utils.preferences.readGlobal(key);

            if (existingSettings) {

                angular.extend(existingSettings, settings);

            } else {

                existingSettings = settings;

            }

            utils.preferences.rememberGlobal(key, existingSettings);

            return utils.$q.when();

        }

        function getDeviceSettings(deviceId) {

            var key = getDeviceSettingsKey(deviceId);

            var existingSettings = utils.preferences.readGlobal(key);

            var settings = null;

            if (existingSettings) {

                settings = angular.extend({}, _defaultDeviceSettings, existingSettings);

            } else {

                settings = angular.extend({}, _defaultDeviceSettings);

            }

            return utils.$q.when(settings);
        }

        function findSelfUsingTicket(ticket) {

            return devicesService.getSelfUsingTicket(ticket)
                .then(utils.transformResponse(DeviceModel))
                .then(subscribeDevice);

        }

        function getDeviceSettingsKey(deviceId) {

            return 'device-settings-{0}'.format(deviceId);

        }
    }

}());

(function() {

    angular
        .module('app')
        .factory('gateway.repository', gatewayRepository);

    gatewayRepository.$inject = ['api.GatewayService', 'exception', 'gatewayModel', 'utils'];

    function gatewayRepository(gatewayService, exception, GatewayModel, utils) {

        var service = {
            find: find,
            findAll: findAll,
            remove: remove,
            update: update,
            findAllInGround: findAllInGround,
            claimGateway: claimGateway
        };

        return service;

        //////////////////////////////

        function find(gatewayId, includeDevices, includeAssets) {

            if (!includeDevices) {

                includeDevices = false;

            }

            if (!includeAssets) {

                includeAssets = false;

            }

            return gatewayService.getGateway(gatewayId, includeDevices, includeAssets)
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateway.'));
        }

        function findAll() {

            return gatewayService.listGateways()
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateways.'));

        }

        function findAllInGround(groundId) {

            return gatewayService.getFromGround(groundId)
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateways.'));

        }

        function remove(gatewayId) {

            return gatewayService.deleteGateway(gatewayId)
                .catch(exception.catcher('There was a problem to remove gateway.'));

        }

        function update(gatewayId, name, description) {

            return gatewayService.updateGateway(gatewayId, name, description)
                .catch(exception.catcher('There was a problem to update gateway.'));

        }

        function claimGateway(groundId, claimCode) {

            return gatewayService.claimGateway(groundId, claimCode)
                .catch(exception.catcher('There was a problem to claim gateway.'));
        }

    }

}());

(function() {
    'use strict';

    angular
        .module('app')
        .factory('ground.repository', groundRepository);

    groundRepository.$inject = ['groundsService', 'groundModel', 'exception', 'utils'];

    function groundRepository(groundsService, GroundModel, exception, utils) {

        var service = {
            find: find,
            findAll: findAll,
            findAllPublic: findAllPublic,
            findAllShared: findAllShared,
            delete: deleteGround,
            create: create,
            update: update
        };

        return service;

        ////////////////

        function find(id) {

            return groundsService.find(id)
                .then(utils.transformResponse(GroundModel));
        }

        function findAll() {

            return groundsService.findAll()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function findAllPublic() {

            return groundsService.findAllPublic()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function findAllShared() {

            return groundsService.findAllShared()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function deleteGround(id) {

            return groundsService.delete(id)
                .then(function() {
                    utils.$rootScope.$emit('ground.delete', id);
                })
                .catch(exception.catcher('Error while deleting ground.'));
        }

        function create(name, visibility) {

            return groundsService.create(name, visibility)
                .then(utils.transformResponse(GroundModel))
                .then(function(ground) {
                    utils.$rootScope.$emit('ground.create', ground);
                    return ground;
                })
                .catch(exception.catcher('Error while creating ground.'));

        }

        function update(id, data) {

            return groundsService.update(id, data)
                .then(utils.transformResponse(GroundModel))
                .then(function(ground) {
                    utils.$rootScope.$emit('ground.update', ground);
                    return ground;
                })
                .catch(exception.catcher('Error while updating ground.'));
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('history.service', historyService);

    historyService.$inject = ['api.assetsService'];

    function historyService(assetsService) {

        var service = {

            getAssetHistory: getAssetHistory,

            subscribeOnAssetStateChange: subscribeOnAssetStateChange

        };

        return service;

        ////////////////////////////////////////////////////////////

        function getAssetHistory(assetId, from, to, resolution) {

            return assetsService.getAssetHistory(assetId, from, to, resolution);

        }

        function subscribeOnAssetStateChange(asset, stateChangeHandler) {

            asset.on('state', stateChangeHandler);

        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('members.repository', membersRepository);

    membersRepository.$inject = ['membersService', 'memberModel', 'exception', 'utils'];

    function membersRepository(membersService, MemberModel, exception, utils) {

        var service = {
            findAll: findAll,
            deleteMember: deleteMember,
            addMember: addMember
        };

        return service;

        ////////////////

        function findAll(groundId) {

            return membersService.findAll(groundId)
                .then(utils.transformResponse(MemberModel))
                .catch(exception.catcher('Error while loading members.'));
        }

        function deleteMember(groundId, memberId) {

            return membersService.deleteMember(groundId, memberId)
                .catch(exception.catcher('Error deleting member.'));
        }

        function addMember(groundID, memberEmail) {

            return membersService.addMember(groundID, memberEmail)
                .then(utils.transformResponse(MemberModel))
                .catch(exception.catcher('Error occured while adding member.'));

        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.game', GameFactory);

    GameFactory.$inject = ['demo.level', '$timeout'];

    function GameFactory(Level, $timeout) {

        var startCaption = '';
        var preSuspensionStatus = 'playing';

        function Game() {
            this.levels = [];
            this.caption = startCaption;
            this.status = 'tutorial';
            this.gameScreen = 'up';
            this.currentLevelIndex = 0;
            this.finishTimeout = null;
            this.transitionTimeout = null;
            this.transitionKeyTimeout = null;
            this.isLocked = false;
            this.key = '';

            var l1 = new Level.State(this, {
                order: 1,
                key: 'down',
                text: 'Put your phone on table',
                timeoutCaption: 'Nope, it\'s not on the table yet',
                successCaption: 'Cool, your phone is on table!',
                expectedAssetState: {
                    name: 'position',
                    value: 'ontable'
                }
            });

            var l2 = new Level.State(this, {
                order: 2,
                key: 'left',
                text: 'Now, rotate your phone left',
                timeoutCaption: 'Cmon, rotate it left',
                successCaption: 'Great, you rotated left!',
                expectedAssetState: {
                    name: 'rotation',
                    value: 'leftRotation'
                }
            });

            var l3 = new Level.State(this, {
                order: 3,
                key: 'right',
                text: 'Now, rotate your phone right',
                timeoutCaption: 'Cmon, rotate it right',
                successCaption: 'Great, you rotate it right!',
                expectedAssetState: {
                    name: 'rotation',
                    value: 'rightRotation'
                }
            });

            var l4 = new Level.State(this, {
                order: 4,
                key: 'shake',
                text: 'Now, shake it baby',
                timeoutCaption: 'Don\'t be shy, shake it :)',
                successCaption: 'Ooo, yeees, great.',
                expectedAssetState: {
                    name: 'amishaking',
                    value: 'shaking'
                },
                transition: {
                    delay: 4000,
                    status: {
                        delay: 1500,
                        caption: 'Going to the free level...',
                        key: 'tutorial-end'
                    }
                }
            });

            var l5 = new Level.Free(this, {
                order: 5,
                key: 'free',
                text: 'Try making some of previous moves, we\'ll guess which one it is',
                hideInNav: true
            });

            this.levels.push(l1, l2, l3, l4, l5);
        }

        Game.prototype.addLevel = function(levelConfig) {
            this.levels.push(this, levelConfig);
        };

        Game.prototype.setCaption = function(captionText) {
            this.caption = captionText;
        };

        Game.prototype.start = function() {
            this.getCurrentLevel().enter();
            if (this.status !== 'suspended') {
                this.status = 'tutorial';
            }
        };

        Game.prototype.suspend = function() {
            if (this.status !== 'suspended') {
                preSuspensionStatus = this.status;
                this.status = 'suspended';
            }
        };

        Game.prototype.unsuspend = function() {
            if (this.status === 'suspended') {
                this.status = preSuspensionStatus;
            }
        };

        Game.prototype.getCurrentLevel = function() {
            return this.levels[this.currentLevelIndex];
        };

        Game.prototype.isCurrentLevel = function(l) {
            return l.order === this.getCurrentLevel().order;
        };

        Game.prototype.isComplete = function() {
            var isComplete = true;

            angular.forEach(this.levels, function(l) {
                if (!l.isComplete) {
                    isComplete = false;
                }
            });

            return isComplete;
        };

        Game.prototype.setGameScreen = function(gameScreen) {
            this.gameScreen = gameScreen;
        };

        Game.prototype.play = function(assetName, assetValue) {

            var that = this;

            if (that.isComplete() || that.isLocked) {
                return;
            }

            var level = that.getCurrentLevel();
            level.stateChanged(assetName, assetValue);

            if (!that.isComplete() && level.isComplete) {
                if (!level.transition) {
                    that.currentLevelIndex++;
                    that.getCurrentLevel().enter();
                    that.key = that.getCurrentLevel().key;
                } else {
                    that.isLocked = true;

                    //delay transition to the next step
                    that.transitionTimeout = $timeout(function() {
                            that.currentLevelIndex++;
                            that.getCurrentLevel().enter();
                            that.key = that.getCurrentLevel().key;
                            that.isLocked = false;
                        },

                        level.transition.delay);

                    //delay change of the text and screen
                    that.transitionKeyTimeout = $timeout(function() {
                            that.setCaption(level.transition.status.caption);
                            that.key = level.transition.status.key;
                        },

                        level.transition.status.delay);
                }
            }
        };

        Game.prototype.skip = function() {

            var level = this.getCurrentLevel();
            level.skip();

            if (!this.isComplete() && level.isComplete) {
                this.currentLevelIndex++;
                this.getCurrentLevel().enter();
                this.key = this.getCurrentLevel().key;
            }

            this.setCaption('');
        };

        Game.prototype.restart = function() {
            if (this.finishTimeout) {
                $timeout.cancel(this.finishTimeout);
            }

            if (this.transitionTimeout) {
                $timeout.cancel(this.transitionTimeout);
            }

            if (this.transitionKeyTimeout) {
                $timeout.cancel(this.transitionKeyTimeout);
            }

            angular.forEach(this.levels, function(l) {
                l.reset();
            });

            this.currentLevelIndex = 0;
            this.caption = startCaption;
            this.status = 'tutorial';
            this.key = null;
            this.isLocked = false;
            this.gameScreen = 'up';
            this.start();
        };

        return Game;
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.level', LevelFactory);

    LevelFactory.$inject = ['$timeout', '$interval'];

    function LevelFactory($timeout, $interval) {

        //Base Level
        function BaseLevel() {

            this.isComplete = false;
            this.isTimeouted = false;
            this.isWaiting = false;
            this.order = 0;
            this.key = '';
            this.text = '';
            this.game = null;
            this.hideInNav = false;
            this.transition = null;
        }

        BaseLevel.prototype.stateChanged = function(assetName, assetValue) {};

        BaseLevel.prototype.enter = function() {};

        BaseLevel.prototype.reset = function() {};

        BaseLevel.prototype.skip = function() {};

        //State Level
        function StateLevel(game, config) {

            this.game = game;
            this.order = config.order;
            this.key = config.key;
            this.text = config.text;
            this.timeoutCaption = config.timeoutCaption;
            this.successCaption = config.successCaption;
            this.expectedAssetState = config.expectedAssetState;

            this.captionWarningTimerInterval = 7000;
            this.captionWarningTimer = null;
            this.waitingTimerInterval = 3000;
            this.waitingTimer = null;

            if (config.transition) {
                this.transition = config.transition;
            }

            if (config.captionWarningTimerInterval) {
                this.captionWarningTimerInterval = config.captionWarningTimerInterval;
            }

            if (config.waitingTimerInterval) {
                this.waitingTimerInterval = config.waitingTimerInterval;
            }
        }

        StateLevel.prototype = new BaseLevel();
        StateLevel.prototype.constructor = StateLevel;

        StateLevel.prototype.stateChanged = function(assetName, assetValue) {

            if (this.expectedAssetState.name === assetName && this.expectedAssetState.value === assetValue) {

                $timeout.cancel(this.captionWarningTimer);
                $timeout.cancel(this.waitingTimer);

                this.game.setCaption(this.successCaption);
                this.game.setGameScreen(this.key);
                this.isComplete = true;
                this.isTimeouted = false;
                this.isWaiting = false;
            }
        };

        StateLevel.prototype.skip = function() {
            this.isComplete = true;
            this.isTimeouted = false;
            this.isWaiting = false;

            if (this.captionWarningTimer) {
                $timeout.cancel(this.captionWarningTimer);
            }

            if (this.waitingTimer) {
                $timeout.cancel(this.waitingTimer);
            }
        };

        StateLevel.prototype.enter = function() {
            var that = this;

            that.captionWarningTimer = $timeout(function() {
                that.game.setCaption(that.timeoutCaption);
                that.isTimeouted = true;
            }, that.captionWarningTimerInterval);

            that.waitingTimer = $timeout(function() {
                that.isWaiting = true;
            }, that.waitingTimerInterval);
        };

        StateLevel.prototype.reset = function() {

            this.isComplete = false;
            this.isTimeouted = false;
            this.isWaiting = false;

            if (this.captionWarningTimer) {
                $timeout.cancel(this.captionWarningTimer);
            }

            if (this.waitingTimer) {
                $timeout.cancel(this.waitingTimer);
            }
        };

        //Free Level
        function FreeLevel(game, config) {
            this.game = game;
            this.order = config.order;
            this.key = config.key;
            this.text = config.text;
            this.hideInNav = config.hideInNav;

            this.queue = [];
        }

        FreeLevel.prototype = new BaseLevel();
        FreeLevel.prototype.constructor = FreeLevel;

        FreeLevel.prototype.stateChanged = function(assetName, assetValue) {

            this.queue.push({
                assetName: assetName,
                assetValue: assetValue
            });
        };

        FreeLevel.prototype.enter = function() {
            var that = this;
            that.game.setGameScreen('up');

            $interval(function() {
                that.processQueue();
            }, 30);

            that.game.status = 'free';
            that.game.setCaption('');
        };

        FreeLevel.prototype.processQueue = function() {
            var that = this;
            var item = that.queue.shift();

            if (!item) {
                return;
            }

            var assetName = item.assetName;
            var assetValue = item.assetValue;

            if (that.game.gameScreen === 'up') {
                if (assetName === 'position' && assetValue === 'ontable') {

                    that.game.setGameScreen('down');
                    that.game.setCaption('I\'m on a table');
                }
            }

            if (that.game.gameScreen === 'down' || that.game.gameScreen === 'left' || that.game.gameScreen === 'right') {
                if (assetName === 'position' && assetValue === 'notontable') {

                    that.game.setGameScreen('up');
                    that.game.setCaption('I\'m up!');
                }
            }

            if (assetName === 'amishaking' && assetValue === 'shaking') {

                that.game.setGameScreen('shake');
                that.game.setCaption('I\'m Shakin\'!');
            }

            if (that.game.gameScreen === 'shake') {
                if (assetName === 'amishaking' && assetValue === 'still') {

                    that.game.setGameScreen('up');
                    that.game.setCaption('I\'m up!');
                }
            }

            if (that.game.gameScreen === 'shake') {
                if (assetName === 'position' && assetValue === 'ontable') {

                    that.game.setGameScreen('down');
                    that.game.setCaption('I\'m on a table');
                }
            }

            if (that.game.gameScreen !== 'shake') {
                if (assetName === 'rotation' && assetValue === 'leftRotation') {

                    that.game.setGameScreen('left');
                    that.game.setCaption('Left rotation!');
                }

                if (assetName === 'rotation' && assetValue === 'rightRotation') {

                    that.game.setGameScreen('right');
                    that.game.setCaption('Right rotation!');
                }
            }
        };

        return {
            State: StateLevel,
            Free: FreeLevel
        };
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.motion', Motion);

    Motion.$inject = ['$window'];

    function Motion($window) {

        var service = {
            isSupported: isSupported,
            subscribeOnMoveChange: subscribeOnMoveChange
        };

        var moveSubscribers = [];
        var lastUpdate = -1;
        var x;
        var y;
        var z;
        var lastX;
        var lastY;
        var lastZ;
        var isListenerAttached = false;
        var lastPublishedMoveValue = null;
        var lastKnownDirection = null;
        var numRight = 0;
        var numLeft = 0;
        var isStill = null;
        var sampleCount = 0;

        var SAMPLE_INTERVAL = 20; //miliseconds
        var MOVE_THRESHOLD = 0.6;

        return service;

        /////////////////////////////

        function isSupported() {
            return ('ondevicemotion' in $window);
        }

        function subscribeOnMoveChange(moveHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            moveSubscribers.push(moveHandler);
        }

        function attachListener() {
            $window.addEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = true;
        }

        function deviceMotionChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            x = event.acceleration.x;
            y = event.acceleration.y;
            z = event.acceleration.z;

            //one update every 100ms
            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL) {

                var diffTime = currentTime - lastUpdate;
                lastUpdate = currentTime;

                var xDiff = lastX - x;
                sampleCount++;

                //decide direction
                if (xDiff > MOVE_THRESHOLD) {
                    numRight++;
                } else if (xDiff < -MOVE_THRESHOLD) {
                    numLeft++;
                }

            }

            if (sampleCount > 4) {
                if (numRight > numLeft) {
                    lastKnownDirection = 'right';
                } else if (numLeft > numRight) {
                    lastKnownDirection = 'left';
                } else {
                    publishMove(lastKnownDirection);
                }

                numRight = 0;
                numLeft = 0;
                sampleCount = 0;
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

        function publishMove(isMoving) {
            if (lastPublishedMoveValue !== isMoving) {
                for (var i = 0; i < moveSubscribers.length; i++) {
                    moveSubscribers[i](isMoving);
                }

                lastPublishedMoveValue = isMoving;
            }
        }
    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('demo.orientation', orientation);

    orientation.$inject = ['$window'];

    function orientation($window) {

        var UPPER_BETA_POSITION_BOUND = 120;
        var LOWER_BETA_POSITION_BOUND = 60;
        var UPPER_BETA_LAYING_ON_TABLE = 10;
        var LOWER_BETA_LAYING_ON_TABLE = -5;
        var UPPER_ROTATION_BOUND = 5;
        var LOWER_ROTATION_BOUND = -5;
        var ROTATION_SENSITIVITY = 30;
        var SAMPLE_INTERVAL = 100; //ms

        var rotationSubscribers = [];
        var verticalSubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = null;

        var alpha, beta, gamma;
        var pAlpha, pBeta, pGamma;

        var service = {
            isSupported: isSupported,
            subscribeOnRotation: subscribeRotation,
            subscribeOnVerticalOrientationChange: subscribeVertical
        };

        return service;

        ////////////////////////////

        function isSupported() {
            return ('ondeviceorientation' in $window);
        }

        function subscribeRotation(rotationHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            rotationSubscribers.push(rotationHandler);
        }

        function subscribeVertical(verticalHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            verticalSubscribers.push(verticalHandler);
        }

        function attachListener() {
            $window.addEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = true;
        }

        function deviceOrientationChanged(event) {
            var date = new Date();
            var currentTime = date.getTime();

            alpha = Math.round(event.alpha);
            beta = Math.round(event.beta);
            gamma = Math.round(event.gamma);

            if (pAlpha === undefined || pBeta === undefined || pGamma === undefined) {
                pAlpha = alpha;
                pBeta = beta;
                pGamma = gamma;
            }

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL && (isValidRotation(alpha - pAlpha) || isValidRotation(beta - pBeta) || isValidRotation(gamma - pGamma))) {

                lastUpdate = currentTime;

                if (isRotating()) {
                    publishRotation('ROTATING');
                }

                if (isOnTable(beta)) {
                    publishVertical('ON TABLE RESTING');
                } else {
                    publishVertical('I AM NOT RESTING');
                }

                pAlpha = alpha;
                pBeta = beta;
                pGamma = gamma;
            }
        }

        function publishRotation(message) {

            for (var i = 0; i < rotationSubscribers.length; i++) {
                rotationSubscribers[i](message);
            }
        }

        function publishVertical(message) {

            if (lastPublishedValue !== message) {
                for (var i = 0; i < verticalSubscribers.length; i++) {
                    verticalSubscribers[i](message);
                }

                lastPublishedValue = message;
            }
        }

        function isVertical(value) {

            if (value > LOWER_BETA_POSITION_BOUND && value < UPPER_BETA_POSITION_BOUND) {
                return true;
            } else {
                return false;
            }
        }

        function isOnTable(value) {
            if (value > LOWER_BETA_LAYING_ON_TABLE && value < UPPER_BETA_LAYING_ON_TABLE) {
                return true;
            } else {
                return false;
            }
        }

        function isRotating() {

            alphaDiff = alpha - pAlpha;
            betaDiff = beta - pBeta;
            gammaDiff = gamma - pGamma;

            if (inRotationBound(alphaDiff) || inRotationBound(betaDiff) || inRotationBound(gammaDiff)) {
                return true;
            } else {
                return false;
            }
        }

        function isValidRotation(difference) {

            if (Math.abs(difference) > ROTATION_SENSITIVITY) {
                return true;
            } else {
                return false;
            }
        }

        function inRotationBound(value) {

            if (value < UPPER_ROTATION_BOUND && value > LOWER_ROTATION_BOUND) {
                return false;
            } else {
                return true;
            }
        }
    }
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .factory('demo.pageVisibility', pageVisibility);

    pageVisibility.$inject = ['$window'];

    function pageVisibility($window) {

        var visibilitySubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = true;
        var eventName = null;

        var service = {
            subscribeOnPageVisibility: subscribeOnPageVisibility,
            unsubscribeOnPageVisibility: unsubscribeOnPageVisibility
        };

        return service;

        ////////////////////////////

        function getHiddenProp() {
            var prefixes = ['webkit', 'moz', 'ms', 'o'];

            if ('hidden' in document) {
                return 'hidden';
            }

            for (var i = 0; i < prefixes.length; i++) {
                if ((prefixes[i] + 'Hidden') in document) {
                    return prefixes[i] + 'Hidden';
                }
            }

            return null;
        }

        function subscribeOnPageVisibility(visibilityHandler) {

            if (!isListenerAttached) {
                attachListener();
            }

            visibilitySubscribers.push(visibilityHandler);
        }

        function unsubscribeOnPageVisibility() {
            visibilitySubscribers = [];
            document.removeEventListener(eventName, pageVisibilityChanges);
            isListenerAttached = false;
        }

        function attachListener() {
            var visProp = getHiddenProp();
            if (visProp) {
                eventName = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
                document.addEventListener(eventName, pageVisibilityChanges);
            }

            isListenerAttached = true;
        }

        function pageVisibilityChanges(event) {
            publishVisibility(!lastPublishedValue);

        }

        function publishVisibility(message) {
            if (lastPublishedValue !== message) {
                for (var i = 0; i < visibilitySubscribers.length; i++) {
                    visibilitySubscribers[i](message);
                }

                lastPublishedValue = message;
            }
        }

    }
}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.position', Position);

    Position.$inject = ['$window', '$timeout'];

    function Position($window, $timeout) {

        var service = {
            isSupported: isSupported,
            subscribeOnPositionChange: subscribeOnPositionChange,
            unsubscribeOnPositionChange: unsubscribeOnPositionChange
        };

        var positionSubscribers = [];
        var lastPublishedPosition = null;
        var otherLastPublishedPos = null;
        var isListenerAttached = false;

        var alpha;
        var beta;
        var gamma;
        var x;
        var y;
        var z;

        var MOVE_BOUND = 0.3;
        var HORIZONTAL_BOUND = 2;

        return service;

        ///////////////////////////////////////////

        function isSupported() {
            var isIt = (('ondevicemotion' in $window) && ('ondeviceorientation' in $window));
            return isIt;
        }

        function subscribeOnPositionChange(positionChangeHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            positionSubscribers.push(positionChangeHandler);

        }

        function unsubscribeOnPositionChange() {
            positionSubscribers = [];
            $window.removeEventListener('devicemotion', positionHandler);
            $window.removeEventListener('deviceorientation', positionHandler);
            isListenerAttached = false;
        }

        function attachListener() {
            $window.addEventListener('devicemotion', positionHandler);
            $window.addEventListener('deviceorientation', positionHandler);
            isListenerAttached = true;
        }

        function positionHandler(event) {
            if (event.alpha || event.beta || event.gamma) {
                alpha = event.alpha;
                beta = event.beta;
                gamma = event.gamma;
            }

            if (event.acceleration) {
                x = event.acceleration.x;
                y = event.acceleration.y;
                z = event.acceleration.z;
            }

            if (isDataCollected(alpha, beta, gamma) && isDataCollected(x, y, z)) {
                if (isLayingDown(beta, gamma)) {
                    if (isStill(x, y, z)) {
                        pub(true);
                    }
                } else {
                    pub(false);
                }
            }
        }

        var trueTimeout = null;

        function pub(position) {

            if (lastPublishedPosition != position) {

                if (trueTimeout) {
                    $timeout.cancel(trueTimeout);
                }

                if (position) {

                    trueTimeout = $timeout(function() {

                        publishPosition(true);

                    }, 200);

                } else {
                    publishPosition(false);
                }

                lastPublishedPosition = position;
            }
        }

        function publishPosition(position) {
            if (otherLastPublishedPos != position) {
                for (var i = 0; i < positionSubscribers.length; i++) {
                    positionSubscribers[i](position);
                }

                otherLastPublishedPos = position;
            }

        }

        function isDataCollected(x, y, z) {
            if (x !== null && y !== null && z !== null) {
                return true;
            } else {
                return false;
            }
        }

        function isLayingDown(beta, gamma) {
            if (beta > -HORIZONTAL_BOUND && beta < HORIZONTAL_BOUND) {
                if (gamma > -HORIZONTAL_BOUND && gamma < HORIZONTAL_BOUND) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        function isStill(x, y, z) {
            if ((x < MOVE_BOUND && x > -MOVE_BOUND) || (y < MOVE_BOUND && y > -MOVE_BOUND) || (z < MOVE_BOUND && z > -MOVE_BOUND)) {
                return true;
            } else {
                return false;
            }
        }
    }
})();

(function(ng) {
    ng
        .module('app')
        .factory('demo.rotation', rotation);

    rotation.$inject = ['$window', '$interval'];

    function rotation($window, $interval) {

        var UPPER_ROTATION_BOUND = 100;
        var LOWER_ROTATION_BOUND = -100;
        var SAMPLE_INTERVAL = 40; //ms
        var HORIZONTAL_BOUND = 5;

        var rotationSubscribers = [];
        var lastUpdate = -1;
        var isListenerAttached = false;
        var lastPublishedValue = null;
        var sampleCount = 0;
        var rightCount = 0;
        var leftCount = 0;

        var alpha;
        var beta;
        var gamma;
        var pAlpha;
        var pBeta;
        var pGamma;
        var alphaDiffSum = null;

        var service = {
            isSupported: isSupported,
            subscribeOnRotation: subscribeRotation,
            unsubscribeOnRotationChange: unsubscribeOnRotationChange
        };

        return service;

        ////////////////////////////

        function isSupported() {
            return ('ondeviceorientation' in $window);
        }

        function subscribeRotation(rotationHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            rotationSubscribers.push(rotationHandler);
        }

        function unsubscribeOnRotationChange() {
            rotationSubscribers = [];
            $window.removeEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = false;
        }

        function attachListener() {
            $window.addEventListener('deviceorientation', deviceOrientationChanged);
            isListenerAttached = true;

            $interval(function() {

                if (Math.abs(alphaDiffSum) > 20) {
                    if (isPhoneHorizontal(beta, gamma)) {
                        if (alphaDiffSum > 0) {
                            publishRotation('leftRotation');
                        } else {
                            publishRotation('rightRotation');
                        }
                    }
                }

                alphaDiffSum = null;

            }, 1000);
        }

        function deviceOrientationChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            alpha = Math.round(event.alpha);
            beta = Math.round(event.beta);
            gamma = Math.round(event.gamma);

            if (pAlpha === undefined) {
                pAlpha = alpha;
            }

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL && alpha !== pAlpha) {

                lastUpdate = currentTime;
                var alphaDiff = alpha - pAlpha;

                if (Math.abs(alphaDiff) < 100) {
                    if (alphaDiffSum === null) {
                        alphaDiffSum = 0;
                    }

                    alphaDiffSum += alphaDiff;
                }
            }

            pAlpha = alpha;
        }

        function publishRotation(message) {

            for (var i = 0; i < rotationSubscribers.length; i++) {
                rotationSubscribers[i](message);
            }

        }

        function isPhoneHorizontal(beta, gamma) {
            if ((beta > -HORIZONTAL_BOUND && beta < HORIZONTAL_BOUND) && (gamma > -HORIZONTAL_BOUND && gamma < HORIZONTAL_BOUND)) {
                return true;
            } else {
                return false;
            }
        }

    }
}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.sensors', sensorsFactory);

    sensorsFactory.$inject = ['demo.shake',
        'demo.position',
        'demo.motion',
        'demo.pageVisibility',
        'demo.rotation'
    ];

    function sensorsFactory(shake, position, motion, pageVisibility, rotation) {
        var service = {
            shake: shake,
            position:position,
            motion:motion,
            pageVisibility: pageVisibility,
            rotation:rotation
        };
        return service;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.shake', shake);

    shake.$inject = ['$window', '$interval'];

    function shake($window, $interval) {

        var service = {
            isSupported: isSupported,
            subscribeOnShakeChange: subscribeShaker,
            unsubscribeOnShakeChange: unsubscribeShaker,
            subscribeOnSpeedChange: subscribeOnSpeedChange
        };

        var shakeSubscribers = [];
        var speedSubscribers = [];
        var lastUpdate = -1;
        var x;
        var y;
        var z;
        var lastX;
        var lastY;
        var lastZ;
        var isListenerAttached = false;
        var lastPublishedShakeValue = null;
        var lastPublishedSpeedValue = null;
        var timesShaken = 0;
        var intervalPromise = null;

        var SHAKE_THRESHOLD_SPEED = 500;
        var SAMPLE_INTERVAL = 50; //miliseconds
        var MOVE_THRESHOLD = 0.3;

        return service;

        /////////////////////////////

        function isSupported() {
            return ('ondevicemotion' in $window);
        }

        function subscribeShaker(shakeHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            shakeSubscribers.push(shakeHandler);
        }

        function unsubscribeShaker() {
            shakeSubscribers = [];
            $window.removeEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = false;

            if (intervalPromise !== null) {
                $interval.cancel(intervalPromise);
            }
        }

        function subscribeOnSpeedChange(speedHandler) {
            if (!isSupported()) {
                return;
            }

            if (!isListenerAttached) {
                attachListener();
            }

            speedSubscribers.push(speedHandler);
        }

        function attachListener() {
            $window.addEventListener('devicemotion', deviceMotionChanged);
            isListenerAttached = true;

            intervalPromise = $interval(function() {

                console.log(timesShaken, 'Times Shaken');

                if (timesShaken > 4) {
                    publishShake(true);
                }

                if (timesShaken <= 2) {
                    publishShake(false);
                }

                timesShaken = 0;
            }, 1000);
        }

        function deviceMotionChanged(event) {

            var date = new Date();
            var currentTime = date.getTime();

            x = event.acceleration.x;
            y = event.acceleration.y;
            z = event.acceleration.z;

            if ((currentTime - lastUpdate) > SAMPLE_INTERVAL) {

                var diffTime = currentTime - lastUpdate;
                lastUpdate = currentTime;

                var speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
                if (speed > SHAKE_THRESHOLD_SPEED) {
                    timesShaken++;
                }
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        }

        function publishShake(isShakin) {
            if (lastPublishedShakeValue !== isShakin) {
                for (var i = 0; i < shakeSubscribers.length; i++) {
                    shakeSubscribers[i](isShakin);
                }

                lastPublishedShakeValue = isShakin;
            }
        }

        function publishSpeed(speed) {
            if (lastPublishedSpeedValue !== speed) {
                for (var i = 0; i < speedSubscribers.length; i++) {
                    speedSubscribers[i](speed);
                }

                lastPublishedSpeedValue = speed;
            }

        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.vibration', vibration);

    vibration.$inject = ['$window'];

    function vibration($window) {

        var service = {
            isSupported: isSupported,
            vibrate: vibrate
        };
        return service;

        ////////////////

        function isSupported() {
            return $window.navigator && $window.navigator.vibrate;
        }

        function vibrate(ms) {

            if (!isSupported()) {
                return;
            }

            if (!ms) {
                ms = 500;
            }

            $window.navigator.vibrate(ms);
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceActivity', deviceActivity);

    deviceActivity.$inject = [];

    function deviceActivity() {

        var directive = {
            bindToController: true,
            controller: DeviceActivityController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/activity.html',
            restrict: 'E',
            scope: {
                device: '=',
                config: '='
            }
        };
        return directive;
    }

    DeviceActivityController.$inject = ['device.repository', 'utils'];

    function DeviceActivityController(deviceRepository, utils) {

        var vm = this;
        vm.assets = [];

        vm.colors = ['#56646D', '#2670E0', '#25C2D5', '#43C399', '#A8C14D', '#F4C45B', '#FF855A', '#FF6458', '#ED4D73', '#9068C8'];

        vm.assetChartConfig = {
            type: vm.config.type,
            refreshChart: false,
            timeScale: '60m',
            page: 0
        };

        var settings = {
            assetsToShow: [],
            control: vm.config.type
        };

        var showDefault = true;

        vm.numberOfNumericAssets = 0;

        vm.assetClicked = assetClicked;
        vm.generateColor = generateColor;
        vm.enableActivity = enableActivity;
        vm.setControl = setControl;
        vm.timeSelected = timeSelected;
        vm.setTimeLabel = setTimeLabel;
        vm.toggleFullscreen = toggleFullscreen;

        vm.scrollLeft = scrollLeft;
        vm.scrollRight = scrollRight;

        activate();

        // ////////////////

        function activate() {

            var deviceAssets = vm.device.assets;

            deviceRepository.getDeviceSettings(vm.device.id)
                .then(function(sett) {

                    if (sett.assetsToShow) {
                        settings.assetsToShow = sett.assetsToShow;
                        showDefault = false;
                    }

                    if (sett.page) {

                        settings.page = sett.page;

                    } else {

                        settings.page = 0;

                    }

                    if (sett.timeScale) {
                        settings.timeScale = sett.timeScale;
                    } else {
                        settings.timeScale = '60m';
                    }

                    for (var i = 0; i < deviceAssets.length; i++) {
                        if (isProfileNumeric(deviceAssets[i].profile)) {

                            vm.numberOfNumericAssets++;

                            var j = i;

                            if (showDefault === false) {

                                deviceAssets[i]._showAsset = false;

                                for (var m = 0; m < settings.assetsToShow.length; m++) {
                                    if (settings.assetsToShow[m] === deviceAssets[i].id) {
                                        deviceAssets[i]._showAsset = true;
                                    }
                                }
                            } else {

                                deviceAssets[i]._showAsset = true;

                                settings.assetsToShow.push(deviceAssets[i].id);

                                deviceRepository.saveDeviceSettings(vm.device.id, settings);

                                showDefault = false;
                            }

                            if (i < vm.colors.length) {

                                deviceAssets[i]._assetColor = vm.colors[i];

                            } else {

                                deviceAssets[i]._assetColor = vm.colors[j - vm.colors.length];

                            }

                            vm.assets.push(deviceAssets[i]);
                        }
                    }

                    vm.assetChartConfig.timeScale = settings.timeScale;

                    vm.assetChartConfig.page = settings.page;

                });

            utils.$rootScope.$on('timeScaleUpdated', function(event, params) {

                settings.timeScale = params;

                setTimeLabel();

                deviceRepository.saveDeviceSettings(vm.device.id, settings);

            });
        }

        function isProfileNumeric(profile) {

            if (profile.type === 'integer' || profile.type === 'number') {

                return true;

            } else {

                return false;

            }
        }

        function assetClicked(asset) {

            for (var i = 0; i < vm.assets.length; i++) {

                if (vm.assets[i].id === asset.id) {

                    vm.assets[i]._showAsset = !vm.assets[i]._showAsset;

                    vm.assetChartConfig.refreshChart = true;

                    if (vm.assets[i]._showAsset) {

                        settings.assetsToShow.push(vm.assets[i].id);

                        deviceRepository.saveDeviceSettings(vm.device.id, settings);

                    } else {

                        var index = settings.assetsToShow.indexOf(vm.assets[i].id);

                        if (index > -1) {
                            settings.assetsToShow.splice(index, 1);
                        }

                        deviceRepository.saveDeviceSettings(vm.device.id, settings);

                    }
                }

            }
        }

        function generateColor(asset) {

            var colorStyle = {
                'background-color': null
            };

            if (asset._assetColor) {
                colorStyle['background-color'] = asset._assetColor;
            } else {
                colorStyle['background-color'] = vm.colors[0];
            }

            return colorStyle;
        }

        function enableActivity(device) {

            return deviceRepository.update(device.id, {
                    name: device.name,
                    activityEnabled: true
                }).then(function(response) {

                    utils.notify.success('Success: ', 'Activity Log enabled.');

                    device.activityEnabled = true;

                })
                .catch(function(error) {

                    utils.notify.error('Error: ', 'Error updating device', null, true);

                });
        }

        function setControl(control) {

            vm.assetChartConfig.type = control;

            settings.control = control;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;

        }

        function timeSelected(time) {

            vm.assetChartConfig.timeScale = time;

            vm.assetChartConfig.page = 0;

            settings.timeScale = time;
            settings.page = 0;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;
        }

        function setTimeLabel() {

            var label = null;

            if (settings.timeScale === '24h') {

                label = '24 hours';

            }

            if (settings.timeScale === '60m') {
                label = '1 hour';
            }

            if (settings.timeScale === '7d') {

                label = '1 week';

            }

            if (settings.timeScale === '30d') {

                label = '1 month';

            }

            if (settings.timeScale !== '24h' && settings.timeScale !== '60m' && settings.timeScale !== '7d' && settings.timeScale !== '30d') {

                label = settings.timeScale;

            }

            return label;

        }

        function toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
            vm.assetChartConfig.refreshChart = true;
        }

        function scrollLeft() {

            vm.assetChartConfig.page++;

            settings.page = vm.assetChartConfig.page;

            deviceRepository.saveDeviceSettings(vm.device.id, settings);

            vm.assetChartConfig.refreshChart = true;

        }

        function scrollRight() {

            if (vm.assetChartConfig.page > 0) {
                vm.assetChartConfig.page--;

                settings.page = vm.assetChartConfig.page;

                deviceRepository.saveDeviceSettings(vm.device.id, settings);

                vm.assetChartConfig.refreshChart = true;
            }

        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('assetControlGrid', assetControlGrid);

    function assetControlGrid() {

        var directive = {
            bindToController: true,
            controller: AssetControlGridController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/controlgrid.html',
            restrict: 'E',
            scope: {
                assets: '=',
                groundId: '=',
                model: '='
            }
        };

        return directive;
    }

    AssetControlGridController.$inject = ['$scope', 'pinRepository', 'assetModel', 'GroundContext'];

    function AssetControlGridController($scope, pinRepository, AssetModel, groundContext) {

        var vm = this;

        vm.removeAsset = removeAsset;
        vm.isPinned = isPinned;
        vm.togglePin = togglePin;
        vm.bindableAssets = [];
        vm.currentGround = null;

        activate();

        ////////////////////////////

        function activate() {

            $scope.model = vm.model;

            $scope.$watchCollection('vm.assets', function(newAssets) {

                if (!newAssets) {

                    return;

                }

                for (var i = 0; i < newAssets.length; i++) {

                    var asset = newAssets[i];

                    asset._isPinned = isPinned(asset);

                }

                vm.bindableAssets = newAssets;

            });

            $scope.$watch('vm.groundId', function(newGroundId) {

                if (newGroundId) {

                    vm.currentGround = groundContext.find(newGroundId);

                }

            });
        }

        function removeAsset(assetId) {

            for (var i = 0; i < vm.assets.length; i++) {

                if (vm.assets[i].id == assetId) {

                    vm.assets.splice(i, 1);

                }
            }
        }

        function isPinned(asset) {

            return pinRepository.isPinned(vm.groundId, asset.id);

        }

        function togglePin(asset) {

            if (isPinned(asset)) {

                pinRepository.unpin(vm.groundId, asset);

                asset._isPinned = false;

                if (vm.removeOnUnpin) {

                    removeAsset(asset.id);

                }

            } else {

                pinRepository.pin(vm.groundId, asset);

                asset._isPinned = true;

            }
        }
    }

})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('deviceControl', deviceControl);

    deviceControl.$inject = ['$compile'];

    function deviceControl($compile) {

        var directive = {
            restrict: 'E',
            scope: {
                device: '=',
                control: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('control', function(newValue) {
                if (scope.device) {
                    var ctrl = getControl(scope.control);
                    if (ctrl) {
                        element.html(ctrl);
                        $compile(element.contents())(scope);
                    }
                }
            });
        }

        function getControl(control) {

            if (!control) {
                return null;
            }

            return '<{0}-device-control device="device"></{0}-device-control>'.format(control);
        }
    }

})();

(function(ng) {
    ng
        .module('app')
        .directive('assetGrid', assetGrid);

    assetGrid.$inject = ['utility.deviceIcons', '$filter', '$state', 'utility.common'];

    function assetGrid(icons, $filter, $state, common) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/devices/controls/grid.html',
            scope: {
                assets: '=',
                model: '='
            },
            link: linker
        };

        return directive;

        ////////////////////////
        function linker(scope) {

            scope.howMany = 0;

            scope.categories = [{
                name: 'primary',
                exists: false,
                assets: []
            }, {
                name: 'secondary',
                exists: false,
                assets: []
            }, {
                name: 'management',
                exists: false,
                assets: []
            }, {
                name: 'battery',
                exists: false,
                assets: []
            }, {
                name: 'config',
                exists: false,
                assets: []
            }, {
                name: 'undefined',
                exists: false,
                assets: []
            }];

            function prepareSections() {

                for (var i = 0; i < scope.categories.length; i++) {
                    scope.categories[i].assets = [];
                    scope.categories[i].exists = false;
                    scope.howMany = 0;
                }

                if (scope.assets) {
                    for (var i = 0; i < scope.assets.length; i++) {
                        for (var j = 0; j < scope.categories.length; j++) {
                            if (scope.assets[i].style == scope.categories[j].name) {
                                scope.categories[j].exists = true;
                                scope.categories[j].assets.push(scope.assets[i]);
                            }
                        }
                    }
                }
            }

            scope.shortenString = function(value) {

                if (value !== null && value !== undefined) {
                    if (typeof(value) == 'object') {
                        var stringified = JSON.stringify(value);
                        return common.limitStringLength(stringified, 10);
                    } else {
                        return common.limitStringLength(value, 10);
                    }
                }
            };

            scope.getAssetIcon = function(iconKey) {
                if (iconKey) {
                    return icons.getIcon(iconKey);
                } else {
                    return icons.getIcon('asset');
                }
            };

            scope.isSectionVisible = function(category) {
                if (category.exists && (scope.howMany > 1)) {
                    return true;
                }

                return false;
            };

            scope.prepareNameForView = function(sectionName) {
                if (sectionName == 'Undefined' || sectionName == 'undefined') {
                    sectionName = 'Other';
                }

                return sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            };

            scope.goToAsset = function(assetId) {
                $state.go('main.asset', {
                    id: assetId
                });
            };

            scope.removeAsset = function(assetId) {

                for (var i = 0; i < scope.assets.length; i++) {
                    if (scope.assets[i].id == assetId) {
                        scope.assets.splice(i, 1);
                    }
                }

                for (var i = 0; i < scope.categories.length; i++) {
                    for (var y = 0; y < scope.categories[i].assets.length; y++) {
                        if (scope.categories[i].assets[y].id == assetId) {
                            scope.categories[i].assets.splice(y, 1);
                        }
                    }
                }
            };

            scope.$watchCollection('assets', function() {
                prepareSections();

                for (var i = 0; i < scope.categories.length; i++) {
                    if (scope.categories[i].exists === true) {
                        scope.howMany++;
                    }
                }

            });
        }
    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .factory('FirstAppDictionary', factory);

    factory.$inject = ['firstAppRepository'];

    function factory(firstAppRepository) {

        function FirstAppDictionary() {

            this.rpiParts = firstAppRepository.getRPIParts();

            this.arduinoParts = firstAppRepository.getArduinoParts();

            this['intel-edisonParts'] = firstAppRepository.getEdisonParts();

        }

        FirstAppDictionary.prototype.getHeader = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.header;

        };

        FirstAppDictionary.prototype.getAsset = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.asset;
        };

        FirstAppDictionary.prototype.getCredentials = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.credentials;
        };

        FirstAppDictionary.prototype.getPinModes = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.pinModes;
        };

        FirstAppDictionary.prototype.getCallback = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.callback;

        };

        FirstAppDictionary.prototype.getConnect = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.connect;

        };

        FirstAppDictionary.prototype.getWhileLoop = function(deviceType) {

            var item = this[deviceType + 'Parts'];

            return item.while;
        };

        FirstAppDictionary.prototype.generateScript = function(device, auth) {

            var that = this;

            var script = null;

            if (device.type === 'arduino') {

                script = that.generateArduinoScript(device, auth);

            } else if (device.type === 'rpi') {

                script = that.generateRPIScript(device, auth);

            } else if (device.type === 'intel-edison') {

                script = that.generateEdisonScript(device, auth);

            }

            return script;

        };

        FirstAppDictionary.prototype.generateRPIScript = function(device, auth) {

            var that = this;

            var script = '';

            script += that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            var asset1 = null;
            var asset2 = null;

            if (device.assets.length > 0) {

                for (var i = 0; i < device.assets.length; i++) {

                    var currentAsset = device.assets[i];

                    if (currentAsset.name === 'led' && asset1 === null) {

                        asset1 = configureAsset(that.getAsset(device.type), currentAsset.name, currentAsset.is, 4, currentAsset.title, 'digital');
                    }

                    if (currentAsset.name === 'rotary_knob' && asset2 === null) {

                        asset2 = configureAsset(that.getAsset(device.type), currentAsset.name, currentAsset.is, 0, currentAsset.title, 'analog');

                    }
                }
            }

            script += asset1 + asset2 + that.getPinModes(device.type);

            script += that.getCallback(device.type) + that.getConnect(device.type) + that.getWhileLoop(device.type);

            return script;
        };

        FirstAppDictionary.prototype.generateArduinoScript = function(device, auth) {

            var that = this;

            var script = null;

            script = that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            script += that.getPinModes(device.type);

            script += that.getConnect(device.type);

            script += that.getWhileLoop(device.type) + that.getCallback(device.type);

            return script;
        };

        FirstAppDictionary.prototype.generateEdisonScript = function(device, auth) {

            var that = this;

            var script = '';

            script += that.getHeader(device.type);

            var credentials = that.getCredentials(device.type);

            credentials = credentials.replace('DEVICE_ID', device.id);
            credentials = credentials.replace('CLIENT_ID', auth.clientId);
            credentials = credentials.replace('CLIENT_KEY', auth.clientKey);

            script += credentials;

            var asset = null;

            if (device.assets.length > 0) {

                for (var i = 0; i < device.assets.length; i++) {

                    var assetName = device.assets[i].name;

                    var assetNameTrail = assetName.slice(-1);

                    if (assetNameTrail === '4' && asset === null) {

                        asset = that.getAsset(device.type);

                        asset = asset.replace('ACTUATOR_ID', assetNameTrail);
                    }
                }
            }

            script += asset;

            script += that.getPinModes(device.type);

            script += that.getCallback(device.type);

            script += that.getConnect(device.type);

            script += that.getWhileLoop(device.type);

            return script;
        };

        function configureAsset(assetScript, assetName, assetType, pinNumber, assetTitle, assetMode) {

            assetScript = assetScript.replace('ASSET_NAME', assetName);

            assetScript = assetScript.replace(new RegExp('PIN_NUMBER', 'g'), pinNumber);

            assetScript = assetScript.replace(new RegExp('ASSET_TYPE', 'g'), assetType);

            if (assetMode !== null && assetMode !== undefined) {

                assetScript = assetScript.replace('ASSET_MODE', assetMode);

            } else {

                assetScript = assetScript.replace('ASSET_MODE', 'digital');
            }

            if (assetTitle !== null && assetTitle !== undefined) {

                assetScript = assetScript.replace('ASSET_TITLE', assetTitle);

            } else {

                assetScript = assetScript.replace('ASSET_TITLE', assetName);
            }

            return assetScript;

        }

        FirstAppDictionary.prototype.create = function() {

            return new FirstAppDictionary();
        };

        return FirstAppDictionary;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('firstAppRepository', FirstAppRepo);

    FirstAppRepo.$inject = [];

    function FirstAppRepo() {

        var service = {

            getRPIParts: getRPIParts,
            getArduinoParts: getArduinoParts,
            getEdisonParts: getEdisonParts
        };

        var scriptParts = {

            rpi: [
            {title: 'header', content: 'import grovepi  #provides pin support\nimport ATT_IOT as IOT   #provide cloud support\nfrom time import sleep  #pause the app\n\n'},
            {title: 'credentials', content: '#credentials for the ATT IOT platform connection\nIOT.DeviceId = "DEVICE_ID"\nIOT.ClientId = "CLIENT_ID"\nIOT.ClientKey = "CLIENT_KEY"\n\n'},
            {title: 'asset', content: '#set ASSET_TITLE pin to ASSET_MODE PIN_NUMBER and get its name\nASSET_TYPEName = "ASSET_NAME"  #name of the ASSET_TYPE\nASSET_TYPEPin = PIN_NUMBER\n\n'},
            {title: 'pinModes', content: '#set up the pins for usage\ngrovepi.pinMode(sensorPin,"INPUT")\ngrovepi.pinMode(actuatorPin,"OUTPUT")\n\n'},
            {title: 'callback', content: '#callback: handles values sent from the cloudapp to the device\ndef on_message(assetName, value):\n    if assetName == actuatorName:\n        value = value.lower()                    #make certain that the value is in lower case, for True vs true\n        if value == "true":\n            grovepi.digitalWrite(actuatorPin, 1)\n            IOT.send("true", actuatorPin)        #provide feedback to the cloud that the operation was succesful\n        elif value == "false":\n            grovepi.digitalWrite(actuatorPin, 0)\n            IOT.send("false", actuatorPin)       #provide feedback to the cloud that the operation was succesful\n        else:\n            print("unknown value: " + value)\n    else:\n        print("unknown actuator: " + assetName)\nIOT.on_message = on_message\n\n'},
            {title: 'connect', content: 'IOT.connect()  #connects your device to the ATT IOT platform\nIOT.subscribe()  #starts the bi-directional communication\n\n'},
            {title: 'while', content: '#main loop: run as long as the device is turned on\nwhile True:\n    try:\n        # Read sensor value from potentiometer\n        sensor_value = grovepi.analogRead(sensorPin)\n        # Send sensor value to cloud\n        IOT.send(sensor_value, sensorName)\n        print ("Rotary knob value: " + str(sensor_value))\n    except IOError:\n        print ""'}
            ],

            arduino: [
            {title: 'header', content: '#include <Ethernet.h>\n#include <EthernetClient.h>\n#include <PubSubClient.h>\n#include <ATT_IOT.h>\n#include <SPI.h>  //required to have support for signed/unsigned long type.\n\n'},
            {title: 'credentials', content: 'char deviceId[] = "DEVICE_ID";\nchar clientId[] = "CLIENT_ID";\nchar clientKey[] = "CLIENT_KEY";\nbyte mac[] = {0x00, 0x00, 0x00, 0x00, 0x00, 0x01};  //Adapt to your Arduino MAC address if needed\n\n'},
            {title: 'asset', content: ''},
            {title: 'pinModes', content: 'int knobPin = 0;  // Analog 0 is the input pin\nint ledPin = 4;  // Pin 4 is the LED output pin\n\n'},
            {title: 'callback', content: '// Callback function: handles messages that were sent from the IOT platform to this device.\nvoid callback(char* topic, byte* payload, unsigned int length)\n{\n  String msgString;\n  {\n    char message_buff[length + 1];  //need to copy over the payload so that we can add a /0 terminator, this can then be wrapped inside a string for easy manipulation.\n    strncpy(message_buff, (char*)payload, length);  //copy over the data\n    message_buff[length] = \'\\0\';   //make certain that it ends with a null\n\n    msgString = String(message_buff);\n    msgString.toLowerCase();  //to make certain that our comparison later on works ok (it could be that a True or False was sent)\n  }\n\n  int* idOut = NULL;\n\n  {\n    // get asset pin\n    int pinNr = Device.GetPinNr(topic, strlen(topic));\n\n    Serial.print("Payload: ");\n    Serial.println(msgString);\n    Serial.print("topic: ");\n    Serial.println(topic);\n\n    if (pinNr == ledPin)\n    {\n      if (msgString == "false") {\n        digitalWrite(ledPin, LOW);  //turn off LED asset\n        idOut = &ledPin;\n      }\n      else if (msgString == "true") {\n        digitalWrite(ledPin, HIGH);  //turn on LED asset\n        idOut = &ledPin;\n      }\n    }\n  }\n  if(idOut != NULL)\n    Device.Send(msgString, *idOut);\n}\n' },
            {title: 'connect', content: '//required for the device connection\nvoid callback(char* topic, byte* payload, unsigned int length);\nchar httpServer[] = "api.smartliving.io";\nchar* mqttServer = "broker.smartliving.io";\nEthernetClient ethClient;\nPubSubClient pubSub(mqttServer, 1883, callback, ethClient);\nATTDevice Device(deviceId, clientId, clientKey);  //create the object that provides the connection to the cloud to manage the device.\n\nvoid setup()\n{\n  pinMode(ledPin, OUTPUT);  // initialize the digital pin as an output.\n  Serial.begin(9600);  // init serial link for debugging\n\n  if (Ethernet.begin(mac) == 0)  // Initialize the Ethernet connection\n  {\n    Serial.println(F("DHCP failed,end"));\n    while(true);  //we failed to connect, halt execution here.\n  }\n  delay(1000);  //give the Ethernet shield a second to initialize\n\n  while(!Device.Connect(&ethClient, httpServer))  // connect the device with the IOT platform\n    Serial.println("retrying");\n\n  while(!Device.Subscribe(pubSub))  // make certain that we can receive message from the iot platform (activate mqtt)\n    Serial.println("retrying");\n}\n\n'},
            {title: 'while', content: 'unsigned long time;  //only send every x amount of time.\nunsigned int prevVal =0;\nvoid loop()\n{\n  unsigned long curTime = millis();\n  if (curTime > (time + 1000))  // publish light reading every 5 seconds to sensor 1\n  {\n    unsigned int lightRead = analogRead(knobPin);  // read from Knob sensor\n    if(prevVal != lightRead){\n      Device.Send(String(lightRead), knobPin);\n      prevVal = lightRead;\n    }\n    time = curTime;\n  }\n  Device.Process();\n}\n\n'}
            ],

            'intel-edison': [
            {title: 'header', content: '\'use strict\';\nvar smartliving = require(\'smartliving\');\nvar mraa = require(\'mraa\'); //Wrapper for GPIO Pins\n\n'},
            {title: 'credentials', content: 'smartliving.credentials = {\n    deviceId: \'DEVICE_ID\',\n    clientId: \'CLIENT_ID\',\n    clientKey: \'CLIENT_KEY\'\n};\n\n'},
            {title: 'asset', content: 'var actuatorId = \'ACTUATOR_ID\';\n'},
            {title: 'pinModes', content: 'var a0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)\nvar d4 = new mraa.Gpio(4); //LED hooked up to digital pin 4\nd4.dir(mraa.DIR_OUT); //set the gpio direction to output\nvar state = false; //Boolean to hold the state of Led\n\n'},
            {title: 'callback', content: 'function actuatorCallback() {\n    d4.write(state ? 0 : 1); //if state is true then write a 1 (high) otherwise write a 0 (low)\n    state = !state; //invert the ledState\n}\nsmartliving.registerActuatorCallback(actuatorId, actuatorCallback);\n\n'},
            {title: 'connect', content: 'smartliving.connect();\n\n'},
            {title: 'while', content: 'setInterval(function(){\n    var value = a0.read(); //read the value of the analog pin\n    smartliving.send(value, \'0\');\n}, 3000);'}
            ]
        };

        return service;

        ///////////////////////////////////////

        function getRPIParts() {

            var parts = {};

            var RPI = scriptParts.rpi;

            for (var i = 0; i < RPI.length; i++) {

                parts[RPI[i].title] = RPI[i].content;

            }

            return parts;

        }

        function getArduinoParts() {

            var parts = {};

            var arduino = scriptParts.arduino;

            for (var i = 0; i < arduino.length; i++) {

                parts[arduino[i].title] = arduino[i].content;

            }

            return parts;

        }

        function getEdisonParts() {

            var parts = {};

            var edison = scriptParts['intel-edison'];

            for (var i = 0; i < edison.length; i++) {

                parts[edison[i].title] = edison[i].content;

            }

            return parts;

        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('assetModel', AssetModelFactory);

    AssetModelFactory.$inject = ['utility.deviceIcons', 'utils', 'messaging.relay'];

    function AssetModelFactory(icons, utils, messageRelay) {

        function AssetModel(data) {

            for (var attr in data) {
                if (data.hasOwnProperty(attr)) {
                    this[attr] = data[attr];
                }
            }

            this.subscriptions = [];
        }

        AssetModel.prototype.getIcon = function() {
            return icons.getIcon(this.is);
        };

        AssetModel.prototype.subscribe = function() {

            var that = this;

            var unsubscribeDelete = utils.$rootScope.$on('$messaging.asset.deleted', function(e, eventData) {

                if (that.id === eventData.assetId) {
                    that._deleted = true;
                }

                utils.$rootScope.$apply();
            });

            var unsubscribeState = utils.$rootScope.$on('$messaging.asset.state', function(e, eventData) {

                if (that.id !== eventData.assetId) {
                    return;
                }

                if (!that.state) {
                    that.state = {};
                }

                that.state.at = eventData.payload.At;
                that.state.value = eventData.payload.Value;

                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeDelete);
            that.subscriptions.push(unsubscribeState);
        };

        AssetModel.prototype.on = function(eventName, callbackFn) {

            var that = this;
            var unsubscribeHandler = utils.$rootScope.$on('$messaging.asset.{0}'.format(eventName), function(e, eventData) {

                if (that.id !== eventData.assetId) {
                    return;
                }

                callbackFn(eventData.payload);
                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeHandler);
        };

        AssetModel.prototype.send = function(sendData) {

            messageRelay.publishState(this, sendData);
        };

        AssetModel.prototype.sendCommand = function(commandData) {

            messageRelay.publishCommand(this, commandData);
        };

        AssetModel.prototype.unsubscribe = function() {

            angular.forEach(this.subscriptions, function(unsubscribeFn) {
                unsubscribeFn();
            });

            this.subscriptions = [];
        };

        return AssetModel;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('CreateAssetModel', CreateAssetModelFactory);

    CreateAssetModelFactory.$inject = ['api.assetsService'];

    function CreateAssetModelFactory(assetsService) {

        var assetTypes = assetsService.getAssetTypes();

        function CreateAssetModel(assetType, assetName) {

            if (assetType) {
                this.type = assetType;
            } else {
                this.type = assetTypes.length > 0 ? assetTypes[0].type : null;
            }

            if (assetName) {
                this.name = assetName;
            }
        }

        CreateAssetModel.prototype.setType = function(type) {
            this.type = type;
        };

        CreateAssetModel.prototype.getTypes = function() {
            return assetTypes;
        };

        CreateAssetModel.prototype.isValid = function() {

            return this.type && this.name;
        };

        return CreateAssetModel;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('deviceModel', DeviceModelFactory);

    DeviceModelFactory.$inject = ['utility.deviceIcons', 'utils', 'assetModel'];

    function DeviceModelFactory(icons, utils, AssetModel) {

        function DeviceModel(data) {

            for (var attr in data) {
                if (data.hasOwnProperty(attr)) {
                    this[attr] = data[attr];
                }
            }

            for (var i = 0; i < this.assets.length; i++) {
                this.assets[i] = new AssetModel(this.assets[i]);
            }

            this.subscriptions = [];
        }

        DeviceModel.prototype.getIcon = function() {
            return icons.getIcon(this.type);
        };

        DeviceModel.prototype.getAsset = function(name) {

            var foundAsset = null;

            angular.forEach(this.assets, function(asset) {
                if (asset.name === name) {
                    foundAsset = asset;
                }
            });

            return foundAsset;
        };

        DeviceModel.prototype.getTitle = function() {

            if (this.title) {
                return this.title;
            }

            return this.name;
        };

        DeviceModel.prototype.subscribe = function(includingAssets) {

            var that = this;

            var unsubscribeDelete = utils.$rootScope.$on('$messaging.device.deleted', function(e, eventData) {

                if (that.id === eventData.deviceId) {
                    that._deleted = true;
                }

                utils.$rootScope.$apply();
            });

            var unsubscribeAssetCreate = utils.$rootScope.$on('$messaging.asset.created', function(e, eventData) {

                var asset = normalizePayloadData(eventData.payload.Data);

                if (that.id === asset.deviceId) {

                    var isAssetInArray = false;

                    for (var i = 0; i < that.assets.length; i++) {

                        if (that.assets[i].id === asset.id) {

                            isAssetInArray = true;
                            break;
                        }

                    }

                    if (!isAssetInArray) {

                        var assetModel = new AssetModel(asset);

                        assetModel.subscribe();

                        that.assets.push(assetModel);

                    }

                    utils.$rootScope.$apply();
                }

            });

            that.subscriptions.push(unsubscribeDelete);

            if (includingAssets) {
                angular.forEach(that.assets, function(asset) {
                    asset.subscribe();
                });
            }
        };

        DeviceModel.prototype.on = function(eventName, callback) {

            var that = this;
            var unsubscribeHandler = utils.$rootScope.$on('$messaging.device.{0}'.format(eventName), function(e, eventData) {

                if (that.id !== eventData.deviceId) {
                    return;
                }

                callbackFn(eventData.payload);
                utils.$rootScope.$apply();
            });

            that.subscriptions.push(unsubscribeHandler);
        };

        DeviceModel.prototype.unsubscribe = function() {

            var that = this;

            angular.forEach(that.subscriptions, function(unsubscribeFn) {
                unsubscribeFn();
            });

            that.subscriptions = [];

            angular.forEach(that.assets, function(asset) {
                asset.unsubscribe();
            });
        };

        function normalizePayloadData(payloadData) {

            var data = {};

            for (var attr in payloadData) {
                if (payloadData.hasOwnProperty(attr)) {
                    data[utils.toCamelCase(attr)] = payloadData[attr];
                }
            }

            return data;
        }

        return DeviceModel;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('EditDeviceModel', EditDeviceModelFactory);

    EditDeviceModelFactory.$inject = [];

    function EditDeviceModelFactory() {

        function EditDeviceModel(name, description, title) {
            this.name = name;
            this.description = description;
            if (title) {
                this.title = title;
            } else {
                this.title = name;
            }

            this.isEditEnabled = true;
            this.saved = false;
        }

        return EditDeviceModel;
    }
})();

(function(ng) {
    ng.module('app').directive('deviceHolder', [
        '$log',
        'utility.deviceIcons',
        function($log, deviceIcons) {
            function createDirectiveByType(element, type) {
                var el = document.createElement(type);
                element.appendChild(el);
            }

            function getPrimaryAsset(assets) {
                for (var i = 0; i < assets.length; i++) {
                    if (assets[i].style == 'primary') {
                        return assets[i];
                    }
                }
            }

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/device-holder/view.html',
                scope: {
                    deviceData: '='
                },
                link: function(scope, element, attrs) {
                    var deviceContent = element[0].querySelector('.device-content');

                    $log.log(scope.deviceData);

                    scope.deviceHeaderIcon = deviceIcons.getIcon(scope.deviceData.iconKey);
                    scope.primaryAsset = getPrimaryAsset(scope.deviceData.assets);

                    if (scope.deviceData.control.type) {
                        createDirectiveByType(deviceContent, scope.deviceData.control.type);
                    }
                }
            }
        }
    ]);
}(window.angular));

(function(ng) {
    ng.module('app').directive('googleMap', [
        '$q',
        '$log',
        '$rootScope',
        'utility.googleMaps',
        'utility.geoLocation',
        function($q, $log, $rootScope, googleMaps, geoLocation) {
            var DEFAULT_LOCATION = {
                latitude: 44.81666699999994,
                longitude: 20.46666700000003
            };
            var CIRCLE_WIDTH_RATIO = 2 * 1.5;

            googleMaps.catch(function() {
                $log.error('Google Maps API v3 not loaded!');
            });

            return {
                restrict: 'E',
                scope: {
                    place: '='
                },
                templateUrl: '/assets/js/app/directives/google-map/view.html',
                link: function(scope, element, attrs) {
                    var map = null;
                    var markers = [];
                    var mapZoom = 14;
                    var handler = null;
                    var location = null;
                    var mapSearch = null;
                    var searchInput = attrs.searchSelector ? element[0].parentNode.querySelector(attrs.searchSelector) : element[0].querySelector('.map-search');

                    // Show hidden input if selector not provided
                    searchInput.type = 'text';

                    scope.mapReady = false;

                    googleMaps.then(function(google) {
                        var mapSettings = {
                            zoom: mapZoom,
                            scrollwheel: false,
                            center: new google.maps.LatLng(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude),
                            mapTypeId: google.maps.MapTypeId.ROADMAP,
                            disableDefaultUI: true
                        };

                        map = new google.maps.Map(element[0].querySelector('.map-canvas'), mapSettings);
                        mapSearch = new google.maps.places.SearchBox(searchInput);

                        google.maps.event.addListener(map, 'bounds_changed', function() {
                            var me = this;
                            calculateMapRadius().then(function(height) {
                                mapSearch.setBounds(map.getBounds());
                                updateMapCoordinates(me.getCenter().lat(), me.getCenter().lng(), height);
                            });
                        });

                        google.maps.event.addListener(map, 'dragend', function() {
                            var me = this;
                            calculateMapRadius().then(function(height) {
                                updateMapCoordinates(me.getCenter().lat(), me.getCenter().lng(), height);
                            });
                        });

                        google.maps.event.addListener(mapSearch, 'places_changed', function() {
                            var places = mapSearch.getPlaces();
                            var bounds = null;

                            if (places.length == 0) {
                                return;
                            }

                            ng.forEach(markers, function(marker) {
                                marker.setMap(null);
                            });

                            // For each place, get the icon, place name, and location.
                            markers = [];
                            bounds = new google.maps.LatLngBounds();

                            ng.forEach(places, function(place) {
                                var image = {
                                    url: place.icon,
                                    size: new google.maps.Size(71, 71),
                                    origin: new google.maps.Point(0, 0),
                                    anchor: new google.maps.Point(17, 34),
                                    scaledSize: new google.maps.Size(25, 25)
                                };

                                // Create a marker for each place.
                                markers.push(new google.maps.Marker({
                                    map: map,
                                    icon: image,
                                    title: place.name,
                                    position: place.geometry.location
                                }));

                                bounds.extend(place.geometry.location);
                            });

                            map.fitBounds(bounds);

                            calculateMapRadius().then(function(height) {
                                mapZoom = map.getZoom();
                                updateMapCoordinates(map.getCenter().lat(), map.getCenter().lng(), height);
                            });
                        });

                        scope.mapReady = true;
                    });

                    if (attrs.setLocation) {
                        setGeoLocation();
                    }

                    function updateMapCoordinates(latitude, longitude, radius) {
                        scope.place.radius = radius;
                        scope.place.center.latitude = latitude;
                        scope.place.center.longitude = longitude;

                        $rootScope.$$phase || scope.$apply();
                    }

                    function calculateMapRadius() {
                        var deferred = $q.defer();

                        googleMaps.then(function(google) {
                            if (map) {
                                var spherical = google.maps.geometry.spherical;
                                var bounds = map.getBounds();
                                var cor1 = bounds.getNorthEast();
                                var cor2 = bounds.getSouthWest();
                                //  var cor3 = new google.maps.LatLng(cor2.lat(), cor1.lng());
                                var cor4 = new google.maps.LatLng(cor1.lat(), cor2.lng());
                                //  var width = spherical.computeDistanceBetween(cor1, cor3);
                                var height = spherical.computeDistanceBetween(cor1, cor4);

                                deferred.resolve(height / CIRCLE_WIDTH_RATIO);
                            } else {
                                deferred.reject('Map not instantiated!');
                            }
                        });

                        return deferred.promise;
                    }

                    function setGeoLocation() {
                        var deferred = $q.defer();

                        googleMaps.then(function(google) {
                            if (map) {
                                geoLocation.getLocation()
                                    .then(function(result) {
                                        location = result;
                                        map.setCenter(new google.maps.LatLng(result.coords.latitude, result.coords.longitude), mapZoom);
                                        deferred.resolve();
                                    })
                                    .catch(function() {
                                        deferred.reject('Geo location not available!');
                                    });
                            } else {
                                deferred.reject('Map not instantiated!');
                            }
                        });

                        return deferred.promise;
                    }

                    scope.zoomIn = function() {
                        if (map) {
                            map.setZoom(mapZoom + 1);
                            mapZoom = map.getZoom();
                        }
                    };

                    scope.zoomOut = function() {
                        if (map) {
                            map.setZoom(mapZoom - 1);
                            mapZoom = map.getZoom();
                        }
                    };

                    scope.$watch('place', function(newValue, oldValue) {
                        if (!ng.equals(newValue, oldValue)) {
                            googleMaps.then(function(google) {
                                if (map) {
                                    map.setCenter(new google.maps.LatLng(newValue.center.latitude, newValue.center.longitude), mapZoom);
                                }
                            });
                        }
                    }, true);

                    handler = $rootScope.$on('places.map:set_geo_location', function() {
                        setGeoLocation();
                    });

                    $rootScope.$on('places.map:set_bounds', function(event, data) {
                        map.fitBounds(data.bounds);
                        
                        google.maps.event.addListenerOnce(map, 'idle', function() {
                            mapZoom = map.getZoom();
                        });
                    });

                    scope.$on('$destroy', function() {
                        if (handler) {
                            handler();
                        }
                        googleMaps.then(function(google) {
                            if (map) {
                                google.maps.event.clearListeners(map, 'bounds_changed');
                                google.maps.event.clearListeners(map, 'places_changed');
                                google.maps.event.clearListeners(map, 'dragend');
                            }
                        });
                    });
                }
            };
        }
    ]);
}(window.angular));

(function(ng) {
    ng.module('app').directive('randomBackground', [
        function() {
            function getRandomColor() {
                return "#" + Math.random().toString(16).slice(2, 8);
            }

            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    element[0].style.backgroundColor = getRandomColor();
                }
            };
        }
    ]);
}(window.angular));

(function(ng) {
    ng.module('app').directive('inlineEdit', [
        '$timeout',
        function($timeout) {
            var classes = {
                icon: 'sl-sl-edit',
                activeClass: 'active',
                editButton: 'inline-edit-rename-button',
                editIndicator: 'inline-edit-indicator'
            };

            return {
                restrict: 'E',
                scope: {
                    value: '=',
                    confirmAction: '&',
                    isEnabled: '='
                },
                templateUrl: '/assets/js/app/directives/inline-edit/view.html',

                link: function(scope, element, attrs) {
                    var el = element[0];

                    var oldValue = null;
                    var saved = false;

                    scope.inputDisabled = true;

                    var editButton = el.querySelector('.' + classes.editButton);
                    var editIndicator = el.querySelector('.' + classes.editIndicator);
                    var input = el.querySelector('input');

                    if (editButton) {
                        $(editButton).mousedown(editButtonClick);
                    }

                    if (input) {
                        $(input).click(function() {
                            scope.inputDisabled = false;
                            focus();
                        });

                        $(input).focusout(function(e) {
                            unfocus();
                        });

                        $(input).keypress(function(e) {
                            if (e.which == 13) {
                                editButtonClick();
                            }
                        });
                    }

                    function focus() {
                        saved = false;

                        scope.$apply(function() {
                            scope.inputDisabled = false;
                        });

                        if (editButton) {
                            editButton.classList.add(classes.activeClass);
                        }

                        if (input) {
                            $timeout(function() {
                                oldValue = $(input).val();
                                len = oldValue.length * 2;

                                $(input).focus();

                               // input.setSelectionRange(len, len);

                            }, 1);
                        }
                    }

                    function save() {
                        saved = true;
                        scope.confirmAction();
                    }

                    function unfocus() {
                        if (editButton) {
                            editButton.classList.remove(classes.activeClass);
                        }

                        if (input && !saved) {
                            $(input).val(oldValue);
                        }

                        scope.$apply(function() {
                            scope.inputDisabled = true;
                        });
                    }

                    function editButtonClick() {
                        if (scope.inputDisabled) {
                            focus();
                        } else {
                            save();
                            unfocus();
                        }
                    }

                    scope.$watch('isEnabled', function(newValue, oldValue) {
                        if (newValue) {
                            if (editButton) {
                                editButton.style.visibility = 'visible';
                            }
                            if (editIndicator) {
                                editIndicator.style.visibility = 'visible';
                            }

                            if (input) {
                                $(input).prop('disabled', false);
                            }
                        } else {
                            if (editButton) {
                                editButton.style.visibility = 'hidden';
                            }
                            if (editIndicator) {
                                editIndicator.style.visibility = 'hidden';
                            }

                            if (input) {
                                $(input).prop('disabled', true);
                            }
                        }
                    });

                    scope.$on('$destroy', function() {
                        $(el).off();

                        if (editButton) {
                            $(editButton).off();
                        }

                        if (input) {
                            $(input).off();
                        }
                    });
                }
            };
        }
    ]);
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .directive('newDevice', NewDevice);
    NewDevice.$inject = ['utility.deviceIcons'];

    function NewDevice(icons) {

        var directive = {
            restrict: 'EA',
            templateUrl: '/assets/js/app/directives/new-device/view.html',
            scope: {
                onDeviceAdd: '&',
                onDeviceNameChange: '&',
                deviceError: '=',
                deviceType: '=',
                showCustom: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////////

        function linker($scope, iElm, iAttrs, controller) {

            $scope.deviceType = 'arduino';
            $scope.deviceName = null;
            var custom = {
                type: 'custom',
                text: 'Custom',
                icon: 'sl-device-custom'
            };

            var de = $scope.deviceError;

            $scope.deviceTypes = [{
                type: 'arduino',
                text: 'Arduino',
                icon: 'sl-device-arduino'
            }, {
                type: 'rpi',
                text: 'Raspberry Pi',
                icon: 'sl-device-rpi'
            }, {
                type: 'intel-edison',
                text: 'Intel Edison',
                icon: 'sl-device-intel-edison'
            }];
            if($scope.showCustom){
                $scope.deviceTypes.push(custom);
            }

            $scope.setDeviceType = function(deviceType) {
                $scope.deviceType = deviceType;
            };

            $scope.deviceAdd = function() {
                $scope.onDeviceAdd({
                    name: $scope.deviceName,
                    type: $scope.deviceType
                });
                $scope.deviceName = null;
            };

            $scope.isActiveDeviceType = function(dType) {
                return dType == $scope.deviceType;
            };

            $scope.deviceChangeName = function() {

                $scope.onDeviceNameChange({
                    name: $scope.deviceName,
                    type: $scope.deviceType
                });
            };

            $scope.getDeviceTypeIcon = function(dType) {
                return icons.getIcon(dType);
            };

            var el = iElm[0];
        }
    }
}(window.angular));
(function(ng) {
    ng
        .module('app')
        .directive('notifyControl', NotifyControl);

    NotifyControl.$inject = [
        'notifyService',
        '$animate',
        '$timeout',
        '$rootScope'
    ];

    function NotifyControl(notify, $animate, $timeout, $rootScope) {

        var settings = {
            duration: 2000 //3 seconds
        };

        var directive = {

            restrict: 'E',
            templateUrl: '/assets/js/app/directives/notify-control/view.html',
            link: linker,
            scope: {}
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var el = element[0];
            var hideNotificationTimeout = null;

            scope.isClosed = true;
            scope.isPermanent = false;
            scope.title = null;
            scope.msg = null;
            scope.type = null;

            scope.close = onClosed;
            scope.onMouseOver = onMouseOver;
            scope.onMouseLeave = onMouseLeave;

            notify.subscribe('notificationControl', function(notificationData) {

                processNotification(notificationData);
            });

            $rootScope.$on('$stateChangeSuccess', function() {
                closeNotification();
            });

            function onClosed() {

                closeNotification();

                if (scope.closeHandler) {
                    scope.closeHandler();
                }
            }

            function closeNotification() {

                var container = el.querySelector('.alert');

                if (container) {
                    $animate.addClass(container, 'alert-hidden').then(function() {
                        scope.isClosed = true;
                    });
                }
            }

            function onMouseOver() {
                if (hideNotificationTimeout) {
                    $timeout.cancel(hideNotificationTimeout);
                }
            }

            function onMouseLeave() {
                if (!scope.isPermanent) {
                    setCloseTimeout();
                }
            }

            function processNotification(data) {

                if (hideNotificationTimeout) {
                    $timeout.cancel(hideNotificationTimeout);
                }

                scope.title = data.title;
                scope.msg = data.msg;
                scope.type = data.type;
                scope.isPermanent = data.isPermanent;
                scope.isClosed = false;

                if (data.closeHandler) {
                    scope.closeHandler = data.closeHandler;
                    scope.showCloseButton = true;
                } else {
                    scope.closeHandler = null;
                    scope.showCloseButton = false;
                }

                if (data.actionHandler) {
                    scope.actionHandler = data.actionHandler;
                    scope.showActionButton = true;
                    scope.actionText = data.actionText;
                } else {
                    scope.actionHandler = null;
                    scope.showActionButton = false;
                    scope.actionText = null;
                }

                if (!scope.isPermanent) {

                    //delaying setting up mouse move event or 1s because
                    //the move that caused the notification is detected as movement.
                    setTimeout(function() {
                        $(document).one('touchmove', function() {
                            setCloseTimeout();
                        });

                        $(document).one('mousemove', function() {
                            setCloseTimeout();
                        });

                    }, 1000);
                }

            }

            function setCloseTimeout() {
                hideNotificationTimeout = $timeout(closeNotification, settings.duration);
            }
        }
    }

}(window.angular));

(function() {
    'use strict';

    angular
        .module('app')
        .directive('stateControlButton', stateControlButton);

    stateControlButton.$inject = ['$rootScope'];

    function stateControlButton($rootScope) {

        var directive = {
            restrict: 'A',
            scope: {
                identifier: '@'
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attrs) {

            var eventArgs = {
                identifier: scope.identifier,
                state: false
            };

            element.bind('click', function() {

                eventArgs.state = !eventArgs.state;

                $rootScope.$broadcast('stateControlButtonEvent', eventArgs);
            });

        }
    }
})();

(function(ng) {

    ng
        .module('app')
        .controller('StateControlController', StateControlController);

    StateControlController.$inject = ['$scope', '$rootScope', 'stateControlManager'];

    function StateControlController($scope, $rootScope, stateControlManager, el) {

        var modifierClass = $scope.modifierClass;
        var morphEl = $('[state-control-type="morph"]');

        var ctrl = this;

        ctrl.identifier = $scope.identifier;
        ctrl.containers = [];
        ctrl.triggers = [];
        ctrl.morphs = [];
        ctrl.parentStateControlIdentifiers = [];
        ctrl.registerContainer = registerContainer;
        ctrl.registerTrigger = registerTrigger;
        ctrl.registerMorph = registerMorph;

        ctrl.toggle = toggle;
        ctrl.hide = hide;

        ctrl.addParentStateControlId = addParentStateControlId;
        ctrl.getParentStateControlIds = getParentStateControlIds;

        stateControlManager.register(ctrl);

        //////////////

        $scope.$on('$destroy', function() {

            stateControlManager.unregister(ctrl);
        });

        $scope.$watch('state', function(newValue, oldValue) {

            var isOldValueUndefined = typeof oldValue === 'undefined';

            if (!isOldValueUndefined && (oldValue != newValue)) {

                toggle();
            }

        }, true);

        $rootScope.$on('stateControlButtonEvent', function(event, args) {

            if (args.identifier === ctrl.identifier) {

                toggle();

            }
        });

        function toggleFromBeyond() {

            var elements = getAllElementsWithAttribute('state-control-type');

            return elements;

        };

        function getAllElementsWithAttribute(attribute) {

            var matchingElements = [];
            var allElements = document.getElementsByTagName('*');
            for (var i = 0, n = allElements.length; i < n; i++) {
                if (allElements[i].getAttribute(attribute) !== null) {
                    // Element exists with attribute. Add to array.
                    matchingElements.push(allElements[i]);
                }
            }

            return matchingElements;
        }

        function hideMorph() {
            if (morphEl.hasClass(modifierClass)) {
                morphEl.removeAttr('style');
            }
        }

        function toggle() {

            if ($scope.onToggle) {
                $scope.onToggle();
            }

            angular.forEach(ctrl.containers, function(container) {
                container.toggle(modifierClass);
            });

            angular.forEach(ctrl.triggers, function(trigger) {
                trigger.toggle(modifierClass);
            });

            angular.forEach(ctrl.morphs, function(morph) {
                morph.toggle(modifierClass);
            });

            hideMorph();

            stateControlManager.reportStateChange(ctrl);
        }

        function hide() {

            angular.forEach(ctrl.containers, function(container) {
                container.hide(modifierClass);
            });

            angular.forEach(ctrl.triggers, function(trigger) {
                trigger.hide(modifierClass);
            });

            angular.forEach(ctrl.morphs, function(morph) {
                morph.hide(modifierClass);
            });

            hideMorph();
        }

        function registerContainer(container) {

            ctrl.containers.push(container);
        }

        function registerTrigger(trigger) {

            ctrl.triggers.push(trigger);
        }

        function registerMorph(morph) {

            ctrl.morphs.push(morph);
        }

        function addParentStateControlId(parentId) {

            ctrl.parentStateControlIdentifiers.push(parentId);
        }

        function getParentStateControlIds() {
            return ctrl.parentStateControlIdentifiers;
        }
    }

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .service('stateControlManager', StateControlManager);

    StateControlManager.$inject = ['$rootScope'];

    function StateControlManager($rootScope) {

        var stateControls = [];

        var service = {
            register: register,
            unregister: unregister,
            reportStateChange: reportStateChange
        };

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

            angular.forEach(stateControls, function(sc) {
                sc.hide();
            });
        });

        return service;

        function register(stateControl) {

            stateControls.push(stateControl);
        }

        function unregister(stateControl) {

            var index = stateControls.indexOf(stateControl);
            stateControls.splice(index, 1);
        }

        function reportStateChange(stateControl) {

            angular.forEach(stateControls, function(sc) {
                if (sc.identifier != stateControl.identifier) {

                    //make sure parent-state control does not close
                    var isParent = false;

                    var parentIds = stateControl.getParentStateControlIds();
                    for (var i = 0; i < parentIds.length; i++) {
                        if (sc.identifier == parentIds[i]) {
                            isParent = true;
                        }
                    }

                    if (!isParent) {
                        sc.hide();
                    }
                }
            });
        }
    }

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('stateControlType', StateControlType);

    function StateControlType() {

        var directive = {
            restrict: 'A',
            require: '^stateControl',
            scope: {
                type: '@stateControlType'
            },
            compile: function(elm, attrs, transclude) {
                return linker;
            }

        };

        return directive;

        ////////////////////

        function linker(scope, elm, attrs, stateController) {
            var type = scope.type;
            var stateEl = elm[0];

            scope.hide = hide;
            scope.toggle = toggle;

            if (type == 'trigger') {
                stateController.registerTrigger(scope);
                $(stateEl).click(function(e) {
                    stateController.toggle();
                    e.stopPropagation();
                });
            }

            if (type == 'container') {
                stateController.registerContainer(scope);
            }

            if (type == 'morph') {
                stateController.registerMorph(scope);
            }

            if (type == 'close') {
                $(stateEl).click(function(e) {
                    stateController.hide();
                    e.stopPropagation();
                });
            }

            function hide(className) {

                $(stateEl).removeClass(className);
            }

            function toggle(className) {

                if (stateEl.classList.contains(className)) {
                    stateEl.classList.remove(className);
                } else {
                    stateEl.classList.add(className);
                    $(document).one('click', documentClickHandler);
                    $(document).one('keyup', documentKeyUpHandler);
                }
            }

            function documentClickHandler(e) {

                var $el = $(e.target);

                var isInsideStateControl = $el.parents('state-control').length > 0;

                //if trigger to toggle state-control is outside of the state-control
                //it is required to set  'state-control-trigger' attribute
                //in order to prevent document.click to close the state-control
                var attr = $el.attr('state-control-toggler');

                var button = $el.attr('state-control-button');

                var isStateControlToggler = typeof attr !== typeof undefined && attr !== false;

                var isStateControlButton = typeof button !== typeof undefined && button !== false;

                if (isInsideStateControl || isStateControlToggler || isStateControlButton) {

                    $(document).one('click', documentClickHandler);

                } else {

                    stateController.hide();
                }
            }

            function documentKeyUpHandler(e) {

                if (e.keyCode === 27) {
                    stateController.hide();
                }
            }

            scope.$on('$destroy', function() {

                $(stateEl).off();
            });
        }
    }

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('stateControl', StateControl);

    function StateControl() {

        var directive = {
            restrict: 'E',
            controller: 'StateControlController',
            scope: {
                modifierClass: '@',
                identifier: '@',
                state: '=?',
                onToggle: '&'
            },
            link: linker
        };

        return directive;

        //////////

        function linker(scope, element, attrs, ctrl) {

            var parentStateControls = $(element).parents('state-control');

            for (var i = 0; i < parentStateControls.length; i++) {
                var parentIdentifier = $(parentStateControls[i]).attr('identifier');
                ctrl.addParentStateControlId(parentIdentifier);
            }

        }
    }
}(window.angular));


(function (ng) {
    ng.module('app').directive('stateMorph',
        ['$window',
            function ($window) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {

                        var el = element[0],
                            trigger = $(el).find('[state-control-type="trigger"]'),
                            container = $(el).find('[state-control-type="container"]'),
                            morph = $(el).find('[state-control-type="morph"]'),
                            modifierClass = $(el).attr('modifier-class'),
                            time = 10;

                        trigger.on('click', function() {
                            var trigger = $(this);

                            //trigger position and size
                            var th = trigger.outerHeight(),
                                tw = trigger.outerWidth(),
                                tl = trigger.offset().left,
                                tt = trigger.offset().top;

                            //container position and size
                            var cw = container.outerWidth(),
                                ch = container.outerHeight(),
                                cl = container.offset().left,
                                ct = container.offset().top;

                            morph.css({ top: tt + 'px', left: tl + 'px', width: tw + 'px', height:th + 'px'});
                            setTimeout(function(){
                                morph.css({ top: ct + 'px', left: cl + 'px', width: cw + 'px', height:ch + 'px'})
                            }, time);

                        });

                        ng.element($window).on('resize', function () {
                            if(morph.hasClass(modifierClass)){
                                //container position and size
                                var cw = container.outerWidth(),
                                    ch = container.outerHeight(),
                                    cl = container.offset().left,
                                    ct = container.offset().top;

                                morph.css({ top: ct + 'px', left: cl + 'px', width: cw + 'px', height:ch + 'px', transition: 'none'})
                            }
                            else{
                                return false
                            }
                        });
                    }
                };
            }]
    );
}(window.angular));

(function (ng) {
    ng.module('app').directive('tabControl', [
        '$log',

        function ($log) {
            function createTabs(tabs, parent) {
                var elements = [];

                ng.forEach(tabs, function (tab, index) {
                    var el = document.createElement('div');
                    el.classList.add('tab-button');

                    if (index == 0) {
                        el.classList.add('active');
                        tab.style.display = '';
                    }
                    else {
                        tab.style.display = 'none';
                    }
                    el.innerHTML = tab.getAttribute('name');
                    parent.appendChild(el);
                    elements.push(el);
                });

                return elements;
            }

            function switchTo(index, tabButtons, tabs) {
                ng.forEach(tabButtons, function (button, i) {
                    if (i != index) {
                        if (button.classList.contains('active')) {
                            button.classList.remove('active');

                        }
                        tabs[i].style.display = 'none';
                    } else {
                        if (!button.classList.contains('active')) {
                            button.classList.add('active');
                            tabs[i].style.display = '';
                        }
                    }
                });
            }

            return {
                restrict: 'E',
                scope: {
                    onTabClick: '&',
                    activeTab: '='
                },
                link: function (scope, element, attrs) {
                    var el = element[0];

                    var tabs = el.querySelectorAll('tab-child');

                    var tabButtonsParent = el.querySelector('tab-control-header');
                    var tabButtons = createTabs(tabs, tabButtonsParent);

                    ng.forEach(tabButtons, function (button, index) {
                        $(button).click(function (e) {
                            scope.$apply(function () {
                                scope.activeTab = index;
                            });
                        });
                    });

                    scope.$watch('activeTab', function (cur, prev) {
                        switchTo(cur, tabButtons, tabs);
                        scope.onTabClick();
                    });
                }
            }
        }
    ]);
}(window.angular));

(function(ng) {

    ng.module('app').controller('modals.confirmItemDelete', ConfirmItemDelete);

    ConfirmItemDelete.$inject = ['$modalInstance', '$state', 'utils', 'item', 'model'];

    function ConfirmItemDelete($modalInstance, $state, utils, item, model) {

        var vm = this;

        utils.$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            $modalInstance.dismiss();
        });

        vm.itemModel = item;

        vm.model = model;

        vm.selection = false;

        vm.CONFIRM_DELETION_TEXT = 'DELETE';
        vm.confirmInput = null;
        vm.errorMsg = null;

        vm.selectModalDissmisal = selectModalDissmisal;

        vm.confirmItemDelete = confirmItemDelete;

        //////////////////////////////////////

        function confirmItemDelete(device) {

            if (device) {

                vm.model.delete(vm.itemModel.device)
                    .then(function() {

                        $modalInstance.close();

                    });

            } else {

                vm.itemModel.delete().then(function() {
                    if (vm.itemModel.hasOwnProperty('device')) {
                        $state.go('main.groundDevices', {
                            id: vm.itemModel.groundId
                        });
                    } else if (vm.itemModel.hasOwnProperty('gateway')) {
                        $state.go('main.groundGateways', {
                            id: vm.itemModel.groundId
                        });
                    }
                });
            }
        }

        function selectModalDissmisal() {


            utils.preferences.rememberGlobal('DeleteDeviceModalStatus', vm.selection);

        }
    }

}(window.angular));

(function(ng) {
    ng.module('app').controller('modals.rule.Options', [
        '$modalInstance',
        '$state',
        'api.rulesService',
        'api.devicesService',
        'api.servicesService',
        'notifyService',
        'utility.common',
        '$q',
        'rule',
        'service.dayTime',
        '$rootScope',

        function($modalInstance, $state, rulesService, devicesService, servicesService, notifyService, common, $q, rule, dayTime, $rootScope) {

            var vm = this;
            $rootScope.$on('$stateChangeStart',
                function(event, toState, toParams, fromState, fromParams) {
                    $modalInstance.dismiss();

                });

            vm.rule = rule;
            vm.newRuleName = rule.name;
            vm.isRuleEditEnabled = true;
            vm.deleteOpen = true;

            vm.toggleRuleStatus = toggleRuleStatus;
            vm.updateRule = updateRule;
            vm.editRuleInJSON = editRuleInJSON;
            vm.editRuleInWizard = editRuleInWizard;
            vm.viewRuleHistory = viewRuleHistory;
            vm.deleteRule = deleteRule;
            vm.isEnabled = isEnabled();
            vm.isDefinitionLoaded = false;
            vm.hasIssues = false;
            vm.isRuleSimple = null;

            vm.definitionModel = {
                when: [],
                then: [],
                else: []
            };

            vm.definitionModel.else.isSectionLoaded = false;

            var devices = null;
            var services = null;
            var ruleDefinition = null;

            if (vm.rule.definition) {
                ruleDefinition = JSON.parse(vm.rule.definition);
            }

            activate();

            //////////////////////////////////////////////////////

            function activate() {

                var promises = [];

                promises.push(devicesService.getAll());
                promises.push(servicesService.getAll());

                if (!rule.definition) {
                    promises.push(rulesService.get(rule.id));
                }

                $q.all(promises)
                    .then(function(responses) {
                        devices = responses[0].data;
                        services = responses[1].data;
                        if (responses[2]) {
                            vm.rule.definition = responses[2].data.definition;

                            if (vm.rule.definition) {
                                ruleDefinition = JSON.parse(rule.definition);

                            }
                        }

                        if (ruleDefinition) {
                            vm.isRuleSimple = isRuleSimple(ruleDefinition);
                            map('when', ruleDefinition);
                            map('then', ruleDefinition);
                            map('else', ruleDefinition);

                            if (hasMissingDependables()) {

                                notifyService.error('Error: ', 'Rule ' + vm.rule.name + ' has issues with missing assets or devices.', null, true);
                                vm.hasIssues = true;
                            }
                        }

                        vm.isDefinitionLoaded = true;
                    })
                    .catch(function(error) {
                        var errorMessage = 'There was an error contacting server. ';
                        if (error.data && error.data.message) {
                            errorMessage += error.data.message;
                        }

                        notifyService.error('Error: ', errorMessage, null, true);
                    });

            }

            function map(sectionName, ruleDefinition) {

                var sectionViewModel = vm.definitionModel[sectionName];

                sectionViewModel.isSectionLoaded = common.mapRulePreviewToViewModel(ruleDefinition, sectionName, sectionViewModel, devices, services);
            }

            function hasMissingDependables() {

                return hasSectionMissingDependables('when') || hasSectionMissingDependables('then') || hasSectionMissingDependables('else');
            }

            function hasSectionMissingDependables(sectionName) {
                var sectionViewModel = vm.definitionModel[sectionName];

                if (sectionViewModel.misingLeftDevice || sectionViewModel.missingLeftAsset || sectionViewModel.missingRightDevice || sectionViewModel.missingRightAsset) {
                    return true;
                }

                return false;
            }

            function toggleRuleStatus() {

                if (vm.isEnabled) {

                    vm.isEnabled = false;
                    rulesService.enabled(vm.rule.id, false)
                        .then(function(data) {
                            notifyService.success('Success: ', 'Rule is Idle');
                            rule.status = 2;
                            $rootScope.$emit('rootScope:rule:statusChanged', {status: rule.status, id: rule.id});
                        })
                        .catch(function(error) {
                            notifyService.error('Error: ', 'There was a problem disabling the Rule.', null, true);
                        });
                } else {
                    vm.isEnabled = true;
                    rulesService.enabled(vm.rule.id, true)
                        .then(function(data) {
                            notifyService.success('Success: ', 'Rule is Running');
                            rule.status = 1;
                            $rootScope.$emit('rootScope:rule:statusChanged', {status: rule.status, id: rule.id});
                        })
                        .catch(function(error) {
                            notifyService.error('Error: ', 'There was a problem enabling the Rule.', null, true);
                        });
                }
            }

            function updateRule() {

                rulesService.update(vm.rule.id, vm.newRuleName, vm.rule.description, JSON.parse(vm.rule.definition))
                    .then(function() {
                        notifyService.success('Success: ', 'Rule Updated');
                        $state.reload();

                    })
                    .catch(function(error) {
                        notifyService.error('Error: ', 'There was an error updating the rule.', null, true);
                    });
            }

            function editRuleInJSON() {

                var ruleDefinition = vm.rule.definition;

                if (vm.rule.definition) {
                    ruleDefinition = JSON.parse(vm.rule.definition);
                }

                $state.go('main.ruleEditJSON', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function editRuleInWizard() {

                var ruleDefinition = vm.rule.definition;

                if (vm.rule.definition) {
                    ruleDefinition = JSON.parse(vm.rule.definition);
                }

                $state.go('main.ruleEditWizard', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function viewRuleHistory() {

                $state.go('main.ruleHistory', {
                    id: vm.rule.id
                });

                $modalInstance.close();
            }

            function deleteRule() {

                rulesService.delete(vm.rule.id)
                    .then(function(response) {
                        notifyService.success('Success: ', 'Rule is deleted.');
                        $modalInstance.close();
                        $state.reload();
                    })
                    .catch(function(error) {
                        notifyService.error('Error: ', 'Error while deleting the rule.', null, true);
                    });
            }

            function isEnabled() {
                return rule.status == 1;
            }

            function isRuleSimple(ruleDefinition) {

                var isSimple = true;

                angular.forEach(ruleDefinition, function(ruleSection) {
                    if (ruleSection.hasOwnProperty('when')) {
                        if (ruleSection.when.length > 1) {
                            isSimple = false;
                        }
                    }

                    if (ruleSection.hasOwnProperty('then')) {
                        if (ruleSection.then.length > 1) {
                            isSimple = false;
                        }
                    }

                    if (ruleSection.hasOwnProperty('else')) {
                        if (ruleSection.else.length > 1) {
                            isSimple = false;
                        }
                    }

                });

                return isSimple;

            }
        }

    ]);
}(window.angular));

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

(function() {
    'use strict';

    angular
        .module('app')
        .directive('slHeaderItem', slHeaderItem);

    function slHeaderItem() {

        var directive = {
            templateUrl: '/assets/js/app/widgets/item_header/item-header.html',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            transclude: true,
            restrict: 'E',
            scope: {
                model: '=',
                toggleAction: '&',
                isActive: '&',
                config: '@',
                color: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['$state', '$parse'];

    function Controller($state, $parse) {

        var vm = this;

        vm.goBack = goBack;

        vm.configuration = {
            hideActions: false
        };

        if (vm.config) {

            vm.configuration = $parse(vm.config)();

        }

        function goBack() {

            if (vm.model.visibility === 'personal') {

                $state.go('main.devices');

            } else {

                $state.go(vm.model.backRoute.name, vm.model.backRoute.data);

            }
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .factory('sl.listHeader', ListHeaderViewModelFactory);

    ListHeaderViewModelFactory.$inject = [];

    function ListHeaderViewModelFactory() {

        function ListHeaderViewModel(headerTitle, headerImage, headerSubTitle) {

            this.headerTitle = headerTitle;
            this.headerImage = headerImage;
            this.headerSubTitle = headerSubTitle;
            this.showHeaderSubtitle = false;
            this.headerMode = 'colapsed';
        }

        ListHeaderViewModel.prototype.setHeaderMode = function(mode) {

            this.headerMode = mode;
        };

        return ListHeaderViewModel;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('listHeader', listHeader);

    listHeader.$inject = [];

    function listHeader() {

        var directive = {
            transclude: true,
            templateUrl: '/assets/js/app/widgets/list_header/list-header.html',
            link: link,
            restrict: 'E',
            scope: {
                viewModel: '='
            }
        };

        return directive;

        function link() {

        }
    }
})();

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

(function() {
    'use strict';

    angular
        .module('app')
        .directive('listItem', listItem);

    listItem.$inject = [];

    function listItem() {

        var directive = {
            transclude: true,
            templateUrl: '/assets/js/app/widgets/list_item/list-item.html',
            restrict: 'E',
            scope: {
                viewModel: '=',
                groundTag: '=',
                color: '='
            }
        };

        return directive;
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('areaRangeChartDeviceControl', AreaRangeChartDirective);

    AreaRangeChartDirective.$inject = [];

    function AreaRangeChartDirective() {

        var directive = {
            bindToController: true,
            controller: AreaRangeChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/area-range-chart/area-range-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    AreaRangeChartDeviceControlController.$inject = [];

    function AreaRangeChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'area-range-chart'
        };

        activate();

        // ////////////////

        function activate() {
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('barChartDeviceControl', BarChartDirective);

    BarChartDirective.$inject = [];

    function BarChartDirective() {

        var directive = {
            bindToController: true,
            controller: BarChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/bar-chart/bar-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    BarChartDeviceControlController.$inject = [];

    function BarChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'bar-chart'
        };

        activate();

        // ////////////////

        function activate() {
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('enrollDemoDeviceControl', enrollDemoControl);

    enrollDemoControl.$inject = [];

    function enrollDemoControl() {

        var directive = {
            bindToController: true,
            controller: enrollDemoControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/enroll-demo/enroll-demo-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    enrollDemoControlController.$inject = ['urlShortenerService', 'session', 'origin'];

    function enrollDemoControlController(urlShortenerService, session, origin) {

        var vm = this;

        var sessionData = session.authentication();
        var gameToken = sessionData.accessToken;
        var gameTicket = vm.device.authorizations[0];

        vm.qrText = null;

        activate();

        // ////////////////

        function activate() {

            var longUrl = getQRCodeUrl(vm.device.name, gameTicket);
            urlShortenerService.shortenUrl(longUrl)
                .then(function(shortUrl) {
                    vm.qrText = shortUrl;
                });
        }

        function getQRCodeUrl(deviceName, gameToken) {

            return '{0}/apps/quick-demo-launcher?deviceName={1}&token={2}'.format(origin, deviceName, gameToken);
        }

    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('lineChartDeviceControl', LineChartDirective);

    LineChartDirective.$inject = [];

    function LineChartDirective() {

        var directive = {
            bindToController: true,
            controller: LineChartDeviceControlController,
            controllerAs: 'vm',
            templateUrl: '/assets/js/app/devices/controls/line-chart/line-chart-device-control.html',
            restrict: 'E',
            scope: {
                device: '='
            }
        };
        return directive;
    }

    LineChartDeviceControlController.$inject = [];

    function LineChartDeviceControlController() {

        var vm = this;

        vm.controlConfiguration = {
            type: 'line-chart'
        };

        activate();

        // ////////////////

        function activate() {

        }

    }
})();

(function(ng) {

    ng.module('app').directive('assetComparator', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {

                function getComparators(type) {
                    var comparators = [];

                    if (type == 'bool' || type == 'boolean' || type == 'text' || type == 'string' || type == 'object') {
                        comparators.push({
                            name: 'Equal to',
                            id: '=='
                        });
                        comparators.push({
                            name: 'Not Equal to',
                            id: '!='
                        });
                    }

                    if (type == 'integer' || type == 'int' || type == 'number' || type == 'num' || type == 'date' || type == 'timespan' || type == 'double') {
                        comparators.push({
                            name: 'Equal to',
                            id: '=='
                        });
                        comparators.push({
                            name: 'Not Equal to',
                            id: '!='
                        });
                        comparators.push({
                            name: 'Less than',
                            id: '<'
                        });
                        comparators.push({
                            name: 'Less or equal than',
                            id: '<='
                        });
                        comparators.push({
                            name: 'Greater than',
                            id: '>'
                        });
                        comparators.push({
                            name: 'Greater or equal than',
                            id: '=>'
                        });

                    }

                    return comparators;
                }

                scope.comparatorSelected = function(item, model) {
                    scope.comparatorValue = item.id;
                };

                scope.$watch('profile', function(newProfile, oldProfile) {

                    if (newProfile) {
                        scope.comparators = getComparators(newProfile.type);
                    }
                });
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/asset-comparator/view.html',
                scope: {
                    profile: '=',
                    comparatorValue: '='
                },
                link: linker
            };
        }

    ]);
}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('slAssetProfileDescriptor', slAssetProfileDescriptor);

    function slAssetProfileDescriptor() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/asset-profile-descriptor/view.html',
            scope: {
                profile: '='
            },
            link: linker
        };

        return directive;

        function linker(scope) {

            scope.expectsType = null;
            scope.unit = null;
            scope.constraints = null;

            scope.$watch('profile', function(newProfile) {

                if (!newProfile) {
                    scope.expectsType = null;
                    scope.unit = null;
                    scope.constraints = null;
                } else {
                    if (newProfile.type) {
                    	scope.expectsType = 'expects type: '+newProfile.type;
                    }

                    if(newProfile.unit){
                    	scope.unit = 'unit: '+newProfile.unit;
                    }

                    if(newProfile.min && newProfile.max){
                    	scope.constraints = 'with values between: ' + newProfile.min + ' and ' + newProfile.max;
                    } else if(newProfile.min){
                    	scope.constraints = 'with values bigger then: ' + newProfile.min;
                    } else if(newProfile.max){
                    	scope.constraints = 'with values smaller then: ' + newProfile.max;
                    }
                }
            });

        }

    }

}(window.angular));

(function(ng) {

    ng.module('app').directive('assetValueEditor', assetValueEditor);

    assetValueEditor.$inject = ['$compile'];

    function assetValueEditor($compile) {

        var defaultTemplate = '<text-setter text-value="operation.value"</text-setter>';
        var assetProfileDescriptorTemplate = '<sl-asset-profile-descriptor profile="profile"></sl-asset-profile-descriptor>';

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                operation: '=',
                profile: '=',
                isEditMode: '='
            }
        };

        return directive;

        ///////////////////

        function linker(scope, element, attrs) {

            scope.$watch('profile', function(newValue) {

                if (newValue) {
                    element.html(getTemplate(scope.profile)).show();
                    $compile(element.contents())(scope);
                }
            });
        }

        function getTemplate(profile) {

            var template = defaultTemplate;

            if (!profile) {
                return template;
            }

            if (!profile.type) {
                return template;
            }

            if (isEmailService(profile)) {
                return template;
            }

            if (profile.labels) {
                template = '<label-setter value="operation.value" profile="profile"></label-setter>';
                return template;
            }

            if (profile.type == 'cron') {
                return '<day-time cron = "operation.value" is-edit-mode = "isEditMode"> </day-time> ';
            }

            if (profile.type == 'bool' || profile.type == 'boolean') {
                template = '<bool-setter bool-value="operation.value"></bool-setter>';
            }

            if (profile.type == 'int' || profile.type == 'integer' || profile.type == 'decimal' || profile.type == 'float' || profile.type == 'number' || profile.type == 'double') {
                template = '<number-setter num-value="operation.value"></number-setter>';
            }

            if (profile.type == 'date' || profile.type == 'datetime' || profile.type == 'time') {
                template = '<date-setter date-value="operation.value"></date-setter>';
            }

            if (profile.type == 'timespan' || profile.type == 'timerange' || profile.type == 'duration') {
                template = '<timespan-setter timespan-value="operation.value"></timespan-setter>';
            }

            if (profile.type == 'string' || profile.type == 'text') {
                template = '<text-setter text-value="operation.value"></text-setter>';
            }

            template += assetProfileDescriptorTemplate;

            return template;
        }

        function isEmailService(profile) {

            if (!profile) {
                return false;
            }

            if (!profile.type) {
                return false;
            }

            if (profile.type.subject == 'string') {
                return true;
            }

            return false;
        }
    }

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('slRuleSectionDetail', slRuleSectionDetail);

    slRuleSectionDetail.$inject = ['$filter', 'userContext'];

    function slRuleSectionDetail($filter, userContext) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/rule-section-detail/view.html',
            scope: {
                sectionData: '=',
                sectionName: '@',
                sectionTitle: '@',
                currentStep: '=',
                currentSection: '=',
                isSectionReady: '&',
                isEditMode: '=?'
            },
            link: linker
        };

        return directive;
        ///////////////
        function linker(scope) {

            scope.steps = [];

            initSteps();

            scope.isReady = function() {
                return scope.isSectionReady(scope.sectionName);
            };

            scope.getHeaderText = function() {
                if (scope.sectionData.selectedDevice) {
                    return scope.sectionData.selectedDevice.name;
                }

                if (scope.sectionData.selectedService) {

                    if (scope.sectionData.selectedService.type == 'emailMe') {
                        var email = userContext.user.email;
                        return scope.sectionData.selectedService.name + ' to ' + email;
                    }

                    if (scope.sectionData.selectedService.type == 'notify') {
                        var user = userContext.user.name;
                        return 'Send ' + scope.sectionData.selectedService.name + ' to ' + user;
                    }

                    return scope.sectionData.selectedService.name;
                }
            };

            scope.getDetails = function() {

                var detailsText = '';

                if (scope.sectionData.selectedAsset) {
                    detailsText += scope.sectionData.selectedAsset.title;
                    detailsText += getCompareText();
                } else if (scope.sectionData.selectedService) {
                    detailsText += getCompareText();
                }

                return detailsText;
            };

            function getCompareText() {

                var text = '';

                if (scope.sectionData.selectedCompareType == 'constant' || scope.sectionData.selectedCompareType == null) {

                    if (scope.sectionData.constantCompareOperation.op && scope.sectionData.selectedAsset) {

                        text += scope.sectionData.constantCompareOperation.op;

                    }

                    if (scope.sectionData.constantCompareOperation.value) {

                        var profile = scope.sectionData.selectedAsset ? scope.sectionData.selectedAsset.profile : null;
                        if (!profile) {
                            profile = scope.sectionData.selectedService.profile;
                        }

                        var formattedValue = $filter('assetValueFormat')(scope.sectionData.constantCompareOperation.value, profile);

                        text += formattedValue;
                    }
                }

                if (scope.sectionData.selectedCompareType == 'reference') {

                    if (scope.sectionData.referenceCompareOperation.op) {
                        text += ' ' + scope.sectionData.referenceCompareOperation.op + ' ';
                    }

                    if (scope.sectionData.referenceCompareOperation.device) {
                        text += scope.sectionData.referenceCompareOperation.device.name;
                    }

                    if (scope.sectionData.referenceCompareOperation.asset) {
                        text += ' / ' + scope.sectionData.referenceCompareOperation.asset.title;
                    }
                }

                if (scope.sectionData.selectedCompareType == 'onEveryChange') {

                    if (scope.sectionData.constantCompareOperation.op == 'OEC') {
                        text += ' - On Every Change';
                    }
                }

                return text;
            }

            scope.isSubstepActive = function(stepName) {

                if (scope.currentSection != scope.sectionName)
                    return false;

                if (scope.currentStep.name == stepName)
                    return true;

                return false;
            };

            scope.isSubstepVisible = function(stepName) {

                if (stepName == 'deviceOrServiceStep') {
                    if (scope.isEditMode) {
                        return false;
                    }
                    return true;
                }

                if (stepName == 'dayTimeDefineStep') {
                    if (scope.sectionData.selectedService) {
                        if (scope.sectionData.selectedService.type == 'dayTime') {
                            return true;
                        }

                    }
                    return false;
                }

                if (stepName == 'deviceDefineStep') {
                    if (scope.sectionData.selectedService) {
                        return false;
                    }
                    return true;
                }

                if (stepName == 'eMailMeDefineStep') {
                    if (scope.sectionData.selectedService) {
                        if (scope.sectionData.selectedService.type == 'emailMe') {
                            return true;
                        }

                    }
                    return false;
                }


            };

            function initSteps() {

                scope.steps.push({
                    name: 'deviceOrServiceStep'
                });

                scope.steps.push({
                    name: 'dayTimeDefineStep'
                });

                scope.steps.push({
                    name: 'deviceDefineStep'
                });

                scope.steps.push({
                    name: 'eMailMeDefineStep'
                });

                return scope.steps;
            };
        }
    }

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('slRuleSectionPreview', slRuleSectionPreview);

    slRuleSectionPreview.$inject = ['$filter'];

    function slRuleSectionPreview($filter) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/rule-section-preview/view.html',
            scope: {
                sectionData: '=',
                sectionName: '@'
            },
            link: linker
        };

        return directive;

        //////////////////

        function linker(scope) {

            scope.sectionDataApplied = [];

            scope.$watch('sectionData', function(newValue, oldValue) {
                if (newValue.constructor === Array) {
                    scope.sectionDataApplied = scope.sectionData;
                } else {
                    scope.sectionDataApplied.push(newValue);
                }
            });

            scope.getHeaderText = function(sectionData) {
                if (sectionData.selectedDevice) {
                    return sectionData.selectedDevice.title;
                }

                if (sectionData.selectedService) {
                    return sectionData.selectedService.name;
                }
            };

            scope.getLeftName = function(sectionData) {

                var leftName = '';
                if (sectionData.selectedAsset) {
                    leftName = sectionData.selectedAsset.title;
                }

                if (sectionData.selectedService) {
                    leftName = 'is';
                }

                return leftName;
            };

            scope.getComparatorName = function(sectionData) {

                var comparatorName = '';

                if (sectionData.selectedCompareType == 'constant' || sectionData.selectedCompareType == null) {
                    if (sectionData.constantCompareOperation.op && sectionData.selectedAsset) {
                        comparatorName = translateOperator(sectionData.constantCompareOperation.op);
                    }
                }

                if (sectionData.selectedCompareType == 'reference') {
                    if (sectionData.referenceCompareOperation.op && sectionData.referenceCompareOperation.asset) {
                        comparatorName = translateOperator(sectionData.referenceCompareOperation.op);
                    }
                }

                if (sectionData.selectedCompareType === 'onEveryChange') {

                    if (sectionData.constantCompareOperation.op && sectionData.selectedAsset) {
                        comparatorName = translateOperator(sectionData.constantCompareOperation.op);
                    }

                }

                return comparatorName;
            };

            scope.getValue = function(sectionData) {

                var value = '';

                if (sectionData.selectedCompareType == 'constant') {
                    if (sectionData.constantCompareOperation.value) {

                        var profile = sectionData.selectedAsset ? sectionData.selectedAsset.profile : null;

                        if (!profile) {
                            profile = sectionData.selectedService.profile;
                        }

                        value = $filter('assetValueFormat')(sectionData.constantCompareOperation.value, profile);
                    }
                }

                if (sectionData.selectedCompareType == 'reference') {
                    value = sectionData.referenceCompareOperation.device.title + ' / ' + sectionData.referenceCompareOperation.asset.title;
                }

                return value;

            };

            function translateOperator(rawOperator) {

                var realComparatorName = rawOperator;

                if (rawOperator === 'OEC') {
                    realComparatorName = 'value is changed';
                }

                if (rawOperator === '>') {
                    realComparatorName = 'is greater than';
                }

                if (rawOperator === '<') {
                    realComparatorName = 'is lower than';
                }

                if (rawOperator === '==') {
                    realComparatorName = 'equals to';
                }

                if (rawOperator === '=') {
                    realComparatorName = 'set to';
                }

                return realComparatorName;

            }
        }
    }

}(window.angular));

(function (ng) {
    ng.module('app').controller('modals.passwordRecovery.SuccessDialog', [
        '$scope',
        '$modalInstance',
        function ($scope, $modalInstance) {
            $scope.login = function () {
                $modalInstance.close();
            }
        }
    ]);
}(window.angular));
(function(ng) {
    ng
        .module('app')
        .controller('NewDeviceController', NewDeviceController);

    NewDeviceController.$inject = [
        '$state',
        '$rootScope',
        '$scope',
        'device.repository',
        'asset.repository',
        'GroundContext',
        'utils'
    ];

    function NewDeviceController($state, $rootScope, $scope, DeviceRepository, AssetRepository, GroundContext, utils) {

        var vm = this;

        vm.groundId = null;
        vm.isIntroOnDevicesHidden = false;

        vm.hasMobileDevice = false;
        vm.hasKitDevice = false;
        vm.hasCustomDevice = false;
        vm.deviceType = null;

        vm.isOnGround = $state.$current.self.name === 'main.ground' ? true : false;

        vm.createDevice = createDevice;
        vm.createKitDevice = createKitDevice;
        vm.createMobileDevice = createMobileDevice;
        vm.toggleIntroOnDevices = toggleIntroOnDevices;

        activate();

        function activate() {

            vm.groundId = GroundContext.currentId;

            vm.isIntroOnDevicesHidden = utils.preferences.readPage('IntroOnDeviceStatus');

            if (vm.isIntroOnDevicesHidden) {

                vm.isIntroOnDevicesHidden = vm.isIntroOnDevicesHidden === 'true';

            }

            DeviceRepository.findAllInGround(vm.groundId)
                .then(function(devices) {

                    for (var i = 0; i < devices.length; i++) {

                        if (devices[i].type === 'quick-demo') {
                            vm.hasMobileDevice = true;
                        }

                        if (devices[i].type === 'arduino' || devices[i].type === 'rpi' || devices[i].type === 'intel-edison' || devices[i].type === 'proximus-lora') {
                            vm.hasKitDevice = true;
                        }

                        if (devices[i].type === 'custom') {
                            vm.hasCustomDevice = true;
                        }

                    }

                });

            $rootScope.$on('IntroOnDeviceStatusToggled', function(event, args) {

                vm.isIntroOnDevicesHidden = args;

            });
        }

        function createKitDevice(name, type) {

            vm.data = {
                name: name,
                type: type
            };


            DeviceRepository.createInGround(vm.data, vm.groundId)
                .then(function(device) {

                    if (type !== 'custom') {
                        createAssets(device);
                    } else {
                        $state.go('main.device', {
                            id: device.id
                        }).then(function() {
                            triggerStateControl('device-details');
                        });
                    }
                });

        }

        function createAssets(device) {

            var ledPromise = null;
            var knobPromise = null;

            if (vm.isOnGround) {
                $rootScope.$broadcast('user.onboarded.kitDevice', device);
            } else {
                $rootScope.$broadcast('user.created.device', device);
            }

            if (vm.data.type === 'arduino') {

                ledPromise = AssetRepository.create(device.id, '4', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, '0', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            } else if (vm.data.type === 'intel-edison') {

                ledPromise = AssetRepository.create(device.id, '4', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, '0', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            } else {

                ledPromise = AssetRepository.create(device.id, 'led', 'LED', 'actuator', 'boolean', 'toggle');

                knobPromise = AssetRepository.create(device.id, 'rotary_knob', 'Rotary knob', 'sensor', { type: 'integer', minimum: 0, maximum: 1024 }, 'circle-progress');

            }

            return utils.$q.all([ledPromise, knobPromise])
                .then(function(data) {
                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                        });
                });
        }

        function createDevice(name, type) {

            var data = {
                name: name,
                type: type
            };

            DeviceRepository.createInGround(data, vm.groundId)
                .then(function(device) {

                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                        });

                    if (vm.isOnGround) {
                        $rootScope.$broadcast('user.onboarded.customDevice', device);
                    } else {
                        $rootScope.$broadcast('user.created.device', device);
                    }
                });
        }

        function createMobileDevice(deviceName) {

            var data = {

                name: null,
                type: 'quick-demo'

            };

            if (deviceName) {

                data.name = deviceName;

            } else {

                data.name = 'Your smartphone';
            }

            DeviceRepository.createInGround(data, vm.groundId)
                .then(function(device) {

                    $state.go('main.device', {
                            id: device.id
                        })
                        .then(function() {

                            triggerStateControl('device-details');

                            if (vm.isOnGround) {

                                $rootScope.$broadcast('user.onboarded.mobile', device);

                            } else {

                                $rootScope.$broadcast('user.created.device', device);

                            }
                        });
                });

        }

        function triggerStateControl(triggerId) {

            setTimeout(function() {
                var triggers = angular.element('[state-control-button]');

                for (var i = 0; i < triggers.length; i++) {

                    if (triggers[i].attributes['identifier'].value == triggerId) {

                        angular.element(triggers[i]).trigger('click');

                        setTimeout(clickOnTab('custom'), 400);
                    }

                }
            }, 600);
        }

        function clickOnTab(tabName) {

            angular.element(document.getElementById(tabName)).trigger('click');

        }

        function toggleIntroOnDevices() {

            vm.isIntroOnDevicesHidden = !vm.isIntroOnDevicesHidden;

            $rootScope.$broadcast('IntroOnDeviceStatusToggled', vm.isIntroOnDevicesHidden);

            utils.preferences.rememberPage('IntroOnDeviceStatus', vm.isIntroOnDevicesHidden);
        }

    }

}(window.angular));

(function(ng){

	ng.module('app').directive('boolSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/bool/bool-setter.html',
                scope: {
                    boolValue: '='
                },
                link: linker
            };
        }
    ]);
}(window.angular));
(function(ng){

	ng.module('app').directive('dateSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/date/date-setter.html',
                scope: {
                    dateValue: '='
                },
                link: linker
            };
        }
    ]);
}(window.angular));
(function(ng) {

    ng
        .module('app')
        .directive('labelSetter', labelSetter);

    function labelSetter() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/constant/label/view.html',
            scope: {
                value: '=',
                profile: '='
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attrs) {

            scope.labels = [];

            scope.onValueSelected = function(item, model) {
                scope.value = item.value;
            };

            scope.$watch('profile', function(newProfile) {
                
                if (!newProfile || !newProfile.labels) {
                    scope.labels = [];
                } else {

                    for (var i = 0; i < newProfile.labels.length; i++) {

                        var lbl = newProfile.labels[i];

                        if (lbl.value) {
                            scope.labels.push({
                                name: lbl.label,
                                value: lbl.value
                            });
                        } else if (lbl.from && lbl.to) {

                            for (var iterator = lbl.from; iterator < lbl.to; iterator++) {
                                scope.labels.push({
                                    name: lbl.label + ' ' + iterator,
                                    value: iterator
                                });
                            }
                        }
                    }
                }

            });
        };
    };

}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('numberSetter', numberSetter);

    function numberSetter() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/constant/number/number-setter.html',
            scope: {
                numValue: '='
            }
        };

        return directive;
    };

}(window.angular));

(function(ng){

	ng.module('app').directive('textSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/text/text-setter.html',
                scope: {
                    textValue: '='
                },
                link: linker
            };
        }
    ]);




}(window.angular));
(function(ng) {

    ng.module('app').directive('timespanSetter', ['$log',

        function($log) {

            var linker = function(scope, element, attrs) {
               
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/constant/timespan/timespan-setter.html',
                scope: {
                    timespanValue: '='
                },
                link: linker
            };
        }
    ]);

}(window.angular));
(function(ng) {

    ng.module('app').directive('assetStep', ['$filter', 'utility.deviceIcons',

        function($filter, icons) {

            var linker = function(scope) {

                scope.getIcon = function(iconKey) {
                    return icons.getIcon(iconKey);
                };

                scope.onAssetSelected = function(item, model) {
                    scope.selectedAsset = item;
                };
            };

            return {
                restrict: 'E',
                templateUrl: '/assets/js/app/directives/rule-steps/steps/asset-step/view.html',
                scope: {
                    assets: '=',
                    title: '@',
                    selectedAsset: '=',
                    filterByType: '@'
                },
                link: linker
            };
        }
    ]);

}(window.angular));

(function(ng) {

    ng.module('app').directive('compareTypeStep',
        function() {

        	return {
        		restrict:'E',
        		templateUrl:'/assets/js/app/directives/rule-steps/steps/compare-type-step/view.html',
        		scope:{
        			selectedCompareType:'=',
                    forCompare:'@'
        		}
        	};
        });

}(window.angular));

(function(ng) {
    ng
        .module('app')
        .directive('dayTime', dayTime);

    dayTime.$inject = ['service.dayTime'];

    function dayTime(dayTime) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/day-time/day-time.html',
            scope: {
                cron: '=',
                isEditMode: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////

        function linker(scope) {

            scope.days = [{
                name: "MON",
                isSelected: false
            }, {
                name: "TUE",
                isSelected: false
            }, {
                name: "WED",
                isSelected: false
            }, {
                name: "THU",
                isSelected: false
            }, {
                name: "FRI",
                isSelected: false
            }, {
                name: "SAT",
                isSelected: false,
            }, {
                name: "SUN",
                isSelected: false
            }];

            scope.amPmHours = "00";

            scope.dayClicked = function(day) {
                for (var i = 0; i < scope.days.length; i++) {
                    if (scope.days[i].name === day.name) {
                        scope.days[i].isSelected = !scope.days[i].isSelected;
                        scope.cron = generateCron();
                    }
                };
            }

            scope.interfaceClicked = function() {
                scope.cron = generateCron();
            }

            scope.changeTime = function() {
                if (scope.partOfDay) {
                    scope.amPmHours = "12";
                } else {
                    scope.amPmHours = "00";
                }
            }

            scope.$watch('hours', function() {

                scope.cron = generateCron();
            });

            scope.$watch('minutes', function() {
                scope.cron = generateCron();
            })

            function setUpView() {
                if (scope.isEditMode) {
                    disectCron(scope.cron);

                } else {
                    scope.partOfDay = false;
                    scope.hours = "6";
                    scope.minutes = "0";
                    scope.cron = generateCron();
                }
            }

            function generateCron() {
                var cron = '0 ';
                var daysSelected = 0;

                cron += scope.minutes + ' ';


                if (!scope.partOfDay) {
                    var amHours = scope.hours;
                    cron += amHours + ' ';
                } else {
                    var pmHours = (parseInt(scope.hours) + 12).toString();
                    cron += pmHours + ' ';
                }

                cron += '? * ';

                for (var i = 0; i < scope.days.length; i++) {
                    if (scope.days[i].isSelected == true) {
                        daysSelected++;
                        cron += scope.days[i].name + ',';
                    }
                };


                if (daysSelected == 0) {
                    cron += '*';
                } else {
                    cron = cron.slice(0, -1);
                }

                return cron;
            }

            function disectCron(cronSting) {

                var cronElements = cronSting.split(' ');
                var cronMinutes = cronElements[1];
                var cronHours = cronElements[2];
                var cronDaysOfWeek = cronElements[5];

                if (cronDaysOfWeek) {
                    separatedDays = cronDaysOfWeek.split(',');

                    for (var i = 0; i < separatedDays.length; i++) {
                        for (var j = 0; j < scope.days.length; j++) {
                            if (separatedDays[i] == scope.days[j].name) {
                                scope.days[j].isSelected = true;
                            }
                        }
                    }
                }

                if (cronHours >= 0 && cronHours < 12) {
                    scope.partOfDay = false;
                    scope.hours = cronHours;
                }

                if (cronHours >= 12 && cronHours < 24) {
                    scope.partOfDay = true;
                    scope.hours = (cronHours - 12).toString();
                };

                scope.minutes = cronMinutes;

            }

            setUpView();

        };
    }
}(window.angular));

(function(ng) {

    ng
        .module('app')
        .directive('deviceOrServiceStep', deviceOrServiceStep);

    deviceOrServiceStep.$inject = ['$filter', 'utility.deviceIcons'];

    function deviceOrServiceStep($filter, icons) {

        return {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/device-or-service-step/view.html',
            scope: {
                title: '@',
                assetTypeFilter: '@',
                choiceType: '=',
                services: '=?',
                devices: '=?',
                deviceBoxTitle: '@',
                deviceBoxSubtext: '@',
                showNotify: '='
            },
            link: linker
        };

        function linker(scope) {

            scope.actionOrTrigger = null;
            scope.deviceTextAppend = null;

            scope.getIcon = function(iconKey) {
                return icons.getIcon(iconKey);
            };

            scope.onDeviceSelected = function() {
                scope.choiceType = 'device';
            };

            scope.onServiceSelected = function() {
                scope.choiceType = 'service';
            };

            scope.hasAvailableDevices = function() {

                var filteredDevices = $filter('devicesWithAssetFilter')(scope.devices, scope.assetTypeFilter);

                return filteredDevices.length > 0;
            };
        }
    }
}(window.angular));

(function(ng) {
    ng
        .module('app')
        .directive('deviceStep', deviceStep);

    deviceStep.$inject = ['utility.deviceIcons'];

    function deviceStep(icons) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/device-step/view.html',
            scope: {
                devices: '=',
                title: '@',
                selectedDevice: '=',
                assetTypeFilter: '@'

            },
            link: linker
        };

        return directive;

        ////////////////////////////////////

        function linker(scope) {

            scope.getIcon = function(iconKey) {
                return icons.getIcon(iconKey);
            };

            scope.onDeviceSelected = function(item, model) {
                scope.selectedDevice = item;
            };
        }
    }
}(window.angular));
(function(ng) {
    ng
        .module('app')
        .directive('selectNotificationType', selectNotificationType);

    selectNotificationType.$inject = [];

    function selectNotificationType() {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/select-notification-type/view.html',
            scope: {
                selectedNotifications: '='
            },
            link: linker
        };

        return directive;

        ////////////////////////////////////

        function linker(scope) {

            scope.onWebItemClick = function() {
                scope.selectedNotifications.web = !scope.selectedNotifications.web;
            };

            scope.onPushItemClick = function() {
                scope.selectedNotifications.push = !scope.selectedNotifications.push;
            };

            scope.onEmailItemClick = function() {
                scope.selectedNotifications.email = !scope.selectedNotifications.email;
            };

        }
    }
}(window.angular));

/*!
 * Smartliving Widgets for Angular
 * https://github.com/allthingstalsk/smartliving-widgets
 * @license MIT
 * v0.7
 */


if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

(function() {
    'use strict';

    angular.module('ngSmartlivingWidgets', [
        'ngAnimate',
        'ui.select',
        'ngMaterial',
        'ui.knob',
        'jsonFormatter',
        'angularSpectrumColorpicker',
        'leaflet-directive',
        'nvd3',
        'ngTouch'
    ]);
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .factory('widgetsCommon', factory);

    factory.$inject = [];

    function factory() {
        var defaultControls = {
            boolean: {
                sensor: function(assetProfile) {
                    return 'onoff';
                },

                actuator: function(assetProfile) {
                    return 'toggle';
                },

                virtual: function(assetProfile) {
                    return 'onoff';
                },

                config: function(assetProfile) {
                    return 'onoff';
                }
            },
            string: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    return 'input';
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            integer: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    if ((assetProfile.minimum || assetProfile.minimum === 0) && (assetProfile.maximum || assetProfile.maximum === 0)) {
                        return 'slider';
                    } else {
                        return 'input';
                    }
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            number: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    if ((assetProfile.minimum || assetProfile.minimum === 0) && (assetProfile.maximum || assetProfile.maximum === 0)) {
                        return 'slider';
                    } else {
                        return 'input';
                    }
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            object: {
                sensor: function(assetProfile) {
                    return 'json';
                },

                actuator: function(assetProfile) {
                    return 'text-editor';
                },

                virtual: function(assetProfile) {
                    return 'json';
                },

                config: function(assetProfile) {
                    return 'json';
                }
            },
            default: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    return 'input';
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            }
        };

        var service = {
            findDefaultControl: findDefaultControl
        };
        return service;

        ////////////////

        function findDefaultControl(asset) {

            var control = null;
            var config = defaultControls[asset.profile.type];

            if (!config) {
                config = defaultControls['default'];
            }

            control = config[asset.is](asset.profile);

            return control;
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .factory('config', factory);

    factory.$inject = [];

    function factory() {

        var config = {
            defaultMinimum: 0,
            defaultMaximum: 100,
            outOfBoundsMessage: 'Value is out of bounds. To see {0} control adjust the bounds in asset profile.',
            invalidBoundsMessage: 'Minimum bound is greater than maximum bound. Check asset profile.'
        };
        return config;
    }
})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('dynamicControl', dynamicControl);

    dynamicControl.$inject = ['$compile', 'widgetsCommon'];

    function dynamicControl($compile, widgetsCommon) {

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                asset: '=',
                onChange: '&',
                enabled: '=',
                configuration: '='
            }
        };

        return directive;

        ///////////////////////////

        function getControl(asset) {

            var controlName = null;

            if (asset.control) {
                if (typeof(asset.control) == 'object' && asset.control.name) {
                    controlName = asset.control.name;
                } else if (typeof(asset.control) == 'string') {
                    controlName = asset.control;
                }
            }

            if (!controlName) {
                controlName = widgetsCommon.findDefaultControl(asset);
            }

            return controlName;
        }

        function generateTemplate(controlName) {

            var template = '<{0}-control value="asset.state.value" profile="asset.profile" id="asset.id" on-change="publish(val)" enabled="enabled" asset="asset" configuration="configuration"></{0}-control>'.format(controlName);

            return template;
        }

        function linker(scope, element, attrs) {

            scope.$watch('asset', function(newAsset) {

                if (scope.asset) {

                    var controlName = getControl(scope.asset);

                    element.html(generateTemplate(controlName));

                    $compile(element.contents())(scope);
                }
            });

            scope.publish = function(val) {
                if (scope.onChange) {
                    scope.onChange({
                        val: val
                    });
                }
            };

        }

    }
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('assetChart', assetChart);

    var _defaultLoadFrom = 'past-24h';
    var _chartRefreshRate = 1000;

    function assetChart() {

        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            template: '<div class=chart width-change-detect><nvd3 ng-class="{zoom: vm.hovered}" class=linechart data=vm.chartData options=vm.options id=linechart></nvd3></div>',
            restrict: 'E',
            scope: {
                assets: '=',
                config: '='
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope', '$rootScope', '$q', '$interval', 'history.service'];

    function Controller($scope, $rootScope, $q, $interval, historyService) {

        var vm = this;
        vm.colors = d3.scale.ordinal().range(['#56646D', '#2670E0', '#25C2D5', '#43C399', '#A8C14D', '#F4C45B', '#FF855A', '#FF6458', '#ED4D73', '#9068C8']);

        vm.redrawTrigger = false;

        // Data for chart. Every object in array must contain { values: [ {x: ,y: }, {x: ,y: }, ...]}
        vm.chartData = [{
            values: [{
                x: 0,
                y: 0
            }]
        }];

        vm.data = [];

        vm.assetHistories = [];
        vm.configAssets = [];

        vm.hovered = false;

        var realTimeInterval;

        activate();

        //////////////////////////////////////////

        function activate() {

            $scope.$watchCollection('vm.assets', initializeHistory);

            $scope.$watch('vm.config.refreshChart', function(newValue, oldValue) {
                if (newValue === true) {
                    initializeHistory();
                    vm.config.refreshChart = false;
                }
            });

            $scope.$watch('__width', function(newWidth, oldWidth) {

                //alert('detected!' + newWidth);
                if (!!newWidth) {
                    vm.redrawTrigger = !vm.redrawTrigger;
                }

            });

            $scope.$watch('vm.config.timeScale', function(newValue, oldValue) {

                if (newValue === '60m') {
                    if (angular.isDefined(realTimeInterval)) {
                        return;
                    }

                    realTimeInterval = $interval(initializeHistory, 60000);

                } else {

                    destroyTimer();

                }

            });

            $scope.$on('destroy', function() {

                destroyTimer();

            });

        }

        function destroyTimer() {
            if (angular.isDefined(realTimeInterval)) {
                $interval.cancel(realTimeInterval);
                realTimeInterval = undefined;
            }
        }

        function initializeHistory() {

            vm.data = [];

            if (vm.config === null || vm.config === undefined) {

                if (vm.assets.length === 1) {

                    var tempAsset = vm.assets[0];

                    if (tempAsset.control) {

                        if (tempAsset.control.extras) {

                            vm.config = tempAsset.control.extras;
                        } else {

                            vm.config = {

                                type: 'line-chart',
                                timeScale: '60m'

                            };
                        }
                    }
                }
            }

            var timeSet = null;

            if (vm.config.type === 'bar-chart') {

                vm.options = generateBarChartOptions();

            } else if (vm.config.type === 'line-chart') {

                vm.options = generateLineChartOptions();

            } else if (vm.config.type === 'area-range-chart') {

                vm.options = generateAreaRangeChartOptions();

            }

            if (vm.config.timeScale) {

                timeSet = generateTimeSet(vm.config.timeScale, vm.config.page);

            } else {

                timeSet = generateTimeSet('60m', vm.config.page);

            }

            if (vm.assets && vm.assets.length) {

                var historyDataPromises = [];

                for (var i = 0; i < vm.assets.length; i++) {

                    var asset = null;

                    if (vm.assets[i]._showAsset) {

                        asset = vm.assets[i];

                        if (asset.is !== 'config') {
                            var promise = historyService.getAssetHistory(asset.id, timeSet.from, timeSet.to, timeSet.resolution)
                                .then(getHistoryLoadedHandler(asset));

                            historyDataPromises
                                .push(promise);
                        } else {
                            vm.configAssets.push(asset);
                        }

                    }
                }

                $q.all(historyDataPromises)
                    .then(function() {
                        for (var i = 0; i < vm.configAssets.length; i++) {
                            var asset = vm.configAssets[i];

                            constantDataMapper(asset, vm.assetHistories);
                        }

                        vm.configAssets = [];
                        vm.assetHistories = [];

                        vm.chartData = angular.copy(vm.data);
                    });
            }
        }

        function generateTimeSet(time, page) {

            var timeSet = {
                from: null,
                to: null,
                resolution: null
            };

            if (page === null || page === undefined) {

                page = 0;
            }

            var frameStart = null;
            var frameEnd = null;

            if (time === '30d') {

                frameStart = 30 * (page + 1);
                frameEnd = 30 * page;

                timeSet.resolution = 'day';

                timeSet.from = moment().subtract(frameStart, 'days');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'days');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '7d') {

                frameStart = 7 * (page + 1);
                frameEnd = 7 * page;

                timeSet.resolution = 'hour';

                timeSet.from = moment().subtract(frameStart, 'days');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'days');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '24h') {

                frameStart = 24 * (page + 1);
                frameEnd = 24 * page;

                timeSet.resolution = 'minute';

                timeSet.from = moment().subtract(frameStart, 'hours');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'hours');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '60m') {

                frameStart = 60 * (page + 1);
                frameEnd = 60 * page;

                timeSet.resolution = 'minute';

                timeSet.from = moment().subtract(frameStart, 'minutes');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'minutes');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            return timeSet;
        }

        function getHistoryLoadedHandler(asset) {

            return function(history) {

                if (vm.config.type === 'area-range-chart') {

                    vm.assetHistories.push(history);

                    areaRangeDataMapper(history, asset);

                } else {

                    vm.assetHistories.push(history);

                    dataMapper(history, asset, 'average');

                }

            };
        }

        function generateLineChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.type = 'lineChart';
            options.chart.useInteractiveGuideline = false;
            options.chart.interpolate = 'monotone';
            options.chart.pointSize = 10;
            options.chart.duration = 0;

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {
                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis = {
                tickFormat: function(d) {

                    return d3.format(',.1f')(d);
                }
            };

            options.chart.showLegend = false;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.lines = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            return options;

        }

        function generateBarChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {
                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.duration = 0;

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis1 = {
                tickFormat: function(d) {
                    if (!isNaN(d)) {
                        return d3.format(',.1f')(d);
                    }
                }
            };

            options.chart.showLegend = false;
            options.chart.stacked = true;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.bars1 = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            options.chart.type = 'multiChart';
            options.chart.showControls = false;

            return options;
        }

        function generateAreaRangeChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.type = 'lineChart';
            options.chart.useInteractiveGuideline = false;
            options.chart.interpolate = 'monotone';
            options.chart.pointSize = 10;
            options.chart.duration = 0;

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {

                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis = {
                tickFormat: function(d) {

                    return d3.format(',.1f')(d);
                }
            };

            options.chart.showLegend = false;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.lines = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            return options;

        }

        function clickHandler(event) {

            var timeToZoom = null;
            var page = 0;

            if (event.data && event.data.x !== null) {

                timeToZoom = event.data.x;

            } else if (event.length && event.length > 0) {

                timeToZoom = event[0].point.x;

            } else {

                timeToZoom = event.point.x;

            }

            if (vm.config.timeScale === '30d') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'days');

                vm.config.timeScale = '24h';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;

            }

            if (vm.config.timeScale === '7d') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'days');

                vm.config.timeScale = '24h';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;
            }

            if (vm.config.timeScale === '24h') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'hours');

                vm.config.timeScale = '60m';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;
            }


        }

        function hoverEvent(e) {

            if (vm.config.timeScale === '60m') {
                vm.hovered = false;
            } else {
                vm.hovered = true;
            }

        }

        function tickFormater(d) {
            if (vm.config.timeScale === '7d') {

                var daysDate = new Date(d);
                return d3.time.format('%A')(daysDate);

            } else if (vm.config.timeScale === '30d') {

                var monthDate = new Date(d);

                return d3.time.format('%d %b')(monthDate);

            } else {
                var hoursDate = new Date(d);
                return d3.time.format('%H:%M')(hoursDate);
            }
        }

        function tickValues(d) {

            var firstTime = d[0].values[0].x;
            var size = d[0].values.length;
            var lastTime = d[0].values[size - 1].x;
            var timeFormat = null;

            if (vm.config.timeScale === '60m') {
                timeFormat = d3.time.minute.range(new Date(firstTime), new Date(lastTime), 10);
            }

            if (vm.config.timeScale === '24h') {
                timeFormat = d3.time.hour.range(new Date(firstTime), new Date(lastTime), 4);
            }

            if (vm.config.timeScale === '7d') {
                timeFormat = d3.time.day.range(new Date(firstTime), new Date(lastTime), 1);
            }

            if (vm.config.timeScale === '30d') {

                timeFormat = d3.time.day.range(new Date(firstTime), new Date(lastTime), 4);
            }

            return timeFormat;

        }

        function addData(series, time, value) {

            var d = {
                x: time,
                y: value
            };
            series.values.push(d);
        }

        function dataMapper(history, asset, dataPoint) {

            var series = {
                values: [],
                key: asset.title
            };

            for (var i = 0; i < history.data.length; i++) {

                var hd = history.data[i];

                if (hd.data) {
                    if (!dataPoint) {
                        addData(series, new Date(hd.at), hd.data.avg);
                    }

                    if (dataPoint === 'average') {
                        addData(series, new Date(hd.at), hd.data.avg);
                    }

                    if (dataPoint === 'minimum') {
                        addData(series, new Date(hd.at), hd.data.min);
                    }

                    if (dataPoint === 'maximum') {
                        addData(series, new Date(hd.at), hd.data.max);
                    }

                } else {
                    addData(series, new Date(hd.at), null);
                }
            }

            if (asset._assetColor) {
                series.color = asset._assetColor;
            } else {
                series.color = vm.colors(0);
            }

            series.values = sortData(series.values);

            if (vm.config.type === 'bar-chart') {

                series.type = 'bar';
                series.yAxis = 1;

            }

            vm.data.push(series);
        }

        function constantDataMapper(asset, assetHistories) {

            var series = {
                values: [],
                key: asset.title
            };

            var numberOfPoints = 0;
            var timeFormat = 'h';

            if (vm.config.timeScale === '60m') {
                numberOfPoints = 60;
                timeFormat = 'm';
            }

            if (vm.config.timeScale === '24h') {
                numberOfPoints = 24;
            }

            if (vm.config.timeScale === '7d') {
                numberOfPoints = 7;
                timeFormat = 'd';
            }

            if (vm.config.timeScale === '30d') {

                numberOfPoints = 30;
                timeFormat = 'd';

            }

            if (assetHistories.length > 0) {

                var history = assetHistories[0].data;

                for (var i = 0; i < history.length; i++) {

                    if (asset.state && asset.state.value) {
                        addData(series, new Date(history[i].at), asset.state.value);
                    } else {
                        addData(series, new Date(history[i].at), null);
                    }

                }

            } else {
                for (var j = 0; j < numberOfPoints; j++) {

                    var time = moment().subtract(j, timeFormat);

                    if (asset.state && asset.state.value) {
                        addData(series, time, asset.state.value);
                    } else {
                        addData(series, time, null);
                    }

                }
            }

            if (asset._assetColor) {
                series.color = asset._assetColor;
            } else {
                series.color = vm.colors(0);
            }

            series.values = sortData(series.values);

            if (vm.config.type === 'bar-chart') {

                series.type = 'line';
                series.yAxis = 1;

            }

            vm.data.push(series);
        }

        function areaRangeDataMapper(history, asset) {

            var series1 = {
                values: [],
                key: asset.title + ' Maximum'
            };

            var series2 = {
                values: [],
                key: asset.title + ' Average'
            };

            var series3 = {
                values: [],
                key: asset.title + ' Minimum'
            };

            for (var i = 0; i < history.data.length; i++) {

                var hd = history.data[i];

                if (hd.data) {

                    addData(series1, new Date(hd.at), hd.data.max);
                    addData(series2, new Date(hd.at), hd.data.avg);
                    addData(series3, new Date(hd.at), hd.data.min);

                } else {
                    addData(series1, new Date(hd.at), null);
                    addData(series2, new Date(hd.at), null);
                    addData(series3, new Date(hd.at), null);
                }
            }

            if (asset._assetColor) {
                series1.color = asset._assetColor;
                series2.color = asset._assetColor;
                series3.color = asset._assetColor;
            } else {

                series1.color = vm.colors(0);
                series2.color = vm.colors(0);
                series3.color = vm.colors(0);

            }

            series1.values = sortData(series1.values);
            series2.values = sortData(series2.values);
            series3.values = sortData(series3.values);

            series1.classed = 'dashed';
            series2.strokeWidth = 2;
            series3.classed = 'dashed';

            vm.data.push(series1);
            vm.data.push(series2);
            vm.data.push(series3);

        }

        function sortData(array) {
            array.sort(function(a, b) {
                var keyA = a.x;
                var keyB = b.x;
                var result = 0;

                if (keyA < keyB) {
                    result = -1;
                }
                if (keyA > keyB) {
                    result = 1;
                }
                return result;

            });
            return array;
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('chartControl', chartControl);

    function chartControl() {

        var directive = {
            template: '<asset-chart assets=assets config=configuration></asset-chart>',
            link: link,
            restrict: 'E',
            scope: {
                asset: '='
            }
        };

        return directive;

        function link(scope, element, attrs) {

            scope.assets = [];

            scope.$watch('asset', function() {

                scope.assets = [];

                scope.asset._showAsset = true;

                scope.assets.push(scope.asset);

            });

        }
    }

})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('circleProgressControl', circleProgressControl);

    circleProgressControl.$inject = ['config'];

    function circleProgressControl(config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-knob ng-if=!blocked><knob knob-data=value knob-options=options data-width=229 data-height=229></knob><span class=knob-unit>{{profile.unit}}</span></div><div class=control-fallback ng-if=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Circle progress');
            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            scope.blocked = null;

            scope.options = {
                readOnly: true,
                thickness: 0.30,
                min: config.defaultMinimum,
                max: config.defaultMaximum,
                step: 1,
                displayPrevious: true,
                angleOffset: 180,
                font: '',
                fontWeight: 900,
                fontSize: 50,
                inputColor: '#55636c',
                fgColor: 'transparent',
                bgColor: 'transparent',
                lineCap: 'round',
                draw: function() {

                    var e = this.i;
                    var l = e.val().length;
                    var w = e.width();
                    var c;
                    var a;
                    var fontSize;

                    var foregroundCircleStroke;
                    var foregroundCircleFill;
                    var backgroundCircleSize;

                    c = this.g; // context
                    a = this.arc(this.cv); // Arc

                    if (typeof window.orientation == 'undefined' || window.innerWidth > 750) {
                        foregroundCircleFill = 16;
                        foregroundCircleStroke = 20;
                        backgroundCircleSize = 2;
                    } else {
                        foregroundCircleStroke = 50;
                        foregroundCircleFill = 38;
                        backgroundCircleSize = 6;
                    }

                    //draw background circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, 0, 2 * Math.PI, false);
                    c.strokeStyle = '#55636c';
                    c.lineWidth = backgroundCircleSize;
                    c.stroke();

                    //draw foreground fill circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#55636c';
                    c.lineCap = 'square';
                    c.lineWidth = foregroundCircleStroke;
                    c.stroke();

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#f0f0f0';
                    c.lineCap = '';
                    c.lineWidth = foregroundCircleFill;
                    c.stroke();

                    if (scope.value === undefined || scope.value === null) {
                        e.val('no value');
                    }

                    if (l < 8) {
                        fontSize = '35px';
                    } else {
                        fontSize = w / l * 2.3;
                    }

                    e.css({
                        'height': fontSize,
                        'line-height': fontSize,
                        'font-size': fontSize,
                        'margin-top': '90px',
                        'width': '173px',
                        'margin-left': '-202px'
                    });
                }
            };

            scope.$watch('value', function() {

                if (scope.value < scope.options.min || scope.value > scope.options.max) {
                    scope.blocked = true;
                    scope.message = assetValueOutOfBoundsMessage;
                } else {
                    scope.blocked = false;
                }
            });

            scope.$watch('profile', function() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {
                        scope.options.min = scope.profile.minimum;
                        scope.options.max = scope.profile.maximum;
                    } else {
                        scope.options.min = config.defaultMinimum;
                        scope.options.max = config.defaultMaximum;
                    }

                    if (scope.options.min > scope.options.max) {
                        scope.message = invalidMinMaxConfigurationMessage;
                    }

                    //value is out of bounds
                    if (scope.options.min > scope.value || scope.options.max < scope.value) {
                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;
                    } else {
                        scope.blocked = false;
                    }

                    if (scope.profile.type == 'number') {
                        scope.options.step = 0.1;
                    }
                }
            });
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('colorControl', colorControl);

    function colorControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-color><svg version=1.1 id=Layer_1 xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink x=0px y=0px width=150px height=150px viewbox=\"75 0 150 150\" enable-background=\"new 75 0 150 150\" xml:space=preserve><path fill=#EDEDED d=\"M150,0c-41.421,0-75,33.579-75,75c0,0.377,0.023,0.749,0.028,1.124C75.021,76.219,75,76.31,75,76.406v69.771 c0,2.111,1.712,3.823,3.823,3.823h69.771c0.097,0,0.187-0.021,0.282-0.028c0.376,0.006,0.747,0.028,1.124,0.028 c41.421,0,75-33.579,75-75C225,33.579,191.421,0,150,0z M88.62,143.999c-4.208,0-7.62-3.412-7.62-7.62c0-4.208,3.412-7.62,7.62-7.62 c4.208,0,7.62,3.412,7.62,7.62C96.24,140.588,92.829,143.999,88.62,143.999z\"></path><circle id=colorsvgtwo fill=#25E8A2 cx=150 cy=75 r=56.826></circle><path opacity=0.06 d=\"M150,16.141c32.507,0,58.859,26.352,58.859,58.859S182.507,133.859,150,133.859S91.141,107.507,91.141,75 S117.493,16.141,150,16.141z M101.917,75c0,26.556,21.528,48.083,48.083,48.083S198.083,101.556,198.083,75 S176.556,26.917,150,26.917S101.917,48.444,101.917,75z\"></path></svg></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };
        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function() {
                if (typeof(scope.value) === 'object') {
                    if (scope.value.r !== null && scope.value.g !== null && scope.value.b !== null) {
                        var hexRed = scope.value.r.toString(16);
                        hexRed = normaliseHex(hexRed);
                        var hexGreen = scope.value.g.toString(16);
                        hexGreen = normaliseHex(hexGreen);
                        var hexBlue = scope.value.b.toString(16);
                        hexBlue = normaliseHex(hexBlue);
                        scope.color = '#' + hexRed + hexGreen + hexBlue;

                        var element = $('#colorsvgtwo');
                        element.attr('fill', scope.color);
                    }
                } else if (typeof(scope.value) === 'string') {
                    if (isHexColor(scope.value)) {
                        var colorsvg = $('#colorsvgtwo');
                        colorsvg.attr('fill', scope.value);
                    }
                }
            });

            function isHexColor(colorString) {
                if (colorString[0] === '#') {
                    if (colorString.length === 7 || colorString.length === 4) {
                        var validationString = new RegExp('^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$');
                        return validationString.test(colorString);
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            function normaliseHex(hexValue) {
                if (hexValue.length == 1) {
                    var normalisedValue = '0' + hexValue;
                    return normalisedValue;
                } else {
                    return hexValue;
                }
            }
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('colorPickerControl', colorPickerControl);

    colorPickerControl.$inject = [];

    function colorPickerControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=color-picker-disabler ng-if=!enabled></div><div class=control-color-picker ng-if=mode ng-class=\"{disabled: !enabled}\"><spectrum-colorpicker on-change=colorChange(color) ng-model=color on-move=onMove(color) options=\"{ showInput: true, preferredFormat:\'rgb\', flat: true, chooseText: \'\' }\"></spectrum-colorpicker></div><div class=control-color-picker ng-if=!mode><spectrum-colorpicker on-change=colorChange(color) ng-model=color on-move=onMove(color) options=\"{ showInput: true, preferredFormat:\'hex\', flat: true, chooseText: \'\' }\"></spectrum-colorpicker></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var defaultState = 'rgb(0,0,0)';

            scope.firstTimePass = false;

            function prepareValue(valueObject) {

                if (valueObject === null || valueObject === undefined) {

                    return defaultState;

                }

                if (valueObject.r !== null && valueObject.g !== null && valueObject.b !== null) {

                    var rgbString = 'rgb(' + valueObject.r + ',' + valueObject.g + ',' + valueObject.b + ')';

                    return rgbString;

                } else if (isHexColor(valueObject)) {

                    return valueObject;

                } else {

                    return defaultState;

                }
            }

            scope.colorChange = function(color) {

                if (scope.firstTimePass) {

                    var rgb = colorToObject(color);

                    if (scope.profile.type === 'object' && (typeof rgb === 'object')) {

                        if (!scope.value || rgb.r !== scope.value.r || rgb.g !== scope.value.g || rgb.b !== scope.value.b) {

                            publishValue(rgb);

                        }

                    } else if (scope.profile.type === 'string' && (typeof color === 'string')) {

                        if (color !== scope.value) {

                            publishValue(color);

                        }

                    }
                } else {

                    scope.firstTimePass = true;

                }
            };

            scope.onMove = function(color) {

                element.find('.spectrum-color-preview').css({
                    'background-color': color
                });

            };

            scope.$watch('value', function() {

                scope.color = prepareValue(scope.value);

                element.find('.spectrum-initialColor-preview, .spectrum-color-preview').css({
                    'background-color': scope.color
                });

            });

            scope.$watch('profile', function() {

                if (scope.profile) {

                    if (scope.profile.type === 'object') {

                        scope.mode = true;

                    } else if (scope.profile.type === 'string') {

                        scope.mode = false;

                    }
                }
            });

            function colorToObject(color) {

                var colorString = color.slice(4, color.length);
                colorString = colorString.substring(0, colorString.length - 1);
                var colorValues = colorString.split(',');
                var red = colorValues[0].replace(' ', '');
                var green = colorValues[1].replace(' ', '');
                var blue = colorValues[2].replace(' ', '');
                var colorObject = {};
                colorObject.r = parseInt(red);
                colorObject.g = parseInt(green);
                colorObject.b = parseInt(blue);

                return colorObject;
            }

            function isHexColor(colorString) {

                if (colorString[0] === '#') {

                    if (colorString.length === 7 || colorString.length === 4) {

                        var validationString = new RegExp('^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$');

                        return validationString.test(colorString);

                    } else {

                        return false;

                    }
                } else {

                    return false;

                }
            }

            function publishValue(value) {

                if (scope.enabled) {

                    if (scope.onChange) {

                        scope.onChange({
                            val: value
                        });

                    }
                }
            }
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('labelControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-label ng-class=\"{\'no-color\' : vm.currentColor == undefined || vm.currentColor == null || vm.currentColor == vm.defaultColor}\"><label style=background-color:{{vm.currentColor}}><span ng-if=\"vm.value !== undefined && vm.value !== null\">{{vm.currentLabel}}</span> <span class=empty ng-if=\"vm.value === undefined || vm.value === null\"><i>no value</i></span><aside style=\"border-color:{{vm.currentColor}} transparent transparent transparent\"></aside></label></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                profile: '=',
                asset: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

    }

    var DEFAULT_COLOR = '#ffffff';
    var DEFAULT_LABEL = 'no value';

    Controller.$inject = ['$scope'];

    function Controller($scope) {

        var vm = this;

        vm.options = [];

        vm.currentColor = null;

        vm.defaultColor = DEFAULT_COLOR;

        vm.currentLabel = null;

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.value', valueWatcher);

        function controlWatcher(controlSettings) {

            var options = extractValues(controlSettings);

            extractColors(options, controlSettings);

            extractLabels(options, controlSettings);

            vm.options = options;
        }

        function valueWatcher(newValue) {

            var foundOption = null;

            angular.forEach(vm.options, function(option) {

                if (option.value === newValue) {

                    foundOption = option;

                }

            });

            if (foundOption) {

                vm.currentLabel = foundOption.label;

                vm.currentColor = foundOption.color;

            } else {

                vm.currentLabel = newValue;

                vm.currentColor = DEFAULT_COLOR;

            }
        }

        function extractValues(controlSettings) {

            var options = [];

            if (controlSettings && controlSettings.extras && controlSettings.extras.values) {

                angular.forEach(controlSettings.extras.values, function(option) {

                    options.push({
                        value: option
                    });

                });

            }

            return options;
        }

        function extractColors(options, controlSettings) {

            if (!controlSettings) {

                return;

            }

            angular.forEach(options, function(option, index) {

                //first, read from settings.[optionValue], as this is priority
                if (controlSettings.extras[option.value]) {

                    option.color = controlSettings.extras[option.value];

                    return;

                }

                if (!controlSettings.extras.colors) {

                    option.color = DEFAULT_COLOR;

                    return;

                }

                if (typeof controlSettings.extras.colors[index] === 'undefined') {

                    option.color = DEFAULT_COLOR;

                    return;

                }

                option.color = controlSettings.extras.colors[index];

            });
        }

        function extractLabels(options, controlSettings) {

            if (!controlSettings) {

                return;

            }

            angular.forEach(options, function(option, index) {

                if (!controlSettings.extras.labels) {

                    option.label = option.value;

                    return;

                }

                if (typeof controlSettings.extras.labels[index] === 'undefined') {

                    option.label = option.value;

                    return;

                }

                option.label = controlSettings.extras.labels[index];

            });
        }

    }
})();

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('dropdownControl', dropdownControl);

    dropdownControl.$inject = [];

    function dropdownControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-dropdown ng-class=\"{disabled: !enabled}\"><ui-select ng-disabled=!enabled theme=selectize ng-model=selectedValue on-select=onItemSelected($item,$model) search-enabled=false><ui-select-match placeholder=\"select option\">{{$select.selected.name}} {{profile.unit}}</ui-select-match><ui-select-choices repeat=\"item in listElements\"><aside>{{item.name}} {{profile.unit}}</aside></ui-select-choices></ui-select></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.listElements = [];
            scope.selectedValue = null;
            scope.onItemSelected = onItemSelected;
            scope.$watch('profile', watchProfile);
            scope.$watch('value', watchValue);

            function onItemSelected(item, model) {
                publishValue(item.value);
            }

            function publishValue(value) {

                if (scope.onChange) {

                    scope.onChange({
                        val: value
                    });

                }
            }

            function watchProfile() {

                scope.listElements = [];

                if (scope.profile) {

                    scope.listElements = extractOptionsFromProfile(scope.profile);

                    scope.selectedValue = getSelectedOption();

                }
            }

            function watchValue() {

                scope.selectedValue = getSelectedOption();

            }

            function extractOptionsFromProfile(profile) {

                var options = [];

                if (profile.enum) {

                    angular.forEach(profile.enum, function(val) {
                        options.push({
                            name: val,
                            value: val
                        });
                    });

                    return options;
                }

                if (profile.labels) {

                    angular.forEach(profile.labels, function(val) {

                        options.push({
                            name: val.name,
                            value: val.value
                        });
                    });

                    return options;
                }

                if (profile.type == 'boolean') {

                    options.push({
                        name: 'true',
                        value: true
                    });

                    options.push({
                        name: 'false',
                        value: false
                    });

                    return options;
                }
            }

            function getSelectedOption() {

                var selOption = null;

                angular.forEach(scope.listElements, function(option) {

                    if (option.value === scope.value) {

                        selOption = option;

                    }

                });

                return selOption;
            }
        }
    }

}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('inputControl', inputControl);

    inputControl.$inject = [];

    function inputControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-input ng-class=\"{disabled: !enabled}\"><input type=text ng-model=localValue placeholder=\"Enter value\" ng-disabled=!enabled> <button class=input-control-btn ng-click=sendValue(localValue) ng-disabled=!enabled></button></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function(newValue) {
                scope.localValue = newValue;
            });

            element.bind('keydown keypress', function(event) {
                if (event.which === 13) {
                    scope.sendValue(scope.localValue);
                    event.preventDefault();
                }
            });

            scope.sendValue = function(value) {
                var normalisedValue = normaliseData(value);
                if (validateInputData(normalisedValue)) {
                    publishValue(normalisedValue);
                }
            };

            function validateInputData(value) {
                if (scope.profile.type == 'integer') {
                    if (isInteger(value)) {
                        if (isInBounds(value)) {
                            return true;
                        }
                    }
                } else if (scope.profile.type == 'number') {
                    if (typeof(value) == 'number') {
                        if (isInBounds(value)) {
                            return true;
                        }
                    }
                } else if (scope.profile.type == 'string') {
                    if (typeof(value) == 'string') {
                        return true;
                    }
                } else {
                    return false;
                }
            }

            function normaliseData(value) {
                if (scope.profile.type === 'number' || scope.profile.type === 'integer') {
                    var data = Number(value);
                    if (typeof(data) == 'number') {
                        if (!isNaN(data)) {
                            return data;
                        }
                    }
                } else {
                    return value;
                }
            }

            function isInteger(value) {
                if (value % 1 === 0) {
                    return true;
                } else {
                    return false;
                }
            }

            function isNumber(value) {
                if (value % 1 !== 0 || value % 1 === 0) {
                    return true;
                } else {
                    return false;
                }
            }

            function isInBounds(value) {
                if (value < scope.profile.minimum || value > scope.profile.maximum) {
                    return false;
                } else {
                    return true;
                }
            }

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('jsonControl', jsonControl);

    jsonControl.$inject = [];

    function jsonControl() {

        var directive = {
            restrict: 'E',
            template: '<div class=control-json><json-formatter json=value open=2></json-formatter></div>',
            scope: {
                profile: '=',
                value: '=?',
                id: '='
            },
            link: linker
        };

        return directive;

        //////////////////////

        function linker(scope, element, attrs) {

            if (scope.value === undefined) {
                scope.value = null;
            }

            scope.$watch('value', function(newValue) {
                scope.value = newValue;
            });
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('knobControl', knobControl);

    knobControl.$inject = ['$interval', 'config'];

    function knobControl($interval, config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-knob ng-if=!blocked ng-class=\"{disabled: !enabled}\"><knob knob-data=value knob-options=options data-width=229 data-height=229></knob><span class=knob-unit>{{profile.unit}}</span></div><div class=control-fallback ng-if=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Knob');

            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            var valueToPublish = null;

            var publishInterval = null;

            scope.blocked = null;

            scope.message = null;

            scope.options = {
                readOnly: !scope.enabled,
                min: config.defaultMinimum,
                max: config.defaultMaximum,
                step: 1,
                thickness: 0.30,
                displayPrevious: true,
                angleOffset: 180,
                font: '',
                fontWeight: 900,
                inputColor: '#55636c',
                fgColor: 'transparent',
                bgColor: 'transparent',
                lineCap: 'round',
                mouseWheel: false,
                release: function(newValue) {

                    if (scope.value !== newValue) {

                        valueToPublish = newValue;

                    }
                },

                draw: function() {
                    var e = this.i;
                    var l = e.val().length;
                    var w = e.width();

                    var fontSize = w / l * 2.5;
                    if (l < 8) {
                        fontSize = '35px';
                    }

                    e.css({
                        'height': fontSize,
                        'line-height': fontSize,
                        'font-size': fontSize,
                        'margin-top': '90px',
                        'width': '173px',
                        'margin-left': '-202px'
                    });

                    var c = this.g; // context
                    var a = this.arc(this.cv); // Arc

                    var handleSize = 40; // radius of knob handle
                    var foregroundCircleStroke = 50;
                    var foregroundCircleFill = 38;
                    var handleLineSize = 6;
                    var backgroundCircleSize = 6;

                    if (typeof window.orientation == 'undefined' || window.innerWidth > 750) {
                        handleSize = 15; // radius of knob handle
                        foregroundCircleStroke = 20;
                        foregroundCircleFill = 16;
                        handleLineSize = 2;
                        backgroundCircleSize = 2;
                    }

                    c.canvas.addEventListener('mousemove', function(event) {
                        var mousePos = getMousePos(c.canvas, event);
                        var distance = Math.sqrt(Math.pow((mousePos.x - x), 2) + Math.pow((mousePos.y - y), 2));
                        if (distance < handleSize) {
                            $(this).css({
                                'cursor': 'move'
                            });
                        } else {
                            $(this).css({
                                'cursor': 'default'
                            });
                        }
                    }, false);

                    function getMousePos(canvas, event) {
                        var rect = canvas.getBoundingClientRect();
                        return {
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top
                        };
                    }

                    //draw background circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, 0, 2 * Math.PI, false);
                    c.strokeStyle = '#55636c';
                    c.lineWidth = backgroundCircleSize;
                    c.stroke();

                    //draw foreground fill circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#55636c';
                    c.lineCap = 'square';
                    c.lineWidth = foregroundCircleStroke;
                    c.stroke();

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    if (scope.enabled) {
                        c.strokeStyle = '#fff';
                    } else {
                        c.strokeStyle = '#f0f0f0';
                    }

                    c.lineCap = '';
                    c.lineWidth = foregroundCircleFill;
                    c.stroke();

                    //draw handle
                    // get the end angle coordinates. found it here: http://stackoverflow.com/questions/18342216/how-to-get-an-array-of-coordinates-that-make-up-a-circle-in-canvas
                    if (scope.enabled) {
                        var radians = a.e - Math.PI / 180;
                        var x = this.xy + this.radius * Math.cos(radians);
                        var y = this.xy + this.radius * Math.sin(radians);

                        // your custom dot
                        c.beginPath();
                        c.arc(x, y, handleSize, 0, 2 * Math.PI, false);
                        c.fillStyle = '#fff';
                        c.strokeStyle = '#55636c';
                        c.lineCap = 'round';
                        c.lineWidth = handleLineSize;
                        c.fill();
                        c.stroke();
                    }
                }
            };

            publishInterval = $interval(publishIntervalHandler, 1000);

            scope.$watch('profile', profileWatcher);

            scope.$watch('value', valueWatcher);

            scope.$watch('enabled', enableWatcher);

            scope.$on('$destroy', destroyHandler);

            function profileWatcher() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.options.min = scope.profile.minimum;
                        scope.options.max = scope.profile.maximum;

                    } else {

                        scope.options.min = config.defaultMinimum;
                        scope.options.max = config.defaultMaximum;

                    }

                    if (scope.options.min > scope.options.max) {

                        scope.message = invalidMinMaxConfigurationMessage;

                    }

                    if (scope.options.min > scope.value || scope.options.max < scope.value) {

                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;

                    } else {

                        scope.blocked = false;

                    }

                    if (scope.profile.type == 'number') {

                        scope.options.step = 0.1;

                    }

                }
            }

            function enableWatcher() {

                scope.options.readOnly = !scope.enabled;

            }

            function valueWatcher() {

                if (scope.value < scope.options.min || scope.value > scope.options.max) {

                    scope.blocked = true;

                    scope.message = assetValueOutOfBoundsMessage;

                } else {

                    scope.blocked = false;

                }
            }

            function publishIntervalHandler() {

                if (valueToPublish) {

                    publishValue(valueToPublish);

                    valueToPublish = null;

                }
            }

            function destroyHandler() {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

            function publishValue(value) {

                if (scope.onChange) {

                    scope.onChange({
                        val: value
                    });

                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('lineProgressControl', lineProgressControl);

    lineProgressControl.$inject = ['config'];

    function lineProgressControl(config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-slider ng-show=!blocked><article class=slider-val><span class=slider-value>{{value}}</span> <span class=slider-unit>{{profile.unit}}</span></article><div><md-slider ng-if=sliderSettingsAreReady aria-label=lineProgress ng-disabled=true ng-model=value min=\"{{ sliderSettings.minimum }}\" max=\"{{ sliderSettings.maximum }}\" step=1></md-slider></div></div><div class=control-fallback ng-show=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                value: '=',
                profile: '=',
                id: '='
            }
        };
        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Line progress');
            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            scope.blocked = null;
            scope.message = null;
            scope.sliderSettings = {
                minimum: config.defaultMinimum,
                maximum: config.defaultMaximum
            };

            scope.$watch('value', function(newValue) {
                if (scope.value > scope.sliderSettings.maximum || scope.value < scope.sliderSettings.minimum) {
                    scope.blocked = true;
                    scope.message = assetValueOutOfBoundsMessage;
                } else {
                    scope.blocked = false;
                    scope.value = newValue;
                }
            });

            scope.$watch('profile', function() {
                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.sliderSettings.minimum = scope.profile.minimum;
                        scope.sliderSettings.maximum = scope.profile.maximum;

                    } else {
                        scope.sliderSettings.minimum = config.defaultMinimum;
                        scope.sliderSettings.maximum = config.defaultMaximum;
                    }

                    if (scope.sliderSettings.minimum > scope.sliderSettings.maximum) {
                        scope.blocked = true;
                        scope.message = invalidMinMaxConfigurationMessage;
                    } else if (scope.sliderSettings.minimum > scope.value || scope.sliderSettings.maximum < scope.value) {
                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;
                    } else {
                        scope.blocked = false;
                    }
                }
            });

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = true;
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('lockUnlockControl', lockUnlockControl);

    lockUnlockControl.$inject = [];

    function lockUnlockControl() {

        var directive = {
            template: '<div class=control-lock-unlock ng-click=onClick() ng-class=\"{disabled: !enabled}\"><button ng-disabled=!enabled ng-class=\"{ locked: locked }\"></button></div>',
            link: link,
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            //Default controls state:
            scope.unlockedValue = false;
            scope.lockedValue = true;
            scope.locked = false;

            scope.$watch('profile', function() {

                if (scope.profile) {
                    if (scope.profile.enum) {
                        scope.unlockedValue = scope.profile.enum[0];
                        scope.lockedValue = scope.profile.enum[1];
                    } else {
                        if (scope.profile.type == 'boolean') {
                            scope.unlockedValue = false;
                            scope.lockedValue = true;
                        }

                        if (scope.profile.type == 'integer') {
                            scope.unlockedValue = 0;
                            scope.lockedValue = scope.value;
                        }
                    }

                    update();
                }
            });

            scope.$watch('value', function(newValue) {
                update();
            });

            scope.onClick = function() {

                //if not locked -> lock
                if (scope.enabled) {
                    if (!scope.locked) {
                        publishValue(scope.lockedValue);
                        scope.locked = true;
                    } else if (scope.locked) { //if locked -> unlock
                        publishValue(scope.unlockedValue);
                        scope.locked = false;
                    }
                }
            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }

            function update() {
                if (scope.value === scope.lockedValue) {
                    scope.locked = true;
                } else if (scope.value === scope.unlockedValue) {
                    scope.locked = false;
                }
            }

        }
    }

})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('mapControl', mapControl);

    mapControl.$inject = [];

    function mapControl() {
        var directive = {
            template: '<leaflet id={{vm.id}} class=control-map markers=vm.markers center=vm.center defaults=vm.defaults paths=vm.paths></leaflet>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['$scope', '$interval', 'leafletData'];

    function Controller($scope, $interval, leafletData) {

        var mapDefaults = {
            icon: {
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAwCAYAAAAGlsrkAAAACXBIWXMAAAsTAAALEwEAmpwYAAA5lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU0OTExLCAyMDEzLzEwLzI5LTExOjQ3OjE2ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNS0xMC0yMlQxMjo0ODowOCswMjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE1LTEwLTIyVDEzOjUyOjE2KzAyOjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNS0xMC0yMlQxMzo1MjoxNiswMjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDpkNzU1MTY4OC05ZDhhLWQyNGUtODVhZi1hOTAxMDNmMjM1MTU8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6OTIxRTQ4OTI3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6OTIxRTQ4OEY3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6OTIxRTQ4OTA3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo5MjFFNDg5Mjc4QTkxMUU1QjM4MEI2NThBMTk0N0RCRjwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDc1NTE2ODgtOWQ4YS1kMjRlLTg1YWYtYTkwMTAzZjIzNTE1PC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE1LTEwLTIyVDEzOjUyOjE2KzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4zMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40ODwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+ZnhexAAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAEY0lEQVR42ryYS2gkRRjHf1XdPclMkkki+wKX1Si7q7IsCB72IB4XRMGjggdRTx4UBfGFqJcoooJ6cteDB8GDLxSMIqj4AkUkK2QPK7uuiRGjyT4yeU/PVH0eqkYn0510z0yS/2Ho6e6v/vW9v2p16OFJcuA64DhwDLgR2NfyfAYYB34EPgfOZi0YZjw/CjwJ3AEUN3lvCLgeuBtYBj4BXgRObSSgN1lsFPgFuCuDtBV9wJ3eAi8BhbzEu4EvgKcARXd4FPgSuDLL1GXga+CG1GWUBqVRKmjakyBiQQyITZO6GfjOx8dsGnEBGNuIVAUFRCwSL2HjRbAxIKAjVDSAKvS7d0zN3V+PEb/2LcBqK/Go310TBFQIOsSsXkAWp7HVCtgaIgIISmnQIaowgO7fjy7tASzYequnbvIB9xCA8ul0BJhIkkagwFTOY+Z/c0Q6cqHxv6Xdj99MUD5AMHzYucXGaWFyFJjQTdq22ha0xlz6FXvpLEqHqKDo7ivlF1TuWmkIelBBAbswhbl4GoWATs3WlxtRfRC4rVVbFUTYxWnM4hSEPY4w6btk8IVFzNJf1CvnnZuSOA4c0cCtQLB+gQgbr2Aqv6MI3IJtQOkIu/AHEldAR2mv3K59mLcIBtjVWaS2DEHUfvbqCDFV7PKsd0XCz8c0cHg9q0JsHalW2tZ0nat06DQ2qQF2UAN7E8VM6lBf84WiU2iktpqWVgB7dWotFQFMd8VS4SuZpJm6oIE4XSrojlgA7UqsU2Qdqtr30iZYV4nCEmK70dqgwpJPqQTxjE5ULHGBoXqHnIBIZwpbg+4dRgWFtOYxoYFvk0I1dGk3uqeMpJe9DNIaKiyhSns2str32neNlfWSBhUUCQav9f/r+cnFNYhgcAQVDYDUEv4FPtLAHHCiNbjEVFF9+wiHDrmUyKO51BETEw5eQ1A+sJHMm8BMozvtAqaAUrLxB9ilPzHz56BeBR00NQqfemLAGtARwdAIuny171gJS1V9b55pVPELvkONJswGBOWrUL1XuPpbvYzU16DR8FWICouonmH0wH50z7CLCzFp2r7RyCLVNN4WgDN+R6n1F6WgvobUlv6bNJSOUFEfRCWXNba2URe77MvzXOsEEgOPAe+lElsfJDpEFXehvTaCODObOCvsnmuQpk2Z7wOfZUatiRFTRUzVEUpmoRkHXs8ab+8F5tk6GOCePHP1P8ATW0j8PHA670niBPDVFpBOAM+0e4S5H1jrkvi+Ts5Ok8DTXZC+AvzcCXFDeLwD0kng8c3nk2w80AHxg1kjTB7in4CTbZCO+fMx3RLjfb2S891H8o2C+TAHvJDjvZN5PkO0QwzwanOtTcEK8Gz+4Tc/loDXNnn+FvD3dhA3+mlaHY+9Rdgu4ovA2yn3PwDObSdxY2ZKCyq2m3gC+KHp/xngm50gBnin6frd7BP71hF/3HT9YWdnyc4w7U28kPxokw8hneOU34DdaeJP/ZdAdpp4DOjvVPjfAQAj1Hyq7g5auQAAAABJRU5ErkJggg==',
                shadowImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAdCAYAAADoxT9SAAAACXBIWXMAAAsTAAALEwEAmpwYAAA5lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU0OTExLCAyMDEzLzEwLzI5LTExOjQ3OjE2ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNS0xMC0yMlQxMjo0ODowOCswMjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE1LTEwLTIyVDEzOjUyOjI5KzAyOjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNS0xMC0yMlQxMzo1MjoyOSswMjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDphNTg0ZmY4MC03YTE2LTBmNDgtOTUwYS03NzgzMzY1MGQ5Nzg8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6ODhDNzNFMUI3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6ODhDNzNFMTg3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODhDNzNFMTk3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo4OEM3M0UxQjc4QTkxMUU1QUIwMkIzQjc2RDdFMzdGNzwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6YTU4NGZmODAtN2ExNi0wZjQ4LTk1MGEtNzc4MzM2NTBkOTc4PC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE1LTEwLTIyVDEzOjUyOjI5KzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj41MDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yOTwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+1iOTFQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAACI0lEQVR42tyY607DMAyFT9qwsQ14//dEoNJLwg+OpYOV0a43BpWsBpCoP/s4dhJyzvgPTwSAEMKe3wzufe3JtNEn5/wFspPTAUDl3qEAZACJluWdf8zIRgAVgJoWZW1WglGnB1oHoKfZ7/KWIOZMDeCB//vI9cHBGKiXmDmYxDraB4AWQMOfv2UorghhAEcAj3wbQHSS+qlW8hWJtYR5p31odtYAMek8ArgIRJToTy3wEmBNZ6MEp+bfGpNiXJiFwCxcaGf5UJjo+C0Zt4wm1kzH9eKMGMSLQKwJUALSzBjY7IwEkdOzQFQ79qFvz9wPV4zK084QoKRaWlpS7JaNE+1hJwjrLQ13rWbprmXZOFNa9cYAiW/rJW8AXrlOc/tIRRmdCBE3KmxtjNbdG+khje/wccYWeCTI2nWRXRPspR4asY4Qs0eUivWwZjZ0GPSzVSvdvJNZKy8ZGi0bpxt3qeA+nNzYYc73MlN1hUExjY30U0FqN4LUE6Wijg9XJlpda9RHnb8VpGYGntx266OdC4Ne76zkdHJnj1lH1jgBwhrfheu6oO+STAZqXPXdFw5Kq5y148hAeCDAs0hKHU9O06pxczxt4fhUkKoAESSynewmvji9VPa7fCgcUQ8ymkeRibdrUf+dW5QCxJn1EKQJtaL5we1I93EdJBBRzhSdQPhdBr8V+Vuk1bs9f7inyE8F8Xv73UV+DKQU8T91lxr+y93v5wCV/Qp4dygmBQAAAABJRU5ErkJggg==',
                iconSize: [30, 48],
                shadowSize: [50, 29],
                iconAnchor: [15, 48],
                shadowAnchor: [3, 29]
            },
            behavior: {
                drawLineBetweenLocations: true,
                lineColor: '#3D91CE',
                lineWeight: 6,
                lineOpacity: 0.4
            },
            controls: {
                scrollWheelZoom: false,
                doubleClickZoom: true,
                attributionControl: true,
                zoomControl: true,
                dragging: true,
                tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            },
            center: {}
        };

        var pendingStateLocation = null;
        var pendingPaths = [];
        var mapInitialized = false;

        //map is not update every time state changes, but every in interval specified
        var mapUpdateInterval = 3000;

        var vm = this;
        vm.center = mapDefaults.center;
        vm.markers = [];
        vm.defaults = mapDefaults.controls;

        vm.paths = {
            movement: {
                color: mapDefaults.behavior.lineColor,
                weight: mapDefaults.behavior.lineWeight,
                opacity: mapDefaults.behavior.lineOpacity,
                latlngs: []
            }
        };

        $scope.$watch('vm.value', function() {

            if (!isUndefinedOrNull(vm.value)) {

                //setup for next map update
                pendingStateLocation = extractStateLocation(vm.value);
                pendingPaths.push(angular.copy(pendingStateLocation.location));

                //on inital state change, update map immediately
                if (!mapInitialized) {
                    updateMap();
                    mapInitialized = true;
                }
            }
        });

        $interval(updateMap, mapUpdateInterval);

        function updateMap() {

            if (pendingStateLocation) {

                vm.center = angular.copy(pendingStateLocation.location);

                //set map.zoom only if there is only one relevant point on the map
                //if there is more then one point, fit to bound will be applied.
                if (vm.paths.movement.latlngs.length === 0) {
                    vm.center.zoom = pendingStateLocation.zoom;
                }

                vm.markers = [getMarker(pendingStateLocation.location)];

                if (mapDefaults.behavior.drawLineBetweenLocations) {

                    angular.forEach(pendingPaths, function(p) {
                        vm.paths.movement.latlngs.push(p);
                    });

                    //do fit to bounds only if there is more the one point
                    //if there one or none, leave the default zoom
                    if (vm.paths.movement.latlngs.length > 1) {

                        leafletData.getMap(vm.id).then(function(map) {

                            map.fitBounds(vm.paths.movement.latlngs);
                        });
                    }
                }

                pendingStateLocation = null;
                pendingPaths = [];
            }
        }

        function extractStateLocation(state) {

            if (isUndefinedOrNull(state)) {
                throw 'Smartliving Widgets - Map Control - Invalid location';
            }

            var stateLocation = {
                location: {
                    lat: 0,
                    lng: 0
                },
                zoom: 11
            };

            if (angular.isArray(state)) {

                if (state.length === 2 && angular.isNumber(state[0]) && angular.isNumber(state[1])) {
                    stateLocation.location.lat = state[0];
                    stateLocation.location.lng = state[1];
                    return stateLocation;
                }
            }

            if (angular.isNumber(state.lat) && angular.isNumber(state.lng)) {
                stateLocation.location.lat = state.lat;
                stateLocation.location.lng = state.lng;
                return stateLocation;
            }

            if (angular.isNumber(state.latitude) && angular.isNumber(state.longitude)) {
                stateLocation.location.lat = state.latitude;
                stateLocation.location.lng = state.longitude;
                return stateLocation;
            }

            if (angular.isNumber(state.lat) && angular.isNumber(state.long)) {
                stateLocation.location.lat = state.lat;
                stateLocation.location.lng = state.long;
                return stateLocation;
            }

            throw 'Smartliving Widgets - Map Control - Invalid location';
        }

        function getMarker(location) {
            var marker = {
                lat: location.lat,
                lng: location.lng,
                icon: {
                    iconUrl: mapDefaults.icon.image,
                    shadowUrl: mapDefaults.icon.shadowImage,
                    iconSize: mapDefaults.icon.iconSize,
                    shadowSize: mapDefaults.icon.shadowSize,
                    iconAnchor: mapDefaults.icon.iconAnchor,
                    shadowAnchor: mapDefaults.icon.shadowAnchor
                }
            };
            return marker;
        }

        function isUndefinedOrNull(v) {
            return angular.isUndefined(v) || v === null;
        }
    }
})();

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('onoffControl', onoffControl);

    onoffControl.$inject = [];

    function onoffControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-onoff><div class=indicator ng-class=\"{ on: turnOn}\"></div></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        //////////////////////////

        function linker(scope, element, attrs) {

            scope.turnOn = false;

            scope.$watch('value', function() {

                if (scope.profile) {

                    if (scope.profile.enum) {

                        if (scope.value === scope.profile.enum[1]) {
                            scope.turnOn = true;
                        } else if (scope.value === scope.profile.enum[0]) {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type === 'integer' || scope.profile.type === 'number') {
                        if (scope.value !== 0 && scope.value > 0) {
                            scope.turnOn = true;
                        } else {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type === 'boolean') {
                        if (scope.value === true) {
                            scope.turnOn = true;
                        } else {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type == 'string') {
                        if (scope.value === '' || scope.value === undefined || scope.value === null) {
                            scope.turnOn = false;
                        } else {
                            scope.turnOn = true;
                        }
                    } else if (scope.profile.type == 'object') {
                        if (isEmptyObject(scope.value)) {
                            scope.turnOn = false;
                        } else {
                            scope.turnOn = true;
                        }
                    }
                }
            });
        }

        function isEmptyObject(obj) {
            return JSON.stringify(obj) === '{}';
        }
    }
}());

(function() {
    'use strict';

    var PushButtonStatus = {
        profileValid: 0,
        profileInvalid: 1
    };

    var PUBLISH_INTERVAL_TIMEOUT = 1000;

    angular
        .module('ngSmartlivingWidgets')
        .directive('pushButtonControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-push-button ng-class=\"{disabled: !vm.enabled}\"><button ng-disabled=!vm.enabled ng-mousedown=vm.onPress() ng-touchstart=vm.onPress() ng-mouseup=vm.onRelease() ng-touchend=vm.onRelease()></button></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                asset: '=',
                onChange: '&'
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope', '$timeout', '$interval'];

    function Controller($scope, $timeout, $interval) {

        var vm = this;

        vm.status = PushButtonStatus.profileValid;
        vm.onPress = onPress;
        vm.onRelease = onRelease;

        var publishInterval = null;
        var pressValue = true;
        var releaseValue = false;

        var buttonConfiguration = {
            type: 'push-to-make',
            interval: false,
            break: true
        };

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.asset.profile', profileWatcher);
        $scope.$on('$destroy', onDestroy);

        function profileWatcher(profile) {

            if (!validateProfile(profile)) {

                vm.status = PushButtonStatus.profileInvalid;

                return;

            }

            configurePressAndReleaseValues();
        }

        function controlWatcher(controlSettings) {

            if (controlSettings && controlSettings.extras) {

                if (controlSettings.extras.type) {

                    buttonConfiguration.type = controlSettings.extras.type;

                }

                if (controlSettings.extras.behavior === 'continuous' || controlSettings.extras.behavior === 'continuous-break') {

                    buttonConfiguration.interval = true;

                }

                if (controlSettings.extras.behavior === 'continuous') {

                    buttonConfiguration.break = false;

                }

                configurePressAndReleaseValues();

            }
        }

        function configurePressAndReleaseValues() {

            if (vm.profile.enum) {

                if (buttonConfiguration.type === 'push-to-make') {

                    pressValue = vm.profile.enum[0];

                    releaseValue = vm.profile.enum[1];

                } else {

                    pressValue = vm.profile.enum[1];

                    releaseValue = vm.profile.enum[0];

                }

                //if profile.enum is configured, then there is no sense to check if 
                //profile.type is boolean or whatever because first value will always be used
                //to actuate onPush and onRelease will be used to actuate onRelease
                return;

            }

            if (vm.profile.type === 'boolean') {

                if (buttonConfiguration.type === 'push-to-make') {

                    pressValue = true;

                    releaseValue = false;

                } else {

                    pressValue = false;

                    releaseValue = true;

                }

            }

        }

        function validateProfile(profile) {

            if (profile.type === 'boolean') {

                return true;

            }

            if (profile.enum && profile.enum.length === 2) {

                return true;

            }

            return false;

        }

        function onPress() {

            if (buttonConfiguration.interval) {

                if (publishInterval) {

                    $interval.cancel(publishInterval);

                    publishInterval = null;

                }

                publish(pressValue);

                publishInterval = $interval(function() {

                    publish(pressValue);

                }, PUBLISH_INTERVAL_TIMEOUT);

            } else {

                publish(pressValue);

            }

        }

        function onRelease() {

            if (publishInterval) {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }


            if (buttonConfiguration.break) {

                //make a short delay before publishing release to make sure
                //press event has reached server
                $timeout(function() {

                    publish(releaseValue);

                }, 10);

            }

        }

        function publish(commandValue) {

            if (vm.onChange) {

                vm.onChange({
                    val: commandValue
                });

            }

        }

        function onDestroy() {

            if (publishInterval) {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

        }
    }


})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('sliderControl', sliderControl);

    sliderControl.$inject = ['$interval', 'config'];

    function sliderControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=control-slider ng-show=!blocked ng-class=\"{disabled: !enabled}\"><article class=slider-val><span class=slider-value>{{value}}</span> <span class=slider-unit>{{profile.unit}}</span></article><div><md-slider ng-if=sliderSettingsAreReady ng-disabled=!enabled aria-label=slider ng-model=slider.value min=\"{{ sliderSettings.minimum }}\" max=\"{{ sliderSettings.maximum }}\" step=1></md-slider></div></div><div class=control-fallback ng-show=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            scope: {
                enabled: '=',
                value: '=',
                profile: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Slider');

            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            var valueToPublish = null;

            var publishInterval = null;

            scope.blocked = null;

            scope.message = null;

            scope.slider = {
                value: null
            };

            scope.sliderSettings = {
                minimum: config.defaultMinimum,
                maximum: config.defaultMaximum
            };

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = false;

            publishInterval = $interval(publishIntervalHandler, 1000);
            scope.$on('$destroy', destroyHandler);
            scope.$watch('value', valueWatcher);
            scope.$watch('slider.value', sliderValueWatcher);
            scope.$watch('profile', profileWatcher);

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = true;

            function publishIntervalHandler() {

                if (valueToPublish) {

                    publishValue(valueToPublish);

                    valueToPublish = null;

                }
            }

            function destroyHandler() {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

            function valueWatcher(newValue) {

                if (scope.value > scope.sliderSettings.maximum || scope.value < scope.sliderSettings.minimum) {

                    scope.blocked = true;

                    scope.message = assetValueOutOfBoundsMessage;

                } else {

                    scope.slider.value = newValue;

                    scope.blocked = false;

                }
            }

            function sliderValueWatcher(newValue, oldValue) {

                //Setup value to publish only if slider.value is different then current value
                if (scope.slider.value !== scope.value) {

                    valueToPublish = newValue;

                }
            }

            function profileWatcher() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.sliderSettings.minimum = scope.profile.minimum;
                        scope.sliderSettings.maximum = scope.profile.maximum;

                    } else {

                        scope.sliderSettings.minimum = config.defaultMinimum;
                        scope.sliderSettings.maximum = config.defaultMaximum;

                    }

                    if (scope.sliderSettings.minimum > scope.sliderSettings.maximum) {

                        scope.blocked = true;
                        scope.message = invalidMinMaxConfigurationMessage;

                    } else if (scope.sliderSettings.minimum > scope.value || scope.sliderSettings.maximum < scope.value) {

                        scope.blocked = true;

                        scope.message = assetValueOutOfBoundsMessage;

                    } else {

                        scope.blocked = false;

                    }
                }
            }

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('spinnerControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-spinner ng-class=\"{disabled: !vm.spinerStatus.enabled}\"><div ng-if=!sInt(vm.step)><button class=\"spinner-btn plus\" ng-click=vm.increase() ng-disabled=!vm.spinerStatus.enabled angular-ripple></button><p class=spinner-value>{{ vm.asset.state.value }}</p><button class=\"spinner-btn minus\" ng-click=vm.decrease() ng-disabled=!vm.spinerStatus.enabled angular-ripple></button></div><div class=control-fallback ng-if=isInt(vm.step)><div class=value-unit><h1><b>Mismatch!</b></h1></div><p>{{ vm.spinerStatus.message}}</p></div></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                asset: '=',
                onChange: '&'
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope'];

    function Controller($scope) {

        var vm = this;

        vm.increase = increase;
        vm.decrease = decrease;

        vm.spinerStatus = {
            enabled: true,
            message: null
        };

        vm.step = null;

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.asset.profile', profileWatcher);

        function profileWatcher(profile) {

            compareStepWithProfile(profile);

        }

        function controlWatcher(controlSettings) {

            if (controlSettings && controlSettings.extras) {

                if (controlSettings.extras.step) {

                    vm.step = controlSettings.extras.step;

                    compareStepWithProfile(vm.asset.profile);

                }

            } else {

                if (vm.profile.type === 'number') {

                    vm.step = 0.1;

                } else if (vm.profile.type === 'integer') {

                    vm.step = 1;

                }
            }
        }

        function compareStepWithProfile(profile) {

            if (profile.type === 'integer') {

                if (isInt(vm.step)) {

                    vm.spinerStatus.enabled = true;
                    vm.spinerStatus.message = null;

                } else {

                    vm.spinerStatus.enabled = false;
                    vm.spinerStatus.message = 'Step does not match asset profile type.';

                }

            } else if (profile.type === 'number') {

                if (typeof(vm.step) === 'number') {

                    vm.spinerStatus.enabled = true;
                    vm.spinerStatus.message = null;

                } else {

                    vm.spinerStatus.enabled = false;
                    vm.spinerStatus.message = 'Step does not match asset profile type.';

                }

            } else {

                vm.spinerStatus.enabled = false;
                vm.spinerStatus.message = 'Asset profile should be integer or number';

            }
        }

        function isInt(value) {

            return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
        }

        function increase() {

            var valueToSend = null;

            if (vm.asset.state && vm.asset.state.value) {

                valueToSend = prepareValue(vm.asset.state.value);

            } else {

                valueToSend = prepareValue(null);

            }

            valueToSend += vm.step;

            publish(valueToSend);

        }

        function decrease() {

            var valueToSend = null;

            if (vm.asset.state && vm.asset.state.value) {

                valueToSend = prepareValue(vm.asset.state.value);

            } else {

                valueToSend = prepareValue(null);

            }

            valueToSend -= vm.step;

            publish(valueToSend);

        }

        function prepareValue(value) {

            var valueToSend = value;

            if (valueToSend === null || valueToSend === undefined) {
                valueToSend = 0;
            }

            if (vm.asset.profile.type === 'integer' && typeof(valueToSend) === 'number') {

                valueToSend = ~~valueToSend;

            }

            return valueToSend;

        }


        function publish(commandValue) {

            if (vm.onChange) {

                vm.onChange({
                    val: commandValue
                });

            }

        }

    }


})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('textControl', textControl);

    textControl.$inject = [];

    function textControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-text><div class=text-content>{{value}} <span class=empty ng-if=\"value === undefined || value === null\"><i>no value to display</i></span></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('textEditorControl', textEditorControl);

    textEditorControl.$inject = [];

    function textEditorControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-text-editor ng-class=\"{disabled: !enabled}\"><textarea ng-model=textValue ng-disabled=!enabled placeholder=\"enter text\"></textarea> <button class=text-editor-control-btn ng-click=sendText(textValue) ng-disabled=!enabled></button></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };
        return directive;

        //////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function(newValue) {
                scope.textValue = newValue;
            });

            scope.sendText = function(value) {

                if (scope.profile.type === 'object') {
                    var object = JSON.parse(value);
                    publishValue(object);
                } else {
                    publishValue(value);
                }

            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('toggleControl', toggleControl);

    toggleControl.$inject = [];

    function toggleControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-toggle ng-class=\"{disabled: !enabled}\"><span class=left-value>{{leftValue}}</span><md-switch aria-label=toggle_control ng-model=toggle ng-click=onClick() ng-disabled=!enabled></md-switch><span class=right-value>{{rightValue}}</span></div>',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            },
            link: linker
        };

        return directive;

        //////////////////////

        function linker(scope, element, attrs) {
            scope.leftValue = false;
            scope.rightValue = true;
            scope.toggle = false;

            scope.$watch('profile', function() {
                if (scope.profile) {
                    if (scope.profile.enum) {
                        scope.leftValue = scope.profile.enum[0];
                        scope.rightValue = scope.profile.enum[1];
                    } else {
                        if (scope.profile.type == 'boolean') {
                            scope.leftValue = false;
                            scope.rightValue = true;
                        }

                        if (scope.profile.type == 'integer') {
                            scope.leftValue = 0;
                            scope.rightValue = scope.value;
                        }
                    }
                }
            });

            scope.$watch('value', function(newValue) {
                if (scope.value == scope.rightValue) {
                    scope.toggle = true;
                } else if (scope.value == scope.leftValue) {
                    scope.toggle = false;
                }
            });

            scope.onClick = function() {
                if (scope.enabled) {
                    if (scope.toggle === true) {
                        publishValue(scope.leftValue);
                    } else if (scope.toggle === false) {
                        publishValue(scope.rightValue);
                    }
                }
            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('ontableControl', ontableControl);

    ontableControl.$inject = ['$interval', 'config'];

    function ontableControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-ontable><div class=indicator ng-class=\"{ ontable: ontable === true }\"><span class=phone></span> <span class=shadow></span></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.ontable = false;

            scope.$watch('value', function(newValue) {

                if (newValue === 'ontable') {

                    scope.ontable = true;

                } else if (newValue === 'notontable') {

                    scope.ontable = false;
                }

            });
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('rotateControl', rotateControl);

    rotateControl.$inject = ['$interval', 'config'];

    function rotateControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-rotation><div class=indicator ng-class=\"{ left: rotateLeft === true, right: rotateLeft === false }\"></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.rotateLeft = null;

            scope.$watch('value', function(newValue) {

                if (newValue === 'rightRotation') {

                    scope.rotateLeft = false;

                } else if (newValue === 'leftRotation') {

                    scope.rotateLeft = true;
                }

            });
        }
    }
}());
(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('shakeControl', shakeControl);

    shakeControl.$inject = ['$interval', 'config'];

    function shakeControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-shake><div class=indicator ng-class=\"{ shaking: shaking === true}\"></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.shaking = false;

            scope.$watch('value', function(newValue) {

                if (newValue === 'shaking') {

                    scope.shaking = true;

                } else if (newValue === 'still') {

                    scope.shaking = false;
                }

            });
        }
    }
}());
