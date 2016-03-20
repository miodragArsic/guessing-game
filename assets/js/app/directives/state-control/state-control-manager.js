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
