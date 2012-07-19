/* Game namespace */
var game = {
    // Whether a dialog box is waiting for input.
    modal : false,

    onload : function () {
        // Initialize the video.
        if (!me.video.init("game", 640, 480)) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }

        // Initialize the audio.
        me.audio.init("mp3,ogg");

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
        this.resources["img"].forEach(function (value) {
            resources.push({
                name : value,
                type : "image",
                src  : "resources/img/" + value + ".png"
            })
        });
        this.resources["map"].forEach(function (value) {
            resources.push({
                name : value,
                type : "tmx",
                src  : "resources/map/" + value + ".tmx"
            })
        });
        me.loader.preload(resources);

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },

    loaded : function () {
        // Set the "Play" ScreenObject.
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // Player entity.
        me.entityPool.add("player", game.PlayerEntity);

        // NPCs
        me.entityPool.add("mum", game.NPCs.Mum);

        // Start the game.
        me.state.change(me.state.PLAY);
    }
};
