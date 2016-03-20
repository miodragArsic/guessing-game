(function() {
    'use strict';

    angular
        .module('app')
        .factory('members.repository', membersRepository);

    membersRepository.$inject = ['membersService', 'memberModel', 'exception', 'utils'];

    function membersRepository(membersService, MemberModel, exception, utils) {

        var service = {
            findAll: findAll,
            deleteMember: deleteMember,
            addMember: addMember
        };

        return service;

        ////////////////

        function findAll(groundId) {

            return membersService.findAll(groundId)
                .then(utils.transformResponse(MemberModel))
                .catch(exception.catcher('Error while loading members.'));
        }

        function deleteMember(groundId, memberId) {

            return membersService.deleteMember(groundId, memberId)
                .catch(exception.catcher('Error deleting member.'));
        }

        function addMember(groundID, memberEmail) {

            return membersService.addMember(groundID, memberEmail)
                .then(utils.transformResponse(MemberModel))
                .catch(exception.catcher('Error occured while adding member.'));

        }
    }
})();
