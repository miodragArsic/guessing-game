(function() {
    'use strict';

    angular
        .module('app')
        .factory('brandConfig', factory);

    factory.$inject = ['$rootScope'];

    function factory($rootScope) {

        var brandConfig = %BRAND_CONFIG%;

        var service = {
            init: init,
            config: brandConfig
        };

        return service;

        function init() {

            $rootScope.brand = brandConfig;

        }
    }

})();
