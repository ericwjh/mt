var DiffSequence = require('../diff-sequence')
// ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are IdMaps
exports._diffQueryChanges = function (ordered, oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);
};

exports._diffQueryUnorderedChanges = function (oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);
};


exports._diffQueryOrderedChanges =
  function (oldResults, newResults, observer, options) {
  return DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);
};

exports._diffObjects = function (left, right, callbacks) {
  return DiffSequence.diffObjects(left, right, callbacks);
};
