module.exports = function(url, MONGO_OPLOG_URL) {
	process.env.MONGO_URL = url
	if (MONGO_OPLOG_URL)
		process.env.MONGO_OPLOG_URL = MONGO_OPLOG_URL
	global.MongoConnection = require('../packages/mongo/remote_collection_driver')
}