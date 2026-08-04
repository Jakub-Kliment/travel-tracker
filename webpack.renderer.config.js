const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'electron-renderer',
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Flag SVGs referenced by flag-icons' CSS. Inlined as data URIs so the
        // packaged app makes no external asset requests. Only the 4x3 set is
        // bundled; the square 1x1 variants are unused (they need the .fis class).
        test: /\.svg$/,
        include: /flag-icons[\\/]flags[\\/]4x3/,
        type: 'asset/inline',
      },
      {
        test: /\.svg$/,
        include: /flag-icons[\\/]flags[\\/]1x1/,
        type: 'asset/resource',
        generator: { emit: false, filename: 'unused-flag.svg' },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/renderer'),
    },
    port: 3000,
    hot: true,
  },
};
