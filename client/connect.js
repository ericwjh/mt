module.exports = function(url) {
	if (!Meteor.connection)
		Meteor.connection = DDP.connect(url, {
			heartbeatInterval: 0,
		})
	return Meteor.connection
}