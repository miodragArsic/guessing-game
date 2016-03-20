(function() {

    angular
        .module('app')
        .factory('gateway.repository', gatewayRepository);

    gatewayRepository.$inject = ['api.GatewayService', 'exception', 'gatewayModel', 'utils'];

    function gatewayRepository(gatewayService, exception, GatewayModel, utils) {

        var service = {
            find: find,
            findAll: findAll,
            remove: remove,
            update: update,
            findAllInGround: findAllInGround,
            claimGateway: claimGateway
        };

        return service;

        //////////////////////////////

        function find(gatewayId, includeDevices, includeAssets) {

            if (!includeDevices) {

                includeDevices = false;

            }

            if (!includeAssets) {

                includeAssets = false;

            }

            return gatewayService.getGateway(gatewayId, includeDevices, includeAssets)
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateway.'));
        }

        function findAll() {

            return gatewayService.listGateways()
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateways.'));

        }

        function findAllInGround(groundId) {

            return gatewayService.getFromGround(groundId)
                .then(utils.transformResponse(GatewayModel))
                .catch(exception.catcher('There was a problem to load gateways.'));

        }

        function remove(gatewayId) {

            return gatewayService.deleteGateway(gatewayId)
                .catch(exception.catcher('There was a problem to remove gateway.'));

        }

        function update(gatewayId, name, description) {

            return gatewayService.updateGateway(gatewayId, name, description)
                .catch(exception.catcher('There was a problem to update gateway.'));

        }

        function claimGateway(groundId, claimCode) {

            return gatewayService.claimGateway(groundId, claimCode)
                .catch(exception.catcher('There was a problem to claim gateway.'));
        }

    }

}());
