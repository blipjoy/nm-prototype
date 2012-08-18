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

/* A Chipmunk-controlled entity */
game.Chipmunk = me.AnimationSheet.extend({
    "init" : function init(x, y, settings) {
        var shape;
        var space = cm.getSpace();

        this.hWidth = ~~(settings.spritewidth / 2);
        this.hHeight = ~~(settings.spriteheight / 2);

        this.body = space.addBody(new cp.Body(1, Infinity));
        this.body.setPos(cp.v(x + this.hWidth, c.HEIGHT - y - this.hHeight));

        if (settings.shape) {
            switch (settings.shape.type) {
                case "polygon":
                case "segment":
                    throw "Error: Unimplemented shape `" + setting.shape.type + "`";

                case "circle":
                    shape = space.addShape(new cp.CircleShape(this.body, settings.shape.radius, settings.shape.offset));
                    break;

                default:
                    throw "Error: Unknown shape `" + setting.shape.type + "`";
            }
        }
        else {
            shape = space.addShape(cp.BoxShape(this.body, settings.spritewidth, settings.spriteheight));
        }

        shape.data = {
            "GUID" : settings.GUID,
            "name" : settings.name
        };
        if (settings.shape && settings.shape.offset) {
            shape.data.offset = {
                "x" : settings.shape.offset.x,
                "y" : settings.shape.offset.y
            };
        }

        shape.setLayers(c.LAYER_SPRITE | c.LAYER_WALL);

        this.parent(
            x,
            y,
            (typeof(settings.image) === "string") ? game.getImage(settings.image) : settings.image,
            settings.spritewidth,
            settings.spriteheight
        );
    },

    "adjustBoxShape" : function adjustBoxShape(x, y, w, h) {
        this.body.shapeList[0].data.offset = {
            "x" : x,
            "y" : -y
        };
        this.body.shapeList[0].setVerts(cm.bb2verts(
            -(~~(w / 2) - x),
            ~~(h / 2) + y,
            w,
            h
        ), cp.vzero);
    },

    "update" : function update() {
        // Update melonJS state with Chipmunk body state.
        this.pos.x = ~~(this.body.p.x - this.hWidth);
        this.pos.y = ~~(c.HEIGHT - this.body.p.y - this.hHeight);

        return this.parent();
    }
});

/**
 * Generic sprite composition manager.
 *
 * Instances of this class look just like an ObjectEntity to melonJS.
 * Except it does not have public user functions for handling movement or
 * physics. (That's Chipmunk-js's job!)
 *
 * If a `compose` property is included on the object (in Tiled), this class
 * will parse it as a composition list, and create new child objects from the
 * composition items within the list.
 *
 * The format of a composition list is an array of objects. Each object must
 * contain at least a `name` key. If the `name` === this object's name, no
 * further keys are required. (This allows specifying the rendering order.)
 * Otherwise, ALL of the following keys are required:
 *
 * - name: Name of the sprite to composite.
 * - class: Class for the sprite to composite. (Usually "me.AnimationSheet")
 * - image: Image reference to use for the sprite.
 * - spritewidth: Width (in pixels) of each frame within the animation sheet.
 * - spriteheight: Height (in pixels) of each frame within the animation sheet.
 *
 * Any arbitrary keys can be included on the composition item; the full item is
 * passed to the composited sprite's constructor, in case it needs additional
 * configuration info from Tiled (including its OWN compositions).
 *
 * If a composition list does NOT reference this object's name, this object will
 * be rendered before the composed objects. To change the rendering order, you
 * MUST reference this object's name within the composition list.
 */
game.Sprite = game.Chipmunk.extend({
    "init" : function init(x, y, settings) {
        var self = this;
        var GUID = me.utils.createGUID();

        settings.GUID = GUID;

        // Create this object.
        self.parent(x, y, settings);

        // Set some things that the engine wants.
        self.GUID = GUID;
        self.name = settings.name ? settings.name.toLowerCase() : "";
        self.isEntity = true;

        // Compose additional sprites.
        if (settings.compose) {
            try {
                var compose = JSON.parse(settings.compose);
            }
            catch (e) {
                throw "Composition setting error. JSON PARSE: " + e + " in " + settings.compose;
            }
            self.composition = [];
            self.children = {};

            if (!Array.isArray(compose)) {
                throw "Composition setting error. NOT AN ARRAY: " + JSON.stringify(compose);
            }

            self.compose = compose;
            self.compose.forEach(function forEach(item) {
                self.addCompositionItem(item);
            });

            // Render this object first, if it is not referenced in the composition list.
            if (self.composition.indexOf(self.name) === -1) {
                self.composition.unshift(self.name);
            }
        }
    },

    "addCompositionItem" : function addCompositionItem(item) {
        var self = this;

        // Validate composition item format.
        if (!game.isObject(item)) {
            throw "Composition setting error. NOT AN OBJECT: " + JSON.stringify(item);
        }

        // Special case for defining rendering order.
        if (item.name === self.name) {
            self.composition.push(item.name);
            return;
        }

        // Require keys.
        [ "name", "class", "image", "spritewidth", "spriteheight" ].forEach(function forEach(key) {
            if (!item.hasOwnProperty(key)) {
                throw "Composition setting error. MISSING KEY `" + key + "`: " + JSON.stringify(item);
            }
        });

        function getClass(str) {
            var node = window;
            var tokens = str.split(".");
            tokens.forEach(function forEach(token) {
                if (typeof(node) !== "undefined") {
                    node = node[token];
                }
            });
            return node;
        }

        var image = (typeof(item.image) === "string" ? game.getImage(item.image) : item.image);

        // `class` should usually be "me.AnimationSheet", but can be anything.
        self.children[item.name] = new (getClass(item.class))(
            self.pos.x,
            self.pos.y,
            image,
            item.spritewidth,
            item.spriteheight,
            self,
            item
        );
        self.composition.push(item.name);
    },

    "setCompositionOrder" : function setCompositionOrder(name, target, after) {
        after = (after ? 1 : -1);

        var current_idx = this.composition.indexOf(name);

        if (typeof(target) === "number") {
            this.composition.splice(current_idx, 1);
            if (target === -1) {
                this.composition.push(name);
            }
            else {
                this.composition.splice(target + +(target < 0), 0, name);
            }
        }
        else {
            var target_idx = this.composition.indexOf(target);

            if (current_idx !== (target_idx + after)) {
                if (current_idx > target_idx) {
                    this.composition.splice(current_idx, 1);
                    this.composition.splice(target_idx, 0, name);
                }
                else {
                    this.composition.splice(target_idx + 1, 0, name);
                    this.composition.splice(current_idx, 1);
                }
            }
        }
    },

    "interact" : function interact(actor) {
        console.warn("Missing interaction for " + this.name + " from " + actor.name);
    },

    "update" : function update() {
        var self = this;
        var results = [];

        // Update this sprite animation.
        results.push(self.parent());

        // Update composited sprite animations.
        if (self.composition) {
            self.composition.forEach(function forEach(name) {
                if (name !== self.name) {
                    results.push(self.children[name].update());
                }
            });
        }

        // Return true if any of the sprites want to be rendered.
        return results.some(function some(result) {
            return result;
        });
    },

    "draw" : function draw(context) {
        if (!this.composition) {
            this.parent(context);
            return;
        }

        // Render all composed sprites in the proper order.
        var self = this;
        self.composition.forEach(function forEach(name) {
            if (name === self.name) {
                self.parent(context);
            }
            else {
                self.children[name].draw(context);
            }
        });
    }
});
