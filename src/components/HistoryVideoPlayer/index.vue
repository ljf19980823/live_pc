<template>
  <div class="hrp-mask" v-if="visible" @click.self="handleClose">
    <div class="hrp-box">
      <!-- 标题栏 -->
      <div class="hrp-header">
        <div class="hrp-title">{{ title || '历史课堂回放' }}</div>
        <img
          src="@/assets/images/login/close.png"
          class="hrp-close"
          alt="关闭"
          @click="handleClose"
        />
      </div>

      <!-- 双视频区域 -->
      <div class="hrp-body" ref="videoArea">
        <!-- 主视频（课堂内容） -->
        <div v-if="mainError" class="hrp-main-error">
          <span class="hrp-error-text">主视频加载失败，请稍后重试</span>
        </div>
        <template v-else>
          <div :id="mainPlayerId" class="hrp-main-player"></div>
          <transition name="hrp-loading-fade">
            <div v-if="mainLoading" class="hrp-main-loading">
              <div class="hrp-spinner"></div>
              <span class="hrp-loading-text">视频加载中...</span>
            </div>
          </transition>
        </template>

        <!-- 讲师画中画（右上角固定，仅显示，不可操作，不可拖拽） -->
        <transition name="hrp-pip-fade">
          <div
            v-if="teacherSource"
            ref="pip"
            class="hrp-pip"
            :class="{ 'hrp-pip--fullscreen': isFullscreen }"
          >
            <!-- 全覆盖遮挡层：屏蔽所有鼠标事件 -->
            <div class="hrp-pip-guard"></div>

            <div v-if="teacherError" class="hrp-pip-error">
              <span>讲师视频暂不可用</span>
            </div>
            <div v-else :id="teacherPlayerId" class="hrp-pip-player"></div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * HistoryVideoPlayer — 历史课堂双视频画中画回放组件
 *
 * 实现直播回放效果：主画面（课堂内容）+ 讲师画中画（右上角），
 * 以主视频时间轴为基准，同步控制讲师视频的播放、暂停、进度，
 * 并内置周期性漂移修正，确保双流时间精准对齐。
 *
 * 用法示例：
 *   <HistoryVideoPlayer
 *     :visible="visible"
 *     :main-source="mainVideoUrl"
 *     :teacher-source="teacherVideoUrl"
 *     title="2024-01-01 数学课回放"
 *     @close="visible = false"
 *   />
 *
 * Props：
 *   visible         {Boolean}  是否显示弹窗
 *   mainSource      {String}   主视频地址（必填）
 *   teacherSource   {String}   讲师视频地址（选填，缺省时仅显示主视频）
 *   title           {String}   弹窗标题
 *
 * Events：
 *   close  关闭弹窗时触发
 */
import Aliplayer from 'aliyun-aliplayer'
import 'aliyun-aliplayer/build/skins/default/aliplayer-min.css'

const ALIPLAYER_LICENSE = {
  domain: 'fjlsjy123.com',
  key: 'xPQXSZn3Mq45H2eLW125d9c8910914548b973ab781f1bd6f7'
}

/** 每个组件实例生成唯一的播放器容器 id，避免多实例冲突 */
let idCounter = 0

/** 进度漂移修正阈值（秒）：双流时间差超过该值时强制同步 */
const DRIFT_THRESHOLD = 1.5

