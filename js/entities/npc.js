game.NPCEntities = {
    Mum : game.NPC.extend({
        quest_started : false,
        quest_complete : false,

        interact : function interact() {
            var self = this;

            if (!self.quest_started) {
                game.dialog([
                    "Mum: Hi Rachel! Welcome to Test island!",
                    "Mum: I seemed to have dropped all of my change. Can you collect it for me?"
                ], function () {
                    self.quest_started = true;
                    game.quests.add({
                        "collect coin" : 300 // Mum wants 300 coins.
                    }, function quest_complete() {
                        self.quest_complete = true;
                        game.dialog([
                            "Congratulations on completing your first quest! Go back and talk to Mum!"
                        ]);
                    });

                    // Create 3 coins
                    [
                        { x : 28, y : 6 },
                        { x : 25, y : 7 },
                        { x : 27, y : 4 }
                    ].forEach(function (pos) {
                        var x = pos.x * 32;
                        var y = pos.y * 32;
                        me.game.add(new game.CoinEntity(x, y, {
                            name            : "coin_gold",
                            image           : "coin_gold",
                            compose         : '[{"name":"shadow","class":"game.Shadow","image":"coin_shadow","spritewidth":10,"spriteheight":5},{"name":"coin_gold"}]',
                            spritewidth     : 18,
                            spriteheight    : 21
                        }), self.z);
                    });
                    me.game.sort(game.sort);
                });
            }
            else if (!self.quest_complete) {
                game.dialog([
                    "Please collect three coins for me! If you collected any before speaking to me, I can't award you for your efforts!"
                ]);
            }
            else {
                game.dialog([
                    "Mum: Thank you, Rachel! You can keep it.",
                    "Mum: You should try the chest on the right."
                ]);
            }
        }
    })
};
