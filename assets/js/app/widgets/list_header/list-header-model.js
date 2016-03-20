(function() {
    'use strict';

    angular
        .module('app')
        .factory('sl.listHeader', ListHeaderViewModelFactory);

    ListHeaderViewModelFactory.$inject = [];

    function ListHeaderViewModelFactory() {

        function ListHeaderViewModel(headerTitle, headerImage, headerSubTitle) {

            this.headerTitle = headerTitle;
            this.headerImage = headerImage;
            this.headerSubTitle = headerSubTitle;
            this.showHeaderSubtitle = false;
            this.headerMode = 'colapsed';
        }

        ListHeaderViewModel.prototype.setHeaderMode = function(mode) {

            this.headerMode = mode;
        };

        return ListHeaderViewModel;
    }
})();
