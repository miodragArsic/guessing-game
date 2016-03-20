(function (ng) {
    ng.module('app').directive('tabControl', [
        '$log',

        function ($log) {
            function createTabs(tabs, parent) {
                var elements = [];

                ng.forEach(tabs, function (tab, index) {
                    var el = document.createElement('div');
                    el.classList.add('tab-button');

                    if (index == 0) {
                        el.classList.add('active');
                        tab.style.display = '';
                    }
                    else {
                        tab.style.display = 'none';
                    }
                    el.innerHTML = tab.getAttribute('name');
                    parent.appendChild(el);
                    elements.push(el);
                });

                return elements;
            }

            function switchTo(index, tabButtons, tabs) {
                ng.forEach(tabButtons, function (button, i) {
                    if (i != index) {
                        if (button.classList.contains('active')) {
                            button.classList.remove('active');

                        }
                        tabs[i].style.display = 'none';
                    } else {
                        if (!button.classList.contains('active')) {
                            button.classList.add('active');
                            tabs[i].style.display = '';
                        }
                    }
                });
            }

            return {
                restrict: 'E',
                scope: {
                    onTabClick: '&',
                    activeTab: '='
                },
                link: function (scope, element, attrs) {
                    var el = element[0];

                    var tabs = el.querySelectorAll('tab-child');

                    var tabButtonsParent = el.querySelector('tab-control-header');
                    var tabButtons = createTabs(tabs, tabButtonsParent);

                    ng.forEach(tabButtons, function (button, index) {
                        $(button).click(function (e) {
                            scope.$apply(function () {
                                scope.activeTab = index;
                            });
                        });
                    });

                    scope.$watch('activeTab', function (cur, prev) {
                        switchTo(cur, tabButtons, tabs);
                        scope.onTabClick();
                    });
                }
            }
        }
    ]);
}(window.angular));
