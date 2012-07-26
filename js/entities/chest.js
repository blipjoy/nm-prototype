/* Chests */
game.ChestEntity = game.Sprite.extend({
    // Whether the chest has been opened.
    open : false,

    // Do something when the chest has opened.
    callback: null,

    init : function init(x, y, settings) {
        this.parent(x, y, settings);

        // Adjust collision bounding box.
        this.adjustBoxShape(0, 0, 42, 32);

        // Set shape layers.
        this.body.eachShape(function eachShape(shape) {
            shape.setLayers(c.LAYER_NO_COIN | c.LAYER_NO_NPC | c.LAYER_INTERACTIVE);
        });

        // Chests cannot be moved.
        this.body.setMass(Infinity);

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

    interact : function interact(actor, callback) {
        if (this.open || !this.animationpause) {
            return;
        }

        me.audio.play("chests");
        this.callback = callback;
        this.animationpause = false;
    }
});
