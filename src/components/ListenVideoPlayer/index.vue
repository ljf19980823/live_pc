<template>
  <div
    v-if="inline || visible"
    :class="inline ? 'hrp-inline' : 'hrp-mask'"
    @click.self="inline ? null : handleClose()"
  >
    <div class="hrp-box" :class="{ 'hrp-box--inline': inline }">
      <!-- 标题栏（仅弹窗模式） -->
      <div v-if="!inline" class="hrp-header">
        <div class="hrp-title">{{ title || '历史课堂回放' }}</div>
        <button
          v-if="isStudent && fromTask"
          class="hrp-collect"
          :class="{ 'hrp-collect--active': isCollected }"
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
          class="hrp-download"
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
        <video-watermark
          ref="videoWatermark"
          :user-info="currentUserInfo"
          :disabled="isTeacher"
        />

        <!-- 转写字幕（CC 开关注入到播放器底部控制栏） -->
        <div
          v-if="hasSubtitleSource"
          ref="subtitleLayer"
          class="hrp-subtitle-layer"
          :class="{ 'hrp-subtitle-layer--fullscreen': isFullscreen }"
        >
          <div v-if="subtitleOn && displaySubtitle" class="hrp-subtitle">
            <span>{{ displaySubtitle }}</span>
          </div>
        </div>

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
import { getUserInfo } from '@/utils/auth'
import { collectToggle } from '@/api'
import VideoWatermark from '@/components/VideoWatermark'

const ALIPLAYER_LICENSE = {
  domain: 'fjlsjy123.com',
  key: 'xPQXSZn3Mq45H2eLW125d9c8910914548b973ab781f1bd6f7'
}

/** 每个组件实例生成唯一的播放器容器 id，避免多实例冲突 */
let idCounter = 0

/** 进度漂移修正阈值（秒）：双流时间差超过该值时强制同步 */
const DRIFT_THRESHOLD = 1.5

/** 单行字幕最多字数（中文按字计），保证画面上只出现一行 */
const SUBTITLE_MAX_CHARS = 16

