const path = require('path');

module.exports = {
  entry: './src/lto-chain-listener.ts',
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'lto-chain-listener.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: 'LTOChainListener',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
};
