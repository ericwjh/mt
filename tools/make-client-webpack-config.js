var merge = require('webpack-merge');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var babelMerge = require('./babel-merge');
var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

module.exports = function(options) {
	var {
		host,
		webpackPort,
		meteorPort,
		mode,
		baseUrl,
		contentBase
	} = options

	var entry = options.entry || [path.resolve(__dirname,'../../app/main_client')];

	var babelQueryBase = {
		presets: ["es2015-without-strict", "stage-1", "react"]//.map(_=>require(`babel-preset-${_}`)),
		// plugins: ["transform-decorators-legacy"],
		// cacheDirectory: true
	};

	// var config = {
	// 	context: __dirname,
	// 	entry: [],
	// 	output: {
	// 		path: path.join(__dirname, '../bundle'),
	// 		publicPath: '/',
	// 		pathinfo: true
	// 	},
	// 	resolve: {
	// 		extensions: ['', '.js', '.jsx', '.json'],
	// 		root: path.join(__dirname, '../app'),
	// 		alias: {
	// 			webworkify: 'webworkify-webpack'
	// 		}
	// 	},
	// 	module: {
	// 		loaders: [{
	// 			test: /\.jsx?$/,
	// 			loader: 'babel',
	// 			exclude: /node_modules|lib/,
	// 			query: babelQueryBase
	// 		}]
	// 	},
	// 	plugins: [
	// 		new ProgressBarPlugin()
	// 	]
	// };

	// var clientBasePath = path.resolve(__dirname, '../web.browser/')
	// var clinetBaseProgramJson = require(path.resolve(__dirname, '../web.browser/program.json'))
	var config = {
		entry: [path.resolve(__dirname,'../web.browser/index.js'), ...entry],
		output: {
			path: path.join(__dirname, '../bundle'),
			publicPath: '/',
			pathinfo: true,
			filename: 'client.bundle.js'
		},
		node: {
			fs: "empty"
		},
		resolve: {
			extensions: ['', '.js', '.jsx'],
			alias: {
				webworkify: 'webworkify-webpack'
			}
		},
		module: {
			loaders: [{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: babelQueryBase
			},{
				test: /\.css$/,
				loader: 'style-loader!css-loader'
			}, {
				test: /\.styl$/,
				loaders: ['style', 'css', 'stylus?import=' + require.resolve('nib/index.styl')]
			}, {
				test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				loader: 'url-loader?limit=9999999999'
			}, {
				test: /\.jpg$/,
				loader: 'url?limit=1000000&minetype=image/jpg'
			}, , {
				test: /\.jade$/,
				loader: 'jade-react-compiler-loader'
			}, {
				test: /\.png$/,
				loader: 'url?limit=1000000&minetype=image/png'
			}, {
				test: /\.cjsx$/,
				loaders: ['iced-coffee', 'cjsx']
			}, {
				test: /\.coffee$/,
				loaders: ['jsx', 'iced-coffee']
			}, {
				test: /\.csv$/,
				loader: 'dsv'
			}, {
				test: /\.json$/,
				loader: 'json-loader'
			}]
		},
		plugins: [
			new ProgressBarPlugin,
			new webpack.DefinePlugin({
				'Meteor.isClient': true,
				'Meteor.isServer': false
			}),
			new webpack.PrefetchPlugin("react"),
			new webpack.PrefetchPlugin("react/lib/ReactComponentBrowserEnvironment")
		]
	}

	if (mode === 'dev') {
		config = merge.smart({
			entry: [
				'webpack-dev-server/client?' + baseUrl,
				'webpack/hot/only-dev-server'
			],
			plugins: [
				new webpack.HotModuleReplacementPlugin(),
				new webpack.NoErrorsPlugin(),
				new webpack.DefinePlugin({
					'Package': 'window'
				}),
			]
		}, config);

		config = merge.smart(config, {
			devtool: 'eval',
			output: {
				publicPath: baseUrl + '/'
			},
			module: {
				loaders: [
			// {
			// 		test: /\.jsx?$/,
			// 		loader: 'babel',
			// 		exclude: /node_modules|lib|packages/,
			// 		query: babelMerge(babelQueryBase, {
			// 			"plugins": [
			// 				["react-transform", {
			// 					"transforms": [{
			// 						"transform": "react-transform-hmr",
			// 						"imports": ["react"],
			// 						"locals": ["module"]
			// 					}, {
			// 						"transform": "react-transform-catch-errors",
			// 						"imports": ["react", "redbox-react"]
			// 					}]
			// 				}]
			// 			]
			// 		})
			// 	}, 
			{
					test: /\.js$/,
					include: (() => {
						return path.resolve(__dirname, '../../node_modules/mapbox-gl/js/render/painter/use_program.js')
					})(),
					loader: 'transform/cacheable?brfs'
				}]
			},
			devServer: {
				publicPath: baseUrl + '/',
				host: host,
				hot: true,
				contentBase: contentBase,
				port: webpackPort,
				stats: {
					colors: true,
					chunkModules: false,
					modules: false,
				}
			}
		});
	}

	if (mode === 'prod') {
		config = merge.smart(config, {
			module: {
				loaders: [{
					test: /\.jsx?$/,
					loader: 'babel',
					exclude: /node_modules|lib/,
					query: babelMerge(babelQueryBase, {
						"plugins": [
							"transform-react-constant-elements",
						],
					})
				}]
			}
		});

		config = merge(config, {
			output: {
				pathinfo: false
			},
			plugins: [
				new webpack.DefinePlugin({
					'process.env.NODE_ENV': JSON.stringify('production')
				}),
				new webpack.NoErrorsPlugin(),
				new webpack.optimize.DedupePlugin(),
				new webpack.optimize.UglifyJsPlugin({
					compress: {
						warnings: false
					}
				}),
				new webpack.optimize.AggressiveMergingPlugin(),
				new webpack.optimize.OccurenceOrderPlugin(true)
			]
		});
	}

	return config;
}