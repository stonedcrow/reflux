/*** @jsx React.DOM */

var React = require('react/addons');
var RouteStore = require('../stores/RouteStore');
var NavActions = require('../actions/NavigationActionCreator');

var NavButton = React.createClass({

  propTypes: {
    options: React.PropTypes.shape({
      route: React.PropTypes.string.isRequired,
      displayName: React.PropTypes.string,
      params: React.PropTypes.object,
      keepQueryParams: React.PropTypes.oneOfType([
        React.PropTypes.bool,
        React.PropTypes.arrayOf(React.PropTypes.string)
      ])
    }).isRequired
  },

  getDefaultProps: function() {
    return {
      options: {
        route: 'root',
        displayName: 'Root',
        params: {},
        queryParams: {},
        keepQueryParams: true
      }
    };
  },

  navigate: function(evt) {
    evt.preventDefault();
    NavActions.navigateTo(this.props.options);
  },

  render: function() {

    var classes = React.addons.classSet({
      active: RouteStore.isCurrentRoute(this.props.options.route)
    }), url = RouteStore.getUrl(this.props.options.route, this.props.options.params, this.props.options.queryParams);

    return (
      <li className={classes}>
        <a href={url} onClick={this.navigate}>{this.props.options.displayName}</a>
      </li>
    );
  }

});

module.exports = NavButton;

