var Fiber = require("fibers")

// global.__meteor_bootstrap__ = {
// 	// startupHooks: [],
// 	// serverDir: __dirname,
// 	// configJson: {
// 	// 	clientPaths: []
// 	// }
// }

// global.__meteor_runtime_config__ = {}
// 	// require('../packages/underscore.js')
global.Package = {}
// global._ = require('underscore')
// Package.underscore = {
// 		_: global._
// 	}
	// require('../packages/underscore/pre.js')
	// require('../packages/underscore/underscore.js')
	// require('../packages/underscore/post.js')

// require('./packages-built/meteor.js')
// require('../packages/meteor/global.js')
require('../packages/meteor/server_environment.js')
require('../packages/meteor/helpers.js')
	// require('../packages/meteor/setimmediate.js')
Meteor._setImmediate = process.nextTick
Meteor.setTimeout = setTimeout.bind(global)
Meteor.setInterval = setInterval.bind(global)
Meteor.clearInterval = clearInterval.bind(global)
require('../packages/meteor/timers.js')
require('../packages/meteor/errors.js')
require('../packages/meteor/fiber_helpers.js')
require('../packages/meteor/startup_server.js')
	// require('../packages/meteor/debug.js')
require('../packages/meteor/string_utils.js')
	// require('../packages/meteor/test_environment.js')
require('../packages/meteor/dynamics_nodejs.js')
require('../packages/meteor/url_server.js')
require('../packages/meteor/url_common.js')
require('../packages/meteor/flush-buffers-on-exit-in-windows.js')

// require('../packages/accounts-ui.js')

// require('../packages/npm-bcrypt.js')
// require('../packages/npm-bcrypt/wrapper.js')

// require('./packages-built/modules-runtime.js')
// require('../packages/modules-runtime/modules-runtime.js')

// require('./packages-built/modules.js')
// require('../packages/modules/server.js')
// require('../packages/modules/buffer.js')
// require('../packages/modules/install-packages.js')
// require('../packages/modules/process.js')

// require('./packages-built/promise.js')
require('../packages/promise/server.js')

// require('../packages/ecmascript-runtime.js')
// require('../packages/ecmascript-runtime/runtime.js')

// require('../packages/babel-runtime.js')
// require('../packages/babel-runtime/babel-runtime.js')

// require('./packages-built/random.js')
require('../packages/random/random.js')
require('../packages/random/deprecated.js')

// require('./packages-built/rate-limit.js')
require('../packages/rate-limit/rate-limit.js')

// require('../packages/ddp-rate-limiter.js')
// require('../packages/ddp-rate-limiter/ddp-rate-limiter.js')

// require('./packages-built/base64.js')
require('../packages/base64/base64.js')

// require('./packages-built/ejson.js')
require('../packages/ejson/ejson.js')
require('../packages/ejson/stringify.js')

// require('../packages/check.js')
require('../packages/check/match.js')
require('../packages/check/isPlainObject.js')
	// global.check = require('../packages/check/match').check
	// global.Match = require('../packages/check/match').Match

// require('./packages-built/callback-hook.js')
require('../packages/callback-hook/hook.js')

// require('./packages-built/tracker.js')
require('../packages/tracker/tracker.js')
require('../packages/tracker/deprecated.js')

// require('./packages-built/retry.js')
require('../packages/retry/retry.js')

// require('./packages-built/id-map.js')
require('../packages/id-map/id-map.js')

// require('./packages-built/ddp-common.js')
require('../packages/ddp-common/namespace.js')
require('../packages/ddp-common/heartbeat.js')
require('../packages/ddp-common/utils.js')
require('../packages/ddp-common/method_invocation.js')
require('../packages/ddp-common/random_stream.js')

// require('./packages-built/diff-sequence.js')
require('../packages/diff-sequence/diff.js')

// require('./packages-built/mongo-id.js')
require('../packages/mongo-id/id.js')

// require('../packages/routepolicy/routepolicy.js')

	// require('./packages-built/ddp-client.js')
