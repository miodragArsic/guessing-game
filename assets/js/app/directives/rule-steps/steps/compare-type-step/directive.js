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
