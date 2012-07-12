/* Constants */
var c = {};
try {
    c.__defineGetter__("RESET_DIR", function () { return -1; });
    c.__defineGetter__("UP",        function () { return 0; });
    c.__defineGetter__("RIGHT",     function () { return 1; });
    c.__defineGetter__("DOWN",      function () { return 2; });
    c.__defineGetter__("LEFT",      function () { return 3; });
}
catch (e) {
    // No getters? FAKE CONSTANTS!
    c.RESET_DIR = -1;
    c.UP        = 0;
    c.RIGHT     = 1;
    c.DOWN      = 2;
    c.LEFT      = 3;
}

/* Game namespace */
var game = {
    resources: {
        img : [ "collision", "grass", "sandwater", "treetop", "trunk", "watergrass", "whitey" ],
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

        // Game engine settings.
        me.sys.gravity = 0;
        me.sys.useNativeAnimFrame = true; // Be fast!
        //me.debug.renderHitBox = true;

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

/* Entity with extended collision detection support */
var MovableEntity = me.ObjectEntity.extend({
    updateMovement: function updateMovement() {
        this.computeVelocity(this.vel);

        // Check for collision.
        var collision = this.collisionMap.checkCollision(this.collisionBox, this.vel);

        if (collision.x) {
            // TODO: For now, just prevent movement.
            this.vel.x = 0;
        }

        if (collision.y) {
            // TODO: For now, just prevent movement.
            this.vel.y = 0;
        }

        // Update entity position.
        this.pos.add(this.vel);

        return collision;
    }
});

/* Player character */
var PlayerEntity = MovableEntity.extend({
    // Direction facing
    dir: c.DOWN,

    // Standing or walking?
    standing: true,

    // Keys being held: [ "left", "up", "right", "down" ]
    held: [ false, false, false, false ],
    last_held: [ false, false, false, false ],

    // A helper constant
    walk_angle: Math.sin((45).degToRad()),

    init: function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        this.updateColRect(8, 20, 16, 20);

        // Set the walking speed.
        this.setVelocity(1.5, 1.5);

        // Set animations.
        this.addAnimation("walk_down",  [ 0,  1,  2,  3 ]);
        this.addAnimation("walk_right", [ 4,  5,  6,  7 ]);
        this.addAnimation("walk_left",  [ 8,  9,  10, 11 ]);
        this.addAnimation("walk_up",    [ 12, 13, 14, 15 ]);

        // Set the display to follow our position on both axis.
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    update: function update() {
        var self = this;

        // Walking controls.
        self.vel.x = self.vel.y = 0;
        var directions = [ "left", "up", "right", "down" ];
        directions.forEach(function (dir, i) {
            if (me.input.isKeyPressed(dir)) {
                self.held[i] = true;
                self.standing = false;

                if (!self.last_held[i] || (self.dir == c.RESET_DIR)) {
                    self.dir = c[dir.toUpperCase()];
                    self.setCurrentAnimation("walk_" + dir);
                }

                var axis = (i % 2) ? "y" : "x";
                self.vel[axis] = self.accel[axis] * me.timer.tick;

                // Walking at a 45-degree angle will slow the axis velocity by
                // approximately 5/7. But we'll just use sin(45)  ;)
                if (me.input.isKeyPressed(directions[(i + 1) % 4]) ||
                    me.input.isKeyPressed(directions[(i + 3) % 4])) {
                    self.vel[axis] *= self.walk_angle;
                }

                if (i < 2) {
                    self.vel[axis] = -self.vel[axis];
                }
            }
            else {
                self.held[i] = false;
                if (self.last_held[i]) {
                    self.dir = c.RESET_DIR;
                }
            }

            self.last_held[i] = self.held[i];
        });

        // Move entity and detect collisions.
        self.updateMovement();

        // Update animation if necessary.
        if ((self.vel.x != 0) || (self.vel.y != 0)) {
            // Update object animation.
            self.parent();
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
