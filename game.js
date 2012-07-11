/* Constants */
var c = {
    get DOWN() {
        return 0;
    },

    get RIGHT() {
        return 1;
    },

    get LEFT() {
        return 2;
    },

    get UP() {
        return 3;
    }
};

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
    dir: c.DOWN,
    standing: true,

    init: function (x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Set the walking speed.
        this.setVelocity(1.5, 1.5);

        // Set animations.
        this.addAnimation("walk_down", [ 0, 1, 2, 3 ]);
        this.addAnimation("walk_right", [ 4, 5, 6, 7 ]);
        this.addAnimation("walk_left", [ 8, 9, 10, 11 ]);
        this.addAnimation("walk_up", [ 12, 13, 14, 15 ]);

        // Do not handle gravity in a top-down perspective.
        this.gravity = 0;

        // Set the display to follow our position on both axis.
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    update: function () {
        // Walking controls.
        if (me.input.isKeyPressed("up")) {
            if (this.dir != c.UP) {
                this.dir = c.UP;
                this.setCurrentAnimation("walk_up");
            }
            this.standing = false;
            this.vel.y -= this.accel.y * me.timer.tick
        }
        else if (me.input.isKeyPressed("down")) {
            if (this.dir != c.DOWN) {
                this.dir = c.DOWN;
                this.setCurrentAnimation("walk_down");
            }
            this.standing = false;
            this.vel.y += this.accel.y * me.timer.tick
        }
        else {
            this.vel.y = 0;
        }

        if (me.input.isKeyPressed("left")) {
            if (this.dir != c.LEFT) {
                this.dir = c.LEFT;
                this.setCurrentAnimation("walk_left");
            }
            this.standing = false;
            this.vel.x -= this.accel.x * me.timer.tick
        }
        else if (me.input.isKeyPressed("right")) {
            if (this.dir != c.RIGHT) {
                this.dir = c.RIGHT;
                this.setCurrentAnimation("walk_right");
            }
            this.standing = false;
            this.vel.x += this.accel.x * me.timer.tick
        }
        else {
            this.vel.x = 0;
        }

        // Check & update player movement.
        this.updateMovement();

        // Update animation if necessary.
        if ((this.vel.x != 0) || (this.vel.y != 0)) {
            // Update object animation.
            this.parent(this);
            return true;
        }
        else if (!this.standing) {
            this.standing = true;
            this.setAnimationFrame(0);
            return true;
        }

        return false;
    }
});

/* Bootstrap */
window.onReady(function() {
    game.onload();
});
