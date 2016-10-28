var _ = require('underscore')
var Fiber =   require('fibers');
var StreamServer = require('./stream_server')
var Random = require('../random')
var stringifyDDP = require('../ddp-common/utils').stringifyDDP
var parseDDP = require('../ddp-common/utils').parseDDP
var DDPCommon = require('../ddp-common')
var EJSON = require('../ejson')
var CurrentInvocation = require('../ddp-common/CurrentInvocation')
var Session = require('./Session')

require('./writefence')

var Server = module.exports = function (httpServer, options) {
  var self = this;

  // The default heartbeat interval is 30 seconds on the server and 35
  // seconds on the client.  Since the client doesn't need to send a
  // ping as long as it is receiving pings, this means that pings
  // normally go from the server to the client.
  //
  // Note: Troposphere depends on the ability to mutate
  // global.server.options.heartbeatTimeout! This is a hack, but it's life.
  self.options = _.defaults(options || {}, {
    heartbeatInterval: 15000,
    heartbeatTimeout: 15000,
    // For testing, allow responding to pings to be disabled.
    respondToPings: true
  });

  // Map of callbacks to call when a new connection comes in to the
  // server and completes DDP version negotiation. Use an object instead
  // of an array so we can safely remove one from the list while
  // iterating over it.
  // self.onConnectionHook = new Hook({
  //   debugPrintExceptions: "onConnection callback"
  // });

  self.publish_handlers = {};
  self.universal_publish_handlers = [];

  self.method_handlers = {};

  self.sessions = {}; // map from id to session

  self.stream_server = new StreamServer(httpServer);

  self.stream_server.register(function (socket) {
    // socket implements the SockJSConnection interface
    socket._meteorSession = null;

    var sendError = function (reason, offendingMessage) {
      var msg = {msg: 'error', reason: reason};
      if (offendingMessage)
        msg.offendingMessage = offendingMessage;
      socket.send(stringifyDDP(msg));
    };

    socket.on('data', function (raw_msg) {
      // try {
        try {
          var msg = parseDDP(raw_msg);
        } catch (err) {
          sendError('Parse error');
          return;
        }
        if (msg === null || !msg.msg) {
          sendError('Bad request', msg);
          return;
        }

        if (msg.msg === 'connect') {
          if (socket._meteorSession) {
            sendError("Already connected", msg);
            return;
          }
          Fiber(function () {
            self._handleConnect(socket, msg);
          }).run();
          return;
        }

        if (!socket._meteorSession) {
          sendError('Must connect first', msg);
          return;
        }
        socket._meteorSession.processMessage(msg);
      // } catch (e) {
      //   // XXX print stack nicely
      //   console.error("Internal exception while processing message", msg,
      //                 e.message, e.stack);
      // }
    });

    socket.on('close', function () {
      if (socket._meteorSession) {
        Fiber(function () {
          socket._meteorSession.close();
        }).run();
      }
    });
  });
};

