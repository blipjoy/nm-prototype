/* Dialog box */
game.dialog = function dialog(script, callback) {
    var background = me.loader.getImage("dialog");
    var font = new me.Font("Tahoma", 18, "#eee");

    game.modal = true;

    var dialog_box = new game.DialogObject(30, 480 - background.height - 15, background, script, 555, 71, 12, 12, font, "action", callback);
    me.game.add(dialog_box);
    me.game.sort.defer(game.sort);
};

/* The almighty HUD. Keeps track of stats; not just a renderer! */
game.HUD = function HUD() {
    var items;

    // Override the HUD.update method to perform animation.
    var HUD = me.HUD_Object.extend({
        init : function init() {
            this.parent.apply(this, arguments);
            this.persist = true; // FIXME: https://github.com/obiot/melonJS/issues/75
        },

        update : function update() {
            var result = [];
            Object.keys(items).forEach(function (key) {
                result.push(items[key].request_update());
            })

            if (result.some(function (x) { return x; })) {
                this.HUD_invalidated = true;
            }
            return this.HUD_invalidated;
        }
    });

    var HUD_Item = me.HUD_Item.extend({
        request_update : function request_update() {
            return false;
        }
    });

    // Coins counter.
    var coins = HUD_Item.extend({
        init : function init(x, y, value) {
            this.parent(x, y, value);
            this.gold_font = new me.Font("Monaco", 20, "#DFBD00");
            this.silver_font = new me.Font("Monaco", 20, "#C4B59F");
            this.image = new me.AnimationSheet(0, 0, me.loader.getImage("coin_gold"), 18, 21);
            this.image.animationspeed = 4;
        },

        request_update : function request_update() {
            return this.image.update();
        },

        draw : function draw(context, x, y) {
            // Draw animated coin.
            context.drawImage(
                this.image.image,
                this.image.offset.x, this.image.offset.y,
                this.image.width, this.image.height,
                this.pos.x + x + 2, this.pos.y + y + 2,
                this.image.width, this.image.height
            );

            // Break value into strings.
            var gold_value = Math.floor(this.value / 100) + ".";
            var silver_value = (this.value % 100);
            silver_value = ((silver_value < 10) ? "0" : "") + silver_value;

            // Calculate width of gold part.
            var gold_width = this.gold_font.measureText(context, gold_value).width;

            // Draw coin counter.
            this.gold_font.draw(context, gold_value, this.pos.x + x + 25, this.pos.y + y + this.gold_font.height);
            this.silver_font.draw(context, silver_value, this.pos.x + x + 25 + gold_width, this.pos.y + y + this.silver_font.height);
        }
    });

    // Health display.
    var hearts = HUD_Item.extend({
        init : function init(x, y, value) {
            var self = this;
            self.parent(x, y, value);
            self.hearts = [];
            [ "heart_empty", "heart_half", "heart_full" ].forEach(function (value, i) {
                self.hearts[i] = me.loader.getImage(value);
            });
        },

        request_update : function request_update() {
            return items.containers.updated;
        },

        draw : function draw(context, x, y) {
            var image;
            var count = items.containers.value
            var value = this.value;

            x += this.pos.x;
            y += this.pos.y;
            for (var i = 0; i < count; i++) {
                if (i < value) {
                    image = 2;
                }
                else if (value % 1) {
                    image = 1;
                    value = Math.floor(value);
                }
                else {
                    image = 0;
                }

                context.drawImage(this.hearts[image], x, y);
                x += this.hearts[image].width + 2;
            }
        }
    })

    // Create a HUD container.
    // NOTE: This turns game.HUD into a singleton!
    game.HUD = new HUD(0, 0, 640, 50);
    me.game.add(game.HUD);

    // Create a list of items to add to the HUD.
    items = {
        coins : new coins(0, 0),
        containers : new HUD_Item(0, 25, 3),
        hearts : new hearts(2, 25, 3)
    };

    // Add them all.
    Object.keys(items).forEach(function (key) {
        game.HUD.addItem(key, items[key]);
    });

    me.game.sort(game.sort);
};


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
        layers.forEach(function (layer, idx) {
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
    onLevelLoaded : function onLevelLoaded(level) {
        this.parent();

        var music;
        switch (level) {
            case "island":
                music = "pink_and_lively";
                break;

            case "rachels_room":
                music = "bells";
                break;

            default:
                return;
        }

        me.audio.stopTrack();
        me.audio.playTrack(music);
    },

    loadLevel : function loadLevel(level_id) {
        var self = this;

        cm.removeAll();

        // Start music when level loads.
        me.game.onLevelLoaded = (function (level) {
            return function () {
                return self.onLevelLoaded(level);
            };
        })(level_id);

        // Load the first level.
        me.levelDirector.loadLevel(level_id);
    },

    onResetEvent : function onResetEvent() {
        this.parent();

        // Initialize the HUD.
        game.HUD();

        // Load the level.
        this.loadLevel("island");
    },

    onDestroyEvent : function onDestroyEvent() {
        // Remove the HUD.
        me.game.remove(game.HUD);
    }
});

