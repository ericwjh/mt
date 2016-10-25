require('mt/client')
var connect = require('mt/client/connect')
var connection = connect('/')
var Tracker = require('mt/packages/tracker')
var Collection = require('mt/packages/mongo/collection.js')
connection.subscribe('A', function(err){
	console.log(err)
})
var A = new Collection('a')
var L = new Collection(null)
L.insert({asdf:1})
var one = L.findOne()
console.log(one.asdf == 1)
L.update({asdf:1}, {$set:{b:2}})
var one = L.findOne()
console.log(one.b == 2)
L.remove({})

global.A = A
Tracker.autorun(function(){
  console.log(A.find().fetch())
// A.remove({b:1})

})
A.insert({b:1})

var Var = require('mt/packages/reactive-var')

var b = new Var(1)

Tracker.autorun(function(){
  console.log(b.get())
})

b.set(2)

A.update({b:1}, {$set:{c:5}}, {multi: true})
connection.call('M', function(err,m){console.log(m)})

connection.call('dealyAdd', 1, 2, 3, function(err, sum){
	console.log(err, sum)
})