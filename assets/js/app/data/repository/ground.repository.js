(function() {
    'use strict';

    angular
        .module('app')
        .factory('ground.repository', groundRepository);

    groundRepository.$inject = ['groundsService', 'groundModel', 'exception', 'utils'];

    function groundRepository(groundsService, GroundModel, exception, utils) {

        var service = {
            find: find,
            findAll: findAll,
            findAllPublic: findAllPublic,
            findAllShared: findAllShared,
            delete: deleteGround,
            create: create,
            update: update
        };

        return service;

        ////////////////

        function find(id) {

            return groundsService.find(id)
                .then(utils.transformResponse(GroundModel));
        }

        function findAll() {

            return groundsService.findAll()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function findAllPublic() {

            return groundsService.findAllPublic()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function findAllShared() {

            return groundsService.findAllShared()
                .then(utils.transformResponse(GroundModel))
                // .catch(exception.catcher('Error while loading Grounds.'));
        }

        function deleteGround(id) {

            return groundsService.delete(id)
                .then(function() {
                    utils.$rootScope.$emit('ground.delete', id);
                })
                .catch(exception.catcher('Error while deleting ground.'));
        }

        function create(name, visibility) {

            return groundsService.create(name, visibility)
                .then(utils.transformResponse(GroundModel))
                .then(function(ground) {
                    utils.$rootScope.$emit('ground.create', ground);
                    return ground;
                })
                .catch(exception.catcher('Error while creating ground.'));

        }

        function update(id, data) {

            return groundsService.update(id, data)
                .then(utils.transformResponse(GroundModel))
                .then(function(ground) {
                    utils.$rootScope.$emit('ground.update', ground);
                    return ground;
                })
                .catch(exception.catcher('Error while updating ground.'));
        }
    }
})();