export default {
  name: 'HistoryVideoPlayer',

  props: {
    /** 是否显示播放弹窗 */
    visible: {
      type: Boolean,
      default: false
    },
    /** 主视频播放地址（课堂屏幕内容） */
    mainSource: {
      type: String,
      default: ''
    },
    /** 讲师摄像头视频地址（选填，不传或传空则不显示画中画） */
    teacherSource: {
      type: String,
      default: ''
    },
    /** 弹窗标题 */
    title: {
      type: String,
      default: ''
    }
  },

  data() {
    const uid = ++idCounter
    return {
      mainPlayerId: `hrp-main-${uid}`,
      teacherPlayerId: `hrp-teacher-${uid}`,
      mainPlayer: null,
      teacherPlayer: null,
      mainError: false,
      mainLoading: false,
      teacherError: false,
      syncTimer: null,
      isSyncing: false,
      isFullscreen: false,
      _onFsChange: null
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.$nextTick(() => this.initPlayers())
      } else {
        this.destroyPlayers()
      }
    },
    mainSource(val) {
      if (this.visible && val) {
        this.$nextTick(() => this.initPlayers())
      }
    }
  },

  methods: {
    // ─────────────── 播放器初始化 ───────────────

    initPlayers() {
      this.mainError = false
      this.mainLoading = true
      this.teacherError = false

      if (!this.mainSource) {
        this.mainError = true
        this.mainLoading = false
        return
      }

      this.$nextTick(() => {
        const mountEl = document.getElementById(this.mainPlayerId)
        if (!mountEl) {
          this.mainError = true
          this.mainLoading = false
          return
        }

        this.destroyPlayers()

        const baseConfig = {
          width: '100%',
          height: '100%',
          autoplay: true,
          rePlay: false,
          playsinline: true,
          preload: true,
          useH5Prism: true,
          license: ALIPLAYER_LICENSE
        }

        try {
          this.mainPlayer = new Aliplayer(
            { ...baseConfig, id: this.mainPlayerId, source: this.mainSource, controlBarVisibility: 'hover' },
            (mainPlayer) => {
              this.mainPlayer = mainPlayer
              this.mainLoading = false
              this.setupSync(mainPlayer)
              if (this.teacherSource) {
                this.initTeacherPlayer(baseConfig, mainPlayer)
              }
            }
          )
          this.mainPlayer.on('error', () => {
            this.mainError = true
            this.mainLoading = false
          })
        } catch (e) {
          console.error('[HRP] 主视频初始化失败:', e)
          this.mainError = true
          this.mainLoading = false
        }
      })
    },

    initTeacherPlayer(baseConfig, mainPlayer) {
      const teacherMountEl = document.getElementById(this.teacherPlayerId)
      if (!teacherMountEl) {
        this.teacherError = true
        return
      }

      try {
        this.teacherPlayer = new Aliplayer(
          { ...baseConfig, id: this.teacherPlayerId, source: this.teacherSource, controlBarVisibility: 'never', muted: true },
          (tp) => {
            this.teacherPlayer = tp
            try { tp.setVolume(0) } catch (e) {}
          }
        )
        this.teacherPlayer.on('error', () => {
          this.teacherError = true
        })
      } catch (e) {
        console.error('[HRP] 讲师视频初始化失败:', e)
        this.teacherError = true
      }
    },

    // ─────────────── 同步逻辑 ───────────────

    // mainPlayer 通过参数传入，确保不受同步回调时序影响
    setupSync(mainPlayer) {
      if (!mainPlayer) return

      // ── Aliplayer 文档事件 ──
      mainPlayer.on('pause', () => {
        if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
      })
      mainPlayer.on('play', () => {
        if (this.teacherPlayer && !this.isSyncing) this.safePlay(this.teacherPlayer)
      })
      mainPlayer.on('ended', () => {
        if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
      })
      // 倍速同步（Aliplayer settingSelected 事件，type==='speed' 时同步）
      mainPlayer.on('settingSelected', (e) => {
        if (!this.teacherPlayer) return
        const data = e && e.paramData
        if (data && data.type === 'speed' && data.key) {
          try { this.teacherPlayer.setSpeed(data.key) } catch (err) {}
        }
      })

      // completeSeek：文档说参数返回拖拽目标时间，存放在 e.paramData
      mainPlayer.on('completeSeek', (e) => {
        if (!this.teacherPlayer) return
        const t = (e && e.paramData !== undefined) ? e.paramData : mainPlayer.getCurrentTime()
        this.isSyncing = true
        try { this.teacherPlayer.seek(t) } catch (err) {}
        setTimeout(() => { this.isSyncing = false }, 1000)
      })

      // ── 原生 <video> 事件（双保险，100% 可靠）──
      const attachVideoEvents = (attempt) => {
        if (attempt > 40) return
        const container = document.getElementById(this.mainPlayerId)
        const videoEl = container && container.querySelector('video')
        if (!videoEl) {
          setTimeout(() => attachVideoEvents(attempt + 1), 100)
          return
        }
        this._mainVideoEl = videoEl

        const onPlay = () => {
          if (this.teacherPlayer && !this.isSyncing) this.safePlay(this.teacherPlayer)
        }
        const onPause = () => {
          if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
        }
        const onSeeked = () => {
          if (!this.teacherPlayer || this.isSyncing) return
          this.isSyncing = true
          try { this.teacherPlayer.seek(videoEl.currentTime) } catch (e) {}
          setTimeout(() => { this.isSyncing = false }, 1000)
        }
        const onEnded = () => {
          if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
        }
        const onRateChange = () => {
          if (this.teacherPlayer) {
            try { this.teacherPlayer.setSpeed(videoEl.playbackRate) } catch (e) {}
          }
        }

        videoEl.addEventListener('play', onPlay)
        videoEl.addEventListener('pause', onPause)
        videoEl.addEventListener('seeked', onSeeked)
        videoEl.addEventListener('ended', onEnded)
        videoEl.addEventListener('ratechange', onRateChange)
        this._removeVideoListeners = () => {
          videoEl.removeEventListener('play', onPlay)
          videoEl.removeEventListener('pause', onPause)
          videoEl.removeEventListener('seeked', onSeeked)
          videoEl.removeEventListener('ended', onEnded)
          videoEl.removeEventListener('ratechange', onRateChange)
        }
      }
      attachVideoEvents(0)

      // ── 全屏 ──
      this._onFsChange = () => {
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement
        if (fsEl) this.enterFullscreen(fsEl)
        else this.exitFullscreen()
      }
      document.addEventListener('fullscreenchange', this._onFsChange)
      document.addEventListener('webkitfullscreenchange', this._onFsChange)

      // ── 漂移修正 ──
      this.syncTimer = setInterval(() => {
        if (!this.teacherPlayer || this.isSyncing || !this._mainVideoEl) return
        try {
          const diff = Math.abs(this._mainVideoEl.currentTime - this.teacherPlayer.getCurrentTime())
          if (diff > DRIFT_THRESHOLD) {
            this.isSyncing = true
            this.teacherPlayer.seek(this._mainVideoEl.currentTime)
            setTimeout(() => { this.isSyncing = false }, 1000)
          }
        } catch (e) {}
      }, 1000)
    },

    enterFullscreen(fsEl) {
      const pipEl = this.$refs.pip
      if (fsEl && pipEl && pipEl.parentNode !== fsEl) {
        fsEl.appendChild(pipEl)
      }
      this.isFullscreen = true
    },

    exitFullscreen() {
      const bodyEl = this.$refs.videoArea
      const pipEl = this.$refs.pip
      if (bodyEl && pipEl && pipEl.parentNode !== bodyEl) {
        bodyEl.appendChild(pipEl)
      }
      this.isFullscreen = false
    },

    safePlay(player) {
      if (!player) return
      try { player.play() } catch (e) {}
    },

    // ─────────────── 销毁 ───────────────

    destroyPlayers() {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      this.mainLoading = false

      if (this._removeVideoListeners) {
        this._removeVideoListeners()
        this._removeVideoListeners = null
      }
      this._mainVideoEl = null

      if (this._onFsChange) {
        document.removeEventListener('fullscreenchange', this._onFsChange)
        document.removeEventListener('webkitfullscreenchange', this._onFsChange)
        this._onFsChange = null
      }

      this.exitFullscreen()

      const destroy = (player, id) => {
        if (player) {
          try { player.dispose() } catch (e) {}
        }
        const el = document.getElementById(id)
        if (el) el.innerHTML = ''
      }

      destroy(this.mainPlayer, this.mainPlayerId)
      destroy(this.teacherPlayer, this.teacherPlayerId)
      this.mainPlayer = null
      this.teacherPlayer = null
    },

    handleClose() {
      this.$emit('close')
    }
  },

  beforeDestroy() {
    this.destroyPlayers()
  }
}
</script>

