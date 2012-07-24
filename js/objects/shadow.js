/* Shadow sprites */
game.Shadow = me.AnimationSheet.extend({
    init : function init(x, y, image, w, h, owner) {
        this.parent(x, y, image, w, h);

        this.owner = owner;
        this.updatePosition();
    },

    updatePosition : function updatePosition() {
        this.pos.x = this.owner.pos.x + ~~(this.owner.width / 2) - ~~(this.width / 2);
        this.pos.y = this.owner.pos.y + this.owner.height - ~~(this.height * 0.8);
    },

    update : function update() {
        this.updatePosition();
        return false;
    }
});
