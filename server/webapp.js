var fs = require("fs"); 
var http = require("http"); 
var os = require("os"); 
var path = require("path"); 
var url = require("url"); 
var crypto = require("crypto"); 

var express = require('express');
// var compress = require('compression') 
var qs = require('qs') 
// var parseurl = require('parseurl'); 
// var useragent = require('useragent'); 
// var send = require('send'); 

var Future = require('fibers/future'); 
var Fiber = require('fibers'); 
// var _ = require('lodash')

var SHORT_SOCKET_TIMEOUT = 5 * 1000; 
var LONG_SOCKET_TIMEOUT = 120 * 1000; 
global.WebApp = {}; 
global.WebAppInternals = {}; 

// WebAppInternals.NpmModules = { 
// 	connect: { 
// 		// version: require('express/package.json').version, 
// 		module: connect 
// 	} 
// }; 

// WebApp.defaultArch = 'web.browser'; 

// WebApp.clientPrograms = {}; 

var archPath = {}; 

var bundledJsCssUrlRewriteHook; 

var sha1 = function sha1(contents) { 
	var hash = crypto.createHash('sha1'); 
	hash.update(contents); 
	return hash.digest('hex'); 
}; 

var readUtf8FileSync = function readUtf8FileSync(filename) { 
	return Meteor.wrapAsync(fs.readFile)(filename, 'utf8'); 
}; 
                                                                        
var camelCase = function camelCase(name) { 
	var parts = name.split(' '); 
	parts[0] = parts[0].toLowerCase(); 
	for (var i = 1; i < parts.length; ++i) { 
		parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1); 
	} 
	return parts.join(''); 
}; 

var identifyBrowser = function identifyBrowser(userAgentString) { 
	var userAgent = useragent.lookup(userAgentString); 
	return { 
		name: camelCase(userAgent.family), 
		major: +userAgent.major, 
		minor: +userAgent.minor, 
		patch: +userAgent.patch 
	}; 
}; 

WebAppInternals.identifyBrowser = identifyBrowser; 

WebApp.categorizeRequest = function(req) {
	return _.extend({ 
		browser: identifyBrowser(req.headers['user-agent']), 
		url: url.parse(req.url, true) 
	}, _.pick(req, 'dynamicHead', 'dynamicBody')); 
}; 
                                                                                 
function appUrl(url) { 
	if (/\.js$/.test(url)) return false
	if (url === '/favicon.ico' || url === '/robots.txt') return false; 
	                                                         
	if (url === '/app.manifest') return false; 
	
	if (RoutePolicy.classify(url)) return false; 
	
	return true; 
}; 

// Meteor.startup(function() { 
// 	var calculateClientHash = WebAppHashing.calculateClientHash; 
// 	WebApp.clientHash = function(archName) { 
// 		archName = archName || WebApp.defaultArch; 
// 		return calculateClientHash(WebApp.clientPrograms[archName].manifest); 
// 	}; 
	
// 	WebApp.calculateClientHashRefreshable = function(archName) { 
// 		archName = archName || WebApp.defaultArch; 
// 		return calculateClientHash(WebApp.clientPrograms[archName].manifest, function(name) { 
// 			return name === "css"; 
// 		}); 
// 	}; 
// 	WebApp.calculateClientHashNonRefreshable = function(archName) { 
// 		archName = archName || WebApp.defaultArch; 
// 		return calculateClientHash(WebApp.clientPrograms[archName].manifest, function(name) { 
// 			return name !== "css"; 
// 		}); 
// 	}; 
// 	WebApp.calculateClientHashCordova = function() { 
// 		var archName = 'web.cordova'; 
// 		if (!WebApp.clientPrograms[archName]) return 'none'; 
		
// 		return calculateClientHash(WebApp.clientPrograms[archName].manifest, null, _.pick(__meteor_runtime_config__, 'PUBLIC_SETTINGS'));
// 	}; 
// }); 

WebApp._timeoutAdjustmentRequestCallback = function(req, res) { 
	req.setTimeout(LONG_SOCKET_TIMEOUT);                                                                      
	var finishListeners = res.listeners('finish');                                                             
	res.removeAllListeners('finish'); 
	res.on('finish', function() { 
		res.setTimeout(SHORT_SOCKET_TIMEOUT); 
	}); 
	_.each(finishListeners, function(l) { 
		res.on('finish', l); 
	}); 
}; 

function runWebAppServer() { 
	                                                                                                     
	var app = express(); 
	                                                                     
	var rawConnectHandlers = express(); 
	app.use(rawConnectHandlers); 
	
	// app.get('/download', function(req, res){
	// 	res.send('hello download')
	// })

	app.use(function(request, response, next) { 
		var pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX; 
		var url = require('url').parse(request.url); 
		var pathname = url.pathname; 
		if (pathPrefix && pathname.substring(0, pathPrefix.length) === pathPrefix && (pathname.length == pathPrefix.length || pathname.substring(pathPrefix.length, pathPrefix.length + 1) === "/")) {
			request.url = request.url.substring(pathPrefix.length); 
			next(); 
		} else if (pathname === "/favicon.ico" || pathname === "/robots.txt") { 
			next(); 
		} else if (pathPrefix) { 
			response.writeHead(404); 
			response.write("Unknown path"); 
			response.end(); 
		} else { 
			next(); 
		} 
	}); 
	
	var packageAndAppHandlers = express(); 
	app.use(packageAndAppHandlers); 

	if (process.env.CLIENT_JS) {
		app.use('/client/index.js', function(req,res){
			res.writeHead(res.statusCode || 200, { 
				'Content-Type': 'Content-Type:application/javascript' 
			}); 
			res.write(process.env.CLIENT_JS)
			res.end()
		})
	} else {
		app.use('/client',express.static(path.resolve(eval('__dirname'),'../client/')))
	}
	
	app.use(function(req, res, next) { 
		Fiber(function() {
			if (!appUrl(req.url)) return next(); 
			res.writeHead(res.statusCode || 200, { 
				'Content-Type': 'text/html; charset=utf-8' 
			}); 
			res.write(process.env.INDEX_HTML)
			res.end()
		}).run(); 
	}) 
	
	app.use(function(req, res) { 
		res.writeHead(404); 
		res.end(); 
	}); 

	var httpServer = http.createServer(app); 
	httpServer.app = app
	var onListeningCallbacks = []; 
	
	// After 5 seconds w/o data on a socket, kill it.  On the other hand, if                                           
	// there's an outstanding request, give it a higher timeout instead (to avoid                                      
	// killing long-polling requests)                                                                                  
	httpServer.setTimeout(SHORT_SOCKET_TIMEOUT); 
	
	// Do this here, and then also in livedata/stream_server.js, because                                               
	// stream_server.js kills all the current request handlers when installing its                                     
	// own.                                                                                                            
	// httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback); 
	
	// start up app                                                                                                    
	_.extend(WebApp, { 
		rawConnectHandlers: rawConnectHandlers, 
		connectHandlers: packageAndAppHandlers, 
		httpServer: httpServer, 
		
		onListening: function onListening(f) { 
				if (onListeningCallbacks) onListeningCallbacks.push(f);
				else f(); 
			} 
	}); 
}; 

runWebAppServer(); 

module.exports = Package.webapp = {
	WebApp: WebApp,
	WebAppInternals: WebAppInternals
}