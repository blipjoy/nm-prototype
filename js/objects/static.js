/* Static banister for stairs. */
// Implemented as a sprite because it follows the rules of Y-coordinate priority.
game.Static = me.SpriteObject.extend({
    "init" : function init(x, y, settings) {
        var image = game.getImage(settings.image);

        this.parent(x, y, image, settings.spritewidth, settings.spriteheight);

        this.offset = new me.Vector2d(
            settings.offsetx * settings.spritewidth,
            settings.offsety * settings.spriteheight
        );
    }
});
