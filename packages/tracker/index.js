var Computation = require('./Computation')
var computations = require('./computations')

// http://docs.meteor.com/#tracker_autorun
//
// Run f(). Record its dependencies. Rerun it whenever the
// dependencies change.
//
// Returns a new Computation, which is also passed to f.
//
// Links the computation to the current computation
// so that it is stopped if the current computation is invalidated.

/**
 * @callback Tracker.ComputationFunction
 * @param {Tracker.Computation}
 */
/**
 * @summary Run a function now and rerun it later whenever its dependencies
 * change. Returns a Computation object that can be used to stop or observe the
 * rerunning.
 * @locus Client
 * @param {Tracker.ComputationFunction} runFunc The function to run. It receives
 * one argument: the Computation object that will be returned.
 * @param {Object} [options]
 * @param {Function} options.onError Optional. The function to run when an error
 * happens in the Computation. The only argument it recieves is the Error
 * thrown. Defaults to the error being logged to the console.
 * @returns {Tracker.Computation}
 */
exports.autorun = function (f, options) {
  if (typeof f !== 'function')
    throw new Error('Tracker.autorun requires a function argument');

  options = options || {};

  // constructingComputation = true;
  var c = new Computation(
    f, computations.currentComputation, options.onError);

  if (computations.active)
    computations.onInvalidate(function () {
      c.stop();
    });

  return c;
};


/**
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.  The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client
 * @param {Function} callback A function to call at flush time.
 */
exports.afterFlush = function (f) {
  afterFlushCallbacks.push(f);
  requireFlush();
};
