<template>
  <div v-if="visible" class="screen-permission-mask">
    <div class="screen-permission-dialog" role="dialog" aria-modal="true" aria-labelledby="screen-share-dialog-title">
      <template v-if="kind === 'permission'">
        <div class="screen-permission-icon">🖥️</div>
        <div id="screen-share-dialog-title" class="screen-permission-title">需要开启共享屏幕权限</div>
        <div class="screen-permission-desc">
          {{ permissionDescription }}请前往<br>
          <strong>Mac系统设置 → 隐私与安全性 → 录屏与系统录音</strong><br>
          <!-- （旧版系统为“屏幕录制”）<br> -->
          开启「Learn InClass」权限，并按系统提示<strong>重启应用</strong>。
        </div>
        <div class="screen-permission-steps">
          <div class="screen-permission-step">
            <span class="step-num">1</span>
            <span>点击「前往系统设置」按钮</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">2</span>
            <span>在列表中找到「Learn InClass」并开启权限</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">3</span>
            <span>按系统提示重新打开应用后，再次进入直播间</span>
          </div>
        </div>
        <p v-if="error" class="screen-permission-error" role="alert">{{ error }}</p>
        <div class="screen-permission-btns">
          <button type="button" class="screen-permission-btn-secondary" :disabled="opening" @click="$emit('dismiss')">稍后再说</button>
          <button type="button" class="screen-permission-btn-primary" :disabled="opening" @click="$emit('settings')">
            {{ opening ? '正在打开…' : '前往系统设置' }}
          </button>
        </div>
      </template>
      <template v-else>
        <div class="screen-permission-icon">⚠️</div>
        <div id="screen-share-dialog-title" class="screen-permission-title">屏幕共享启动失败</div>
        <div class="screen-permission-desc">
          系统暂时无法采集屏幕画面（可能由休眠唤醒或系统资源不足引起）。<br>
          请<strong>重启应用</strong>后重新尝试屏幕共享。
        </div>
        <div class="screen-permission-steps">
          <div class="screen-permission-step">
            <span class="step-num">1</span>
            <span>退出并重新打开「Learn InClass」</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">2</span>
            <span>重新进入直播间后再次开启屏幕共享</span>
          </div>
        </div>
        <div class="screen-permission-btns">
          <button type="button" class="screen-permission-btn-secondary" @click="$emit('dismiss')">知道了</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScreenShareDialog',
  props: {
    visible: Boolean,
    kind: { type: String, default: 'permission' },
    status: { type: String, default: '' },
    opening: Boolean,
    error: { type: String, default: '' }
  },
  computed: {
    permissionDescription() {
      if (this.status === 'not-determined') return '首次使用屏幕共享需要手动授权。'
      if (this.status === 'restricted') return '屏幕共享权限受到系统限制。'
      if (this.status === 'unknown') return '暂时无法确认屏幕共享权限。'
      return '屏幕共享权限尚未开启。'
    }
  }
}
</script>

<style lang="scss" scoped>
.screen-permission-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.screen-permission-dialog {
  background: #ffffff;
  border-radius: 16px;
  padding: 36px 40px 32px;
  width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.screen-permission-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.screen-permission-title {
  font-size: 20px;
  font-weight: 700;
  color: #101828;
  margin-bottom: 12px;
}
.screen-permission-desc {
  font-size: 14px;
  color: #4B5563;
  line-height: 1.7;
  margin-bottom: 20px;
}
.screen-permission-steps {
  width: 100%;
  background: #F9FAFB;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.screen-permission-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #374151;
}
.step-num {
  width: 22px;
  height: 22px;
  background: #0049FF;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.screen-permission-btns {
  display: flex;
  gap: 12px;
  width: 100%;
}
.screen-permission-btn-primary {
  flex: 1;
  height: 44px;
  background: #0049FF;
  color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #003de0; }
}
.screen-permission-btn-secondary {
  flex: 1;
  height: 44px;
  background: #F3F4F6;
  color: #6B7280;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #E5E7EB; }
}
.screen-permission-btn-primary,
.screen-permission-btn-secondary {
  border: 0;
  padding: 0 12px;
  font-family: inherit;
}
.screen-permission-btn-primary:disabled,
.screen-permission-btn-secondary:disabled {
  opacity: 0.6;
  cursor: wait;
}
.screen-permission-error {
  margin: 0 0 16px;
  color: #D92D20;
  font-size: 13px;
  line-height: 1.7;
}

</style>
