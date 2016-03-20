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
