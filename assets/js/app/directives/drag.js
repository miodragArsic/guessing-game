(function(ng) {
    ng.module('app').directive('drag', function() {
        return {
            restrict: 'A',
            link: function(scope, element) {
                    var t = element;

                    $(function() {
                        $(t).mousedown(function (event) {
                            $(t)
                                .data('down', true)
                                .data('x', event.pageX)
                                .data('y', event.pageY)
                                .data('scrollLeft', this.scrollLeft)
                                .data('scrollTop', this.scrollTop)
                                .css('cursor', 'move');
                        }),

                            $(t).mouseup(function (event) {
                                $(t)
                                    .data('down', false)
                                    .removeAttr('style');
                            }),

                            $(t).mousemove(function (event) {
                                if ($(t).data('down') == true) {
                                    this.scrollLeft = $(t).data('scrollLeft') + $(t).data('x') - event.pageX;
                                }

                                if ($(t).data('down') == true) {
                                    this.scrollTop = $(t).data('scrollTop') + $(t).data('y') - event.pageY;
                                }
                            });

                    });


            }
        };
    });
}(window.angular));





