// require('./packages-built/underscore.js')
global._ = require('underscore')

// require('./packages-built/meteor.js')
// require('../packages/meteor/client_environment.js')
global.Meteor = {}

require('../packages/meteor/helpers.js')
// require('../packages/meteor/setimmediate.js')
Meteor._setImmediate = process.nextTick
Meteor.setTimeout = setTimeout.bind(global)
// require('../packages/meteor/timers.js')
require('../packages/meteor/errors.js')
require('../packages/meteor/fiber_stubs_client.js')
// require('../packages/meteor/startup_client.js')
// require('../packages/meteor/debug.js')
// Meteor._debug = console.log.bind(console)
// require('../packages/meteor/string_utils.js')
// require('../packages/meteor/test_environment.js')
require('./dynamics_browser.js')
Meteor.bindEnvironment = function(func){return func}
// require('../packages/meteor/url_common.js')
Meteor._relativeToSiteRootUrl = function(url){
	return url
}

// require('./packages-built/tracker.js')
require('../packages/tracker/tracker.js')

// require('./packages-built/babel-compiler.js')
// require('./packages-built/ecmascript.js')
// require('./packages-built/ddp-rate-limiter.js')
// require('./packages-built/modules-runtime.js')
// require('./packages-built/modules.js')
// require('./packages-built/promise.js')
// require('./packages-built/ecmascript-runtime.js')
// require('./packages-built/babel-runtime.js')

// require('./packages-built/random.js')
require('../packages/random/random.js')

// require('./packages-built/localstorage.js')

// require('./packages-built/callback-hook.js')
// require('../packages/callback-hook/hook.js')


// require('./packages-built/base64.js')
require('../packages/base64/base64.js')

// require('./packages-built/ejson.js')
require('../packages/ejson/ejson.js')

// require('./packages-built/check.js')
// global.check = require('../packages/check/match').check
// global.Match = require('../packages/check/match').Match

// require('./packages-built/retry.js')
require('../packages/retry/retry.js')

// require('./packages-built/id-map.js')
require('../packages/id-map/id-map.js')

// require('./packages-built/ddp-common.js')
require('../packages/ddp-common/namespace.js')
// require('../packages/ddp-common/heartbeat.js')
require('../packages/ddp-common/utils.js')
// require('../packages/ddp-common/method_invocation.js')
require('../packages/ddp-common/random_stream.js')

// require('./packages-built/diff-sequence.js')
require('../packages/diff-sequence/diff.js')

// require('./packages-built/mongo-id.js')
require('../packages/mongo-id/id.js')

// require('./packages-built/ddp-client.js')
require('../packages/ddp-client/namespace.js')
require('../packages/ddp-client/id_map.js')
require('../packages/ddp-client/sockjs-0.3.4.js')
require('../packages/ddp-client/stream_client_sockjs.js')
// require('./stream_client_sockjs.js')
require('../packages/ddp-client/stream_client_common.js')
// require('./stream_client_common.js')
require('../packages/ddp-client/livedata_common.js')
require('../packages/ddp-client/random_stream.js')
require('../packages/ddp-client/livedata_connection.js')
// require('../packages/ddp-client/client_convenience.js')
// require('./connection.js')

// require('./packages-built/reactive-var.js')
require('../packages/reactive-var/reactive-var.js')

// require('./packages-built/ddp.js')

// require('./packages-built/ordered-dict.js')
// require('../packages/ordered-dict/ordered_dict.js')

// require('./packages-built/geojson-utils.js')
// require('../packages/geojson-utils/main.js')

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

require('../packages/allow-deny/allow-deny.js')

require('../packages/mongo/local_collection_driver.js')
require('../packages/mongo/collection.js')

// // require('./packages-built/deps.js')

// // require('./packages-built/observe-sequence.js')
require('../packages/observe-sequence/observe_sequence.js')



// require('./packages-built/accounts-base.js')
// Meteor._localStorage = localStorage
// require('../packages/accounts-base/client_main.js')

// require('./packages-built/service-configuration.js')
// require('../packages/service-configuration/service_configuration_common.js')
// global['service-configuration'] = {ServiceConfiguration}

// require('./packages-built/reactive-dict.js')
// require('../packages/reactive-dict/reactive-dict.js')
// require('../packages/reactive-dict/migration.js')

// require('./packages-built/session.js')
// require('../packages/session/session.js')

// require('./packages-built/npm-bcrypt.js')

// require('./packages-built/sha.js')
// require('../packages/sha/sha256.js')

// require('./packages-built/srp.js')
// require('../packages/srp/biginteger.js')
// require('../packages/srp/srp.js')

// require('./packages-built/accounts-password.js')
// require('./packages-built/less.js')
// require('./packages-built/jsx.js')

// require('./packages-built/react-meteor-data.js')
// require('./meteor-data-mixin.js')

// require('./packages-built/meteor-base.js')

// require('./packages-built/mobile-experience.js')
// require('./packages-built/blaze-html-templates.js')
// require('./packages-built/logging.js')
// require('../packages/logging/logging.js')

// require('./packages-built/mindfront_why-reminify.js')
// require('./packages-built/webapp.js')
// require('../packages/webapp/webapp_client.js')

// require('./packages-built/livedata.js')
// require('./packages-built/hot-code-push.js')
// require('./packages-built/launch-screen.js')
// require('./packages-built/autoupdate.js')
// require('./packages-built/global-imports.js')