(function(ng) {
    ng.module('app').factory('utility.inputStateValidator', [
        function() {
            function isEmpty(val) {
                if (val == '' || !val) {
                    return false;
                }
                return true;
            }

            return {
                isValidInteger: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }
                    return !isNaN(val);
                },

                isValidString: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }
                    return true;
                },

                isValidBoolean: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }

                    if (val == 'true' || val == 'false') {
                        return true;
                    }
                    return false;
                },

                isValidJson: function(val) {
                    if (!isEmpty(val)) {
                        return false;
                    }

                    try {
                        ng.fromJSON(val);
                        return true;
                    } catch (e) {
                        return false;
                    }
                },


                validateByType: function(type, val) {
                    switch (type) {
                        case 'bool':
                            return this.isValidBoolean(val);
                        case 'int':
                            return this.isValidInteger(val);
                        case 'string':
                            return this.isValidString(val);
                        case 'json':
                            return this.isValidJson(val);
                    }
                    return false;
                }

            };
        }
    ]);
}(window.angular));
