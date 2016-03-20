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
