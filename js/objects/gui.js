/* The almighty HUD. Keeps track of stats; not just a renderer! */
game.HUD = function HUD() {
    var items;

    // Override the HUD.update method to perform animation.
    var HUD = me.HUD_Object.extend({
        init : function init() {
            this.parent.apply(this, arguments);
            this.persist = true; // FIXME: https://github.com/obiot/melonJS/issues/75
        },

        update : function update() {
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
        request_update : function request_update() {
            return false;
        }
    });

    // Coins counter.
    var coins = HUD_Item.extend({
        init : function init(x, y, value) {
            this.parent(x, y, value);

            // Fonts.
            this.gold_font = new me.Font("Futura", 20, "#DFBD00");
            this.silver_font = new me.Font("Futura", 20, "#C4B59F");
            this.gold_font.bold();
            this.silver_font.bold();

            // Animated coin image.
            this.image = new me.AnimationSheet(0, 0, me.loader.getImage("coin_gold"), 18, 21);
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
        },

        request_update : function request_update() {
            return this.image.update();
        },

        draw : function draw(context, x, y) {
            var self = this;

            // Draw animated coin.
            context.drawImage(
                self.image.image,
                self.image.offset.x, self.image.offset.y,
                self.image.width, self.image.height,
                self.pos.x + x + 2, self.pos.y + y + 2,
                self.image.width, self.image.height
            );

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

            // Break value into strings.
            var gold_value = Math.floor(self.value / 100) + ".";
            var silver_value = (self.value % 100);
            silver_value = ((silver_value < 10) ? "0" : "") + silver_value;

            // Calculate width of gold part.
            var gold_width = self.gold_font.measureText(context, gold_value).width;

            // Draw coin counter.
            insetShadowText(
                context,
                gold_value,
                self.pos.x + x + 25,
                self.pos.y + y,
                self.gold_font.color,
                "#333",
                1,
                1
            );
            insetShadowText(
                context,
                silver_value,
                self.pos.x + x + 25 + gold_width,
                self.pos.y + y,
                self.silver_font.color,
                "#333",
                1,
                1
            );
        }
    });

    // Health display.
    var hearts = HUD_Item.extend({
        init : function init(x, y, value) {
            var self = this;
            self.parent(x, y, value);
            self.hearts = [];
            [ "heart_empty", "heart_half", "heart_full" ].forEach(function forEach(value, i) {
                self.hearts[i] = me.loader.getImage(value);
            });
        },

        request_update : function request_update() {
            return items.containers.updated;
        },

        draw : function draw(context, x, y) {
            var image;
            var count = items.containers.value
            var value = this.value;

            x += this.pos.x;
            y += this.pos.y;
            for (var i = 0; i < count; i++) {
                if (i < value) {
                    image = 2;
                }
                else if (value % 1) {
                    image = 1;
                    value = Math.floor(value);
                }
                else {
                    image = 0;
                }

                context.drawImage(this.hearts[image], x, y);
                x += this.hearts[image].width + 2;
            }
        }
    })

    // Create a HUD container.
    // NOTE: This turns game.HUD into a singleton!
    game.HUD = new HUD(0, 0, 640, 50);
    me.game.add(game.HUD);

    // Create a list of items to add to the HUD.
    items = {
        coins : new coins(0, 0),
        containers : new HUD_Item(0, 25, 3),
        hearts : new hearts(2, 25, 3)
    };

    // Add them all.
    Object.keys(items).forEach(function eachKey(key) {
        game.HUD.addItem(key, items[key]);
    });

    me.game.sort(game.sort);
};
