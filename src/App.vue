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

/* ── 弹窗遮罩 ─────────────────────────────────────────────────────────────── */
.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter,
.dialog-fade-leave-to {
  opacity: 0;
}

/* ── 弹窗卡片 ─────────────────────────────────────────────────────────────── */
.update-dialog {
  background: #fff;
  border-radius: 16px;
  width: 340px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

/* ── 顶部插图 ─────────────────────────────────────────────────────────────── */
.dialog-illustration {
  position: relative;
  background: linear-gradient(160deg, #d9f7fa 0%, #e8f9f9 60%, #f0fdfe 100%);
  padding: 28px 0 0;
  display: flex;
  justify-content: center;
  min-height: 150px;
}

.dialog-illustration .stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dialog-illustration .star {
  position: absolute;
  color: #ffe066;
  font-size: 16px;
  animation: twinkle 2s ease-in-out infinite;
}

.dialog-illustration .star.s1 { top: 18px; left: 40px; font-size: 14px; animation-delay: 0s; }
.dialog-illustration .star.s2 { top: 28px; right: 50px; font-size: 18px; animation-delay: 0.6s; }
.dialog-illustration .star.s3 { top: 10px; right: 90px; font-size: 12px; animation-delay: 1.2s; }

.dialog-illustration .rocket-wrap {
  position: relative;
  z-index: 1;
}

.dialog-illustration .rocket-svg {
  width: 120px;
  height: 140px;
  display: block;
  filter: drop-shadow(0 8px 16px rgba(94, 207, 207, 0.3));
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* ── 弹窗内容区 ───────────────────────────────────────────────────────────── */
.dialog-body {
  padding: 20px 24px 0;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 10px;
}

.dialog-desc {
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
  margin: 0 0 20px;
}

/* ── 操作按钮 ─────────────────────────────────────────────────────────────── */
.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
  margin: 0 -24px;
}

.dialog-actions button {
  flex: 1;
  height: 50px;
  border: none;
  background: transparent;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.dialog-actions button:hover {
  background: #f5f5f5;
}

.dialog-actions button:active {
  background: #ebebeb;
}

.dialog-actions .btn-cancel {
  color: #8c8c8c;
  border-right: 1px solid #f0f0f0;
}

.dialog-actions .btn-upgrade {
  color: #13c2c2;
  font-weight: 500;
}

/* ── 进度条 ───────────────────────────────────────────────────────────────── */
.progress-wrap {
  margin: 0 0 10px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #36cfc9, #13c2c2);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-bar .progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.progress-tip {
  font-size: 13px;
  color: #8c8c8c;
  margin: 6px 0 20px;
}

.success-tip {
  color: #52c41a;
}

.error-tip {
  color: #ff4d4f;
}
</style>