_.extend(Server.prototype, {

  /**
   * @summary Register a callback to be called when a new DDP connection is made to the server.
   * @locus Server
   * @param {function} callback The function to call when a new DDP connection is established.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  // onConnection: function (fn) {
  //   var self = this;
  //   return self.onConnectionHook.register(fn);
  // },

  _handleConnect: function (socket, msg) {
    var self = this;

    // // The connect message must specify a version and an array of supported
    // // versions, and it must claim to support what it is proposing.
    // if (!(typeof (msg.version) === 'string' &&
    //       _.isArray(msg.support) &&
    //       _.all(msg.support, _.isString) &&
    //       _.contains(msg.support, msg.version))) {
    //   socket.send(DDPCommon.stringifyDDP({msg: 'failed',
    //                             version: DDPCommon.SUPPORTED_DDP_VERSIONS[0]}));
    //   socket.close();
    //   return;
    // }

    // // In the future, handle session resumption: something like:
    // //  socket._meteorSession = self.sessions[msg.session]
    // var version = calculateVersion(msg.support, DDPCommon.SUPPORTED_DDP_VERSIONS);

    // if (msg.version !== version) {
    //   // The best version to use (according to the client's stated preferences)
    //   // is not the one the client is trying to use. Inform them about the best
    //   // version to use.
    //   socket.send(stringifyDDP({msg: 'failed', version: version}));
    //   socket.close();
    //   return;
    // }

    // Yay, version matches! Create a new session.
    // Note: Troposphere depends on the ability to mutate
    // global.server.options.heartbeatTimeout! This is a hack, but it's life.
    socket._meteorSession = new Session(self, socket, self.options);
    self.sessions[socket._meteorSession.id] = socket._meteorSession;
    // self.onConnectionHook.each(function (callback) {
    //   if (socket._meteorSession)
    //     callback(socket._meteorSession.connectionHandle);
    //   return true;
    // });
  },
  /**
   * Register a publish handler function.
   *
   * @param name {String} identifier for query
   * @param handler {Function} publish handler
   * @param options {Object}
   *
   * Server will call handler function on each new subscription,
   * either when receiving DDP sub message for a named subscription, or on
   * DDP connect for a universal subscription.
   *
   * If name is null, this will be a subscription that is
   * automatically established and permanently on for all connected
   * client, instead of a subscription that can be turned on and off
   * with subscribe().
   *
   * options to contain:
   *  - (mostly internal) is_auto: true if generated automatically
   *    from an autopublish hook. this is for cosmetic purposes only
   *    (it lets us determine whether to print a warning suggesting
   *    that you turn off autopublish.)
   */

  /**
   * @summary Publish a record set.
   * @memberOf Meteor
   * @importFromPackage meteor
   * @locus Server
   * @param {String} name Name of the record set.  If `null`, the set has no name, and the record set is automatically sent to all connected clients.
   * @param {Function} func Function called on the server each time a client subscribes.  Inside the function, `this` is the publish handler object, described below.  If the client passed arguments to `subscribe`, the function is called with the same arguments.
   */
  publish: function (name, handler, options) {
    var self = this;

    options = options || {};

    if (name && name in self.publish_handlers) {
      console.error("Ignoring duplicate publish named '" + name + "'");
      return;
    }

//     if (Package.autopublish && !options.is_auto) {
//       // They have autopublish on, yet they're trying to manually
//       // picking stuff to publish. They probably should turn off
//       // autopublish. (This check isn't perfect -- if you create a
//       // publish before you turn on autopublish, it won't catch
//       // it. But this will definitely handle the simple case where
//       // you've added the autopublish package to your app, and are
//       // calling publish from your app code.)
//       if (!self.warned_about_autopublish) {
//         self.warned_about_autopublish = true;
//         console.error(
// "** You've set up some data subscriptions with Meteor.publish(), but\n" +
// "** you still have autopublish turned on. Because autopublish is still\n" +
// "** on, your Meteor.publish() calls won't have much effect. All data\n" +
// "** will still be sent to all clients.\n" +
// "**\n" +
// "** Turn off autopublish by removing the autopublish package:\n" +
// "**\n" +
// "**   $ meteor remove autopublish\n" +
// "**\n" +
// "** .. and make sure you have Meteor.publish() and Meteor.subscribe() calls\n" +
// "** for each collection that you want clients to see.\n");
//       }
//     }

    if (name)
      self.publish_handlers[name] = handler;
    else {
      self.universal_publish_handlers.push(handler);
      // Spin up the new publisher on any existing session too. Run each
      // session's subscription in a new Fiber, so that there's no change for
      // self.sessions to change while we're running this loop.
      _.each(self.sessions, function (session) {
        if (!session._dontStartNewUniversalSubs) {
          Fiber(function() {
            session._startSubscription(handler);
          }).run();
        }
      });
    }
  },

  _removeSession: function (session) {
    var self = this;
    if (self.sessions[session.id]) {
      delete self.sessions[session.id];
    }
  },

  /**
   * @summary Defines functions that can be invoked over the network by clients.
   * @locus Anywhere
   * @param {Object} methods Dictionary whose keys are method names and values are functions.
   * @memberOf Meteor
   * @importFromPackage meteor
   */
  methods: function (methods) {
    var self = this;
    _.each(methods, function (func, name) {
      if (typeof func !== 'function')
        throw new Error("Method '" + name + "' must be a function");
      if (self.method_handlers[name])
        throw new Error("A method named '" + name + "' is already defined");
      self.method_handlers[name] = func;
    });
  },

  call: function (name /*, arguments */) {
    // if it's a function, the last argument is the result callback,
    // not a parameter to the remote method.
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length && typeof args[args.length - 1] === "function")
      var callback = args.pop();
    return this.apply(name, args, callback);
  },

  // @param options {Optional Object}
  // @param callback {Optional Function}
  apply: function (name, args, options, callback) {
    var self = this;

    // We were passed 3 arguments. They may be either (name, args, options)
    // or (name, args, callback)
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};

    if (callback)
      // It's not really necessary to do this, since we immediately
      // run the callback in this fiber before returning, but we do it
      // anyway for regularity.
      // XXX improve error message (and how we report it)
      callback = global.bindEnvironment(
        callback,
        "delivering result of invoking '" + name + "'"
      );

    // Run the handler
    var handler = self.method_handlers[name];
    var exception;
    if (!handler) {
      exception = new Meteor.Error(404, "`Method '${name}' not found`");
    } else {
      // If this is a method call from within another method, get the
      // user state from the outer method, otherwise don't allow
      // setUserId to be called
      var userId = null;
      var setUserId = function() {
        throw new Error("Can't call setUserId on a server initiated method call");
      };
      var connection = null;
      var currentInvocation = CurrentInvocation.get();
      if (currentInvocation) {
        userId = currentInvocation.userId;
        setUserId = function(userId) {
          currentInvocation.setUserId(userId);
        };
        connection = currentInvocation.connection;
      }

      var invocation = new DDPCommon.MethodInvocation({
        isSimulation: false,
        userId: userId,
        setUserId: setUserId,
        connection: connection,
        randomSeed: DDPCommon.makeRpcSeed(currentInvocation, name)
      });
      try {
        var result = CurrentInvocation.withValue(invocation, function () {
          return handler.apply(invocation, EJSON.clone(args))
        });
        result = EJSON.clone(result);
      } catch (e) {
        exception = e;
      }
    }

    // Return the result in whichever way the caller asked for it. Note that we
    // do NOT block on the write fence in an analogous way to how the client
    // blocks on the relevant data being visible, so you are NOT guaranteed that
    // cursor observe callbacks have fired when your callback is invoked. (We
    // can change this if there's a real use case.)
    if (callback) {
      callback(exception, result);
      return undefined;
    }
    if (exception)
      throw exception;
    return result;
  },

  _urlForSession: function (sessionId) {
    var self = this;
    var session = self.sessions[sessionId];
    if (session)
      return session._socketUrl;
    else
      return null;
  }
});

