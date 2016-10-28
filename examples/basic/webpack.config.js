var merge = require('webpack-merge');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var mode = 'dev'
var host = '0.0.0.0';
var webpackPort = 8080;
var baseUrl = 'http://' + host + ':' + webpackPort

var serverPort = 3000;
var contentBase = 'http://' + host + ':' + serverPort

var babelQuery = {
	presets: ["babel-preset-es2015", "babel-preset-stage-0", "babel-preset-react"]
		.map(require.resolve),

	plugins: ["babel-plugin-syntax-async-functions"]
		.map(require.resolve)
}

var config = {
	entry: [path.resolve(__dirname, './client')],
	output: {
		path: path.join(__dirname, './bundle/client'),
		publicPath: baseUrl + '/',
		filename: 'index.js'
	},
	node: {
		fs: "empty"
	},
	resolve: {
		extensions: ['', '.js', '.jsx'],
		alias: {
			react: path.resolve(__dirname, '../node_modules/react'),
		}
	},
	module: {
		loaders: [
		// {
		// 	test: /\.(jsx?|coffee|iced)$/,
		// 	loader: require.resolve('babel-loader'),
		// 	exclude: function(filename) {
		// 		if (filename.indexOf(path.resolve(__dirname, '..')) == 0) {
		// 			return /node_modules/.test(filename)
		// 		}
		// 		return false
		// 	},
		// 	query: babelQuery
		// }, 
		{
			test: /\.css$/,
			loaders: ['style-loader', 'css-loader']
		}, {
			test: /\.styl$/,
			loaders: ['style-loader', 'css-loader']
		}, {
			test: /\.styl$/,
			loader: 'stylus-loader',
			query: {
				import: require.resolve('nib/index.styl')
			}
		}, {
			test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
			loader: "url-loader",
			query: {
				limit: 999999999
			}
		}, {
			test: /\.jpg$/,
			loader: 'url',
			query: {
				limit: 1000000,
				minetype: 'image/jpg'
			}
		}, {
			test: /\.(pug|jade)$/,
			loader: require.resolve('babel-loader'),
			query: babelQuery
		}, {
			test: /\.(pug|jade)$/,
			loaders: ['pug-react-compiler-loader']
		}, {
			test: /\.png$/,
			loader: 'url',
			query: {
				limit: 1000000,
				minetype: 'image/png'
			}
		}, {
			test: /\.cjsx$/,
			loaders: ['iced-coffee-loader', 'cjsx-loader']
		}, {
			test: /\.coffee|iced$/,
			loaders: ['iced-coffee-loader']
				// }, {
				// 	test: /\.csv$/,
				// 	loader: 'dsv-loader'
				// }, {
				// 	test: /\.json$/,
				// 	loader: 'json-loader'
		}]
	},
	plugins: [
		new ProgressBarPlugin,
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('development'),
			'Package': 'window',
			'Meteor.isClient': true,
			'Meteor.isServer': false,
			'Meteor._debug': 'console.log'
		})
	]
}
if (mode === 'dev') {
	config.module.loaders = [{
		test: /\.(jsx?|coffee)$/,
		loader: require.resolve('react-hot-loader'),
		exclude: /node_modules|packages/
	}, {
		test: /\.(pug|jade)$/,
		loader: require.resolve('react-hot-loader')
	}].concat(config.module.loaders)
	config = merge.smart(config, {
		plugins: [
			new webpack.HotModuleReplacementPlugin
		],
		devtool: 'eval',
		// output: {
		// 	publicPath: baseUrl + '/'
		// }
	})
	config.entry = [
		'webpack-dev-server/client?' + baseUrl,
	].concat(config.entry).concat([
		'webpack/hot/only-dev-server'
	])
}


module.exports = config