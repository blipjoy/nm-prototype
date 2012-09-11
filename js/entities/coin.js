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

/* Create a Chipmunk collision handler for CoinEntity. */
game.installCoinHandler = function installCoinHandler() {
    /* Player<->CoinEntity collisions */
    if (!game.coinHandlerInstalled) {
        game.coinHandlerInstalled = true;
        cm.getSpace().addCollisionHandler(
            c.COLLIDE_PLAYER,
            c.COLLIDE_COLLECTIBLE,
            function coinCollision(arbiter, space) {
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
