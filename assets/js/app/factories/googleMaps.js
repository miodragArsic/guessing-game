(function (ng) {
    ng.module('app').factory('utility.googleMaps', [
        '$q',
        '$log',
        '$rootScope',
        '$document',
        '$window',
        function ($q, $log, $rootScope, $document, $window) {
            var apiKey = "AIzaSyBbahKWU9YY3eAQ2yHNJW3QENyZNG_SY8w";
            var deferred = $q.defer();

            $window.googleMapsLoadDone = function () {
                deferred.resolve($window.google);
            };

            function loadScript() {
                var script = $document[0].createElement('script');

                script.type = 'text/javascript';
                script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&callback=googleMapsLoadDone&libraries=places,geometry&key=' + apiKey;

                $document[0].head.appendChild(script);
            }

            if (!ng.isDefined($window.google)) {
                loadScript();
            }

            return deferred.promise;
        }
    ]);
}(window.angular));
