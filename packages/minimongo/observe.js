var MongoID = require('../mongo-id')
var EJSON = require('../ejson')
var _ =   require('underscore');
var DiffSequence = require('../diff-sequence')
var _IdMap = require('./id_map')
// XXX maybe move these into another ObserveHelpers package or something

// _CachingChangeObserver is an object which receives observeChanges callbacks
// and keeps a cache of the current cursor state up to date in self.docs. Users
// of this class should read the docs field but not modify it. You should pass
// the "applyChange" field as the callbacks to the underlying observeChanges
// call. Optionally, you can specify your own observeChanges callbacks which are
// invoked immediately before the docs field is updated; this object is made
// available as `this` to those callbacks.
var _CachingChangeObserver = function (options) {
  var self = this;
  options = options || {};

  var orderedFromCallbacks = options.callbacks &&
        _observeChangesCallbacksAreOrdered(options.callbacks);
  if (_.has(options, 'ordered')) {
    self.ordered = options.ordered;
    if (options.callbacks && options.ordered !== orderedFromCallbacks)
      throw Error("ordered option doesn't match callbacks");
  } else if (options.callbacks) {
    self.ordered = orderedFromCallbacks;
  } else {
    throw Error("must provide ordered or callbacks");
  }
  var callbacks = options.callbacks || {};

  if (self.ordered) {
    self.docs = new OrderedDict(MongoID.idStringify);
    self.applyChange = {
      addedBefore: function (id, fields, before) {
        var doc = EJSON.clone(fields);
        doc._id = id;
        callbacks.addedBefore && callbacks.addedBefore.call(
          self, id, fields, before);
        // This line triggers if we provide added with movedBefore.
        callbacks.added && callbacks.added.call(self, id, fields);
        // XXX could `before` be a falsy ID?  Technically
        // idStringify seems to allow for them -- though
        // OrderedDict won't call stringify on a falsy arg.
        self.docs.putBefore(id, doc, before || null);
      },
      movedBefore: function (id, before) {
        var doc = self.docs.get(id);
        callbacks.movedBefore && callbacks.movedBefore.call(self, id, before);
        self.docs.moveBefore(id, before || null);
      }
    };
  } else {
    self.docs = new _IdMap;
    self.applyChange = {
      added: function (id, fields) {
        var doc = EJSON.clone(fields);
        callbacks.added && callbacks.added.call(self, id, fields);
        doc._id = id;
        self.docs.set(id,  doc);
      }
    };
  }

  // The methods in _IdMap and OrderedDict used by these callbacks are
  // identical.
  self.applyChange.changed = function (id, fields) {
    var doc = self.docs.get(id);
    if (!doc)
      throw new Error("Unknown id for changed: " + id);
    callbacks.changed && callbacks.changed.call(
      self, id, EJSON.clone(fields));
    DiffSequence.applyChanges(doc, fields);
  };
  self.applyChange.removed = function (id) {
    callbacks.removed && callbacks.removed.call(self, id);
    self.docs.remove(id);
  };
};
exports._CachingChangeObserver = _CachingChangeObserver

function _observeChangesCallbacksAreOrdered(callbacks) {
  if (callbacks.added && callbacks.addedBefore)
    throw new Error("Please specify only one of added() and addedBefore()");
  return !!(callbacks.addedBefore || callbacks.movedBefore);
};

exports._observeChangesCallbacksAreOrdered = _observeChangesCallbacksAreOrdered

function _observeCallbacksAreOrdered (callbacks) {
  if (callbacks.addedAt && callbacks.added)
    throw new Error("Please specify only one of added() and addedAt()");
  if (callbacks.changedAt && callbacks.changed)
    throw new Error("Please specify only one of changed() and changedAt()");
  if (callbacks.removed && callbacks.removedAt)
    throw new Error("Please specify only one of removed() and removedAt()");

  return !!(callbacks.addedAt || callbacks.movedTo || callbacks.changedAt
            || callbacks.removedAt);
};

