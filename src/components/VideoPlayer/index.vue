<template>
  <div class="video-player-mask" v-if="visible" @click.self="handleClose" :class="{ 'vp-no-speed': isStudent && allowMultiple === '2' }">
    <div class="video-player-box">
      <div class="video-player-header">
        <div class="video-player-title">{{ title || '视频播放' }}</div>
        <button
          v-if="isStudent && fromTask"
          class="video-player-collect"
          :class="{ 'video-player-collect--active': isCollected }"
          :disabled="collecting"
          @click="handleCollect"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" :fill="isCollected ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {{ isCollected ? '已收藏' : '收藏' }}
        </button>
        <button
          v-if="allowDownload === '1'"
          class="video-player-download"
          @click="handleDownload"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v13M7 11l5 5 5-5"/>
            <path d="M4 20h16"/>
          </svg>
          下载
        </button>
        <img
          src="@/assets/images/login/close.png"
          class="video-player-close"
          alt="关闭"
          @click="handleClose"
        >
      </div>
      <div class="video-player-body">
        <div v-if="initError" class="video-player-error">
          <div class="video-player-error-text">视频加载失败，请稍后重试</div>
        </div>
        <div v-else :id="playerId" class="video-player-container"></div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * VideoPlayer — 阿里云视频播放器组件
 *
 * 基于 aliyun-aliplayer SDK 实现，支持 URL 直接播放点播视频，
 * 以弹窗形式展示，关闭时自动销毁播放器实例，适合在各业务模块中复用。
 *
 * 使用示例：
 *   <VideoPlayer
 *     :visible="playerVisible"
 *     :source="'https://example.com/video.mp4'"
 *     title="课程回放"
 *     @close="playerVisible = false"
 *   />
 *
 * Props：
 *   visible  {Boolean}  是否显示播放弹窗
 *   source   {String}   视频播放地址（点播 URL）
 *   title    {String}   弹窗标题，默认 '视频播放'
 *
 * Events：
 *   close    关闭弹窗时触发，父组件需将 visible 置为 false
 */
import Aliplayer from 'aliyun-aliplayer'
import 'aliyun-aliplayer/build/skins/default/aliplayer-min.css'
import { getUserInfo } from '@/utils/auth'
import { rememberVideoPlayback } from '@/utils/videoPlaybackMemory'
import { attachAliplayerControls } from '@/utils/aliplayerControls'
import { attachVideoPlayerControlSkin } from '@/utils/videoPlayerControlSkin'
import { ALIPLAYER_SPEED_LEVELS } from '@/utils/aliplayerConfig'
import { isResourceUrlExpiring } from '@/utils/resource'
import { collectToggle } from '@/api'

/** 阿里云播放器 License 配置 */
const ALIPLAYER_LICENSE = {
  domain: 'fjlsjy123.com',   // 申请 License 时填写的域名
  key: 'xPQXSZn3Mq45H2eLW125d9c8910914548b973ab781f1bd6f7'       // 阿里云控制台获取的 License Key
}

/** 用于生成唯一的播放器容器 id，避免同页面多实例冲突 */
let playerIdCounter = 0

