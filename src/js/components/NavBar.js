/*** @jsx React.DOM */

var React = require('react');
var RouteStore = require('../stores/RouteStore');
var NavButton = require('../components/NavButton');


NavBar = React.createClass({

  _onChange: function () {
    this.setState({
      route: RouteStore.getCurrentRoute().handler(),
      Params: RouteStore.getCurrentRoute().params
    });
  },

  componentDidMount: function () {
    RouteStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    RouteStore.removeChangeListener(this._onChange);
  },

  render: function () {

    var navButtons = [
      {
        route: 'root.property',
        displayName: 'Property'
      },
      {
        route: 'root.property.search',
        displayName: 'Property search',
        keepQueryParams: ['effort']
      },
      {
        route: 'root.property.detail',
        displayName: 'Property detail',
        params: {
          propId: 'someProperty'
        },
        queryParams: {
          what: 'thing',
          effort: 'stuff'
        }
      },
      {
        route: 'root.property.detail.building',
        displayName: 'Some building',
        params: {
          propId: 'someProp',
          buildingId: 'someBuilding'
        },
        keepQueryParams: false
      },
      {
        route: 'root.contact',
        displayName: 'contact'
      },
      {
        route: 'root.contact.search',
        displayName: 'contact search'
      },
      {
        route: 'root.contact.detail',
        displayName: 'contact detail',
        params: {
          contactId: 'someProperty'
        }
      }
    ].map(function (nav) {
        return (<NavButton options={nav} key={nav.route}/>);
      });

    return (
      <nav className="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div className="container-fluid">
          <div className="collapse navbar-collapse">
            <ul className="nav navbar-nav">
              {navButtons}
            </ul>
          </div>
        </div>
      </nav>
    );
  }

});

module.exports = NavBar;
