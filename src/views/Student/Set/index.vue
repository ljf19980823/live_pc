<template>
  <div class="set-page">
    <!-- ── 左侧导航栏 ─────────────────── -->
    <aside class="set-sidebar">
      <!-- 用户信息头部 -->
      <div class="sidebar-user">
        <div class="su-avatar">思雅</div>
        <div class="su-meta">
          <span class="su-name">fjlsjy思雅同学</span>
        </div>
        <i class="el-icon-arrow-right su-arrow" />
      </div>

      <!-- 菜单列表 -->
      <nav class="set-nav">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="set-nav-item"
          :class="{ active: currentMenu === item.key }"
          @click="switchMenu(item.key)"
        >
          <i :class="item.icon" class="item-icon" />
          <span class="item-label">{{ item.label }}</span>
          <i class="el-icon-arrow-right item-arrow" />
        </div>
      </nav>

      <!-- 退出登录 -->
      <div class="set-logout" @click="handleLogout">
        <i class="el-icon-s-promotion" />
        <span>退出登录</span>
      </div>
    </aside>

    <!-- ── 右侧内容区 ─────────────────── -->
    <main class="set-content">

      <!-- ─── 我的信息 ─── -->
      <section v-if="currentMenu === 'info' && !showVerifyPhone">
        <h2 class="content-title">我的信息</h2>

        <!-- 用户信息卡片 -->
        <div class="white-card user-top-card">
          <div class="utc-left">
            <div class="utc-avatar">思雅</div>
            <div class="utc-info">
              <div class="utc-name">思雅同学</div>
              <div class="utc-role">学生 · fjlsjy思雅同学</div>
            </div>
          </div>
          <div class="utc-right">
            <template v-if="!isEditing">
              <el-button type="primary" @click="isEditing = true">
                <i class="el-icon-edit" /> 编辑信息
              </el-button>
            </template>
            <template v-else>
              <el-button @click="isEditing = false">
                <i class="el-icon-close" /> 取消
              </el-button>
              <el-button type="primary" @click="handleSave">
                <i class="el-icon-check" /> 保存
              </el-button>
            </template>
          </div>
        </div>

        <!-- 基本信息表单 -->
        <div class="white-card form-card">
          <p class="section-label">基本信息</p>

          <div class="form-field">
            <label>姓名</label>
            <el-input v-model="form.name" :disabled="!isEditing" />
          </div>

          <div class="form-field">
            <label>手机号码</label>
            <div class="phone-row">
              <el-input :value="'+86 ' + form.phone" disabled />
              <span class="inline-link" @click="openVerifyPhone">修改</span>
            </div>
          </div>

          <div class="form-field">
            <label>邮箱</label>
            <el-input v-model="form.email" :disabled="!isEditing" placeholder="请输入邮箱地址" />
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="info-notice">
          <i class="el-icon-info notice-icon" />
          <span>个人信息仅用于平台内部展示，修改后实时生效。如需修改手机号码，请点击"修改"并完成验证。</span>
        </div>
      </section>

      <!-- ─── 其他菜单占位 ─── -->
      <section v-else-if="currentMenu !== 'info' && !showVerifyPhone" class="placeholder-section">
        <div class="placeholder-inner">
          <i class="el-icon-s-grid placeholder-icon" />
          <p>{{ currentMenuLabel }}</p>
        </div>
      </section>

      <!-- ─── 身份验证 ─── -->
      <section v-if="showVerifyPhone" class="verify-section">
        <div class="verify-header">
          <span class="back-btn" @click="showVerifyPhone = false">
            <i class="el-icon-arrow-left" /> 返回
          </span>
          <span class="verify-page-title">身份验证</span>
        </div>

        <div class="white-card verify-card">
          <h3 class="verify-sub">请先验证已绑定的手机号码</h3>

          <el-input v-model="verifyForm.phone" disabled class="verify-input" />

          <div class="code-row">
            <el-input v-model="verifyForm.code" placeholder="请输入验证码" />
            <span
              class="get-code-btn"
              :class="{ counting }"
              @click="startCountdown"
            >{{ counting ? `${countdown}s 后重发` : '获取验证码' }}</span>
          </div>

          <el-button
            type="primary"
            class="next-btn"
            :disabled="!verifyForm.code"
          >下一步</el-button>

          <p class="verify-note">如原手机号无法获取验证码，请联系老师修改</p>
        </div>
      </section>

    </main>
  </div>
</template>

