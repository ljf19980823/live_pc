<template>
  <div class="live-classroom-frame">
    <iframe
      v-if="currentSrc"
      ref="frame"
      :src="currentSrc"
      class="live-classroom-frame__iframe"
      frameborder="0"
      allowfullscreen
      allow="camera;microphone;autoplay;display-capture;unload;"
      allowusermedia
      @load="handleFrameLoad"
    />

    <div v-if="status !== 'ready'" class="live-classroom-frame__mask">
      <template v-if="status === 'loading'">
        <span class="live-classroom-frame__spinner" />
        <h2>{{ loadingTitle }}</h2>
        <p>{{ loadingDescription }}</p>
        <span v-if="!online" class="live-classroom-frame__offline">
          当前网络已断开，正在等待网络恢复
        </span>
      </template>

      <template v-else>
        <i class="el-icon-warning-outline live-classroom-frame__warning" />
        <h2>直播课堂暂时未加载成功</h2>
        <p>{{ errorMessage }}</p>
        <div class="live-classroom-frame__actions">
          <el-button icon="el-icon-back" @click="$emit('exit')">
            返回
          </el-button>
          <el-button
            type="primary"
            icon="el-icon-refresh"
            :disabled="!online"
            @click="retry"
          >
            重新加载
          </el-button>
        </div>
        <span v-if="!online" class="live-classroom-frame__offline">
          当前网络未连接，请恢复网络后重试
        </span>
      </template>
    </div>
  </div>
</template>

<script>
const ResourceLoadTimeout = 30 * 1000
const ClassroomReadyTimeout = 90 * 1000

export default {
  name: 'LiveClassroomFrame',
  props: {
    src: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      currentSrc: '',
      status: 'loading',
      documentLoaded: false,
      bootstrapped: false,
      online: navigator.onLine,
      errorMessage: '当前网络可能不稳定，请检查网络后重试。',
      loadTimer: null,
      removeIframeLoadFailedListener: null
    }
  },
  computed: {
    loadingTitle() {
      return this.bootstrapped ? '正在连接课堂服务…' : '正在进入直播课堂…'
    },
    loadingDescription() {
      return this.documentLoaded
        ? '课堂资源正在加载，请稍候'
        : '正在检查网络并加载课堂资源'
    }
  },
  watch: {
    src: {
      immediate: true,
      handler(value) {
        if (!value) return
        this.currentSrc = value
        this.beginLoading(ResourceLoadTimeout)
      }
    }
  },
  mounted() {
    window.addEventListener('message', this.handleMessage)
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    if (window.electronAPI?.onIframeLoadFailed) {
      this.removeIframeLoadFailedListener = window.electronAPI.onIframeLoadFailed(
        data => {
          if (this.status === 'ready') return
          try {
            if (new URL(data?.url).origin !== new URL(this.currentSrc).origin) return
          } catch (_) {
            return
          }
          this.fail(
            data?.description
              ? `课堂页面加载失败：${data.description}`
              : '课堂页面未能加载，请检查网络后重试。'
          )
        }
      )
    }
  },
  beforeDestroy() {
    this.clearLoadTimer()
    window.removeEventListener('message', this.handleMessage)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    if (typeof this.removeIframeLoadFailedListener === 'function') {
      this.removeIframeLoadFailedListener()
    }
  },
  methods: {
    beginLoading(timeout) {
      this.clearLoadTimer()
      this.status = 'loading'
      this.documentLoaded = false
      this.bootstrapped = false
      this.errorMessage = '当前网络可能不稳定，请检查网络后重试。'
      this.loadTimer = window.setTimeout(() => {
        this.fail(
          this.bootstrapped
            ? '课堂服务连接超时，请检查网络后重试。'
            : '课堂资源加载超时，请检查网络后重试。'
        )
      }, timeout)
    },
    clearLoadTimer() {
      if (this.loadTimer) {
        window.clearTimeout(this.loadTimer)
        this.loadTimer = null
      }
    },
    handleFrameLoad() {
      this.documentLoaded = true
    },
    handleMessage(event) {
      const frame = this.$refs.frame
      if (!frame || event.source !== frame.contentWindow) return

      try {
        const expectedOrigin = new URL(this.currentSrc).origin
        if (event.origin !== expectedOrigin) return
      } catch (_) {
        return
      }

      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === 'CLASSROOM_BOOTSTRAP') {
        this.bootstrapped = true
        this.clearLoadTimer()
        this.loadTimer = window.setTimeout(
          () => this.fail('课堂服务连接超时，请检查网络后重试。'),
          ClassroomReadyTimeout
        )
      } else if (data.type === 'CLASSROOM_READY') {
        this.clearLoadTimer()
        this.status = 'ready'
        this.$emit('ready', data)
      } else if (
        data.type === 'CLASSROOM_ERROR' ||
        data.type === 'CLASSROOM_FATAL'
      ) {
        this.fail(data.message || '课堂初始化失败，请检查网络后重试。')
        this.$emit('error', data)
      }
    },
    handleOnline() {
      this.online = true
    },
    handleOffline() {
      this.online = false
    },
    fail(message) {
      this.clearLoadTimer()
      this.status = 'error'
      this.errorMessage = message
    },
    retry() {
      if (!this.online) return
      try {
        const url = new URL(this.src)
        url.searchParams.set('_retry', Date.now().toString())
        this.currentSrc = url.toString()
      } catch (_) {
        const separator = this.src.includes('?') ? '&' : '?'
        this.currentSrc = `${this.src}${separator}_retry=${Date.now()}`
      }
      this.beginLoading(ResourceLoadTimeout)
    }
  }
}
</script>

<style lang="scss" scoped>
.live-classroom-frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  background: #1E1E1E;
}

.live-classroom-frame__iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #1E1E1E;
}

.live-classroom-frame__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #F4F5F7;
  background: #1E1E1E;
  text-align: center;

  h2 {
    margin: 18px 0 0;
    color: #FFF;
    font-size: 22px;
    line-height: 1.4;
  }

  p {
    max-width: 520px;
    margin: 12px 0 26px;
    color: #B8BCC5;
    font-size: 14px;
    line-height: 1.7;
  }
}

.live-classroom-frame__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top-color: #1677FF;
  border-radius: 50%;
  animation: classroom-frame-spin 0.8s linear infinite;
}

.live-classroom-frame__warning {
  color: #FFB020;
  font-size: 44px;
}

.live-classroom-frame__actions {
  display: flex;
  gap: 12px;
}

.live-classroom-frame__offline {
  margin-top: 18px;
  color: #FF7875;
  font-size: 13px;
}

@keyframes classroom-frame-spin {
  to { transform: rotate(360deg); }
}
</style>