<style lang="scss" scoped>
/* ─── 遮罩层 ─── */
.hrp-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── 弹窗主体 ─── */
.hrp-box {
  /* 宽度最多 90vw，但受高度约束不超过 16:9 × (90vh - 标题高度) */
  width: 90vw;
  max-width: calc((90vh - 48px) * 16 / 9);
  background: #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
}

/* ─── 标题栏 ─── */
.hrp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
}

.hrp-title {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hrp-close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 16px;
  opacity: 0.8;
  filter: brightness(10);

  &:hover {
    opacity: 1;
  }
}

/* ─── 视频区域 ─── */
.hrp-body {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  overflow: hidden;
}

.hrp-main-player {
  width: 100%;
  height: 100%;
}

.hrp-main-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hrp-error-text {
  font-size: 14px;
  color: #999;
}

/* ─── 主视频 Loading ─── */
.hrp-main-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10;
  gap: 14px;
  pointer-events: none;
}

.hrp-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #fff;
  border-radius: 50%;
  animation: hrp-spin 0.8s linear infinite;
}

@keyframes hrp-spin {
  to { transform: rotate(360deg); }
}

.hrp-loading-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}

.hrp-loading-fade-enter-active,
.hrp-loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.hrp-loading-fade-enter,
.hrp-loading-fade-leave-to {
  opacity: 0;
}

/* ─── 讲师画中画（固定右上角，不可拖拽） ─── */
.hrp-pip {
  position: absolute;
  right: 0;
  top: 0;
  width: 240px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.18);
  cursor: default;
  user-select: none;
  z-index: 9999;

  /* 全屏时稍微放大 */
  &.hrp-pip--fullscreen {
    width: 300px;
  }
}

/* 全覆盖遮挡层：屏蔽所有鼠标事件，使讲师窗口完全不可交互 */
.hrp-pip-guard {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: default;
  pointer-events: all;
}

.hrp-pip-player {
  width: 100%;
  aspect-ratio: 16 / 9;

  /* 隐藏 Aliplayer 注入的播放图标、加载转圈、错误提示 */
  ::v-deep .prism-big-play-btn,
  ::v-deep .prism-play-btn,
  ::v-deep .prism-spinner,
  ::v-deep .prism-loading,
  ::v-deep .prism-waiting,
  ::v-deep .prism-ErrorMessage {
    display: none !important;
  }
}

.hrp-pip-error {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  font-size: 12px;
  color: #666;
}

/* ─── PiP 出现/消失动画 ─── */
.hrp-pip-fade-enter-active,
.hrp-pip-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.hrp-pip-fade-enter,
.hrp-pip-fade-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
