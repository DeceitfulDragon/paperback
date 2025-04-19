const path = require('path');

module.exports = {
  mode: 'development',
  entry: './renderer/js/renderer.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'electron-renderer',
  resolve: {
    alias: {
      vue: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm-browser.prod.js'),
    },
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ],
          },
        },
      },
    ],
  },
};
