/* Game namespace */
var game = {
    // Debug mode!
    debug : false,

    // Whether a dialog box is waiting for input.
    modal : false,

    // `true` when an object's y-coordinate changes to put it at the proper Z-order.
    wantsResort : false,

    // Run on page load.
    onload : function () {
        // Initialize the video.
        if (!me.video.init("screen", c.WIDTH, c.HEIGHT)) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // Initialize the audio.
        me.audio.init("ogg");

        // Key bindings.
        me.input.bindKey(me.input.KEY.UP,    "up");
        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.DOWN,  "down");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.W,     "up");
        me.input.bindKey(me.input.KEY.A,     "left");
        me.input.bindKey(me.input.KEY.S,     "down");
        me.input.bindKey(me.input.KEY.D,     "right");
        me.input.bindKey(me.input.KEY.ENTER, "action", true);
        me.input.bindKey(me.input.KEY.SPACE, "action", true);
        me.input.bindKey(me.input.KEY.SHIFT, "shift");

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);

        // Set all resources to be loaded.
        var resources = [];

        // Graphics.
        this.resources["img"].forEach(function (value) {
            resources.push({
                name : value,
                type : "image",
                src  : "resources/img/" + value + ".png"
            })
        });

        // Maps.
        this.resources["map"].forEach(function (value) {
            resources.push({
                name : value,
                type : "tmx",
                src  : "resources/map/" + value + ".tmx"
            })
        });

        // Sound effects.
        this.resources["sfx"].forEach(function (value) {
            resources.push({
                name    : value,
                type    : "audio",
                src     : "resources/sfx/",
                channel : 1
            })
        });

        // Music.
        this.resources["music"].forEach(function (value) {
            resources.push({
                name    : value,
                type    : "audio",
                src     : "resources/music/",
                channel : 2
            })
        });

        // Load the resources.
        me.loader.preload(resources);

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },

    // Run on game resources loaded.
    loaded : function () {
        // Set the "Play" ScreenObject.
        me.state.set(me.state.PLAY, new game.PlayScreen(15));

        // Player entity.
        me.entityPool.add("player", game.PlayerEntity);

        // NPCs
        me.entityPool.add("mum", game.NPCs.Mum);

        // Collectibles
        me.entityPool.add("coin_gold", game.CoinEntity);

        // Start the game.
        me.state.change(me.state.PLAY);
    },

    // Helper function to determine if a variable is an Object.
    isObject : function isObject(object) {
        try {
            return (!Array.isArray(object) && Object.keys(object));
        }
        catch (e) {
            return false;
        }
    },

    // Helper function to sort objects by `z` property, then `y` property.
    sort : function sort(a, b) {
        var result = (b.z - a.z);
        return (result ? result : ((b.pos && b.pos.y) - (a.pos && a.pos.y)) || 0);
    },

    // Simple quests make the game interesting!
    quests : (function () {
        var all = [];
        var subscribed = [];

        /**
         * Update quest progress.
         *
         *
         */
        function progress(event) {
            // Iterate over all active quests on the queue.
            all.forEach(function (quest, key) {
                // When the quest is waiting for this event...
                var i = quest.list.indexOf(event);
                if (i >= 0) {
                    // Remove the event
                    quest.list.splice(i, 1);

                    // When all events have been received...
                    if (quest.list.length === 0) {
                        // Notify, and remove this quest.
                        quest.callback();
                        all.splice(key, 1);
                    }
                }
            });
        }

        return {
            /**
             * Add a new quest.
             *
             * @param {Array} list Array of quest events to subscribe to.
             * @param {Function} callback Called when all events have been received.
             */
            add : function add_quest(list, callback) {
                // Add this quest to the queue.
                all.push({
                    list : list,
                    callback : callback
                });

                // Check for new subscriptions.
                list.forEach(function (item) {
                    if (subscribed.indexOf(item) === -1) {
                        subscribed.push(item);

                        subscribe(item, (function (event) {
                            return function () {
                                progress(event);
                            };
                        })(item));
                    }
                });
            },

            /**
             * Get all active quests
             * @return {Array} Complete list of
             */
            getAll : function get_quests() {
                // Return a copy; don't let callers modify internal state.
                return all.slice(0);
            }
        };
    })()
};
