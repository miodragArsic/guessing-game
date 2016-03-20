(function() {

    angular
        .module('app')
        .factory('urlShortenerService', urlShortenerService);

    urlShortenerService.$inject = [
        '$http',
        'public.urlShortenerApiKey',
        'public.urlShortenerApiUrl',
        'exception'
    ];

    function urlShortenerService($http, shortenerApiKey, urlShortenerApiUrl, exception) {

        var service = {
            shortenUrl: shortenUrl
        };

        return service;

        ///////////////////////////////////////////

        function shortenUrl(url) {

            var body = {
                longUrl: url
            };

            return $http.post(urlShortenerApiUrl + '?key=' + shortenerApiKey, body)
                .then(function(response) {
                    return response.data.id;
                })
                .catch(exception.catcher('There was a problem generating short url'));
        }

    }

}());
