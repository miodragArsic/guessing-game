(function (ng) {
    ng.module('app').controller('modals.passwordRecovery.SuccessDialog', [
        '$scope',
        '$modalInstance',
        function ($scope, $modalInstance) {
            $scope.login = function () {
                $modalInstance.close();
            }
        }
    ]);
}(window.angular));