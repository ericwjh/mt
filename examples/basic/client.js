require('mt/client')
var connect = require('mt/client/connect')
var connection = connect('/')
var Tracker = require('mt/packages/tracker/tracker.js')
var Collection = require('mt/packages/mongo/collection.js')
// connection.subscribe('A')
var A = new Collection('a')
// global.A = A
// Tracker.autorun(function(){
//   console.log(A.find().fetch())
// })
// A.insert({b:1})

// var Var = require('mt/packages/reactive-var/reactive-var.js')

// var b = new Var(1)

// Tracker.autorun(function(){
//   console.log(b.get())
// })

// b.set(2)

// A.update({b:1}, {$set:{c:1}})
connection.call('M', function(err,m){console.log(m)})