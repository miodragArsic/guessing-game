(function(ng) {
        ng.module('app').directive('counterInput', [
            '$rootScope',
            function($rootScope) {
                return {
                    restrict: 'A',
                    scope: {
                        time: '='
                    },
                    link: function(scope, element) {
                        var el = element[0];
                        var ch = element.children();
                        var height = element.height();
                        var value = element.children().height();
                        var identifyClass = 'this';

                        scope.$watch('time', function() {
                                for (var i = 0; i < ch.length; i++) {
                                    var oneElement = ch[i];
                                    if ($(ch[i]).hasClass(identifyClass)) {
                                        $(ch[i]).removeClass(identifyClass);
                                    };
                                    if (ch[i].getAttribute('data-value') == scope.time) {
                                        $(ch[i]).addClass(identifyClass);
                                        var position = (i - 1) * value;
                                        var newPosition = position + value;
                                        el.style.top = '-' + newPosition + 'px';
                                        break;
                                    }
                                }
                            }
                        );



                    function resetCounterTop() {
                        el.style.top = '0px';
                        ch.removeClass(identifyClass);
                        ch.first().addClass(identifyClass);
                        scope.$apply(function() {
                            scope.time = ch.first().attr("data-value");

                        });
                    }

                    function resetCounterBottom() {
                        el.style.top = '-' + (height - value) + 'px';
                        ch.removeClass(identifyClass);
                        ch.last().addClass(identifyClass);
                        scope.$apply(function() {
                            scope.time = ch.last().attr("data-value");

                        });
                    }

                    function countForward() {
                        var current = element.find('.' + identifyClass + '');
                        scope.$apply(function() {
                            scope.time = current.next().attr("data-value");

                        });

                        var index = current.index();
                        var currentPosition = index * value;
                        var move = currentPosition + value;

                        function animateCountForward() {
                            el.style.top = '-' + move + 'px';
                            current.removeClass(identifyClass);
                            current.next().addClass(identifyClass);
                        }

                        if (move < height) {
                            animateCountForward();
                        } else {
                            resetCounterTop();
                        }

                    }

                    function countBack() {
                        var current = element.find('.' + identifyClass + '');
                        scope.$apply(function() {
                            scope.time = current.prev().attr("data-value");

                        });
                        var index = current.index();
                        var currentPosition = index * value;
                        var move = currentPosition - value;

                        function animateCountBack() {
                            el.style.top = '-' + move + 'px';
                            current.removeClass(identifyClass);
                            current.prev().addClass(identifyClass);
                        }

                        if (move >= 0) {
                            animateCountBack();
                        } else {
                            resetCounterBottom();
                        }

                    }

                    ng.element(ch).on('click', function() {
                        value = element.children().height();
                        height = element.height();
                        countForward();
                    });
                    ng.element(ch).on('mousewheel', function(e, direction) {
                        value = element.children().height();
                        height = element.height();
                        if (direction < 0) {
                            countForward();
                        } else {
                            countBack();
                        }
                        e.preventDefault()
                    });
                }
            };
        }]);
}(window.angular));