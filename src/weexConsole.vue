<template>
  <div class="wc-wrapper">
    <div
      class="wc-btn"
      ref="weex-console"
      :style="{ top: computedTop + 'px', left: computedLeft + 'px' }"
      @click="showPanel = true"
      @panstart="panstart"
      @panmove="panmove"
    >
      <text style="color: #ffffff">wConsole</text>
    </div>

    <div v-if="showPanel" class="wc-panel">
      <div class="wc-panel-tabs">
        <div :class="['wc-panel-tab-item', tabName === 'log' && 'wc-panel-tab-item-active']" @click="tabName = 'log'">
          <text>log</text>
        </div>
        <div
          :class="['wc-panel-tab-item', tabName === 'storage' && 'wc-panel-tab-item-active']"
          @click="tabName = 'storage'"
        >
          <text>storage</text>
        </div>
        <div
          :class="['wc-panel-tab-item', tabName === 'WXEnvironment' && 'wc-panel-tab-item-active']"
          @click="tabName = 'WXEnvironment'"
        >
          <text style="font-size: 22px">WXEnvironment</text>
        </div>
        <div v-if="hasBridgeModule" class="wc-panel-tab-item" @click="reload">
          <text>refresh</text>
        </div>
      </div>

      <scroller class="wc-panel-body">
        <div
          v-for="(log, index) in tabType[tabName]"
          :key="log + index"
          class="wc-panel-body-item"
          @longpress="copyLog(log)"
        >
          <text style="font-size: 26px">{{ log }}</text>
        </div>
      </scroller>

      <div class="wc-footer">
        <div v-if="['log', 'storage'].includes(tabName)" class="wc-footer-item" @click="handleClear">
          <text>Clear-{{ tabName }}</text>
        </div>
        <div class="wc-footer-item" @click="showPanel = false"><text>Hide</text></div>
      </div>
    </div>
  </div>
</template>

<script>
import { Bridge } from 'dolphin-native-bridge'
const storage = weex.requireModule('storage')
const modal = weex.requireModule('modal')
const clipboard = weex.requireModule('clipboard')

const tabType = {
  // Vue.observable
  log: [],
  storage: [],
  WXEnvironment: ['Vue.version：' + Vue.version, { ...WXEnvironment }],
}

export default {
  name: 'weex-console',

  props: {
    initialTop: [String, Number],
    initialLeft: [String, Number],
  },

  data() {
    return {
      hasBridgeModule: weex.isRegisteredModule('bridgeModule'),
      tabName: 'log',
      top: 0,
      left: 0,
      maxTop: 0,
      maxLeft: 0,
      showPanel: false,
      tabType,
    }
  },

  computed: {
    computedTop() {
      if (this.top <= 80) {
        return 80
      } else {
        return ~~Math.min(this.top, this.maxTop)
      }
    },
    computedLeft() {
      if (this.left <= 0) {
        return 0
      } else {
        return ~~Math.min(this.left, this.maxLeft)
      }
    },
  },

  watch: {
    tabName(newTab) {
      const act = {
        storage: () => {
          this.tabType.storage = []
          this.getAllStorages().then(res => {
            this.tabType.storage.push(Object.keys(res))
            this.tabType.storage.push(res)
          })
        },
      }

      act[newTab] && act[newTab]()
    },
  },

  mounted() {
    this.getConsoleWH()
  },

  methods: {
    getConsoleWH() {
      return new Promise(resolve => {
        const dom = weex.requireModule('dom')
        const main = () =>
          dom.getComponentRect(this.$refs['weex-console'], ({ size: { width, height } }) => {
            if (!width || !height) {
              main()
              return
            }
            this.consoleWidth = width
            this.consoleHeight = height
            this.maxTop = WXEnvironment.deviceHeight - height
            this.maxLeft = 750 - width
            this.top = typeof this.initialTop === 'undefined' ? 150 : +this.initialTop
            this.left = typeof this.initialLeft === 'undefined' ? 150 : +this.initialLeft
            resolve({ width, height })
          })
        main()
      })
    },

    panstart({ changedTouches: [{ pageX, pageY }] }) {
      this.pageX = pageX
      this.pageY = pageY
    },

    panmove({ changedTouches: [{ screenX, screenY }] }) {
      if (!this.isIos) {
        this.top = screenY - this.pageY
        this.left = screenX - this.pageX
      } else {
        // ios 的 pageXY 跟 screenXY 一样，知呢如下折中处理
        this.top = screenY - this.consoleHeight / 2
        this.left = screenX - this.consoleWidth / 2
      }
    },

    handleClear() {
      if (this.tabName === 'log') {
        this.tabType.log = []
      } else if (this.tabName === 'storage') {
        modal.confirm(
          {
            message: '删除全部缓存',
            okTitle: '确认',
            cancelTitle: '删除',
          },
          value => {
            value === '确认' &&
              this.removeAllStorages()
                .then(() => {
                  this.getAllStorages().then(res => {
                    this.tabType.storage.push(Object.keys(res))
                    this.tabType.storage.push(res)
                  })
                  modal.toast({ message: '删除成功' })
                })
                .catch(e => modal.toast({ message: e.toString() }))
          }
        )
      }
    },

    closePanel() {
      if (!this.showPanel) return
      this.showPanel = false
    },

    addLog(logArr) {
      tabType.log.push(
        logArr.reduce((acc, item = 'undefined') => {
          const objType = Object.prototype.toString.call(item)
          acc +=
            (['[object Array]', '[object Object]'].includes(objType)
              ? JSON.stringify(item, null, 2)
              : item.toString()) + '  '
          return acc
        }, '')
      )
    },

    getAllStorages() {
      // 优化点，当操作了 storage 时才重新读
      const getItemPromies = []
      const storageObj = {}
      return new Promise((resolveA, rejectA) =>
        storage.getAllKeys(({ data: storageKeys, result }) => {
          if (result !== 'success') {
            rejectA('storage.getAllKeys error')
          }

          storageKeys.forEach(key =>
            getItemPromies.push(
              new Promise((resolveB, rejectB) =>
                storage.getItem(key, event => {
                  if (event.result !== 'success') {
                    rejectB(`storage.getItem('${key}') error`)
                    return
                  }

                  let data = null
                  try {
                    data = JSON.parse(event.data)
                  } catch {
                    data = event.data
                  }

                  storageObj[key] = data
                  resolveB({ key, data })
                })
              )
            )
          )

          Promise.all(getItemPromies)
            .then(() => resolveA(storageObj))
            .catch(e => rejectA(e))
        })
      )
    },

    removeAllStorages() {
      const removeItemPromies = []
      return new Promise((resolveA, rejectA) =>
        storage.getAllKeys(({ data: storageKeys, result }) => {
          if (result !== 'success') {
            rejectA('storage.getAllKeys error')
          }

          storageKeys.forEach(key =>
            removeItemPromies.push(
              new Promise((resolveB, rejectB) =>
                storage.removeItem(key, event => {
                  event.result !== 'success' ? rejectB(`storage.removeItem('${key}') error`) : resolveB()
                })
              )
            )
          )

          Promise.all(removeItemPromies)
            .then(() => resolveA())
            .catch(e => rejectA(e))
        })
      )
    },

    copyLog(log) {
      clipboard.setString(log)
      modal.toast({ message: '已复制' })
    },

    reload() {
      Bridge.reload()
    },
  },
}
</script>

