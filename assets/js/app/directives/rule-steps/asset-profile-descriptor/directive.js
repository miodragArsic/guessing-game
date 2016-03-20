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
