var Fiber = require("fibers")
require('../packages/meteor/index_server.js')
require('../packages/promise/server.js')
module.exports = {
	registerDDP: require('../packages/ddp-server'),
	connectMongo: function(url) {
		process.env.MONGO_URL = url
		global.MongoInternals = require('mt/packages/mongo/mongo_driver.js')
		require('../packages/mongo/remote_collection_driver.js')
	}
}

process.on('SIGINT', function() {
	process.exit()
})