(function() {
    'use strict';

    angular
        .module('app')
        .controller('TermsOfUseController', TermsOfUseController);

    TermsOfUseController.$inject = ['$state', 'termsOfUseRepository', 'userContext'];

    function TermsOfUseController($state, termsOfUseRepository, userContext) {

        var vm = this;

        vm.termsOfUseHtml = null;

        vm.acceptTerms = acceptTerms;

        vm.showAcceptButton = userContext.user && !userContext.user.termsAcceptedOn;

        activate();

        ////////////////

        function activate() {

            termsOfUseRepository.getTermsOfUse()
                .then(function(termsOfUseHtml) {

                    vm.termsOfUseHtml = termsOfUseHtml;

                });
        }

        function acceptTerms() {

            termsOfUseRepository.acceptTermsOfUse()
                .then(function() {

                    userContext.load().then(function() {

                        $state.go('home');

                    });

                });

        }
    }
})();
