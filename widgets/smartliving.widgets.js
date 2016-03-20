/*!
 * Smartliving Widgets for Angular
 * https://github.com/allthingstalsk/smartliving-widgets
 * @license MIT
 * v0.7
 */


if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

(function() {
    'use strict';

    angular.module('ngSmartlivingWidgets', [
        'ngAnimate',
        'ui.select',
        'ngMaterial',
        'ui.knob',
        'jsonFormatter',
        'angularSpectrumColorpicker',
        'leaflet-directive',
        'nvd3',
        'ngTouch'
    ]);
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .factory('widgetsCommon', factory);

    factory.$inject = [];

    function factory() {
        var defaultControls = {
            boolean: {
                sensor: function(assetProfile) {
                    return 'onoff';
                },

                actuator: function(assetProfile) {
                    return 'toggle';
                },

                virtual: function(assetProfile) {
                    return 'onoff';
                },

                config: function(assetProfile) {
                    return 'onoff';
                }
            },
            string: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    return 'input';
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            integer: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    if ((assetProfile.minimum || assetProfile.minimum === 0) && (assetProfile.maximum || assetProfile.maximum === 0)) {
                        return 'slider';
                    } else {
                        return 'input';
                    }
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            number: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    if ((assetProfile.minimum || assetProfile.minimum === 0) && (assetProfile.maximum || assetProfile.maximum === 0)) {
                        return 'slider';
                    } else {
                        return 'input';
                    }
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            },
            object: {
                sensor: function(assetProfile) {
                    return 'json';
                },

                actuator: function(assetProfile) {
                    return 'text-editor';
                },

                virtual: function(assetProfile) {
                    return 'json';
                },

                config: function(assetProfile) {
                    return 'json';
                }
            },
            default: {
                sensor: function(assetProfile) {
                    return 'label';
                },

                actuator: function(assetProfile) {
                    return 'input';
                },

                virtual: function(assetProfile) {
                    return 'label';
                },

                config: function(assetProfile) {
                    return 'label';
                }
            }
        };

        var service = {
            findDefaultControl: findDefaultControl
        };
        return service;

        ////////////////

        function findDefaultControl(asset) {

            var control = null;
            var config = defaultControls[asset.profile.type];

            if (!config) {
                config = defaultControls['default'];
            }

            control = config[asset.is](asset.profile);

            return control;
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .factory('config', factory);

    factory.$inject = [];

    function factory() {

        var config = {
            defaultMinimum: 0,
            defaultMaximum: 100,
            outOfBoundsMessage: 'Value is out of bounds. To see {0} control adjust the bounds in asset profile.',
            invalidBoundsMessage: 'Minimum bound is greater than maximum bound. Check asset profile.'
        };
        return config;
    }
})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('dynamicControl', dynamicControl);

    dynamicControl.$inject = ['$compile', 'widgetsCommon'];

    function dynamicControl($compile, widgetsCommon) {

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                asset: '=',
                onChange: '&',
                enabled: '=',
                configuration: '='
            }
        };

        return directive;

        ///////////////////////////

        function getControl(asset) {

            var controlName = null;

            if (asset.control) {
                if (typeof(asset.control) == 'object' && asset.control.name) {
                    controlName = asset.control.name;
                } else if (typeof(asset.control) == 'string') {
                    controlName = asset.control;
                }
            }

            if (!controlName) {
                controlName = widgetsCommon.findDefaultControl(asset);
            }

            return controlName;
        }

        function generateTemplate(controlName) {

            var template = '<{0}-control value="asset.state.value" profile="asset.profile" id="asset.id" on-change="publish(val)" enabled="enabled" asset="asset" configuration="configuration"></{0}-control>'.format(controlName);

            return template;
        }

        function linker(scope, element, attrs) {

            scope.$watch('asset', function(newAsset) {

                if (scope.asset) {

                    var controlName = getControl(scope.asset);

                    element.html(generateTemplate(controlName));

                    $compile(element.contents())(scope);
                }
            });

            scope.publish = function(val) {
                if (scope.onChange) {
                    scope.onChange({
                        val: val
                    });
                }
            };

        }

    }
})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('assetChart', assetChart);

    var _defaultLoadFrom = 'past-24h';
    var _chartRefreshRate = 1000;

    function assetChart() {

        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            template: '<div class=chart width-change-detect><nvd3 ng-class="{zoom: vm.hovered}" class=linechart data=vm.chartData options=vm.options id=linechart></nvd3></div>',
            restrict: 'E',
            scope: {
                assets: '=',
                config: '='
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope', '$rootScope', '$q', '$interval', 'history.service'];

    function Controller($scope, $rootScope, $q, $interval, historyService) {

        var vm = this;
        vm.colors = d3.scale.ordinal().range(['#56646D', '#2670E0', '#25C2D5', '#43C399', '#A8C14D', '#F4C45B', '#FF855A', '#FF6458', '#ED4D73', '#9068C8']);

        vm.redrawTrigger = false;

        // Data for chart. Every object in array must contain { values: [ {x: ,y: }, {x: ,y: }, ...]}
        vm.chartData = [{
            values: [{
                x: 0,
                y: 0
            }]
        }];

        vm.data = [];

        vm.assetHistories = [];
        vm.configAssets = [];

        vm.hovered = false;

        var realTimeInterval;

        activate();

        //////////////////////////////////////////

        function activate() {

            $scope.$watchCollection('vm.assets', initializeHistory);

            $scope.$watch('vm.config.refreshChart', function(newValue, oldValue) {
                if (newValue === true) {
                    initializeHistory();
                    vm.config.refreshChart = false;
                }
            });

            $scope.$watch('__width', function(newWidth, oldWidth) {

                //alert('detected!' + newWidth);
                if (!!newWidth) {
                    vm.redrawTrigger = !vm.redrawTrigger;
                }

            });

            $scope.$watch('vm.config.timeScale', function(newValue, oldValue) {

                if (newValue === '60m') {
                    if (angular.isDefined(realTimeInterval)) {
                        return;
                    }

                    realTimeInterval = $interval(initializeHistory, 60000);

                } else {

                    destroyTimer();

                }

            });

            $scope.$on('destroy', function() {

                destroyTimer();

            });

        }

        function destroyTimer() {
            if (angular.isDefined(realTimeInterval)) {
                $interval.cancel(realTimeInterval);
                realTimeInterval = undefined;
            }
        }

        function initializeHistory() {

            vm.data = [];

            if (vm.config === null || vm.config === undefined) {

                if (vm.assets.length === 1) {

                    var tempAsset = vm.assets[0];

                    if (tempAsset.control) {

                        if (tempAsset.control.extras) {

                            vm.config = tempAsset.control.extras;
                        } else {

                            vm.config = {

                                type: 'line-chart',
                                timeScale: '60m'

                            };
                        }
                    }
                }
            }

            var timeSet = null;

            if (vm.config.type === 'bar-chart') {

                vm.options = generateBarChartOptions();

            } else if (vm.config.type === 'line-chart') {

                vm.options = generateLineChartOptions();

            } else if (vm.config.type === 'area-range-chart') {

                vm.options = generateAreaRangeChartOptions();

            }

            if (vm.config.timeScale) {

                timeSet = generateTimeSet(vm.config.timeScale, vm.config.page);

            } else {

                timeSet = generateTimeSet('60m', vm.config.page);

            }

            if (vm.assets && vm.assets.length) {

                var historyDataPromises = [];

                for (var i = 0; i < vm.assets.length; i++) {

                    var asset = null;

                    if (vm.assets[i]._showAsset) {

                        asset = vm.assets[i];

                        if (asset.is !== 'config') {
                            var promise = historyService.getAssetHistory(asset.id, timeSet.from, timeSet.to, timeSet.resolution)
                                .then(getHistoryLoadedHandler(asset));

                            historyDataPromises
                                .push(promise);
                        } else {
                            vm.configAssets.push(asset);
                        }

                    }
                }

                $q.all(historyDataPromises)
                    .then(function() {
                        for (var i = 0; i < vm.configAssets.length; i++) {
                            var asset = vm.configAssets[i];

                            constantDataMapper(asset, vm.assetHistories);
                        }

                        vm.configAssets = [];
                        vm.assetHistories = [];

                        vm.chartData = angular.copy(vm.data);
                    });
            }
        }

        function generateTimeSet(time, page) {

            var timeSet = {
                from: null,
                to: null,
                resolution: null
            };

            if (page === null || page === undefined) {

                page = 0;
            }

            var frameStart = null;
            var frameEnd = null;

            if (time === '30d') {

                frameStart = 30 * (page + 1);
                frameEnd = 30 * page;

                timeSet.resolution = 'day';

                timeSet.from = moment().subtract(frameStart, 'days');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'days');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '7d') {

                frameStart = 7 * (page + 1);
                frameEnd = 7 * page;

                timeSet.resolution = 'hour';

                timeSet.from = moment().subtract(frameStart, 'days');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'days');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '24h') {

                frameStart = 24 * (page + 1);
                frameEnd = 24 * page;

                timeSet.resolution = 'minute';

                timeSet.from = moment().subtract(frameStart, 'hours');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'hours');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            if (time === '60m') {

                frameStart = 60 * (page + 1);
                frameEnd = 60 * page;

                timeSet.resolution = 'minute';

                timeSet.from = moment().subtract(frameStart, 'minutes');

                timeSet.from = timeSet.from.format();

                vm.config.from = timeSet.from;

                timeSet.to = moment().subtract(frameEnd, 'minutes');

                timeSet.to = timeSet.to.format();

                vm.config.to = timeSet.to;

            }

            return timeSet;
        }

        function getHistoryLoadedHandler(asset) {

            return function(history) {

                if (vm.config.type === 'area-range-chart') {

                    vm.assetHistories.push(history);

                    areaRangeDataMapper(history, asset);

                } else {

                    vm.assetHistories.push(history);

                    dataMapper(history, asset, 'average');

                }

            };
        }

        function generateLineChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.type = 'lineChart';
            options.chart.useInteractiveGuideline = false;
            options.chart.interpolate = 'monotone';
            options.chart.pointSize = 10;
            options.chart.duration = 0;

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {
                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis = {
                tickFormat: function(d) {

                    return d3.format(',.1f')(d);
                }
            };

            options.chart.showLegend = false;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.lines = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            return options;

        }

        function generateBarChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {
                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.duration = 0;

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis1 = {
                tickFormat: function(d) {
                    if (!isNaN(d)) {
                        return d3.format(',.1f')(d);
                    }
                }
            };

            options.chart.showLegend = false;
            options.chart.stacked = true;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.bars1 = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            options.chart.type = 'multiChart';
            options.chart.showControls = false;

            return options;
        }

        function generateAreaRangeChartOptions() {

            var options = {
                chart: {}
            };

            options.chart.type = 'lineChart';
            options.chart.useInteractiveGuideline = false;
            options.chart.interpolate = 'monotone';
            options.chart.pointSize = 10;
            options.chart.duration = 0;

            options.chart.x = function(d) {
                return d.x;
            };

            options.chart.y = function(d) {

                if (d.y === null) {
                    return d.y;
                }

                return Math.round(d.y * 100) / 100;
            };

            options.chart.xAxis = {
                tickFormat: tickFormater,
                tickValues: tickValues
            };

            options.chart.yAxis = {
                tickFormat: function(d) {

                    return d3.format(',.1f')(d);
                }
            };

            options.chart.showLegend = false;
            options.chart.margin = {
                top: 40,
                left: 40,
                right: 40,
                bottom: 40
            };

            options.chart.lines = {
                dispatch: {

                    elementClick: function(e) {

                        clickHandler(e);

                    },

                    elementMouseover: hoverEvent

                }
            };

            return options;

        }

        function clickHandler(event) {

            var timeToZoom = null;
            var page = 0;

            if (event.data && event.data.x !== null) {

                timeToZoom = event.data.x;

            } else if (event.length && event.length > 0) {

                timeToZoom = event[0].point.x;

            } else {

                timeToZoom = event.point.x;

            }

            if (vm.config.timeScale === '30d') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'days');

                vm.config.timeScale = '24h';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;

            }

            if (vm.config.timeScale === '7d') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'days');

                vm.config.timeScale = '24h';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;
            }

            if (vm.config.timeScale === '24h') {

                vm.config.page = moment(new Date()).diff(timeToZoom, 'hours');

                vm.config.timeScale = '60m';

                $rootScope.$broadcast('timeScaleUpdated', vm.config.timeScale);

                initializeHistory();

                return;
            }


        }

        function hoverEvent(e) {

            if (vm.config.timeScale === '60m') {
                vm.hovered = false;
            } else {
                vm.hovered = true;
            }

        }

        function tickFormater(d) {
            if (vm.config.timeScale === '7d') {

                var daysDate = new Date(d);
                return d3.time.format('%A')(daysDate);

            } else if (vm.config.timeScale === '30d') {

                var monthDate = new Date(d);

                return d3.time.format('%d %b')(monthDate);

            } else {
                var hoursDate = new Date(d);
                return d3.time.format('%H:%M')(hoursDate);
            }
        }

        function tickValues(d) {

            var firstTime = d[0].values[0].x;
            var size = d[0].values.length;
            var lastTime = d[0].values[size - 1].x;
            var timeFormat = null;

            if (vm.config.timeScale === '60m') {
                timeFormat = d3.time.minute.range(new Date(firstTime), new Date(lastTime), 10);
            }

            if (vm.config.timeScale === '24h') {
                timeFormat = d3.time.hour.range(new Date(firstTime), new Date(lastTime), 4);
            }

            if (vm.config.timeScale === '7d') {
                timeFormat = d3.time.day.range(new Date(firstTime), new Date(lastTime), 1);
            }

            if (vm.config.timeScale === '30d') {

                timeFormat = d3.time.day.range(new Date(firstTime), new Date(lastTime), 4);
            }

            return timeFormat;

        }

        function addData(series, time, value) {

            var d = {
                x: time,
                y: value
            };
            series.values.push(d);
        }

        function dataMapper(history, asset, dataPoint) {

            var series = {
                values: [],
                key: asset.title
            };

            for (var i = 0; i < history.data.length; i++) {

                var hd = history.data[i];

                if (hd.data) {
                    if (!dataPoint) {
                        addData(series, new Date(hd.at), hd.data.avg);
                    }

                    if (dataPoint === 'average') {
                        addData(series, new Date(hd.at), hd.data.avg);
                    }

                    if (dataPoint === 'minimum') {
                        addData(series, new Date(hd.at), hd.data.min);
                    }

                    if (dataPoint === 'maximum') {
                        addData(series, new Date(hd.at), hd.data.max);
                    }

                } else {
                    addData(series, new Date(hd.at), null);
                }
            }

            if (asset._assetColor) {
                series.color = asset._assetColor;
            } else {
                series.color = vm.colors(0);
            }

            series.values = sortData(series.values);

            if (vm.config.type === 'bar-chart') {

                series.type = 'bar';
                series.yAxis = 1;

            }

            vm.data.push(series);
        }

        function constantDataMapper(asset, assetHistories) {

            var series = {
                values: [],
                key: asset.title
            };

            var numberOfPoints = 0;
            var timeFormat = 'h';

            if (vm.config.timeScale === '60m') {
                numberOfPoints = 60;
                timeFormat = 'm';
            }

            if (vm.config.timeScale === '24h') {
                numberOfPoints = 24;
            }

            if (vm.config.timeScale === '7d') {
                numberOfPoints = 7;
                timeFormat = 'd';
            }

            if (vm.config.timeScale === '30d') {

                numberOfPoints = 30;
                timeFormat = 'd';

            }

            if (assetHistories.length > 0) {

                var history = assetHistories[0].data;

                for (var i = 0; i < history.length; i++) {

                    if (asset.state && asset.state.value) {
                        addData(series, new Date(history[i].at), asset.state.value);
                    } else {
                        addData(series, new Date(history[i].at), null);
                    }

                }

            } else {
                for (var j = 0; j < numberOfPoints; j++) {

                    var time = moment().subtract(j, timeFormat);

                    if (asset.state && asset.state.value) {
                        addData(series, time, asset.state.value);
                    } else {
                        addData(series, time, null);
                    }

                }
            }

            if (asset._assetColor) {
                series.color = asset._assetColor;
            } else {
                series.color = vm.colors(0);
            }

            series.values = sortData(series.values);

            if (vm.config.type === 'bar-chart') {

                series.type = 'line';
                series.yAxis = 1;

            }

            vm.data.push(series);
        }

        function areaRangeDataMapper(history, asset) {

            var series1 = {
                values: [],
                key: asset.title + ' Maximum'
            };

            var series2 = {
                values: [],
                key: asset.title + ' Average'
            };

            var series3 = {
                values: [],
                key: asset.title + ' Minimum'
            };

            for (var i = 0; i < history.data.length; i++) {

                var hd = history.data[i];

                if (hd.data) {

                    addData(series1, new Date(hd.at), hd.data.max);
                    addData(series2, new Date(hd.at), hd.data.avg);
                    addData(series3, new Date(hd.at), hd.data.min);

                } else {
                    addData(series1, new Date(hd.at), null);
                    addData(series2, new Date(hd.at), null);
                    addData(series3, new Date(hd.at), null);
                }
            }

            if (asset._assetColor) {
                series1.color = asset._assetColor;
                series2.color = asset._assetColor;
                series3.color = asset._assetColor;
            } else {

                series1.color = vm.colors(0);
                series2.color = vm.colors(0);
                series3.color = vm.colors(0);

            }

            series1.values = sortData(series1.values);
            series2.values = sortData(series2.values);
            series3.values = sortData(series3.values);

            series1.classed = 'dashed';
            series2.strokeWidth = 2;
            series3.classed = 'dashed';

            vm.data.push(series1);
            vm.data.push(series2);
            vm.data.push(series3);

        }

        function sortData(array) {
            array.sort(function(a, b) {
                var keyA = a.x;
                var keyB = b.x;
                var result = 0;

                if (keyA < keyB) {
                    result = -1;
                }
                if (keyA > keyB) {
                    result = 1;
                }
                return result;

            });
            return array;
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('chartControl', chartControl);

    function chartControl() {

        var directive = {
            template: '<asset-chart assets=assets config=configuration></asset-chart>',
            link: link,
            restrict: 'E',
            scope: {
                asset: '='
            }
        };

        return directive;

        function link(scope, element, attrs) {

            scope.assets = [];

            scope.$watch('asset', function() {

                scope.assets = [];

                scope.asset._showAsset = true;

                scope.assets.push(scope.asset);

            });

        }
    }

})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('circleProgressControl', circleProgressControl);

    circleProgressControl.$inject = ['config'];

    function circleProgressControl(config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-knob ng-if=!blocked><knob knob-data=value knob-options=options data-width=229 data-height=229></knob><span class=knob-unit>{{profile.unit}}</span></div><div class=control-fallback ng-if=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Circle progress');
            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            scope.blocked = null;

            scope.options = {
                readOnly: true,
                thickness: 0.30,
                min: config.defaultMinimum,
                max: config.defaultMaximum,
                step: 1,
                displayPrevious: true,
                angleOffset: 180,
                font: '',
                fontWeight: 900,
                fontSize: 50,
                inputColor: '#55636c',
                fgColor: 'transparent',
                bgColor: 'transparent',
                lineCap: 'round',
                draw: function() {

                    var e = this.i;
                    var l = e.val().length;
                    var w = e.width();
                    var c;
                    var a;
                    var fontSize;

                    var foregroundCircleStroke;
                    var foregroundCircleFill;
                    var backgroundCircleSize;

                    c = this.g; // context
                    a = this.arc(this.cv); // Arc

                    if (typeof window.orientation == 'undefined' || window.innerWidth > 750) {
                        foregroundCircleFill = 16;
                        foregroundCircleStroke = 20;
                        backgroundCircleSize = 2;
                    } else {
                        foregroundCircleStroke = 50;
                        foregroundCircleFill = 38;
                        backgroundCircleSize = 6;
                    }

                    //draw background circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, 0, 2 * Math.PI, false);
                    c.strokeStyle = '#55636c';
                    c.lineWidth = backgroundCircleSize;
                    c.stroke();

                    //draw foreground fill circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#55636c';
                    c.lineCap = 'square';
                    c.lineWidth = foregroundCircleStroke;
                    c.stroke();

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#f0f0f0';
                    c.lineCap = '';
                    c.lineWidth = foregroundCircleFill;
                    c.stroke();

                    if (scope.value === undefined || scope.value === null) {
                        e.val('no value');
                    }

                    if (l < 8) {
                        fontSize = '35px';
                    } else {
                        fontSize = w / l * 2.3;
                    }

                    e.css({
                        'height': fontSize,
                        'line-height': fontSize,
                        'font-size': fontSize,
                        'margin-top': '90px',
                        'width': '173px',
                        'margin-left': '-202px'
                    });
                }
            };

            scope.$watch('value', function() {

                if (scope.value < scope.options.min || scope.value > scope.options.max) {
                    scope.blocked = true;
                    scope.message = assetValueOutOfBoundsMessage;
                } else {
                    scope.blocked = false;
                }
            });

            scope.$watch('profile', function() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {
                        scope.options.min = scope.profile.minimum;
                        scope.options.max = scope.profile.maximum;
                    } else {
                        scope.options.min = config.defaultMinimum;
                        scope.options.max = config.defaultMaximum;
                    }

                    if (scope.options.min > scope.options.max) {
                        scope.message = invalidMinMaxConfigurationMessage;
                    }

                    //value is out of bounds
                    if (scope.options.min > scope.value || scope.options.max < scope.value) {
                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;
                    } else {
                        scope.blocked = false;
                    }

                    if (scope.profile.type == 'number') {
                        scope.options.step = 0.1;
                    }
                }
            });
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('colorControl', colorControl);

    function colorControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-color><svg version=1.1 id=Layer_1 xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink x=0px y=0px width=150px height=150px viewbox=\"75 0 150 150\" enable-background=\"new 75 0 150 150\" xml:space=preserve><path fill=#EDEDED d=\"M150,0c-41.421,0-75,33.579-75,75c0,0.377,0.023,0.749,0.028,1.124C75.021,76.219,75,76.31,75,76.406v69.771 c0,2.111,1.712,3.823,3.823,3.823h69.771c0.097,0,0.187-0.021,0.282-0.028c0.376,0.006,0.747,0.028,1.124,0.028 c41.421,0,75-33.579,75-75C225,33.579,191.421,0,150,0z M88.62,143.999c-4.208,0-7.62-3.412-7.62-7.62c0-4.208,3.412-7.62,7.62-7.62 c4.208,0,7.62,3.412,7.62,7.62C96.24,140.588,92.829,143.999,88.62,143.999z\"></path><circle id=colorsvgtwo fill=#25E8A2 cx=150 cy=75 r=56.826></circle><path opacity=0.06 d=\"M150,16.141c32.507,0,58.859,26.352,58.859,58.859S182.507,133.859,150,133.859S91.141,107.507,91.141,75 S117.493,16.141,150,16.141z M101.917,75c0,26.556,21.528,48.083,48.083,48.083S198.083,101.556,198.083,75 S176.556,26.917,150,26.917S101.917,48.444,101.917,75z\"></path></svg></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };
        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function() {
                if (typeof(scope.value) === 'object') {
                    if (scope.value.r !== null && scope.value.g !== null && scope.value.b !== null) {
                        var hexRed = scope.value.r.toString(16);
                        hexRed = normaliseHex(hexRed);
                        var hexGreen = scope.value.g.toString(16);
                        hexGreen = normaliseHex(hexGreen);
                        var hexBlue = scope.value.b.toString(16);
                        hexBlue = normaliseHex(hexBlue);
                        scope.color = '#' + hexRed + hexGreen + hexBlue;

                        var element = $('#colorsvgtwo');
                        element.attr('fill', scope.color);
                    }
                } else if (typeof(scope.value) === 'string') {
                    if (isHexColor(scope.value)) {
                        var colorsvg = $('#colorsvgtwo');
                        colorsvg.attr('fill', scope.value);
                    }
                }
            });

            function isHexColor(colorString) {
                if (colorString[0] === '#') {
                    if (colorString.length === 7 || colorString.length === 4) {
                        var validationString = new RegExp('^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$');
                        return validationString.test(colorString);
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            function normaliseHex(hexValue) {
                if (hexValue.length == 1) {
                    var normalisedValue = '0' + hexValue;
                    return normalisedValue;
                } else {
                    return hexValue;
                }
            }
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('colorPickerControl', colorPickerControl);

    colorPickerControl.$inject = [];

    function colorPickerControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=color-picker-disabler ng-if=!enabled></div><div class=control-color-picker ng-if=mode ng-class=\"{disabled: !enabled}\"><spectrum-colorpicker on-change=colorChange(color) ng-model=color on-move=onMove(color) options=\"{ showInput: true, preferredFormat:\'rgb\', flat: true, chooseText: \'\' }\"></spectrum-colorpicker></div><div class=control-color-picker ng-if=!mode><spectrum-colorpicker on-change=colorChange(color) ng-model=color on-move=onMove(color) options=\"{ showInput: true, preferredFormat:\'hex\', flat: true, chooseText: \'\' }\"></spectrum-colorpicker></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var defaultState = 'rgb(0,0,0)';

            scope.firstTimePass = false;

            function prepareValue(valueObject) {

                if (valueObject === null || valueObject === undefined) {

                    return defaultState;

                }

                if (valueObject.r !== null && valueObject.g !== null && valueObject.b !== null) {

                    var rgbString = 'rgb(' + valueObject.r + ',' + valueObject.g + ',' + valueObject.b + ')';

                    return rgbString;

                } else if (isHexColor(valueObject)) {

                    return valueObject;

                } else {

                    return defaultState;

                }
            }

            scope.colorChange = function(color) {

                if (scope.firstTimePass) {

                    var rgb = colorToObject(color);

                    if (scope.profile.type === 'object' && (typeof rgb === 'object')) {

                        if (!scope.value || rgb.r !== scope.value.r || rgb.g !== scope.value.g || rgb.b !== scope.value.b) {

                            publishValue(rgb);

                        }

                    } else if (scope.profile.type === 'string' && (typeof color === 'string')) {

                        if (color !== scope.value) {

                            publishValue(color);

                        }

                    }
                } else {

                    scope.firstTimePass = true;

                }
            };

            scope.onMove = function(color) {

                element.find('.spectrum-color-preview').css({
                    'background-color': color
                });

            };

            scope.$watch('value', function() {

                scope.color = prepareValue(scope.value);

                element.find('.spectrum-initialColor-preview, .spectrum-color-preview').css({
                    'background-color': scope.color
                });

            });

            scope.$watch('profile', function() {

                if (scope.profile) {

                    if (scope.profile.type === 'object') {

                        scope.mode = true;

                    } else if (scope.profile.type === 'string') {

                        scope.mode = false;

                    }
                }
            });

            function colorToObject(color) {

                var colorString = color.slice(4, color.length);
                colorString = colorString.substring(0, colorString.length - 1);
                var colorValues = colorString.split(',');
                var red = colorValues[0].replace(' ', '');
                var green = colorValues[1].replace(' ', '');
                var blue = colorValues[2].replace(' ', '');
                var colorObject = {};
                colorObject.r = parseInt(red);
                colorObject.g = parseInt(green);
                colorObject.b = parseInt(blue);

                return colorObject;
            }

            function isHexColor(colorString) {

                if (colorString[0] === '#') {

                    if (colorString.length === 7 || colorString.length === 4) {

                        var validationString = new RegExp('^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$');

                        return validationString.test(colorString);

                    } else {

                        return false;

                    }
                } else {

                    return false;

                }
            }

            function publishValue(value) {

                if (scope.enabled) {

                    if (scope.onChange) {

                        scope.onChange({
                            val: value
                        });

                    }
                }
            }
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('labelControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-label ng-class=\"{\'no-color\' : vm.currentColor == undefined || vm.currentColor == null || vm.currentColor == vm.defaultColor}\"><label style=background-color:{{vm.currentColor}}><span ng-if=\"vm.value !== undefined && vm.value !== null\">{{vm.currentLabel}}</span> <span class=empty ng-if=\"vm.value === undefined || vm.value === null\"><i>no value</i></span><aside style=\"border-color:{{vm.currentColor}} transparent transparent transparent\"></aside></label></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                profile: '=',
                asset: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

    }

    var DEFAULT_COLOR = '#ffffff';
    var DEFAULT_LABEL = 'no value';

    Controller.$inject = ['$scope'];

    function Controller($scope) {

        var vm = this;

        vm.options = [];

        vm.currentColor = null;

        vm.defaultColor = DEFAULT_COLOR;

        vm.currentLabel = null;

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.value', valueWatcher);

        function controlWatcher(controlSettings) {

            var options = extractValues(controlSettings);

            extractColors(options, controlSettings);

            extractLabels(options, controlSettings);

            vm.options = options;
        }

        function valueWatcher(newValue) {

            var foundOption = null;

            angular.forEach(vm.options, function(option) {

                if (option.value === newValue) {

                    foundOption = option;

                }

            });

            if (foundOption) {

                vm.currentLabel = foundOption.label;

                vm.currentColor = foundOption.color;

            } else {

                vm.currentLabel = newValue;

                vm.currentColor = DEFAULT_COLOR;

            }
        }

        function extractValues(controlSettings) {

            var options = [];

            if (controlSettings && controlSettings.extras && controlSettings.extras.values) {

                angular.forEach(controlSettings.extras.values, function(option) {

                    options.push({
                        value: option
                    });

                });

            }

            return options;
        }

        function extractColors(options, controlSettings) {

            if (!controlSettings) {

                return;

            }

            angular.forEach(options, function(option, index) {

                //first, read from settings.[optionValue], as this is priority
                if (controlSettings.extras[option.value]) {

                    option.color = controlSettings.extras[option.value];

                    return;

                }

                if (!controlSettings.extras.colors) {

                    option.color = DEFAULT_COLOR;

                    return;

                }

                if (typeof controlSettings.extras.colors[index] === 'undefined') {

                    option.color = DEFAULT_COLOR;

                    return;

                }

                option.color = controlSettings.extras.colors[index];

            });
        }

        function extractLabels(options, controlSettings) {

            if (!controlSettings) {

                return;

            }

            angular.forEach(options, function(option, index) {

                if (!controlSettings.extras.labels) {

                    option.label = option.value;

                    return;

                }

                if (typeof controlSettings.extras.labels[index] === 'undefined') {

                    option.label = option.value;

                    return;

                }

                option.label = controlSettings.extras.labels[index];

            });
        }

    }
})();

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('dropdownControl', dropdownControl);

    dropdownControl.$inject = [];

    function dropdownControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-dropdown ng-class=\"{disabled: !enabled}\"><ui-select ng-disabled=!enabled theme=selectize ng-model=selectedValue on-select=onItemSelected($item,$model) search-enabled=false><ui-select-match placeholder=\"select option\">{{$select.selected.name}} {{profile.unit}}</ui-select-match><ui-select-choices repeat=\"item in listElements\"><aside>{{item.name}} {{profile.unit}}</aside></ui-select-choices></ui-select></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.listElements = [];
            scope.selectedValue = null;
            scope.onItemSelected = onItemSelected;
            scope.$watch('profile', watchProfile);
            scope.$watch('value', watchValue);

            function onItemSelected(item, model) {
                publishValue(item.value);
            }

            function publishValue(value) {

                if (scope.onChange) {

                    scope.onChange({
                        val: value
                    });

                }
            }

            function watchProfile() {

                scope.listElements = [];

                if (scope.profile) {

                    scope.listElements = extractOptionsFromProfile(scope.profile);

                    scope.selectedValue = getSelectedOption();

                }
            }

            function watchValue() {

                scope.selectedValue = getSelectedOption();

            }

            function extractOptionsFromProfile(profile) {

                var options = [];

                if (profile.enum) {

                    angular.forEach(profile.enum, function(val) {
                        options.push({
                            name: val,
                            value: val
                        });
                    });

                    return options;
                }

                if (profile.labels) {

                    angular.forEach(profile.labels, function(val) {

                        options.push({
                            name: val.name,
                            value: val.value
                        });
                    });

                    return options;
                }

                if (profile.type == 'boolean') {

                    options.push({
                        name: 'true',
                        value: true
                    });

                    options.push({
                        name: 'false',
                        value: false
                    });

                    return options;
                }
            }

            function getSelectedOption() {

                var selOption = null;

                angular.forEach(scope.listElements, function(option) {

                    if (option.value === scope.value) {

                        selOption = option;

                    }

                });

                return selOption;
            }
        }
    }

}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('inputControl', inputControl);

    inputControl.$inject = [];

    function inputControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-input ng-class=\"{disabled: !enabled}\"><input type=text ng-model=localValue placeholder=\"Enter value\" ng-disabled=!enabled> <button class=input-control-btn ng-click=sendValue(localValue) ng-disabled=!enabled></button></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function(newValue) {
                scope.localValue = newValue;
            });

            element.bind('keydown keypress', function(event) {
                if (event.which === 13) {
                    scope.sendValue(scope.localValue);
                    event.preventDefault();
                }
            });

            scope.sendValue = function(value) {
                var normalisedValue = normaliseData(value);
                if (validateInputData(normalisedValue)) {
                    publishValue(normalisedValue);
                }
            };

            function validateInputData(value) {
                if (scope.profile.type == 'integer') {
                    if (isInteger(value)) {
                        if (isInBounds(value)) {
                            return true;
                        }
                    }
                } else if (scope.profile.type == 'number') {
                    if (typeof(value) == 'number') {
                        if (isInBounds(value)) {
                            return true;
                        }
                    }
                } else if (scope.profile.type == 'string') {
                    if (typeof(value) == 'string') {
                        return true;
                    }
                } else {
                    return false;
                }
            }

            function normaliseData(value) {
                if (scope.profile.type === 'number' || scope.profile.type === 'integer') {
                    var data = Number(value);
                    if (typeof(data) == 'number') {
                        if (!isNaN(data)) {
                            return data;
                        }
                    }
                } else {
                    return value;
                }
            }

            function isInteger(value) {
                if (value % 1 === 0) {
                    return true;
                } else {
                    return false;
                }
            }

            function isNumber(value) {
                if (value % 1 !== 0 || value % 1 === 0) {
                    return true;
                } else {
                    return false;
                }
            }

            function isInBounds(value) {
                if (value < scope.profile.minimum || value > scope.profile.maximum) {
                    return false;
                } else {
                    return true;
                }
            }

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('jsonControl', jsonControl);

    jsonControl.$inject = [];

    function jsonControl() {

        var directive = {
            restrict: 'E',
            template: '<div class=control-json><json-formatter json=value open=2></json-formatter></div>',
            scope: {
                profile: '=',
                value: '=?',
                id: '='
            },
            link: linker
        };

        return directive;

        //////////////////////

        function linker(scope, element, attrs) {

            if (scope.value === undefined) {
                scope.value = null;
            }

            scope.$watch('value', function(newValue) {
                scope.value = newValue;
            });
        }
    }
}());

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('knobControl', knobControl);

    knobControl.$inject = ['$interval', 'config'];

    function knobControl($interval, config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-knob ng-if=!blocked ng-class=\"{disabled: !enabled}\"><knob knob-data=value knob-options=options data-width=229 data-height=229></knob><span class=knob-unit>{{profile.unit}}</span></div><div class=control-fallback ng-if=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Knob');

            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            var valueToPublish = null;

            var publishInterval = null;

            scope.blocked = null;

            scope.message = null;

            scope.options = {
                readOnly: !scope.enabled,
                min: config.defaultMinimum,
                max: config.defaultMaximum,
                step: 1,
                thickness: 0.30,
                displayPrevious: true,
                angleOffset: 180,
                font: '',
                fontWeight: 900,
                inputColor: '#55636c',
                fgColor: 'transparent',
                bgColor: 'transparent',
                lineCap: 'round',
                mouseWheel: false,
                release: function(newValue) {

                    if (scope.value !== newValue) {

                        valueToPublish = newValue;

                    }
                },

                draw: function() {
                    var e = this.i;
                    var l = e.val().length;
                    var w = e.width();

                    var fontSize = w / l * 2.5;
                    if (l < 8) {
                        fontSize = '35px';
                    }

                    e.css({
                        'height': fontSize,
                        'line-height': fontSize,
                        'font-size': fontSize,
                        'margin-top': '90px',
                        'width': '173px',
                        'margin-left': '-202px'
                    });

                    var c = this.g; // context
                    var a = this.arc(this.cv); // Arc

                    var handleSize = 40; // radius of knob handle
                    var foregroundCircleStroke = 50;
                    var foregroundCircleFill = 38;
                    var handleLineSize = 6;
                    var backgroundCircleSize = 6;

                    if (typeof window.orientation == 'undefined' || window.innerWidth > 750) {
                        handleSize = 15; // radius of knob handle
                        foregroundCircleStroke = 20;
                        foregroundCircleFill = 16;
                        handleLineSize = 2;
                        backgroundCircleSize = 2;
                    }

                    c.canvas.addEventListener('mousemove', function(event) {
                        var mousePos = getMousePos(c.canvas, event);
                        var distance = Math.sqrt(Math.pow((mousePos.x - x), 2) + Math.pow((mousePos.y - y), 2));
                        if (distance < handleSize) {
                            $(this).css({
                                'cursor': 'move'
                            });
                        } else {
                            $(this).css({
                                'cursor': 'default'
                            });
                        }
                    }, false);

                    function getMousePos(canvas, event) {
                        var rect = canvas.getBoundingClientRect();
                        return {
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top
                        };
                    }

                    //draw background circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, 0, 2 * Math.PI, false);
                    c.strokeStyle = '#55636c';
                    c.lineWidth = backgroundCircleSize;
                    c.stroke();

                    //draw foreground fill circle

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    c.strokeStyle = '#55636c';
                    c.lineCap = 'square';
                    c.lineWidth = foregroundCircleStroke;
                    c.stroke();

                    c.beginPath();
                    c.arc(this.xy, this.xy, this.radius, a.s, a.e, a.d);
                    if (scope.enabled) {
                        c.strokeStyle = '#fff';
                    } else {
                        c.strokeStyle = '#f0f0f0';
                    }

                    c.lineCap = '';
                    c.lineWidth = foregroundCircleFill;
                    c.stroke();

                    //draw handle
                    // get the end angle coordinates. found it here: http://stackoverflow.com/questions/18342216/how-to-get-an-array-of-coordinates-that-make-up-a-circle-in-canvas
                    if (scope.enabled) {
                        var radians = a.e - Math.PI / 180;
                        var x = this.xy + this.radius * Math.cos(radians);
                        var y = this.xy + this.radius * Math.sin(radians);

                        // your custom dot
                        c.beginPath();
                        c.arc(x, y, handleSize, 0, 2 * Math.PI, false);
                        c.fillStyle = '#fff';
                        c.strokeStyle = '#55636c';
                        c.lineCap = 'round';
                        c.lineWidth = handleLineSize;
                        c.fill();
                        c.stroke();
                    }
                }
            };

            publishInterval = $interval(publishIntervalHandler, 1000);

            scope.$watch('profile', profileWatcher);

            scope.$watch('value', valueWatcher);

            scope.$watch('enabled', enableWatcher);

            scope.$on('$destroy', destroyHandler);

            function profileWatcher() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.options.min = scope.profile.minimum;
                        scope.options.max = scope.profile.maximum;

                    } else {

                        scope.options.min = config.defaultMinimum;
                        scope.options.max = config.defaultMaximum;

                    }

                    if (scope.options.min > scope.options.max) {

                        scope.message = invalidMinMaxConfigurationMessage;

                    }

                    if (scope.options.min > scope.value || scope.options.max < scope.value) {

                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;

                    } else {

                        scope.blocked = false;

                    }

                    if (scope.profile.type == 'number') {

                        scope.options.step = 0.1;

                    }

                }
            }

            function enableWatcher() {

                scope.options.readOnly = !scope.enabled;

            }

            function valueWatcher() {

                if (scope.value < scope.options.min || scope.value > scope.options.max) {

                    scope.blocked = true;

                    scope.message = assetValueOutOfBoundsMessage;

                } else {

                    scope.blocked = false;

                }
            }

            function publishIntervalHandler() {

                if (valueToPublish) {

                    publishValue(valueToPublish);

                    valueToPublish = null;

                }
            }

            function destroyHandler() {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

            function publishValue(value) {

                if (scope.onChange) {

                    scope.onChange({
                        val: value
                    });

                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('lineProgressControl', lineProgressControl);

    lineProgressControl.$inject = ['config'];

    function lineProgressControl(config) {

        var directive = {
            restrict: 'E',
            template: '<div class=control-slider ng-show=!blocked><article class=slider-val><span class=slider-value>{{value}}</span> <span class=slider-unit>{{profile.unit}}</span></article><div><md-slider ng-if=sliderSettingsAreReady aria-label=lineProgress ng-disabled=true ng-model=value min=\"{{ sliderSettings.minimum }}\" max=\"{{ sliderSettings.maximum }}\" step=1></md-slider></div></div><div class=control-fallback ng-show=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            link: linker,
            scope: {
                value: '=',
                profile: '=',
                id: '='
            }
        };
        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Line progress');
            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            scope.blocked = null;
            scope.message = null;
            scope.sliderSettings = {
                minimum: config.defaultMinimum,
                maximum: config.defaultMaximum
            };

            scope.$watch('value', function(newValue) {
                if (scope.value > scope.sliderSettings.maximum || scope.value < scope.sliderSettings.minimum) {
                    scope.blocked = true;
                    scope.message = assetValueOutOfBoundsMessage;
                } else {
                    scope.blocked = false;
                    scope.value = newValue;
                }
            });

            scope.$watch('profile', function() {
                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.sliderSettings.minimum = scope.profile.minimum;
                        scope.sliderSettings.maximum = scope.profile.maximum;

                    } else {
                        scope.sliderSettings.minimum = config.defaultMinimum;
                        scope.sliderSettings.maximum = config.defaultMaximum;
                    }

                    if (scope.sliderSettings.minimum > scope.sliderSettings.maximum) {
                        scope.blocked = true;
                        scope.message = invalidMinMaxConfigurationMessage;
                    } else if (scope.sliderSettings.minimum > scope.value || scope.sliderSettings.maximum < scope.value) {
                        scope.blocked = true;
                        scope.message = assetValueOutOfBoundsMessage;
                    } else {
                        scope.blocked = false;
                    }
                }
            });

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = true;
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('lockUnlockControl', lockUnlockControl);

    lockUnlockControl.$inject = [];

    function lockUnlockControl() {

        var directive = {
            template: '<div class=control-lock-unlock ng-click=onClick() ng-class=\"{disabled: !enabled}\"><button ng-disabled=!enabled ng-class=\"{ locked: locked }\"></button></div>',
            link: link,
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            }
        };
        return directive;

        function link(scope, element, attrs) {

            //Default controls state:
            scope.unlockedValue = false;
            scope.lockedValue = true;
            scope.locked = false;

            scope.$watch('profile', function() {

                if (scope.profile) {
                    if (scope.profile.enum) {
                        scope.unlockedValue = scope.profile.enum[0];
                        scope.lockedValue = scope.profile.enum[1];
                    } else {
                        if (scope.profile.type == 'boolean') {
                            scope.unlockedValue = false;
                            scope.lockedValue = true;
                        }

                        if (scope.profile.type == 'integer') {
                            scope.unlockedValue = 0;
                            scope.lockedValue = scope.value;
                        }
                    }

                    update();
                }
            });

            scope.$watch('value', function(newValue) {
                update();
            });

            scope.onClick = function() {

                //if not locked -> lock
                if (scope.enabled) {
                    if (!scope.locked) {
                        publishValue(scope.lockedValue);
                        scope.locked = true;
                    } else if (scope.locked) { //if locked -> unlock
                        publishValue(scope.unlockedValue);
                        scope.locked = false;
                    }
                }
            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }

            function update() {
                if (scope.value === scope.lockedValue) {
                    scope.locked = true;
                } else if (scope.value === scope.unlockedValue) {
                    scope.locked = false;
                }
            }

        }
    }

})();

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('mapControl', mapControl);

    mapControl.$inject = [];

    function mapControl() {
        var directive = {
            template: '<leaflet id={{vm.id}} class=control-map markers=vm.markers center=vm.center defaults=vm.defaults paths=vm.paths></leaflet>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '='
            }
        };
        return directive;
    }

    Controller.$inject = ['$scope', '$interval', 'leafletData'];

    function Controller($scope, $interval, leafletData) {

        var mapDefaults = {
            icon: {
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAwCAYAAAAGlsrkAAAACXBIWXMAAAsTAAALEwEAmpwYAAA5lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU0OTExLCAyMDEzLzEwLzI5LTExOjQ3OjE2ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNS0xMC0yMlQxMjo0ODowOCswMjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE1LTEwLTIyVDEzOjUyOjE2KzAyOjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNS0xMC0yMlQxMzo1MjoxNiswMjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDpkNzU1MTY4OC05ZDhhLWQyNGUtODVhZi1hOTAxMDNmMjM1MTU8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6OTIxRTQ4OTI3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6OTIxRTQ4OEY3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6OTIxRTQ4OTA3OEE5MTFFNUIzODBCNjU4QTE5NDdEQkY8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo5MjFFNDg5Mjc4QTkxMUU1QjM4MEI2NThBMTk0N0RCRjwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6ZDc1NTE2ODgtOWQ4YS1kMjRlLTg1YWYtYTkwMTAzZjIzNTE1PC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE1LTEwLTIyVDEzOjUyOjE2KzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj4zMDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj40ODwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+ZnhexAAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAEY0lEQVR42ryYS2gkRRjHf1XdPclMkkki+wKX1Si7q7IsCB72IB4XRMGjggdRTx4UBfGFqJcoooJ6cteDB8GDLxSMIqj4AkUkK2QPK7uuiRGjyT4yeU/PVH0eqkYn0510z0yS/2Ho6e6v/vW9v2p16OFJcuA64DhwDLgR2NfyfAYYB34EPgfOZi0YZjw/CjwJ3AEUN3lvCLgeuBtYBj4BXgRObSSgN1lsFPgFuCuDtBV9wJ3eAi8BhbzEu4EvgKcARXd4FPgSuDLL1GXga+CG1GWUBqVRKmjakyBiQQyITZO6GfjOx8dsGnEBGNuIVAUFRCwSL2HjRbAxIKAjVDSAKvS7d0zN3V+PEb/2LcBqK/Go310TBFQIOsSsXkAWp7HVCtgaIgIISmnQIaowgO7fjy7tASzYequnbvIB9xCA8ul0BJhIkkagwFTOY+Z/c0Q6cqHxv6Xdj99MUD5AMHzYucXGaWFyFJjQTdq22ha0xlz6FXvpLEqHqKDo7ivlF1TuWmkIelBBAbswhbl4GoWATs3WlxtRfRC4rVVbFUTYxWnM4hSEPY4w6btk8IVFzNJf1CvnnZuSOA4c0cCtQLB+gQgbr2Aqv6MI3IJtQOkIu/AHEldAR2mv3K59mLcIBtjVWaS2DEHUfvbqCDFV7PKsd0XCz8c0cHg9q0JsHalW2tZ0nat06DQ2qQF2UAN7E8VM6lBf84WiU2iktpqWVgB7dWotFQFMd8VS4SuZpJm6oIE4XSrojlgA7UqsU2Qdqtr30iZYV4nCEmK70dqgwpJPqQTxjE5ULHGBoXqHnIBIZwpbg+4dRgWFtOYxoYFvk0I1dGk3uqeMpJe9DNIaKiyhSns2str32neNlfWSBhUUCQav9f/r+cnFNYhgcAQVDYDUEv4FPtLAHHCiNbjEVFF9+wiHDrmUyKO51BETEw5eQ1A+sJHMm8BMozvtAqaAUrLxB9ilPzHz56BeBR00NQqfemLAGtARwdAIuny171gJS1V9b55pVPELvkONJswGBOWrUL1XuPpbvYzU16DR8FWICouonmH0wH50z7CLCzFp2r7RyCLVNN4WgDN+R6n1F6WgvobUlv6bNJSOUFEfRCWXNba2URe77MvzXOsEEgOPAe+lElsfJDpEFXehvTaCODObOCvsnmuQpk2Z7wOfZUatiRFTRUzVEUpmoRkHXs8ab+8F5tk6GOCePHP1P8ATW0j8PHA670niBPDVFpBOAM+0e4S5H1jrkvi+Ts5Ok8DTXZC+AvzcCXFDeLwD0kng8c3nk2w80AHxg1kjTB7in4CTbZCO+fMx3RLjfb2S891H8o2C+TAHvJDjvZN5PkO0QwzwanOtTcEK8Gz+4Tc/loDXNnn+FvD3dhA3+mlaHY+9Rdgu4ovA2yn3PwDObSdxY2ZKCyq2m3gC+KHp/xngm50gBnin6frd7BP71hF/3HT9YWdnyc4w7U28kPxokw8hneOU34DdaeJP/ZdAdpp4DOjvVPjfAQAj1Hyq7g5auQAAAABJRU5ErkJggg==',
                shadowImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAdCAYAAADoxT9SAAAACXBIWXMAAAsTAAALEwEAmpwYAAA5lGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMjEgNzkuMTU0OTExLCAyMDEzLzEwLzI5LTExOjQ3OjE2ICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgICAgICAgICB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNS0xMC0yMlQxMjo0ODowOCswMjowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE1LTEwLTIyVDEzOjUyOjI5KzAyOjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNS0xMC0yMlQxMzo1MjoyOSswMjowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDphNTg0ZmY4MC03YTE2LTBmNDgtOTUwYS03NzgzMzY1MGQ5Nzg8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPnhtcC5kaWQ6ODhDNzNFMUI3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnhtcC5paWQ6ODhDNzNFMTg3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3N0UmVmOmluc3RhbmNlSUQ+CiAgICAgICAgICAgIDxzdFJlZjpkb2N1bWVudElEPnhtcC5kaWQ6ODhDNzNFMTk3OEE5MTFFNUFCMDJCM0I3NkQ3RTM3Rjc8L3N0UmVmOmRvY3VtZW50SUQ+CiAgICAgICAgIDwveG1wTU06RGVyaXZlZEZyb20+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo4OEM3M0UxQjc4QTkxMUU1QUIwMkIzQjc2RDdFMzdGNzwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6YTU4NGZmODAtN2ExNi0wZjQ4LTk1MGEtNzc4MzM2NTBkOTc4PC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE1LTEwLTIyVDEzOjUyOjI5KzAyOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj41MDwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yOTwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+1iOTFQAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAACI0lEQVR42tyY607DMAyFT9qwsQ14//dEoNJLwg+OpYOV0a43BpWsBpCoP/s4dhJyzvgPTwSAEMKe3wzufe3JtNEn5/wFspPTAUDl3qEAZACJluWdf8zIRgAVgJoWZW1WglGnB1oHoKfZ7/KWIOZMDeCB//vI9cHBGKiXmDmYxDraB4AWQMOfv2UorghhAEcAj3wbQHSS+qlW8hWJtYR5p31odtYAMek8ArgIRJToTy3wEmBNZ6MEp+bfGpNiXJiFwCxcaGf5UJjo+C0Zt4wm1kzH9eKMGMSLQKwJUALSzBjY7IwEkdOzQFQ79qFvz9wPV4zK084QoKRaWlpS7JaNE+1hJwjrLQ13rWbprmXZOFNa9cYAiW/rJW8AXrlOc/tIRRmdCBE3KmxtjNbdG+khje/wccYWeCTI2nWRXRPspR4asY4Qs0eUivWwZjZ0GPSzVSvdvJNZKy8ZGi0bpxt3qeA+nNzYYc73MlN1hUExjY30U0FqN4LUE6Wijg9XJlpda9RHnb8VpGYGntx266OdC4Ne76zkdHJnj1lH1jgBwhrfheu6oO+STAZqXPXdFw5Kq5y148hAeCDAs0hKHU9O06pxczxt4fhUkKoAESSynewmvji9VPa7fCgcUQ8ymkeRibdrUf+dW5QCxJn1EKQJtaL5we1I93EdJBBRzhSdQPhdBr8V+Vuk1bs9f7inyE8F8Xv73UV+DKQU8T91lxr+y93v5wCV/Qp4dygmBQAAAABJRU5ErkJggg==',
                iconSize: [30, 48],
                shadowSize: [50, 29],
                iconAnchor: [15, 48],
                shadowAnchor: [3, 29]
            },
            behavior: {
                drawLineBetweenLocations: true,
                lineColor: '#3D91CE',
                lineWeight: 6,
                lineOpacity: 0.4
            },
            controls: {
                scrollWheelZoom: false,
                doubleClickZoom: true,
                attributionControl: true,
                zoomControl: true,
                dragging: true,
                tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            },
            center: {}
        };

        var pendingStateLocation = null;
        var pendingPaths = [];
        var mapInitialized = false;

        //map is not update every time state changes, but every in interval specified
        var mapUpdateInterval = 3000;

        var vm = this;
        vm.center = mapDefaults.center;
        vm.markers = [];
        vm.defaults = mapDefaults.controls;

        vm.paths = {
            movement: {
                color: mapDefaults.behavior.lineColor,
                weight: mapDefaults.behavior.lineWeight,
                opacity: mapDefaults.behavior.lineOpacity,
                latlngs: []
            }
        };

        $scope.$watch('vm.value', function() {

            if (!isUndefinedOrNull(vm.value)) {

                //setup for next map update
                pendingStateLocation = extractStateLocation(vm.value);
                pendingPaths.push(angular.copy(pendingStateLocation.location));

                //on inital state change, update map immediately
                if (!mapInitialized) {
                    updateMap();
                    mapInitialized = true;
                }
            }
        });

        $interval(updateMap, mapUpdateInterval);

        function updateMap() {

            if (pendingStateLocation) {

                vm.center = angular.copy(pendingStateLocation.location);

                //set map.zoom only if there is only one relevant point on the map
                //if there is more then one point, fit to bound will be applied.
                if (vm.paths.movement.latlngs.length === 0) {
                    vm.center.zoom = pendingStateLocation.zoom;
                }

                vm.markers = [getMarker(pendingStateLocation.location)];

                if (mapDefaults.behavior.drawLineBetweenLocations) {

                    angular.forEach(pendingPaths, function(p) {
                        vm.paths.movement.latlngs.push(p);
                    });

                    //do fit to bounds only if there is more the one point
                    //if there one or none, leave the default zoom
                    if (vm.paths.movement.latlngs.length > 1) {

                        leafletData.getMap(vm.id).then(function(map) {

                            map.fitBounds(vm.paths.movement.latlngs);
                        });
                    }
                }

                pendingStateLocation = null;
                pendingPaths = [];
            }
        }

        function extractStateLocation(state) {

            if (isUndefinedOrNull(state)) {
                throw 'Smartliving Widgets - Map Control - Invalid location';
            }

            var stateLocation = {
                location: {
                    lat: 0,
                    lng: 0
                },
                zoom: 11
            };

            if (angular.isArray(state)) {

                if (state.length === 2 && angular.isNumber(state[0]) && angular.isNumber(state[1])) {
                    stateLocation.location.lat = state[0];
                    stateLocation.location.lng = state[1];
                    return stateLocation;
                }
            }

            if (angular.isNumber(state.lat) && angular.isNumber(state.lng)) {
                stateLocation.location.lat = state.lat;
                stateLocation.location.lng = state.lng;
                return stateLocation;
            }

            if (angular.isNumber(state.latitude) && angular.isNumber(state.longitude)) {
                stateLocation.location.lat = state.latitude;
                stateLocation.location.lng = state.longitude;
                return stateLocation;
            }

            if (angular.isNumber(state.lat) && angular.isNumber(state.long)) {
                stateLocation.location.lat = state.lat;
                stateLocation.location.lng = state.long;
                return stateLocation;
            }

            throw 'Smartliving Widgets - Map Control - Invalid location';
        }

        function getMarker(location) {
            var marker = {
                lat: location.lat,
                lng: location.lng,
                icon: {
                    iconUrl: mapDefaults.icon.image,
                    shadowUrl: mapDefaults.icon.shadowImage,
                    iconSize: mapDefaults.icon.iconSize,
                    shadowSize: mapDefaults.icon.shadowSize,
                    iconAnchor: mapDefaults.icon.iconAnchor,
                    shadowAnchor: mapDefaults.icon.shadowAnchor
                }
            };
            return marker;
        }

        function isUndefinedOrNull(v) {
            return angular.isUndefined(v) || v === null;
        }
    }
})();

