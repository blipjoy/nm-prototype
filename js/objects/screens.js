/* Screen object supporting layer-animation */
game.AnimatedScreen = me.ScreenObject.extend({
    layers : [],

    animationspeed : me.sys.fps / 10,

    framecount : 0,

    frameidx : 0,

    init : function init(animationspeed) {
        this.parent(true);
        this.persist = true; // FIXME: https://github.com/obiot/melonJS/issues/75
        this.animationspeed = animationspeed || this.animationspeed;
    },

    update : function update() {
        if (game.wantsResort) {
            game.wantsResort = false;
            me.game.sort.defer(game.sort);
        }

        if (!this.layers) {
            return false;
        }

        if (++this.framecount > this.animationspeed) {
            this.framecount = 0;

            if (this.frameidx < this.layers.length) {
                this.layers[this.frameidx].visible = false;
            }
            ++this.frameidx;
            this.frameidx %= (this.layers.length + 1);
            if (this.frameidx < this.layers.length) {
                this.layers[this.frameidx].visible = true;
            }

            return true;
        }
        return false;
    },

    onLevelLoaded : function onLevelLoaded() {
        var self = this;
        self.layers = [];

        var layers = me.game.currentLevel.getLayers();
        layers.forEach(function forEach(layer, idx) {
            if (layer.name.toLowerCase().indexOf("animated") >= 0) {
                if (self.layers) {
                    layer.visible = false;
                }
                self.layers.push(layer);
            }
        });
    }
});

/* Main game */
game.PlayScreen = game.AnimatedScreen.extend({
    loading : false,

    onLevelLoaded : function onLevelLoaded(settings) {
        var self = this;

        self.parent();
        self.loading = false;

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
    },

    loadLevel : function loadLevel(settings) {
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

    onResetEvent : function onResetEvent() {
        this.parent();

        // Initialize some stuff.
        game.HUD();
        game.installExitHandler();

        // Load the level.
        this.loadLevel({
            to          : "island",
            music       : "pink_and_lively",
            fadeOut     : "black",
            duration    : 250
        });
    },

    onDestroyEvent : function onDestroyEvent() {
        // Remove the HUD.
        me.game.remove(game.HUD);
    }
});
