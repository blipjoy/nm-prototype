/* NPCs */
game.NPC = game.Sprite.extend({
    // NPC will move toward this vector.
    destination : null,

    // Direction facing.
    dir_name : "down",

    // Re-render when true.
    isDirty : false,

    // Standing or walking?
    standing : true,

    // Sleep time when standing.
    sleep : 0,

    // Maximum distance to walk while roaming.
    maxDistance : 200,

    // How much force to apply when walking.
    forceConstant : 600,

    // How far away from destination is "good enough".
    // A low tolerance will cause the NPC to "bounce" around its destination.
    // A high tolerance will cause the NPC to stop short of its destination.
    // This tolerance will cause just enough "bounciness" to look "realistic".
    destTolerance : 8,

    // Walking speed. (forceConstant is multiplied by velocity for the final force applied.)
    velocity : 2,

    // A helper constant.
    walk_angle : Math.sin((45).degToRad()),

    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        //this.adjustBoxShape(-1, 10, 15, 20); // FIXME

        this.body.eachShape(function eachShape(shape) {
            shape.setLayers(c.LAYER_NO_COIN | c.LAYER_NO_CHEST | c.LAYER_INTERACTIVE);
        });

        // Rachel is defined with a mass of 1. give NPCs a higher mass so Rachel
        // can't push them around as easily. May also want to handle this as a
        // special case in a collision handler, such that Player<->Sprite
        // collisions do not cause them to push one another.
        //this.body.setMass(3);

        // Set animations.
        this.addAnimation("walk_down",   [ 0, 4,  8, 12 ]);
        this.addAnimation("walk_left",   [ 1, 5,  9, 13 ]);
        this.addAnimation("walk_up",     [ 2, 6, 10, 14 ]);
        this.addAnimation("walk_right",  [ 3, 7, 11, 15 ]);

        this.addAnimation("stand_down",  [ 0 ]);
        this.addAnimation("stand_left",  [ 1 ]);
        this.addAnimation("stand_up",    [ 2 ]);
        this.addAnimation("stand_right", [ 3 ]);

        this.setCurrentAnimation("stand_down");
        this.animationspeed = 10;

        // AI initialization.
        this.destination = new cp.v(0, 0);
    },

    resetRoam : function resetRoam() {
        if (this.sleep <= 0) {
            // Sleep for a random period between 0 - 5 seconds.
            this.sleep = Math.random() * 5 * me.sys.fps;
            this.destination.x = this.destination.y = 0;

            this.stand();
        }
    },

    stand : function stand() {
        // Force standing animation.
        this.isDirty = true;
        this.standing = true;
        this.setCurrentAnimation("stand_" + this.dir_name);
    },

    checkMovement : function checkMovement() {
        if (--this.sleep > 0) {
            return;
        }

        this.standing = false;

        var x = this.body.p.x;
        var y = c.HEIGHT - this.body.p.y;

        // Choose a nearby random point
        if (!this.destination.x || !this.destination.y) {
            // FIXME: Use a bounding box to set the NPC roaming zone, and
            // cp.bbContainsBB() to validate position!

            var max = this.maxDistance * 2;
            var hMax = this.maxDistance;

            this.destination.x = x + ~~(Math.random() * max - hMax);
            this.destination.y = y + ~~(Math.random() * max - hMax);
        }

        // Decide direction to destination.
        var force = {
            x : this.destination.x - x,
            y : this.destination.y - y
        };

        // Decide distance based on destTolerance.
        force.x = (Math.abs(force.x) < this.destTolerance) ? 0 : force.x.clamp(-1, 1);
        force.y = (Math.abs(force.y) < this.destTolerance) ? 0 : force.y.clamp(-1, 1);

        // Set direction, favoring X-axis.
        if (force.y) {
            this.dir_name = (force.y < 0 ? "up" : "down");
        }
        if (force.x) {
            this.dir_name = (force.x < 0 ? "left" : "right");
        }

        // Set animation.
        this.setCurrentAnimation("walk_" + this.dir_name);


        // Calculate directional velocity.
        force.x *= this.velocity * me.timer.tick;
        force.y *= this.velocity * me.timer.tick;
        if (force.x && force.y) {
            force.x *= this.walk_angle;
            force.y *= this.walk_angle;
        }

        if ((this.sleep < -10) && !~~this.body.vx && !~~this.body.vy) {
            this.resetRoam();
        }
        else {
            // Walk toward the destination.
            this.isDirty = true;
            this.body.applyForce(cp.v(force.x * this.forceConstant, force.y * -this.forceConstant), cp.vzero);
        }
    },

    checkInteraction : function checkInteraction() {
        // TODO: NPC AI.
    },

    update : function update() {
        this.isDirty = false;
        this.body.resetForces();
        if (!game.modal) {
            this.checkMovement();
            this.checkInteraction();
        }
        else if (!this.standing) {
            this.stand();
        }

        return this.parent() || this.isDirty;
    },

    draw : function draw(context, x, y) {
        this.parent(context, x, y);

        // Draw a line to the destination.
        if (c.DEBUG && (this.destination.x || this.destination.y)) {
            var viewport = me.game.viewport.pos;
            context.save();

            context.strokeStyle = "red";
            context.moveTo(this.body.p.x - viewport.x, c.HEIGHT - this.body.p.y - viewport.y);
            context.lineTo(this.destination.x - viewport.x, this.destination.y - viewport.y);
            context.stroke();

            context.restore();
        }
    }
});