<style>
.wc-wrapper {
  position: fixed;
  width: 0;
  height: 0;
  top: 0;
  left: 0;
  /* bottom: 0;
  right: 0; */
}
.wc-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  height: 1000px;
}

.wc-btn {
  position: fixed;
  background-color: #4f7691;
  padding: 20px 30px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-size: 33px;
}

.wc-panel-tabs {
  justify-content: center;
  flex-direction: row;
  background-color: #ededed;
  height: 82px;
}
.wc-panel-tab-item {
  flex: 1;
  align-items: center;
  justify-content: center;
  /* border: 2ox solid rgba(0, 0, 0, 0.1); 不支持，只能一个个设置 */
  border-top-width: 2px;
  border-bottom-width: 2px;
  border-right-width: 2px;
  border-top-style: solid;
  border-bottom-style: solid;
  border-right-style: solid;
  border-top-color: rgba(0, 0, 0, 0.1);
  border-bottom-color: rgba(0, 0, 0, 0.1);
  border-right-color: rgba(0, 0, 0, 0.1);
}
/* .wc-panel-tab-item.active, wc-panel-tab-item。active */
.wc-panel-tab-item:active {
  background-color: #f7f7f7;
}
.wc-panel-tab-item-active {
  background-color: #f7f7f7;
}

.wc-panel-body {
  padding-bottom: 78px;
}
.wc-panel-body-item {
  padding: 8px 12px;
  border-bottom-width: 2px;
  border-bottom-style: solid;
  border-bottom-color: rgba(0, 0, 0, 0.1);
}
.wc-panel-body-item:active {
  background-color: #f7f7f7;
}

.wc-footer {
  flex-direction: row;
  justify-content: center;
  height: 78px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ededed;
  border-top-width: 2px;
  border-top-style: solid;
  border-top-color: rgba(0, 0, 0, 0.1);
  border-bottom-width: 2px;
  border-bottom-style: solid;
  border-bottom-color: rgba(0, 0, 0, 0.1);
}
.wc-footer-item {
  flex: 1;
  align-items: center;
  justify-content: center;
  border-right-width: 2px;
  border-right-style: solid;
  border-right-color: rgba(0, 0, 0, 0.1);
}
.wc-footer-item:active {
  background-color: #f7f7f7;
}
</style>
