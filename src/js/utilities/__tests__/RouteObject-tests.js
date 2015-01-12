jest.dontMock('../RouteObject.js');

describe('RouteObject', function () {

    var ro,
        name,
        url,
        routeObject;

    beforeEach(function () {
        ro = require('../RouteObject');
        name = 'name';
        url = 'base';
        routeObject = new ro(name, url);
    });

    describe('constructor', function () {

        describe('should throw an exception', function () {

            it('if no name is provided', function () {
                try {
                    new ro();
                    expect(true).toBe(false);
                } catch (ex) {
                    expect(ex).toBe('name parameter is required');
                }
            });

            it('if no url is provided', function () {
                try {
                    new ro('name');
                } catch (ex) {
                    expect(ex).toBe('url parameter is required');
                }
            });

            it('for invalid names', function () {
                try {
                    new ro('name.+', 'what');
                } catch (ex) {
                    expect(ex).toBe('name.+ is not a valid name');
                }
            });

        });

        describe('should set default: ', function () {

            it('_isAbstract to false', function () {
                expect(routeObject._isAbstract).toBe(false);
            });

            it('_hasForward to false', function () {
                expect(routeObject._hasForward).toBe(false);
            });

            it('_forward to null', function () {
                expect(routeObject._forward).toBeNull();
            });

            it('_parent to null', function () {
                expect(routeObject._parent).toBeNull();
            });

            it('_children to an Immutable List', function () {
                var Immutable = require('immutable');
                expect(Immutable.List.isList(routeObject._children)).toBe(true);
            });

            it('_name to the provided value', function () {
                expect(routeObject._name).toBe(name)
            });

            it('_url to the provided value', function () {
                expect(routeObject._url).toBe(url)
            });


        });

        it('should return the correct name', function () {
            expect(routeObject.name()).toBe(name)
        });

        it('should return the correct url', function () {
            expect(routeObject.url()).toBe(url)
        });

    });

    describe('isAbstract', function () {

        it('should return the value of _isAbstract if called with no arguments', function () {
            expect(routeObject.isAbstract()).toBe(routeObject._isAbstract);
        });

        it('should set the value of _isAbstract', function () {

            routeObject.isAbstract(true);

            expect(routeObject._isAbstract).toBe(true);

        });

        it('should coerce any argument to a bool', function () {

            routeObject.isAbstract('this should be coerced to true');

            expect(routeObject._isAbstract).toBe(true);

        })
    });

    describe('forward', function () {

        describe('getter', function () {

            it('should return false if _hasForward is false', function () {
                expect(routeObject.forward()).toBe(false);
            });

        });

        describe('setter', function () {

            describe('should throw an exception', function () {

                it('if the route option is not provided', function () {
                    try {
                        routeObject.forward({});
                    } catch (ex) {
                        expect(ex).toBe('must provide the route option');
                    }
                });

                it('if the route parameter is not a string', function () {
                    try {
                        routeObject.forward({
                            route: 1
                        });
                    } catch (ex) {
                        expect(ex).toBe('route parameter must be a string');
                    }
                });

                it('if the params option is provided but is not an object', function () {
                    try {
                        routeObject.forward({
                            route: 'thing',
                            params: 'what'
                        });
                    } catch (ex) {
                        expect(ex).toBe('params option must be an object');
                    }
                });

                it('if the queryParams option is provided but is not an object', function () {
                    try {
                        routeObject.forward({
                            route: 'thing',
                            queryParams: 'what'
                        });
                    } catch (ex) {
                        expect(ex).toBe('queryParams option must be an object');
                    }
                });

            });

            it('should update _forward and _hasForward', function () {

                var forwardObj = {
                    route: 'thing',
                    params: {
                        here: 'there'
                    },
                    queryParams: {
                        every: 'where'
                    }
                };

                var obj = routeObject.forward(forwardObj);

                expect(obj).toBe(routeObject);

                expect(obj._hasForward).toBe(true);

                expect(obj._forward).toEqual(forwardObj);

                expect(obj.forward()).toEqual(forwardObj);

            });

            it('should update _hasForward and null _forward if given false', function () {

                routeObject.forward({route: 'what'});

                routeObject.forward(false);

                expect(routeObject._hasForward).toBe(false);

                expect(routeObject._forward).toBeNull();

            });

        });

    });

    describe('addChild', function () {


        it('should throw an exception if it is passed nothing', function () {
            try {
                routeObject.addChild();
                expect(true).toBe(false, 'should have thrown an exception');
            } catch (ex) {
                expect(ex).toBe('Child must be an instance of RouteObject');
            }
        });

        it('should throw an exception if it is not passed an instance of RouteObject', function () {
            try {
                routeObject.addChild({});
                expect(true).toBe(false, 'should have thrown an exception');
            } catch (ex) {
                expect(ex).toBe('Child must be an instance of RouteObject');
            }
        });

        it('should set the child and it\'s parent', function () {

            var child = new ro('another,', 'routeObject');

            var obj = routeObject.addChild(child);

            expect(obj).toBe(routeObject);

            expect(obj._children.contains(child)).toBe(true);

            expect(child._parent).toBe(obj);
        });


    });

    describe('children', function () {

        it('should return a list of the object\'s children', function() {
            var child1 = new ro('child1', 'one'),
                child2 = new ro('child2', 'two');

            routeObject.addChild(child1);
            routeObject.addChild(child2);

            var children = routeObject.children();

            expect(children.size).toBe(2);
            expect(children.contains(child1)).toBe(true);
            expect(children.contains(child2)).toBe(true);
        });

    });

    describe('parent', function() {

        it('should return the object\'s parent', function() {

            var child = new ro('child', 'child');

            routeObject.addChild(child);

            expect(child.parent()).toBe(routeObject);

        });

    });

    describe('getFullName', function() {

        it('should return top level name', function() {

            expect(routeObject.getFullName()).toBe(name);

        });

        it('should return a child\'s name', function() {

            var child = new ro('child', 'child');

            routeObject.addChild(child);

            expect(child.getFullName()).toBe('name.child');

        });

        it('should return a heavily nested name with abstract routes', function() {


            var levels = new ro('levels','levels'),
                nested = new ro('nested', 'nested').isAbstract(true).addChild(levels),
                many = new ro('many', 'many').addChild(nested),
                so = new ro('so', 'so').addChild(many);

            expect(so.getFullName()).toBe('so');
            expect(many.getFullName()).toBe('so.many');
            expect(nested.getFullName()).toBe('so.many.nested');
            expect(levels.getFullName()).toBe('so.many.nested.levels');

        });

    });

    describe('getPath', function() {

        it('should return a top level path', function() {

            var obj = new ro('top', 'top');

            expect(obj.getPath()).toBe('/top');

        });

        it('should sterilize top level path slashes', function() {

            var obj = new ro('top','//top/');

            expect(obj.getPath()).toBe('/top');

        });

        it('should calculate nested paths', function() {

            var levels = new ro('levels','//levels'),
                nested = new ro('nested', 'nested/').isAbstract(true).addChild(levels),
                many = new ro('many', 'many/tiny/').addChild(nested),
                so = new ro('so', 'so').addChild(many);

            expect(so.getPath()).toBe('/so');
            expect(many.getPath()).toBe('/so/many/tiny');
            expect(nested.getPath()).toBe('/so/many/tiny/nested');
            expect(levels.getPath()).toBe('/so/many/tiny/nested/levels');
        });

    });

    describe('getDefinitions', function() {

        it('should return all definitions for a tree', function() {

            var levels = new ro('levels','//levels'),
                nested = new ro('nested', 'nested/').isAbstract(true).addChild(levels),
                many = new ro('many', 'many/tiny/').addChild(nested),
                so = new ro('so', 'so').addChild(many);


            var definitions = so.getDefinitions();

            expect(definitions.size).toBe(4);

            expect(definitions.get(0).name).toBe(so.getFullName());
            expect(definitions.get(0).path).toBe(so.getPath());
            expect(definitions.get(0).definition).toBe(so);

            expect(definitions.get(1).name).toBe(many.getFullName());
            expect(definitions.get(1).path).toBe(many.getPath());
            expect(definitions.get(1).definition).toBe(many);

            expect(definitions.get(2).name).toBe(nested.getFullName());
            expect(definitions.get(2).path).toBe(nested.getPath());
            expect(definitions.get(2).definition).toBe(nested);

            expect(definitions.get(3).name).toBe(levels.getFullName());
            expect(definitions.get(3).path).toBe(levels.getPath());
            expect(definitions.get(3).definition).toBe(levels);

        });

    });

    describe('buildUrl', function() {

        it('should build a parameter-less url', function() {

            var obj1 = new ro('bottom', 'bottom');
            new ro('top','top').addChild(obj1);

            expect(obj1.buildUrl()).toBe('#/top/bottom');

        });

        it('should build a url with parameters', function() {

            var obj1 = new ro('bottom', 'bottom/:id');
            new ro('top', ':topId').addChild(obj1);

            expect(obj1.buildUrl({topId: 'this', id: 'last'})).toBe('#/this/bottom/last')
        });

        it('should add query parameters to the url', function() {

        });

        it('should add queryParameters to a url', function() {

            var obj = new ro('route', '/:id');

            expect(obj.buildUrl({id: '1'}, {thing:'what is this'})).toBe('#/1?thing=what is this');

        });

    });

    describe('paramNames', function() {

        it('should return a list of the route\'s param names', function() {

            var obj = new ro('name', ':what/:how/:who');
            new ro('where', 'where/:when').addChild(obj);

            var paramNames = obj.paramNames();

            expect(paramNames.size).toBe(4);

            expect(paramNames.contains('when')).toBe(true);
            expect(paramNames.contains('what')).toBe(true);
            expect(paramNames.contains('how')).toBe(true);
            expect(paramNames.contains('who')).toBe(true);


        });

    });

});