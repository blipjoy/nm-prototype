/* NPCs */
game.NPC = game.Sprite.extend({
    // Direction facing.
    dir_name : "down",

    // Re-render when true.
    isDirty : false,

    // Standing or walking?
    standing : true,

    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        //this.adjustBoxShape(-1, 10, 15, 20); // FIXME

        this.body.eachShape(function eachShape(shape) {
            shape.setLayers(c.LAYER_SPRITE | c.LAYER_INTERACTIVE | c.LAYER_WALL);
        });

        // Rachel is defined with a mass of 1. give NPCs a larger mass so Rachel
        // can't push them around easily. May also want to handle this as a
        // special case in a collision handler, such that Player<->Sprite
        // collisions do not cause them to push one another.
        this.body.setMass(3);

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
    },

    stand : function stand() {
        // Force standing animation.
        this.isDirty = true;
        this.standing = true;
        this.setCurrentAnimation("stand_" + this.dir_name);
    },

    checkMovement : function checkMovement() {
        // TODO: NPC AI.
    },

    checkInteraction : function checkInteraction() {
        // TODO: NPC AI.
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
