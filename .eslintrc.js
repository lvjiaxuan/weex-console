module.exports = {
  env: { commonjs: true, browser: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:vue/essential'],
  parserOptions: { ecmaVersion: 12, sourceType: 'module' },
  globals: { process: 'readonly', weex: 'readonly', Vue: 'readonly', WXEnvironment: 'readonly' },
}