export default {
  name: 'VideoPlayer',

  props: {
    /**
     * 是否显示播放弹窗
     * @type {Boolean}
     * @default false
     */
    visible: {
      type: Boolean,
      default: false
    },

    /**
     * 视频播放地址
     * 可以是第三方点播地址，或阿里云点播服务中的播放地址
     * @type {String}
     * @default ''
     */
    source: {
      type: String,
      default: ''
    },

    /** OSS signed URL expiry in Unix milliseconds. */
    sourceExpireAt: {
      type: [String, Number],
      default: null
    },

    /** Re-fetch the owning business record and return its refreshed URL fields. */
    refreshSource: {
      type: Function,
      default: null
    },

    /**
     * 弹窗标题，显示在播放器顶部
     * @type {String}
     * @default '视频播放'
     */
    title: {
      type: String,
      default: '视频播放'
    },

    /**
     * 是否允许倍速播放：1 允许，2 不允许
     * @type {String}
     * @default '2'
     */
    allowMultiple: {
      type: String,
      default: '1'
    },

    /**
     * 是否允许快进：'1' 允许，'2' 不允许
     * @type {String}
     * @default '1'
     */
    allowFastForward: {
      type: String,
      default: '1'
    },

    /**
     * 是否允许下载：'1' 允许，'2' 不允许
     * @type {String}
     * @default '2'
     */
    allowDownload: {
      type: String,
      default: '2'
    },

    /**
     * 是否从"学习任务"入口打开，true 时才对学生显示收藏按钮
     * @type {Boolean}
     * @default false
     */
    fromTask: {
      type: Boolean,
      default: false
    },

    /**
     * 收藏接口所需参数 { courseId, lessonId, historyLessonId?, type }
     * @type {Object}
     * @default {}
     */
    collectParams: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    const userInfo = getUserInfo() || {}
    return {
      /** 当前用户是否为学生角色，权限限制仅对学生生效 */
      isStudent: userInfo.role === 'STUDENT',
      /** 是否初始化失败（source 为空或播放器创建异常时为 true） */
      initError: false,
      /** Aliplayer 播放器实例 */
      playerInstance: null,
      /** 播放器挂载的 DOM 容器 id，每个组件实例唯一 */
      playerId: `aliplayer-${++playerIdCounter}`,
      runtimeSource: this.source,
      runtimeExpireAt: this.sourceExpireAt,
      sourceRefreshAttempted: false,
      mediaErrorReported: false,
      initGeneration: 0,
      sourceRefreshPromise: null,
      /** 是否已收藏 */
      isCollected: false,
      /** 收藏请求进行中 */
      collecting: false
    }
  },

  watch: {
    /**
     * 监听 visible 变化：
     *   true  → 等待 DOM 更新后初始化播放器
     *   false → 立即销毁播放器，释放资源
     */
    visible(val) {
      if (val) {
        this.setScreenGuard(true)
        this.isCollected = Number(this.collectParams.collectCount || 0) === 1
        this.$nextTick(() => {
          this.initPlayer()
        })
      } else {
        this.initGeneration++
        this.setScreenGuard(false)
        this.destroyPlayer()
      }
    },

    /** source 变更时（弹窗已打开状态）重新初始化播放器 */
    source(val) {
      this.runtimeSource = val
      this.runtimeExpireAt = this.sourceExpireAt
      this.sourceRefreshAttempted = false
      if (this.visible && val) {
        this.$nextTick(() => {
          this.initPlayer()
        })
      }
    },

    sourceExpireAt(val) {
      this.runtimeExpireAt = val
    }
  },
  methods: {
    setScreenGuard(enabled) {
      if (window.electronAPI?.setScreenGuard) {
        window.electronAPI.setScreenGuard(enabled, { allowScreenshots: enabled })
      }
    },

    /**
     * 初始化阿里云播放器：
     * 1. 校验 source 是否有效
     * 2. 销毁已有实例，防止重复创建
     * 3. 创建新的 Aliplayer 实例并绑定到容器
     */
    async initPlayer(restoreState = null) {
      const generation = ++this.initGeneration
      this.initError = false
      this.mediaErrorReported = false

      if (!this.runtimeSource) {
        this.initError = true
        return
      }

      this.destroyPlayer()

      if (this.refreshSource && isResourceUrlExpiring(this.runtimeExpireAt)) {
        try {
          await this.refreshCurrentSource()
        } catch (e) {
          if (generation === this.initGeneration) {
            this.initError = true
            this.$message.error('视频访问地址刷新失败，请重新打开')
          }
          return
        }
        if (generation !== this.initGeneration) return
      }

      try {
        const config = {
          id: this.playerId,
          source: this.runtimeSource,
          width: '100%',
          height: '100%',
          autoplay: true,
          rePlay: false,
          playsinline: true,
          preload: true,
          controlBarVisibility: 'hover',
          useH5Prism: true,
          keyShortCuts: false,
          speedLevels: ALIPLAYER_SPEED_LEVELS,
          disableSeek: this.isStudent && this.allowFastForward === '2',
          license: ALIPLAYER_LICENSE
        }

        this.playerInstance = new Aliplayer(config, player => {
          if (generation !== this.initGeneration) return
          this._playerControls = attachAliplayerControls(player, {
            container: document.getElementById(this.playerId),
            isActive: () => this.visible && !this.initError,
            // 按钮和快捷键遵循与原进度条一致的学生权限。
            canSeek: () => !(this.isStudent && this.allowFastForward === '2')
          })
          this._playerControlSkin = attachVideoPlayerControlSkin(player, {
            container: document.getElementById(this.playerId),
            onDanmuChange: enabled => this.$emit('danmu-change', enabled)
          })
          this.restorePlayerState(restoreState, player)
        })
        if (this.playerInstance && typeof this.playerInstance.on === 'function') {
          this.playerInstance.on('error', error => this.handleSourceError(error))
          this.playerInstance.on('play', () => this.handleSourceResume())
        }
        this._playbackMemory = rememberVideoPlayback(this.playerInstance, this.runtimeSource)
      } catch (e) {
        console.error('VideoPlayer: 播放器初始化失败', e)
        if (generation === this.initGeneration) this.initError = true
      }
    },

    /**
     * 销毁播放器实例并清空容器 innerHTML，
     * 防止下次打开时出现多个播放器重叠的问题。
     */
    destroyPlayer() {
      if (this._playerControlSkin) {
        this._playerControlSkin.destroy()
        this._playerControlSkin = null
      }
      if (this._playerControls) {
        this._playerControls.destroy()
        this._playerControls = null
      }
      if (this._playbackMemory) {
        this._playbackMemory.destroy()
        this._playbackMemory = null
      }
      if (this.playerInstance) {
        try {
          this.playerInstance.dispose()
        } catch (e) {
          // 销毁失败时静默处理，不影响后续流程
        }
        this.playerInstance = null
      }
      const el = document.getElementById(this.playerId)
      if (el) el.innerHTML = ''
    },

    async refreshCurrentSource() {
      if (!this.refreshSource) throw new Error('当前资料不支持刷新访问地址')
      if (this.sourceRefreshPromise) return this.sourceRefreshPromise
      const request = Promise.resolve().then(() => this.refreshSource()).then(result => {
        const next = typeof result === 'string' ? { url: result } : (result || {})
        const url = next.filePath || next.fileUrl || next.path || next.url
        if (!url) throw new Error('资料访问地址刷新失败')
        const changed = url !== this.runtimeSource || String(next.urlExpireAt || '') !== String(this.runtimeExpireAt || '')
        this.runtimeSource = url
        if (next.urlExpireAt !== undefined) this.runtimeExpireAt = next.urlExpireAt
        if (changed) this.sourceRefreshAttempted = false
        return next
      }).finally(() => {
        if (this.sourceRefreshPromise === request) this.sourceRefreshPromise = null
      })
      this.sourceRefreshPromise = request
      return request
    },

    capturePlayerState() {
      if (!this.playerInstance) return null
      let currentTime = 0
      let paused = true
      try { currentTime = Number(this.playerInstance.getCurrentTime()) || 0 } catch (e) {}
      try { paused = this.playerInstance.getStatus() !== 'playing' } catch (e) {}
      return { currentTime, paused }
    },

    restorePlayerState(state, player = this.playerInstance) {
      if (!state || !player) return
      try { if (state.currentTime > 0) player.seek(state.currentTime) } catch (e) {}
      if (state.paused) {
        try { player.pause() } catch (e) {}
      } else {
        try { player.play() } catch (e) {}
      }
    },

    async handleSourceResume() {
      if (!this.visible || !this.refreshSource || !isResourceUrlExpiring(this.runtimeExpireAt) || this.sourceRefreshAttempted) return
      await this.recoverExpiredSource()
    },

    async handleSourceError() {
      if (!this.visible) return
      if (this.refreshSource && isResourceUrlExpiring(this.runtimeExpireAt, 60000) && !this.sourceRefreshAttempted) {
        await this.recoverExpiredSource()
        return
      }
      if (this.mediaErrorReported) return
      this.mediaErrorReported = true
      this.initError = true
      this.$message.error('视频访问失败，请重试')
    },

    async recoverExpiredSource() {
      if (this.sourceRefreshPromise || this.sourceRefreshAttempted) return
      this.sourceRefreshAttempted = true
      const state = this.capturePlayerState()
      try { if (this.playerInstance) this.playerInstance.pause() } catch (e) {}
      try {
        await this.refreshCurrentSource()
        if (!this.visible) return
        await this.$nextTick()
        await this.initPlayer(state)
      } catch (e) {
        this.initError = true
        this.$message.error('刷新资料访问地址失败，请重新打开')
      }
    },

    /** 下载当前视频 */
    async handleDownload() {
      if (this.refreshSource && isResourceUrlExpiring(this.runtimeExpireAt)) {
        try { await this.refreshCurrentSource() } catch (e) {
          this.$message.error('刷新资料访问地址失败，请重试')
          return
        }
      }
      const url = this.runtimeSource
      if (!url) return
      try {
        const res = await fetch(url)
        if (!res.ok) {
          this.$message.error('视频访问失败，请重试')
          return
        }
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = this.title || '视频'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url
        a.download = this.title || '视频'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },

    /** 收藏/取消收藏 */
    async handleCollect() {
      console.log(this.collectParams,'参数')
      if (this.collecting) return
      this.collecting = true
      try {
        const res = await collectToggle(this.collectParams)
        const collectCount = res?.data?.collectCount
        this.isCollected = collectCount !== undefined ? Number(collectCount) === 1 : !this.isCollected
        this.$message.success(this.isCollected ? '收藏成功' : '已取消收藏')
        this.$emit('collect-change', this.isCollected)
      } catch (e) {
        this.$message.error('操作失败，请重试')
      } finally {
        this.collecting = false
      }
    },

    /** 关闭播放器，向父组件抛出 close 事件：进度百分比（0-100）、观看时长（秒） */
    handleClose() {
      if (this._playbackMemory) this._playbackMemory.save()
      let percent = 0
      let viewTime = 0
      if (this.playerInstance) {
        try {
          const current = this.playerInstance.getCurrentTime() || 0
          const total = this.playerInstance.getDuration() || 0
          viewTime = Math.max(0, Math.round(current))
          if (total > 0) {
            percent = Math.min(Math.round(current / total * 100), 100)
          }
        } catch (e) {}
      }
      this.$emit('close', percent, viewTime)
    }
  },

  /** 组件销毁前主动释放播放器资源 */
  beforeDestroy() {
    this.initGeneration++
    this.setScreenGuard(false)
    this.destroyPlayer()
  }
}
</script>

<style lang="scss" scoped>
.video-player-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2002!important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-box {
  width:100vw;
  max-width: 100vh;
  background: #1a1a1a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.video-player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-bottom: 1px solid #3a3a3a;
}

.video-player-title {
  font-size: 15px;
  font-weight: bold;
  color: #ffffff;
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.video-player-collect {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 12px;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }

  &--active {
    color: #FFD700;
    border-color: rgba(255, 215, 0, 0.5);
    background: rgba(255, 215, 0, 0.12);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.video-player-download {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 12px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

.video-player-close {
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

.video-player-body {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-player-container {
  width: 100%;
  height: 100%;
}

.video-player-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player-error-text {
  font-size: 15px;
  color: #999999;
}


::v-deep .prism-player .prism-info-display{
  height: auto!important;
}

/* 设置面板只保留倍速，隐藏字幕/音轨/画质 */
::v-deep .prism-setting-cc,
::v-deep .prism-setting-audio,
::v-deep .prism-setting-quality {
  display: none !important;
}

/* allowMultiple === 2 时隐藏倍速控件 */
.video-player-mask.vp-no-speed {
  ::v-deep .vp-control-speed,
  ::v-deep .prism-setting-speed,
  ::v-deep .prism-speed-selector {
    display: none !important;
  }
}
</style>
