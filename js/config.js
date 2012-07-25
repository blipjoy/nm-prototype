/* Constants */
var c = {
    DEBUG                   : false,

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

/*
 *              COLLISION TRUTH TABLE
 *          rachel  npc     coin    chest   wall    exit
 *  rachel  -       1       2       1       3       4
 *  npc     -       -               1       3
 *  coin    -       -       -       2       3
 *  chest   -       -       -       -
 *  wall    -       -       -       -       -
 *  exit    -       -       -       -       -       -
 *
 * Hyphen means redundant space.
 * Number specifies collision layers.
 *
 * 1 = NO COIN
 * 2 = NO NPC
 * 3 = NO CHEST
 * 4 = EXIT
 */

    // Chipmunk shape layers
    LAYER_NONE              : 0x00000000,
    LAYER_NO_COIN           : 0x00000001,
    LAYER_NO_NPC            : 0x00000002,
    LAYER_NO_CHEST          : 0x00000004,
    LAYER_EXIT              : 0x00000008,

    // INTERACTIVE is a special layer for doing bb queries when `action` is pressed.
    // Any shapes in this layer will collide! :(
    LAYER_INTERACTIVE       : 0x80000000,

    LAYER_ALL               : 0xFFFFFFFF,

    // Chipmunk collision types
    COLLIDE_PLAYER          : 0x00000001,
    COLLIDE_COLLECTIBLE     : 0x00000002,
    COLLIDE_EXIT            : 0x00000003,
    COLLIDE_PAINFUL         : 0x00000004,
};

// Helper to enable debug by setting a special hash in the URL.
if (document.location.hash === "#debug") {
    c.DEBUG = true;
}

window.addEventListener("hashchange", function onHashChange(e) {
    var debug = (document.location.hash === "#debug");
    me.sys.pauseOnBlur = !debug;
    cm.setDebug(debug);
    c.__defineGetter__("DEBUG", function () {
        return debug;
    });
});

// Turn the `c` object into a hash of constants.
try {
    Object.keys(c).forEach(function eachKey(key) {
        if (typeof(c[key]) === "function") {
            return;
        }

        c.__defineGetter__(
            key,
            (function getterFactory(value) {
                return function returnValue() {
                    return value
                };
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

if (c.DEBUG) {
    me.sys.pauseOnBlur = false;
    cm.setDebug(true);
};
