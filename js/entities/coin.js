/* Coins */
game.CoinEntity = game.Sprite.extend({
    init : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Set shape layers.
        this.body.eachShape(function (shape) {
            shape.collision_type = c.COLLIDE_COLLECTIBLE;
        });

        this.animationspeed = 4;
    },

    update : function update() {
        return this.parent();
    }
});
