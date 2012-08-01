game.stat = (function stat() {
    var current = null;

    function save(key, value) {
        try {
            if (!current) {
                current = {};
            }
            current[key] = value;
            localStorage.setItem(key, JSON.stringify(value));
            localStorage.setItem("_items", JSON.stringify(Object.keys(current)));
        }
        catch (e) {
            current = null;
            throw "Error saving stat '" + key + "' to localStorage.";
        }
    }

    function load(key) {
        if (!current) {
            try {
                current = {};
                var items = JSON.parse(localStorage.getItem("_items"));
                items.forEach(function forEach(k) {
                    current[k] = JSON.parse(localStorage.getItem(k));
                });
            }
            catch (e) {
                current = null;
                return null;
            }
        }

        return current[key];
    }

    function keys() {
        load();
        if (!current) {
            return null;
        }
        return Object.keys(current);
    }

    return {
        "save" : save,
        "load" : load,
        "keys" : keys
    };
})();
