(function(ng) {
    ng.module('app').factory('utility.typeConverter', function() {
        return function(toType, fromType) {
            switch (toType) {
                case 'int':
                    return parseInt(fromType);
                case 'string':
                    return fromType;
                case 'bool':
                    if (fromType == 'true') return true;
                    else return false;
                case 'json':
                    return fromType;
            }
        };
    });
}(window.angular));
