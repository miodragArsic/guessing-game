(function() {

    angular
        .module('app')
        .factory('api.metricsService', MetricsService);

    MetricsService.$inject = [
        '$http',
        'api.url'
    ];

    function MetricsService($http, apiUrl) {

        var service = {
            getPerformance: getPerformance
        };

        return service;

        function getPerformance() {
            var url = apiUrl + 'metrics/performance/current';
            return $http.get(url);
        }
    }
}());
