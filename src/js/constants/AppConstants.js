(function () {

    var keyMirror = require('react/lib/keyMirror');

    var AppConstants = {
        ActionSources: keyMirror({
            CHANGE_EVENT: null,
            ROUTE_NAVIGATE_TO: null
        }),
        ActionSources: keyMirror({
            SERVER_ACTION: null,
            VIEW_ACTION: null
        })
    };

    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return RouteStore;
        });
    } else if (typeof module !== 'undefined' && module['exports']) {
        module['exports'] = AppConstants;
    } else if (typeof this !== 'undefined') {
        this['AppConstants'] = AppConstants;
    }
}).call(this);