/* A Chipmunk-controlled entity */
game.Chipmunk = me.AnimationSheet.extend({
    init : function init(x, y, settings) {
        this.hWidth = ~~(settings.spritewidth / 2);
        this.hHeight = ~~(settings.spriteheight / 2);

        this.body = cm.getSpace().addBody(new cp.Body(1, Infinity));
        this.body.setPos(cp.v(x + this.hWidth, c.HEIGHT - y - this.hHeight));
        var shape = cm.getSpace().addShape(cp.BoxShape(this.body, settings.spritewidth, settings.spriteheight));

        shape.data = {
            GUID : settings.GUID,
            name : settings.name
        };
        shape.setLayers(c.LAYER_SPRITE | c.LAYER_WALL);

        this.parent(
            x,
            y,
            (typeof(settings.image) === "string") ? me.loader.getImage(settings.image) : settings.image,
            settings.spritewidth,
            settings.spriteheight
        );
    },

    adjustBoxShape : function adjustBoxShape(x, y, w, h) {
        this.body.shapeList[0].data.offset = {
            x : x,
            y : y
        };
        this.body.shapeList[0].setVerts(cm.bb2verts(
            -(~~(w / 2) - x),
            ~~(h / 2) - y,
            w,
            h
        ), cp.vzero);
    },

    update : function update() {
        // Update melonJS state with Chipmunk body state.
        this.pos.x = ~~(this.body.p.x - this.hWidth);
        this.pos.y = ~~(c.HEIGHT - this.body.p.y - this.hHeight);

        return this.parent();
    }
});

/**
 * Generic sprite composition manager.
 *
 * Instances of this class look just like an ObjectEntity to melonJS.
 * Except it does not have public user functions for handling movement or
 * physics. (That's Chipmunk-js's job!)
 *
 * If a `compose` property is included on the object (in Tiled), this class
 * will parse it as a composition list, and create new child objects from the
 * composition items within the list.
 *
 * The format of a composition list is an array of objects. Each object must
 * contain at least a `name` key. If the `name` === this object's name, no
 * further keys are required. (This allows specifying the rendering order.)
 * Otherwise, ALL of the following keys are required:
 *
 * - name: Name of the sprite to composite.
 * - class: Class for the sprite to composite. (Usually "me.AnimationSheet")
 * - image: Image reference to use for the sprite.
 * - spritewidth: Width (in pixels) of each frame within the animation sheet.
 * - spriteheight: Height (in pixels) of each frame within the animation sheet.
 *
 * Any arbitrary keys can be included on the composition item; the full item is
 * passed to the composited sprite's constructor, in case it needs additional
 * configuration info from Tiled (including its OWN compositions).
 *
 * If a composition list does NOT reference this object's name, this object will
 * be rendered before the composed objects. To change the rendering order, you
 * MUST reference this object's name within the composition list.
 */
