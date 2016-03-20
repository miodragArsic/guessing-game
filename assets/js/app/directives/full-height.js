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
