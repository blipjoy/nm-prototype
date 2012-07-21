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

    // DEBUG
    var all_shapes = [];


    function step(time) {
        time = time || updates;

        var now = Date.now();
        var delta = (now - lastStep) / 1000;
        lastStep = now;

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

    // Add a shape to the space, and set some default properties.
    function addShape(shape, isStatic) {
        space.addShape(shape);
        shape.setElasticity(isStatic ? 1 : 0);
        shape.setFriction(isStatic ? (me.sys.gravity === 0 ? 0 : 1) : 0.8);

        all_shapes.push(shape);

        return shape;
    }

    // DEBUG
    var DebugObject = Object.extend({
        init : function init() {
            this.visible = true;
        },

        drawSegment : function drawSegment(p, a, b, r) {
            var self = this;

            var da = {
                x : a.x - me.game.viewport.pos.x + p.x,
                y : height - a.y - me.game.viewport.pos.y - p.y
            };
            var db = {
                x : b.x - me.game.viewport.pos.x + p.x,
                y : height - b.y - me.game.viewport.pos.y - p.y
            };

            self.context.strokeStyle = "red";
            self.context.lineCap = "round";
            self.context.lineWidth = r || 1;
            self.context.beginPath();
            self.context.moveTo(da.x, da.y);
            self.context.lineTo(db.x, db.y);
            self.context.stroke();
        },

        drawPoly : function drawPoly(p, verts) {
            var len = verts.length;
            for (var i = 0; i < len; i += 2) {
                this.drawSegment(
                    p,
                    cp.v(verts[i], verts[i + 1]),
                    cp.v(verts[(i + 2) % len], verts[(i + 3) % len])
                );
            }
        },

        update : function update() {
            return debug;
        },

        draw : function draw(context) {
            var self = this;

            self.context = context;
            all_shapes.forEach(function (shape) {
                switch (shape.type) {
                    case "segment":
                        self.drawSegment(shape.body.p, shape.a, shape.b, shape.r);
                        break;

                    case "poly":
                        self.drawPoly(shape.body.p, shape.verts);
                        break;

                    default:
                        console.error("Unknown shape: " + shape.type);
                        break;
                }
            });
        }
    });


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


    /* Install melonJS hooks. */

    // Override me.video.init to capture the canvas height.
    video.init = me.video.init;
    me.video.init = function video_init() {
        height = arguments[2];

        // Call overridden function.
        return video.init.apply(video, arguments);
    };

    // Override me.game.init to start the Chipmunk simulation.
    game.init = me.game.init;
    me.game.init = function game_init() {
        // Call overridden function.
        game.init();

        stepTime = 1 / me.sys.fps;
        lastStep = Date.now();

        space.gravity = cp.v(0, (typeof(me.sys.gravity) === "undefined" ? 1 : me.sys.gravity) * -500);
        space.idleSpeedThreshold = 0.5;
        space.sleepTimeThreshold = 0.5;
        space.collisionSlop = 5;
        if (me.sys.gravity === 0) {
            // For RPGs
            space.damping = 0.00005;
        }

        // Start simulation loop.
        start();
    }

    // Override me.game.add to hook the object collisionBox created by me.game.addEntity.
    game.add = me.game.add;
    me.game.add = function game_add(object) {
        if (object.collisionBox && object.shape) {
            object.collisionBox.shape = object.shape;
        }

        // Call overridden function.
        return game.add.apply(me.game, arguments);
    };

    // Override me.game.addEntity to create Chipmunk shapes for all poly objects.
    game.addEntity = me.game.addEntity;
    me.game.addEntity = function game_addEntity(entity) {
        // Here be magic dragons.
        var isStatic = !entity.name; // Assume only named objects should be affected by gravity.

        // My named entities are now handling Chipmunk on their own
        if (!isStatic) return game.addEntity.apply(me.game, arguments);;

        var offset = {
            x : 0,
            y : 0
        };
        var verts = [];
        var len;
        var shape;

        // Create body.
        if (isStatic) {
            entity.body = space.staticBody;
            offset = {
                x : entity.x,
                y : height - entity.y
            };
        }
        else {
            entity.body = space.addBody(new cp.Body(1, Infinity));
            // FIXME: Position only works for boxes :(
            entity.body.setPos(cp.v(entity.x + entity.width/2, height - entity.y - entity.height/2));
        }

        // FIXME: This creates circular references!
        entity.body.data = entity;

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
                entity.shape = addShape(new cp.PolyShape(entity.body, verts, cp.vzero), isStatic);
            }
            else {
                len = verts.length - 2;
                entity.shapes = []
                for (var i = 0, a, b; i < len; i += 2) {
                    a = cp.v(verts[i  ], verts[i+1]);
                    b = cp.v(verts[i+2], verts[i+3]);
                    // Default radius to 5
                    shape = addShape(new cp.SegmentShape(entity.body, a, b, 5), isStatic);
                    // FIXME: This creates circular references!
                    shape.data = entity;
                    entity.shapes.push(shape);
                }
            }
        }
        else if (isStatic) {
            // Create an offset box shape.
            verts = bb2verts(
                entity.x,
                height - entity.y,
                entity.width,
                entity.height
            );
            entity.shape = addShape(new cp.PolyShape(entity.body, verts, cp.vzero), isStatic);
        }
        else {
            entity.shape = addShape(cp.BoxShape(entity.body, entity.width, entity.height), isStatic);
        }

        // FIXME: This creates circular references!
        if (entity.shape) {
            entity.shape.data = entity;
        }

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
        onResetEvent : function onResetEvent() {
            this.parent.apply(this, arguments);
            if (debug) {
                me.game.add(new DebugObject(), 1000);
                me.game.sort();
            }
        },

        onUpdateFrame : function onUpdateFrame() {
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
        init : function init(x, y, settings) {
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

        // Override entity-to-environment collision, gravity, friction, rotation, etc.
        updateMovement : function updateMovement() {
            // Update Chipmunk body state with melonJS state.
            if (me.sys.gravity === 0) {
                // For RPGs
                this.body.resetForces();
                this.body.applyForce(cp.v(this.vel.x * 600, this.vel.y * -600), cp.vzero);
            }
            else {
                // For platformers
                this.shape.surface_v = cp.v(this.vel.x * 100, this.vel.y * -100);
            }

            // Update melonJS state with Chipmunk body state.
            this.pos.x = this.body.p.x - this.width/2;
            this.pos.y = height - this.body.p.y - this.height/2;

            this.vel.x = ~~this.body.vx;
            this.vel.y = -~~this.body.vy;

            this.angle = -this.body.a;

            // Return empty collision result, for compatibility.
            return {
                "x"     : 0,
                "xtile" : undefined,
                "xprop" : {},
                "y"     : 0,
                "ytile" : undefined,
                "yprop" : {}
            };
        }
    });

    me.Rect = me.Rect.extend({
        // Override me.Rect.adjustSize to adjust the size of the associated shape.
        adjustSize : function adjustSize(x, w, y, h) {
            this.parent(x, w, y, h);
            if (!this.shape) {
                return;
            }

            this.shape.setVerts(bb2verts(
                -(this.container.hWidth - this.colPos.x),
                this.container.hHeight - this.colPos.y,
                this.width,
                this.height
            ), cp.vzero);
        }
    });


    /* Disable some functions for compatibility with games already using melonJS. */

    // Object-to-object collision.
    me.game.collide = function collide() {
        return null;
    };


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

        "bbNewForCircle" : function _bbNewForCircle(p, r) {
            return bbNewForCircle(p, r);
        },

        "bb2verts" : function _bb2verts(x, y, w, h) {
            return bb2verts(x, y, w, h);
        }
    };
})();
