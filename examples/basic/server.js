"use strict"
process.env.PORT = process.env.PORT || 4000

var http = require("http");
var fs = require('fs')
var path = require('path')
var mt = require('mt/server')
var Fibers = require('fibers')
var Future = require('fibers/future')
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
	// var L = new Collection(null)
	// L.insert({ts:new Date})

	var A = new Collection('a')
	// A.insert({
	// 	ts: new Date
	// })

	var LocalCollection = require('mt/packages/minimongo/LocalCollection.js')

	var L = new LocalCollection
	L.insert({
		a: 1,
		ts: new Date
	})

	console.log(L.find().count())
	L.update({a:1},{$set:{b:new Date}}, {multi:true})
	console.log(L.find().fetch())
	L.remove({a:1})
	server.publish('A', function() {
		return A.find()
	})

	server.methods({
		M: function(){
			return new Date
		},
		dealyAdd: function(a,b,c){
			var future = new Future

			setTimeout(function(){
				future.return(a+b+c)
			}, 1000)

			return future.wait()
		}
	})

	var ReactiveVar = require('mt/packages/reactive-var')
	var Tracker = require('mt/packages/tracker')

	var r = new ReactiveVar(123)
	Tracker.autorun(function(){
		console.log('r.get()',r.get())
	})
	r.set(456)

}).run()


// function sleep(ms = 0) {
//   return new Promise(r => setTimeout(r, ms));
// }

// (async function(){
//   console.log('a');
//   await sleep(1000);
//   console.log('b');
// })()