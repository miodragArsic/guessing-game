(function() {
    'use strict';

    angular
        .module('app')
        .factory('EditDeviceModel', EditDeviceModelFactory);

    EditDeviceModelFactory.$inject = [];

    function EditDeviceModelFactory() {

        function EditDeviceModel(name, description, title) {
            this.name = name;
            this.description = description;
            if (title) {
                this.title = title;
            } else {
                this.title = name;
            }

            this.isEditEnabled = true;
            this.saved = false;
        }

        return EditDeviceModel;
    }
})();
