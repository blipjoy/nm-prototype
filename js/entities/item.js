/* Generic items */
game.ItemEntity = game.Sprite.extend({
    "init" : function init(x, y, settings) {
        this.parent(x, y, settings);

        // What kind of item?
        try {
            this.item = JSON.parse(settings.item);
        }
        catch (e) {
            throw "Item setting error. JSON PARSE: " + e + " in " + settings.item;
        }

        this.item.image = settings.image;
        this.item.spritewidth = settings.spritewidth;
        this.item.spriteheight = settings.spriteheight;

        // Set shape layers.
        this.body.eachShape(function eachShape(shape) {
            shape.setLayers(c.LAYER_NO_COIN | c.LAYER_NO_NPC | c.LAYER_INTERACTIVE);
        });

        // Items cannot be moved.
        this.body.setMass(Infinity);

        this.addAnimation("default", [ settings.spriteindex ]);
        this.setCurrentAnimation("default");
        this.animationpause = true;
    },

    "interact" : function interact(actor, callback) {
        // Purchases
        if (this.item.price) {
            if (game.HUD.getItemValue("coins") >= this.item.price) {
                game.HUD.updateItemValue("coins", -this.item.price);
            }
            else {
                game.dialog([
                    "Hmm, this " + this.item.name + " costs " + (this.item.price / 100) + " coins.",
                    "But I NEEEEDS it."
                ]);
                return;
            }
        }


        me.game.remove(this, true);
        cm.remove(this.body);
        callback.call(actor, {
            "type" : "item",
            "data" : this.item
        });
    }
});
