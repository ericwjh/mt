"use strict"

var IdMap = require('../id-map')
var MongoID = require('../mongo-id')

class _IdMap extends IdMap {
	constructor() {
		super( MongoID.idStringify, MongoID.idParse);
	}
}
module.exports =  _IdMap