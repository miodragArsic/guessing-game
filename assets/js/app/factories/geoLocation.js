(function(ng) {
    ng.module('app').factory('utility.geoLocation', [
        '$q',
        function($q) {
            return {
                getLocation: function() {
                    if (!navigator.geolocation) {
                        return;
                    }
                    var deferred = $q.defer();
                    navigator.geolocation.getCurrentPosition(deferred.resolve, deferred.reject);
                    return deferred.promise;
                }
            }
        }
    ]);
}(window.angular));
