(function() {

    angular
        .module('app')
        .directive('deviceStatus', deviceStatus);

    deviceStatus.$inject = ['$rootScope'];

    function deviceStatus($rootScope) {
        var directive = {
            restrict: 'A',
            scope: {
                device: '='
            },
            link: linker
        };

        return directive;

        function linker(scope, element, attribute) {

            scope.$watch('device.deviceActiveAt', function() {
                scope.setStatusLabel(scope.device.lastActiveAt);
            });

            scope.isFirstTime = true;

            $rootScope.$on('$messaging.asset.state', function(event, payload) {

                var isAssetFromThisDevice = false;
                var asset = null;

                for (var i = 0; i < scope.device.assets.length; i++) {

                    if (payload.assetId === scope.device.assets[i].id) {

                        isAssetFromThisDevice = true;
                        asset = scope.device.assets[i];
                        break;
                    }

                }

                if (asset) {

                    if (asset.name === 'sendingdata' && scope.isFirstTime) {

                        $rootScope.$broadcast('user.playing.quick-demo', asset.state);

                        scope.isFirstTime = false;
                    }

                }

                if (isAssetFromThisDevice && asset.is === 'sensor') {

                    scope.setStatusLabel(payload.payload.State.At);

                }

            });

            scope.setStatusLabel = function(time) {

                var status = null;

                if (time !== null && time !== undefined && time !== '') {

                    var offsetTime = moment(time).add(-4, 's');
                    var timeEdited = moment(offsetTime, moment.ISO_8601);
                    var finalTime = timeEdited.fromNow();
                    element[0].innerHTML = 'active ' + finalTime;

                    $(element[0]).attr('title', timeEdited.format('DD.MM.YYYY. [at] HH:MM'));

                }

            };

        }
    }
}());
