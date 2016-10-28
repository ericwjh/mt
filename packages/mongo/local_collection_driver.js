"use strict"

var LocalCollection = require('../minimongo/LocalCollection')

class LocalCollectionDriver{
  constructor() {
    this.noConnCollections = {}
  }
  
  open(name, conn) {
    if (!name)
      return new LocalCollection;
    if (!conn) {
      return ensureCollection(name, this.noConnCollections);
    }
    if (!conn._mongo_livedata_collections)
      conn._mongo_livedata_collections = {};
    // XXX is there a way to keep track of a connection's collections without
    // dangling it off the connection object?
    return ensureCollection(name, conn._mongo_livedata_collections);
  }
};

function ensureCollection(name, collections) {
  if (!(name in collections))
    collections[name] = new LocalCollection(name);
  return collections[name];
};

module.exports = new LocalCollectionDriver