(function() {
    angular
        .module('ngSmartlivingWidgets')
        .directive('onoffControl', onoffControl);

    onoffControl.$inject = [];

    function onoffControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-onoff><div class=indicator ng-class=\"{ on: turnOn}\"></div></div>',
            link: linker,
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        //////////////////////////

        function linker(scope, element, attrs) {

            scope.turnOn = false;

            scope.$watch('value', function() {

                if (scope.profile) {

                    if (scope.profile.enum) {

                        if (scope.value === scope.profile.enum[1]) {
                            scope.turnOn = true;
                        } else if (scope.value === scope.profile.enum[0]) {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type === 'integer' || scope.profile.type === 'number') {
                        if (scope.value !== 0 && scope.value > 0) {
                            scope.turnOn = true;
                        } else {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type === 'boolean') {
                        if (scope.value === true) {
                            scope.turnOn = true;
                        } else {
                            scope.turnOn = false;
                        }
                    } else if (scope.profile.type == 'string') {
                        if (scope.value === '' || scope.value === undefined || scope.value === null) {
                            scope.turnOn = false;
                        } else {
                            scope.turnOn = true;
                        }
                    } else if (scope.profile.type == 'object') {
                        if (isEmptyObject(scope.value)) {
                            scope.turnOn = false;
                        } else {
                            scope.turnOn = true;
                        }
                    }
                }
            });
        }

        function isEmptyObject(obj) {
            return JSON.stringify(obj) === '{}';
        }
    }
}());

(function() {
    'use strict';

    var PushButtonStatus = {
        profileValid: 0,
        profileInvalid: 1
    };

    var PUBLISH_INTERVAL_TIMEOUT = 1000;

    angular
        .module('ngSmartlivingWidgets')
        .directive('pushButtonControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-push-button ng-class=\"{disabled: !vm.enabled}\"><button ng-disabled=!vm.enabled ng-mousedown=vm.onPress() ng-touchstart=vm.onPress() ng-mouseup=vm.onRelease() ng-touchend=vm.onRelease()></button></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                asset: '=',
                onChange: '&'
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope', '$timeout', '$interval'];

    function Controller($scope, $timeout, $interval) {

        var vm = this;

        vm.status = PushButtonStatus.profileValid;
        vm.onPress = onPress;
        vm.onRelease = onRelease;

        var publishInterval = null;
        var pressValue = true;
        var releaseValue = false;

        var buttonConfiguration = {
            type: 'push-to-make',
            interval: false,
            break: true
        };

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.asset.profile', profileWatcher);
        $scope.$on('$destroy', onDestroy);

        function profileWatcher(profile) {

            if (!validateProfile(profile)) {

                vm.status = PushButtonStatus.profileInvalid;

                return;

            }

            configurePressAndReleaseValues();
        }

        function controlWatcher(controlSettings) {

            if (controlSettings && controlSettings.extras) {

                if (controlSettings.extras.type) {

                    buttonConfiguration.type = controlSettings.extras.type;

                }

                if (controlSettings.extras.behavior === 'continuous' || controlSettings.extras.behavior === 'continuous-break') {

                    buttonConfiguration.interval = true;

                }

                if (controlSettings.extras.behavior === 'continuous') {

                    buttonConfiguration.break = false;

                }

                configurePressAndReleaseValues();

            }
        }

        function configurePressAndReleaseValues() {

            if (vm.profile.enum) {

                if (buttonConfiguration.type === 'push-to-make') {

                    pressValue = vm.profile.enum[0];

                    releaseValue = vm.profile.enum[1];

                } else {

                    pressValue = vm.profile.enum[1];

                    releaseValue = vm.profile.enum[0];

                }

                //if profile.enum is configured, then there is no sense to check if 
                //profile.type is boolean or whatever because first value will always be used
                //to actuate onPush and onRelease will be used to actuate onRelease
                return;

            }

            if (vm.profile.type === 'boolean') {

                if (buttonConfiguration.type === 'push-to-make') {

                    pressValue = true;

                    releaseValue = false;

                } else {

                    pressValue = false;

                    releaseValue = true;

                }

            }

        }

        function validateProfile(profile) {

            if (profile.type === 'boolean') {

                return true;

            }

            if (profile.enum && profile.enum.length === 2) {

                return true;

            }

            return false;

        }

        function onPress() {

            if (buttonConfiguration.interval) {

                if (publishInterval) {

                    $interval.cancel(publishInterval);

                    publishInterval = null;

                }

                publish(pressValue);

                publishInterval = $interval(function() {

                    publish(pressValue);

                }, PUBLISH_INTERVAL_TIMEOUT);

            } else {

                publish(pressValue);

            }

        }

        function onRelease() {

            if (publishInterval) {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }


            if (buttonConfiguration.break) {

                //make a short delay before publishing release to make sure
                //press event has reached server
                $timeout(function() {

                    publish(releaseValue);

                }, 10);

            }

        }

        function publish(commandValue) {

            if (vm.onChange) {

                vm.onChange({
                    val: commandValue
                });

            }

        }

        function onDestroy() {

            if (publishInterval) {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

        }
    }


})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('sliderControl', sliderControl);

    sliderControl.$inject = ['$interval', 'config'];

    function sliderControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=control-slider ng-show=!blocked ng-class=\"{disabled: !enabled}\"><article class=slider-val><span class=slider-value>{{value}}</span> <span class=slider-unit>{{profile.unit}}</span></article><div><md-slider ng-if=sliderSettingsAreReady ng-disabled=!enabled aria-label=slider ng-model=slider.value min=\"{{ sliderSettings.minimum }}\" max=\"{{ sliderSettings.maximum }}\" step=1></md-slider></div></div><div class=control-fallback ng-show=blocked><div class=value-unit><span class=value>{{value}}</span> <span class=unit>{{profile.unit}}</span></div><p>{{message}}</p></div>',
            scope: {
                enabled: '=',
                value: '=',
                profile: '=',
                id: '=',
                onChange: '&'
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            var assetValueOutOfBoundsMessage = config.outOfBoundsMessage.format('Slider');

            var invalidMinMaxConfigurationMessage = config.invalidBoundsMessage;

            var valueToPublish = null;

            var publishInterval = null;

            scope.blocked = null;

            scope.message = null;

            scope.slider = {
                value: null
            };

            scope.sliderSettings = {
                minimum: config.defaultMinimum,
                maximum: config.defaultMaximum
            };

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = false;

            publishInterval = $interval(publishIntervalHandler, 1000);
            scope.$on('$destroy', destroyHandler);
            scope.$watch('value', valueWatcher);
            scope.$watch('slider.value', sliderValueWatcher);
            scope.$watch('profile', profileWatcher);

            //Hack because of the problem with ngMaterial slider
            scope.sliderSettingsAreReady = true;

            function publishIntervalHandler() {

                if (valueToPublish) {

                    publishValue(valueToPublish);

                    valueToPublish = null;

                }
            }

            function destroyHandler() {

                $interval.cancel(publishInterval);

                publishInterval = null;

            }

            function valueWatcher(newValue) {

                if (scope.value > scope.sliderSettings.maximum || scope.value < scope.sliderSettings.minimum) {

                    scope.blocked = true;

                    scope.message = assetValueOutOfBoundsMessage;

                } else {

                    scope.slider.value = newValue;

                    scope.blocked = false;

                }
            }

            function sliderValueWatcher(newValue, oldValue) {

                //Setup value to publish only if slider.value is different then current value
                if (scope.slider.value !== scope.value) {

                    valueToPublish = newValue;

                }
            }

            function profileWatcher() {

                if (scope.profile) {

                    if (angular.isNumber(scope.profile.minimum) && angular.isNumber(scope.profile.maximum)) {

                        scope.sliderSettings.minimum = scope.profile.minimum;
                        scope.sliderSettings.maximum = scope.profile.maximum;

                    } else {

                        scope.sliderSettings.minimum = config.defaultMinimum;
                        scope.sliderSettings.maximum = config.defaultMaximum;

                    }

                    if (scope.sliderSettings.minimum > scope.sliderSettings.maximum) {

                        scope.blocked = true;
                        scope.message = invalidMinMaxConfigurationMessage;

                    } else if (scope.sliderSettings.minimum > scope.value || scope.sliderSettings.maximum < scope.value) {

                        scope.blocked = true;

                        scope.message = assetValueOutOfBoundsMessage;

                    } else {

                        scope.blocked = false;

                    }
                }
            }

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {
    'use strict';

    angular
        .module('ngSmartlivingWidgets')
        .directive('spinnerControl', directive);

    function directive() {

        var directive = {
            template: '<div class=control-spinner ng-class=\"{disabled: !vm.spinerStatus.enabled}\"><div ng-if=!sInt(vm.step)><button class=\"spinner-btn plus\" ng-click=vm.increase() ng-disabled=!vm.spinerStatus.enabled angular-ripple></button><p class=spinner-value>{{ vm.asset.state.value }}</p><button class=\"spinner-btn minus\" ng-click=vm.decrease() ng-disabled=!vm.spinerStatus.enabled angular-ripple></button></div><div class=control-fallback ng-if=isInt(vm.step)><div class=value-unit><h1><b>Mismatch!</b></h1></div><p>{{ vm.spinerStatus.message}}</p></div></div>',
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            restrict: 'E',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                asset: '=',
                onChange: '&'
            }
        };

        return directive;

    }

    Controller.$inject = ['$scope'];

    function Controller($scope) {

        var vm = this;

        vm.increase = increase;
        vm.decrease = decrease;

        vm.spinerStatus = {
            enabled: true,
            message: null
        };

        vm.step = null;

        $scope.$watch('vm.asset.control', controlWatcher, true);
        $scope.$watch('vm.asset.profile', profileWatcher);

        function profileWatcher(profile) {

            compareStepWithProfile(profile);

        }

        function controlWatcher(controlSettings) {

            if (controlSettings && controlSettings.extras) {

                if (controlSettings.extras.step) {

                    vm.step = controlSettings.extras.step;

                    compareStepWithProfile(vm.asset.profile);

                }

            } else {

                if (vm.profile.type === 'number') {

                    vm.step = 0.1;

                } else if (vm.profile.type === 'integer') {

                    vm.step = 1;

                }
            }
        }

        function compareStepWithProfile(profile) {

            if (profile.type === 'integer') {

                if (isInt(vm.step)) {

                    vm.spinerStatus.enabled = true;
                    vm.spinerStatus.message = null;

                } else {

                    vm.spinerStatus.enabled = false;
                    vm.spinerStatus.message = 'Step does not match asset profile type.';

                }

            } else if (profile.type === 'number') {

                if (typeof(vm.step) === 'number') {

                    vm.spinerStatus.enabled = true;
                    vm.spinerStatus.message = null;

                } else {

                    vm.spinerStatus.enabled = false;
                    vm.spinerStatus.message = 'Step does not match asset profile type.';

                }

            } else {

                vm.spinerStatus.enabled = false;
                vm.spinerStatus.message = 'Asset profile should be integer or number';

            }
        }

        function isInt(value) {

            return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
        }

        function increase() {

            var valueToSend = null;

            if (vm.asset.state && vm.asset.state.value) {

                valueToSend = prepareValue(vm.asset.state.value);

            } else {

                valueToSend = prepareValue(null);

            }

            valueToSend += vm.step;

            publish(valueToSend);

        }

        function decrease() {

            var valueToSend = null;

            if (vm.asset.state && vm.asset.state.value) {

                valueToSend = prepareValue(vm.asset.state.value);

            } else {

                valueToSend = prepareValue(null);

            }

            valueToSend -= vm.step;

            publish(valueToSend);

        }

        function prepareValue(value) {

            var valueToSend = value;

            if (valueToSend === null || valueToSend === undefined) {
                valueToSend = 0;
            }

            if (vm.asset.profile.type === 'integer' && typeof(valueToSend) === 'number') {

                valueToSend = ~~valueToSend;

            }

            return valueToSend;

        }


        function publish(commandValue) {

            if (vm.onChange) {

                vm.onChange({
                    val: commandValue
                });

            }

        }

    }


})();

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('textControl', textControl);

    textControl.$inject = [];

    function textControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-text><div class=text-content>{{value}} <span class=empty ng-if=\"value === undefined || value === null\"><i>no value to display</i></span></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('textEditorControl', textEditorControl);

    textEditorControl.$inject = [];

    function textEditorControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-text-editor ng-class=\"{disabled: !enabled}\"><textarea ng-model=textValue ng-disabled=!enabled placeholder=\"enter text\"></textarea> <button class=text-editor-control-btn ng-click=sendText(textValue) ng-disabled=!enabled></button></div>',
            link: linker,
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                is: '=',
                onChange: '&'
            }
        };
        return directive;

        //////////////////////////

        function linker(scope, element, attrs) {

            scope.$watch('value', function(newValue) {
                scope.textValue = newValue;
            });

            scope.sendText = function(value) {

                if (scope.profile.type === 'object') {
                    var object = JSON.parse(value);
                    publishValue(object);
                } else {
                    publishValue(value);
                }

            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('toggleControl', toggleControl);

    toggleControl.$inject = [];

    function toggleControl() {
        var directive = {
            restrict: 'E',
            template: '<div class=control-toggle ng-class=\"{disabled: !enabled}\"><span class=left-value>{{leftValue}}</span><md-switch aria-label=toggle_control ng-model=toggle ng-click=onClick() ng-disabled=!enabled></md-switch><span class=right-value>{{rightValue}}</span></div>',
            scope: {
                enabled: '=',
                profile: '=',
                value: '=',
                id: '=',
                onChange: '&'
            },
            link: linker
        };

        return directive;

        //////////////////////

        function linker(scope, element, attrs) {
            scope.leftValue = false;
            scope.rightValue = true;
            scope.toggle = false;

            scope.$watch('profile', function() {
                if (scope.profile) {
                    if (scope.profile.enum) {
                        scope.leftValue = scope.profile.enum[0];
                        scope.rightValue = scope.profile.enum[1];
                    } else {
                        if (scope.profile.type == 'boolean') {
                            scope.leftValue = false;
                            scope.rightValue = true;
                        }

                        if (scope.profile.type == 'integer') {
                            scope.leftValue = 0;
                            scope.rightValue = scope.value;
                        }
                    }
                }
            });

            scope.$watch('value', function(newValue) {
                if (scope.value == scope.rightValue) {
                    scope.toggle = true;
                } else if (scope.value == scope.leftValue) {
                    scope.toggle = false;
                }
            });

            scope.onClick = function() {
                if (scope.enabled) {
                    if (scope.toggle === true) {
                        publishValue(scope.leftValue);
                    } else if (scope.toggle === false) {
                        publishValue(scope.rightValue);
                    }
                }
            };

            function publishValue(value) {

                if (scope.onChange) {
                    scope.onChange({
                        val: value
                    });
                }
            }
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('ontableControl', ontableControl);

    ontableControl.$inject = ['$interval', 'config'];

    function ontableControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-ontable><div class=indicator ng-class=\"{ ontable: ontable === true }\"><span class=phone></span> <span class=shadow></span></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.ontable = false;

            scope.$watch('value', function(newValue) {

                if (newValue === 'ontable') {

                    scope.ontable = true;

                } else if (newValue === 'notontable') {

                    scope.ontable = false;
                }

            });
        }
    }
}());

