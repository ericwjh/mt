var IdMap = require('../id-map/id-map.js')
var MongoID = require('../mongo-id/id.js')
LocalCollection._IdMap = function () {
  var self = this;
  IdMap.call(self, MongoID.idStringify, MongoID.idParse);
};

Meteor._inherits(LocalCollection._IdMap, IdMap);

