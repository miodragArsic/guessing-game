(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.sensors', sensorsFactory);

    sensorsFactory.$inject = ['demo.shake',
        'demo.position',
        'demo.motion',
        'demo.pageVisibility',
        'demo.rotation'
    ];

    function sensorsFactory(shake, position, motion, pageVisibility, rotation) {
        var service = {
            shake: shake,
            position:position,
            motion:motion,
            pageVisibility: pageVisibility,
            rotation:rotation
        };
        return service;
    }
})();
