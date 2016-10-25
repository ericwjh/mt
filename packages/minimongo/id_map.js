var IdMap = require('../id-map/id-map.js')
var MongoID = require('../mongo-id/id.js')
function _IdMap() {
  var self = this;
  IdMap.call(self, MongoID.idStringify, MongoID.idParse);
};
module.exports =  _IdMap
Meteor._inherits(_IdMap, IdMap);

