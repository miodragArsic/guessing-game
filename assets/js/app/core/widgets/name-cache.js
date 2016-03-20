(function() {
    'use strict';

    angular
        .module('app')
        .factory('nameCache', nameCache);

    function nameCache() {
        var service = {
            assets: [],
            grounds: [],
            devices: []
        };
        return service;

        ////////////////
    }
})();
