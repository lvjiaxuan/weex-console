const path = require('path')

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.cjs.js',
    library: {
      type: 'commonjs2',
    },
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.vue(\?[^?]+)?$/,
        use: [
          {
            loader: 'weex-vue-loader',
            options: {
              babel: {
                query: {
                  presets: [
                    [
                      '@babel/preset-env',
                      {
                        targets: 'last 2 versions, > 1%, not dead',
                        modules: 'cjs',
                      },
                    ],
                  ],
                  plugins: [
                    [
                      '@babel/plugin-transform-runtime',
                      {
                        corejs: 3,
                      },
                    ],
                  ],
                },
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
}
