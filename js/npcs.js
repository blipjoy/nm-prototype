game.NPCs = {
    Mum : game.NPCEntity.extend({
        quest_started : false,
        quest_complete : false,

        interact : function interact() {
            var self = this;

            if (!self.quest_started) {
                game.dialog([
                    "Mum: Hi Rachel! Welcome to Test island!",
                    "Mum: I seemed to have dropped all of my change. Can you collect it for me?"
                ]);

                self.quest_started = true;
                game.quests.add([
                    "collect coin",
                    "collect coin",
                    "collect coin"
                ], function quest_complete() {
                    self.quest_complete = true;
                    game.dialog([
                        "Congratulations on completing your first quest! Go back and talk to Mum!"
                    ]);
                });
            }
            else if (!self.quest_complete) {
                game.dialog([
                    "Please collect three coins for me! If you collected any before speaking to me, I can't award you for your efforts!"
                ]);
            }
            else {
                game.dialog([
                    "Mum: Thank you, Rachel! You can keep it."
                ]);
            }
        }
    })
};
