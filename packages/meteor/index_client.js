global.Meteor = {}
require('./helpers.js')
require('./errors.js')
require('./fiber_stubs_client.js')
require('./dynamics_browser.js')
Meteor.bindEnvironment = function(func){return func}
Meteor._relativeToSiteRootUrl = function(url){
	return url
}