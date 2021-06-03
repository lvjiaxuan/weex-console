module.exports = {
  presets: [['@babel/preset-env', { modules: 'cjs' }]],
  plugins: [['@babel/plugin-transform-runtime', { corejs: 3 }]],
}
