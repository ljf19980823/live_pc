<template>
  <div class="st-container">
    <!-- ── 左侧子菜单 ── -->
    <div class="st-sidebar">
      <div
        v-for="item in subMenus"
        :key="item.key"
        class="st-nav-item"
        :class="{
          active: currentSub === item.key,
          'active-cancel': currentSub === item.key && item.key === 'cancel',
          st_active: currentSub === item.key && item.key === 'password',
          st_active2: currentSub === item.key && item.key === 'about'
        }"
        @click="handleNavClick(item)"
      >
        <span class="st-nav-icon" v-html="item.icon"></span>
        <span class="st-nav-label">{{ item.label }}</span>
        <i class="el-icon-arrow-right st-nav-arrow"></i>
      </div>
    </div>

    <!-- ── 右侧内容区 ── -->
    <div class="st-content">
      <!-- 修改密码 -->
      <ChangePassword v-if="currentSub === 'password'" />

      <!-- 隐私政策 -->
      <PrivacyPolicy v-else-if="currentSub === 'privacy'" />

      <!-- 用户协议 -->
      <UserAgreement v-else-if="currentSub === 'agreement'" />

      <!-- 账号注销 -->
      <CancelAccount v-else-if="currentSub === 'cancel'" />

      <!-- 其他子页占位 -->
      <div v-else class="st-placeholder">
        <i class="el-icon-s-grid st-placeholder-icon" />
        <p>{{ currentSubLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import ChangePassword from './ChangePassword.vue'
import PrivacyPolicy from './PrivacyPolicy.vue'
import UserAgreement from './UserAgreement.vue'
import CancelAccount from './CancelAccount.vue'

export default {
  name: 'Settings',
  components: { ChangePassword, PrivacyPolicy, UserAgreement, CancelAccount },
  data() {
    return {
      currentSub: 'password',
      subMenus: [
        // {
        //   key: 'client',
        //   label: '客户端设置',
        //   icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        //     <rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
        //     <path d="M7 17h6M10 14v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        //   </svg>`
        // },
        {
          key: 'password',
          label: '修改密码',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`
        },
        {
          key: 'cache',
          label: '清理缓存',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7h10l-1 9H6L5 7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M3 7h14M8 7V5a2 2 0 0 1 4 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`
        },
        {
          key: 'privacy',
          label: '隐私政策',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>`
        },
        {
          key: 'agreement',
          label: '用户协议',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`
        },
        {
          key: 'cancel',
          label: '账号注销',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M13 4l3 3m0-3l-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`
        },
        {
          key: 'about',
          label: '关于',
          icon: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 9v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="10" cy="6.5" r="0.8" fill="currentColor"/>
          </svg>`
        }
      ]
    }
  },
  computed: {
    currentSubLabel() {
      const item = this.subMenus.find(m => m.key === this.currentSub)
      return item ? item.label : ''
    }
  },
  methods: {
    handleNavClick(item) {
      if (item.key === 'cache') {
        this.$message.success('缓存清理成功')
        return
      }
      this.currentSub = item.key
    }
  }
}
</script>

<style lang="scss" scoped>
.st-container {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  gap: 16px;
  overflow: hidden;
}

// ── 左侧子菜单 ──────────────────────────────────────
.st-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #EDEEF3;
  display: flex;
  flex-direction: column;
  padding: 0 0 0 0;
  display: inline-block;
  border-radius: 14px;
  box-sizing: border-box;
  align-self: start;
}
.st_active{
  border-radius: 14px 14px 0 0!important;
}
.st_active2{
  border-radius:  0 0 14px 14px !important;
}
.st-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  box-sizing: border-box;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;

  &:hover {
    background: #F5F7FF;
  }

  &.active {
    background: #EEF3FF;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: #0049FF;
    }

    .st-nav-label {
      color: #0049FF;
      font-weight: bold;
    }

    .st-nav-icon {
      color: #0049FF;
    }

    .st-nav-arrow {
      color: #0049FF;
    }
  }

  &.active-cancel {
    background: #FFF0F0;

    &::before {
      background: #FF3131;
    }

    .st-nav-label {
      color: #FF3131;
    }

    .st-nav-icon {
      color: #FF3131;
    }

    .st-nav-arrow {
      color: #FF3131;
    }
  }
}

.st-nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #999999;
  display: flex;
  align-items: center;
  justify-content: center;

  ::v-deep svg {
    width: 18px;
    height: 18px;
  }
}

.st-nav-label {
  flex: 1;
  font-size: 14px;
  color: #333333;
  font-weight: 400;
}

.st-nav-arrow {
  font-size: 12px;
  color: #CCCCCC;
  flex-shrink: 0;
}

// ── 右侧内容区 ──────────────────────────────────────
.st-content {
  flex: 1;
  width: 0;
  max-height: 100%;
  overflow-y: auto;
  background:#FFFFFF;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  align-self: start;
}

// 占位
.st-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 12px;

  .st-placeholder-icon {
    font-size: 40px;
  }

  p {
    font-size: 14px;
  }
}
</style>
