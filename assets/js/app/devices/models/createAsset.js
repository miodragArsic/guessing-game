(function() {
    'use strict';

    angular
        .module('app')
        .factory('CreateAssetModel', CreateAssetModelFactory);

    CreateAssetModelFactory.$inject = ['api.assetsService'];

    function CreateAssetModelFactory(assetsService) {

        var assetTypes = assetsService.getAssetTypes();

        function CreateAssetModel(assetType, assetName) {

            if (assetType) {
                this.type = assetType;
            } else {
                this.type = assetTypes.length > 0 ? assetTypes[0].type : null;
            }

            if (assetName) {
                this.name = assetName;
            }
        }

        CreateAssetModel.prototype.setType = function(type) {
            this.type = type;
        };

        CreateAssetModel.prototype.getTypes = function() {
            return assetTypes;
        };

        CreateAssetModel.prototype.isValid = function() {

            return this.type && this.name;
        };

        return CreateAssetModel;
    }
})();