// var calculateVersion = function (clientSupportedVersions,
//                                  serverSupportedVersions) {
//   var correctVersion = _.find(clientSupportedVersions, function (version) {
//     return _.contains(serverSupportedVersions, version);
//   });
//   if (!correctVersion) {
//     correctVersion = serverSupportedVersions[0];
//   }
//   return correctVersion;
// };

// DDPServer._calculateVersion = calculateVersion;


// "blind" exceptions other than those that were deliberately thrown to signal
// errors to the client
var wrapInternalException = function (exception, context) {
  if (!exception || exception instanceof Meteor.Error)
    return exception;

  // tests can set the 'expected' flag on an exception so it won't go to the
  // server log
  if (!exception.expected) {
    console.error("Exception " + context, exception.stack);
    if (exception.sanitizedError) {
      console.error("Sanitized and reported to the client as:", exception.sanitizedError.message);
      console.error();
    }
  }

  // Did the error contain more details that could have been useful if caught in
  // server code (or if thrown from non-client-originated code), but also
  // provided a "sanitized" version with more context than 500 Internal server
  // error? Use that.
  if (exception.sanitizedError) {
    if (exception.sanitizedError instanceof Meteor.Error)
      return exception.sanitizedError;
    console.error("Exception " + context + " provides a sanitizedError that " +
                  "is not a Meteor.Error; ignoring");
  }

  return new Meteor.Error(500, "Internal server error");
};


// Audit argument checks, if the audit-argument-checks package exists (it is a
// weak dependency of this package).
// var maybeAuditArgumentChecks = function (f, context, args, description) {
//   args = args || [];
//   if (Package['audit-argument-checks']) {
//     return Match._failIfArgumentsAreNotAllChecked(
//       f, context, args, description);
//   }
//   return f.apply(context, args);
// };
