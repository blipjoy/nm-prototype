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

/* Chests */
game.ChestEntity = game.Sprite.extend({
    // Whether the chest has been opened.
    "open" : false,

    // Who opened the chest.
    "actor" : null,

    // Do something when the chest has opened.
    "callback" : null,

    // What this chest contains.
    "contents" : null,

    "init" : function init(x, y, settings) {
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
        try {
            this.contents = JSON.parse(settings.contents);
        }
        catch (e) {
            throw "Chest setting error. JSON PARSE: " + e + " in " + settings.contents;
        }

        // Which chest to display.
        // 0 = Square
        // 1 = Round
        var which = ~~(+settings.which).clamp(0, 1);

        // Setup animation.
        this.addAnimation("square", [ 0, 2, 4 ]);
        this.addAnimation("round",  [ 1, 3, 5 ]);
        this.setCurrentAnimation(which ? "round" : "square", this.resetAnimation);
        this.animationpause = true;

        // Prevent opening this chest more than once.
        this.stat_key = "chest_" + me.game.currentLevel.name + "_" + this.pos.x + "_" + this.pos.y;
        if (game.stat.load(this.stat_key)) {
            // Open the chest. :)
            this.open = true;
            this.setAnimationFrame(2);
        }
    },

    "resetAnimation" : function resetAnimation() {
        this.animationpause = true;
        this.open = true;
        this.setAnimationFrame(2);
        if (typeof(this.callback) === "function") {
            this.callback.call(this.actor, this.contents);
        }
    },

    "interact" : function interact(actor, callback) {
        if (this.open || !this.animationpause) {
            return;
        }

        // Keep this chest open.
        game.stat.save(this.stat_key, true);

        me.audio.play("chests");
        this.actor = actor;
        this.callback = callback;
        this.animationpause = false;
    }
});
