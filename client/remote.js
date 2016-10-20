var ddpUrl = '/';

module.exports = Meteor.connection = DDP.connect(ddpUrl, {
  heartbeatInterval: 0,
})