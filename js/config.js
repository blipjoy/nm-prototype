/* Constants */
var c = {
    /*
     * To convert between numeric and named directions:
     * name2dir : c[name.toUpperCase()]
     * dir2name : c.DIR_NAMES[dir]
     */

    // Directions a sprite can face
    RESET_DIR               : -1,
    LEFT                    : 0,
    UP                      : 1,
    RIGHT                   : 2,
    DOWN                    : 3,

    // Available directions, in a *VERY* specific order.
    DIR_NAMES               : [ "left", "up", "right", "down" ],

    // Screen resolution
    WIDTH                   : 640,
    HEIGHT                  : 480,

    // Chipmunk shape layers
    LAYER_NONE              : 0x00000000,
    LAYER_SPRITE            : 0x00000001,
    LAYER_INTERACTIVE       : 0x00000002,
    LAYER_WALL              : 0x00000004,
    LAYER_ALL               : 0xFFFFFFFF,

    // Chipmunk collision types
    COLLIDE_PLAYER          : 0x00000001,
    COLLIDE_COLLECTIBLE     : 0x00000002,
    COLLIDE_EXIT            : 0x00000003,
    COLLIDE_PAINFUL         : 0x00000004
};

try {
    Object.keys(c).forEach(function (key) {
        if (typeof(c[key]) === "function") {
            return;
        }

        c.__defineGetter__(
            key,
            (function (value) {
                return function () { return value };
            })(c[key])
        );
    });
}
catch (e) {
    // No getters? FAKE CONSTANTS!
}


// Game engine settings.
me.sys.gravity = 0;
//me.sys.dirtyRegion = true; // Be fast!
me.sys.useNativeAnimFrame = true; // Be faster!
//cm.setSync(false); // Be fastest!
//me.debug.renderHitBox = true;
//me.debug.renderCollisionMap = true;
