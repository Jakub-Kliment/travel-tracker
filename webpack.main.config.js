const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
  },
  plugins: [
    // The PDF report reads these at runtime, so they ship alongside main.js
    // rather than being bundled into it.
    new CopyPlugin({
      patterns: [{ from: 'src/main/fonts', to: 'fonts' }],
    }),
  ],
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