<script>
export default {
  name: 'StudentSet',
  data() {
    return {
      currentMenu: 'info',
      isEditing: false,
      showVerifyPhone: false,
      form: {
        name: '思雅',
        phone: '19859650891',
        email: ''
      },
      verifyForm: {
        phone: '19859650891',
        code: ''
      },
      counting: false,
      countdown: 60,
      countdownTimer: null,
      menuItems: [
        { key: 'info',     label: '我的信息',     icon: 'el-icon-user' },
        { key: 'schedule', label: '我的课表',     icon: 'el-icon-date' },
        { key: 'device',   label: '设备和网络检测', icon: 'el-icon-monitor' },
        { key: 'settings', label: '设置',         icon: 'el-icon-setting' }
      ]
    }
  },
  computed: {
    currentMenuLabel() {
      const item = this.menuItems.find(m => m.key === this.currentMenu)
      return item ? item.label : ''
    }
  },
  methods: {
    switchMenu(key) {
      this.currentMenu = key
      this.showVerifyPhone = false
      this.isEditing = false
    },
    openVerifyPhone() {
      this.showVerifyPhone = true
    },
    handleSave() {
      this.isEditing = false
    },
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('user/logout').then(() => {
          this.$router.push('/login')
        })
      }).catch(() => {})
    },
    startCountdown() {
      if (this.counting) return
      this.counting = true
      this.countdown = 60
      this.countdownTimer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.counting = false
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    }
  },
  beforeDestroy() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  }
}
</script>

<style lang="scss" scoped>

.set-page {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #F0F3F6;
}

.set-sidebar {
  width: 213px;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 16px 20px;
  border-bottom: 1px solid #F2F3F7;
  cursor: pointer;
}

.su-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: $color-primary;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.su-meta {
  flex: 1;
  min-width: 0;
}

.su-name {
  font-size: 13px;
  color: $text-regular;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.su-arrow {
  font-size: 12px;
  color: #C0C4CC;
  flex-shrink: 0;
}

.set-nav {
  flex: 1;
  padding: 10px 10px 0;
}

.set-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background $transition-fast;
  position: relative;
  margin-bottom: 2px;

  .item-icon {
    font-size: 18px;
    color: #787F8D;
    flex-shrink: 0;
    transition: color $transition-fast;
  }

  .item-label {
    flex: 1;
    font-size: 14px;
    color: #787F8D;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-arrow {
    font-size: 12px;
    color: #C0C4CC;
    flex-shrink: 0;
    transition: color $transition-fast;
  }

  &:hover:not(.active) {
    background: #F5F7FF;

    .item-icon,
    .item-label { color: $color-primary; }
  }

  &.active {
    background: #EEF2FF;

    .item-icon,
    .item-label {
      color: $color-primary;
      font-weight: 600;
    }

    .item-arrow { color: $color-primary; }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 22px;
      background: $color-primary;
      border-radius: 0 3px 3px 0;
    }
  }
}

.set-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 24px;
  border-top: 1px solid #F2F3F7;
  cursor: pointer;
  font-size: 14px;
  color: $text-secondary;
  transition: color $transition-fast;

  i { font-size: 16px; }

  &:hover { color: $color-danger; }
}

.set-content {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
  min-width: 0;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 18px;
}

.white-card {
  background: #fff;
  border-radius: $border-radius-lg;
  padding: 20px 24px;
  margin-bottom: 14px;
}

.user-top-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
}

.utc-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.utc-avatar {
  width: 58px;
  height: 58px;
  border-radius: 14px;
  background: $color-primary;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.utc-name {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 5px;
}

.utc-role {
  font-size: 13px;
  color: $text-secondary;
}

.utc-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-card {
  .section-label {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 18px;
  }
}

.form-field {
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 8px;
  }
}

.phone-row {
  display: flex;
  align-items: center;
  position: relative;

  .el-input { flex: 1; }

  .inline-link {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    z-index: 1;

    &:hover { opacity: 0.8; }
  }
}

.info-notice {
  background: #EEF3FF;
  border-radius: $border-radius-lg;
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  .notice-icon {
    font-size: 16px;
    color: $color-primary;
    margin-top: 1px;
    flex-shrink: 0;
  }

  span {
    font-size: 13px;
    color: #4D6FD1;
    line-height: 1.7;
  }
}

.placeholder-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.placeholder-inner {
  text-align: center;
  color: $text-secondary;

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.4;
  }

  p {
    font-size: 14px;
    margin: 0;
    opacity: 0.5;
  }
}

.verify-header {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  position: relative;
  min-height: 28px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: $text-regular;
  cursor: pointer;
  transition: color $transition-fast;

  i { font-size: 14px; }

  &:hover { color: $color-primary; }
}

.verify-page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  white-space: nowrap;
}

.verify-card {
  max-width: 520px;

  .verify-sub {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 22px;
  }

  .verify-input {
    margin-bottom: 14px;
  }
}

.code-row {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 22px;

  .el-input { flex: 1; }

  .get-code-btn {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    z-index: 1;

    &.counting {
      color: $text-secondary;
      cursor: default;
    }

    &:not(.counting):hover { opacity: 0.8; }
  }
}

.next-btn {
  width: 100%;
  margin-bottom: 16px;
  font-size: 15px;
  height: 42px;

  &.is-disabled {
    background: #A8BFFF !important;
    border-color: #A8BFFF !important;
    color: #fff !important;
    cursor: not-allowed;
    opacity: 1 !important;
  }
}

.verify-note {
  text-align: center;
  font-size: 13px;
  color: $text-secondary;
  margin: 0;
}
</style>
