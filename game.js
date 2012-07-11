/* Constants */
var c = {};
try {
    c.__defineGetter__("reset_dir", function () { return -1; });
    c.__defineGetter__("up",        function () { return 0; });
    c.__defineGetter__("right",     function () { return 1; });
    c.__defineGetter__("down",      function () { return 2; });
    c.__defineGetter__("left",      function () { return 3; });
}
catch (e) {
    // No getters? FAKE CONSTANTS!
    c.reset_dir = -1;
    c.up        = 0;
    c.right     = 1;
    c.down      = 2;
    c.left      = 3;
}

/* Game namespace */
var game = {
    resources: {
        img : [ "grass", "sandwater", "treetop", "trunk", "watergrass", "whitey" ],
        map : [ "island" ]
    },

    onload: function () {
        // Initialize the video.
        if (!me.video.init("game", 640, 480, false, 1.0)) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Set all resources to be loaded.
        var resources = [];
        this.resources["img"].forEach(function (value) {
            resources.push({
                name : value,
                type : "image",
                src  : "resources/img/" + value + ".png"
            })
        });
        this.resources["map"].forEach(function (value) {
            resources.push({
                name : value,
                type : "tmx",
                src  : "resources/map/" + value + ".tmx"
            })
        });
        me.loader.preload(resources);

        // Load everything & display a loading screen.
        me.state.change(me.state.LOADING);
    },

    loaded: function () {
        // Set the "Play" ScreenObject.
        me.state.set(me.state.PLAY, new PlayScreen());

        // Player entity.
        me.entityPool.add("player", PlayerEntity);

        // Key bindings.
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP,    "up");
        me.input.bindKey(me.input.KEY.DOWN,  "down");

        // Start the game.
        me.state.change(me.state.PLAY);
    }
};

/* Main game */
var PlayScreen = me.ScreenObject.extend({
    onResetEvent: function () {
        // Load the first level.
        me.levelDirector.loadLevel("island");
    },

    onDestroyEvent: function () {
    }
});

/* Player character */
var PlayerEntity = me.ObjectEntity.extend({
    // Direction facing
    dir: c.DOWN,

    // Standing or walking?
    standing: true,

    // Keys being held: [ "left", "up", "right", "down" ]
    held: [ false, false, false, false ],
    last_held: [ false, false, false, false ],

    // A helper constant
    angle: Math.sin(45 * (Math.PI / 180)),

    init: function (x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Set the walking speed.
        this.setVelocity(1.5, 1.5);

        // Set animations.
        this.addAnimation("walk_down",  [ 0,  1,  2,  3 ]);
        this.addAnimation("walk_right", [ 4,  5,  6,  7 ]);
        this.addAnimation("walk_left",  [ 8,  9,  10, 11 ]);
        this.addAnimation("walk_up",    [ 12, 13, 14, 15 ]);

        // Do not handle gravity in a top-down perspective.
        this.gravity = 0;

        // Set the display to follow our position on both axis.
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    update: function () {
        var self = this;

        // Walking controls.
        self.vel.x = self.vel.y = 0;
        var directions = [ "left", "up", "right", "down" ];
        directions.forEach(function (dir, i) {
            if (me.input.isKeyPressed(dir)) {
                self.held[i] = true;
                self.standing = false;

                if (!self.last_held[i] || (self.dir == c.reset_dir)) {
                    self.dir = c[dir];
                    self.setCurrentAnimation("walk_" + dir);
                }

                var axis = (i % 2) ? "y" : "x";
                self.vel[axis] = self.accel[axis] * me.timer.tick;

                // Walking at a 45-degree angle will slow the axis velocity by
                // approximately 5/7. But we'll just use sin(45)  ;)
                if (me.input.isKeyPressed(directions[(i + 1) % 4]) ||
                    me.input.isKeyPressed(directions[(i + 3) % 4])) {
                    self.vel[axis] *= self.angle;
                }

                if (i < 2) {
                    self.vel[axis] = -self.vel[axis];
                }
            }
            else {
                self.held[i] = false;
                if (self.last_held[i]) {
                    self.dir = c.reset_dir;
                }
            }

            self.last_held[i] = self.held[i];
        });

        // Check & update player movement.
        self.updateMovement();

        // Update animation if necessary.
        if ((self.vel.x != 0) || (self.vel.y != 0)) {
            // Update object animation.
            self.parent(self);
            return true;
        }
        else if (!self.standing) {
            self.standing = true;
            self.setAnimationFrame(0);
            return true;
        }

        return false;
    }
});

/* Bootstrap */
window.onReady(function() {
    game.onload();
});