game.Sprite = game.Chipmunk.extend({
    init : function init(x, y, settings) {
        var self = this;
        var GUID = me.utils.createGUID();

        settings.GUID = GUID;

        // Create this object.
        self.parent(x, y, settings);

        // Set some things that the engine wants.
        self.GUID = GUID;
        self.name = settings.name ? settings.name.toLowerCase() : "";
        self.pos.set(x, me.game.currentLevel ? (y + (settings.height || 0) - self.height) : y);
        self.isEntity = true;

        // Compose additional sprites.
        if (settings.compose) {
            try {
                var compose = JSON.parse(settings.compose);
            }
            catch (e) {
                throw "Composition setting error. JSON PARSE: " + e + " in " + settings.compose;
            }
            self.composition = [];
            self.children = {};

            if (!Array.isArray(compose)) {
                throw "Composition setting error. NOT AN ARRAY: " + JSON.stringify(item);
            }

            self.compose = compose;
            self.compose.forEach(function (item) {
                // Validate composition item format.
                if (!game.isObject(item)) {
                    throw "Composition setting error. NOT AN OBJECT: " + JSON.stringify(item);
                }

                // Special case for defining rendering order.
                if (item.name === self.name) {
                    self.composition.push(item.name);
                    return;
                }

                // Require keys.
                [ "name", "class", "image", "spritewidth", "spriteheight" ].forEach(function (key) {
                    if (!item.hasOwnProperty(key)) {
                        throw "Composition setting error. MISSING KEY `" + key + "`: " + JSON.stringify(item);
                    }
                });

                function getClass(str) {
                    var node = window;
                    var tokens = str.split(".");
                    tokens.forEach(function (token) {
                        if (typeof(node) !== "undefined") {
                            node = node[token];
                        }
                    });
                    return node;
                }

                // `class` should usually be "me.AnimationSheet", but can be anything.
                self.children[item.name] = new (getClass(item.class))(
                    x,
                    y,
                    me.loader.getImage(item.image),
                    item.spritewidth,
                    item.spriteheight,
                    self,
                    item
                );
                self.composition.push(item.name);
            });

            // Render this object first, if it is not referenced in the composition list.
            if (!(self.name in self.composition)) {
                self.composition.unshift(self.name);
            }
        }
    },

    interact : function interact() {
        console.warn("Missing interaction for " + this.name);
    },

    update : function update() {
        var self = this;
        var results = [];

        // Update this sprite animation.
        results.push(self.parent());

        // Update composited sprite animations.
        if (self.composition) {
            self.composition.forEach(function (name) {
                if (name !== self.name) {
                    results.push(self.children[name].update());
                }
            });
        }

        // Return true if any of the sprites want to be rendered.
        return results.some(function (result) {
            return result;
        });
    },

    draw : function draw(context) {
        if (!this.composition) {
            this.parent(context);
            return;
        }

        // Render all composed sprites in the proper order.
        var self = this;
        self.composition.forEach(function (name) {
            if (name === self.name) {
                self.parent(context);
            }
            else {
                self.children[name].draw(context);
            }
        });
    }
});

/* Shadow sprites */
game.Shadow = me.AnimationSheet.extend({
    init : function init(x, y, image, w, h, owner) {
        this.parent(x, y, image, w, h);

        this.owner = owner;
        this.updatePosition();
    },

    updatePosition : function updatePosition() {
        this.pos.x = this.owner.pos.x + ~~(this.owner.width / 2) - ~~(this.width / 2);
        this.pos.y = this.owner.pos.y + this.owner.height - ~~(this.height * 0.8);
    },

    update : function update() {
        this.updatePosition();
        return false;
    }
});

/* Eyes ... that blink! */
game.BlinkingEyes = me.AnimationSheet.extend({
    init : function init(x, y, image, w, h, owner) {
        this.parent(x, y, image, w, h);

        this.owner = owner;
        this.updatePosition();

        this.addAnimation("walk_down",  [ 0, 1 ]);
        this.addAnimation("walk_right", [ 2, 3 ]);
        this.addAnimation("walk_left",  [ 4, 5 ]);
        this.addAnimation("walk_up",    [ 6, 7 ]);
        this.setCurrentAnimation("walk_down", this.resetAnimation);
        this.animationspeed = 4;
        this.resetAnimation();
    },

    resetAnimation : function resetAnimation() {
        this.animationpause = true;
    },

    updatePosition : function updatePosition() {
        this.pos.x = this.owner.pos.x + 9;
        this.pos.y = this.owner.pos.y + 18 + (this.owner.current.idx % 2);
    },

    update : function update() {
        this.updatePosition();

        var idx = this.current.idx;
        this.setCurrentAnimation("walk_" + this.owner.dir_name, this.resetAnimation);
        this.setAnimationFrame(idx);

        // Awesome random blinking action!
        if (this.animationpause && !Math.floor(Math.random() * 100)) {
            // About 1% of of all frames rendered will cause blinking eyes!
            this.animationpause = false;
        }

        return this.parent();
    }
});

