var connect = require('../packages/ddp-client/livedata_connection')
module.exports = function(url) {
	if (!global.connection)
		global.connection = connect(url, {
			heartbeatInterval: 0,
		})
	return global.connection
}