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
