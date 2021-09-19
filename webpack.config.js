const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: "./src/bang.js",
  mode: "development",
  output: {
    path: path.resolve('.', 'dist'),
    publicPath: '/',
    filename: "bang.js"
  },
  /*
  module: {
		rules: [
			{
				test: /\.js$/,
        use: { 
          loader: 'babel-loader',
          options: {
            parserOpts: {
              strictMode: false,
            },
            presets: [
              ['@babel/preset-env', {}]
            ],
            plugins: [
              ["@babel/plugin-proposal-private-methods", {}],
            ]
          }
        }
			}
		]
	},
  */
  optimization: {
    minimize: false
  },
  target: "browserslist:last 1 years",
};