exports._observeFromObserveChanges = function (cursor, observeCallbacks) {
  var transform = cursor.getTransform() || function (doc) {return doc;};
  var suppressed = !!observeCallbacks._suppress_initial;

  var observeChangesCallbacks;
  if (_observeCallbacksAreOrdered(observeCallbacks)) {
    // The "_no_indices" option sets all index arguments to -1 and skips the
    // linear scans required to generate them.  This lets observers that don't
    // need absolute indices benefit from the other features of this API --
    // relative order, transforms, and applyChanges -- without the speed hit.
    var indices = !observeCallbacks._no_indices;
    observeChangesCallbacks = {
      addedBefore: function (id, fields, before) {
        var self = this;
        if (suppressed || !(observeCallbacks.addedAt || observeCallbacks.added))
          return;
        var doc = transform(_.extend(fields, {_id: id}));
        if (observeCallbacks.addedAt) {
          var index = indices
                ? (before ? self.docs.indexOf(before) : self.docs.size()) : -1;
          observeCallbacks.addedAt(doc, index, before);
        } else {
          observeCallbacks.added(doc);
        }
      },
      changed: function (id, fields) {
        var self = this;
        if (!(observeCallbacks.changedAt || observeCallbacks.changed))
          return;
        var doc = EJSON.clone(self.docs.get(id));
        if (!doc)
          throw new Error("Unknown id for changed: " + id);
        var oldDoc = transform(EJSON.clone(doc));
        DiffSequence.applyChanges(doc, fields);
        doc = transform(doc);
        if (observeCallbacks.changedAt) {
          var index = indices ? self.docs.indexOf(id) : -1;
          observeCallbacks.changedAt(doc, oldDoc, index);
        } else {
          observeCallbacks.changed(doc, oldDoc);
        }
      },
      movedBefore: function (id, before) {
        var self = this;
        if (!observeCallbacks.movedTo)
          return;
        var from = indices ? self.docs.indexOf(id) : -1;

        var to = indices
              ? (before ? self.docs.indexOf(before) : self.docs.size()) : -1;
        // When not moving backwards, adjust for the fact that removing the
        // document slides everything back one slot.
        if (to > from)
          --to;
        observeCallbacks.movedTo(transform(EJSON.clone(self.docs.get(id))),
                                 from, to, before || null);
      },
      removed: function (id) {
        var self = this;
        if (!(observeCallbacks.removedAt || observeCallbacks.removed))
          return;
        // technically maybe there should be an EJSON.clone here, but it's about
        // to be removed from self.docs!
        var doc = transform(self.docs.get(id));
        if (observeCallbacks.removedAt) {
          var index = indices ? self.docs.indexOf(id) : -1;
          observeCallbacks.removedAt(doc, index);
        } else {
          observeCallbacks.removed(doc);
        }
      }
    };
  } else {
    observeChangesCallbacks = {
      added: function (id, fields) {
        if (!suppressed && observeCallbacks.added) {
          var doc = _.extend(fields, {_id:  id});
          observeCallbacks.added(transform(doc));
        }
      },
      changed: function (id, fields) {
        var self = this;
        if (observeCallbacks.changed) {
          var oldDoc = self.docs.get(id);
          var doc = EJSON.clone(oldDoc);
          DiffSequence.applyChanges(doc, fields);
          observeCallbacks.changed(transform(doc),
                                   transform(EJSON.clone(oldDoc)));
        }
      },
      removed: function (id) {
        var self = this;
        if (observeCallbacks.removed) {
          observeCallbacks.removed(transform(self.docs.get(id)));
        }
      }
    };
  }

  var changeObserver = new _CachingChangeObserver(
    {callbacks: observeChangesCallbacks});
  var handle = cursor.observeChanges(changeObserver.applyChange);
  suppressed = false;

  return handle;
};
