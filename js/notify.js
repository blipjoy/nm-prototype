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

game.Notify = Object.extend({
    "font" : null,
    "queue" : [],

    "message" : "",
    "width" : 0,
    "height" : 0,

    "border" : {
        "x" : 5,
        "y" : 5
    },

    "offset" : {
        "x" : 10,
        "y" : 20
    },

    "size" : 12,

    "lastTick" : 0,
    "threshold" : 8000,

    "init" : function init() {
        var self = this;
        self.font = new me.Font("Tahoma", self.size, "#aaa");
        self.canvas = document.createElement("canvas");
        self.buffer = self.canvas.getContext("2d");

        self.visible = true;
        self.isPersistent = true;
        me.game.add(self, 10000);

        me.event.subscribe("notify", function notify(message) {
            self.queue.push(message);
        });
    },

    "update" : function update() {
        var now = me.timer.getTime();
        if (this.queue.length && (now >= this.lastTick)) {
            this.lastTick = now + this.threshold;

            var lines = 1; // FIXME

            this.message = this.queue.shift();
            this.width = this.font.measureText(this.buffer, this.message).width + this.border.x * 2;
            this.height = this.size * lines + this.border.y * 2;

            this.canvas.width = this.width;
            this.canvas.height = this.height;

            this.buffer.save();

            // Background.
            this.buffer.globalAlpha = 0.8;
            this.buffer.fillStyle = "#222";
            this.buffer.fillRect(
                0,
                0,
                this.width,
                this.height
            );

            // Text.
            this.buffer.globalAlpha = 1;
            this.font.draw(this.buffer, this.message, this.border.x, this.border.y);

            this.buffer.restore();
        }

        return this.queue.length || (this.lastTick > now);
    },

    "draw" : function draw(context) {
        var now = me.timer.getTime();
        if (this.lastTick > now) {
            var map_pos = me.game.currentLevel.pos;
            context.drawImage(
                this.canvas,
                c.WIDTH - this.width - this.offset.x - map_pos.x,
                c.HEIGHT - this.height - this.offset.y - map_pos.y
            );
        }
    }
});
