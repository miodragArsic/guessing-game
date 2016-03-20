(function(ng) {
    ng
        .module('app')
        .directive('dayTime', dayTime);

    dayTime.$inject = ['service.dayTime'];

    function dayTime(dayTime) {

        var directive = {
            restrict: 'E',
            templateUrl: '/assets/js/app/directives/rule-steps/steps/day-time/day-time.html',
            scope: {
                cron: '=',
                isEditMode: '='
            },
            link: linker
        };

        return directive;

        /////////////////////////////

        function linker(scope) {

            scope.days = [{
                name: "MON",
                isSelected: false
            }, {
                name: "TUE",
                isSelected: false
            }, {
                name: "WED",
                isSelected: false
            }, {
                name: "THU",
                isSelected: false
            }, {
                name: "FRI",
                isSelected: false
            }, {
                name: "SAT",
                isSelected: false,
            }, {
                name: "SUN",
                isSelected: false
            }];

            scope.amPmHours = "00";

            scope.dayClicked = function(day) {
                for (var i = 0; i < scope.days.length; i++) {
                    if (scope.days[i].name === day.name) {
                        scope.days[i].isSelected = !scope.days[i].isSelected;
                        scope.cron = generateCron();
                    }
                };
            }

            scope.interfaceClicked = function() {
                scope.cron = generateCron();
            }

            scope.changeTime = function() {
                if (scope.partOfDay) {
                    scope.amPmHours = "12";
                } else {
                    scope.amPmHours = "00";
                }
            }

            scope.$watch('hours', function() {

                scope.cron = generateCron();
            });

            scope.$watch('minutes', function() {
                scope.cron = generateCron();
            })

            function setUpView() {
                if (scope.isEditMode) {
                    disectCron(scope.cron);

                } else {
                    scope.partOfDay = false;
                    scope.hours = "6";
                    scope.minutes = "0";
                    scope.cron = generateCron();
                }
            }

            function generateCron() {
                var cron = '0 ';
                var daysSelected = 0;

                cron += scope.minutes + ' ';


                if (!scope.partOfDay) {
                    var amHours = scope.hours;
                    cron += amHours + ' ';
                } else {
                    var pmHours = (parseInt(scope.hours) + 12).toString();
                    cron += pmHours + ' ';
                }

                cron += '? * ';

                for (var i = 0; i < scope.days.length; i++) {
                    if (scope.days[i].isSelected == true) {
                        daysSelected++;
                        cron += scope.days[i].name + ',';
                    }
                };


                if (daysSelected == 0) {
                    cron += '*';
                } else {
                    cron = cron.slice(0, -1);
                }

                return cron;
            }

            function disectCron(cronSting) {

                var cronElements = cronSting.split(' ');
                var cronMinutes = cronElements[1];
                var cronHours = cronElements[2];
                var cronDaysOfWeek = cronElements[5];

                if (cronDaysOfWeek) {
                    separatedDays = cronDaysOfWeek.split(',');

                    for (var i = 0; i < separatedDays.length; i++) {
                        for (var j = 0; j < scope.days.length; j++) {
                            if (separatedDays[i] == scope.days[j].name) {
                                scope.days[j].isSelected = true;
                            }
                        }
                    }
                }

                if (cronHours >= 0 && cronHours < 12) {
                    scope.partOfDay = false;
                    scope.hours = cronHours;
                }

                if (cronHours >= 12 && cronHours < 24) {
                    scope.partOfDay = true;
                    scope.hours = (cronHours - 12).toString();
                };

                scope.minutes = cronMinutes;

            }

            setUpView();

        };
    }
}(window.angular));
