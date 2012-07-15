// cm = ChipMelon
window.cm = (function cm() {
    // A global chipmunk space.
    var space = null;

    // Sync Chipmunk and melonJS frames?
    var sync = true;

    // Default: Update space 30 times per second.
    var updates = 1 / 30;

    // !0 when running
    var running = 0;
    var lastStep = 0;
    var remainder = 0;

    // Viewport height
    // Needed because Chipmunk's coordinate origin is the bottom left;
    // melonJS's coordinate origin is the upper left of the screen.
    var height = 0;


    function step(time) {
        time = time || updates;

        var now = Date.now();
        var delta = (now - lastStep) / 1000;
        lastStep = now;

        // Step the space until it's caught up.
        remainder += delta;
        while (remainder >= time) {
            remainder -= time;
            space.step(time);
        }

        // update all games object
        me.game.update();
    }

    // Start simulation.
    function start() {
        if (sync || running) return;
        running = setInterval(function update_interval() {
            if (!me.state.isRunning()) return;
            step();
        }, updates * 1000);
    }

    // Stop simulation.
    function stop() {
        if (!running) return;
        clearInterval(running);
        running = 0;
    }

    // Public API
    return {
        "getSpace" : function getSpace() {
            return space;
        },

        // Set how often to update the space.
        "setSync" : function setSync(enable, _updates) {
            sync = !arguments.length ? true : enable;
            stop();
            updates = _updates || updates;
            start();
        },

        "onload" : function onload() {
            space = new cp.Space();

            var time = 0;


            /* Install melonJS hooks */

            // Override me.video.init to capture the canvas height
            var _video_init = me.video.init;
            me.video.init = function video_init() {
                height = arguments[2];

                // Call overridden function.
                return _video_init.apply(_video_init, arguments);
            };

            // Override me.game.init to start the Chipmunk simulation.
            var _game_init = me.game.init;
            me.game.init = function game_init() {
                // Call overridden function.
                _game_init();

                time = 1 / me.sys.fps;
                lastStep = Date.now();

                space.gravity = cp.v(0, (typeof(me.sys.gravity) === "undefined" ? 1 : me.sys.gravity) * -500);
                space.sleepTimeThreshold = 0.5;
                space.collisionSlop = 0.5;

                // Start simulation loop.
                start();
            }

            // Override me.game.loadTMXLevel to create Chipmunk shapes for all poly objects
            var _game_loadTMXLevel = me.game.loadTMXLevel;
            me.game.loadTMXLevel = function game_loadTMXLevel(level) {
                // Call overridden function.
                _game_loadTMXLevel(level);

                /*
                 * TODO: Get objects, create bodies + shapes
                 *
                 * Should bodies default to static if they are unnamed?
                 */
            };

            // Override me.state.resume to reset our lastStep variable
            var _state_resume = me.state.resume;
            me.state.resume = function state_resume(music) {
                // Without this, resuming a paused state would cause the simulation to skip ahead.
                lastStep = Date.now();

                // Call overridden function.
                _state_resume(music);
            };

            // Override me.ScreenObject.onUpdateFrame to only draw, or sync simulation.
            me.ScreenObject.prototype.onUpdateFrame = function onUpdateFrame() {
                // update the frame counter
                me.timer.update();

                if (sync) {
                    step(time);
                }

                // draw the game objects
                me.game.draw();

                // blit our frame
                me.video.blitSurface();
            };


            /* Disable some functions for compatibility with games already using melonJS. */

            // Object-to-object collision.
            me.game.collide = function collide() {
                return null;
            };

            // Entity-to-environment collision, gravity, friction.
            me.ObjectEntity.prototype.updateMovement = function updateMovement() {
                // Update Chipmunk body state with melonJS state.
                this.body.setVelocity(cp.v(this.vel.x * 60, this.vel.y * -60));

                // Update melonJS state with Chipmunk body state.
                this.pos.x = this.body.p.x;
                this.pos.y = height - this.body.p.y;

                this.vel.x = this.body.vx;
                this.vel.y = -this.body.vy;

                this.angle = this.body.a;

                // Return empty collision result, for compatibility.
                return {
                    "x"     : 0,
                    "xtile" : undefined,
                    "xprop" : {},
                    "y"     : 0,
                    "ytile" : undefined,
                    "yprop" : {}
                };
            };
        }
    };
})();

window.onReady(function () {
    cm.onload();
});
