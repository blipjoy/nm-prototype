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

/* Constants */
var c = {
    "DEBUG"                 : false,

    /*
     * To convert between numeric and named directions:
     * name2dir : c[name.toUpperCase()]
     * dir2name : c.DIR_NAMES[dir]
     */

    // Directions a sprite can face
    "RESET_DIR"             : -1,
    "LEFT"                  : 0,
    "UP"                    : 1,
    "RIGHT"                 : 2,
    "DOWN"                  : 3,

    // Available directions, in a *VERY* specific order.
    "DIR_NAMES"             : [ "left", "up", "right", "down" ],

    // Screen resolution
    "WIDTH"                 : 640,
    "HEIGHT"                : 480,

    // States
    "STATE_INFO"            : me.state.USER + 0,
    "STATE_INTRO"           : me.state.USER + 1,

    // Keys
    "KEY_APOS"              : 222, // Apostrophe (aka single-quote)

/*
 *              COLLISION TRUTH TABLE
 *          rachel  npc     coin    chest   wall    exit    baddie
 *  rachel  -       1       2       1       3       4       5
 *  npc     -       -               1       3               5
 *  coin    -       -       -       2       3
 *  chest   -       -       -       -
 *  wall    -       -       -       -       -
 *  exit    -       -       -       -       -       -
 *  baddie  -       -       -       -       -       -       -
 *
 * Hyphen means redundant space.
 * Number specifies collision layers.
 *
 * 1 = NO COIN
 * 2 = NO NPC
 * 3 = NO CHEST
 * 4 = EXIT
 * 5 = LIVING
 */

    // Chipmunk shape layers
    "LAYER_NONE"            : 0x00000000,
    "LAYER_NO_COIN"         : 0x00000001,
    "LAYER_NO_NPC"          : 0x00000002,
    "LAYER_NO_CHEST"        : 0x00000004,
    "LAYER_EXIT"            : 0x00000008,
    "LAYER_LIVING"          : 0x00000010,

    // INTERACTIVE is a special layer for doing bb queries when `action` is pressed.
    // Any shapes in this layer will collide! :(
    "LAYER_INTERACTIVE"     : 0x80000000,

    "LAYER_ALL"             : 0xFFFFFFFF,

    // Chipmunk shape groups
    "GROUP_COINS"           : 1,

    // Chipmunk collision types
    "COLLIDE_PLAYER"        : 0x00000001,
    "COLLIDE_COLLECTIBLE"   : 0x00000002,
    "COLLIDE_EXIT"          : 0x00000003,
    "COLLIDE_BADDIE"        : 0x00000004,
    "COLLIDE_GOODIE"        : 0x00000005
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
//me.sys.useNativeAnimFrame = true; // Be faster!
//cm.setSync(false); // Be fastest!
//me.debug.renderHitBox = true;
//me.debug.renderCollisionMap = true;
me.sys.stopOnAudioError = false;

if (c.DEBUG) {
    me.sys.pauseOnBlur = false;
    cm.setDebug(true);
};
