(function(ng) {
    ng.module('app').directive('randomBackground', [
        function() {
            function getRandomColor() {
                return "#" + Math.random().toString(16).slice(2, 8);
            }

            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    element[0].style.backgroundColor = getRandomColor();
                }
            };
        }
    ]);
}(window.angular));
