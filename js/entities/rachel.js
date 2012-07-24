/* Player character */
game.RachelEntity = game.Sprite.extend({
    // Direction facing
    dir : c.RESET_DIR,
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

        // Returning false tells Chipmunk to stop processing this collision.
        // That means the object will not act as a wall!
        return false;
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
        c.DIR_NAMES.forEach(function (dir_name, i) {
            if (me.input.isKeyPressed(dir_name)) {
                self.held[i] = true;
                self.standing = false;

                if (!self.last_held[i] || (self.dir == c.RESET_DIR)) {
                    self.dir = c[dir_name.toUpperCase()];
                    self.dir_name = dir_name;
                }
                self.setCurrentAnimation("walk_" + self.dir_name);

                var axis = (i % 2) ? "y" : "x";
                force[axis] = velocity * me.timer.tick;

                // Walking at a 45-degree angle will slow the axis velocity by
                // approximately 5/7. But we'll just use sin(45)  ;)
                if (me.input.isKeyPressed(c.DIR_NAMES[(i + 1) % 4]) ||
                    me.input.isKeyPressed(c.DIR_NAMES[(i + 3) % 4])) {
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
            game.state.loadLevel({
                to          : "rachels_room",
                music       : "bells",
                fade        : "black",
                duration    : 250
            });
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
