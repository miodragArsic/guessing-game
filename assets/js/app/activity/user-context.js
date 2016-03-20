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
