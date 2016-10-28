var _ = require('underscore')
var objectid = require('../minimongo/objectid')
// protect against dangerous selectors.  falsey and {_id: falsey} are both
// likely programmer error, and not what you want, particularly for destructive
// operations.  JS regexps don't serialize over DDP but can be trivially
// replaced by $regex.
module.exports = function _rewriteSelector(selector) {
  // shorthand -- scalars match _id
  if (objectid._selectorIsId(selector))
    selector = {_id: selector};

  if (_.isArray(selector)) {
    // This is consistent with the Mongo console itself; if we don't do this
    // check passing an empty array ends up selecting all items
    throw new Error("Mongo selector can't be an array.");
  }

  if (!selector || (('_id' in selector) && !selector._id))
    // can't match anything
    return {_id: Random.id()};

  var ret = {};
  _.each(selector, function (value, key) {
    // Mongo supports both {field: /foo/} and {field: {$regex: /foo/}}
    if (value instanceof RegExp) {
      ret[key] = convertRegexpToMongoSelector(value);
    } else if (value && value.$regex instanceof RegExp) {
      ret[key] = convertRegexpToMongoSelector(value.$regex);
      // if value is {$regex: /foo/, $options: ...} then $options
      // override the ones set on $regex.
      if (value.$options !== undefined)
        ret[key].$options = value.$options;
    }
    else if (_.contains(['$or','$and','$nor'], key)) {
      // Translate lower levels of $and/$or/$nor
      ret[key] = _.map(value, function (v) {
        return _rewriteSelector(v);
      });
    } else {
      ret[key] = value;
    }
  });
  return ret;
};