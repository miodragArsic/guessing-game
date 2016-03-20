(function(ng) {

    ng
        .module('app')
        .filter('cronFilter', cronFilter);

    cronFilter.$inject = [];

    function cronFilter() {
        return function(item) {
            var prettyCron = '';

            if (item) {

                var cron = item.split(" ");
                var min = cron[1];
                var hour = cron[2];
                var dayOfMonth = cron[3];
                var month = cron[4];
                var daysOfWeek;
                var timeOfDay = 'AM';

                var days = '';
                if (cron[5]) {
                    daysOfWeek = cron[5].split(",");

                    for (var i = 0; i < daysOfWeek.length; i++) {

                        switch (daysOfWeek[i]) {
                            case 'MON':
                                days += "Monday, ";
                                break;
                            case 'TUE':
                                days += "Tuesday, ";
                                break;
                            case 'WED':
                                days += "Wednesday, ";
                                break;
                            case 'THU':
                                days += "Thursday, ";
                                break;
                            case 'FRI':
                                days += "Friday, ";
                                break;
                            case 'SAT':
                                days += "Saturday, ";
                                break;
                            case 'SUN':
                                days += "Sunday, ";
                                break;
                        }
                    }
                }

                if (daysOfWeek) {
                    if (daysOfWeek[0] == '*') {
                        return "This rule will not trigger without any selected day!"
                    }
                }

                if (days == 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, ') {
                    prettyCron += 'Every weekday';
                } else if (days == 'Saturday, Sunday, ') {
                    prettyCron += 'Every weekend';
                } else if (days == 'Monday, Tuesday, Wednesday, Thursday, Friday, ') {
                    prettyCron += 'Every workday';
                } else {
                    prettyCron += days.slice(0, -2);
                }

                prettyCron += ' at ';

                var cHour = parseInt(hour);
                var normalizedHours = null;
                var normalizedMinutes = null;

                if (min == '0' || min == '5') {
                    normalizedMinutes = '0' + min;
                } else {
                    normalizedMinutes = min;
                }

                if (cHour > 12 && cHour < 24) {
                    timeOfDay = 'PM';
                    normalizedHours = (hour - 12).toString();
                    if (parseInt(normalizedHours) < 10) {
                        prettyCron += '0' + normalizedHours + ':' + normalizedMinutes + ' ' + timeOfDay;
                    } else {
                        prettyCron += normalizedHours + ':' + normalizedMinutes + ' ' + timeOfDay;
                    }

                } else if (cHour < 12) {
                    timeOfDay = 'AM';
                    if (cHour < 10) {
                        prettyCron += '0' + cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                    } else {
                        prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                    }
                } else if (cHour == 12) {
                    timeOfDay = 'PM';
                    prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;

                } else if (cHour == 0) {
                    timeOfDay = 'AM';
                    prettyCron += cHour.toString() + ':' + normalizedMinutes + ' ' + timeOfDay;
                } else if (cHour == 24) {
                    timeOfDay = 'AM';
                    prettyCron += '00' + ':' + normalizedMinutes + ' ' + timeOfDay;
                }
            }

            return prettyCron;
        };
    }
}(window.angular));
