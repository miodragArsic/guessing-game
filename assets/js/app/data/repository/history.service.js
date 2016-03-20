(function() {
    'use strict';

    angular
        .module('app')
        .factory('history.service', historyService);

    historyService.$inject = ['api.assetsService'];

    function historyService(assetsService) {

        var service = {

            getAssetHistory: getAssetHistory,

            subscribeOnAssetStateChange: subscribeOnAssetStateChange

        };

        return service;

        ////////////////////////////////////////////////////////////

        function getAssetHistory(assetId, from, to, resolution) {

            return assetsService.getAssetHistory(assetId, from, to, resolution);

        }

        function subscribeOnAssetStateChange(asset, stateChangeHandler) {

            asset.on('state', stateChangeHandler);

        }
    }
})();
