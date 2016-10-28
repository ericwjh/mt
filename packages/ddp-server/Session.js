var _ = require('underscore')
var Fiber =   require('fibers');
var _DoubleEndedQueue = require('double-ended-queue')

var stringifyDDP = require('../ddp-common/utils').stringifyDDP
var Random = require('../random')
var Subscription = require('./Subscription')
var SessionCollectionView = require('./SessionCollectionView')
var RateLimiter = require('../rate-limit')
var MethodInvocation = require('../ddp-common/method_invocation')
var WriteFence = require('./writeFence')
var CurrentInvocation = require('../ddp-common/CurrentInvocation')
var Session = module.exports = function (server, socket, options) {
  var self = this;
  self.id = Random.id();

  self.server = server;

  self.initialized = false;
  self.socket = socket;

  // set to null when the session is destroyed. multiple places below
  // use this to determine if the session is alive or not.
  self.inQueue = new _DoubleEndedQueue();

  self.blocked = false;
  self.workerRunning = false;

  // Sub objects for active subscriptions
  self._namedSubs = {};
  self._universalSubs = [];

  self.userId = null;

  self.collectionViews = {};

  // Set this to false to not send messages when collectionViews are
  // modified. This is done when rerunning subs in _setUserId and those messages
  // are calculated via a diff instead.
  self._isSending = true;

  // If this is true, don't start a newly-created universal publisher on this
  // session. The session will take care of starting it when appropriate.
  self._dontStartNewUniversalSubs = false;

  // when we are rerunning subscriptions, any ready messages
  // we want to buffer up for when we are done rerunning subscriptions
  self._pendingReady = [];

  // List of callbacks to call when this connection is closed.
  self._closeCallbacks = [];


  // XXX HACK: If a sockjs connection, save off the URL. This is
  // temporary and will go away in the near future.
  self._socketUrl = socket.url;

  // Allow tests to disable responding to pings.
  self._respondToPings = options.respondToPings;

  // This object is the public interface to the session. In the public
  // API, it is called the `connection` object.  Internally we call it
  // a `connectionHandle` to avoid ambiguity.
  self.connectionHandle = {
    id: self.id,
    close: function () {
      self.close();
    },
    onClose: function (fn) {
      var cb = global.bindEnvironment(fn, "connection onClose callback");
      if (self.inQueue) {
        self._closeCallbacks.push(cb);
      } else {
        // if we're already closed, call the callback.
        Meteor.defer(cb);
      }
    },
    clientAddress: self._clientAddress(),
    httpHeaders: self.socket.headers
  };

  self.send({ msg: 'connected', session: self.id });

  // On initial connect, spin up all the universal publishers.
  Fiber(function () {
    self.startUniversalSubs();
  }).run();

  // if (version !== 'pre1' && options.heartbeatInterval !== 0) {
  //   self.heartbeat = new DDPCommon.Heartbeat({
  //     heartbeatInterval: options.heartbeatInterval,
  //     heartbeatTimeout: options.heartbeatTimeout,
  //     onTimeout: function () {
  //       self.close();
  //     },
  //     sendPing: function () {
  //       self.send({msg: 'ping'});
  //     }
  //   });
  //   self.heartbeat.start();
  // }

  // Package.facts && Package.facts.Facts.incrementServerFact(
  //   "livedata", "sessions", 1);
};

