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
