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

/* Create a Chipmunk collision handler for ExitEntity. */
game.installExitHandler = function installExitHandler() {
    /* Player<->ExitEntity collisions */
    if (!game.exitHandlerInstalled) {
        game.exitHandlerInstalled = true;

        cm.getSpace().addCollisionHandler(
            c.COLLIDE_PLAYER,
            c.COLLIDE_EXIT,
            function exit_level(arbiter, space) {
                space.addPostStepCallback(function onPostSteppCallback() {
                    // HACKKKKKK!!!!! :(
                    if (arbiter.b.data.state) {
                        var state = arbiter.b.data.state.toUpperCase();

                        game.modal = true;

                        function go() {
                            me.state.change(me.state[state] || c["STATE_" + state]);
                        }

                        var fade = arbiter.b.data.fade || arbiter.b.data.fadeIn;
                        var duration = arbiter.b.data.duration || 250;
                        if (fade) {
                            me.game.viewport.fadeIn(fade, duration, go);
                        }
                        else {
                            go();
                        }
                    }
                    else {
                        game.play.loadLevel(arbiter.b.data);
                    }
                });

                // Return false so collision does not assert a force.
                return false;
            }
        );
    }
}

/* Exits link maps together. */
game.Exit = me.InvisibleEntity.extend({
    "init" : function init(x, y, settings) {
        this.parent(x, y, settings);

        // Create and configure a static shape.
        var shape = cm.staticBox(x, y, settings.width, settings.height);
        shape.setLayers(c.LAYER_EXIT);
        shape.collision_type = c.COLLIDE_EXIT;
        shape.data = settings;
    }
});
