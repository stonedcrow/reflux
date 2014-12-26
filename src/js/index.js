/*** @jsx React.DOM */

var React = require('react'),
  App = require('./components/app'),
  RouteStore = require('./stores/RouteStore'),
  ro = require('./utilities/RouteObject');

var routeTable = new ro('root', '/')
  .isAbstract(true)
  .addChild(new ro('property', '/property')
    .addChild(new ro('search', '/search')
      .isAbstract(true)
      .forward({
        route: 'root.property.search.results',
        params: {
          type: 'basic',
          view: 'list'
        }
      })
      .addChild(new ro('results', '/:type/:view')))
    .addChild(new ro('detail', '/:propId')
      .addChild(new ro('building', '/building/:buildingId')
        .addChild(new ro('component', '/part/:partId')))))
  .addChild(new ro('contact', '/contact')
    .addChild(new ro('search', '/search')
      .isAbstract(true)
      .forward({
        route: 'root.contact.search.results',
        params: {
          type: 'basic',
          view: 'list'
        }
      })
      .addChild(new ro('results', '/:type/:view')))
    .addChild(new ro('detail','/:contactId')));

RouteStore.configureRoutes(routeTable);

React.render(<App />, document.getElementById('main'));
