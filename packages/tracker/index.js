var Computation = require('./Computation')
var computations = require('./computations')
/**
 * @namespace Tracker
 * @summary The namespace for Tracker-related methods.
 */
// var Tracker = {};
// module.exports = Tracker
// http://docs.meteor.com/#tracker_active

/**
 * @summary True if there is a current computation, meaning that dependencies on reactive data sources will be tracked and potentially cause the current computation to be rerun.
 * @locus Client
 * @type {Boolean}
 */
// Tracker.active = false;

// http://docs.meteor.com/#tracker_currentcomputation

/**
 * @summary The current computation, or `null` if there isn't one.  The current computation is the [`Tracker.Computation`](#tracker_computation) object created by the innermost active call to `Tracker.autorun`, and it's the computation that gains dependencies when reactive data sources are accessed.
 * @locus Client
 * @type {Tracker.Computation}
 */
// Tracker.currentComputation = null;

// References to all computations created within the Tracker by id.
// Keeping these references on an underscore property gives more control to
// tooling and packages extending Tracker without increasing the API surface.
// These can used to monkey-patch computations, their functions, use
// computation ids for tracking, etc.
// Tracker._computations = {};

// var setCurrentComputation = function (c) {
//   Tracker.currentComputation = c;
//   Tracker.active = !! c;
// };

// var _debugFunc = function () {
//   // We want this code to work without Meteor, and also without
//   // "console" (which is technically non-standard and may be missing
//   // on some browser we come across, like it was on IE 7).
//   //
//   // Lazy evaluation because `Meteor` does not exist right away.(??)
//   return (typeof Meteor !== "undefined" ? Meteor._debug :
//           ((typeof console !== "undefined") && console.error ?
//            function () { console.error.apply(console, arguments); } :
//            function () {}));
// };

// var _maybeSuppressMoreLogs = function (messagesLength) {
//   // Sometimes when running tests, we intentionally suppress logs on expected
//   // printed errors. Since the current implementation of _throwOrLog can log
//   // multiple separate log messages, suppress all of them if at least one suppress
//   // is expected as we still want them to count as one.
//   if (typeof Meteor !== "undefined") {
//     if (Meteor._suppressed_log_expected()) {
//       Meteor._suppress_log(messagesLength - 1);
//     }
//   }
// };

// var _throwOrLog = function (from, e) {
//   if (throwFirstError) {
//     throw e;
//   } else {
//     var printArgs = ["Exception from Tracker " + from + " function:"];
//     if (e.stack && e.message && e.name) {
//       var idx = e.stack.indexOf(e.message);
//       if (idx < 0 || idx > e.name.length + 2) { // check for "Error: "
//         // message is not part of the stack
//         var message = e.name + ": " + e.message;
//         printArgs.push(message);
//       }
//     }
//     printArgs.push(e.stack);
//     _maybeSuppressMoreLogs(printArgs.length);

//     for (var i = 0; i < printArgs.length; i++) {
//       _debugFunc()(printArgs[i]);
//     }
//   }
// };

// Takes a function `f`, and wraps it in a `Meteor._noYieldsAllowed`
// block if we are running on the server. On the client, returns the
// original function (since `Meteor._noYieldsAllowed` is a
// no-op). This has the benefit of not adding an unnecessary stack
// frame on the client.
// var withNoYieldsAllowed = function (f) {
//   if ((typeof Meteor === 'undefined') || Meteor.isClient) {
//     return f;
//   } else {
//     return function () {
//       var args = arguments;
//       Meteor._noYieldsAllowed(function () {
//         f.apply(null, args);
//       });
//     };
//   }
// };

// var nextId = 1;
// // computations whose callbacks we should call at flush time
// var pendingComputations = [];
// // `true` if a Tracker.flush is scheduled, or if we are in Tracker.flush now
// var willFlush = false;
// // `true` if we are in Tracker.flush now
// var inFlush = false;
// // `true` if we are computing a computation now, either first time
// // or recompute.  This matches Tracker.active unless we are inside
// // Tracker.nonreactive, which nullfies currentComputation even though
// // an enclosing computation may still be running.
// var inCompute = false;
// // `true` if the `_throwFirstError` option was passed in to the call
// // to Tracker.flush that we are in. When set, throw rather than log the
// // first error encountered while flushing. Before throwing the error,
// // finish flushing (from a finally block), logging any subsequent
// // errors.
// var throwFirstError = false;

// var afterFlushCallbacks = [];

// var requireFlush = function () {
//   if (! willFlush) {
    
//       setTimeout(_runFlush, 0);
//     willFlush = true;
//   }
// };




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
// Tracker.nonreactive = function (f) {
//   var previous = Tracker.currentComputation;
//   setCurrentComputation(null);
//   try {
//     return f();
//   } finally {
//     setCurrentComputation(previous);
//   }
// };

// http://docs.meteor.com/#tracker_oninvalidate

/**
 * @summary Registers a new [`onInvalidate`](#computation_oninvalidate) callback on the current computation (which must exist), to be called immediately when the current computation is invalidated or stopped.
 * @locus Client
 * @param {Function} callback A callback function that will be invoked as `func(c)`, where `c` is the computation on which the callback is registered.
 */
// Tracker.onInvalidate = function (f) {
//   if (! Tracker.active)
//     throw new Error("Tracker.onInvalidate requires a currentComputation");

//   Tracker.currentComputation.onInvalidate(f);
// };

// http://docs.meteor.com/#tracker_afterflush

/**
 * @summary Schedules a function to be called during the next flush, or later in the current flush if one is in progress, after all invalidated computations have been rerun.  The function will be run once and not on subsequent flushes unless `afterFlush` is called again.
 * @locus Client
 * @param {Function} callback A function to call at flush time.
 */
exports.afterFlush = function (f) {
  afterFlushCallbacks.push(f);
  requireFlush();
};
