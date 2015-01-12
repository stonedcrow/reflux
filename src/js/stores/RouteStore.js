(function () {
    'use strict';

    var AppDispatcher = require('../dispatchers/AppDispatcher');
    var EventEmitter = require('events').EventEmitter;
    var AppConstants = require('../constants/AppConstants');
    var RouteObject = require('../utilities/RouteObject');
    var merge = require('react/lib/Object.assign');
    var routerFactory = require('route-recognizer');
    var Location = require('../utilities/Location');

//TODO: default root
//TODO: error routes

    var _data = {
        routeTable: {},
        current: '',
        queryParams: {},
        params: {},
        routes: []
    };


    function getRouteDefinition(routeName) {
        var route = _data.routes.filter(function (route) {
            return route.name === routeName;
        }).first();

        return route ? route.definition : null;
    }


    function getUrl(routeName, params, queryParams) {
        return getRouteDefinition(routeName).buildUrl(params, queryParams);
    }


    function routeHandlerFactory(routeName) {
        return function () {
            return routeName;
        };
    }


    function getConcreteRoutes(routeArray) {
        return routeArray.filter(function (route) {
            return !route.definition.isAbstract();
        });
    }


    function checkForDuplicateUrls(routeArray) {

        var concreteRoutes = getConcreteRoutes(routeArray),
            routeUrls = concreteRoutes.map(function (route) {
                return route.path;
            });

        for (var i = 0; i < routeUrls.size; i++) {
            var iRoute = concreteRoutes.get(i),
                lastIndex = routeUrls.lastIndexOf(iRoute.path);
            if (lastIndex != i) {
                var lastRoute = concreteRoutes.get(lastIndex).name;
                throw 'Invalid route table: routes "' + iRoute.name + '" and "' + lastRoute + '" share the same url: "' + iRoute.path + '"';
            }
        }
    }


    function checkNavigability(routeArray) {

        if (getConcreteRoutes(routeArray).size === 0) {
            throw 'Invalid route table: no non-abstract routes declared';
        }

    }


    function validateRoutes(routeArray) {

        checkNavigability(routeArray);

        checkForDuplicateUrls(routeArray);

    }


    function configureRoutes(routeObject) {

        if (!routeObject || routeObject.constructor != RouteObject) {
            throw 'routeObject parameter must be an instance of RouteObject';
        }

        var routes = routeObject.getDefinitions();

        validateRoutes(routes);

        _data.router = new routerFactory();

        _data.routes = routes;


        getConcreteRoutes(_data.routes)
            .map(function (route) {
                return {
                    path: route.path,
                    handler: routeHandlerFactory(route.name)
                };
            })
            .forEach(function (route) {
                _data.router.add([route]);
            });
    }


    function getQueryParamValues(routeHash) {
        var queryPart = routeHash.split('?')[1];

        if (!queryPart) {
            return {};
        }

        var partsObject = {};
        var parts = queryPart.split('&');

        parts.map(function (part) {
            return part.split('=');
        }).forEach(function (part) {
            partsObject[part[0]] = part[1];
        });

        return partsObject;
    }


    function getHashFragment(url) {
        var hashFragment = url.search('#') > -1 ? url.split('#')[1] || '' : url;

        return hashFragment.split('?')[0] || '';
    }


    function getRoute(url) {

        var route = (_data.router.recognize(getHashFragment(url)) || [])[0] || {
                handler: function () {
                    return '';
                }
            };

        route.queryParams = getQueryParamValues(url);

        route.name = route.handler();

        return route;

    }


    function getCurrentRoute() {
        return getRoute(Location.getCurrentHash());
    }


    function isCurrentRoute(routeName) {
        return getCurrentRoute().handler().search(routeName) === 0;
    }


    function getNavigableRoute(routeName) {
        var definition = getRouteDefinition(routeName);

        while (definition && definition.isAbstract() && !definition.forward()) {
            definition = definition.parent();
        }

        if (definition) {
            return definition.isAbstract() ? merge({}, definition.forward()) : {route: definition.getFullName()};
        }

        throw 'Attempted to navigate to abstract route "' + routeName + '", but no non-abstract parent routes were available to fall back to.';
    }


    function constructQueryParamObject(routeOptions, currentQueryParams, fallbackRoute) {

        var newParams = merge({}, routeOptions.queryParams, fallbackRoute.queryParams);
        var oldParams = merge({}, currentQueryParams);

        if (routeOptions.keepQueryParams === true) {
            merge(newParams, oldParams);
        } else if (Object.prototype.toString.call(routeOptions.keepQueryParams) === '[object Array]') {
            for (var param in oldParams) {
                if (routeOptions.keepQueryParams.indexOf(param) === -1) {
                    delete oldParams[param];
                }
            }
            merge(newParams, oldParams);
        }

        return newParams;

    }


    function constructParamObject(routeName) {
        var paramNames = getRouteDefinition(routeName).paramNames(),
            paramObject = merge.apply(null, [{}].concat(Array.prototype.slice.call(arguments, 1)));

        for (var param in paramObject) {
            if (paramNames.indexOf(param) === -1) {
                delete paramObject[param];
            }
        }

        return paramObject;
    }


    function navigateTo(routeOptions) {

        var navigableRoute = getNavigableRoute(routeOptions.route);

        _data.current = navigableRoute.route;

        _data.queryParams = constructQueryParamObject(routeOptions, _data.queryParams, navigableRoute);

        _data.params = constructParamObject(_data.current, _data.params, routeOptions.params, navigableRoute.params);

        Location.setHash(getUrl(_data.current, _data.params, _data.queryParams), !!routeOptions.silent);

        RouteStore.emitChange();
    }

    function handleHashChange(evt) {

        var newURL = evt.newURL || '',
            oldURL = evt.oldURL || '',
            newRoute = getRoute(newURL);

        newRoute = newRoute.handler() === '' ? getRoute(oldURL) : newRoute;

        if (newRoute.handler() !== _data.current && newRoute.params !== _data.params && newRoute.queryParams !== _data.queryParams) {

            navigateTo(merge({
                route: newRoute.handler()
            }, newRoute));

        }
    }


    var RouteStore = merge({}, EventEmitter.prototype, {

        configureRoutes: configureRoutes,

        getCurrentRoute: getCurrentRoute,

        isCurrentRoute: isCurrentRoute,

        getUrl: getUrl,

        addChangeListener: function (callback) {
            this.on(AppConstants.ActionSources.CHANGE_EVENT, callback);
        },

        removeChangeListener: function (callback) {
            this.removeListener(AppConstants.ActionSources.CHANGE_EVENT, callback);
        },

        emitChange: function () {
            this.emit(AppConstants.ActionSources.CHANGE_EVENT);
        },

        dispatcherIndex: AppDispatcher.register(function (payload) {
            var action = payload.action;

            switch (action.type) {
                case AppConstants.ActionSources.ROUTE_NAVIGATE_TO:
                    navigateTo(action);
                    break;
            }
        }),

        onHashChangeIndex: Location.registerHashListener(handleHashChange)

    });


    if (typeof define === 'function' && define['amd']) {
        define(function () {
            return RouteStore;
        });
    } else if (typeof module !== 'undefined' && module['exports']) {
        module['exports'] = RouteStore;
    } else if (typeof this !== 'undefined') {
        this['RouteStore'] = RouteStore;
    }

}).call(this);