require('../packages/ddp-client/namespace.js')
require('../packages/ddp-client/id_map.js')
require('../packages/ddp-client/stream_client_nodejs.js')
require('../packages/ddp-client/stream_client_common.js')
require('../packages/ddp-client/livedata_common.js')
require('../packages/ddp-client/random_stream.js')
require('../packages/ddp-client/livedata_connection.js')

// require('../packages/logging.js')
// require('../packages/logging/logging.js')
// require('../packages/logging/logging.js')
// require('../packages/logging/logging.js')

// require('./packages-built/routepolicy.js')

// require('../packages/deps.js')

// require('../packages/htmljs.js')
// require('../packages/htmljs/preamble.js')
// require('../packages/htmljs/visitors.js')
// require('../packages/htmljs/html.js')

// require('../packages/html-tools.js')
// require('../packages/html-tools/utils.js')
// require('../packages/html-tools/scanner.js')
// require('../packages/html-tools/charref.js')
// require('../packages/html-tools/tokenize.js')
// require('../packages/html-tools/templatetag.js')
// require('../packages/html-tools/parse.js')

// require('../packages/blaze-tools.js')
// require('../packages/blaze-tools/preamble.js')
// require('../packages/blaze-tools/tokens.js')
// require('../packages/blaze-tools/tojs.js')

// require('../packages/spacebars-compiler.js')
// require('../packages/spacebars-compiler/templatetag.js')
// require('../packages/spacebars-compiler/optimizer.js')
// require('../packages/spacebars-compiler/react.js')
// require('../packages/spacebars-compiler/codegen.js')
// require('../packages/spacebars-compiler/compiler.js')

// require('../packages/jquery.js')

// require('./packages-built/observe-sequence.js')
require('../packages/observe-sequence/observe_sequence.js')

// require('../packages/reactive-var.js')
// require('../packages/reactive-var/reactive-var.js')

// require('../packages/blaze.js')
// require('../packages/blaze/preamble.js')
// require('../packages/blaze/exceptions.js')
// require('../packages/blaze/view.js')
// require('../packages/blaze/builtins.js')
// require('../packages/blaze/lookup.js')
// require('../packages/blaze/template.js')
// require('../packages/blaze/backcompat.js')

// require('../packages/spacebars.js')
// require('../packages/spacebars/spacebars-runtime.js')

// require('../packages/ui.js')

// require('../packages/boilerplate-generator.js')
// require('../packages/boilerplate-generator/boilerplate-generator.js')



// require('./packages-built/ordered-dict.js')
// require('../packages/ordered-dict/ordered_dict.js')

// require('./packages-built/geojson-utils.js')
// require('../packages/geojson-utils/main.js')
// require('../packages/geojson-utils/geojson-utils.js')

// require('./packages-built/minimongo.js')
require('../packages/minimongo/minimongo.js')
require('../packages/minimongo/wrap_transform.js')
require('../packages/minimongo/helpers.js')
require('../packages/minimongo/selector.js')
require('../packages/minimongo/sort.js')
require('../packages/minimongo/projection.js')
require('../packages/minimongo/modify.js')
require('../packages/minimongo/diff.js')
require('../packages/minimongo/id_map.js')
require('../packages/minimongo/observe.js')
require('../packages/minimongo/objectid.js')
require('../packages/minimongo/selector_projection.js')
require('../packages/minimongo/selector_modifier.js')
require('../packages/minimongo/sorter_projection.js')

