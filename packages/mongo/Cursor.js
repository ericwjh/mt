var _ = require('underscore');
var observe = require('../minimongo/observe')
// CURSORS

// There are several classes which relate to cursors:
//
// CursorDescription represents the arguments used to construct a cursor:
// collectionName, selector, and (find) options.  Because it is used as a key
// for cursor de-dup, everything in it should either be JSON-stringifiable or
// not affect observeChanges output (eg, options.transform functions are not
// stringifiable but do not affect observeChanges).
//
// SynchronousCursor is a wrapper around a MongoDB cursor
// which includes fully-synchronous versions of forEach, etc.
//
// Cursor is the cursor object returned from find(), which implements the
// documented Collection cursor API.  It wraps a CursorDescription and a
// SynchronousCursor (lazily: it doesn't contact Mongo until you call a method
// like fetch or forEach on it).
//
// ObserveHandle is the "observe handle" returned from observeChanges. It has a
// reference to an ObserveMultiplexer.
//
// ObserveMultiplexer allows multiple identical ObserveHandles to be driven by a
// single observe driver.
//
// There are two "observe drivers" which drive ObserveMultiplexers:
//   - PollingObserveDriver caches the results of a query and reruns it when
//     necessary.
//   - OplogObserveDriver follows the Mongo operation log to directly observe
//     database changes.
// Both implementations follow the same simple interface: when you create them,
// they start sending observeChanges callbacks (and a ready() invocation) to
// their ObserveMultiplexer, and you stop them by calling their stop() method.



function Cursor(mongo, cursorDescription) {
  var self = this;

  self._mongo = mongo;
  self._cursorDescription = cursorDescription;
  self._synchronousCursor = null;
};

_.each(['forEach', 'map', 'fetch', 'count'], function(method) {
  Cursor.prototype[method] = function() {
    var self = this;

    // You can only observe a tailable cursor.
    if (self._cursorDescription.options.tailable)
      throw new Error("Cannot call " + method + " on a tailable cursor");

    if (!self._synchronousCursor) {
      self._synchronousCursor = self._mongo._createSynchronousCursor(
        self._cursorDescription, {
          // Make sure that the "self" argument to forEach/map callbacks is the
          // Cursor, not the SynchronousCursor.
          selfForIteration: self,
          useTransform: true
        });
    }

    return self._synchronousCursor[method].apply(
      self._synchronousCursor, arguments);
  };
});

// Since we don't actually have a "nextObject" interface, there's really no
// reason to have a "rewind" interface.  All it did was make multiple calls
// to fetch/map/forEach return nothing the second time.
// XXX COMPAT WITH 0.8.1
Cursor.prototype.rewind = function() {};

Cursor.prototype.getTransform = function() {
  return this._cursorDescription.options.transform;
};

// When you call Meteor.publish() with a function that returns a Cursor, we need
// to transmute it into the equivalent subscription.  This is the function that
// does that.
function _publishCursor(cursor, sub, collection) {
  var observeHandle = cursor.observeChanges({
    added: function (id, fields) {
      sub.added(collection, id, fields);
    },
    changed: function (id, fields) {
      sub.changed(collection, id, fields);
    },
    removed: function (id) {
      sub.removed(collection, id);
    }
  });

  // We don't call sub.ready() here: it gets called in livedata_server, after
  // possibly calling _publishCursor on multiple returned cursors.

  // register stop callback (expects lambda w/ no args).
  sub.onStop(function () {observeHandle.stop();});

  // return the observeHandle in case it needs to be stopped early
  return observeHandle;
};
Cursor.prototype._publishCursor = function(sub) {
  var self = this;
  var collection = self._cursorDescription.collectionName;
  return _publishCursor(self, sub, collection);
};

// Used to guarantee that publish functions return at most one cursor per
// collection. Private, because we might later have cursors that include
// documents from multiple collections somehow.
Cursor.prototype._getCollectionName = function() {
  var self = this;
  return self._cursorDescription.collectionName;
}

Cursor.prototype.observe = function(callbacks) {
  var self = this;
  return observe._observeFromObserveChanges(self, callbacks);
};

Cursor.prototype.observeChanges = function(callbacks) {
  var self = this;
  var ordered = observe._observeChangesCallbacksAreOrdered(callbacks);
  return self._mongo._observeChanges(
    self._cursorDescription, ordered, callbacks);
};

module.exports = Cursor