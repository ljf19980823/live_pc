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

    <!-- 更新弹窗（isForceUpdate==='1' 不可关闭并自动下载；==='0' 可关闭） -->
    <transition name="dialog-fade">
      <div v-if="updateDialogVisible" class="update-overlay" @click.self="onUpdateOverlayClick">
        <div class="update-dialog">
          <div class="dialog-illustration">
            <div class="stars">
              <span class="star s1">✦</span>
              <span class="star s2">✦</span>
              <span class="star s3">✦</span>
            </div>
            <div class="rocket-wrap">
              <svg class="rocket-svg" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="118" rx="14" ry="22" fill="#ffcc66" opacity="0.7"/>
                <ellipse cx="60" cy="112" rx="9" ry="14" fill="#ff9900" opacity="0.8"/>
                <path d="M38 90 Q30 105 40 108 L50 98Z" fill="#5ecfcf"/>
                <path d="M82 90 Q90 105 80 108 L70 98Z" fill="#5ecfcf"/>
                <rect x="44" y="50" width="32" height="52" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
                <path d="M44 60 Q60 22 76 60Z" fill="#5ecfcf"/>
                <circle cx="60" cy="70" r="10" fill="#b3ecec" stroke="#5ecfcf" stroke-width="2"/>
                <circle cx="60" cy="70" r="6" fill="#e8f9f9"/>
                <circle cx="32" cy="72" r="12" fill="#ff8c42" opacity="0.9"/>
                <text x="32" y="77" text-anchor="middle" font-size="12" fill="#fff">⊡</text>
                <circle cx="90" cy="60" r="11" fill="#a855f7" opacity="0.85"/>
                <text x="90" y="65" text-anchor="middle" font-size="11" fill="#fff">⚙</text>
                <circle cx="78" cy="88" r="9" fill="#3b9eff" opacity="0.85"/>
                <text x="78" y="93" text-anchor="middle" font-size="9" fill="#fff">▣</text>
              </svg>
            </div>
          </div>

          <div class="dialog-body">
            <h3 class="dialog-title">
              {{ updateIsForce ? '发现新版本，需要更新后才能继续使用' : '升级提示' }}
            </h3>
            <p class="dialog-desc">
              我们为您推出了更快、更稳定的 {{ updateDialogInfo.version }} 客户端。
            </p>

            <!-- 下载中 -->
            <template v-if="updateDownloading">
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: updateDownloadProgress + '%' }" />
                  <span class="progress-label">{{ updateDownloadProgress }}%</span>
                </div>
              </div>
              <p class="progress-tip">下载中…</p>
            </template>

            <!-- 下载完成 -->
            <template v-else-if="updateDownloaded">
              <p class="progress-tip success-tip">下载完成，即将安装并重启应用</p>
            </template>

            <!-- 下载出错 -->
            <template v-else-if="updateDownloadError">
              <p class="progress-tip error-tip">下载失败：{{ updateDownloadError }}</p>
              <div class="dialog-actions">
                <button v-if="!updateIsForce" class="btn-cancel" @click="closeUpdateDialog">取消</button>
                <button class="btn-upgrade" @click="startUpdateDownload">重试</button>
              </div>
            </template>

            <!-- 初始状态 -->
            <template v-else>
              <!-- 强制更新：自动开始，显示等待提示 -->
              <p v-if="updateIsForce" class="progress-tip">正在准备下载，请稍候…</p>
              <!-- 非强制：让用户选择 -->
              <div v-else class="dialog-actions">
                <button class="btn-cancel" @click="closeUpdateDialog">下次再说</button>
                <button class="btn-upgrade" @click="startUpdateDownload">立即升级</button>
              </div>
            </template>
          </div>
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
      },
      updateDialogVisible: false,
      updateIsForce: false,
      updateDialogInfo: { version: '', downloadUrl: '' },
      updateDownloading: false,
      updateDownloaded: false,
      updateDownloadProgress: 0,
      updateDownloadError: '',
      _updateRemoveProgress: null,
      _updateRemoveComplete: null,
      _updateRemoveError: null
    }
  },
  mounted () {
    this.initScreenGuard()
    this.checkUpdate()
  },
  beforeDestroy () {
    if (this._screenGuardCleanup) {
      this._screenGuardCleanup()
    }
    this.removeUpdateIpcListeners()
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
    },

    async checkUpdate () {
      if (!window.electronAPI?.checkForUpdate) return
      try {
        const result = await window.electronAPI.checkForUpdate()
        if (!result || !result.hasUpdate) return

        const updateInfo = {
          version: result.version || '新版本',
          downloadUrl: result.downloadUrl || '',
          description: result.description || ''
        }
        const isForceUpdate = result.isForceUpdate ?? '0'

        this.$store.commit('app/SET_UPDATE_INFO', {
          hasUpdate: true,
          isForceUpdate,
          updateInfo
        })

        this.updateIsForce = isForceUpdate === '1'
        this.updateDialogInfo = updateInfo
        this.updateDialogVisible = true
        if (isForceUpdate === '1') {
          this.$nextTick(() => this.startUpdateDownload())
        }
      } catch (_) {}
    },

    closeUpdateDialog () {
      if (this.updateDownloading || this.updateDownloaded) return
      this.updateDialogVisible = false
      this.updateDownloadError = ''
    },

    onUpdateOverlayClick () {
      if (!this.updateIsForce && !this.updateDownloading && !this.updateDownloaded) {
        this.closeUpdateDialog()
      }
    },

    startUpdateDownload () {
      if (!window.electronAPI?.downloadUpdate) return
      if (!this.updateDialogInfo.downloadUrl) {
        this.updateDownloadError = '暂无下载地址，请稍后重试'
        return
      }
      this.updateDownloading = true
      this.updateDownloadProgress = 0
      this.updateDownloadError = ''
      this.updateDownloaded = false
      this.registerUpdateIpcListeners()
      window.electronAPI.downloadUpdate(this.updateDialogInfo.downloadUrl)
    },

    registerUpdateIpcListeners () {
      this.removeUpdateIpcListeners()
      if (window.electronAPI?.onUpdateProgress) {
        this._updateRemoveProgress = window.electronAPI.onUpdateProgress((progress) => {
          this.updateDownloadProgress = progress
        })
      }
      if (window.electronAPI?.onUpdateComplete) {
        this._updateRemoveComplete = window.electronAPI.onUpdateComplete((filePath) => {
          this.updateDownloading = false
          this.updateDownloaded = true
          this.updateDownloadProgress = 100
          setTimeout(() => {
            if (window.electronAPI?.installUpdate) {
              window.electronAPI.installUpdate(filePath)
            }
          }, 1500)
        })
      }
      if (window.electronAPI?.onUpdateError) {
        this._updateRemoveError = window.electronAPI.onUpdateError((error) => {
          this.updateDownloading = false
          this.updateDownloadError = error || '未知错误'
        })
      }
    },

    removeUpdateIpcListeners () {
      if (this._updateRemoveProgress) { this._updateRemoveProgress(); this._updateRemoveProgress = null }
      if (this._updateRemoveComplete) { this._updateRemoveComplete(); this._updateRemoveComplete = null }
      if (this._updateRemoveError) { this._updateRemoveError(); this._updateRemoveError = null }
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

/* ── 强制更新弹窗样式（复用 LiveClass 的 update-dialog 样式） ── */
.update-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-dialog {
  background: #fff;
  border-radius: 16px;
  width: 420px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.dialog-illustration {
  position: relative;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f8ff 50%, #e8f0ff 100%);
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  color: #ffd700;
  font-size: 14px;
  animation: twinkle 2s infinite alternate;
}
.s1 { top: 20px; left: 30px; animation-delay: 0s; }
.s2 { top: 40px; right: 40px; animation-delay: 0.6s; }
.s3 { bottom: 25px; left: 60px; animation-delay: 1.2s; }

@keyframes twinkle {
  from { opacity: 0.4; transform: scale(0.9); }
  to   { opacity: 1;   transform: scale(1.2); }
}

.rocket-wrap {
  z-index: 1;
}

.rocket-svg {
  width: 90px;
  height: auto;
}

.dialog-body {
  padding: 24px 28px 28px;
}

.dialog-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.dialog-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.progress-wrap {
  margin-bottom: 8px;
}

.progress-bar {
  position: relative;
  background: #f0f0f0;
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-label {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #333;
  font-weight: 600;
}

.progress-tip {
  margin: 8px 0 0;
  font-size: 13px;
  color: #888;
  text-align: center;
}

.success-tip { color: #52c41a; }
.error-tip   { color: #ff4d4f; }

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cancel:hover { background: #f5f5f5; }

.btn-upgrade {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-upgrade:hover { opacity: 0.85; }

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}
.dialog-fade-enter,
.dialog-fade-leave-to {
  opacity: 0;
}
</style>
