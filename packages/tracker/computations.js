/**
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client
 * @type {Boolean}
 */
exports.active = false;

// http://docs.meteor.com/#tracker_currentcomputation

/**
 * @summary The current computation, or `null` if there isn't one.  The current computation is the [`Tracker.Computation`](#tracker_computation) object created by the innermost active call to `Tracker.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client
 * @type {Tracker.Computation}
 */
exports.currentComputation = null;
// computations whose callbacks we should call at flush time
var pendingComputations = [];
exports.pendingComputations = pendingComputations
var setCurrentComputation = function (c) {
  exports.currentComputation = c;
  exports.active = !! c;
};
exports.setCurrentComputation = setCurrentComputation
exports._computations = {}

// `true` if the `_throwFirstError` option was passed in to the call
// to Tracker.flush that we are in. When set, throw rather than log the
// first error encountered while flushing. Before throwing the error,
// finish flushing (from a finally block), logging any subsequent
// errors.
var throwFirstError = false;

var afterFlushCallbacks = [];
var requireFlush = function () {
  if (! exports.willFlush) {
    
      setTimeout(_runFlush, 0);
    exports.willFlush = true;
  }
};

exports.requireFlush = requireFlush
exports.willFlush = false
exports.inFlush = false;

// // `true` if a Tracker.flush is scheduled, or if we are in Tracker.flush now
// var willFlush = false;
// // `true` if we are in Tracker.flush now
// var inFlush = false;

// http://docs.meteor.com/#tracker_flush

/**
 * @summary Process all reactive updates immediately and ensure that all invalidated computations are rerun.
 * @locus Client
 */
exports.flush = function (options) {
  _runFlush({ finishSynchronously: true,
                      throwFirstError: options && options._throwFirstError });
};

// Run all pending computations and afterFlush callbacks.  If we were not called
// directly via Tracker.flush, this may return before they're all done to allow
// the event loop to run a little before continuing.
function _runFlush(options) {
  // XXX What part of the comment below is still true? (We no longer
  // have Spark)
  //
  // Nested flush could plausibly happen if, say, a flush causes
  // DOM mutation, which causes a "blur" event, which runs an
  // app event handler that calls Tracker.flush.  At the moment
  // Spark blocks event handlers during DOM mutation anyway,
  // because the LiveRange tree isn't valid.  And we don't have
  // any useful notion of a nested flush.
  //
  // https://app.asana.com/0/159908330244/385138233856
  if (exports.inFlush)
    throw new Error("Can't call Tracker.flush while flushing");

  if (exports.inCompute)
    throw new Error("Can't flush inside Tracker.autorun");

  options = options || {};

  exports.inFlush = true;
  exports.willFlush = true;
  throwFirstError = !! options.throwFirstError;

  var recomputedCount = 0;
  var finishedTry = false;
  try {
    while (pendingComputations.length ||
           afterFlushCallbacks.length) {

      // recompute all pending computations
      while (pendingComputations.length) {
        var comp = pendingComputations.shift();
        comp._recompute();
        if (comp._needsRecompute()) {
          pendingComputations.unshift(comp);
        }

        if (! options.finishSynchronously && ++recomputedCount > 1000) {
          finishedTry = true;
          return;
        }
      }

      if (afterFlushCallbacks.length) {
        // call one afterFlush callback, which may
        // invalidate more computations
        var func = afterFlushCallbacks.shift();
        try {
          func();
        } catch (e) {
          _throwOrLog("afterFlush", e);
        }
      }
    }
    finishedTry = true;
  } finally {
    if (! finishedTry) {
      // we're erroring due to throwFirstError being true.
      exports.inFlush = false; // needed before calling `Tracker.flush()` again
      // finish flushing
      _runFlush({
        finishSynchronously: options.finishSynchronously,
        throwFirstError: false
      });
    }
    exports.willFlush = false;
    exports.inFlush = false;
    if (pendingComputations.length || afterFlushCallbacks.length) {
      // We're yielding because we ran a bunch of computations and we aren't
      // required to finish synchronously, so we'd like to give the event loop a
      // chance. We should flush again soon.
      if (options.finishSynchronously) {
        throw new Error("still have more to do?");  // shouldn't happen
      }
      setTimeout(requireFlush, 10);
    }
  }
};

// http://docs.meteor.com/#tracker_nonreactive
//
// Run `f` with no current computation, returning the return value
// of `f`.  Used to turn off reactivity for the duration of `f`,
// so that reactive data sources accessed by `f` will not result in any
// computations being invalidated.

/**
 * @summary Run a function without tracking dependencies.
 * @locus Client
 * @param {Function} func A function to call immediately.
 */
exports.nonreactive = function (f) {
  var previous = exports.currentComputation;
  setCurrentComputation(null);
  try {
    return f();
  } finally {
    setCurrentComputation(previous);
  }
};

/**
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */
exports.onInvalidate = function (f) {
  if (! exports.active)
    throw new Error("Tracker.onInvalidate requires a currentComputation");

  currentComputation.currentComputation.onInvalidate(f);
};
