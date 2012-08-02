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

/* Shadow sprites */
game.Shadow = me.AnimationSheet.extend({
    "init" : function init(x, y, image, w, h, owner) {
        this.parent(x, y, image, w, h);

        this.owner = owner;
        this.updatePosition();
    },

    "updatePosition" : function updatePosition() {
        this.pos.x = this.owner.pos.x + ~~(this.owner.width / 2) - ~~(this.width / 2);
        this.pos.y = this.owner.pos.y + this.owner.height - ~~(this.height * 0.8);
    },

    "update" : function update() {
        this.updatePosition();
        return false;
    }
});
