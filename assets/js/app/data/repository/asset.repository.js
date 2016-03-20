(function(ng) {

    ng
        .module('app')
        .factory('asset.repository', assetsRepository);

    assetsRepository.$inject = ['api.assetsService', 'exception', 'assetModel'];

    function assetsRepository(assetsService, exception, AssetModel) {

        var service = {
            find: find,
            create: create,
            createUsingToken: createUsingToken,
            createUsingTicket: createUsingTicket,
            replaceControl: replaceControl,
            replaceProfile: replaceProfile,
            publishCommand: publishCommand,
            publishState: publishState,
            remove: remove,
            update: update
        };

        return service;

        //////////////////////////////

        function find(assetId) {

            return assetsService.getAsset(assetId)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                });
        }

        function create(deviceId, name, title, type, profile, control) {

            return assetsService.createAsset(deviceId, name, title, type, profile, control)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                })
                .catch(exception.catcher('Error creating new asset.'));
        }

        function createUsingToken(deviceId, asset, token) {

            return assetsService.createAssetUsingToken(deviceId, asset, token)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                })
                .catch(exception.catcher('Error creating new asset.'));

        }

        function createUsingTicket(ticket, data) {

            return assetsService.createAssetUsingTicket(ticket, data)
                .then (function(response) {

                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;

                })
                .catch(exception.catcher('Error creating new asset.'));

        }

        function replaceControl(deviceId, assetName, value) {

            return assetsService.replaceControl(deviceId, assetName, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error replacing control asset.'));
        }

        function replaceProfile(deviceId, assetName, value) {

            return assetsService.replaceProfile(deviceId, assetName, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error replacing asset profile.'));
        }

        function publishCommand(id, value) {

            return assetsService.publishCommand(id, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error publishing command.'));
        }

        function publishState(id, value) {

            return assetsService.publishState(id, value)
                .then(function(response) {
                    return true;
                })
                .catch(exception.catcher('Error publishing state.'));
        }

        function remove(deviceId, assetName) {
            return assetsService.deleteAsset(deviceId, assetName);
        }

        function update(deviceId, assetId, assetName, assetIs, title) {
            return assetsService.updateAsset(deviceId, assetId, assetName, assetIs, title)
                .then(function(response) {
                    var model = new AssetModel(response.data);
                    model.subscribe();
                    return model;
                });
        }
    }

}(window.angular));
