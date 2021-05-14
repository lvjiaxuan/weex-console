import weexConsole from './weexConsole'

export default {
  install(Vue) {
    Vue.prototype.$log = (...anyObj) => weexConsole.methods.addLog(anyObj)
    Vue.component('weex-console', weexConsole)
  }
}