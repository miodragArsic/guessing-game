(function(ng) {

    ng.module('app').filter('assetTypeFilter', function() {
        return function(items, assetType) {
            var filtered = [];

            if (!items) {
                return filtered;
            }

            if (!assetType) {
                return items;
            }

            for (var assetIndex = 0; assetIndex < items.length; assetIndex++) {
                if (items[assetIndex].is == assetType || items[assetIndex].is == 'virtual') {
                    filtered.push(items[assetIndex]);
                }
            }

            return filtered;
        };
    });

}(window.angular));
