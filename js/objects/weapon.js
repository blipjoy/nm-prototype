/* Weapon sprites */
game.Weapon = me.AnimationSheet.extend({
    // Re-render when true.
    "isDirty" : false,

    // "side", "down", or "up".
    "dir" : "down",

    // Sync with parent direction.
    "dir_name" : "down",

    "hitbox" : null,

    "init" : function init(x, y, image, w, h, owner, settings) {
        this.parent(x, y, image, w, h);

        this.settings = settings;
        this.name = settings.name;
        this.owner = owner;

        // Set animations.
        this.addAnimation("swing_side", [ 0, 3, 6 ]);
        this.addAnimation("swing_down", [ 1, 4, 7 ]);
        this.addAnimation("swing_up",   [ 2, 4, 8 ]);

        this.addAnimation("stand_side", [ 0 ]);
        this.addAnimation("stand_down", [ 1 ]);
        this.addAnimation("stand_up",   [ 2 ]);

        this.setCurrentAnimation("stand_down");
        this.animationspeed = 1;
        this.animationpause = true;

        // Anchor the weapon to the handle (for rotation and flipping).
        this.anchorPoint = new me.Vector2d(0.1, 0.5);

        /*
         * The position table sets where the sprite will be placed relative to the owner.
         * Each x & y direction has one position for each animation frame.
         */
        // FIXME: Numbers should be based on owner's and this sizes!
        this.positions = {
            "x" : {
                "swing_left"    : [ 64, 44, 10 ],
                "swing_up"      : [-24,-24,-18 ],
                "swing_right"   : [-38,-21, 14 ],
                "swing_down"    : [-3,  -6,-14 ],

                "stand_left"    : [ 52 ],
                "stand_up"      : [-24 ],
                "stand_right"   : [-28 ],
                "stand_down"    : [-3 ]
            },
            "y" : {
                "swing_left"    : [-2, -30,-1 ],
                "swing_up"      : [-4, -24,-24 ],
                "swing_right"   : [-2, -28,-3 ],
                "swing_down"    : [-22,-23, 16 ],

                "stand_left"    : [-28 ],
                "stand_up"      : [-4 ],
                "stand_right"   : [-28 ],
                "stand_down"    : [-22 ]
            }
        };

        this.updatePosition();
    },

    "resetSortOrder" : function resetSortOrder() {
        // Change sort order.
        if (this.dir_name === "up" || this.dir_name === "left") {
            // In front of everything.
            this.owner.setCompositionOrder(this.name, -1);
        }
        else {
            // Behind owner.
            this.owner.setCompositionOrder(this.name, this.owner.name);
        }
    },

    "updatePosition" : function updatePosition() {
        // Position.
        var x = this.positions.x;
        var y = this.positions.y;
        var action = (this.owner.attacking ? "swing_" : "stand_");
        var dir = this.owner.dir_name;
        this.pos.x = this.owner.pos.x + x[action + dir][this.current.idx];
        this.pos.y = this.owner.pos.y + y[action + dir][this.current.idx] + (this.owner.current.idx % 2);

        // Face the proper direction;
        this.flipX(dir === "left");

        // Set the angle when neutral, so the weapon rests on the shoulder.
        this.angle = (!this.owner.attacking && (dir === "left" || dir === "right") ? 30 : 0).degToRad();
    },

    "update" : function update() {
        var self = this;

        // Update animation.
        self.isDirty = self.owner.attacking && self.parent();

        // Update direction property.
        var dir = self.owner.dir_name;
        if (self.dir_name !== dir) {
            self.dir_name = dir;
            self.isDirty = true;

            self.dir = dir;
            if ((self.dir === "left") || (self.dir === "right")) {
                self.dir = "side";
            }

            self.setCurrentAnimation("stand_" + self.dir);

            self.resetSortOrder();
        }

        // Change sort order during attack animation.
        if (self.owner.attacking && self.current.idx) {
            if (self.dir_name === "down") {
                // In front of everything.
                self.owner.setCompositionOrder(self.name, -1);
            }
            else if (self.dir_name === "up") {
                // Behind owner.
                self.owner.setCompositionOrder(self.name, self.owner.name);
            }
        }

        // Attack!
        if (!game.modal && !self.owner.attacking && me.input.isKeyPressed("attack")) {
            self.owner.attacking = true;
            self.animationpause = false;

            // Make owner stand still.
            self.owner.stand();

            // Run the attack animation.
            self.setCurrentAnimation("swing_" + self.dir, function animationComplete() {
                // Play a random sound effect.
                var len = self.settings.sfx.length - 1;
                me.audio.play(self.settings.sfx[Number.prototype.random(0, len)]);

                // Create a BB for the whomp.
                var shape = self.owner.body.shapeList[0]; // FIXME: May not always have a shape!
                var offset = {
                    "x" : 0,
                    "y" : 0
                };

                // FIXME: BB offsets only work well for hammer.
                switch (self.dir_name) {
                    case "left":
                        offset.x = -(~~(shape.bb_r - shape.bb_l) + 27);
                        offset.y = -2;
                        break;

                    case "right":
                        offset.x = ~~(shape.bb_r - shape.bb_l) + 24;
                        break;

                    case "up":
                        offset.x = 1;
                        offset.y = ~~(shape.bb_t - shape.bb_b) + 14;
                        break;

                    case "down":
                        offset.x = -2;
                        offset.y = -(~~(shape.bb_t - shape.bb_b) + 16);
                        break;
                }

                var x = ~~shape.bb_l + offset.x;
                var y = ~~shape.bb_t + offset.y;
                self.hitbox = cp.bb(x, y - 20, x + 24, y);

                // Hit anything in the whomp-zone.
                var space = cm.getSpace();
                space.bbQuery(self.hitbox, c.LAYER_LIVING, 0, function (shape) {
                    obj = me.game.getEntityByGUID(shape.data.GUID);

                    var impulse = {
                        "x" : 800 * ((self.dir_name === "left") ? -1 : ((self.dir_name === "right") ? 1 : 0)),
                        "y" : 800 * ((self.dir_name === "down") ? -1 : ((self.dir_name === "up") ? 1 : 0))
                    };
                    obj.body.applyImpulse(cp.v(impulse.x, impulse.y), cp.vzero);
                    obj.hit(self.owner.power);

                    // Make the NPC angry, and turn it toward the attacker to retaliate!
                    obj.makeAngry(true);
                    obj.turn(2, self.owner.dir_name);
                });

                // FIXME: "hit cloud" animation

                // Pause on final frame for a short period.
                self.setAnimationFrame(2);
                self.animationpause = true;
                setTimeout(function timeout() {
                    // Back to neutral.
                    self.owner.attacking = false;

                    self.hitbox = null;

                    self.setAnimationFrame(0);
                    self.setCurrentAnimation("stand_" + self.dir);

                    self.resetSortOrder();
                }, 250);
            });
        }

        self.updatePosition();
        return self.isDirty;
    },

    "draw" : function draw(context) {
        this.parent(context);

        if (c.DEBUG && this.hitbox) {
            // Draw hit rectangle
            var viewport = me.game.viewport.pos;
            context.save();
            context.lineWidth = 2;
            context.strokeStyle = "red";
            context.strokeRect(
                this.hitbox.l - viewport.x,
                c.HEIGHT - this.hitbox.t - viewport.y,
                this.hitbox.r - this.hitbox.l,
                this.hitbox.t - this.hitbox.b
            );
            context.restore();
        }
    }
});
