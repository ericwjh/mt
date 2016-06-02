var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var makeConfig = require('./make-client-webpack-config')

var host = '0.0.0.0';
var webpackPort = 9090;
var meteorPort = 3000;
var mode = 'dev';
var options = {
	mode,
	host,
	webpackPort,
	meteorPort,
	baseUrl: 'http://' + host + ':' + webpackPort,
	contentBase: 'http://' + host + ':' + meteorPort
};

var clientConfig = makeConfig(options)

var clientCompiler = webpack(clientConfig);
var clientDevServer = new WebpackDevServer(clientCompiler, clientConfig.devServer);
clientDevServer.listen(clientConfig.devServer.port, clientConfig.devServer.host, function() {});