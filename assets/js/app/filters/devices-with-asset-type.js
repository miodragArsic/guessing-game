(function(ng) {

    ng
        .module('app')
        .filter('devicesWithAssetFilter', devicesWithAssetFilterFactory);

    function devicesWithAssetFilterFactory() {

        return filterMethod;

        ////////

        function filterMethod(items, assetType) {

            if (!items) {
                return [];
            }

            if (!assetType) {
                return items;
            }

            if (assetType == '*') {
                return findDevicesContainingAnyAsset(items);
            }

            return findDevicesContainingAssetsOfType(items, assetType);
        }

        function findDevicesContainingAnyAsset(items) {

            var filtered = [];

            for (var deviceIndex = 0; deviceIndex < items.length; deviceIndex++) {
                if (items[deviceIndex].assets.length > 0) {
                    filtered.push(items[deviceIndex]);
                }
            }

            return filtered;
        }

        function findDevicesContainingAssetsOfType(items, assetType) {

            var filtered = [];

            for (var deviceIndex = 0; deviceIndex < items.length; deviceIndex++) {
                for (var assetIndex = 0; assetIndex < items[deviceIndex].assets.length; assetIndex++) {
                    if (items[deviceIndex].assets[assetIndex].is == assetType || items[deviceIndex].assets[assetIndex].is == 'virtual') {
                        filtered.push(items[deviceIndex]);
                        break;
                    }

                }
            }

            return filtered;
        }
    }

}(window.angular));
