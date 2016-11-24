var _ = require('underscore')
var SockJS = require('sockjs-client')
// @param url {String} URL to Meteor app
//   "http://subdomain.meteor.com/" or "/" or
//   "ddp+sockjs://foo-**.meteor.com/sockjs"
var ClientStream = function (url, options) {
  var self = this;
  self.options = _.extend({
    retry: true
  }, options);
  self._initCommon(self.options);

  //// Constants


  // how long between hearing heartbeat from the server until we declare
  // the connection dead. heartbeats come every 45s (stream_server.js)
  //
  // NOTE: this is a older timeout mechanism. We now send heartbeats at
  // the DDP level (https://github.com/meteor/meteor/pull/1865), and
  // expect those timeouts to kill a non-responsive connection before
  // this timeout fires. This is kept around for compatibility (when
  // talking to a server that doesn't support DDP heartbeats) and can be
  // removed later.
  self.HEARTBEAT_TIMEOUT = 100*1000;

  self.rawUrl = url;
  self.socket = null;

  self.heartbeatTimer = null;

  // Listen to global 'online' event if we are running in a browser.
  // (IE8 does not support addEventListener)
  if (typeof window !== 'undefined' && window.addEventListener)
    window.addEventListener("online", _.bind(self._online, self),
                            false /* useCapture. make FF3.6 happy. */);

  //// Kickoff!
  self._launchConnection();
};
module.exports = ClientStream

_.extend(ClientStream.prototype, {

  // data is a utf8 string. Data sent while not connected is dropped on
  // the floor, and it is up the user of this API to retransmit lost
  // messages on 'reset'
  send: function (data) {
    var self = this;
    if (self.currentStatus.connected) {
      self.socket.send(data);
    }
  },

  // Changes where this connection points
  _changeUrl: function (url) {
    var self = this;
    self.rawUrl = url;
  },

  _connected: function () {
    var self = this;

    if (self.connectionTimer) {
      clearTimeout(self.connectionTimer);
      self.connectionTimer = null;
    }

    if (self.currentStatus.connected) {
      // already connected. do nothing. this probably shouldn't happen.
      return;
    }

    // update status
    self.currentStatus.status = "connected";
    self.currentStatus.connected = true;
    self.currentStatus.retryCount = 0;
    self.statusChanged();

    // fire resets. This must come after status change so that clients
    // can call send from within a reset callback.
    _.each(self.eventCallbacks.reset, function (callback) { callback(); });

  },

  _cleanup: function (maybeError) {
    var self = this;

    self._clearConnectionAndHeartbeatTimers();
    if (self.socket) {
      self.socket.onmessage = self.socket.onclose
        = self.socket.onerror = self.socket.onheartbeat = function () {};
      self.socket.close();
      self.socket = null;
    }

    _.each(self.eventCallbacks.disconnect, function (callback) {
      callback(maybeError);
    });
  },

  _clearConnectionAndHeartbeatTimers: function () {
    var self = this;
    if (self.connectionTimer) {
      clearTimeout(self.connectionTimer);
      self.connectionTimer = null;
    }
    if (self.heartbeatTimer) {
      clearTimeout(self.heartbeatTimer);
      self.heartbeatTimer = null;
    }
  },

  _heartbeat_timeout: function () {
    var self = this;
    console.error("Connection timeout. No sockjs heartbeat received.");
    self._lostConnection(new ConnectionError("Heartbeat timed out"));
  },

  _heartbeat_received: function () {
    var self = this;
    // If we've already permanently shut down this stream, the timeout is
    // already cleared, and we don't need to set it again.
    if (self._forcedToDisconnect)
      return;
    if (self.heartbeatTimer)
      clearTimeout(self.heartbeatTimer);
    self.heartbeatTimer = setTimeout(
      _.bind(self._heartbeat_timeout, self),
      self.HEARTBEAT_TIMEOUT);
  },

  // _sockjsProtocolsWhitelist: function () {
  //   // only allow polling protocols. no streaming.  streaming
  //   // makes safari spin.
  //   var transports = [
  //     'xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'];

  //   // iOS 4 and 5 and below crash when using websockets over certain
  //   // proxies. this seems to be resolved with iOS 6. eg
  //   // https://github.com/LearnBoost/socket.io/issues/193#issuecomment-7308865.
  //   //
  //   // iOS <4 doesn't support websockets at all so sockjs will just
  //   // immediately fall back to http
  //   var noWebsockets = navigator &&
  //         /iPhone|iPad|iPod/.test(navigator.userAgent) &&
  //         /OS 4_|OS 5_/.test(navigator.userAgent);

  //   if (!noWebsockets)
  //     transports = ['websocket'].concat(transports);

  //   return transports;
  // },

  _launchConnection: function () {
    var self = this;
    self._cleanup(); // cleanup the old socket, if there was one.

    // var options = _.extend({
    //   protocols_whitelist:self._sockjsProtocolsWhitelist()
    // }, self.options._sockjsOptions);

    // Convert raw URL to SockJS URL each time we open a connection, so that we
    // can connect to random hostnames and get around browser per-host
    // connection limits.
    self.socket = new SockJS(toSockjsUrl(self.rawUrl), undefined, self.options._sockjsOptions);
    self.socket.onopen = function (data) {
      self._connected();
    };
    self.socket.onmessage = function (data) {
      // self._heartbeat_received();

      if (self.currentStatus.connected)
        _.each(self.eventCallbacks.message, function (callback) {
          callback(data.data);
        });
    };
    self.socket.onclose = function () {
      self._lostConnection();
    };
    self.socket.onerror = function () {
      // XXX is this ever called?
      console.error("stream error", _.toArray(arguments), (new Date()).toDateString());
    };

    self.socket.onheartbeat =  function () {
      self._heartbeat_received();
    };

    if (self.connectionTimer)
      clearTimeout(self.connectionTimer);
    self.connectionTimer = setTimeout(function () {
      self._lostConnection(
        new ConnectionError("DDP connection timed out"));
    }, self.CONNECT_TIMEOUT);
  }
});

