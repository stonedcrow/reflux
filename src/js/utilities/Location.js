(function () {

    var listeners = [];

    if(window.onhashchange) {
        listeners.push(window.onhashchange);
    }

    window.onhashchange = function(evt) {
        listeners.forEach(function(listener) { listener(evt);});
    }

    var Location = {

        registerHashListener: function (listener) {
            listeners.push(listener);
            return listener.length - 1;
        },

        getCurrentHash: function() {
            var hash =  window.location.hash;
            return hash.charAt(0) === '#' ? hash.substr(1, hash.length) : hash;
        },

        setHash: function(hash, silentChange) {
            hash = hash.replace('//', '/');
            if(hash !== this.getCurrentHash()) {
                if(silentChange) {
                    window.history.replaceState({}, null, hash)
                } else {
                    window.history.pushState({}, null, hash)
                }
            }
        }
    };

    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return Location;
        });
    } else if (typeof module !== 'undefined' && module['exports']) {
        module['exports'] = Location;
    } else if (typeof this !== 'undefined') {
        this['Location'] = Location;
    }

}).call(this);