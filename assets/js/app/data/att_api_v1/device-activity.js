(function() {
    'use strict';

    angular
        .module('app')
        .factory('deviceActivityService', deviceActivityService);

    deviceActivityService.$inject = ['$http', 'api.url', '$q'];

    function deviceActivityService($http, apiUrl, $q) {

        var service = {
            getAssetActivity: getAssetActivity
        };

        var testData = [{
            at: '2015-08-20T13:00:00.000Z',
            data: {
                min: 0,
                avg: 1.5,
                max: 2
            }
        }, {
            at: '2015-08-20T14:00:00.000Z',
            data: {
                min: 0,
                avg: 1.6,
                max: 2.2
            }
        }, {
            at: '2015-08-20T15:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 2.9
            }
        }, {
            at: '2015-08-20T16:00:00.000Z',
            data: null
        }, {
            at: '2015-08-20T17:00:00.000Z',
            data: null
        }, {
            at: '2015-08-20T18:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 3.5
            }
        }, {
            at: '2015-08-20T19:00:00.000Z',
            data: {
                min: 0,
                avg: 7,
                max: 14
            }
        }, {
            at: '2015-08-20T20:00:00.000Z',
            data: {
                min: 0,
                avg: 2.5,
                max: 3.7
            }
        }, {
            at: '2015-08-20T21:00:00.000Z',
            data: {
                min: 0,
                avg: 1.8,
                max: 3.5
            }
        }, {
            at: '2015-08-20T22:00:00.000Z',
            data: {
                min: 0,
                avg: 4,
                max: 7
            }
        }];

        return service;

        ////////////////

        function getAssetActivity() {
            return $q(function(resolve, reject) {
                resolve(testData);
            });
        }

    }
})();
