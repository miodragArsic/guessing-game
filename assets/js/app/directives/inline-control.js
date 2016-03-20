(function(ng) {
    ng.module('app').directive('inlineControl', [
        '$log',
        '$compile',
        function($log, $compile) {
            function addArrayToElement(array, el) {
                if (array.length > 0 && el) {
                    for (var i = 0; i < array.length; i++) {
                        if (!el.classList.contains(array[i])) {
                            el.classList.add(array[i]);
                        }
                    }
                }
            }

            function removeArrayFromElement(array, el) {
                if (array.length > 0 && el) {
                    for (var i = 0; i < array.length; i++) {
                        if (el.classList.contains(array[i])) {
                            el.classList.remove(array[i]);
                        }
                    }
                }
            }

            function hideChildren(el) {
                var elements = el.querySelectorAll("article");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.display = 'none';
                }
            }

            function showChildren(el) {
                var elements = el.querySelectorAll("article");
                for (var i = 0; i < elements.length; i++) {
                    elements[i].style.display = 'block';
                }
            }

            return {
                restrict: 'E',
                scope: {
                    firstState: '@', // css classes that are always "active" on element
                    secondState: '@', // css classes that are added and removed according to state
                    confirmElementId: '@',
                    confirmAction: '&',
                    declineElementId: '@',
                    declineAction: '&',
                    clearData: '&',
                    state: '=?'
                },

                link: function(scope, element, attrs) {
                    var el = element[0];

                    var firstStateClasses = null;
                    var secondStateClasses = null;
                    scope.state = true;

                    if (scope.firstState) {
                        firstStateClasses = scope.firstState.split(' ');
                    }

                    if (scope.secondState) {
                        secondStateClasses = scope.secondState.split(' ');
                    }

                    if (scope.confirmElementId) {
                        var confirmElement = el.querySelector('#' + scope.confirmElementId);
                        if (confirmElement) {
                            $(confirmElement).on('click', function(e) {
                                scope.confirmAction();
                                e.stopPropagation();
                            });
                        }
                    }

                    if (scope.declineElementId) {
                        var declineElement = el.querySelector('#' + scope.declineElementId);
                        if (declineElement) {
                            $(declineElementId).on('click', function() {
                                scope.declineAction();
                            });
                        }
                    }

                    var inputs = el.querySelectorAll('input');
                    for (var i = 0; i < inputs.length; i++) {
                        $(inputs[i]).click(function(e) {
                            e.stopImmediatePropagation();
                        });
                        $(inputs[i]).keypress(function(e) {
                            if (e.which == 13) {
                                scope.confirmAction();
                            }
                        });
                    }

                    addArrayToElement(firstStateClasses, el);

                    el.addEventListener('click', onClick);

                    function onClick(e) {
                        scope.state = !scope.state;
                        changeState(scope.state);
                    }

                    function firstState() {
                        addArrayToElement(secondStateClasses, el);

                    }

                    function secondState() {
                        removeArrayFromElement(secondStateClasses, el);

                        scope.clearData();
                    }

                    function changeState(newState) {
                        if (!newState) {
                            firstState();
                        } else {
                            secondState();
                        }
                    }

                    scope.$watch('state', function(newState, oldState) {
                        changeState(newState);
                    });

                    scope.$on('$destroy', function() {
                        $(el).off();
                        if (inputs) {
                            for (var i = 0; i < inputs.length; i++) {
                                $(inputs[i]).off();
                            }
                        }
                        if (confirmElement) {
                            $(confirmElement).off();
                        }

                        if (declineElement) {
                            $(declineElement).off();
                        }
                    });
                }
            };
        }
    ]);
}(window.angular));