/* Player character */
game.PlayerEntity = game.Sprite.extend({
    // Direction facing
    dir : c.DOWN,
    dir_name : "down",

    // Re-render when true
    isDirty : false,

    // Standing or walking?
    standing : true,

    // Keys being held: [ "left", "up", "right", "down" ]
    held : [ false, false, false, false ],
    last_held : [ false, false, false, false ],

    // A helper constant
    walk_angle : Math.sin((45).degToRad()),

    init : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        this.adjustBoxShape(-1, 10, 15, 20);

        // Register Chipmunk collision handlers.
        this.body.eachShape(function (shape) {
            shape.collision_type = c.COLLIDE_PLAYER;
            shape.setLayers(c.LAYER_SPRITE | c.LAYER_WALL);
        });
        cm.getSpace().addCollisionHandler(
            c.COLLIDE_PLAYER,
            c.COLLIDE_COLLECTIBLE,
            this.collect
        );

        // Set animations.
        this.addAnimation("walk_down",   [ 0,  1,  2,  3 ]);
        this.addAnimation("walk_right",  [ 4,  5,  6,  7 ]);
        this.addAnimation("walk_left",   [ 8,  9,  10, 11 ]);
        this.addAnimation("walk_up",     [ 12, 13, 14, 15 ]);
        this.addAnimation("stand_down",  [ 0 ]);
        this.addAnimation("stand_right", [ 4 ]);
        this.addAnimation("stand_left",  [ 8 ]);
        this.addAnimation("stand_up",    [ 12 ]);
        this.setCurrentAnimation("stand_down");

        // Set the display to follow our position on both axis.
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    collect : function collect(arbiter, space) {
        switch (arbiter.b.data.name) {
            case "coin_gold":
                game.HUD.updateItemValue("coins", 100);
                publish("collect coin", [ 100 ]);
                me.audio.play("collect_coin");
                break;

            case "coin_silver":
                game.HUD.updateItemValue("coins", 1);
                publish("collect coin", [ 1 ]);
                me.audio.play("collect_coin");
                break;
        }

        // Remove the collectible item.
        space.addPostStepCallback(function post_collect() {
            arbiter.b.body.eachShape(function remove_shape(shape) {
                me.game.remove(me.game.getEntityByGUID(shape.data.GUID));
                space.removeShape(shape);
            });
            space.removeBody(arbiter.b.body);
        });
    },

    checkMovement : function checkMovement() {
        var self = this;

        var force = {
            x : 0,
            y : 0
        };
        var velocity;

        // Set the movement speed.
        if (!me.input.keyStatus("shift")) {
            // Walk.
            velocity = 2.5;
            self.animationspeed = 6;
        }
        else {
            // Run.
            velocity = 5;
            self.animationspeed = 3;
        }

        // Walking controls.
        var directions = [ "left", "up", "right", "down" ];
        directions.forEach(function (dir, i) {
            if (me.input.isKeyPressed(dir)) {
                self.held[i] = true;
                self.standing = false;

                if (!self.last_held[i] || (self.dir == c.RESET_DIR)) {
                    self.dir = c[dir.toUpperCase()];
                    self.dir_name = dir;
                }
                self.setCurrentAnimation("walk_" + self.dir_name);

                var axis = (i % 2) ? "y" : "x";
                force[axis] = velocity * me.timer.tick;

                // Walking at a 45-degree angle will slow the axis velocity by
                // approximately 5/7. But we'll just use sin(45)  ;)
                if (me.input.isKeyPressed(directions[(i + 1) % 4]) ||
                    me.input.isKeyPressed(directions[(i + 3) % 4])) {
                    force[axis] *= self.walk_angle;
                }

                if (i < 2) {
                    force[axis] = -force[axis];
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
        self.body.applyForce(cp.v(force.x * 600, force.y * -600), cp.vzero);

        if (~~self.body.vy !== 0) {
            game.wantsResort = true;
        }

        // Update animation if necessary.
        self.isDirty = (self.isDirty || (~~self.body.vx !== 0) || (~~self.body.vy !== 0));
        if (!self.isDirty && !self.standing) {
            // Force standing animation.
            self.stand();
        }
    },

    interactionCallback : function interactionCallback(data) {
        console.log(data);

        // DEBUG
        if (data.indexOf("still") >= 0) {
            game.state.loadLevel("rachels_room");
        }
    },

    checkInteraction : function checkInteraction() {
        var self = this;

        // Interaction controls.
        if (me.input.isKeyPressed("action")) {
            var bb = self.body.shapeList[0].getBB();
            var hw = ~~((bb.r - bb.l) / 2);
            var hh = ~~((bb.t - bb.b) / 2);

            var v = [
                hw * ((self.dir_name === "left") ? -1 : ((self.dir_name === "right") ? 1 : 0)),
                hh * ((self.dir_name === "up")   ? -1 : ((self.dir_name === "down")  ? 1 : 0))
            ];
            var p = cp.v(
                self.body.p.x + v[0] + self.body.shapeList[0].data.offset.x,
                self.body.p.y - v[1] - self.body.shapeList[0].data.offset.y
            );
            var sensor = cm.bbNewForCircle(p, 3);
            cm.getSpace().bbQuery(sensor, c.LAYER_INTERACTIVE, 0, function (shape) {
                // DO SOMETHING!
                me.game.getEntityByGUID(shape.data.GUID).interact(self.interactionCallback);
            });
        }
    },

    stand : function stand() {
        // Force standing animation.
        this.isDirty = true;
        this.standing = true;
        this.setCurrentAnimation("stand_" + this.dir_name);
    },

    update : function update() {
        var self = this;

        self.isDirty = false;
        self.body.resetForces();
        if (!game.modal) {
            self.checkMovement();
            self.checkInteraction();
        }
        else if (!self.standing) {
            this.stand();
        }

        return self.parent() || self.isDirty;
    }
});

/* NPCs */
game.NPCEntity = game.Sprite.extend({
    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        this.body.eachShape(function (shape) {
            shape.setLayers(c.LAYER_SPRITE | c.LAYER_INTERACTIVE | c.LAYER_WALL);
        });

        // FIXME: This sucks! With a low mass, shapes will fly away super fast
        // when colliding. This is because of the retarded-low damping to
        // simulate friction; We need equally retarded-high forces to move
        // objects at a decent speed.
        this.body.setMass(Infinity);
    }
});

/* Chests */
game.ChestEntity = game.NPCEntity.extend({
    // Whether the chest has been opened.
    open : false,

    // Do something when the chest has opened.
    callback: null,

    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        this.body.eachShape(function (shape) {
            shape.setLayers(c.LAYER_SPRITE | c.LAYER_INTERACTIVE);
        });

        // What item do we get?
        this.item = settings.item;

        // Which chest to display.
        // 0 = Square
        // 1 = Round
        var which = ~~(+settings.which).clamp(0, 1);

        // Setup animation.
        this.addAnimation("square", [ 0, 2, 4 ]);
        this.addAnimation("round",  [ 1, 3, 5 ]);
        this.setCurrentAnimation(which ? "round" : "square", this.resetAnimation);
        this.animationpause = true;
    },

    resetAnimation : function resetAnimation() {
        this.animationpause = true;
        this.open = true;
        this.setAnimationFrame(2);
        if (typeof(this.callback) === "function") {
            this.callback(this.item);
        }
    },

    interact : function interact(callback) {
        if (this.open || !this.animationpause) {
            return;
        }

        me.audio.play("chests");
        this.callback = callback;
        this.animationpause = false;
    }
});

/* Coins */
game.CoinEntity = game.Sprite.extend({
    init : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        this.body.eachShape(function (shape) {
            shape.collision_type = c.COLLIDE_COLLECTIBLE;
        });

        // FIXME: This sucks! With a low mass, shapes will fly away super fast
        // when colliding. This is because of the retarded-low damping to
        // simulate friction; We need equally retarded-high forces to move
        // objects at a decent speed.
        this.body.setMass(Infinity);

        this.animationspeed = 4;
    },

    update : function update() {
        return this.parent();
    }
});

/* Static banister for stairs. */
// Implemented as a sprite because it follows the rules of Y-coordinate priority.
game.StaticBanister = me.SpriteObject.extend({
    init : function init(x, y, settings) {
        var image = me.loader.getImage(settings.image);

        this.parent(x, y, image, settings.spritewidth, settings.spriteheight);

        this.offset = new me.Vector2d(0 * settings.spritewidth, 9 * settings.spriteheight);
    }
});