// XXX from Underscore.String (http://epeli.github.com/underscore.string/)
var startsWith = function(str, starts) {
  return str.length >= starts.length &&
    str.substring(0, starts.length) === starts;
};
var endsWith = function(str, ends) {
  return str.length >= ends.length &&
    str.substring(str.length - ends.length) === ends;
};

// @param url {String} URL to Meteor app, eg:
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.
// for scheme "http" and subPath "sockjs"
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"
//   or "https://ddp--1234-foo.meteor.com/sockjs"
var translateUrl =  function(url, newSchemeBase, subPath) {
  if (! newSchemeBase) {
    newSchemeBase = "http";
  }

  var ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
  var httpUrlMatch = url.match(/^http(s?):\/\//);
  var newScheme;
  if (ddpUrlMatch) {
    // Remove scheme and split off the host.
    var urlAfterDDP = url.substr(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === "i" ? newSchemeBase : newSchemeBase + "s";
    var slashPos = urlAfterDDP.indexOf('/');
    var host =
          slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
    var rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos);

    // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames
    // and avoid browser per-hostname connection limits.
    host = host.replace(/\*/g, function () {
      return Math.floor(Random.fraction()*10);
    });

    return newScheme + '://' + host + rest;
  } else if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : newSchemeBase + "s";
    var urlAfterHttp = url.substr(httpUrlMatch[0].length);
    url = newScheme + "://" + urlAfterHttp;
  }

  // Prefix FQDNs but not relative URLs
  if (url.indexOf("://") === -1 && !startsWith(url, "/")) {
    url = newSchemeBase + "://" + url;
  }

  // XXX This is not what we should be doing: if I have a site
  // deployed at "/foo", then DDP.connect("/") should actually connect
  // to "/", not to "/foo". "/" is an absolute path. (Contrast: if
  // deployed at "/foo", it would be reasonable for DDP.connect("bar")
  // to connect to "/foo/bar").
  //
  // We should make this properly honor absolute paths rather than
  // forcing the path to be relative to the site root. Simultaneously,
  // we should set DDP_DEFAULT_CONNECTION_URL to include the site
  // root. See also client_convenience.js #RationalizingRelativeDDPURLs
  // url = Meteor._relativeToSiteRootUrl(url);

  if (endsWith(url, "/"))
    return url + subPath;
  else
    return url + "/" + subPath;
};

function toSockjsUrl(url) {
  return translateUrl(url, "http", "sockjs");
};

function toWebsocketUrl(url) {
  var ret = translateUrl(url, "ws", "websocket");
  return ret;
};