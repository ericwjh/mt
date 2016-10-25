// var _ = require('underscore')
// if (process.env.DDP_DEFAULT_CONNECTION_URL) {
//   __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL =
//     process.env.DDP_DEFAULT_CONNECTION_URL;
// }
var Server = require('./livedata_server.js')
var Crossbar = require('./Crossbar')
module.exports = function(httpServer){
	var server = new Server(httpServer);
	var InvalidationCrossbar = new Crossbar	({
	  factName: "invalidation-crossbar-listeners"
	})
	global.InvalidationCrossbar = InvalidationCrossbar
	Meteor.refresh = function (notification) {
	  InvalidationCrossbar.fire(notification);
	};

	// Proxy the public methods of global.server so they can
	// be called directly on Meteor.
	// _.each(['publish', 'methods', 'call', 'apply', 'onConnection'],
	//        function (name) {
	//          Meteor[name] = _.bind(global.server[name], global.server);
	//        });

	// global.server used to be called Meteor.default_server. Provide
	// backcompat as a courtesy even though it was never documented.
	// XXX COMPAT WITH 0.6.4
	// Meteor.default_server = global.server;
	global.server = server
	// Meteor.server = server
	// Meteor.default_server = global.server;
	return server
}