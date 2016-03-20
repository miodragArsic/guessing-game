    (function (ng) {
    ng.module('app').directive('balloonError', [
        function () {
            var RIGHT_OFFSET = 62;
            //var BALLON = 'balloon';
            var BALLOON_ERROR = 'balloon-error';
            var SAD_SMILE_ICON = 'sl-emotion-sad';

            function BalloonError(parentElement) {
                this.element = null;
                this.textElement = null;
                this.parentElement = parentElement instanceof ng.element ? parentElement[0] : parentElement;
            }

            BalloonError.prototype.getTopRightPosition = function () {
                var clientRect = this.parentElement.getBoundingClientRect();
                var x = Math.round(clientRect.width + clientRect.left) - RIGHT_OFFSET;
                var y = Math.round(clientRect.top);

                return {x: x, y: y};
            };

            BalloonError.prototype.setPosition = function (balloon) {
                if (balloon) {
                    var position = this.getTopRightPosition();

                    balloon.style.position = 'absolute';
                    balloon.style.top = position.y + 'px';
                    balloon.style.left = position.x + 'px';
                }
            };

            BalloonError.prototype.createErrorObject = function () {
                var balloon = this.element = document.createElement('div');
                var arrow = document.createElement('span');
                var icon = document.createElement('i');

                this.textElement = document.createElement('span');

                //balloon.classList.add(BALLON);
                balloon.classList.add(BALLOON_ERROR);
                icon.classList.add(SAD_SMILE_ICON);
                arrow.classList.add('arrow');

                balloon.appendChild(arrow);
                balloon.appendChild(icon);
                balloon.appendChild(this.textElement);

                this.setPosition(balloon);
                this.parentElement.parentNode.appendChild(balloon);
            };

            BalloonError.prototype.destroyErrorObject = function () {
                this.parentElement.parentNode.removeChild(this.element);
                this.element = null;
                this.textElement = null;
            };

            BalloonError.prototype.setErrorMessage = function (message) {
                if (this.element && message) {
                    this.textElement.innerHTML = message;
                }
            };

            BalloonError.prototype.clearErrorMessage = function () {
                this.textElement.innerHTML = null;
            };

            return {
                restrict: 'A',
                scope: {
                    message: '=balloonError'
                },
                link: function (scope, element, attrs) {
                    var balloon = null;

                    scope.$watch('message', function (value) {
                        if (value) {
                            if (!balloon) {
                                balloon = new BalloonError(element);
                                balloon.createErrorObject();
                            }

                            balloon.setErrorMessage(value);
                        }
                        else {
                            if (balloon) {
                                balloon.destroyErrorObject();
                                balloon = null;
                            }
                        }
                    });

                    function setBallonPositionOnEvent() {
                        if (balloon) {
                            balloon.setPosition(balloon.element);
                        }
                    }

                    window.addEventListener('resize', setBallonPositionOnEvent);

                    var container = window.document.body.querySelector(".grid-col-container");

                    if (container) {
                        container.addEventListener('scroll', setBallonPositionOnEvent);
                    }

                    scope.$on('$destroy', function () {
                        if (balloon) {
                            balloon.destroyErrorObject();
                        }

                        window.removeEventListener('resize', setBallonPositionOnEvent);
                        window.removeEventListener('scroll', setBallonPositionOnEvent);
                    });
                }
            };
        }
    ]);
}(window.angular));