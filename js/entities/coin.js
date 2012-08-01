/* Create a Chipmunk collision handler for CoinEntity. */
game.installCoinHandler = function installCoinHandler() {
    /* Player<->CoinEntity collisions */
    if (!game.coinHandlerInstalled) {
        game.coinHandlerInstalled = true;
        cm.getSpace().addCollisionHandler(
            c.COLLIDE_PLAYER,
            c.COLLIDE_COLLECTIBLE,
            function exitCollision(arbiter, space) {
                // Wrapped because game.rachel does not exist when the handler is installed.
                game.rachel.collect.apply(game.rachel, arguments);

                // Return false so collision does not assert a force.
                return false;
            }
        );
    }
};

/* Coins */
game.CoinEntity = game.Sprite.extend({
    "init" : function init(x, y, settings) {
        // Call the constructor.
        this.parent(x, y, settings);

        // Set shape layers.
        this.body.eachShape(function eachShape(shape) {
            shape.setLayers(c.LAYER_NO_NPC | c.LAYER_NO_CHEST);
            shape.group = c.GROUP_COINS;
            shape.collision_type = c.COLLIDE_COLLECTIBLE;
        });

        this.animationspeed = 4;
    },

    "update" : function update() {
        return this.parent();
    }
});
