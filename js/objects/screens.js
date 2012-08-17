/*
 * Neverwell Moor, a fantasy action RPG
 * Copyright (C) 2012  Jason Oster
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* Screen object supporting layer-animation */
game.AnimatedScreen = me.ScreenObject.extend({
    "animations" : {},
    "keys" : [],

    "init" : function init(animationspeed) {
        this.parent(true);
        this.isPersistent = true;
        this.animationspeed = animationspeed || this.animationspeed;
    },

    "update" : function update() {
        var isDirty = false;
        var self = this;

        if (game.wantsResort) {
            game.wantsResort = false;
            me.game.sort.defer(game.sort);
        }

        if (!self.keys.length) {
            return false;
        }

        self.keys.forEach(function forEach(key) {
            var animation = self.animations[key];
            if (++animation.count > animation.speed) {
                animation.count = 0;

                animation.layers[animation.idx].visible = false;
                ++animation.idx;
                animation.idx %= animation.layers.length;
                animation.layers[animation.idx].visible = true;

                isDirty = true;
            }
        });

        return isDirty;
    },

    "onLevelLoaded" : function onLevelLoaded() {
        var self = this;
        self.animations = {};
        self.keys = [];

        // Use `in` operator, so we can use 0, if we want. ;)
        var speed = (("animationspeed" in me.game.currentLevel) ?
            me.game.currentLevel.animationspeed :
            (me.sys.fps / 10));

        var layers = me.game.currentLevel.getLayers();
        layers.forEach(function forEach(layer, idx) {
            if (layer.name.toLowerCase().indexOf("animated ") === 0) {
                var key = layer.name.substr(9).replace(/\d+$/, "").trim();

                if (self.animations[key]) {
                    layer.visible = false;
                }
                else {
                    self.keys.push(key);
                    self.animations[key] = {
                        "speed" : me.game.currentLevel[key + " speed"] || speed,
                        "layers" : [],
                        "count" : 0,
                        "idx" : 0
                    };
                }
                self.animations[key].layers.push(layer);
            }
        });
    }
});

