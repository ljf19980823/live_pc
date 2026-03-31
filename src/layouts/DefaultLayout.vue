<template>
  <div class="layout-wrapper">
    <!-- 侧边栏 -->
    <aside class="layout-sidebar" :class="{ visible: sidebarVisible }">
      <!-- Logo 区域 -->
      <!-- <div class="sidebar-logo">
        <div class="logo-icon-wrap">
          <i class="el-icon-video-camera" />
        </div>
        <span class="logo-name">立升直播</span>
      </div> -->
     
      <!-- 菜单列表 -->
      <nav class="sidebar-nav">
        <div
          v-for="item in menuList"
          :key="item.path"
          class="nav-item"
          :class="{ active: activeMenu === item.path }"
          @click="goTo(item.path)"
          @mouseenter="hoveredMenu = item.path"
          @mouseleave="hoveredMenu = null"
        >
          <div class="nav-icon">
            <img
              :src="(activeMenu === item.path || hoveredMenu === item.path) ? item.activeIcon : item.icon"
              :alt="item.title"
            />
          </div>
          <span class="nav-label">{{ item.title }}</span>
        </div>
      </nav>

      <!-- 底部：设置 / 用户头像 -->
      <div class="sidebar-footer">
        <div
          class="nav-icon_last"
          :class="{ active: activeMenu === '/profile' }"
          @click="goTo('/profile')"
        >
          <img src="@/assets/images/head.png" class="nav-icon_img" alt="">
          <span class="nav-icon_last-label">{{ userName || '设置' }}</span>
        </div>
      </div>
    </aside>

    <!-- 移动端遮罩 -->
    <div v-if="isMobile && sidebarVisible" class="sidebar-mask" @click="sidebarVisible = false" />

    <!-- 主内容区 -->
    <div class="layout-main">
      <!-- 顶部导航栏 -->
      <header class="layout-header">
        <div class="header-left">
          <!-- 移动端汉堡按钮 -->
          <el-button
            v-if="isMobile"
            type="text"
            class="toggle-btn"
            @click="sidebarVisible = !sidebarVisible"
          >
            <i class="el-icon-menu" />
          </el-button>

          <!-- 面包屑 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="(crumb, index) in breadcrumbs"
              :key="index"
              :to="crumb.path"
            >
              {{ crumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="30" :src="avatar" icon="el-icon-user-solid" />
              <span class="user-name">{{ userName }}</span>
              <i class="el-icon-arrow-down" />
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user" /> 个人中心
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <i class="el-icon-switch-button" /> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="layout-content">
        <keep-alive :include="cachedViews">
          <router-view :key="$route.fullPath" />
        </keep-alive>
      </main>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'DefaultLayout',
  data() {
    return {
      sidebarVisible: false,
      // 一级菜单静态配置
      // icon：未选中图片；activeIcon：选中图片
      // 图片放在 src/assets/icons/menu/ 目录下，替换为实际文件即可
      hoveredMenu: null,
      menuList: [
        {
          path: '/home',
          title: '首页',
          icon: require('@/assets/icons/menu/home.png'),
          activeIcon: require('@/assets/icons/menu/home-active.png')
        },
        {
          path: '/class',
          title: '班级',
          icon: require('@/assets/icons/menu/class.png'),
          activeIcon: require('@/assets/icons/menu/class-active.png')
        },
        {
          path: '/live-class',
          title: '实时课堂',
          icon: require('@/assets/icons/menu/live-class.png'),
          activeIcon: require('@/assets/icons/menu/live-class-active.png')
        },
        {
          path: '/resources',
          title: '资料中心',
          icon: require('@/assets/icons/menu/resources.png'),
          activeIcon: require('@/assets/icons/menu/resources-active.png')
        },
        {
          path: '/message',
          title: '消息',
          icon: require('@/assets/icons/menu/message.png'),
          activeIcon: require('@/assets/icons/menu/message-active.png')
        }
      ]
    }
  },
  computed: {
    ...mapGetters('app', ['isMobile']),
    ...mapGetters('user', ['userName', 'avatar']),

    activeMenu() {
      return this.$route.path
    },

    breadcrumbs() {
      return this.$route.matched
        .filter(r => r.meta && r.meta.title)
        .map(r => ({ title: r.meta.title, path: r.path }))
    },

    cachedViews() {
      return this.$router.options.routes
        .flatMap(r => r.children || [])
        .filter(r => r.meta?.keepAlive)
        .map(r => r.name)
    }
  },
  methods: {
    ...mapActions('app', ['updateDevice']),

    goTo(path) {
      if (this.$route.path !== path) {
        this.$router.push(path)
      }
      if (this.isMobile) this.sidebarVisible = false
    },

    handleCommand(command) {
      if (command === 'profile') {
        this.$router.push('/profile')
      } else if (command === 'logout') {
        this.$confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$store.dispatch('user/logout').then(() => {
            this.$router.push('/login')
          })
        })
      }
    }
  },
  mounted() {
    this.updateDevice()
    window.addEventListener('resize', this.updateDevice)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateDevice)
  }
}
</script>

