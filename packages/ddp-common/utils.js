var _ = require('underscore')
var EJSON = require('../ejson')
// var SUPPORTED_DDP_VERSIONS = [ '1', 'pre2', 'pre1' ];

function parseDDP(stringMessage) {
  try {
    var msg = JSON.parse(stringMessage);
  } catch (e) {
    console.error("Discarding message with invalid JSON", stringMessage);
    return null;
  }
  // DDP messages must be objects.
  if (msg === null || typeof msg !== 'object') {
    console.error("Discarding non-object DDP message", stringMessage);
    return null;
  }

  // massage msg to get it into "abstract ddp" rather than "wire ddp" format.

  // switch between "cleared" rep of unsetting fields and "undefined"
  // rep of same
  if (_.has(msg, 'cleared')) {
    if (!_.has(msg, 'fields'))
      msg.fields = {};
    _.each(msg.cleared, function (clearKey) {
      msg.fields[clearKey] = undefined;
    });
    delete msg.cleared;
  }

  _.each(['fields', 'params', 'result'], function (field) {
    if (_.has(msg, field))
      msg[field] = EJSON._adjustTypesFromJSONValue(msg[field]);
  });

  return msg;
};

var stringifyDDP = function (msg) {
  var copy = EJSON.clone(msg);
  // swizzle 'changed' messages from 'fields undefined' rep to 'fields
  // and cleared' rep
  if (_.has(msg, 'fields')) {
    var cleared = [];
    _.each(msg.fields, function (value, key) {
      if (value === undefined) {
        cleared.push(key);
        delete copy.fields[key];
      }
    });
    if (!_.isEmpty(cleared))
      copy.cleared = cleared;
    if (_.isEmpty(copy.fields))
      delete copy.fields;
  }
  // adjust types to basic
  _.each(['fields', 'params', 'result'], function (field) {
    if (_.has(copy, field))
      copy[field] = EJSON._adjustTypesToJSONValue(copy[field]);
  });
  if (msg.id && typeof msg.id !== 'string') {
    throw new Error("Message id is not a string");
  }
  return JSON.stringify(copy);
};

module.exports = {
  parseDDP: parseDDP,
  stringifyDDP: stringifyDDP
  // ,
  // SUPPORTED_DDP_VERSIONS: SUPPORTED_DDP_VERSIONS
}
