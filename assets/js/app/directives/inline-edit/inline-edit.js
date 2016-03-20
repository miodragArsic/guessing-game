(function(ng) {
    ng.module('app').directive('inlineEdit', [
        '$timeout',
        function($timeout) {
            var classes = {
                icon: 'sl-sl-edit',
                activeClass: 'active',
                editButton: 'inline-edit-rename-button',
                editIndicator: 'inline-edit-indicator'
            };

            return {
                restrict: 'E',
                scope: {
                    value: '=',
                    confirmAction: '&',
                    isEnabled: '='
                },
                templateUrl: '/assets/js/app/directives/inline-edit/view.html',

                link: function(scope, element, attrs) {
                    var el = element[0];

                    var oldValue = null;
                    var saved = false;

                    scope.inputDisabled = true;

                    var editButton = el.querySelector('.' + classes.editButton);
                    var editIndicator = el.querySelector('.' + classes.editIndicator);
                    var input = el.querySelector('input');

                    if (editButton) {
                        $(editButton).mousedown(editButtonClick);
                    }

                    if (input) {
                        $(input).click(function() {
                            scope.inputDisabled = false;
                            focus();
                        });

                        $(input).focusout(function(e) {
                            unfocus();
                        });

                        $(input).keypress(function(e) {
                            if (e.which == 13) {
                                editButtonClick();
                            }
                        });
                    }

                    function focus() {
                        saved = false;

                        scope.$apply(function() {
                            scope.inputDisabled = false;
                        });

                        if (editButton) {
                            editButton.classList.add(classes.activeClass);
                        }

                        if (input) {
                            $timeout(function() {
                                oldValue = $(input).val();
                                len = oldValue.length * 2;

                                $(input).focus();

                               // input.setSelectionRange(len, len);

                            }, 1);
                        }
                    }

                    function save() {
                        saved = true;
                        scope.confirmAction();
                    }

                    function unfocus() {
                        if (editButton) {
                            editButton.classList.remove(classes.activeClass);
                        }

                        if (input && !saved) {
                            $(input).val(oldValue);
                        }

                        scope.$apply(function() {
                            scope.inputDisabled = true;
                        });
                    }

                    function editButtonClick() {
                        if (scope.inputDisabled) {
                            focus();
                        } else {
                            save();
                            unfocus();
                        }
                    }

                    scope.$watch('isEnabled', function(newValue, oldValue) {
                        if (newValue) {
                            if (editButton) {
                                editButton.style.visibility = 'visible';
                            }
                            if (editIndicator) {
                                editIndicator.style.visibility = 'visible';
                            }

                            if (input) {
                                $(input).prop('disabled', false);
                            }
                        } else {
                            if (editButton) {
                                editButton.style.visibility = 'hidden';
                            }
                            if (editIndicator) {
                                editIndicator.style.visibility = 'hidden';
                            }

                            if (input) {
                                $(input).prop('disabled', true);
                            }
                        }
                    });

                    scope.$on('$destroy', function() {
                        $(el).off();

                        if (editButton) {
                            $(editButton).off();
                        }

                        if (input) {
                            $(input).off();
                        }
                    });
                }
            };
        }
    ]);
}(window.angular));
