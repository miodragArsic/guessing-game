(function() {
    'use strict';

    angular
        .module('app')
        .directive('slTabs', slTabs);

    function slTabs() {

        var directive = {

            template: '<div class="tab-panel">' +
                '<ul class="tab-control-header">' +
                ' <li ng-class="{ active:tab.active }" ng-repeat="tab in vm.tabs | orderBy:\'order\' track by $index">' +
                ' <a id="{{tab.name}}" ng-click="vm.select(tab)"><i ng-if="tab.icon" class="{{tab.icon}}"></i><span>{{tab.heading}}</span></a>' +
                ' </li>' +
                '</ul>' +
                '<ng-transclude class="tab-holder">' +
                '</ng-transclude>' +
                '</div>',
            bindToController: true,
            replace: true,
            transclude: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                onTabClick: '&',
                activeTab: '=?'
            }
        };
        return directive;
    }

    Controller.$inject = ['$scope', 'orderByFilter'];

    function Controller($scope, orderByFilter) {

        var vm = this;
        vm.tabs = [];
        vm.activeTab = null;
        vm.select = select;
        vm.selectByName = selectByName;
        vm.addTab = addTab;
        vm.removeTab = removeTab;

        $scope.$watch('vm.activeTab', function(tabName) {
            if (tabName) {
                selectByName(tabName);
            }
        });

        function select(selectedTab) {

            vm.activeTab = selectedTab.name;

            if (vm.onTabClick) {
                vm.onTabClick();
            }
        }

        function selectByName(tabName) {
            angular.forEach(vm.tabs, function(tab) {

                if (tab.name !== tabName) {
                    tab.active = false;
                } else {
                    tab.active = true;
                }
            });
        }

        function addTab(tab) {

            vm.tabs.push(tab);
            if (vm.tabs.length === 1) {
                tab.active = true;
            }

            if (!vm.activeTab) {
                if (vm.tabs.length === 1) {
                    tab.active = true;
                } else {
                    if (tab.order) {
                        selectByName(orderByFilter(vm.tabs, 'order')[0].name);
                    }
                }
            }

        }

        function removeTab(tab) {

            var index = vm.tabs.indexOf(tab);
            if (index !== -1) {

                vm.tabs.splice(index, 1);

                if (tab.active && vm.tabs.length > 0) {
                    vm.tabs[0].active = true;
                }
            }
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('app')
        .directive('slTab', slTab);

    function slTab() {

        var directive = {
            link: link,
            restrict: 'E',
            transclude: true,
            template: '<div role="tabpanel" ng-show="active" ng-transclude></div>',
            require: '^slTabs',
            scope: {
                heading: '@',
                icon: '@',
                name: '@',
                order: '@'
            }
        };
        return directive;

        function link($scope, elem, attr, tabsetCtrl) {

            $scope.active = false;
            tabsetCtrl.addTab($scope);

            $scope.$on('$destroy', function() {
                console.log('destroy tab has been called');
                tabsetCtrl.removeTab($scope);
            });
        }
    }
})();
