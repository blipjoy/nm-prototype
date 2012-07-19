/* Constants */
var c = {};
try {
    c.__defineGetter__("RESET_DIR", function () { return -1; });
    c.__defineGetter__("UP",        function () { return 0; });
    c.__defineGetter__("RIGHT",     function () { return 1; });
    c.__defineGetter__("DOWN",      function () { return 2; });
    c.__defineGetter__("LEFT",      function () { return 3; });
    c.__defineGetter__("WIDTH",     function () { return 640; });
    c.__defineGetter__("HEIGHT",    function () { return 480; });
}
catch (e) {
    // No getters? FAKE CONSTANTS!
    c.RESET_DIR = -1;
    c.UP        = 0;
    c.RIGHT     = 1;
    c.DOWN      = 2;
    c.LEFT      = 3;
    c.WIDTH     = 640;
    c.HEIGHT    = 480;
}

// Game engine settings.
me.sys.gravity = 0;
//me.sys.dirtyRegion = true; // Be fast!
me.sys.useNativeAnimFrame = true; // Be faster!
//cm.setSync(false); // Be fastest!
//me.debug.renderHitBox = true;
//me.debug.renderCollisionMap = true;
