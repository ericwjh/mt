var _ =   require('underscore');
var MongoID = require('../mongo-id')

// Is this selector just shorthand for lookup by _id?
exports._selectorIsId = function (selector) {
  return (typeof selector === "string") ||
    (typeof selector === "number") ||
    selector instanceof MongoID.ObjectID;
};

// Is the selector just lookup by _id (shorthand or not)?
exports._selectorIsIdPerhapsAsObject = function (selector) {
  return exports._selectorIsId(selector) ||
    (selector && typeof selector === "object" &&
     selector._id && exports._selectorIsId(selector._id) &&
     _.size(selector) === 1);
};

// If this is a selector which explicitly constrains the match by ID to a finite
// number of documents, returns a list of their IDs.  Otherwise returns
// null. Note that the selector may have other restrictions so it may not even
// match those document!  We care about $in and $and since those are generated
// access-controlled update and remove.
exports._idsMatchedBySelector = function (selector) {
  // Is the selector just an ID?
  if (exports._selectorIsId(selector))
    return [selector];
  if (!selector)
    return null;

  // Do we have an _id clause?
  if (_.has(selector, '_id')) {
    // Is the _id clause just an ID?
    if (exports._selectorIsId(selector._id))
      return [selector._id];
    // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
    if (selector._id && selector._id.$in
        && _.isArray(selector._id.$in)
        && !_.isEmpty(selector._id.$in)
        && _.all(selector._id.$in, exports._selectorIsId)) {
      return selector._id.$in;
    }
    return null;
  }

  // If this is a top-level $and, and any of the clauses constrain their
  // documents, then the whole selector is constrained by any one clause's
  // constraint. (Well, by their intersection, but that seems unlikely.)
  if (selector.$and && _.isArray(selector.$and)) {
    for (var i = 0; i < selector.$and.length; ++i) {
      var subIds = exports._idsMatchedBySelector(selector.$and[i]);
      if (subIds)
        return subIds;
    }
  }

  return null;
};