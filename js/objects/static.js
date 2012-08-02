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