(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('rotateControl', rotateControl);

    rotateControl.$inject = ['$interval', 'config'];

    function rotateControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-rotation><div class=indicator ng-class=\"{ left: rotateLeft === true, right: rotateLeft === false }\"></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.rotateLeft = null;

            scope.$watch('value', function(newValue) {

                if (newValue === 'rightRotation') {

                    scope.rotateLeft = false;

                } else if (newValue === 'leftRotation') {

                    scope.rotateLeft = true;
                }

            });
        }
    }
}());
(function() {

    angular
        .module('ngSmartlivingWidgets')
        .directive('shakeControl', shakeControl);

    shakeControl.$inject = ['$interval', 'config'];

    function shakeControl($interval, config) {

        var directive = {
            link: linker,
            restrict: 'E',
            template: '<div class=sl-control-shake><div class=indicator ng-class=\"{ shaking: shaking === true}\"></div></div>',
            scope: {
                profile: '=',
                value: '=',
                id: '='
            }
        };

        return directive;

        /////////////////////////////////

        function linker(scope, element, attrs) {

            scope.shaking = false;

            scope.$watch('value', function(newValue) {

                if (newValue === 'shaking') {

                    scope.shaking = true;

                } else if (newValue === 'still') {

                    scope.shaking = false;
                }

            });
        }
    }
}());
