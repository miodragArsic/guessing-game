(function() {

    angular
        .module('app')
        .factory('api.controlsService', ControlsService);

    ControlsService.$inject = ['$http', 'api.url', 'widgetsCommon', 'exception'];

    function ControlsService($http, apiUrl, widgetsCommon, exception) {

        var service = {
            getAll: getAll,
            getControl: getControl,
            getControlsForAsset: getControlsForAsset,
            getControlsForProfile: getControlsForProfile,
            getDefaultControl: getDefaultControl
        };

        return service;

        ///////////////////////////////////////////

        // - /controls gets all controls
        // - /controls/ {id} gets control by it's name
        // - /controls/asset / {id} gets controls for asset by it 's id
        // - POST / controls / profile gets controls for profile in the body

        function getAll() {
            var url = apiUrl + 'controls';

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load controls.'));
        }

        function getControl(controlName) {
            var url = apiUrl + 'controls/' + controlName;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load control.'));
        }

        function getControlsForAsset(assetId) {
            var url = apiUrl + 'controls/asset/' + assetId;

            return $http.get(url)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load asset controls.'));
        }

        function getControlsForProfile(profile) {
            var url = apiUrl + 'controls/profile';

            return $http.post(url, profile)
                .then(function(response) {
                    return response.data;
                })
                .catch(exception.catcher('There was a problem to load controls for a profile.'));
        }

        function getDefaultControl(asset) {

            return widgetsCommon.findDefaultControl(asset);

        }
    }

}());
