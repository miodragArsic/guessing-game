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
