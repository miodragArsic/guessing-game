(function() {
    'use strict';

    angular
        .module('app')
        .factory('app.config', appConfig);

    appConfig.$inject = [
        'api.url',
        'api.clientId',
        'broker.url',
        'broker.port',
        'broker.sourceRoot',
        'public.token',
        'public.clientId',
        'public.clientKey',
        'public.urlShortenerApiKey',
        'public.urlShortenerApiUrl',
        'origin'
    ];

    function appConfig(apiUrl, apiClientId, brokerUrl, brokerPort, brokerSourceRoot, publicToken, publicClientId, publicClientKey, urlShortenerApiKey, urlShortenerApiUrl, origin) {
        var service = {
            api: {
                url: apiUrl,
                clientId: apiClientId
            },
            broker: {
                url: brokerUrl,
                port: brokerPort,
                sourceRoot: brokerSourceRoot
            },
            guest: {
                token: publicToken,
                clientId: publicClientId,
                clientKey: publicClientKey
            },
            urlShortener: {
                key: urlShortenerApiKey,
                url: urlShortenerApiUrl
            },
            origin: origin
        };
        return service;
    }
})();
