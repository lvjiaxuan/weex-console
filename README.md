# 简介

在weex sdk上模仿vConsole的一个简单实现

# 安装

```shell
npm i weex-console
```

# 使用

插件方式安装:
```js
import weexConsole from 'weex-console'

Vue.use(weexConsole)
```

vue文件：
```js
// 模板中 应放在模板钟第一层级的最后面
<weex-console />


// 实例方法
this.$log(xxx)
```

长按log消息体可复制。