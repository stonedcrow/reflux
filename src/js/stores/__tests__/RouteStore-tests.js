jest.dontMock('../../utilities/RouteObject.js');
jest.dontMock('../RouteStore.js');


describe('RouteStore', function () {

    var ad,
        store,
        ro,
        dispachHandler,
        hashHandler,
        loc;

    beforeEach(function () {

        ad = require('../../dispatchers/AppDispatcher');
        loc = require('../../utilities/Location');
        ro = require('../../utilities/RouteObject');

        spyOn(ad, 'register').andCallFake(function (func) {
            dispachHandler = func;
        });

        spyOn(loc, 'registerHashListener').andCallFake(function (handler) {
            hashHandler = handler;
        });

         store = require('../RouteStore');

    });

    describe('init', function () {

        it('should register with the AppDispatcher', function () {
            expect(ad.register).toHaveBeenCalled();
        });

        it('should register a hashChangeListener', function () {
            expect(loc.registerHashListener).toHaveBeenCalled();
        })

    });

    describe('configureRoutes', function () {

        it('should accept a route tree', function () {

            var tree = new ro('base', 'base')
                .addChild(new ro('branch', 'branch')
                    .addChild(new ro('leaf1', 'leaf1')
                        .addChild(new ro('leaf1', 'leaf1'))));

            store.configureRoutes(tree);

        });

        it('should throw an exception if a non RouteObject is supplied', function () {

            try {
                store.configureRoutes({});
                expect(true).toBe(false, 'should have thrown an exception');
            } catch (ex) {
                expect(ex).toBe('routeObject parameter must be an instance of RouteObject');
            }

        });

        it('should throw an exception if no non-abstract routes are provided', function () {

            var tree = new ro('base', 'base')
                .isAbstract(true)
                .addChild(new ro('branch', 'branch')
                    .isAbstract(true)
                    .addChild(new ro('leaf1', 'leaf1')
                        .isAbstract(true)
                        .addChild(new ro('leaf1', 'leaf1')
                            .isAbstract(true))));

            try {
                store.configureRoutes(tree);
                expect(true).toBe(false, 'should have thrown an exception');
            } catch (ex) {
                expect(ex).toBe('Invalid route table: no non-abstract routes declared');
            }

        });

        it('should throw an exception if the route tree contains any duplicate paths', function () {

            var tree = new ro('base', 'base')
                .addChild(new ro('branch1', 'branch'))
                .addChild(new ro('branch2', 'branch'));

            try {
                store.configureRoutes(tree);
                expect(true).toBe(false, 'should have thrown an exception');
            } catch (ex) {
                expect(ex).toBe('Invalid route table: routes "base.branch1" and "base.branch2" share the same url: "/base/branch"');
            }

        });

    });

    describe('routes', function () {

        var tree;

        beforeEach(function () {

            tree = new ro('base', 'base/:baseId')
                .addChild(new ro('branch', 'branch/:branchId')
                    .addChild(new ro('leaf', ':leafId'))
                    .addChild(new ro('flower', 'flower/:flowerId')));

            store.configureRoutes(tree);

        });

        describe('getCurrentRoute', function () {

            it('should return the current route', function () {

                spyOn(loc, 'getCurrentHash').andReturn('/base/thing/branch/2/greenLeaf?time=day');

                var route = store.getCurrentRoute();

                expect(loc.getCurrentHash).toHaveBeenCalled();

                expect(route.name).toBe('base.branch.leaf');

                expect(route.params).toEqual({baseId: 'thing', branchId: '2', leafId: 'greenLeaf'});

                expect(route.queryParams).toEqual({time: 'day'});

            });

        });

        describe('isCurrentRoute', function () {

            it('should indicate that the queried route name is the current route', function () {

                spyOn(loc, 'getCurrentHash').andReturn('/base/thing/branch/1');

                expect(store.isCurrentRoute('base.branch')).toBe(true);

            });

            it('should indicate that an ancestor of the current route is also the current route', function () {

                spyOn(loc, 'getCurrentHash').andReturn('/base/thing/branch/1/2');

                expect(store.isCurrentRoute('base')).toBe(true);

            });

            it('should indicate that the queried route is not the current route', function () {

                spyOn(loc, 'getCurrentHash').andReturn('/base/thing/branch/1/2');

                expect(store.isCurrentRoute('base.branch.flower')).toBe(false);

            });

            it('should indicate that a child of the current route is not the current route', function () {

                spyOn(loc, 'getCurrentHash').andReturn('/base/thing/branch/1');

                expect(store.isCurrentRoute('base.branch.leaf')).toBe(false);

            })

        });

        describe('getUrl', function () {

            it('should build the requested url', function () {

                var params = {branchId: '1'},
                    queryParams = {what: 'where'},
                    routeName = 'base';

                spyOn(tree, 'buildUrl');

                store.getUrl(routeName, params, queryParams);

                expect(tree.buildUrl).toHaveBeenCalledWith(params, queryParams);

            });

        });


        describe('on hash changes', function () {

            beforeEach(function () {

                store.configureRoutes(
                    new ro('base', 'base/:baseId')
                        .addChild(new ro('branch', 'branch/:branchId')
                            .isAbstract(true)
                            .forward({route: 'base.branch.leaf', params: {leafId: '1', branchId: '3', baseId: '4'}})
                            .addChild(new ro('leaf', ':leafId'))
                            .addChild(new ro('flower', 'flower/:flowerId'))));

                spyOn(loc, 'setHash');

            });

            afterEach(function () {
                store.removeAllListeners();
            });

            it('should update on route change', function (done) {

                var routeChangeEvt = {
                        newURL: 'http://www.test.com#/base/3'
                    },
                    onChange = function () {
                        expect(store.getCurrentRoute().name).toBe('base');

                        expect(loc.setHash).toHaveBeenCalledWith('/base/3');

                        done();
                    };

                store.addChangeListener(onChange);

                hashHandler(routeChangeEvt);

            });

            it('should forward if hash changes to a forward route', function(done) {

                var routeChangeEvt = {
                        newURL: 'http://www.test.com#/base/3/branch/1'
                    },
                    onChange = function () {
                        expect(store.getCurrentRoute().name).toBe('base.branch.leaf');

                        expect(loc.setHash).toHaveBeenCalledWith('/base/4/branch/3/leaf/1');

                        done();
                    };

                store.addChangeListener(onChange);

                hashHandler(routeChangeEvt);
            });

            it('should do nothing if the url points to the current route', function() {


                var routeChangeEvt = {
                        newURL: 'http://www.test.com#/base/2'
                    };


                hashHandler(routeChangeEvt);

                spyOn(store, 'emitChange').andCallThrough();

                hashHandler(routeChangeEvt);

                expect(store.emitChange).not.toHaveBeenCalled();

            });

        });

    });

    describe('dispatch', function() {

    });

});

