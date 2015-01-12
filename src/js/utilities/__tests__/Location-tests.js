jest.dontMock('../Location.js');

describe('Location', function() {

    var loc,
        existingWasCalled,
        existingListener;

    beforeEach(function() {

        existingWasCalled = false;
        existingListener = function() {
            existingWasCalled = true;
        };

        window.onhashchange = existingListener;

        loc = require('../Location');

    });

    describe('registerHashListener', function() {

        it('shoud register a hash listener', function() {

            var wasCalled = false,
                expectedObj = {what:'where'},
                listener = function(evt) {
                    wasCalled = true;
                    expect(evt).toBe(expectedObj);
                };

            loc.registerHashListener(listener);

            window.onhashchange(expectedObj);

            expect(wasCalled).toBe(true);

        });

        it('should register multiple hash listeners', function() {

            var wasCalled1 = false,
                wasCalled2 = false,
                expectedObj = {what:'where'},
                listener1 = function(evt) {
                    wasCalled1 = true;
                    expect(evt).toBe(expectedObj);
                },
                listener2 = function(evt) {
                    wasCalled2 = true;
                    expect(evt).toBe(expectedObj);
                };

            loc.registerHashListener(listener1);
            loc.registerHashListener(listener2);

            window.onhashchange(expectedObj);

            expect(wasCalled1).toBe(true);
            expect(wasCalled2).toBe(true);

        });

        it('should not overwrite existing hash listeners', function() {

            loc.registerHashListener(function(){});

            window.onhashchange({})

            expect(existingWasCalled).toBe(true);

        });

    });

    describe('getCurrentHash', function() {

        it('should return the current window.location.hash value', function() {

            var expected = 'whatwhat?!';

            window.location.hash = expected;

            expect(loc.getCurrentHash()).toBe(expected);

        });

    });

    describe('setHash', function() {

        it('should set window.location.hash', function() {

            var newHash = '/hello';

            spyOn(window.history,'pushState');

            loc.setHash(newHash);

            expect(window.history.pushState).toHaveBeenCalledWith({}, null, newHash);

        });

        it('should set window.location.hash silently', function() {

            var newHash= '/hello/quietly';

            spyOn(window.history, 'replaceState');

            spyOn(window.history, 'pushState');

            loc.setHash(newHash, true);

            expect(window.history.replaceState).toHaveBeenCalledWith({},null,newHash);

            expect(window.history.pushState).not.toHaveBeenCalled();

        });

    });

});
