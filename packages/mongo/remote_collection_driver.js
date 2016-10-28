// var MongoInternals = require('./mongo_driver.js')
var MongoConnection = require('./mongo_driver')
var _ =   require('underscore');
module.exports = MongoConnection

MongoConnection.RemoteCollectionDriver = function (
  mongo_url, options) {
  var self = this;
  self.mongo = new MongoConnection(mongo_url, options);
};

_.extend(MongoConnection.RemoteCollectionDriver.prototype, {
  open: function (name) {
    var self = this;
    var ret = {};
    _.each(
      ['find', 'findOne', 'insert', 'update', 'upsert',
       'remove', '_ensureIndex', '_dropIndex', '_createCappedCollection',
       'dropCollection', 'rawCollection'],
      function (m) {
        ret[m] = _.bind(self.mongo[m], self.mongo, name);
      });
    return ret;
  }
});


// Create the singleton RemoteCollectionDriver only on demand, so we
// only require Mongo configuration if it's actually used (eg, not if
// you're only trying to receive data from a remote DDP server.)
MongoConnection.defaultRemoteCollectionDriver = _.once(function () {
  var connectionOptions = {};

  var mongoUrl = process.env.MONGO_URL;

  if (process.env.MONGO_OPLOG_URL) {
    console.log(process.env.MONGO_OPLOG_URL,'process.env.MONGO_OPLOG_URL')
    connectionOptions.oplogUrl = process.env.MONGO_OPLOG_URL;
  }
  if (! mongoUrl)
    throw new Error("MONGO_URL must be set in environment");
  var a = new MongoConnection.RemoteCollectionDriver(mongoUrl, connectionOptions);
  return a;//new MongoInternals.RemoteCollectionDriver(mongoUrl, connectionOptions);
});
