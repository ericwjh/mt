// var Fiber = require("fibers")
global.Future = require('fibers/future')

global._debug = function(){
	console.log.apply(console, arguments)
	console.trace()
}
require('../packages/utils/index_server')

module.exports = require('../packages/ddp-server')

process.on('SIGINT', function() {
	process.exit()
})