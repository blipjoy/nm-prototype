/* Screen object supporting layer-animation */
game.AnimatedScreen = me.ScreenObject.extend({
    "layers" : [],

    "animationspeed" : me.sys.fps / 10,

    "framecount" : 0,

    "frameidx" : 0,

    "init" : function init(animationspeed) {
        this.parent(true);
        this.isPersistent = true;
        this.animationspeed = animationspeed || this.animationspeed;
    },

    "update" : function update() {
        if (game.wantsResort) {
            game.wantsResort = false;
            me.game.sort.defer(game.sort);
        }

        if (!this.layers.length) {
            return false;
        }

        if (++this.framecount > this.animationspeed) {
            this.framecount = 0;

            this.layers[this.frameidx].visible = false;
            ++this.frameidx;
            this.frameidx %= this.layers.length;
            this.layers[this.frameidx].visible = true;

            return true;
        }
        return false;
    },

    "onLevelLoaded" : function onLevelLoaded() {
        var self = this;
        self.layers = [];

        var layers = me.game.currentLevel.getLayers();
        layers.forEach(function forEach(layer, idx) {
            if (layer.name.toLowerCase().indexOf("animated") >= 0) {
                if (self.layers.length) {
                    layer.visible = false;
                }
                self.layers.push(layer);
            }
        });
    }
});

/* Informational screen */
game.InfoScreen = me.ScreenObject.extend({
    "invalidate" : true,

    "init" : function init(messages) {
        this.parent(true);
        this.messages = messages;
        this.font = new me.Font("bold Tahoma", 20, "#fff");
    },

    "update" : function update() {
        if (me.input.isKeyPressed("action")) {
            me.state.change(me.state.PLAY);
        }

        if (this.invalidate === true) {
            this.invalidate = false;
            return true;
        }

        return false;
    },

    "draw" : function draw(context) {
        var self = this;

        context.fillStyle = "#000";
        context.fillRect(0, 0, c.WIDTH, c.HEIGHT);

        var w = 0;
        self.messages.forEach(function forEach(message) {
            w = Math.min(Math.max(w, self.font.measureText(context, message).width), c.WIDTH);
        });

        var x = (c.WIDTH - w) / 2;
        var y = (c.HEIGHT - self.messages.length * 20) / 2;

        self.messages.forEach(function forEach(message) {
            self.font.draw(context, message, x, y);
            y += 20;
        });
    }
});

/* Main game */
game.PlayScreen = game.AnimatedScreen.extend({
    "loading" : false,

    "onLevelLoaded" : function onLevelLoaded(settings) {
        this.parent();
        this.loading = false;

        game.rachel = me.game.getEntityByName("rachel")[0];

        if (settings.location) {
            var p = settings.location.split(",").map(function map(value) {
                return +value.trim();
            });
            game.rachel.body.setPos(cp.v(p[0], c.HEIGHT - p[1]));
        }

        if (settings.dir) {
            game.rachel.dir_name = settings.dir;
            game.rachel.setCurrentAnimation("stand_" + settings.dir);
        }

        if (settings.music) {
            me.audio.stopTrack();
            me.audio.playTrack(settings.music);
        }

        // Use `in` operator, so we can use 0, if we want. ;)
        if ("animationspeed" in me.game.currentLevel) {
            this.animationspeed = me.game.currentLevel.animationspeed;
        }
    },

    "loadLevel" : function loadLevel(settings) {
        var fade;
        var self = this;

        if (self.loading) {
            return;
        }
        self.loading = true;

        // Handle outbound transitions.
        fade = settings.fade || settings.fadeIn;
        if (fade) {
            me.game.viewport.fadeIn(fade, +settings.duration || 250, fadeComplete);
        }
        else {
            fadeComplete();
        }

        function fadeComplete() {
            // Remove all Chipmunk bodies and shapes.
            cm.removeAll();

            // When level loads, start music and move Rachel to the proper location.
            me.game.onLevelLoaded = function onLevelLoaded() {
                self.onLevelLoaded(settings);
            };

            // Load the first level.
            me.levelDirector.loadLevel(settings.to);

            // Handle transitions.
            fade = settings.fade || settings.fadeOut;
            if (fade) {
                me.game.viewport.fadeOut(fade, +settings.duration || 250);
            }
        }
    },

    "onResetEvent" : function onResetEvent() {
        this.parent();

        // Initialize some stuff.
        game.HUD();
        game.installCoinHandler();
        game.installExitHandler();

        // Load the level.
        this.loadLevel({
            "to"        : "island",
            "music"     : "pink_and_lively",
            "fadeOut"   : "black",
            "duration"  : 250
        });
    },

    "onDestroyEvent" : function onDestroyEvent() {
        // Remove the HUD.
        me.game.remove(game.HUD);
    }
});
