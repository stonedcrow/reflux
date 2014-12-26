/*** @jsx React.DOM */

var React = require('react');
var RouteStore = require('../stores/RouteStore');
var NavBar = require('../components/NavBar');

var App = React.createClass({

  _onChange: function() {
    this.setState({
      mainArea: RouteStore.getCurrentRoute()
    })
  },

  getInitialState: function() {
    return {
      mainArea: 'property search'
    }
  },

  componentDidMount: function() {
    RouteStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    RouteStore.removeChangeListener(this._onChange);
  },

  render: function() {
    return (
      <NavBar/>
    );
  }

});

module.exports = App;
