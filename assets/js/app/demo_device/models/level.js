(function() {
    'use strict';

    angular
        .module('app')
        .factory('demo.level', LevelFactory);

    LevelFactory.$inject = ['$timeout', '$interval'];

    function LevelFactory($timeout, $interval) {

        //Base Level
        function BaseLevel() {

            this.isComplete = false;
            this.isTimeouted = false;
            this.isWaiting = false;
            this.order = 0;
            this.key = '';
            this.text = '';
            this.game = null;
            this.hideInNav = false;
            this.transition = null;
        }

        BaseLevel.prototype.stateChanged = function(assetName, assetValue) {};

        BaseLevel.prototype.enter = function() {};

        BaseLevel.prototype.reset = function() {};

        BaseLevel.prototype.skip = function() {};

        //State Level
        function StateLevel(game, config) {

            this.game = game;
            this.order = config.order;
            this.key = config.key;
            this.text = config.text;
            this.timeoutCaption = config.timeoutCaption;
            this.successCaption = config.successCaption;
            this.expectedAssetState = config.expectedAssetState;

            this.captionWarningTimerInterval = 7000;
            this.captionWarningTimer = null;
            this.waitingTimerInterval = 3000;
            this.waitingTimer = null;

            if (config.transition) {
                this.transition = config.transition;
            }

            if (config.captionWarningTimerInterval) {
                this.captionWarningTimerInterval = config.captionWarningTimerInterval;
            }

            if (config.waitingTimerInterval) {
                this.waitingTimerInterval = config.waitingTimerInterval;
            }
        }

        StateLevel.prototype = new BaseLevel();
        StateLevel.prototype.constructor = StateLevel;

        StateLevel.prototype.stateChanged = function(assetName, assetValue) {

            if (this.expectedAssetState.name === assetName && this.expectedAssetState.value === assetValue) {

                $timeout.cancel(this.captionWarningTimer);
                $timeout.cancel(this.waitingTimer);

                this.game.setCaption(this.successCaption);
                this.game.setGameScreen(this.key);
                this.isComplete = true;
                this.isTimeouted = false;
                this.isWaiting = false;
            }
        };

        StateLevel.prototype.skip = function() {
            this.isComplete = true;
            this.isTimeouted = false;
            this.isWaiting = false;

            if (this.captionWarningTimer) {
                $timeout.cancel(this.captionWarningTimer);
            }

            if (this.waitingTimer) {
                $timeout.cancel(this.waitingTimer);
            }
        };

        StateLevel.prototype.enter = function() {
            var that = this;

            that.captionWarningTimer = $timeout(function() {
                that.game.setCaption(that.timeoutCaption);
                that.isTimeouted = true;
            }, that.captionWarningTimerInterval);

            that.waitingTimer = $timeout(function() {
                that.isWaiting = true;
            }, that.waitingTimerInterval);
        };

        StateLevel.prototype.reset = function() {

            this.isComplete = false;
            this.isTimeouted = false;
            this.isWaiting = false;

            if (this.captionWarningTimer) {
                $timeout.cancel(this.captionWarningTimer);
            }

            if (this.waitingTimer) {
                $timeout.cancel(this.waitingTimer);
            }
        };

        //Free Level
        function FreeLevel(game, config) {
            this.game = game;
            this.order = config.order;
            this.key = config.key;
            this.text = config.text;
            this.hideInNav = config.hideInNav;

            this.queue = [];
        }

        FreeLevel.prototype = new BaseLevel();
        FreeLevel.prototype.constructor = FreeLevel;

        FreeLevel.prototype.stateChanged = function(assetName, assetValue) {

            this.queue.push({
                assetName: assetName,
                assetValue: assetValue
            });
        };

        FreeLevel.prototype.enter = function() {
            var that = this;
            that.game.setGameScreen('up');

            $interval(function() {
                that.processQueue();
            }, 30);

            that.game.status = 'free';
            that.game.setCaption('');
        };

        FreeLevel.prototype.processQueue = function() {
            var that = this;
            var item = that.queue.shift();

            if (!item) {
                return;
            }

            var assetName = item.assetName;
            var assetValue = item.assetValue;

            if (that.game.gameScreen === 'up') {
                if (assetName === 'position' && assetValue === 'ontable') {

                    that.game.setGameScreen('down');
                    that.game.setCaption('I\'m on a table');
                }
            }

            if (that.game.gameScreen === 'down' || that.game.gameScreen === 'left' || that.game.gameScreen === 'right') {
                if (assetName === 'position' && assetValue === 'notontable') {

                    that.game.setGameScreen('up');
                    that.game.setCaption('I\'m up!');
                }
            }

            if (assetName === 'amishaking' && assetValue === 'shaking') {

                that.game.setGameScreen('shake');
                that.game.setCaption('I\'m Shakin\'!');
            }

            if (that.game.gameScreen === 'shake') {
                if (assetName === 'amishaking' && assetValue === 'still') {

                    that.game.setGameScreen('up');
                    that.game.setCaption('I\'m up!');
                }
            }

            if (that.game.gameScreen === 'shake') {
                if (assetName === 'position' && assetValue === 'ontable') {

                    that.game.setGameScreen('down');
                    that.game.setCaption('I\'m on a table');
                }
            }

            if (that.game.gameScreen !== 'shake') {
                if (assetName === 'rotation' && assetValue === 'leftRotation') {

                    that.game.setGameScreen('left');
                    that.game.setCaption('Left rotation!');
                }

                if (assetName === 'rotation' && assetValue === 'rightRotation') {

                    that.game.setGameScreen('right');
                    that.game.setCaption('Right rotation!');
                }
            }
        };

        return {
            State: StateLevel,
            Free: FreeLevel
        };
    }

})();
