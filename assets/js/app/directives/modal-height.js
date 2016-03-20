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
