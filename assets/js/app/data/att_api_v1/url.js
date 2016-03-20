(function() {

    angular.module('app').constant('api.url', '%CONFIGURATION_API_URL%');
    angular.module('app').constant('api.clientId', '%CONFIGURATION_API_CLIENTID%');
    angular.module('app').constant('broker.url', '%CONFIGURATION_BROKER_URL%');
    angular.module('app').constant('broker.port', %CONFIGURATION_BROKER_PORT%);
    angular.module('app').constant('broker.sourceRoot', '%CONFIGURATION_BROKER_SOURCE_ROOT%');
    angular.module('app').constant('widget.hostUrl', '%CONFIGURATION_WIDGET_HOSTURL%');
    angular.module('app').constant('origin', '%CONFIGURATION_ORIGIN%');
    angular.module('app').constant('public.token', '%CONFIGURATION_PUBLIC_TOKEN%');
    angular.module('app').constant('public.clientId', '%CONFIGURATION_PUBLIC_CLIENT_ID%');
    angular.module('app').constant('public.clientKey', '%CONFIGURATION_PUBLIC_CLIENT_KEY%');
    angular.module('app').constant('public.urlShortenerApiKey', 'AIzaSyDLqgICAbnq75SJF5NfpNqzpjwPXQo7YgA');
    angular.module('app').constant('public.urlShortenerApiUrl', 'https://www.googleapis.com/urlshortener/v1/url');
    angular.module('app').constant('termsOfUseCDNUrl', 'https://59ac97f6ca65569bb2d9a82888280ff3814a4274.googledrive.com/host/0B6z8XZULtV7xRGpyNktrM3hDWnc/Terms_of_Use/tou-text.html');
}());


