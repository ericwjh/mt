// var Fiber = require("fibers")
global.Future = require('fibers/future')

global._debug = function(){
	console.log.apply(console, arguments)
	console.trace()
}
require('../packages/utils/index_server')

module.exports = {
	registerDDP: require('../packages/ddp-server'),
	connectMongo: function(url, MONGO_OPLOG_URL) {
		process.env.MONGO_URL = url
		if (MONGO_OPLOG_URL)
			process.env.MONGO_OPLOG_URL = MONGO_OPLOG_URL
		global.MongoConnection = require('../packages/mongo/remote_collection_driver')
	}
}

process.on('SIGINT', function() {
	process.exit()
})