export default {
  name: 'HistoryVideoPlayer',

  components: {
    VideoWatermark
  },

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
     * 行内嵌入模式：true 时不显示遮罩和标题栏，直接嵌入父容器
     * @type {Boolean}
     * @default false
     */
    inline: {
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
    },

    /**
     * 字幕数据（转写段落列表）
     * 每项需包含 text，以及 startTime/endTime（毫秒）或 startSeconds
     * @type {Array}
     */
    subtitles: {
      type: Array,
      default: () => []
    },

    /**
     * 外部直接传入当前字幕文案（优先于内部按时间匹配）
     * 听记页可把当前高亮转写段落传进来
     * @type {String}
     */
    subtitleText: {
      type: String,
      default: ''
    },

    /**
     * 是否默认开启字幕
     * @type {Boolean}
     * @default true
     */
    subtitleDefaultOn: {
      type: Boolean,
      default: true
    }
  },

  data() {
    const uid = ++idCounter
    const userInfo = getUserInfo() || {}
    const userRole = String(userInfo.role || '').toUpperCase()
    return {
      isStudent: userInfo.role === 'STUDENT',
      isTeacher: userRole === 'TEACHER',
      currentUserInfo: userInfo,
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
      _onFsChange: null,
      isCollected: false,
      collecting: false,
      subtitleOn: true,
      currentSubtitle: ''
    }
  },

  computed: {
    hasSubtitleSource() {
      return this.subtitles.length > 0 || !!this.subtitleText
    },
    displaySubtitle() {
      if (!this.subtitleOn) return ''
      // 有转写列表时用内部拆好的单行字幕；否则回退外部文案
      if (this.subtitles.length > 0) return this.currentSubtitle
      return this.subtitleText || this.currentSubtitle
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.setScreenGuard(true)
        this.isCollected = Number(this.collectParams.collectCount || 0) === 1
        this.$nextTick(() => this.initPlayers())
      } else {
        if (!this.inline) this.setScreenGuard(false)
        this.destroyPlayers()
      }
    },
    mainSource(val) {
      if ((this.visible || this.inline) && val) {
        this.$nextTick(() => this.initPlayers())
      }
    },
    subtitleDefaultOn: {
      immediate: true,
      handler(val) {
        this.subtitleOn = !!val
      }
    },
    subtitleOn(val) {
      if (!val) this.currentSubtitle = ''
      else if (this._mainVideoEl) this.updateSubtitle(this._mainVideoEl.currentTime)
      this.syncCcButtonState()
    },
    hasSubtitleSource(val) {
      if (val) this.$nextTick(() => this.injectCcButton())
      else this.removeCcButton()
    },
    subtitles: {
      deep: true,
      handler() {
        this.rebuildSubtitleCues()
        const t = this._mainVideoEl
          ? this._mainVideoEl.currentTime
          : (this.mainPlayer && typeof this.mainPlayer.getCurrentTime === 'function'
            ? this.mainPlayer.getCurrentTime()
            : 0)
        this.updateSubtitle(t || 0)
        this.$nextTick(() => this.injectCcButton())
        // 转写异步到达时若已全屏，把字幕层挂到全屏节点
        if (this.isFullscreen) {
          this.$nextTick(() => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement
            const subtitleEl = this.$refs.subtitleLayer
            if (fsEl && subtitleEl && subtitleEl.parentNode !== fsEl) {
              fsEl.appendChild(subtitleEl)
            }
          })
        }
      }
    }
  },
  mounted() {
    if (this.inline || this.visible) {
      this.setScreenGuard(true)
    }
    if (this.inline && this.mainSource) {
      this.$nextTick(() => this.initPlayers())
    }
  },
  methods: {
    setScreenGuard(enabled) {
      if (window.electronAPI?.setScreenGuard) {
        window.electronAPI.setScreenGuard(enabled)
      }
    },

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
              this.$nextTick(() => this.injectCcButton())
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
        this.$emit('pause')
        if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
      })
      mainPlayer.on('play', () => {
        this.$emit('play')
        if (this.teacherPlayer && !this.isSyncing) this.safePlay(this.teacherPlayer)
      })
      mainPlayer.on('ended', () => {
        this.$emit('ended')
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
          this.$emit('play')
          this.startSubtitleRaf()
          if (this.teacherPlayer && !this.isSyncing) this.safePlay(this.teacherPlayer)
        }
        const onPause = () => {
          this.$emit('pause')
          this.stopSubtitleRaf()
          this.updateSubtitle(videoEl.currentTime)
          if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
        }
        const onSeeked = () => {
          this.updateSubtitle(videoEl.currentTime)
          if (!this.teacherPlayer || this.isSyncing) return
          this.isSyncing = true
          try { this.teacherPlayer.seek(videoEl.currentTime) } catch (e) {}
          setTimeout(() => { this.isSyncing = false }, 1000)
        }
        const onEnded = () => {
          this.$emit('ended')
          this.stopSubtitleRaf()
          this.updateSubtitle(videoEl.currentTime)
          if (this.teacherPlayer) try { this.teacherPlayer.pause() } catch (e) {}
        }
        const onRateChange = () => {
          if (this.teacherPlayer) {
            try { this.teacherPlayer.setSpeed(videoEl.playbackRate) } catch (e) {}
          }
        }
        const onTimeUpdate = () => {
          this.updateSubtitle(videoEl.currentTime)
          this.$emit('timeupdate', videoEl.currentTime)
        }

        videoEl.addEventListener('play', onPlay)
        videoEl.addEventListener('pause', onPause)
        videoEl.addEventListener('seeked', onSeeked)
        videoEl.addEventListener('ended', onEnded)
        videoEl.addEventListener('ratechange', onRateChange)
        videoEl.addEventListener('timeupdate', onTimeUpdate)
        if (!videoEl.paused && !videoEl.ended) {
          this.$emit('play')
          this.startSubtitleRaf()
        }
        this._removeVideoListeners = () => {
          videoEl.removeEventListener('play', onPlay)
          videoEl.removeEventListener('pause', onPause)
          videoEl.removeEventListener('seeked', onSeeked)
          videoEl.removeEventListener('ended', onEnded)
          videoEl.removeEventListener('ratechange', onRateChange)
          videoEl.removeEventListener('timeupdate', onTimeUpdate)
        }
        this.injectCcButton()
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

      // ── 漂移修正 + 字幕兜底刷新 ──
      this.syncTimer = setInterval(() => {
        if (this._mainVideoEl) {
          this.updateSubtitle(this._mainVideoEl.currentTime)
        }
        if (!this.teacherPlayer || this.isSyncing || !this._mainVideoEl) return
        try {
          const diff = Math.abs(this._mainVideoEl.currentTime - this.teacherPlayer.getCurrentTime())
          if (diff > DRIFT_THRESHOLD) {
            this.isSyncing = true
            this.teacherPlayer.seek(this._mainVideoEl.currentTime)
            setTimeout(() => { this.isSyncing = false }, 1000)
          }
        } catch (e) {}
      }, 500)
    },

    enterFullscreen(fsEl) {
      const pipEl = this.$refs.pip
      if (fsEl && pipEl && pipEl.parentNode !== fsEl) {
        fsEl.appendChild(pipEl)
      }
      const subtitleEl = this.$refs.subtitleLayer
      if (fsEl && subtitleEl && subtitleEl.parentNode !== fsEl) {
        fsEl.appendChild(subtitleEl)
      }
      this.$refs.videoWatermark?.moveTo(fsEl)
      this.isFullscreen = true
    },

    exitFullscreen() {
      const bodyEl = this.$refs.videoArea
      const pipEl = this.$refs.pip
      if (bodyEl && pipEl && pipEl.parentNode !== bodyEl) {
        bodyEl.appendChild(pipEl)
      }
      const subtitleEl = this.$refs.subtitleLayer
      if (bodyEl && subtitleEl && subtitleEl.parentNode !== bodyEl) {
        bodyEl.appendChild(subtitleEl)
      }
      this.$refs.videoWatermark?.restoreTo(bodyEl)
      this.isFullscreen = false
    },

    safePlay(player) {
      if (!player) return
      try { player.play() } catch (e) {}
    },

    /** 播放中用 rAF 刷新字幕，保证逐字渐显更跟手 */
    startSubtitleRaf() {
      if (this._subtitleRaf) return
      const tick = () => {
        if (this._mainVideoEl) {
          this.updateSubtitle(this._mainVideoEl.currentTime)
        }
        this._subtitleRaf = requestAnimationFrame(tick)
      }
      this._subtitleRaf = requestAnimationFrame(tick)
    },

    stopSubtitleRaf() {
      if (this._subtitleRaf) {
        cancelAnimationFrame(this._subtitleRaf)
        this._subtitleRaf = null
      }
    },

    /**
     * 将 CC 按钮注入到 Aliplayer 底部控制栏右侧（设置/全屏按钮前）
     */
    injectCcButton() {
      if (!this.hasSubtitleSource) {
        this.removeCcButton()
        return
      }
      const container = document.getElementById(this.mainPlayerId)
      if (!container) return
      const controlBar = container.querySelector('.prism-controlbar')
      if (!controlBar) {
        // 控制栏尚未渲染完，稍后重试
        if (!this._ccInjectRetry || this._ccInjectRetry < 30) {
          this._ccInjectRetry = (this._ccInjectRetry || 0) + 1
          setTimeout(() => this.injectCcButton(), 120)
        }
        return
      }
      this._ccInjectRetry = 0

      let btn = controlBar.querySelector('.hrp-cc-btn')
      if (!btn) {
        btn = document.createElement('div')
        btn.className = 'hrp-cc-btn'
        btn.setAttribute('role', 'button')
        btn.setAttribute('tabindex', '0')
        btn.innerHTML = '<span class="hrp-cc-btn__label">CC</span>'
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          this.subtitleOn = !this.subtitleOn
        })
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            this.subtitleOn = !this.subtitleOn
          }
        })

        const insertBefore =
          controlBar.querySelector('.prism-setting-btn') ||
          controlBar.querySelector('.prism-fullscreen-btn') ||
          controlBar.querySelector('.prism-volume')
        if (insertBefore && insertBefore.parentNode === controlBar) {
          controlBar.insertBefore(btn, insertBefore)
        } else if (insertBefore && insertBefore.parentNode) {
          insertBefore.parentNode.insertBefore(btn, insertBefore)
        } else {
          controlBar.appendChild(btn)
        }
      }
      this._ccBtnEl = btn
      this.syncCcButtonState()
    },

    removeCcButton() {
      if (this._ccBtnEl && this._ccBtnEl.parentNode) {
        this._ccBtnEl.parentNode.removeChild(this._ccBtnEl)
      }
      this._ccBtnEl = null
      const container = document.getElementById(this.mainPlayerId)
      const leftover = container && container.querySelector('.hrp-cc-btn')
      if (leftover && leftover.parentNode) leftover.parentNode.removeChild(leftover)
    },

    syncCcButtonState() {
      const btn = this._ccBtnEl || (
        document.getElementById(this.mainPlayerId) &&
        document.getElementById(this.mainPlayerId).querySelector('.hrp-cc-btn')
      )
      if (!btn) return
      btn.classList.toggle('hrp-cc-btn--off', !this.subtitleOn)
      btn.title = this.subtitleOn ? '关闭字幕' : '打开字幕'
      btn.setAttribute('aria-pressed', this.subtitleOn ? 'true' : 'false')
    },

    getSubtitleRange(item, index) {
      const start = item.startTime != null
        ? Number(item.startTime)
        : Number(item.startSeconds || 0) * 1000
      let end = item.endTime != null && Number(item.endTime) > start
        ? Number(item.endTime)
        : 0
      if (!end) {
        // 无 endTime 时，以下一段开始为准，保证本行说完立刻让位/消失
        const next = this.subtitles[index + 1]
        if (next) {
          end = next.startTime != null
            ? Number(next.startTime)
            : Number(next.startSeconds || 0) * 1000
        } else {
          const len = Array.from(String(item.text || '')).length
          end = start + Math.min(8000, Math.max(2000, Math.round(len / 4 * 1000)))
        }
      }
      if (end <= start) end = start + 2000
      return { start, end }
    },

    /**
     * 把转写段落拆成「单行」字幕数组（优先按标点，再按字数折行）
     */
    splitTextToLines(text) {
      const raw = String(text || '').replace(/\s+/g, ' ').trim()
      if (!raw) return []

      const chars = Array.from(raw)
      const clauses = []
      let buf = []
      chars.forEach((ch) => {
        buf.push(ch)
        if (/[。！？；!?;]/.test(ch)) {
          const t = buf.join('').trim()
          if (t) clauses.push(t)
          buf = []
        }
      })
      if (buf.length) {
        const t = buf.join('').trim()
        if (t) clauses.push(t)
      }
      if (!clauses.length) clauses.push(raw)

      const lines = []
      clauses.forEach((clause) => {
        const clauseChars = Array.from(clause)
        if (clauseChars.length <= SUBTITLE_MAX_CHARS) {
          lines.push(clause)
          return
        }
        let i = 0
        while (i < clauseChars.length) {
          let end = Math.min(i + SUBTITLE_MAX_CHARS, clauseChars.length)
          if (end < clauseChars.length) {
            let breakAt = -1
            const minKeep = i + Math.floor(SUBTITLE_MAX_CHARS * 0.4)
            for (let j = end; j > minKeep; j--) {
              if (/[，、,：:\s]/.test(clauseChars[j - 1])) {
                breakAt = j
                break
              }
            }
            if (breakAt > i) end = breakAt
          }
          const line = clauseChars.slice(i, end).join('').trim()
          if (line) lines.push(line)
          i = end
        }
      })
      return lines
    },

    /**
     * 将转写段落展开为单行字幕时间轴：一行接一行，同时最多显示一行
     */
    rebuildSubtitleCues() {
      const cues = []
      const list = this.subtitles || []
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        const { start, end } = this.getSubtitleRange(item, i)
        const lines = this.splitTextToLines(item.text || '')
        if (!lines.length || !Number.isFinite(start) || !Number.isFinite(end)) continue

        const weights = lines.map((line) => Math.max(Array.from(line).length, 1))
        const totalWeight = weights.reduce((sum, n) => sum + n, 0) || 1
        const duration = Math.max(end - start, 1)
        let cursor = start
        let acc = 0
        for (let j = 0; j < lines.length; j++) {
          acc += weights[j]
          let lineEnd = j === lines.length - 1
            ? end
            : start + Math.round(duration * acc / totalWeight)
          // 保证每一行至少有一点展示时间，且不越界
          if (j < lines.length - 1) {
            lineEnd = Math.min(end, Math.max(cursor + 80, lineEnd))
          } else {
            lineEnd = end
          }
          if (lineEnd <= cursor) lineEnd = Math.min(end, cursor + 80)
          cues.push({
            start: cursor,
            end: lineEnd,
            text: lines[j]
          })
          cursor = lineEnd
        }
      }
      this._subtitleCues = cues
    },

    /**
     * 按「单行字幕」时间轴更新当前文案：一行显示完立刻换下一行 / 消失
     * @param {Number} timeSec 当前播放秒数
     */
    updateSubtitle(timeSec) {
      if (!this.subtitleOn || !this.subtitles.length) {
        if (this.currentSubtitle) this.currentSubtitle = ''
        return
      }
      if (!this._subtitleCues) this.rebuildSubtitleCues()
      const cues = this._subtitleCues || []
      const timeMs = Number(timeSec) * 1000
      if (!Number.isFinite(timeMs)) return

      let matched = ''
      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i]
        if (timeMs < cue.start) break
        if (timeMs >= cue.start && timeMs < cue.end) {
          matched = cue.text || ''
          break
        }
      }

      if (matched !== this.currentSubtitle) {
        this.currentSubtitle = matched
      }
    },

    /** 外部调用：跳转到指定秒数（供听记组件使用） */
    seekTo(seconds) {
      if (this._mainVideoEl) {
        this._mainVideoEl.currentTime = seconds
      } else if (this.mainPlayer) {
        try { this.mainPlayer.seek(seconds) } catch (e) {}
      }
      this.updateSubtitle(seconds)
    },

    // ─────────────── 销毁 ───────────────

    destroyPlayers() {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      this.mainLoading = false
      this.currentSubtitle = ''
      this._subtitleCues = null
      this.stopSubtitleRaf()
      this.removeCcButton()

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

    /** 收藏/取消收藏 */
    async handleCollect() {
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

    /** 下载主视频 */
    async handleDownload() {
      const url = this.mainSource
      if (!url) return
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = this.title || '课堂回放'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url
        a.download = this.title || '课堂回放'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },

    handleClose() {
      let percent = 0
      try {
        const videoEl = this._mainVideoEl
        if (videoEl && videoEl.duration > 0) {
          percent = Math.min(Math.round(videoEl.currentTime / videoEl.duration * 100), 100)
        } else if (this.mainPlayer) {
          const current = this.mainPlayer.getCurrentTime() || 0
          const total = this.mainPlayer.getDuration() || 0
          if (total > 0) {
            percent = Math.min(Math.round(current / total * 100), 100)
          }
        }
      } catch (e) {}
      this.$emit('close', percent)
    }
  },

  beforeDestroy() {
    this.setScreenGuard(false)
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
  border-radius: 16px 16px 16px 16px;
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


.hrp-collect {
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

.hrp-download {
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
  z-index: 100001;

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

/* ─── 转写字幕层（需高于 Aliplayer 内部层级） ─── */
.hrp-subtitle-layer {
  position: absolute;
  inset: 0;
  /* Aliplayer 内部控制层最高到 99999，字幕必须更高；控制栏自身更高以便点到 CC */
  z-index: 100000;
  pointer-events: none;
}

.hrp-subtitle {
  position: absolute;
  left: 50%;
  bottom: 56px;
  transform: translateX(-50%);
  max-width: 86%;
  text-align: center;
  pointer-events: none;

  span {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(0, 0, 0, 0.72);
    color: #fff;
    font-size: 15px;
    line-height: 1.4;
    border-radius: 4px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    /* 强制单行显示，长文案由拆行逻辑控制 */
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.hrp-subtitle-layer--fullscreen .hrp-subtitle {
  bottom: 72px;

  span {
    font-size: 20px;
    padding: 8px 18px;
  }
}

::v-deep .prism-player .prism-info-display{
  height: auto!important;
}

/* 控制栏需高于字幕层，保证 CC 可点 */
::v-deep .prism-controlbar {
  z-index: 100001 !important;
}

/* 注入到控制栏的 CC 按钮 */
::v-deep .hrp-cc-btn {
  position: relative;
  float: right;
  width: 32px;
  height: 32px;
  margin: 7px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.75);
  background: transparent;
  color: #fff;
  transition: opacity 0.2s, background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .hrp-cc-btn__label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1;
  }

  &.hrp-cc-btn--off {
    opacity: 0.45;
    border-color: rgba(255, 255, 255, 0.35);

    .hrp-cc-btn__label {
      text-decoration: line-through;
    }
  }
}

/* 设置面板只保留倍速，隐藏字幕/音轨/画质 */
::v-deep .prism-setting-cc,
::v-deep .prism-setting-audio,
::v-deep .prism-setting-quality {
  display: none !important;
}

/* ─── 行内嵌入模式 ─── */
.hrp-inline {
  display: block;
  width: 100%;
  height: 100%;

  .hrp-box--inline {
    width: 100%;
    height: 100%;
    max-width: none;
    background: #000;
    border-radius: 16px;
    box-shadow: none;

    .hrp-body {
      width: 100%;
      height: 100%;
      aspect-ratio: unset;
    }
  }
}

</style>
