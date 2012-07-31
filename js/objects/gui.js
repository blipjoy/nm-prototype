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

        "init" : function init(x, y, contents) {
            var self = this;
            self.parent(x, y, 0);
            contents.forEach(function forEach(item) {
                self.addItem(item);
            })
        },

        "addWeapon" : function addWeapon(item) {
            this.updated = true;
            this.contents[7] = item;

            // Create weapon sprite.
            game.rachel.addCompositionItem(item);
            game.rachel.setCompositionOrder(item.name, "rachel");
        },

        "addItem" : function addItem(item) {
            if (this.contents.length >= 7) {
                console.log("Error: Inventory overflow while adding: " + JSON.stringify(item));
                return;
            }

            this.updated = true;
            this.contents.push(item);
        },

        "getItem" : function getItem(idx) {
            return this.contents[idx];
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
                var item = self.contents[idx];
                if (item) {
                    var image = game.getImage("inventory_" + item.name);
                    context.drawImage(image, x + 2, y + 2);
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
