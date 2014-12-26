'use strict';

var AppDispatcher = require('../dispatchers/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var Constants = require('../constants/AppConstants');
var RouteObject = require('../utilities/RouteObject');
var merge = require('react/lib/Object.assign');
var routerFactory = require('route-recognizer/lib/route-recognizer');

//TODO: default root
//TODO: error routes

var _data = {
  routeTable: {},
  current: '',
  queryParams: {},
  params: {},
  routes: [],
};


function getRouteDefinition(routeName) {
  var route = _data.routes.filter(function (route) {
    return route.name === routeName;
  })[0];

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

  for (var i = 0; i < routeUrls.length; i++) {
    var lastIndex = routeUrls.lastIndexOf(routeUrls[i]);
    if (lastIndex != i) {
      throw 'Invalid route table: routes "' + concreteRoutes[i].name + '" and "' + concreteRoutes[lastIndex].name + '" share the same url: "' + concreteRoutes[i].url + '"';
    }
  }
}


function checkNavigability(routeArray) {

  if (!getConcreteRoutes(routeArray).length) {
    throw 'Invalid route table: no non-abstract routes declared';
  }

}


function validateRoutes(routeArray) {

  checkNavigability(routeArray);

  checkForDuplicateUrls(routeArray);

}


function configureRoutes(routeTable) {

  if(!routeTable || routeTable.constructor != RouteObject) {
    throw "routeTable parameter must be an instance of RouteTable";
  }

  var routes = routeTable.getDefinitions();

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

  return route;

}


function getCurrentRoute() {
  return getRoute(window.location.hash);
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
  var paramNames = getRouteDefinition(routeName).getCleanParamNames(),
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
  window.location.hash = getUrl(_data.current, _data.params, _data.queryParams);
  RouteStore.emitChange();
}


var RouteStore = merge({}, EventEmitter.prototype, {

  configureRoutes: configureRoutes,

  getCurrentRoute: getCurrentRoute,

  isCurrentRoute: isCurrentRoute,

  getUrl: getUrl,

  addChangeListener: function (callback) {
    this.on(Constants.CHANGE_EVENT, callback);
  },

  removeChangeListener: function (callback) {
    this.removeListener(Constants.CHANGE_EVENT, callback);
  },

  emitChange: function () {
    this.emit(Constants.CHANGE_EVENT);
  },

  dispatcherIndex: AppDispatcher.register(function (payload) {
    var action = payload.action;

    switch (action.type) {
      case Constants.ActionTypes.NAVIGATE_TO:
        navigateTo(action);
        break;
    }
  })

});


window.onhashchange = function (evt) {
  var newRoute = getRoute(evt.newURL);
  newRoute = newRoute.handler() === '' ? getRoute(evt.oldURL) : newRoute;
  if (newRoute.handler() !== _data.current && newRoute.params !== _data.params && newRoute.queryParams !== _data.queryParams) {
    navigateTo(merge({
      route: newRoute.handler()
    }, newRoute));
  }
};


module.exports = RouteStore;
