<template>
  <div class="student-live-class">

    <!-- ── 顶部更新横幅 ─────────────────────────────────────────────────── -->
    <transition name="banner-fade">
      <div v-if="hasUpdate && !bannerDismissed" class="update-banner">
        <span class="banner-dot" />
        <span class="banner-text">
          我们为您推出了更快、更稳定的 {{ updateInfo.version }} 客户端。
        </span>
        <a class="banner-link" @click="openUpdateDialog">立刻下载 &gt;</a>
      </div>
    </transition>

    <!-- ── 主内容区域 ────────────────────────────────────────────────────── -->
    <div class="main-content">
      <!-- 学生实时课堂内容写在这里 -->
    </div>

    <!-- ── 升级提示弹窗 ──────────────────────────────────────────────────── -->
    <transition name="dialog-fade">
      <div v-if="dialogVisible" class="update-overlay" @click.self="onOverlayClick">
        <div class="update-dialog">

          <!-- 顶部插图区域 -->
          <div class="dialog-illustration">
            <div class="stars">
              <span class="star s1">✦</span>
              <span class="star s2">✦</span>
              <span class="star s3">✦</span>
            </div>
            <div class="rocket-wrap">
              <!-- 内联 SVG 火箭插图 -->
              <svg class="rocket-svg" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
                <!-- 火箭尾焰 -->
                <ellipse cx="60" cy="118" rx="14" ry="22" fill="#ffcc66" opacity="0.7"/>
                <ellipse cx="60" cy="112" rx="9" ry="14" fill="#ff9900" opacity="0.8"/>
                <!-- 火箭底座翼 -->
                <path d="M38 90 Q30 105 40 108 L50 98Z" fill="#5ecfcf"/>
                <path d="M82 90 Q90 105 80 108 L70 98Z" fill="#5ecfcf"/>
                <!-- 火箭主体 -->
                <rect x="44" y="50" width="32" height="52" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
                <!-- 机头 -->
                <path d="M44 60 Q60 22 76 60Z" fill="#5ecfcf"/>
                <!-- 舷窗 -->
                <circle cx="60" cy="70" r="10" fill="#b3ecec" stroke="#5ecfcf" stroke-width="2"/>
                <circle cx="60" cy="70" r="6" fill="#e8f9f9"/>
                <!-- 图标装饰 -->
                <circle cx="32" cy="72" r="12" fill="#ff8c42" opacity="0.9"/>
                <text x="32" y="77" text-anchor="middle" font-size="12" fill="#fff">⊡</text>
                <circle cx="90" cy="60" r="11" fill="#a855f7" opacity="0.85"/>
                <text x="90" y="65" text-anchor="middle" font-size="11" fill="#fff">⚙</text>
                <circle cx="78" cy="88" r="9" fill="#3b9eff" opacity="0.85"/>
                <text x="78" y="93" text-anchor="middle" font-size="9" fill="#fff">▣</text>
              </svg>
            </div>
          </div>

          <!-- 标题 & 描述 -->
          <div class="dialog-body">
            <h3 class="dialog-title">升级提示</h3>
            <p class="dialog-desc">
              我们为您推出了更快、更稳定的 {{ updateInfo.version }} 客户端。
            </p>

            <!-- 下载中：进度条 -->
            <template v-if="downloading">
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: downloadProgress + '%' }" />
                  <span class="progress-label">{{ downloadProgress }}%</span>
                </div>
              </div>
              <p class="progress-tip">下载中…</p>
            </template>

            <!-- 下载完成：安装提示 -->
            <template v-else-if="downloaded">
              <p class="progress-tip success-tip">下载完成，即将安装并重启应用</p>
            </template>

            <!-- 下载出错 -->
            <template v-else-if="downloadError">
              <p class="progress-tip error-tip">下载失败：{{ downloadError }}</p>
              <div class="dialog-actions">
                <button class="btn-cancel" @click="closeDialog">取消</button>
                <button class="btn-upgrade" @click="startDownload">重试</button>
              </div>
            </template>

            <!-- 初始状态：操作按钮 -->
            <template v-else>
              <div class="dialog-actions">
                <button class="btn-cancel" @click="closeDialog">下次再说</button>
                <button class="btn-upgrade" @click="startDownload">立即升级</button>
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
  name: 'StudentLiveClass',

  data () {
    return {
      hasUpdate: false,
      bannerDismissed: false,
      updateInfo: {
        version: '',
        downloadUrl: '',
        description: ''
      },

      dialogVisible: false,
      downloading: false,
      downloaded: false,
      downloadProgress: 0,
      downloadError: '',
      downloadedFilePath: '',

      // 移除 IPC 监听器的清理函数
      _removeProgress: null,
      _removeComplete: null,
      _removeError: null
    }
  },

  mounted () {
    this.checkUpdate()
  },

  beforeDestroy () {
    this.removeIpcListeners()
  },

  methods: {
    // ── 检查版本更新 ────────────────────────────────────────────────────
    async checkUpdate () {
      if (!window.electronAPI?.checkForUpdate) return
      try {
        const result = await window.electronAPI.checkForUpdate()
        if (result && result.hasUpdate) {
          this.updateInfo = {
            version: result.version || '新版本',
            downloadUrl: result.downloadUrl || '',
            description: result.description || ''
          }
          this.hasUpdate = true
        }
      } catch (_) {
        // 静默处理，不影响主功能
      }
    },

    // ── 打开升级弹窗 ────────────────────────────────────────────────────
    openUpdateDialog () {
      this.dialogVisible = true
    },

    // ── 关闭弹窗（点击"下次再说"） ──────────────────────────────────────
    closeDialog () {
      if (this.downloading) return // 下载中不允许关闭
      this.dialogVisible = false
      this.bannerDismissed = false // 关闭弹窗后横幅仍保留
      this.downloadError = ''
    },

    // ── 点击遮罩层 ──────────────────────────────────────────────────────
    onOverlayClick () {
      if (!this.downloading && !this.downloaded) {
        this.closeDialog()
      }
    },

    // ── 开始下载 ─────────────────────────────────────────────────────────
    startDownload () {
      if (!window.electronAPI?.downloadUpdate) return
      if (!this.updateInfo.downloadUrl) {
        this.downloadError = '暂无下载地址，请稍后重试'
        return
      }

      this.downloading = true
      this.downloadProgress = 0
      this.downloadError = ''
      this.downloaded = false

      this.registerIpcListeners()
      window.electronAPI.downloadUpdate(this.updateInfo.downloadUrl)
    },

    // ── 注册下载进度监听 ─────────────────────────────────────────────────
    registerIpcListeners () {
      this.removeIpcListeners()

      if (window.electronAPI?.onUpdateProgress) {
        this._removeProgress = window.electronAPI.onUpdateProgress((progress) => {
          this.downloadProgress = progress
        })
      }

      if (window.electronAPI?.onUpdateComplete) {
        this._removeComplete = window.electronAPI.onUpdateComplete((filePath) => {
          this.downloading = false
          this.downloaded = true
          this.downloadedFilePath = filePath
          this.downloadProgress = 100
          // 延迟 1.5s 后自动安装
          setTimeout(() => this.installUpdate(), 1500)
        })
      }

      if (window.electronAPI?.onUpdateError) {
        this._removeError = window.electronAPI.onUpdateError((error) => {
          this.downloading = false
          this.downloadError = error || '未知错误'
        })
      }
    },

    // ── 移除 IPC 监听 ────────────────────────────────────────────────────
    removeIpcListeners () {
      if (this._removeProgress) { this._removeProgress(); this._removeProgress = null }
      if (this._removeComplete) { this._removeComplete(); this._removeComplete = null }
      if (this._removeError) { this._removeError(); this._removeError = null }
    },

    // ── 安装更新（打开安装包 & 退出应用）────────────────────────────────
    installUpdate () {
      if (window.electronAPI?.installUpdate && this.downloadedFilePath) {
        window.electronAPI.installUpdate(this.downloadedFilePath)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.student-live-class {
  position: relative;
  min-height: 100%;
}

/* ── 顶部横幅 ─────────────────────────────────────────────────────────────── */
.update-banner {
  display: flex;
  align-items: center;
  padding: 9px 20px;
  background: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  font-size: 13px;
  color: #595959;
  gap: 8px;

  .banner-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #faad14;
    flex-shrink: 0;
  }

  .banner-text {
    flex: 1;
  }

  .banner-link {
    color: #13c2c2;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: all 0.3s ease;
}
.banner-fade-enter,
.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* ── 弹窗遮罩 ─────────────────────────────────────────────────────────────── */
.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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

  .stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .star {
    position: absolute;
    color: #ffe066;
    font-size: 16px;
    animation: twinkle 2s ease-in-out infinite;

    &.s1 { top: 18px; left: 40px; font-size: 14px; animation-delay: 0s; }
    &.s2 { top: 28px; right: 50px; font-size: 18px; animation-delay: 0.6s; }
    &.s3 { top: 10px; right: 90px; font-size: 12px; animation-delay: 1.2s; }
  }

  .rocket-wrap {
    position: relative;
    z-index: 1;
  }

  .rocket-svg {
    width: 120px;
    height: 140px;
    display: block;
    filter: drop-shadow(0 8px 16px rgba(94, 207, 207, 0.3));
  }
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

  button {
    flex: 1;
    height: 50px;
    border: none;
    background: transparent;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    &:active {
      background: #ebebeb;
    }
  }

  .btn-cancel {
    color: #8c8c8c;
    border-right: 1px solid #f0f0f0;
  }

  .btn-upgrade {
    color: #13c2c2;
    font-weight: 500;
  }
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

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #36cfc9, #13c2c2);
    border-radius: 10px;
    transition: width 0.3s ease;
  }

  .progress-label {
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

/* ── 主内容 ───────────────────────────────────────────────────────────────── */
.main-content {
  padding: 20px;
}
</style>
