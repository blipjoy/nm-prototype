/* NPCs */
game.NPC = game.Sprite.extend({
    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        this.body.eachShape(function (shape) {
            shape.setLayers(c.LAYER_SPRITE | c.LAYER_INTERACTIVE | c.LAYER_WALL);
        });

        // Rachel is defined with a mass of 1. give NPCs a larger mass so Rachel
        // can't push them around easily. May also want to handle this as a
        // special case in a collision handler, such that Player<->Sprite
        // collisions do not cause them to push one another.
        this.body.setMass(3);
    }
});
