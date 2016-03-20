(function() {
    'use strict';

    angular
        .module('app')
        .directive('awaitingContent', awaitingContent);

    awaitingContent.$inject = [];

    function awaitingContent() {

        var directive = {
            link: link,
            restrict: 'A'
        };

        return directive;

        function link(scope, element, attrs) {

            attrs.$observe('awaitingContent', function(val) {

                if (!val) {

                    var loaderElement = element.find('loader-wrapper');

                    if (loaderElement.length) {

                        loaderElement.show();

                    } else {

                        element.append('<loader-wrapper class="small overlay-loader">' +
                            '<loader>' +
                            '<ld/>' +
                            '<ld/>' +
                            '<ld/>' +
                            '</loader>' +
                            '</loader-wrapper>');

                    }
                } else {

                    element.find('loader-wrapper').hide();

                }
            });
        }
    }
})();
