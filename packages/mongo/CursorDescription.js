_rewriteSelector = require('./_rewriteSelector')
function CursorDescription(collectionName, selector, options) {
  var self = this;
  self.collectionName = collectionName;
  self.selector = _rewriteSelector(selector);
  self.options = options || {};
};
module.exports = CursorDescription
