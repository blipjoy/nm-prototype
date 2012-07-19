game.NPCs = {
    Mum : game.NPCEntity.extend({
        talk : function talk() {
            game.dialog([
                "Mum: Hi Rachel! Welcome to Test island!",
                "Mum: There isn't much to do right now. Remember to come back later!"
            ]);
        }
    })
};
