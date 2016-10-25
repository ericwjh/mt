// Returns the named sequence of pseudo-random values.
// The scope will be DDP._CurrentInvocation.get(), so the stream will produce
// consistent values for method calls on the client and server.
var RandomStream = require('../ddp-common/random_stream.js')
var CurrentInvocation = require('../ddp-common/CurrentInvocation')
module.exports = function (name) {
  var scope = CurrentInvocation.get();
  return RandomStream.get(scope, name);
};


