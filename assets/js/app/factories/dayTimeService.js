(function(ng) {
    ng
        .module('app')
        .factory('service.dayTime', serviceDayTime);

    serviceDayTime.$inject = [];

    function serviceDayTime() {

        var service = {
            dayTime: returnDayTimeService,
            localTimeCronToUTCTime: generateCronForUTC,
            utcCronToLocalTime: generateCronForLocalTime
        };

        return service;
        ////////////////////////////

       function returnDayTimeService() {
           var dayTime = [{
                is: 'sensor',
                profile: {
                    type: 'cron'
                },
                id: '5412eab3da8ab71d14bfffff',
                name: 'Day and Time',
                type: 'dayTime',
                iconKey: 'fa-day-time',
                description: 'Set day and time to trigger this rule',
                detailsPage: ''
            }];

            return dayTime;
       };

       function generateCronForLocalTime (utcCron){
        var  utcTimeCron = utcCron.split(" ");
            var min = utcTimeCron[1];
            var hour = utcTimeCron[2];
            var dayOfMonth = utcTimeCron[3];
            var month = utcTimeCron[4];
            var daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            var selectedDays;

            if (utcCron[5]) {
                selectedDays = utcTimeCron[5].split(",");
            }

            var offset = new Date().getTimezoneOffset();
            var localMinutes = 0;
            var cron = '0 ';
            var hours = parseInt(hour);
            var minutes = parseInt(min);


            localMinutes = hours * 60 + minutes;


            var diff = localMinutes - offset;

            var shiftDays;

            if (diff < 0) {
                if (hours == 0) {
                    hours = 24 + Math.floor(diff / 60);
                    minutes = (((minutes + 60) + offset) % 60);
                } else {
                    minutes = ((diff) % 60) * (-1);
                }
                shiftDays = 'previous';
            } else if (diff >= 1440) {
                hours = Math.floor(diff / 60) - 24;
                minutes = (diff) % 60;
                shiftDays = 'next';

            } else {

                hours = Math.floor(diff / 60);
                minutes = diff % 60;
            }


            cron += minutes + ' ';
            cron += hours + ' ';
            cron += '? * ';

            for (var i = 0; i < selectedDays.length; i++) {
                var dayOrder = daysOfWeek.indexOf(selectedDays[i]);

                if (shiftDays == 'previous') {
                    if (dayOrder > 0) {
                        cron += daysOfWeek[dayOrder - 1] + ',';
                    } else {
                        cron += daysOfWeek[daysOfWeek.length - 1] + ',';
                    }
                } else if (shiftDays == 'next') {
                    if (dayOrder == (daysOfWeek.length - 1)) {
                        cron += daysOfWeek[0] + ',';
                    } else {
                        cron += daysOfWeek[dayOrder + 1] + ',';
                    }
                } else {
                    cron += selectedDays[i] + ',';
                }

            };
            cron = cron.slice(0, -1);

            return cron;
       };



        function generateCronForUTC(localTimeCron) {

            var localCron = localTimeCron.split(" ");
            var min = localCron[1];
            var hour = localCron[2];
            var dayOfMonth = localCron[3];
            var month = localCron[4];
            var daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
            var selectedDays;

            if (localCron[5]) {
                selectedDays = localCron[5].split(",");
            }

            var offset = new Date().getTimezoneOffset();
            var localMinutes = 0;
            var cron = '0 ';
            var hours = parseInt(hour);
            var minutes = parseInt(min);


            localMinutes = hours * 60 + minutes;


            var diff = localMinutes + offset;

            var shiftDays;

            if (diff < 0) {
                if (hours == 0) {
                    hours = 24 + Math.floor(diff / 60);
                    minutes = (((minutes + 60) + offset) % 60);
                } else {
                    minutes = ((diff) % 60) * (-1);
                }
                shiftDays = 'previous';
            } else if (diff > 1440) {
                hours = Math.floor(diff / 60) - 24;
                minutes = (diff) % 60;
                shiftDays = 'next';

            } else {

                hours = Math.floor(diff / 60);
                minutes = diff % 60;
            }


            cron += minutes + ' ';
            cron += hours + ' ';
            cron += '? * ';

            for (var i = 0; i < selectedDays.length; i++) {
                var dayOrder = daysOfWeek.indexOf(selectedDays[i]);

                if (shiftDays == 'previous') {
                    if (dayOrder > 0) {
                        cron += daysOfWeek[dayOrder - 1] + ',';
                    } else {
                        cron += daysOfWeek[daysOfWeek.length - 1] + ',';
                    }
                } else if (shiftDays == 'next') {
                    if (dayOrder == (daysOfWeek.length - 1)) {
                        cron += daysOfWeek[0] + ',';
                    } else {
                        cron += daysOfWeek[dayOrder + 1] + ',';
                    }
                } else {
                    cron += selectedDays[i] + ',';
                }

            };
            cron = cron.slice(0, -1);

            return cron;
        }

    };
}(window.angular));