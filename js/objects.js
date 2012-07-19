game.dialog = function dialog(script) {
    var background = me.loader.getImage("dialog");
    var font = new me.Font("acmesa", 20, "#eee");

    game.modal = true;

    var dialog_box = new DialogObject(30, 480 - background.height - 15, background, script, 555, 71, 12, 12, font, "action");
    me.game.add(dialog_box);
    me.game.sort.defer();
};

/* Main game */
game.PlayScreen = me.ScreenObject.extend({
    onResetEvent: function () {
        // Load the first level.
        me.levelDirector.loadLevel("island");
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
game.Sprite = me.AnimationSheet.extend({
    init : function init(x, y, settings) {
        var self = this;

        self.body = settings.body;
        self.shape = settings.shape;

        // Create this object's AnimationSheet.
        self.parent(
            x,
            y,
            (typeof(settings.image) === "string") ? me.loader.getImage(settings.image) : settings.image,
            settings.spritewidth,
            settings.spriteheight
        );

        // Set some things that the engine wants.
        self.GUID = me.utils.createGUID();
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
            return this.parent(context);
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
        this.animationspeed = 1;
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
    walk_angle: Math.sin((45).degToRad()),

    init : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        //this.updateColRect(8, 20, 16, 20);

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

        // Update melonJS state with Chipmunk body state.
        self.pos.x = self.body.p.x - self.width/2;
        self.pos.y = c.HEIGHT - self.body.p.y - self.height/2;

        // Update animation if necessary.
        self.isDirty = (self.isDirty || (~~self.body.vx !== 0) || (~~self.body.vy !== 0));
        if (!self.isDirty && !self.standing) {
            // Force standing animation.
            self.isDirty = true;
            self.standing = true;
            self.setCurrentAnimation("stand_" + self.dir_name);
        }
    },

    checkInteraction : function checkInteraction() {
        var self = this;

        // Interaction controls.
        if (me.input.isKeyPressed("action")) {
            var v = [
                self.collisionBox.hWidth *  ((self.dir_name === "right") ? 1 : ((self.dir_name === "left") ? -1 : 0)),
                self.collisionBox.hHeight * ((self.dir_name === "up")    ? 1 : ((self.dir_name === "down") ? -1 : 0))
            ];
            var p = cp.v(
                self.body.p.x + v[0],
                self.body.p.y + v[1]
            );
            var sensor = cm.bbNewForCircle(p, 3);
            // FIXME: Using ALL_LAYERS is a really bad idea.
            cm.getSpace().bbQuery(sensor, cp.ALL_LAYERS, 0, function (shape) {
                if (!shape.data.name || (shape.data.name === "player")) {
                    return;
                }

                // DO SOMETHING!
                me.game.getEntityByName(shape.data.name)[0].talk();
            });
        }
    },

    update : function update() {
        var self = this;

        self.isDirty = false;
        self.body.resetForces();
        if (!game.modal) {
            self.checkMovement();
            self.checkInteraction();
        }

        return self.parent() || self.isDirty;
    }
});

/* NPC */
// FIXME: Don't extend ObjectEntity.
game.NPCEntity = me.ObjectEntity.extend({
    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        // FIXME: This sucks! With a low mass, shapes will fly away super fast
        // when colliding. This is because of the retarded-low damping to
        // simulate friction; We need equally retarded-high forces to move
        // objects at a decent speed.
        this.body.setMass(Infinity);
    },

    update : function update() {
        // Move entity and detect collisions.
        this.updateMovement();

        return ((this.vel.x != 0) || (this.vel.y != 0));
    }
});

/* Coins */
game.CoinEntity = game.Sprite.extend({
    init : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

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
