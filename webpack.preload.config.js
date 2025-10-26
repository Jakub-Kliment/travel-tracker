const path = require('path');

module.exports = {
  target: 'electron-preload',
  entry: './src/main/preload.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'preload.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
