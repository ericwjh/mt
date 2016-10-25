var utlis = require('./utils.js')
var RandomStream = require('./random_stream.js')
module.exports = {
	Heartbeat: require('./heartbeat.js'),
	parseDDP: utlis.parseDDP,
	stringifyDDP: utlis.stringifyDDP,
	SUPPORTED_DDP_VERSIONS: utlis.SUPPORTED_DDP_VERSIONS,
	MethodInvocation: require('./method_invocation.js'),
	RandomStream: RandomStream,
	makeRpcSeed: function(enclosing, methodName) {
		var stream = RandomStream.get(enclosing, '/rpc/' + methodName);
		return stream.hexString(20);
	}

}

// Creates a randomSeed for passing to a method call.
// Note that we take enclosing as an argument,
// though we expect it to be DDP._CurrentInvocation.get()
// However, we often evaluate makeRpcSeed lazily, and thus the relevant
// invocation may not be the one currently in scope.
// If enclosing is null, we'll use Random and values won't be repeatable.