/* Informational screen */
game.InfoScreen = me.ScreenObject.extend({
    // True when fading.
    "fading" : false,

    // Which page to view.
    "currentPage" : 0,

    "init" : function init(pages, state, fade, duration, notify) {
        this.parent(true);
        this.pages = pages;
        this.font = new me.Font("Verdana", 16, "#fff");
        this.state = state || me.state.MENU;
        this.fade = fade;
        this.duration = duration || 250;
        this.notify = notify;
    },

    "onResetEvent" : function onResetEvent() {
        var self = this;
        self.currentPage = 0;

        if (this.notify) {
            me.event.publish("notify", [ "Press the action key (Enter or Space) to advance to the next page." ]);
            me.event.publish("notify", [ "Press the skip key (ESC) to skip the story." ]);
        }

        if (self.fade) {
            self.fading = true;
            me.game.viewport.fadeOut(self.fade, self.duration, function fadeComplete() {
                self.fading = false;
            });
        }
    },

    "update" : function update() {
        var self = this;
        var skip = false;

        if (!self.fading && (me.input.isKeyPressed("action") || me.input.isKeyPressed("skip"))) {
            if (me.input.keyStatus("skip")) {
                skip = true;
            }

            function nextPage() {
                if (skip || (++self.currentPage >= self.pages.length)) {
                    self.fading = false;
                    me.state.change(self.state);
                }
                else if (self.fade) {
                    self.fading = true;
                    me.game.viewport.fadeOut(self.fade, self.duration, function fadeComplete() {
                        self.fading = false;
                    });
                }
            }

            if (self.fade) {
                self.fading = true;
                me.game.viewport.fadeIn(self.fade, self.duration, nextPage);
            }
            else {
                nextPage();
            }
        }

        return self.fading;
    },

    "draw" : function draw(context) {
        var self = this;

        context.fillStyle = "#000";
        context.fillRect(0, 0, c.WIDTH, c.HEIGHT);

        if (self.currentPage < self.pages.length) {
            var page = self.pages[self.currentPage];

            // Calculate the longest text width.
            var w = 0;
            page.messages.forEach(function forEach(message) {
                w = Math.min(Math.max(w, self.font.measureText(context, message).width), c.WIDTH);
            });

            var x = (c.WIDTH - w) / 2;
            var y = (c.HEIGHT - page.messages.length * 20) / 2;
            page.messages.forEach(function forEach(message) {
                self.font.draw(context, message, x, y);
                y += 20;
            });
        }
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

            switch (settings.to) {
                case "rachels_house":
                    if (!game.stat.load("tutorial2")) {
                        me.event.publish("notify", [ "That's Jessica. We should say hi using the action key!" ]);
                        game.stat.save("tutorial2", true);
                    }
                    break;

                case "earth":
                    if (!game.stat.load("tutorial3")) {
                        me.event.publish("notify", [ "We should talk to some more people. Maybe we could help them with something!" ]);
                        me.event.publish("notify", [ "If you hold Shift, I promise to hurry as fast as I can!" ]);
                        game.stat.save("tutorial3", true);
                    }
                    break;

                case "general_store":
                    if (!game.stat.load("tutorial4")) {
                        me.event.publish("notify", [ "Let's look around a bit; there might be something here we can buy." ]);
                        game.stat.save("tutorial4", true);
                    }
                    break;

            }

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

        if (!game.stat.load("tutorial1")) {
            me.event.publish("notify", [ "Hi, I'm Rachel. You can show me where to go using the arrow keys." ]);
            me.event.publish("notify", [ "Or if you prefer, the WASD keys also work." ]);
            me.event.publish("notify", [ "Open the chest with an action key. There may be something useful inside!" ]);
            game.stat.save("tutorial1", true);
        }

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
    "fadeColor" : "black",

    "init" : function init() {
        this.parent(true);
        this.isPersistent = true;

        this.logo = game.getImage("logo");
        this.font = new me.Font("Verdana", 16, "#fff");
    },

    "onLevelLoaded" : function onLevelLoaded(settings) {
        var self = this;
        self.parent({
            "to" : settings.to
        });

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
        self.to_x = new me.Tween(me.game.viewport.pos)
            .to({
                "x" : ~~(x + (Math.random() * 800) - 400).clamp(0, w)
            }, 15000)
            .onUpdate(function onUpdate(value) {
                me.game.viewport.pos.x = me.game.viewport.pos.x.round();
            })
            .easing(me.Tween.Easing.Quadratic.EaseInOut)
            .start();

        self.to_y = new me.Tween(me.game.viewport.pos)
            .to({
                "y" : ~~(y + (Math.random() * 800) - 400).clamp(0, h)
            }, 15000)
            .onUpdate(function onUpdate(value) {
                me.game.viewport.pos.y = me.game.viewport.pos.y.round();
            })
            .onComplete(function onComplete() {
                // LET'S DO IT AGAIN!
                self.loadLevel({
                    "to"        : "earth",
                    "fade"      : "black",
                    "duration"  : 1000
                });
            })
            .easing(me.Tween.Easing.Quadratic.EaseInOut)
            .start();

        // Make happy noises.
        if (settings.music) {
            me.audio.stopTrack();
            me.audio.playTrack(settings.music);
        }
    },

    "loadLevel" : function loadLevel(settings) {
        var self = this;
        var fade = settings.fade || settings.fadeOut;

        if (self.loading) {
            return;
        }
        self.loading = true;

        self.fader = -1;

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
            fade = settings.fade || settings.fadeIn;
            if (fade) {
                self.fadeColor = fade;
                self.fader = 1;

                // Don't reuse me.viewport.fade* : We want the logo to remain visible.
                var tween = new me.Tween(self)
                    .to({
                        "fader": 0
                    }, settings.duration)
                    .onComplete(function onComplete() {
                        self.fader = -1;
                    })
                    .easing(me.Tween.Easing.Sinusoidal.EaseIn)
                    .start();
            }
        }

        function fadeOut() {
            // Handle outbound transitions.
            if (fade) {
                // Don't reuse me.viewport.fade* : We want the logo to remain visible.
                self.fadeColor = fade;
                self.fader = 0;
                var tween = new me.Tween(self)
                    .to({
                        "fader" : 1
                    }, settings.duration)
                    .onComplete(fadeComplete)
                    .easing(me.Tween.Easing.Sinusoidal.EaseIn)
                    .start();
            }
            else {
                fadeComplete();
            }
        }

        if (fade && settings.vp) {
            // Use viewport fade here to fade the logo.
            self.fader = 0;
            me.game.viewport.fadeOut(fade, settings.vp, fadeOut);
        }
        else {
            fadeOut();
        }
    },

    "onResetEvent" : function onResetEvent() {
        // Load the level.
        this.loadLevel({
            "to"        : "earth",
            "music"     : "del_erad",
            "fade"      : "black",
            "duration"  : 2000,
            "vp"        : 1000
        });
    },

    "update" : function update() {
        if (me.input.isKeyPressed("action") && (this.fader === -1)) {
            this.to_x.stop();
            this.to_y.stop();
            me.game.viewport.fadeIn("black", 1000, function () {
                me.state.change(c.STATE_INTRO);
            });
        }
        return this.parent() || (this.fader !== -1);
    },

    "draw" : function draw(context) {
        this.parent(context);

        if (this.fader !== -1) {
            context.save();
            context.fillStyle = this.fadeColor;
            context.globalAlpha = this.fader;
            context.fillRect(0, 0, c.WIDTH, c.HEIGHT);
            context.restore();
        }

        var x = (c.WIDTH - this.logo.width) / 2;
        var y = (c.HEIGHT - this.logo.height - 80) / 2;
        context.drawImage(this.logo, x, y);

        if (this.fader === -1) {
            var message = "Press [Enter] or [Space]";
            var w = Math.min(this.font.measureText(context, message).width, c.WIDTH);

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

/* Credits screen */
game.CreditsScreen = me.ScreenObject.extend({
    "done" : false,

    "y" : 0,
    "size" : 13,

    "canvas" : null,
    "buffer" : null,

    "init" : function init(pages, state, fade, duration) {
        var self = this;
        self.parent(true);
        self.font = new me.Font("Monaco, Courier New", this.size, "#aaa");

        // Render text to buffer canvas.
        self.canvas = document.createElement("canvas");
        self.buffer = self.canvas.getContext("2d");

        var w = 0;
        game.credits.forEach(function forEach(line) {
            w = Math.min(Math.max(w, self.font.measureText(self.buffer, line).width), c.WIDTH);
        });
        var h = game.credits.length * this.size;
        var x = ~~((c.WIDTH - w) / 2);
        var y = 0;

        self.canvas.width = c.WIDTH;
        self.canvas.height = h;

        self.buffer.fillStyle = "#222";
        self.buffer.fillRect(0, 0, c.WIDTH, h);

        game.credits.forEach(function forEach(line) {
            self.font.draw(self.buffer, line, x, y);
            y += self.size;
        });
    },

    "onResetEvent" : function onResetEvent() {
        this.done = false;
        this.y = 0;

        me.audio.stopTrack();
        me.audio.playTrack("del_erad");

        me.game.viewport.fadeOut("black", 3000);
    },

    "update" : function update() {
        this.y += 0.5;

        var max = this.height - c.HEIGHT;
        if (this.y >= max) {
            this.done = true;
            this.y = max;
        }

        return !this.done;
    },

    "draw" : function draw(context) {
        context.drawImage(
            this.canvas,
            0, ~~this.y,
            c.WIDTH, c.HEIGHT,
            0, 0,
            c.WIDTH, c.HEIGHT
        );
    }
});
