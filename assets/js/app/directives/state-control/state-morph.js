
(function (ng) {
    ng.module('app').directive('stateMorph',
        ['$window',
            function ($window) {
                return {
                    restrict: 'A',
                    link: function (scope, element) {

                        var el = element[0],
                            trigger = $(el).find('[state-control-type="trigger"]'),
                            container = $(el).find('[state-control-type="container"]'),
                            morph = $(el).find('[state-control-type="morph"]'),
                            modifierClass = $(el).attr('modifier-class'),
                            time = 10;

                        trigger.on('click', function() {
                            var trigger = $(this);

                            //trigger position and size
                            var th = trigger.outerHeight(),
                                tw = trigger.outerWidth(),
                                tl = trigger.offset().left,
                                tt = trigger.offset().top;

                            //container position and size
                            var cw = container.outerWidth(),
                                ch = container.outerHeight(),
                                cl = container.offset().left,
                                ct = container.offset().top;

                            morph.css({ top: tt + 'px', left: tl + 'px', width: tw + 'px', height:th + 'px'});
                            setTimeout(function(){
                                morph.css({ top: ct + 'px', left: cl + 'px', width: cw + 'px', height:ch + 'px'})
                            }, time);

                        });

                        ng.element($window).on('resize', function () {
                            if(morph.hasClass(modifierClass)){
                                //container position and size
                                var cw = container.outerWidth(),
                                    ch = container.outerHeight(),
                                    cl = container.offset().left,
                                    ct = container.offset().top;

                                morph.css({ top: ct + 'px', left: cl + 'px', width: cw + 'px', height:ch + 'px', transition: 'none'})
                            }
                            else{
                                return false
                            }
                        });
                    }
                };
            }]
    );
}(window.angular));
