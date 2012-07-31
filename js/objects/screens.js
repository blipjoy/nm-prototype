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
    // True when fading.
    "fading" : false,

    "init" : function init(messages, state, fade, duration) {
        this.parent(true);
        this.messages = messages;
        this.font = new me.Font("bold Tahoma", 20, "#fff");
        this.state = state || me.state.MENU;
        this.fade = fade;
        this.duration = duration || 250;
    },

    "onResetEvent" : function onResetEvent() {
        var self = this;

        if (self.fade) {
            self.fading = true;
            me.game.viewport.fadeOut(self.fade, self.duration, function fadeComplete() {
                self.fading = false;
            });
        }
    },

    "update" : function update() {
        var self = this;

        if (me.input.isKeyPressed("action") && !self.fading) {
            if (self.fade) {
                self.fading = true;
                me.game.viewport.fadeIn(self.fade, self.duration, function fadeInComplete() {
                    me.state.change(self.state);
                });
            }
            else {
                me.state.change(self.state);
            }
        }

        return self.fading;
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
        this.loading = false;
        this.parent();

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
        // Initialize some stuff.
        game.installHUD();
        game.installCoinHandler();
        game.installExitHandler();
        game.installBaddieHandler();

        // Load the level.
        if (c.DEBUG) {
            this.loadLevel({
                "to"        : "island",
                "music"     : "pink_and_lively",
                "fadeOut"   : "black",
                "duration"  : 1000
            });
        }
        else {
            this.loadLevel({
                "to"        : "rachels_room",
                "music"     : "bells",
                "fadeOut"   : "black",
                "duration"  : 1000
            });
        }
    },

    "onDestroyEvent" : function onDestroyEvent() {
        // Remove the HUD.
        if (game.HUD) {
            me.game.remove(game.HUD);
        }
    }
});

/* Title screen */
game.TitleScreen = game.PlayScreen.extend({
    "fader" : -1,

    "init" : function init() {
        this.parent(true);
        this.isPersistent = true;

        this.logo = game.getImage("logo");
        this.font = new me.Font("bold Tahoma", 20, "#fff");
    },

    "onLevelLoaded" : function onLevelLoaded(settings) {
        var self = this;

        self.loading = false;

        // Remove Rachel; no player control during title screen.
        var rachel = me.game.getEntityByName("rachel")[0];
        me.game.remove(rachel, true);
        var space = cm.getSpace();
        rachel.body.eachShape(function remove_shape(shape) {
            space.removeShape(shape);
        });
        space.removeBody(rachel.body);

        // Choose a random starting position.
        var w = me.game.currentLevel.width * me.game.currentLevel.tilewidth - c.WIDTH;
        var h = me.game.currentLevel.height * me.game.currentLevel.tileheight - c.HEIGHT;

        var x = ~~(Math.random() * w);
        var y = ~~(Math.random() * h);
        me.game.viewport.reset(x, y);

        // Choose a random destination position.
        self.to_x = new me.Tween(me.game.viewport.pos).to({
            "x" : ~~(x + (Math.random() * 800) - 400).clamp(0, w)
        }, 15000).onUpdate(function (value) {
            me.game.viewport.pos.x = ~~me.game.viewport.pos.x;
        });
        self.to_x.easing(me.Tween.Easing.Quadratic.EaseInOut);
        self.to_x.start();

        self.to_y = new me.Tween(me.game.viewport.pos).to({
            "y" : ~~(y + (Math.random() * 800) - 400).clamp(0, h)
        }, 15000).onUpdate(function (value) {
            me.game.viewport.pos.y = ~~me.game.viewport.pos.y;
        }).onComplete(function () {
            // LET'S DO IT AGAIN!
            self.loadLevel({
                "to"        : "earth",
                "fade"      : "black",
                "duration"  : 1000
            });
        });
        self.to_y.easing(me.Tween.Easing.Quadratic.EaseInOut);
        self.to_y.start();

        // Make happy noises.
        if (settings.music) {
            me.audio.stopTrack();
            me.audio.playTrack(settings.music);
        }
    },

    "loadLevel" : function loadLevel(settings) {
        var fade;
        var self = this;

        if (self.loading) {
            return;
        }
        self.loading = true;

        self.fader = -1;

        // Handle outbound transitions.
        fade = settings.fade || settings.fadeIn;
        if (fade) {
            // Don't reuse me.viewport.fade* : We want the logo to remain visible.
            self.fadeColor = fade;
            self.fader = 0;
            var tween = new me.Tween(self).to({
                "fader" : 1
            }, settings.duration).onComplete(fadeComplete);
            tween.easing(me.Tween.Easing.Sinusoidal.EaseIn);
            tween.start();
        }
        else {
            fadeComplete();
        }

        function fadeComplete() {
            self.fader = -1;

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
                self.fadeColor = fade;
                self.fader = 1;

                function fadeOut() {
                    // Don't reuse me.viewport.fade* : We want the logo to remain visible.
                    var tween = new me.Tween(self).to({
                        "fader": 0
                    }, settings.duration).onComplete(function () {
                        self.fader = -1;
                    });
                    tween.easing(me.Tween.Easing.Sinusoidal.EaseIn);
                    tween.start();
                }

                if (settings.vp) {
                    // Use viewport fade here to fade the logo.
                    me.game.viewport.fadeOut(fade, settings.vp, fadeOut);
                }
                else {
                    fadeOut();
                }
            }
        }
    },

    "onResetEvent" : function onResetEvent() {
        // Load the level.
        this.loadLevel({
            "to"        : "earth",
            "music"     : "del_erad",
            "fadeOut"   : "black",
            "duration"  : 5000,
            "vp"        : 1000
        });
    },

    "update" : function update() {
        if (me.input.isKeyPressed("action") && (this.fader === -1)) {
            this.to_x.stop();
            this.to_y.stop();
            me.game.viewport.fadeIn("black", 1000, function () {
                me.state.change(me.state.PLAY);
            });
        }
        return this.parent() || (this.fader !== -1);
    },

    "draw" : function draw(context) {
        this.parent(context);

        if (this.fader !== -1) {
            context.fillStyle = this.fadeColor;
            context.globalAlpha = this.fader;
            context.fillRect(0, 0, c.WIDTH, c.HEIGHT);
            context.globalAlpha = 1.0;
        }

        var x = (c.WIDTH - this.logo.width) / 2;
        var y = (c.HEIGHT - this.logo.height - 80) / 2;
        context.drawImage(this.logo, x, y);

        var message = "Press [Enter] or [Space]";
        var w = Math.min(this.font.measureText(context, message).width, c.WIDTH);

        if (this.fader === -1) {
            context.save();
            context.shadowColor = "#000";
            context.shadowBlur = 2;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            this.font.draw(context, message, (c.WIDTH - w) / 2, (c.HEIGHT + this.logo.height) / 2);
            context.restore();
        }
    }
});
