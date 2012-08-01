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

        // Prevent collecting this item more than once.
        this.stat_key = "item_" + this.item.name;
        if (game.stat.load(this.stat_key)) {
            // Remove this item from the scene.
            me.game.remove(this);
            cm.remove(this.body);
        }
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

        // Do not pick up this item more than once.
        game.stat.save(this.stat_key, true);

        me.game.remove(this, true);
        cm.remove(this.body);
        callback.call(actor, {
            "type" : "item",
            "data" : this.item
        });
    }
});
