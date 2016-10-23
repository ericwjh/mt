process.env.PORT = process.env.PORT || 3000

var http = require("http");
var fs = require('fs')
var path = require('path')
var mt = require('mt/server')
var Fibers = require('fibers');
var express = require('express')

var app = express()
app.get('/', function(req, res){
	res.sendFile(path.resolve(__dirname,'index.html'))
})
var httpServer = http.createServer(app);

httpServer.listen(process.env.PORT, function() {
	console.log('listen on', process.env.PORT)
})

var server = mt.registerDDP(httpServer)
mt.connectMongo('mongodb://localhost/test')

Fibers(function() {
		
	var Collection = require('mt/packages/mongo/collection.js')
	var A = new Collection('a')
	A.insert({
		ts: new Date
	})

	server.publish('A', function() {
		return A.find()
	})

	server.methods({
		M: function(){
			return new Date
		}
	})

}).run()