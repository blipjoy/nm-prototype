/* Eyes ... that blink! */
game.BlinkingEyes = me.AnimationSheet.extend({
    "init" : function init(x, y, image, w, h, owner, settings) {
        this.parent(x, y, image, w, h);

        this.settings = settings;
        this.owner = owner;
        this.updatePosition();

        this.addAnimation("walk_down",  [ 0, 1 ]);
        this.addAnimation("walk_right", [ 2, 3 ]);
        this.addAnimation("walk_left",  [ 4, 5 ]);
        this.addAnimation("walk_up",    [ 6, 6 ]);
        this.setCurrentAnimation("walk_down", this.resetAnimation);
        this.animationspeed = 4;
        this.resetAnimation();
    },

    "resetAnimation" : function resetAnimation() {
        this.animationpause = true;
    },

    "updatePosition" : function updatePosition() {
        this.pos.x = this.owner.pos.x + this.settings.offsetx;
        this.pos.y = this.owner.pos.y + this.settings.offsety + (this.owner.current.idx % 2);
    },

    "update" : function update() {
        this.updatePosition();

        var idx = this.current.idx;
        this.setCurrentAnimation("walk_" + this.owner.dir_name, this.resetAnimation);
        this.setAnimationFrame(idx);

        // Awesome random blinking action!
        if ((this.owner.hearts > 0) && this.animationpause && !Math.floor(Math.random() * 100)) {
            // About 1% of of all frames rendered will cause blinking eyes!
            this.animationpause = false;
        }

        return this.parent();
    }
});
