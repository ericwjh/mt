var ddpUrl = '/';

module.exports = Meteor.connection = DDP.connect(ddpUrl, {
  heartbeatInterval: 0,
});

// _.each(['subscribe', 'methods', 'call', 'apply', 'status', 'reconnect',
//         'disconnect'],
//        function (name) {
//          Meteor[name] = _.bind(Meteor.connection[name], Meteor.connection);
//        });