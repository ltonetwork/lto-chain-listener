const path = require('path');

module.exports = (env, options) => {
  const mode = options.mode ? options.mode : 'development';

  // @todo: maybe we need to set a browser version of the build? this build only works with nodejs
  const webpackConfig = {
    mode: mode,
    name: 'node-server-webpack-config',
    target: 'node',
    entry: './src/index.ts',
    devtool: mode === 'development' ? 'source-map' : false,
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
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      globalObject: 'this',
      library: {
        name: 'LTOChainListener',
        type: 'umd',
        umdNamedDefine: true,
      },
    },
    watchOptions: {
      poll: 1000,
      ignored: /node_modules/,
    },
  };

  return webpackConfig;
};
