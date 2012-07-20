/* Constants */
var c = {
    // Directions a sprite can face
    RESET_DIR               : -1,
    UP                      : 0,
    RIGHT                   : 1,
    DOWN                    : 2,
    LEFT                    : 3,

    // Screen resolution
    WIDTH                   : 640,
    HEIGHT                  : 480,

    // Chipmunk shape layers
    LAYER_NONE              : 0x00000000,
    LAYER_SPRITE            : 0x00000001,
    LAYER_INTERACTIVE       : 0x00000002,

    // Chipmunk collision types
    COLLIDE_PLAYER          : 0x00000001,
    COLLIDE_COLLECTIBLE     : 0x00000002,
    COLLIDE_PAINFUL         : 0x00000003
};

try {
    Object.keys(c).forEach(function (key) {
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
