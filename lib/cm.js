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

// cm = ChipMelon.
window.cm = (function cm() {
    // A global chipmunk space.
    var space = new cp.Space();

    // Sync Chipmunk and melonJS frames?
    var sync = true;

    // DEBUG
    var debug = false;

    // Default: Update space 30 times per second.
    var updates = 1 / 30;

    // !0 when running.
    var running = 0;

    // More timing stuff.
    var stepTime = 0;
    var lastStep = 0;
    var remainder = 0;

    // Viewport height.
    // Needed because Chipmunk's coordinate origin is the bottom left;
    // melonJS's coordinate origin is the upper left of the screen.
    var height = 0;

    // Capture the last object added with me.game.add.
    // Used by me.game.eddEntity to attach
    var lastObjectAdded = null;

    // Overridden functions.
    var video = {};
    var game = {};
    var state = {};


    function step(time) {
        // Do smaller space steps to prevent collisions from going through walls and such.
        time = (time || updates) / 4;

        var now = Date.now();
        var delta = (now - lastStep) / 1000;
        lastStep = now;

        // Do not skip more than 0.04 seconds.
        delta = Math.min(delta, 1 / 25);

        // Step the space until it's caught up.
        remainder += delta;
        while (remainder >= time) {
            remainder -= time;
            space.step(time);
        }

        // Update all games object.
        me.game.update();
    }

    // Start simulation.
    function start() {
        if (sync || running) return;
        running = setInterval(function update_interval() {
            if (!me.state.isRunning()) return;
            step();
        }, updates * 1000);
    }

    // Stop simulation.
    function stop() {
        if (!running) return;
        clearInterval(running);
        running = 0;
    }



    // Create a bounding box from a point and radius (From Chipmunk-js)
    function bbNewForCircle(p, r) {
        return cp.bb(
            p.x - r,
            p.y - r,
            p.x + r,
            p.y + r
        );
    }

    // Convert a bounding box to vertices.
    function bb2verts(l, t, w, h) {
        var b = t - h;
        var r = l + w;
        return [
            l, b,
            l, t,
            r, t,
            r, b
        ];
    }

    // Add a shape to the space, and set some default properties.
    function addShape(shape) {
        space.addShape(shape);
        shape.setElasticity(0);
        shape.setFriction(0);

        return shape;
    }

    // Create a new static shape for the static body, and add it to the space!
    function staticBox(x, y, w, h) {
        var verts = bb2verts(x, height - y, w, h);
        return addShape(new cp.PolyShape(space.staticBody, verts, cp.vzero));
    }

    // Remove body and associated shapes.
    function remove(body) {
        var shapes = [];

        // Collect shapes first.
        // Can't remove in this loop, because Chipmunk uses locks.
        body.eachShape(function eachShape(shape) {
            shapes.push(shape);
        });

        function removeNow() {
            // Now it is safe to remove all bodies and shapes.
            shapes.forEach(function forEach(shape) {
                space.removeShape(shape);
            });
            space.removeBody(body);
        }

        if (space.isLocked()) {
            space.addPostStepCallback(removeNow);
        }
        else {
            removeNow();
        }
    }

    // Remove all bodies and shapes created.
    function removeAll() {
        var bodies = [];
        var shapes = [];

        // Collect bodies and shapes first.
        // Can't remove in this loop, because Chipmunk uses locks.
        space.eachBody(function eachBody(body) {
            bodies.push(body);
        });
        space.eachShape(function eachShape(shape) {
            shapes.push(shape);
        });

        function removeNow() {
            // Now it is safe to remove all bodies and shapes.
            bodies.forEach(function forEach(body) {
                space.removeBody(body);
            });
            shapes.forEach(function forEach(shape) {
                space.removeShape(shape);
            });
        }

        if (space.isLocked()) {
            space.addPostStepCallback(removeNow);
        }
        else {
            removeNow();
        }
    }



    // DEBUG
    var DebugObject = Object.extend({
        "init" : function init() {
            this.visible = true;
            this.isPersistent = true;
        },

        "drawSegment" : function drawSegment(p, a, b, r) {
            var self = this;

            var da = {
                "x" : a.x - this.viewport.x + p.x,
                "y" : height - a.y - this.viewport.y - p.y
            };
            var db = {
                "x" : b.x - this.viewport.x + p.x,
                "y" : height - b.y - this.viewport.y - p.y
            };

            this.context.lineWidth = r || 1;

            this.context.beginPath();
            this.context.moveTo(da.x, da.y);
            this.context.lineTo(db.x, db.y);

            this.context.stroke();
        },

        "drawPoly" : function drawPoly(p, verts) {
            var len = verts.length;
            for (var i = 0; i < len; i += 2) {
                this.drawSegment(
                    p,
                    cp.v(verts[i],              verts[i + 1]),
                    cp.v(verts[(i + 2) % len],  verts[(i + 3) % len])
                );
            }
        },

        "drawCircle" : function drawCircle(p, r, c) {
            this.context.lineWidth = 1;

            this.context.beginPath();
            this.context.arc(
                p.x - this.viewport.x + c.x,
                height - this.viewport.y - p.y - c.y,
                r,
                0,
                Math.PI * 2, true
            );
            this.context.stroke();
        },

        "update" : function update() {
            return debug;
        },

        "draw" : function draw(context) {
            var self = this;

            function drawShapes(body) {
                body.eachShape(function drawShape(shape) {
                    switch (shape.type) {
                        case "segment":
                            self.drawSegment(shape.body.p, shape.a, shape.b, shape.r);
                            break;

                        case "poly":
                            self.drawPoly(shape.body.p, shape.verts);
                            break;

                        case "circle":
                            self.drawCircle(shape.body.p, shape.r, shape.c)
                            break;

                        default:
                            throw "Unknown shape: " + shape.type;
                    }
                });
            }

            self.viewport = me.game.viewport.pos;
            self.context = context;

            self.context.save();
            self.context.strokeStyle = "blue";
            self.context.lineCap = "round";

            space.eachBody(function eachBody(body) {
                drawShapes(body);
            });

            drawShapes(space.staticBody);

            self.context.restore();
        }
    });



    /* Install melonJS hooks. */

    // Override me.game.init to start the Chipmunk simulation.
    game.init = me.game.init;
    me.game.init = function game_init() {
        // Call overridden function.
        game.init();

        height = me.video.getHeight();

        stepTime = 1 / me.sys.fps;
        lastStep = Date.now();

        space.gravity = cp.v(0, 0);
        space.idleSpeedThreshold = 0.5;
        space.sleepTimeThreshold = 0.5;
        space.collisionSlop = 5;
        space.damping = 0.00005;

        // Start simulation loop.
        start();
    }

    // Override me.game.addEntity to create Chipmunk shapes for all poly objects.
    game.addEntity = me.game.addEntity;
    me.game.addEntity = function game_addEntity(entity) {
        // Here be magic dragons.

        // My named entities are now handling Chipmunk on their own.
        if (entity.name) {
            return game.addEntity.apply(me.game, arguments);
        }

        var offset = {
            "x" : 0,
            "y" : 0
        };
        var verts = [];
        var shapes = [];
        var len;

        // Create body.
        entity.body = space.staticBody;
        offset = {
            "x" : entity.x,
            "y" : height - entity.y
        };

        // Create shape.
        if (entity.points) {
            // TODO: Rewind points if they are not ordered clockwise?
            // TODO: Adjust points around center for non-static shapes.
            len = entity.points.length;
            for (var i = 0; i < len; i++) {
                verts.push(entity.points[i].x + offset.x);
                verts.push(-entity.points[i].y + offset.y);
            }

            if (entity.isPolygon) {
                shapes.push(addShape(new cp.PolyShape(entity.body, verts, cp.vzero)));
            }
            else {
                len = verts.length - 2;
                for (var i = 0, a, b; i < len; i += 2) {
                    a = cp.v(verts[i  ], verts[i+1]);
                    b = cp.v(verts[i+2], verts[i+3]);
                    // Default radius to 5
                    shapes.push(addShape(new cp.SegmentShape(entity.body, a, b, 5)));
                }
            }
        }
        else {
            // Create a static box at the proper position within the static body.
            shapes.push(staticBox(
                entity.x,
                entity.y,
                entity.width,
                entity.height
            ));
        }

        // Unnamed objects are walls.
        shapes.forEach(function forEach(shape) {
            shape.data = entity;
            shape.setLayers(c.LAYER_NO_CHEST);

            /* ?!?!?!
            // Chipmunk-js demo uses these for its walls and floor.
            shape.setElasticity(1);
            shape.setFriction(1);
            */
        });

        // Call overridden function (and overridden me.game.add)!
        return game.addEntity.apply(me.game, arguments);
    };

    // Override me.state.resume to reset our lastStep variable.
    state.resume = me.state.resume;
    me.state.resume = function state_resume() {
        // Without this, resuming a paused state would cause the simulation to skip ahead.
        lastStep = Date.now();

        // Call overridden function.
        return state.resume.apply(me.state, arguments);
    };

    // Override me.ScreenObject.onUpdateFrame to only draw, or sync simulation.
    me.ScreenObject = me.ScreenObject.extend({
        "onUpdateFrame" : function onUpdateFrame() {
            // Update the frame counter.
            me.timer.update();

            // Sync melonJS and Chipmunk-js.
            if (sync) {
                step(stepTime);
            }

            // Draw the game objects.
            me.game.draw();

            // Blit our frame.
            me.video.blitSurface();
        }
    });

    me.ObjectEntity = me.ObjectEntity.extend({
        // Override me.ObjectEntity.init to set the body and shape from settings.
        "init" : function init(x, y, settings) {
            if (settings.body)   this.body =   settings.body;
            if (settings.shape)  this.shape =  settings.shape;
            if (settings.shapes) this.shapes = settings.shapes;

            this.parent(x, y, settings);

            // Hook the collision box, for adjusting the shape.
            if (this.collisionBox && settings.shape) {
                this.collisionBox.shape = settings.shape;
                this.collisionBox.container = {
                    hWidth : this.hWidth,
                    hHeight : this.hHeight
                };
            }
        },
    });



    // Public API.
    return {
        "getSpace" : function getSpace() {
            return space;
        },

        // Set how often to update the space.
        "setSync" : function setSync(enable, time) {
            sync = !arguments.length ? true : enable;
            stop();
            updates = time || updates;
            start();
        },

        "setDebug" : function setDebug(enable) {
            if (enable) {
                debug = new DebugObject();
                me.game.add(debug, 1000);
                me.game.sort();
            }
            else if (debug) {
                me.game.remove(debug);
                debug = false;
            }
        },

        "bbNewForCircle" : function _bbNewForCircle(p, r) {
            return bbNewForCircle(p, r);
        },

        "bb2verts" : function _bb2verts(x, y, w, h) {
            return bb2verts(x, y, w, h);
        },

        "staticBox" : function _staticBox(x, y, w, h) {
            return staticBox(x, y, w, h);
        },

        "remove" : function _remove(body) {
            remove(body);
        },

        "removeAll" : function _removeAll() {
            removeAll();
        }
    };
})();