<style lang="scss" scoped>
$nav-width: 121px;
$header-h: $header-height;

// ─── 整体布局 ─────────────────────────────────────────────────
.layout-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
  min-width: 1280px;
  min-height: 720px;
  overflow: hidden;
  background: $bg-base;
}

// ─── 侧边栏 ───────────────────────────────────────────────────
.layout-sidebar {
  width: $nav-width;
  padding: 119px 16px 45px;
  box-sizing: border-box;
  height: 100%;
  background: #F0F3F6;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #EBEEF5;
  z-index: $z-fixed;
  @include scrollbar(4px, #e4e7ed);
}

// Logo
.sidebar-logo {
  @include flex-column;
  align-items: center;
  justify-content: center;
  padding: 20px 0 16px;
  border-bottom: 1px solid #F2F3F7;
  flex-shrink: 0;

  .logo-icon-wrap {
    @include flex-center;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, $color-primary, #66b1ff);
    border-radius: 12px;
    margin-bottom: 6px;

    i {
      font-size: 22px;
      color: #fff;
    }
  }

  .logo-name {
    font-size: 14px;
    color: $text-secondary;
    letter-spacing: 1px;
    white-space: nowrap;
  }
}

// 导航主体
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  @include scrollbar(3px, #e4e7ed);
}

// 通用菜单项
.nav-item {
  margin-bottom: 25px;
  @include flex-column;
  gap: 5px;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: 10px 6px;
  border-radius: 12px;
  cursor: pointer;
  transition: background $transition-fast, color $transition-fast;
  position: relative;

  .nav-icon {
    @include flex-center;
    width: 22px;
    height: 22px;
    border-radius: 10px;
    margin-bottom: 4px;
    transition: background $transition-fast;

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
      display: block;
      -webkit-user-drag: none;
      pointer-events: none;
    }
  }

  .nav-label {
    font-size: 14px;
    color: #787F8D;
    text-align: center;
    white-space: nowrap;
    font-weight: 500;
    line-height: 1.2;
    transition: color $transition-fast;
  }

  .nav-arrow {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: #C0C4CC;
  }

  &:hover:not(.active) {
    background: #F5F7FF;

    .nav-label { color: $color-primary; font-weight: 600; }
  }

  // 激活
  &.active {
    background: #FFFFFF;

    .nav-icon {
      i { color: $color-primary; }
    }

    .nav-label { color: $color-primary; font-weight: 600; }

    // 左侧激活指示线
    &::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: $color-primary;
      border-radius: 0 3px 3px 0;
    }
  }
}

// 底部区域
.sidebar-footer {
  flex-shrink: 0;
  padding: 8px 0 16px;
  border-top: 1px solid #F2F3F7;

  .nav-item {
    .nav-icon {
      width: 59px;
      height: 59px;
      border-radius: 50%;
      overflow: hidden;
    }
  }
}

// 移动端遮罩
.sidebar-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: $z-fixed - 1;
}

// ─── 主区域 ───────────────────────────────────────────────────
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.layout-header {
  display: none !important;
  @include flex-between;
  height: $header-h;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #EBEEF5;
  flex-shrink: 0;
  z-index: $z-sticky;

  .header-left {
    @include flex($align: center);
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .toggle-btn {
    font-size: 14px;
    padding: 4px;
    color: $text-regular;
    flex-shrink: 0;
  }

  .breadcrumb { min-width: 0; }

  .header-right {
    @include flex($align: center);
    gap: 16px;
    flex-shrink: 0;
  }

  .user-info {
    @include flex($align: center);
    gap: 8px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: $border-radius-md;
    transition: background $transition-fast;

    &:hover { background: $bg-base; }
  }

  .user-name {
    font-size: 13px;
    color: $text-regular;
    max-width: 100px;
    @include ellipsis;

    @include mobile { display: none; }
  }
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  @include scrollbar;
  background: #F0F3F6;
}

.nav-icon_last {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 11px;
  cursor: pointer;
}

.nav-icon_img {
  width: 59px !important;
  height: 59px !important;
  border-radius: 50%;
}

.nav-icon_last-label {
  font-weight: 500;
  font-size: 14px;
  color: #787F8D;
  transition: color $transition-fast, font-weight $transition-fast;
}

.nav-icon_last:hover .nav-icon_last-label,
.nav-icon_last.active .nav-icon_last-label {
  color: $color-primary;
  font-weight: 600;
}
</style>
