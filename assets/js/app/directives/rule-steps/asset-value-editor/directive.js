(function(ng) {

    ng.module('app').directive('assetValueEditor', assetValueEditor);

    assetValueEditor.$inject = ['$compile'];

    function assetValueEditor($compile) {

        var defaultTemplate = '<text-setter text-value="operation.value"</text-setter>';
        var assetProfileDescriptorTemplate = '<sl-asset-profile-descriptor profile="profile"></sl-asset-profile-descriptor>';

        var directive = {
            restrict: 'E',
            link: linker,
            scope: {
                operation: '=',
                profile: '=',
                isEditMode: '='
            }
        };

        return directive;

        ///////////////////

        function linker(scope, element, attrs) {

            scope.$watch('profile', function(newValue) {

                if (newValue) {
                    element.html(getTemplate(scope.profile)).show();
                    $compile(element.contents())(scope);
                }
            });
        }

        function getTemplate(profile) {

            var template = defaultTemplate;

            if (!profile) {
                return template;
            }

            if (!profile.type) {
                return template;
            }

            if (isEmailService(profile)) {
                return template;
            }

            if (profile.labels) {
                template = '<label-setter value="operation.value" profile="profile"></label-setter>';
                return template;
            }

            if (profile.type == 'cron') {
                return '<day-time cron = "operation.value" is-edit-mode = "isEditMode"> </day-time> ';
            }

            if (profile.type == 'bool' || profile.type == 'boolean') {
                template = '<bool-setter bool-value="operation.value"></bool-setter>';
            }

            if (profile.type == 'int' || profile.type == 'integer' || profile.type == 'decimal' || profile.type == 'float' || profile.type == 'number' || profile.type == 'double') {
                template = '<number-setter num-value="operation.value"></number-setter>';
            }

            if (profile.type == 'date' || profile.type == 'datetime' || profile.type == 'time') {
                template = '<date-setter date-value="operation.value"></date-setter>';
            }

            if (profile.type == 'timespan' || profile.type == 'timerange' || profile.type == 'duration') {
                template = '<timespan-setter timespan-value="operation.value"></timespan-setter>';
            }

            if (profile.type == 'string' || profile.type == 'text') {
                template = '<text-setter text-value="operation.value"></text-setter>';
            }

            template += assetProfileDescriptorTemplate;

            return template;
        }

        function isEmailService(profile) {

            if (!profile) {
                return false;
            }

            if (!profile.type) {
                return false;
            }

            if (profile.type.subject == 'string') {
                return true;
            }

            return false;
        }
    }

}(window.angular));
