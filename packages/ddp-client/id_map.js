var IdMap = require('../id-map/id-map.js')
var MongoID = require('../mongo-id/id.js')
var MongoIDMap = function () {
  var self = this;
  IdMap.call(self, MongoID.idStringify, MongoID.idParse);
};

Meteor._inherits(MongoIDMap, IdMap);
module.exports = MongoIDMap