var computations = require('./computations')

var nextId = 1;


// `true` if we are computing a computation now, either first time
// or recompute.  This matches Tracker.active unless we are inside
// computations.nonreactive, which nullfies computations even though
// an enclosing computation may still be running.
var inCompute = false;


// Computation constructor is visible but private
// (throws an error if you try to call it)
// var constructingComputation = false;

//
// http://docs.meteor.com/#tracker_computation

/**
 * @summary A Computation object represents code that is repeatedly rerun
 * in response to
 * reactive data changes. Computations don't have return values; they just
 * perform actions, such as rerendering a template on the screen. Computations
 * are created using Tracker.autorun. Use stop to prevent further rerunning of a
 * computation.
 * @instancename computation
 */
var Computation = function (f, parent, onError) {
  var self = this;

  // http://docs.meteor.com/#computation_stopped

  /**
   * @summary True if this computation has been stopped.
   * @locus Client
   * @memberOf Computation
   * @instance
   * @name  stopped
   */
  self.stopped = false;

  // http://docs.meteor.com/#computation_invalidated

  /**
   * @summary True if this computation has been invalidated (and not yet rerun), or if it has been stopped.
   * @locus Client
   * @memberOf Computation
   * @instance
   * @name  invalidated
   * @type {Boolean}
   */
  self.invalidated = false;

  // http://docs.meteor.com/#computation_firstrun

  /**
   * @summary True during the initial run of the computation at the time `Tracker.autorun` is called, and false on subsequent reruns and at other times.
   * @locus Client
   * @memberOf Computation
   * @instance
   * @name  firstRun
   * @type {Boolean}
   */
  self.firstRun = true;

  self._id = nextId++;
  self._onInvalidateCallbacks = [];
  self._onStopCallbacks = [];
  // the plan is at some point to use the parent relation
  // to constrain the order that computations are processed
  self._parent = parent;
  self._func = f;
  self._onError = onError;
  self._recomputing = false;

  // Register the computation within the global Tracker.
  computations._computations[self._id] = self;

  var errored = true;
  try {
    self._compute();
    errored = false;
  } finally {
    self.firstRun = false;
    if (errored)
      self.stop();
  }
};

// http://docs.meteor.com/#computation_oninvalidate

/**
 * @summary Registers `callback` to run when this computation is next invalidated, or runs it immediately if the computation is already invalidated.  The callback is run exactly once and not upon future invalidations unless `onInvalidate` is called again after the computation becomes valid again.
 * @locus Client
 * @param {Function} callback Function to be called on invalidation. Receives one argument, the computation that was invalidated.
 */
Computation.prototype.onInvalidate = function (f) {
  var self = this;

  if (typeof f !== 'function')
    throw new Error("onInvalidate requires a function");

  if (self.invalidated) {
    computations.nonreactive(function () {
      f(self);
    });
  } else {
    self._onInvalidateCallbacks.push(f);
  }
};

/**
 * @summary Registers `callback` to run when this computation is stopped, or runs it immediately if the computation is already stopped.  The callback is run after any `onInvalidate` callbacks.
 * @locus Client
 * @param {Function} callback Function to be called on stop. Receives one argument, the computation that was stopped.
 */
Computation.prototype.onStop = function (f) {
  var self = this;

  if (typeof f !== 'function')
    throw new Error("onStop requires a function");

  if (self.stopped) {
    computations.nonreactive(function () {
      f(self);
    });
  } else {
    self._onStopCallbacks.push(f);
  }
};

// http://docs.meteor.com/#computation_invalidate

/**
 * @summary Invalidates this computation so that it will be rerun.
 * @locus Client
 */
Computation.prototype.invalidate = function () {
  var self = this;
  if (! self.invalidated) {
    // if we're currently in _recompute(), don't enqueue
    // ourselves, since we'll rerun immediately anyway.
    if (! self._recomputing && ! self.stopped) {
      computations.requireFlush();
      computations.pendingComputations.push(this);
    }

    self.invalidated = true;

    // callbacks can't add callbacks, because
    // self.invalidated === true.
    for(var i = 0, f; f = self._onInvalidateCallbacks[i]; i++) {
      computations.nonreactive(function () {
        f(self);
      });
    }
    self._onInvalidateCallbacks = [];
  }
};

// http://docs.meteor.com/#computation_stop

/**
 * @summary Prevents this computation from rerunning.
 * @locus Client
 */
Computation.prototype.stop = function () {
  var self = this;

  if (! self.stopped) {
    self.stopped = true;
    self.invalidate();
    // Unregister from global Tracker.
    delete computations._computations[self._id];
    for(var i = 0, f; f = self._onStopCallbacks[i]; i++) {
      computations.nonreactive(function () {
        f(self);
      });
    }
    self._onStopCallbacks = [];
  }
};

Computation.prototype._compute = function () {
  var self = this;
  self.invalidated = false;

  var previous = computations.currentComputations;
  computations.setCurrentComputation(self);
  var previousInCompute = inCompute;
  inCompute = true;
  try {
    self._func(self);
  } catch(e){
  	console.error(e)
  } finally {
    computations.setCurrentComputation(previous);
    inCompute = previousInCompute;
  }
};

Computation.prototype._needsRecompute = function () {
  var self = this;
  return self.invalidated && ! self.stopped;
};

Computation.prototype._recompute = function () {
  var self = this;

  self._recomputing = true;
    if (self._needsRecompute()) {
        self._compute();
      
    }
    self._recomputing = false;
};

/**
 * @summary Process the reactive updates for this computation immediately
 * and ensure that the computation is rerun. The computation is rerun only
 * if it is invalidated.
 * @locus Client
 */
Computation.prototype.flush = function () {
  var self = this;

  if (self._recomputing)
    return;

  self._recompute();
};

/**
 * @summary Causes the function inside this computation to run and
 * synchronously process all reactive updtes.
 * @locus Client
 */
Computation.prototype.run = function () {
  var self = this;
  self.invalidate();
  self.flush();
};

module.exports = Computation