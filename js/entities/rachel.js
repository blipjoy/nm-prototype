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

/* Rachel */
game.RachelEntity = game.NPC.extend({
    // Keep track of the last direction key pressed.
    "dir" : c.RESET_DIR,

    // Keys being held: [ "left", "up", "right", "down" ]
    "held" : [ false, false, false, false ],
    "last_held" : [ false, false, false, false ],

    "init" : function init(x, y, settings) {
        // Request a circle for Rachel's collision shape.
        settings.shape = {
            "type"      : "circle",
            "radius"    : 10,
            "offset"    : cp.v(0, -10)
        };

        // Call the constructor.
        this.parent(x, y, settings);

        // Add weapon, if any.
        if (game.HUD) {
            var item = game.HUD.HUDItems.inventory.getItem(7);
            if (item) {
                this.addCompositionItem(item);
                this.setCompositionOrder(item.name, "rachel");
            }
        }

        // Rachel's mass is always 1.
        this.body.setMass(1);

        // Register Chipmunk collision handlers.
        this.body.eachShape(function eachShape(shape) {
            shape.collision_type = c.COLLIDE_PLAYER;
            shape.setLayers(c.LAYER_NO_COIN | c.LAYER_NO_NPC | c.LAYER_NO_CHEST | c.LAYER_EXIT | c.LAYER_LIVING);
        });

        // Set the display to follow our position on both axis.
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    "hit" : function hit(power) {
        me.audio.play("hurt");

        this.hearts -= power;
        game.HUD.HUDItems.hearts.update(-power);
        if (game.HUD.HUDItems.hearts.value <= 0) {
            // Dead.
            me.audio.stopTrack();
            me.audio.play("dying");

            game.modal = true;

            me.game.viewport.fadeIn("black", 2000, function fadeInComplete() {
                me.audio.playTrack("random_and_cheap");
                me.game.removeAll();
                cm.removeAll();
                me.state.change(me.state.GAMEOVER);
                game.modal = false;
            });
        }
    },

    "collect" : function collect(arbiter, space) {
        switch (arbiter.b.data.name) {
            case "coin_gold":
                game.HUD.updateItemValue("coins", 100);
                break;

            case "coin_silver":
                game.HUD.updateItemValue("coins", 1);
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

    "interactionCallback" : function interactionCallback(message) {
        switch (message.type) {
            case "item":
                game.HUD.HUDItems.inventory.addItem(message.data);
                break;

            case "weapon":
                game.HUD.HUDItems.inventory.addWeapon(message.data);
                break;

            case "coins":
                game.HUD.updateItemValue("coins", message.data);
                break;

            case "warp":
                game.play.loadLevel(message.data);
                break;

            default:
                console.error(
                    "Unknown message type in interactionCallback: " +
                    message.type +
                    " ... " +
                    JSON.stringify(message)
                );
                break;
        }
    },

    "checkMovement" : function checkMovement() {
        var self = this;

        var force = {
            "x" : 0,
            "y" : 0
        };
        var velocity = self.velocity;

        // Set the movement speed.
        if (!me.input.keyStatus("shift")) {
            // Walk.
            self.animationspeed = 6;
        }
        else {
            // Run.
            velocity *= 2;
            self.animationspeed = 3;
        }

        // Walking controls.
        c.DIR_NAMES.forEach(function forEach(dir_name, i) {
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

        // Move body and detect collisions.
        self.body.applyForce(cp.v(force.x * self.forceConstant, force.y * -self.forceConstant), cp.vzero);

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

    "checkInteraction" : function checkInteraction() {
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
                self.body.p.y - v[1] + self.body.shapeList[0].data.offset.y
            );
            var sensor = cm.bbNewForCircle(p, 3);
            cm.getSpace().bbQuery(sensor, c.LAYER_INTERACTIVE, 0, function onBBQuery(shape) {
                // DO SOMETHING!
                me.game.getEntityByGUID(shape.data.GUID).interact(self, self.interactionCallback);
            });
        }
    }
});
