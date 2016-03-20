(function(ng) {
    ng.module('app').factory('utility.viewConfigs', [

        function() {

            var jsonEditorOptions = {
                lineWrapping: true,
                lineNumbers: false,
                mode: 'application/json',
                theme: 'neo',
                smartIndent: true,
                indentUnit: 4,
                tabSize: 4
            };

            return {
                getJsonEditorOptions: function() {
                    return jsonEditorOptions;
                }
            }
        }
    ]);
}(window.angular));
