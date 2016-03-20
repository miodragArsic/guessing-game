(function(ng) {

    ng
        .module('app')
        .filter('assetValueFormat', assetValueFormatFilter);

    assetValueFormatFilter.$inject = ['api.assetsService', '$filter'];

    function assetValueFormatFilter(assetsService, $filter) {
        return function(item, profile) {

            if (!profile) {
                return item;
            }

            if (!profile.type) {
                return item;
            }

            var profileType = assetsService.normalizeProfileType(profile.type);

            if (profileType == 'datetime') {
                return $filter('amDateFormat')(item, 'MMMM Do YYYY');
            }

            if (profileType == 'cron') {
                return $filter('cronFilter')(item);
            }

            return item;
        };
    }
}(window.angular));
