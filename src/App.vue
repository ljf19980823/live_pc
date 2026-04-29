<template>
  <div id="app">
    <keep-alive include="DefaultLayout">
      <router-view />
    </keep-alive>

    <!-- 防录屏 / 防虚拟机遮罩层 -->
    <transition name="screen-guard-fade">
      <div v-if="screenGuard.detected" class="screen-guard-overlay">
        <div class="screen-guard-content">
          <span class="screen-guard-icon">!</span>
          <span class="screen-guard-text">{{ screenGuard.message }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      screenGuard: {
        detected: false,
        isRecording: false,
        isVM: false,
        message: ''
      }
    }
  },
  mounted () {
    this.initScreenGuard()
  },
  beforeDestroy () {
    if (this._screenGuardCleanup) {
      this._screenGuardCleanup()
    }
  },
  methods: {
    initScreenGuard () {
      if (!window.electronAPI) return

      this._screenGuardCleanup = window.electronAPI.onScreenGuardChange((data) => {
        this.screenGuard.detected = data.detected
        this.screenGuard.isRecording = data.isRecording
        this.screenGuard.isVM = data.isVM

        if (data.isRecording) {
          this.screenGuard.message = '监测到您正在录制屏幕，关闭录屏后继续观看'
        } else if (data.isVM) {
          this.screenGuard.message = '监测到您正在使用虚拟机，请在真实设备上使用本软件'
        } else {
          this.screenGuard.message = ''
        }
      })
    }
  }
}
</script>

<style>
/* 遮罩层铺满整个窗口 */
.screen-guard-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-guard-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 感叹号图标圆圈 */
.screen-guard-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5a623;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1;
}

.screen-guard-text {
  color: #ffffff;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* 淡入淡出动画 */
.screen-guard-fade-enter-active,
.screen-guard-fade-leave-active {
  transition: opacity 0.3s ease;
}
.screen-guard-fade-enter,
.screen-guard-fade-leave-to {
  opacity: 0;
}
</style>
