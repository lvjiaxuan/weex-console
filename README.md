# 简介

在weex sdk上模仿vConsole的一个简单实现

# 安装

```shell
npm i weex-console
```

# 使用

```js
import weexConsole from 'weexConsole'

// 插件方式安装
Vue.use(weexConsole)
```

vue文件：
```js
// 实例方法
this.$log(xxx)
```