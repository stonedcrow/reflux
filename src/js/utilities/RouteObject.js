(function () {
    'use strict';

    var immutable = require('immutable');

    function combinePaths() {
        if (arguments.length < 1) {
            throw 'combinePaths requires at least one argument';
        }

        return Array.prototype.slice.apply(arguments)
            .reduce(function (prev, current) {
                if (typeof current !== 'string') {
                    throw 'All arguments given to combinePaths must be of type string';
                }
                var path = (prev || '') + (current.charAt(0) === '/' ? '' : '/') + current;

                return path;
            }, '');
    }


    function getParamNames(urlTemplate) {
        return urlTemplate.match(/:\w+/g) || [];
    }


    function cleanParamName(param) {
        return param.substr(0, 1) === ':' ? param.substr(1) : param;
    }


    var RouteObject = function (name, url) {

        if (this.constructor !== RouteObject) {
            return new RouteObject(name, url)
        }

        if (!name) {
            throw 'name parameter is required';
        }

        if (!url) {
            throw 'url parameter is required';
        }

        url = url.replace('//', '/');

        if (url.charAt(0) === '/') {
            url = url.substr(1, url.length);
        }

        if (url.charAt(url.length - 1) === '/') {
            url = url.substr(0, url.length - 1);
        }

        try {
            var obj = {};
            obj[name] = name;
        } catch (ex) {
            throw '"' + name + '" is not a valid name';
        }

        this._isAbstract = false;
        this._hasForward = false;
        this._forward = null;
        this._children = immutable.List();
        this._parent = null;
        this._name = name;
        this._url = url;

    };


    RouteObject.prototype.name = function () {
        return this._name;
    };


    RouteObject.prototype.url = function () {
        return this._url;
    };


    RouteObject.prototype.isAbstract = function () {
        if (arguments.length > 0) {
            this._isAbstract = !!arguments[0];
            return this;
        } else {
            return this._isAbstract;
        }
    };


    RouteObject.prototype.forward = function () {

        if (arguments.length > 0) {

            if (arguments[0] === false) {
                this._forward = null;
                this._hasForward = false;
                return this;
            }

            var options = arguments[0],
                route = options.route,
                params = options.params || {},
                queryParams = options.queryParams || {};

            if (!route) {
                throw 'must provide the route option';
            }

            if (typeof route !== 'string') {
                throw 'route parameter must be a string';
            }

            if (typeof params !== 'object') {
                throw 'params option must be an object';
            }

            if (typeof queryParams !== 'object') {
                throw 'queryParams option must be an object';
            }

            this._hasForward = true;

            this._forward = {
                route: route,
                params: params,
                queryParams: queryParams
            };

            return this;
        }

        return this._hasForward ? this._forward : false;

    };


    RouteObject.prototype.addChild = function (child) {

        if (!child || child.constructor != RouteObject) {
            throw 'Child must be an instance of RouteObject';
        }

        child._parent = this;

        this._children = this._children.push(child);

        return this;

    };


    RouteObject.prototype.children = function () {
        return this._children;
    };


    RouteObject.prototype.parent = function () {
        return this._parent;
    };


    RouteObject.prototype.getFullName = function () {
        var path = this._name;

        if (this._parent) {
            path = this._parent.getFullName() + '.' + path;
        }

        return path;
    };


    RouteObject.prototype.getPath = function () {
        return this._parent ? combinePaths(this._parent.getPath(), this._url) : combinePaths(this._url);
    };


    RouteObject.prototype.getDefinitions = function () {
        return this._children
            .reduce(function (prev, current) {
                return prev.concat(current.getDefinitions());
            }, immutable.List([{
                name: this.getFullName(),
                path: this.getPath(),
                definition: this
            }]));
    };


    RouteObject.prototype.buildUrl = function (params, queryParams) {

        var url = '#' + this.getPath(),
            paramNames = getParamNames(url),
            queryParamList = [];

        if (paramNames && paramNames.length) {
            for (var j = 0; j < paramNames.length; j++) {
                var param = paramNames[j];
                url = url.replace(param, params[cleanParamName(param)] || '');
            }
        }

        for (var queryParam in queryParams) {
            if (queryParams.hasOwnProperty(queryParam) && queryParams[queryParam]) {
                queryParamList.push(queryParam + '=' + queryParams[queryParam]);
            }
        }

        if (queryParamList.length) {
            url += '?' + queryParamList.join('&');
        }

        return url;
    };


    RouteObject.prototype.paramNames = function () {
        return immutable.List(getParamNames(this.getPath()).map(function (param) {
            return cleanParamName(param);
        }));

    };

    if (typeof define === 'function' && define['amd']) {
        define(function() { return RouteObject; });
    } else if (typeof module !== 'undefined' && module['exports']) {
        module['exports'] = RouteObject;
    } else if (typeof this !== 'undefined') {
        this['RouteObject'] = RouteObject;
    }

}).call(this);