_.extend(Session.prototype, {

  sendReady: function (subscriptionIds) {
    var self = this;
    if (self._isSending)
      self.send({msg: "ready", subs: subscriptionIds});
    else {
      _.each(subscriptionIds, function (subscriptionId) {
        self._pendingReady.push(subscriptionId);
      });
    }
  },

  sendAdded: function (collectionName, id, fields) {
    var self = this;
    if (self._isSending)
      self.send({msg: "added", collection: collectionName, id: id, fields: fields});
  },

  sendChanged: function (collectionName, id, fields) {
    var self = this;
    if (_.isEmpty(fields))
      return;

    if (self._isSending) {
      self.send({
        msg: "changed",
        collection: collectionName,
        id: id,
        fields: fields
      });
    }
  },

  sendRemoved: function (collectionName, id) {
    var self = this;
    if (self._isSending)
      self.send({msg: "removed", collection: collectionName, id: id});
  },

  getSendCallbacks: function () {
    var self = this;
    return {
      added: _.bind(self.sendAdded, self),
      changed: _.bind(self.sendChanged, self),
      removed: _.bind(self.sendRemoved, self)
    };
  },

  getCollectionView: function (collectionName) {
    var self = this;
    if (_.has(self.collectionViews, collectionName)) {
      return self.collectionViews[collectionName];
    }
    var ret = new SessionCollectionView(collectionName,
                                        self.getSendCallbacks());
    self.collectionViews[collectionName] = ret;
    return ret;
  },

  added: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.added(subscriptionHandle, id, fields);
  },

  removed: function (subscriptionHandle, collectionName, id) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.removed(subscriptionHandle, id);
    if (view.isEmpty()) {
      delete self.collectionViews[collectionName];
    }
  },

  changed: function (subscriptionHandle, collectionName, id, fields) {
    var self = this;
    var view = self.getCollectionView(collectionName);
    view.changed(subscriptionHandle, id, fields);
  },

  startUniversalSubs: function () {
    var self = this;
    // Make a shallow copy of the set of universal handlers and start them. If
    // additional universal publishers start while we're running them (due to
    // yielding), they will run separately as part of Server.publish.
    var handlers = _.clone(self.server.universal_publish_handlers);
    _.each(handlers, function (handler) {
      self._startSubscription(handler);
    });
  },

  // Destroy this session and unregister it at the server.
  close: function () {
    var self = this;

    // Destroy this session, even if it's not registered at the
    // server. Stop all processing and tear everything down. If a socket
    // was attached, close it.

    // Already destroyed.
    if (! self.inQueue)
      return;

    // Drop the merge box data immediately.
    self.inQueue = null;
    self.collectionViews = {};

    if (self.heartbeat) {
      self.heartbeat.stop();
      self.heartbeat = null;
    }

    if (self.socket) {
      self.socket.close();
      self.socket._meteorSession = null;
    }

    // Package.facts && Package.facts.Facts.incrementServerFact(
    //   "livedata", "sessions", -1);

    // Meteor.defer(function () {
      // stop callbacks can yield, so we defer this on close.
      // sub._isDeactivated() detects that we set inQueue to null and
      // treats it as semi-deactivated (it will ignore incoming callbacks, etc).
      self._deactivateAllSubscriptions();

      // Defer calling the close callbacks, so that the caller closing
      // the session isn't waiting for all the callbacks to complete.
      _.each(self._closeCallbacks, function (callback) {
        callback();
      });
    // });

    // Unregister the session.
    self.server._removeSession(self);
  },

  // Send a message (doing nothing if no socket is connected right now.)
  // It should be a JSON object (it will be stringified.)
  send: function (msg) {
    var self = this;
    if (self.socket) {
      self.socket.send(stringifyDDP(msg));
    }
  },

  // Send a connection error.
  sendError: function (reason, offendingMessage) {
    var self = this;
    var msg = {msg: 'error', reason: reason};
    if (offendingMessage)
      msg.offendingMessage = offendingMessage;
    self.send(msg);
  },

  // Process 'msg' as an incoming message. (But as a guard against
  // race conditions during reconnection, ignore the message if
  // 'socket' is not the currently connected socket.)
  //
  // We run the messages from the client one at a time, in the order
  // given by the client. The message handler is passed an idempotent
  // function 'unblock' which it may call to allow other messages to
  // begin running in parallel in another fiber (for example, a method
  // that wants to yield.) Otherwise, it is automatically unblocked
  // when it returns.
  //
  // Actually, we don't have to 'totally order' the messages in this
  // way, but it's the easiest thing that's correct. (unsub needs to
  // be ordered against sub, methods need to be ordered against each
  // other.)
  processMessage: function (msg_in) {
    var self = this;
    if (!self.inQueue) // we have been destroyed.
      return;

    // Respond to ping and pong messages immediately without queuing.
    // If the negotiated DDP version is "pre1" which didn't support
    // pings, preserve the "pre1" behavior of responding with a "bad
    // request" for the unknown messages.
    //
    // Fibers are needed because heartbeat uses Meteor.setTimeout, which
    // needs a Fiber. We could actually use regular setTimeout and avoid
    // these new fibers, but it is easier to just make everything use
    // Meteor.setTimeout and not think too hard.
    //
    // Any message counts as receiving a pong, as it demonstrates that
    // the client is still alive.
    if (self.heartbeat) {
      Fiber(function () {
        self.heartbeat.messageReceived();
      }).run();
    }

    if (self.version !== 'pre1' && msg_in.msg === 'ping') {
      if (self._respondToPings)
        self.send({msg: "pong", id: msg_in.id});
      return;
    }
    if (self.version !== 'pre1' && msg_in.msg === 'pong') {
      // Since everything is a pong, nothing to do
      return;
    }

    self.inQueue.push(msg_in);
    if (self.workerRunning)
      return;
    self.workerRunning = true;
    var processNext = function () {
      var msg = self.inQueue && self.inQueue.shift();
      if (!msg) {
        self.workerRunning = false;
        return;
      }
      
      Fiber(function () {
        var blocked = true;

        var unblock = function () {
          if (!blocked)
            return; // idempotent
          blocked = false;
          processNext();
        };
        if (_.has(self.protocol_handlers, msg.msg))
          self.protocol_handlers[msg.msg].call(self, msg, unblock);
        else
          self.sendError('Bad request', msg);
        unblock(); // in case the handler didn't already do it

      }).run();
    };

    processNext();
  },

  protocol_handlers: {
    sub: function (msg) {
      var self = this;

      // reject malformed messages
      if (typeof (msg.id) !== "string" ||
          typeof (msg.name) !== "string" ||
          (('params' in msg) && !(msg.params instanceof Array))) {
        self.sendError("Malformed subscription", msg);
        return;
      }
      if (!self.server.publish_handlers[msg.name]) {
        self.send({
          msg: 'nosub', id: msg.id,
          // error: new Meteor.Error(404, `Subscription '${msg.name}' not found`)});
          error: new Meteor.Error(404, "Subscription '"+msg.name+"' not found")});
        return;
      }

      if (_.has(self._namedSubs, msg.id)){
        // subs are idempotent, or rather, they are ignored if a sub
        // with that id already exists. this is important during
        // reconnect.
        return;
      }
        

      // XXX It'd be much better if we had generic hooks where any package can
      // hook into subscription handling, but in the mean while we special case
      // ddp-rate-limiter package. This is also done for weak requirements to
      // add the ddp-rate-limiter package in case we don't have Accounts. A
      // user trying to use the ddp-rate-limiter must explicitly require it.
      // if (Package['ddp-rate-limiter']) {
        // var RateLimiter = Package['ddp-rate-limiter'].RateLimiter;
        var rateLimiterInput = {
          userId: self.userId,
          clientAddress: self.connectionHandle.clientAddress,
          type: "subscription",
          name: msg.name,
          connectionId: self.id
        };

        RateLimiter.increment(rateLimiterInput);
        var rateLimitResult = RateLimiter.check(rateLimiterInput);
        if (!rateLimitResult.allowed) {
          self.send({
            msg: 'nosub', id: msg.id,
            error: new Meteor.Error(
              'too-many-requests',
              RateLimiter.getErrorMessage(rateLimitResult),
              {timeToReset: rateLimitResult.timeToReset})
          });
          return;
        }
      // }

      var handler = self.server.publish_handlers[msg.name];
      self._startSubscription(handler, msg.id, msg.params, msg.name);

    },

    unsub: function (msg) {
      var self = this;

      self._stopSubscription(msg.id);
    },

    method: function (msg, unblock) {
      var self = this;

      // reject malformed messages
      // For now, we silently ignore unknown attributes,
      // for forwards compatibility.
      if (typeof (msg.id) !== "string" ||
          typeof (msg.method) !== "string" ||
          (('params' in msg) && !(msg.params instanceof Array)) ||
          (('randomSeed' in msg) && (typeof msg.randomSeed !== "string"))) {
        self.sendError("Malformed method invocation", msg);
        return;
      }

      var randomSeed = msg.randomSeed || null;

      // set up to mark the method as satisfied once all observers
      // (and subscriptions) have reacted to any writes that were
      // done.
      var fence = new WriteFence;
      fence.onAllCommitted(function () {
        // Retire the fence so that future writes are allowed.
        // This means that callbacks like timers are free to use
        // the fence, and if they fire before it's armed (for
        // example, because the method waits for them) their
        // writes will be included in the fence.
        fence.retire();
        self.send({
          msg: 'updated', methods: [msg.id]});
      });

      // find the handler
      var handler = self.server.method_handlers[msg.method];
      if (!handler) {
        self.send({
          msg: 'result', id: msg.id,
          // error: new Meteor.Error(404, `Method '${msg.method}' not found`)});
          error: new Meteor.Error(404, "`Method "+msg.method+" not found`")});
        fence.arm();
        return;
      }

      var setUserId = function(userId) {
        self._setUserId(userId);
      };

      var invocation = new MethodInvocation({
        isSimulation: false,
        userId: self.userId,
        setUserId: setUserId,
        unblock: unblock,
        connection: self.connectionHandle,
        randomSeed: randomSeed
      });
      const payload = {
        msg: "result",
        id: msg.id
      };

      var rateLimiterInput = {
          userId: self.userId,
          clientAddress: self.connectionHandle.clientAddress,
          type: "method",
          name: msg.method,
          connectionId: self.id
        };
        RateLimiter.increment(rateLimiterInput);
        var rateLimitResult = RateLimiter.check(rateLimiterInput)
        if (!rateLimitResult.allowed) {
          var exception =  (new Meteor.Error(
            "too-many-requests",
            RateLimiter.getErrorMessage(rateLimitResult),
            {timeToReset: rateLimitResult.timeToReset}
          ));
          payload.error = exception 
          // wrapInternalException(
          // exception,
          // "`while invoking method "+msg.method
        // );
        } else{
           var result = global.CurrentWriteFence.withValue(
          fence,
          function() {
            return CurrentInvocation.withValue(
            invocation,
            function()  {return handler.apply(invocation, msg.params)}
          )
          } 
        )

      
        fence.arm();
        unblock();
        if (result !== undefined) {
          payload.result = result;
        }
        }

        self.send(payload);

      // return

      
      // const promise = new Promise(function(resolve, reject){
      //   // XXX It'd be better if we could hook into method handlers better but
      //   // for now, we need to check if the ddp-rate-limiter exists since we
      //   // have a weak requirement for the ddp-rate-limiter package to be added
      //   // to our application.
      //   // if (Package['ddp-rate-limiter']) {
      //   //   var RateLimiter = Package['ddp-rate-limiter'].RateLimiter;
          
      //     var rateLimiterInput = {
      //       userId: self.userId,
      //       clientAddress: self.connectionHandle.clientAddress,
      //       type: "method",
      //       name: msg.method,
      //       connectionId: self.id
      //     };
      //     RateLimiter._increment(rateLimiterInput);
      //     var rateLimitResult = RateLimiter._check(rateLimiterInput)
      //     if (!rateLimitResult.allowed) {
      //       reject(new Meteor.Error(
      //         "too-many-requests",
      //         RateLimiter.getErrorMessage(rateLimitResult),
      //         {timeToReset: rateLimitResult.timeToReset}
      //       ));
      //       return;
      //     }

      //   // }

      //   resolve(DDPServer._CurrentWriteFence.withValue(
      //     fence,
      //     function() {
      //       return DDP._CurrentInvocation.withValue(
      //       invocation,
      //       function()  {return maybeAuditArgumentChecks(
      //                     handler, invocation, msg.params,
      //                     "call to '" + msg.method + "'"
      //                   )}
      //     )
      //     } 
      //   ));
      // });

      // function finish() {
      //       fence.arm();
      //   unblock();
      // }

      // const payload = {
      //   msg: "result",
      //   id: msg.id
      // };
      // promise.then(function(result) {
      //   finish();
      //   if (result !== undefined) {
      //     payload.result = result;
      //   }
      //   self.send(payload);
      // }, function(exception) {
      //   console.log(exception)
      //   finish();
      //   payload.error = wrapInternalException(
      //     exception,
      //     "`while invoking method "+msg.method
      //   );
      //   self.send(payload);
      // });
    }
  },

  _eachSub: function (f) {
    var self = this;
    _.each(self._namedSubs, f);
    _.each(self._universalSubs, f);
  },

  _diffCollectionViews: function (beforeCVs) {
    var self = this;
    DiffSequence.diffObjects(beforeCVs, self.collectionViews, {
      both: function (collectionName, leftValue, rightValue) {
        rightValue.diff(leftValue);
      },
      rightOnly: function (collectionName, rightValue) {
        _.each(rightValue.documents, function (docView, id) {
          self.sendAdded(collectionName, id, docView.getFields());
        });
      },
      leftOnly: function (collectionName, leftValue) {
        _.each(leftValue.documents, function (doc, id) {
          self.sendRemoved(collectionName, id);
        });
      }
    });
  },

  // Sets the current user id in all appropriate contexts and reruns
  // all subscriptions
  _setUserId: function(userId) {
    var self = this;

    if (userId !== null && typeof userId !== "string")
      throw new Error("setUserId must be called on string or null, not " +
                      typeof userId);

    // Prevent newly-created universal subscriptions from being added to our
    // session; they will be found below when we call startUniversalSubs.
    //
    // (We don't have to worry about named subscriptions, because we only add
    // them when we process a 'sub' message. We are currently processing a
    // 'method' message, and the method did not unblock, because it is illegal
    // to call setUserId after unblock. Thus we cannot be concurrently adding a
    // new named subscription.)
    self._dontStartNewUniversalSubs = true;

    // Prevent current subs from updating our collectionViews and call their
    // stop callbacks. This may yield.
    self._eachSub(function (sub) {
      sub._deactivate();
    });

    // All subs should now be deactivated. Stop sending messages to the client,
    // save the state of the published collections, reset to an empty view, and
    // update the userId.
    self._isSending = false;
    var beforeCVs = self.collectionViews;
    self.collectionViews = {};
    self.userId = userId;

    // Save the old named subs, and reset to having no subscriptions.
    var oldNamedSubs = self._namedSubs;
    self._namedSubs = {};
    self._universalSubs = [];

    _.each(oldNamedSubs, function (sub, subscriptionId) {
      self._namedSubs[subscriptionId] = sub._recreate();
      // nb: if the handler throws or calls this.error(), it will in fact
      // immediately send its 'nosub'. This is OK, though.
      self._namedSubs[subscriptionId]._runHandler();
    });

    // Allow newly-created universal subs to be started on our connection in
    // parallel with the ones we're spinning up here, and spin up universal
    // subs.
    self._dontStartNewUniversalSubs = false;
    self.startUniversalSubs();

    // Start sending messages again, beginning with the diff from the previous
    // state of the world to the current state. No yields are allowed during
    // this diff, so that other changes cannot interleave.
    global._noYieldsAllowed(function () {
      self._isSending = true;
      self._diffCollectionViews(beforeCVs);
      if (!_.isEmpty(self._pendingReady)) {
        self.sendReady(self._pendingReady);
        self._pendingReady = [];
      }
    });
  },

  _startSubscription: function (handler, subId, params, name) {
    var self = this;

    var sub = new Subscription(
      self, handler, subId, params, name);
    if (subId)
      self._namedSubs[subId] = sub;
    else
      self._universalSubs.push(sub);
    sub._runHandler();
  },

  // tear down specified subscription
  _stopSubscription: function (subId, error) {
    var self = this;

    var subName = null;

    if (subId && self._namedSubs[subId]) {
      subName = self._namedSubs[subId]._name;
      self._namedSubs[subId]._removeAllDocuments();
      self._namedSubs[subId]._deactivate();
      delete self._namedSubs[subId];
    }

    var response = {msg: 'nosub', id: subId};

    if (error) {
      response.error = error
       // wrapInternalException(
       //  error,
       //  subName ? ("from sub " + subName + " id " + subId)
       //    : ("from sub id " + subId));
    }

    self.send(response);
  },

  // tear down all subscriptions. Note that this does NOT send removed or nosub
  // messages, since we assume the client is gone.
  _deactivateAllSubscriptions: function () {
    var self = this;

    _.each(self._namedSubs, function (sub, id) {
      sub._deactivate();
    });
    self._namedSubs = {};

    _.each(self._universalSubs, function (sub) {
      sub._deactivate();
    });
    self._universalSubs = [];
  },

  // Determine the remote client's IP address, based on the
  // HTTP_FORWARDED_COUNT environment variable representing how many
  // proxies the server is behind.
  _clientAddress: function () {
    var self = this;

    // For the reported client address for a connection to be correct,
    // the developer must set the HTTP_FORWARDED_COUNT environment
    // variable to an integer representing the number of hops they
    // expect in the `x-forwarded-for` header. E.g., set to "1" if the
    // server is behind one proxy.
    //
    // This could be computed once at startup instead of every time.
    var httpForwardedCount = parseInt(process.env['HTTP_FORWARDED_COUNT']) || 0;

    if (httpForwardedCount === 0)
      return self.socket.remoteAddress;

    var forwardedFor = self.socket.headers["x-forwarded-for"];
    if (! _.isString(forwardedFor))
      return null;
    forwardedFor = forwardedFor.trim().split(/\s*,\s*/);

    // Typically the first value in the `x-forwarded-for` header is
    // the original IP address of the client connecting to the first
    // proxy.  However, the end user can easily spoof the header, in
    // which case the first value(s) will be the fake IP address from
    // the user pretending to be a proxy reporting the original IP
    // address value.  By counting HTTP_FORWARDED_COUNT back from the
    // end of the list, we ensure that we get the IP address being
    // reported by *our* first proxy.

    if (httpForwardedCount < 0 || httpForwardedCount > forwardedFor.length)
      return null;

    return forwardedFor[forwardedFor.length - httpForwardedCount];
  }
});