<template>
  <div class="ab-wrap">
    <div class="ab-page-title">关于</div>

    <!-- 应用信息 -->
    <div class="ab-app-info">
      <div class="ab-app-icon">
        <img src="@/assets/images/set/Icon@2x (1).png" alt="app icon" class="ab-icon-img" />
      </div>
      <div class="ab-app-name">{{ appName }}</div>
      <div class="ab-app-version">版本 {{ appVersion }}</div>
      <div class="ab-app-copyright">© 2026 福建立升教育科技集团</div>
    </div>

    <!-- 分割线 -->
    <div class="ab-divider"  v-if="isOpenRz"></div>

    <!-- 上传日志 -->
    <div class="ab-log-section" v-if="isOpenRz">
      <div class="ab-log-left">
        <div class="ab-log-title">上传日志</div>
        <div class="ab-log-desc">将本地运行日志上传给技术团队以协助排查问题</div>

        <!-- 上传中 -->
        <div v-if="uploadState === 'uploading'" class="ab-progress-wrap">
          <div class="ab-progress-bar-row">
            <span class="ab-progress-hint">正在上传...</span>
            <span class="ab-progress-pct">{{ uploadProgress }}%</span>
          </div>
          <div class="ab-progress-track">
            <div class="ab-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>

        <!-- 上传成功 -->
        <div v-else-if="uploadState === 'success'" class="ab-success-card">
          <svg class="ab-success-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="16" height="16" rx="3" stroke="#52C41A" stroke-width="1.4" stroke-dasharray="3 2"/>
            <path d="M5 9l3 3 5-5" stroke="#52C41A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="ab-success-text">日志上传成功，感谢您的反馈！</span>
        </div>
      </div>

      <div class="ab-log-right">
        <!-- 初始按钮 -->
        <button
          v-if="uploadState === 'idle'"
          class="ab-btn ab-btn--upload"
          @click="handleUpload"
        >上传日志</button>

        <!-- 重新上传按钮 -->
        <button
          v-else-if="uploadState === 'success'"
          class="ab-btn ab-btn--reupload"
          @click="handleReUpload"
        >重新上传</button>
      </div>
    </div>
  </div>
</template>

<script>
import pkg from '../../../../../package.json'

export default {
  name: 'About',
  data() {
    return {
      appName: pkg.chname,
      appVersion: pkg.version,
      uploadState: 'idle', // idle | uploading | success
      uploadProgress: 0,
      _timer: null,
      isOpenRz:false
    }
  },
  beforeDestroy() {
    clearInterval(this._timer)
  },
  methods: {
    handleUpload() {
      this.uploadState = 'uploading'
      this.uploadProgress = 0
      this._timer = setInterval(() => {
        this.uploadProgress += Math.floor(Math.random() * 8) + 3
        if (this.uploadProgress >= 100) {
          this.uploadProgress = 100
          clearInterval(this._timer)
          setTimeout(() => {
            this.uploadState = 'success'
          }, 300)
        }
      }, 200)
    },
    handleReUpload() {
      this.uploadState = 'idle'
      this.uploadProgress = 0
    }
  }
}
</script>

<style lang="scss" scoped>
.ab-wrap {
  padding: 24px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.ab-page-title {
   font-size: 13px;
  color: #888;
  font-weight: 400;
  margin-bottom: 0;
}

// ── 应用信息 ──────────────────────────────────────────
.ab-app-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 28px;
}

.ab-app-icon {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 73, 255, 0.18);
}

.ab-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ab-app-name {
  font-size: 16px;
  font-weight: bold;
  color: #333333 ;
  margin-bottom: 10px;
}

.ab-app-version {
  font-size: 12px;
  color: #999999;
  margin-bottom: 8px;
}

.ab-app-copyright {
  font-size: 11px;
  color: #D9D9D9;
}

// ── 分割线 ──────────────────────────────────────────
.ab-divider {
  height: 1px;
  background: #F0F0F5;
  margin: 0 -32px;
}

// ── 上传日志 ──────────────────────────────────────────
.ab-log-section {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-top: 24px;
  gap: 20px;
}

.ab-log-left {
  flex: 1;
  min-width: 0;
}

.ab-log-title {
  font-size: 15px;
  font-weight: 600;
  color: #222222;
  margin-bottom: 4px;
}

.ab-log-desc {
  font-size: 13px;
  color: #999999;
}

.ab-log-right {
  flex-shrink: 0;
  padding-top: 2px;
}

// ── 上传进度 ──────────────────────────────────────────
.ab-progress-wrap {
  margin-top: 12px;
}

.ab-progress-bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.ab-progress-hint {
  font-size: 12px;
  color: #999999;
}

.ab-progress-pct {
  font-size: 13px;
  font-weight: 500;
  color: #0049FF;
}

.ab-progress-track {
  height: 6px;
  background: #E8EDF5;
  border-radius: 3px;
  overflow: hidden;
}

.ab-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #5580FF 0%, #0049FF 100%);
  border-radius: 3px;
  transition: width 0.2s ease;
}

// ── 成功提示卡 ──────────────────────────────────────────
.ab-success-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: #F0FAF2;
  border: 1px dashed #52C41A;
  border-radius: 8px;
}

.ab-success-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.ab-success-text {
  font-size: 13px;
  color: #389E0D;
}

// ── 按钮 ──────────────────────────────────────────
.ab-btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  outline: none;
  white-space: nowrap;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
}

.ab-btn--upload {
  background: #E4EAFF;
  color: #4060E0;
  font-weight: 500;
}

.ab-btn--reupload {
  background: #F5F5F8;
  color: #666666;
  border: 1px solid #E0E0E8;
}
</style>
