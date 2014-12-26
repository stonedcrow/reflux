var AppDispatcher = require('../dispatchers/AppDispatcher');
var Constants = require('../constants/AppConstants');
var merge = require('react/lib/Object.assign');

module.exports = {
  navigateTo: function(options) {
    var opts = merge({}, options, {
      type: Constants.ActionTypes.NAVIGATE_TO
    });
    AppDispatcher.handleViewAction(opts);
  }
};