module.exports = {
	registerDDP: function(httpServer){
		// require('./packages-built/ddp-server.js')
		// require('../packages/ddp-server/stream_server.js')
		// require('../packages/ddp-server/livedata_server.js')
		// require('../packages/ddp-server/writefence.js')
		// require('../packages/ddp-server/crossbar.js')
		require('../packages/ddp-server/server_convenience.js')(httpServer)

		// require('../packages/ddp.js')

		
		
	}
}
// require('../packages/npm-mongo.js')
		// require('../packages/npm-mongo/wrapper.js')
		// global.NpmModuleMongodb = require('mongodb');
		// global.NpmModuleMongodbVersion = require('mongodb/package.json').version

		// require('../packages/allow-deny.js')
		require('../client/allow-deny.js')
			// require('../packages/allow-deny/allow-deny.js')

		// require('./packages-built/binary-heap.js')
		require('../packages/binary-heap/max-heap.js')
		require('../packages/binary-heap/min-heap.js')
		require('../packages/binary-heap/min-max-heap.js')

		// require('./packages-built/mongo.js')
		// require('../packages/mongo/mongo_driver.js')
		// require('../packages/mongo/oplog_tailing.js')
		// require('../packages/mongo/observe_multiplex.js')
		// require('../packages/mongo/doc_fetcher.js')
		// require('../packages/mongo/polling_observe_driver.js')
		// require('../packages/mongo/oplog_observe_driver.js')
		require('../packages/mongo/local_collection_driver.js')
			// // global.LocalCollectionDriver = LocalCollectionDriver
			// // console.log(LocalCollectionDriver)
			require('../packages/mongo/remote_collection_driver.js')
			// global.MongoID=Package['mongo-id'].MongoID
			// 	global.LocalCollection = Package.minimongo.LocalCollection;
			// global.Random = Package.random.Random;
			// global.EJSON = Package.ejson.EJSON;
			// var _ = Package.underscore._;
			// var Minimongo = Package.minimongo.Minimongo;
			// var DDP = Package['ddp-client'].DDP;
			// global.DDPServer = Package['ddp-server'].DDPServer;
			// var Tracker = Package.tracker.Tracker;
			// var Deps = Package.tracker.Deps;
			// var DiffSequence = Package['diff-sequence'].DiffSequence;
			// var MongoID = Package['mongo-id'].MongoID;
			// var check = Package.check.check;
			// var Match = Package.check.Match;
			// var ECMAScript = Package.ecmascript.ECMAScript;
			// var MaxHeap = Package['binary-heap'].MaxHeap;
			// var MinHeap = Package['binary-heap'].MinHeap;
			// var MinMaxHeap = Package['binary-heap'].MinMaxHeap;
			// global.Hook = Package['callback-hook'].Hook;
require('../packages/mongo/collection.js')
			// // global.Mongo = Mongo
			// global.Mongo = {
			// 	Collection : function(){

		// 	}
		// }

		// Mongo.Collection.prototype.insert = function(a){console.log(a)}
// require('../packages/accounts-base.js')
// require('../packages/accounts-base/server_main.js')
// require('../packages/accounts-base/accounts_common.js')
// require('../packages/accounts-base/accounts_rate_limit.js')
// require('../packages/accounts-base/accounts_server.js')
// require('../packages/accounts-base/url_server.js')

// require('../packages/sha.js')
// require('../packages/sha/sha256.js')

// require('../packages/srp.js')
// require('../packages/srp/biginteger.js')
// require('../packages/srp/srp.js')

// require('../packages/email.js')
// require('../packages/email/email.js')

// require('../packages/accounts-password.js')
// require('../packages/accounts-password/email_templates.js')
// require('../packages/accounts-password/password_server.js')

// require('../packages/jsx.js')

// require('../packages/react-meteor-data.js')
// require('../packages/react-meteor-data/meteor-data-mixin.js')

// require('../packages/meteor-base.js')

// require('../packages/mobile-experience.js')

// require('../packages/blaze-html-templates.js')

// require('../packages/session.js')

// require('../packages/reload.js')

// require('../packages/mindfront_why-reminify.js')

// require('../packages/livedata.js')

// require('../packages/hot-code-push.js')

// require('../packages/launch-screen.js')

// require('../packages/templating.js')

// require('../packages/autoupdate.js')
// require('../packages/autoupdate/autoupdate_server.js')

// require('../packages/global-imports.js')

// require('../../main_server.js')

// require('../packages/service-configuration')
// require('../packages/webapp-hashing.js')
// require('../packages/webapp-hashing/webapp-hashing.js')

// require('../packages/webapp.js')
// require('../packages/webapp/webapp_server.js')
// require('./webapp.js')
// module.exports = function(port, cb) {
// 	Fiber(function() {

// 		if (port)
// 			Package.webapp.WebApp.httpServer.listen(port, '0.0.0.0', function() {
// 				console.log('listen on', process.env.PORT)
// 			})
// 		cb(Package.webapp.WebApp)
// 	}).run();
// }


process.on('SIGINT', function() {
	process.exit()
})