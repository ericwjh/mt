process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost/test'
process.env.PORT = process.env.PORT || 3000
process.env.ROOT_URL = process.env.ROOT_URL || 'http://localhost:' + process.env.PORT

var Fiber = require("fibers")
var fs = require("fs")
var path = require("path")
var Future = require("fibers/future")

global.Npm = {
	require: require
}
global.Assets = {
	getText: function(assetPath, callback) {
		return getAsset(assetPath, "utf8", callback);
	},
	getBinary: function(assetPath, callback) {
		return getAsset(assetPath, undefined, callback);
	},
	absoluteFilePath: function(assetPath) {
		if (!fileInfo.assets || !_.has(fileInfo.assets, assetPath)) {
			throw new Error("Unknown asset: " + assetPath);
		}

		assetPath = files.convertToStandardPath(assetPath);
		var filePath = path.join(serverDir, fileInfo.assets[assetPath]);
		return files.convertToOSPath(filePath);
	},
}

global.__meteor_bootstrap__ = {
	startupHooks: [],
	serverDir: __dirname,
	// configJson: configJson
	configJson: {
		clientPaths: []
	}
};

global.__meteor_runtime_config__ = {
	// meteorRelease: configJson.meteorRelease
};
Fiber(function() {
	require('./packages-built/underscore.js')
		// require('./packages-built/underscore/pre.js')
		// require('./packages-built/underscore/underscore.js')
		// require('./packages-built/underscore/post.js')

	require('./packages-built/meteor.js')
		// require('./packages-built/meteor/global.js')
		// require('./packages-built/meteor/server_environment.js')
		// require('./packages-built/meteor/helpers.js')
		// require('./packages-built/meteor/setimmediate.js')
		// require('./packages-built/meteor/timers.js')
		// require('./packages-built/meteor/errors.js')
		// require('./packages-built/meteor/fiber_helpers.js')
		// require('./packages-built/meteor/startup_server.js')
		// require('./packages-built/meteor/debug.js')
		// require('./packages-built/meteor/string_utils.js')
		// require('./packages-built/meteor/test_environment.js')
		// require('./packages-built/meteor/dynamics_nodejs.js')
		// require('./packages-built/meteor/url_server.js')
		// require('./packages-built/meteor/url_common.js')
		// require('./packages-built/meteor/flush-buffers-on-exit-in-windows.js')

	require('./packages-built/accounts-ui.js')

	require('./packages-built/npm-bcrypt.js')
		// require('./packages-built/npm-bcrypt/wrapper.js')

	require('./packages-built/modules-runtime.js')
		// require('./packages-built/modules-runtime/modules-runtime.js')

	require('./packages-built/modules.js')
		// require('./packages-built/modules/server.js')
		// require('./packages-built/modules/buffer.js')
		// require('./packages-built/modules/install-packages.js')
		// require('./packages-built/modules/process.js')

	require('./packages-built/promise.js')
		// require('./packages-built/promise/server.js')

	require('./packages-built/ecmascript-runtime.js')
		// require('./packages-built/ecmascript-runtime/runtime.js')

	require('./packages-built/babel-runtime.js')
		// require('./packages-built/babel-runtime/babel-runtime.js')

	require('./packages-built/random.js')
		// require('./packages-built/random/random.js')
		// require('./packages-built/random/deprecated.js')

	require('./packages-built/rate-limit.js')
		// require('./packages-built/rate-limit/rate-limit.js')

	require('./packages-built/ddp-rate-limiter.js')
		// require('./packages-built/ddp-rate-limiter/ddp-rate-limiter.js')

	require('./packages-built/base64.js')
		// require('./packages-built/base64/base64.js')

	require('./packages-built/ejson.js')
		// require('./packages-built/ejson/ejson.js')
		// require('./packages-built/ejson/stringify.js')

	require('./packages-built/check.js')
		// require('./packages-built/check/match.js')
		// require('./packages-built/check/isPlainObject.js')

	require('./packages-built/callback-hook.js')
		// require('./packages-built/callback-hook/hook.js')

	require('./packages-built/tracker.js')
		// require('./packages-built/tracker/tracker.js')
		// require('./packages-built/tracker/deprecated.js')

	require('./packages-built/retry.js')
		// require('./packages-built/retry/retry.js')

	require('./packages-built/id-map.js')
		// require('./packages-built/id-map/id-map.js')

	require('./packages-built/ddp-common.js')
		// require('./packages-built/ddp-common/namespace.js')
		// require('./packages-built/ddp-common/heartbeat.js')
		// require('./packages-built/ddp-common/utils.js')
		// require('./packages-built/ddp-common/method_invocation.js')
		// require('./packages-built/ddp-common/random_stream.js')

	require('./packages-built/diff-sequence.js')
		// require('./packages-built/diff-sequence/diff.js')

	require('./packages-built/mongo-id.js')
		// require('./packages-built/mongo-id/id.js')

	require('./packages-built/ddp-client.js')
		// require('./packages-built/ddp-client/namespace.js')
		// require('./packages-built/ddp-client/id_map.js')
		// require('./packages-built/ddp-client/stream_client_nodejs.js')
		// require('./packages-built/ddp-client/stream_client_common.js')
		// require('./packages-built/ddp-client/livedata_common.js')
		// require('./packages-built/ddp-client/random_stream.js')
		// require('./packages-built/ddp-client/livedata_connection.js')

	require('./packages-built/logging.js')
		// require('./packages-built/logging/logging.js')
		// require('./packages-built/logging/logging.js')
		// require('./packages-built/logging/logging.js')

	require('./packages-built/routepolicy.js')
		// require('./packages-built/routepolicy/routepolicy.js')

	require('./packages-built/deps.js')

	// require('./packages-built/htmljs.js')
	// require('./packages-built/htmljs/preamble.js')
	// require('./packages-built/htmljs/visitors.js')
	// require('./packages-built/htmljs/html.js')

	// require('./packages-built/html-tools.js')
	// require('./packages-built/html-tools/utils.js')
	// require('./packages-built/html-tools/scanner.js')
	// require('./packages-built/html-tools/charref.js')
	// require('./packages-built/html-tools/tokenize.js')
	// require('./packages-built/html-tools/templatetag.js')
	// require('./packages-built/html-tools/parse.js')

	// require('./packages-built/blaze-tools.js')
	// require('./packages-built/blaze-tools/preamble.js')
	// require('./packages-built/blaze-tools/tokens.js')
	// require('./packages-built/blaze-tools/tojs.js')

	// require('./packages-built/spacebars-compiler.js')
	// require('./packages-built/spacebars-compiler/templatetag.js')
	// require('./packages-built/spacebars-compiler/optimizer.js')
	// require('./packages-built/spacebars-compiler/react.js')
	// require('./packages-built/spacebars-compiler/codegen.js')
	// require('./packages-built/spacebars-compiler/compiler.js')

	// require('./packages-built/jquery.js')

	require('./packages-built/observe-sequence.js')
		// require('./packages-built/observe-sequence/observe_sequence.js')

	require('./packages-built/reactive-var.js')
		// require('./packages-built/reactive-var/reactive-var.js')

	// require('./packages-built/blaze.js')
	// require('./packages-built/blaze/preamble.js')
	// require('./packages-built/blaze/exceptions.js')
	// require('./packages-built/blaze/view.js')
	// require('./packages-built/blaze/builtins.js')
	// require('./packages-built/blaze/lookup.js')
	// require('./packages-built/blaze/template.js')
	// require('./packages-built/blaze/backcompat.js')

	// require('./packages-built/spacebars.js')
	// require('./packages-built/spacebars/spacebars-runtime.js')

	// require('./packages-built/ui.js')

	// require('./packages-built/boilerplate-generator.js')
	// require('./packages-built/boilerplate-generator/boilerplate-generator.js')

	require('./packages-built/webapp-hashing.js')
		// require('./packages-built/webapp-hashing/webapp-hashing.js')

	// require('./packages-built/webapp.js')
	// require('./packages-built/webapp/webapp_server.js')
	require('./server.js')

	require('./packages-built/ordered-dict.js')
		// require('./packages-built/ordered-dict/ordered_dict.js')

	require('./packages-built/geojson-utils.js')
		// require('./packages-built/geojson-utils/main.js')
		// require('./packages-built/geojson-utils/geojson-utils.js')

	require('./packages-built/minimongo.js')
		// require('./packages-built/minimongo/minimongo.js')
		// require('./packages-built/minimongo/wrap_transform.js')
		// require('./packages-built/minimongo/helpers.js')
		// require('./packages-built/minimongo/selector.js')
		// require('./packages-built/minimongo/sort.js')
		// require('./packages-built/minimongo/projection.js')
		// require('./packages-built/minimongo/modify.js')
		// require('./packages-built/minimongo/diff.js')
		// require('./packages-built/minimongo/id_map.js')
		// require('./packages-built/minimongo/observe.js')
		// require('./packages-built/minimongo/objectid.js')
		// require('./packages-built/minimongo/selector_projection.js')
		// require('./packages-built/minimongo/selector_modifier.js')
		// require('./packages-built/minimongo/sorter_projection.js')

	require('./packages-built/ddp-server.js')
		// require('./packages-built/ddp-server/stream_server.js')
		// require('./packages-built/ddp-server/livedata_server.js')
		// require('./packages-built/ddp-server/writefence.js')
		// require('./packages-built/ddp-server/crossbar.js')
		// require('./packages-built/ddp-server/server_convenience.js')

	// require('./packages-built/ddp.js')

	require('./packages-built/npm-mongo.js')
		// require('./packages-built/npm-mongo/wrapper.js')

	require('./packages-built/allow-deny.js')
		// require('./packages-built/allow-deny/allow-deny.js')

	require('./packages-built/binary-heap.js')
		// require('./packages-built/binary-heap/max-heap.js')
		// require('./packages-built/binary-heap/min-heap.js')
		// require('./packages-built/binary-heap/min-max-heap.js')

	require('./packages-built/mongo.js')
		// require('./packages-built/mongo/mongo_driver.js')
		// require('./packages-built/mongo/oplog_tailing.js')
		// require('./packages-built/mongo/observe_multiplex.js')
		// require('./packages-built/mongo/doc_fetcher.js')
		// require('./packages-built/mongo/polling_observe_driver.js')
		// require('./packages-built/mongo/oplog_observe_driver.js')
		// require('./packages-built/mongo/local_collection_driver.js')
		// require('./packages-built/mongo/remote_collection_driver.js')
		// require('./packages-built/mongo/collection.js')

	require('./packages-built/accounts-base.js')
		// require('./packages-built/accounts-base/server_main.js')
		// require('./packages-built/accounts-base/accounts_common.js')
		// require('./packages-built/accounts-base/accounts_rate_limit.js')
		// require('./packages-built/accounts-base/accounts_server.js')
		// require('./packages-built/accounts-base/url_server.js')

	require('./packages-built/sha.js')
		// require('./packages-built/sha/sha256.js')

	require('./packages-built/srp.js')
		// require('./packages-built/srp/biginteger.js')
		// require('./packages-built/srp/srp.js')

	require('./packages-built/email.js')
		// require('./packages-built/email/email.js')

	require('./packages-built/accounts-password.js')
		// require('./packages-built/accounts-password/email_templates.js')
		// require('./packages-built/accounts-password/password_server.js')

	// require('./packages-built/jsx.js')

	// require('./packages-built/react-meteor-data.js')
	// require('./packages-built/react-meteor-data/meteor-data-mixin.js')

	// require('./packages-built/meteor-base.js')

	// require('./packages-built/mobile-experience.js')

	// require('./packages-built/blaze-html-templates.js')

	require('./packages-built/session.js')

	// require('./packages-built/reload.js')

	// require('./packages-built/mindfront_why-reminify.js')

	require('./packages-built/livedata.js')

	// require('./packages-built/hot-code-push.js')

	// require('./packages-built/launch-screen.js')

	// require('./packages-built/templating.js')

	require('./packages-built/autoupdate.js')
		// require('./packages-built/autoupdate/autoupdate_server.js')

	// require('./packages-built/global-imports.js')

	// require('./../../bundle/server.bundle.js')

	require('./packages-built/service-configuration')

	// only start listening after all the startup code has run.                                                      //
	var localPort = process.env.PORT || 3000
	var localIp = '0.0.0.0'; // 788
	Package.webapp.WebApp.httpServer.listen(localPort, localIp, Package.meteor.Meteor.bindEnvironment(function() { // 789
		if (process.env.METEOR_PRINT_ON_LISTEN) console.log("LISTENING"); // must match run-app.js                     // 790
		//
		// var callbacks = onListeningCallbacks; // 789
		// onListeningCallbacks = null; // 794
		// _.each(callbacks, function(x) { // 795
		// 	x(); // 795
		// }); //
	}, function(e) { //
		console.error("Error listening:", e); // 798
		console.error(e && e.stack); // 799
	})); //
	//
// new Package.mongo.Mongo.Collection('abc')

}).run();