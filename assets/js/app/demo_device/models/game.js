(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.game', GameFactory);

    GameFactory.$inject = ['demo.level', '$timeout'];

    function GameFactory(Level, $timeout) {

        var startCaption = '';
        var preSuspensionStatus = 'playing';

        function Game() {
            this.levels = [];
            this.caption = startCaption;
            this.status = 'tutorial';
            this.gameScreen = 'up';
            this.currentLevelIndex = 0;
            this.finishTimeout = null;
            this.transitionTimeout = null;
            this.transitionKeyTimeout = null;
            this.isLocked = false;
            this.key = '';

            var l1 = new Level.State(this, {
                order: 1,
                key: 'down',
                text: 'Put your phone on table',
                timeoutCaption: 'Nope, it\'s not on the table yet',
                successCaption: 'Cool, your phone is on table!',
                expectedAssetState: {
                    name: 'position',
                    value: 'ontable'
                }
            });

            var l2 = new Level.State(this, {
                order: 2,
                key: 'left',
                text: 'Now, rotate your phone left',
                timeoutCaption: 'Cmon, rotate it left',
                successCaption: 'Great, you rotated left!',
                expectedAssetState: {
                    name: 'rotation',
                    value: 'leftRotation'
                }
            });

            var l3 = new Level.State(this, {
                order: 3,
                key: 'right',
                text: 'Now, rotate your phone right',
                timeoutCaption: 'Cmon, rotate it right',
                successCaption: 'Great, you rotate it right!',
                expectedAssetState: {
                    name: 'rotation',
                    value: 'rightRotation'
                }
            });

            var l4 = new Level.State(this, {
                order: 4,
                key: 'shake',
                text: 'Now, shake it baby',
                timeoutCaption: 'Don\'t be shy, shake it :)',
                successCaption: 'Ooo, yeees, great.',
                expectedAssetState: {
                    name: 'amishaking',
                    value: 'shaking'
                },
                transition: {
                    delay: 4000,
                    status: {
                        delay: 1500,
                        caption: 'Going to the free level...',
                        key: 'tutorial-end'
                    }
                }
            });

            var l5 = new Level.Free(this, {
                order: 5,
                key: 'free',
                text: 'Try making some of previous moves, we\'ll guess which one it is',
                hideInNav: true
            });

            this.levels.push(l1, l2, l3, l4, l5);
        }

        Game.prototype.addLevel = function(levelConfig) {
            this.levels.push(this, levelConfig);
        };

        Game.prototype.setCaption = function(captionText) {
            this.caption = captionText;
        };

        Game.prototype.start = function() {
            this.getCurrentLevel().enter();
            if (this.status !== 'suspended') {
                this.status = 'tutorial';
            }
        };

        Game.prototype.suspend = function() {
            if (this.status !== 'suspended') {
                preSuspensionStatus = this.status;
                this.status = 'suspended';
            }
        };

        Game.prototype.unsuspend = function() {
            if (this.status === 'suspended') {
                this.status = preSuspensionStatus;
            }
        };

        Game.prototype.getCurrentLevel = function() {
            return this.levels[this.currentLevelIndex];
        };

        Game.prototype.isCurrentLevel = function(l) {
            return l.order === this.getCurrentLevel().order;
        };

        Game.prototype.isComplete = function() {
            var isComplete = true;

            angular.forEach(this.levels, function(l) {
                if (!l.isComplete) {
                    isComplete = false;
                }
            });

            return isComplete;
        };

        Game.prototype.setGameScreen = function(gameScreen) {
            this.gameScreen = gameScreen;
        };

        Game.prototype.play = function(assetName, assetValue) {

            var that = this;

            if (that.isComplete() || that.isLocked) {
                return;
            }

            var level = that.getCurrentLevel();
            level.stateChanged(assetName, assetValue);

            if (!that.isComplete() && level.isComplete) {
                if (!level.transition) {
                    that.currentLevelIndex++;
                    that.getCurrentLevel().enter();
                    that.key = that.getCurrentLevel().key;
                } else {
                    that.isLocked = true;

                    //delay transition to the next step
                    that.transitionTimeout = $timeout(function() {
                            that.currentLevelIndex++;
                            that.getCurrentLevel().enter();
                            that.key = that.getCurrentLevel().key;
                            that.isLocked = false;
                        },

                        level.transition.delay);

                    //delay change of the text and screen
                    that.transitionKeyTimeout = $timeout(function() {
                            that.setCaption(level.transition.status.caption);
                            that.key = level.transition.status.key;
                        },

                        level.transition.status.delay);
                }
            }
        };

        Game.prototype.skip = function() {

            var level = this.getCurrentLevel();
            level.skip();

            if (!this.isComplete() && level.isComplete) {
                this.currentLevelIndex++;
                this.getCurrentLevel().enter();
                this.key = this.getCurrentLevel().key;
            }

            this.setCaption('');
        };

        Game.prototype.restart = function() {
            if (this.finishTimeout) {
                $timeout.cancel(this.finishTimeout);
            }

            if (this.transitionTimeout) {
                $timeout.cancel(this.transitionTimeout);
            }

            if (this.transitionKeyTimeout) {
                $timeout.cancel(this.transitionKeyTimeout);
            }

            angular.forEach(this.levels, function(l) {
                l.reset();
            });

            this.currentLevelIndex = 0;
            this.caption = startCaption;
            this.status = 'tutorial';
            this.key = null;
            this.isLocked = false;
            this.gameScreen = 'up';
            this.start();
        };

        return Game;
    }

})();
