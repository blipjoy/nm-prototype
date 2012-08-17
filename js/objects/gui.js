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

/* The almighty HUD. Keeps track of stats; not just a renderer! */
game.installHUD = function HUD() {
    var items;

    // Override the HUD.update method to perform animation.
    var HUD = me.HUD_Object.extend({
        "init" : function init() {
            this.parent.apply(this, arguments);
            this.isPersistent = true;
        },

        "update" : function update() {
            var result = [];
            Object.keys(items).forEach(function eachKey(key) {
                result.push(items[key].request_update());
            })

            if (result.some(function some(x) { return x; })) {
                this.HUD_invalidated = true;
            }
            return this.HUD_invalidated;
        }
    });

    var HUD_Item = me.HUD_Item.extend({
        "request_update" : function request_update() {
            return false;
        }
    });

    // Coins counter.
    var coins = HUD_Item.extend({
        "init" : function init(x, y, value) {
            this.parent(x, y, value);

            // Fonts.
            this.gold_font = new me.Font("Futura", 20, "#DFBD00");
            this.silver_font = new me.Font("Futura", 20, "#C4B59F");
            this.gold_font.bold();
            this.silver_font.bold();

            // Animated coin image.
            this.image = new me.AnimationSheet(0, 0, game.getImage("coin_gold"), 18, 21);
            this.image.animationspeed = 4;

            function bufferForFont(context, font) {
                var width = context.canvas.width;
                // Why can't I measure text height?!
                // I'll just have to measure the width of a wide character and double it!
                var height = context.measureText("m").width * 2;

                var el = document.createElement("canvas");
                el.setAttribute("width", width);
                el.setAttribute("height", height);

                var ctx = el.getContext("2d");
                ctx.font = font.font;
                ctx.textBaseline = "top";

                return el;
            }

            // Back-buffer and mask for the inset shadow effect.
            // Note we only need to use one font, because the only difference is color.
            this.backbuffer = bufferForFont(me.video.getScreenFrameBuffer(), this.gold_font);
            this.backmask   = bufferForFont(me.video.getScreenFrameBuffer(), this.gold_font);

            // Create a cache for the coin counter, so we don't redraw it unnecessarily.
            this.cache      = bufferForFont(me.video.getScreenFrameBuffer(), this.gold_font);
            this.preValue   = NaN;

            this.value = game.stat.load("coins") || 0;
        },

        "update" : function update(value) {
            this.parent(value);

            game.stat.save("coins", this.value);

            if (value > 0) {
                me.event.publish("collect coin", [ value ]);
                me.audio.play("collect_coin");
            }
            else {
                me.event.publish("spend coin", [ -value ]);
                // Play thee sounds quickly in series.
                me.audio.play("collect_coin");
                setTimeout(function timeout() { me.audio.play("collect_coin") }, 200);
                setTimeout(function timeout() { me.audio.play("collect_coin") }, 400);
            }
        },

        "request_update" : function request_update() {
            return this.image.update();
        },

        "draw" : function draw(context, x, y) {
            var self = this;

            function insetShadowText(context, str, x, y, color, shadowColor, offsetX, offsetY) {
                var width = self.backbuffer.width;
                var height = self.backbuffer.height;
                var bctx = self.backbuffer.getContext("2d");
                var mctx = self.backmask.getContext("2d");

                bctx.save();
                bctx.clearRect(0, 0, width, height);

                // Inset shadow color!
                bctx.fillStyle = shadowColor;
                bctx.fillText(str, 0, 0);

                // Text color!
                bctx.translate(0, -height);
                bctx.shadowColor = color;
                bctx.shadowOffsetX = offsetX;
                bctx.shadowOffsetY = height + offsetY;
                bctx.fillText(str, 0, 0);
                bctx.restore();

                // Create mask.
                mctx.clearRect(0, 0, width, height);
                mctx.fillStyle = "black";
                mctx.fillText(str, 0, 0);

                // Mask it!
                bctx.save();
                bctx.globalCompositeOperation = "destination-in";
                bctx.drawImage(self.backmask, 0, 0);
                bctx.restore();

                // Final destination!
                context.drawImage(self.backbuffer, x, y);
            }

            function roundedBox(context, x, y, w, h, r, color) {
                context.save();
                context.fillStyle = color;
                context.beginPath();
                context.moveTo(x, y + r);

                // Upper left corner.
                context.arcTo(
                    x, y,
                    x + r, y,
                    r
                );

                // Upper right corner.
                context.arcTo(
                    x + w, y,
                    x + w, y + r,
                    r
                );

                // Lower right corner.
                context.arcTo(
                    x + w, y + h,
                    x + w - r, y + h,
                    r
                );

                // Lower left corner.
                context.arcTo(
                    x, y + h,
                    x, y + h - r,
                    r
                );

                context.fill();

                context.restore();
            }


            var tx = self.pos.x + x;
            var ty = self.pos.y + y;

            // Break value into strings.
            var gold_value = Math.floor(self.value / 100) + ".";
            var silver_value = (self.value % 100);
            silver_value = ((silver_value < 10) ? "0" : "") + silver_value;

            // Calculate width of each part.
            var gold_width = self.gold_font.measureText(context, gold_value).width;
            var silver_width = self.silver_font.measureText(context, silver_value).width;

            // Draw background.
            roundedBox(
                context,
                tx,
                ty,
                gold_width + silver_width + 26,
                23,
                5,
                "rgba(50, 50, 50, 0.75)"
            );

            // Draw animated coin.
            context.drawImage(
                self.image.image,
                self.image.offset.x, self.image.offset.y,
                self.image.width, self.image.height,
                tx + 2, ty + 1,
                self.image.width, self.image.height
            );

            // Draw coin counter.
            if (self.preValue != self.value) {
                self.preValue = self.value;
                var cache_ctx = self.cache.getContext("2d");
                cache_ctx.clearRect(0, 0, self.cache.width, self.cache.height);

                // Gold.
                insetShadowText(
                    cache_ctx,
                    gold_value,
                    0,
                    0,
                    self.gold_font.color,
                    "#786600",
                    -1,
                    -1
                );
                // Silver.
                insetShadowText(
                    cache_ctx,
                    silver_value,
                    gold_width,
                    0,
                    self.silver_font.color,
                    "#786f61",
                    -1,
                    -1
                );
            }
            // Webkit has a bug where the "top" baseline draws 5 pixels too low?!
            context.drawImage(self.cache, tx + 25, ty + (me.sys.ua.indexOf("webkit") >= 0 ? -2 : 3));
        }
    });

    // Health display.
    var hearts = HUD_Item.extend({
        "init" : function init(x, y, value) {
            var self = this;
            self.parent(x, y, value);
            self.hearts = [];
            [ "heart_empty", "heart_half", "heart_full" ].forEach(function forEach(value, i) {
                self.hearts[i] = game.getImage(value);
            });
        },

        "request_update" : function request_update() {
            return this.updated || items.containers.updated;
        },

        "draw" : function draw(context, x, y) {
            var image;
            var count = items.containers.value
            var value = this.value;

            // FIXME: Blink when low!

            x += this.pos.x;
            y += this.pos.y;
            for (var i = 0; i < count; i++) {
                if (i < ~~value) {
                    image = 2;
                }
                else if (value % 1) {
                    image = 1;
                    value = ~~value;
                }
                else {
                    image = 0;
                }

                context.drawImage(this.hearts[image], x, y);
                x += this.hearts[image].width + 2;
            }
        }
    });

    var inventory = HUD_Item.extend({
        // What this inventory contains.
        "contents" : [],
        "weapon" : null,

        "init" : function init(x, y, contents) {
            var self = this;
            self.parent(x, y, 0);
            contents.forEach(function forEach(item) {
                self.addItem(item);
            })

            this.contents = (game.stat.load("inventory_contents") || []).map(function map(item) {
                self.cacheIcon(item);
                return item;
            });
            this.weapon = game.stat.load("inventory_weapon") || null;
            if (this.weapon) {
                this.cacheIcon(this.weapon);
            }
        },

        "cacheIcon" : function cacheIcon(item) {
            item.cached_icon = game.getImage(item.image);

            var count = ~~(item.cached_icon.width / item.spritewidth);
            item.offset = {
                "x" : (item.icon % count) * item.spritewidth,
                "y" : ~~(item.icon / count) * item.spriteheight
            };
        },

        "addWeapon" : function addWeapon(item) {
            this.updated = true;
            this.weapon = item;

            me.audio.play("fanfare");
            me.event.publish("acquire weapon", [ item.name ]);
            game.dialog([ item.description ]);

            game.stat.save("inventory_weapon", item);

            if (!game.stat.load("tutorial5")) {
                me.event.publish("notify", [ "At last I can defend myself! Use it with the attack key (Z or APOSTROPHE)" ]);
                game.stat.save("tutorial5", true);
            }

            // Create weapon sprite.
            // FIXME: Remove old sprite if a weapon was already loaded.
            this.cacheIcon(item);
            game.rachel.addCompositionItem(item);
            game.rachel.setCompositionOrder(item.name, "rachel");
        },

        "addItem" : function addItem(item) {
            if (this.contents.length >= 7) {
                console.log("Error: Inventory overflow while adding: " + JSON.stringify(item));
                return;
            }

            me.audio.play("fanfare");
            me.event.publish("acquire item", [ item.name ]);
            game.dialog([ item.description ]);

            this.cacheIcon(item);
            this.updated = true;
            this.contents.push(item);

            game.stat.save("inventory_contents", this.contents.map(function map(item) {
                var result = {};
                Object.keys(item).forEach(function forEach(key) {
                    if (key !== "cached_icon") {
                        result[key] = item[key];
                    }
                });
                return result;
            }));
        },

        "removeWeapon" : function removeWeapon() {
            this.weapon = null;
        },

        "removeItem" : function removeItem(idx) {
            if (idx === 7) {
                return this.removeWeapon();
            }
            this.contents.splice(idx, 1);
        },

        "getItem" : function getItem(idx) {
            return (idx === 7) ? this.weapon : this.contents[idx];
        },

        "hasItem" : function hasItem(name) {
            return this.contents.concat(this.weapon).some(function some(item) {
                return game.isObject(item) && (item.name === name);
            });
        },

        "request_update" : function request_update() {
            return this.updated;
        },

        "draw" : function draw(context, x, y) {
            var self = this;

            x += self.pos.x;
            y += self.pos.y;

            function drawBorder(x, y) {
                // Shadow.
                context.strokeStyle = "#000";
                context.strokeRect(x + 1, y + 1, 36, 36);

                // Box
                context.strokeStyle = "#fff";
                context.strokeRect(x, y, 36, 36);
            }

            function drawItem(idx) {
                var item = (idx === 7) ? self.weapon : self.contents[idx];
                if (item) {
                    context.drawImage(
                        item.cached_icon,
                        item.offset.x,
                        item.offset.y,
                        32,
                        32,
                        x + 2,
                        y + 2,
                        32,
                        32
                    );
                }
            }

            context.save();
            context.lineWidth = 1;
            for (var i = 0; i < 7; i++, x += 40) {
                drawBorder(x, y);
                drawItem(i);
            }

            // Skip a spot.
            x += 40;

            // Draw weapon icon.
            drawBorder(x, y);
            drawItem(7);

            context.restore();
        }
    });

    // Create a HUD container.
    // NOTE: This turns game.HUD into a singleton!
    game.HUD = new HUD(0, 0, 640, 50);
    me.game.add(game.HUD);

    // Create a list of items to add to the HUD.
    items = {
        "coins"         : new coins(2, 2),
        "containers"    : new HUD_Item(0, 0, 3),
        "hearts"        : new hearts(2, 25, 3),
        "inventory"     : new inventory(~~(c.WIDTH / 4), 2, [])
    };

    // Add them all.
    Object.keys(items).forEach(function eachKey(key) {
        game.HUD.addItem(key, items[key]);
    });

    me.game.sort(game.sort);
};
