game.resources = {
    /* Graphics. */
    "img" : [
        // UI
        "dialog",
        "heart_empty",
        "heart_half",
        "heart_full",
        "logo",

        // Characters
        "rachel",
        "rachel_eyes",
        "abi",
        "abi_eyes",
        "george",
        "george_eyes",
        "jessica",
        "jessica_eyes",
        "whitey",
        "whitey_eyes",
        "char_shadow",

        // Baddies
        "snake",

        // Collectibles
        "coin_gold",
        "coin_silver",
        "coin_shadow",
        "hammer",

        // Interactive objects
        "chests",

        // Tile maps
        /* island */
        "animwater",
        "grass",
        "sandwater",
        "treetop",
        "trunk",

        /* rachels_room */
        "accessories",
        "cabinets",
        "country",
        "floor",
        "house",
        "inside",
        "stairs",
        "victoria",

        /* rachels_house */
        "kitchen",

        /* earth */
        "barrel",
        "bridges",
        "buckets",
        "dirt",
        "dirt2",
        "doors",
        "farming_fishing",
        "fence",
        "fence_alt",
        "flowers_2",
        "grassalt_flowers",
        "housey",
        "misc",
        "mountains",
        "shadow",
        "signs",
        "stonepattern",
        "town_buildings",
        "tree_stump",
        "victorian_house",
        "windmill"
    ],

    /* Maps from Tiled. */
    "map" : [
        "island",
        "earth",
        "general_store",
        "rachels_room",
        "rachels_house",
        "shed"
    ],

    /* 1-channel audio. Usually sound effects. */
    "sfx" : [
        "chests",
        "collect_coin",
        "dying",
        "fanfare",
        "hurt",
        "mallet_swing",
        "mallet_whomp"
    ],

    /* 2-channel audio. Usually music. */
    "bgm" : [
        "bells",
        "del_erad",
        "pink_and_lively",
        "random_and_cheap"
    ]
};

game.info = {
    "audio_error" : [
        {
            "messages" : [
                "Your browser does not support Ogg-Vorbis audio.",
                "Sounds have been disabled.",
                "",
                "Press [Enter] or [Space] to continue."
            ]
        }
    ]
};

game.story = {
    "intro" : [
        {
            "image" : null,
            "messages" : [
                "Papa used to tell me stories of an island he called Neverwell.",
                "Some of his stories were frightening, but they always",
                "had a happy ending."
            ]
        },
        {
            "image" : null,
            "messages" : [
                "He would tell me of the people that lived on Neverwell. How",
                "different they were from us; Some could harness the power of",
                "magic in their bare hands. And even the youngest weren't",
                "afraid to go adventuring."
            ]
        },
        {
            "image" : null,
            "messages" : [
                "There were monsters, treasures buried in deep caves, and",
                "thieves hiding in the mountains. And he had seen it all."
            ]
        },
        {
            "image" : null,
            "messages" : [
                "Papa would talk about about so many things that it seemed",
                "impossible to put it all on one island. I guess that's why he",
                "set some of his adventures on smaller islands around",
                "the mainland."
            ]
        },
        {
            "image" : null,
            "messages" : [
                "I remember the moor on Neverwell held a special place in",
                "Papa's heart. He said it was the most dangerous place he",
                "ever saw, but that it held some kind of a secret...",
                "Maybe it was the source of the inhabitant's magic?"
            ]
        },
        {
            "image" : null,
            "messages" : [
                "Papa died 10 years ago, so I'll never know the answer.",
                "I'm 15 now."
            ]
        },
        {
            "image" : null,
            "messages" : [
                "These days I help my best friend Jessica with chores. That's",
                "about as adventurous as I get. We live on an island we",
                "call Earth. The only island there is..."
            ]
        }
    ],

    "gameover" : [
        {
            "image" : null,
            "messages" : [
                "Rachel ... Rachel? Is that you, Rachel?",
                "It isn't your time yet ...",
                "",
                "You're going back, now, Rachel.",
                "This will all seem like just a dream ...",
                "Good luck, Rachel.",
                "I love you ...",
                "",
                "Press [Enter] or [Space] to continue."
            ]
        }
    ]
};
