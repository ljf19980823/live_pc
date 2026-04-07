import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'

Vue.use(VueRouter)

// 无需登录即可访问的白名单路由
const WHITE_LIST = ['/login','/forget', '/codeLogin','/register', '/404', '/403']

/**
 * 路由配置
 * meta 字段说明：
 *   title       - 页面标题（浏览器 tab + 面包屑）
 *   icon        - 侧边栏图标（element-ui icon 名）
 *   requireAuth - 是否需要登录（默认 true）
 *   roles       - 允许访问的角色列表（为空则所有角色可访问）
 *   hidden      - 是否在侧边栏中隐藏
 *   keepAlive   - 是否缓存页面（配合 <keep-alive> 使用）
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', requireAuth: false, hidden: true }
  },
   {
    path: '/forget',
    name: 'Forget',
    component: () => import('@/views/Login/forget.vue'),
    meta: { title: '登录', requireAuth: false, hidden: true }
  },
   {
    path: '/codeLogin',
    name: 'CodeLogin',
    component: () => import('@/views/Login/codeLogin.vue'),
    meta: { title: '登录', requireAuth: false, hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home/index.vue'),
        meta: { title: '首页', icon: 'el-icon-s-home', keepAlive: true }
      },
      {
        path: 'class',
        name: 'Class',
        component: () => import('@/views/Class/index.vue'),
        meta: { title: '班级', icon: 'el-icon-office-building', keepAlive: true }
      },
      {
        path: 'live-class',
        name: 'LiveClass',
        component: () => import('@/views/LiveClass/index.vue'),
        meta: { title: '实时课堂', icon: 'el-icon-video-camera-solid', keepAlive: true }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/Resources/index.vue'),
        meta: { title: '资料中心', icon: 'el-icon-folder-opened', keepAlive: true }
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/Message/index.vue'),
        meta: { title: '消息', icon: 'el-icon-chat-dot-round', keepAlive: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人中心', hidden: true }
      }
    ]
  },
  {
    path: '/404',
    component: () => import('@/views/Error/404.vue'),
    meta: { title: '页面不存在', requireAuth: false, hidden: true }
  },
  {
    path: '/403',
    component: () => import('@/views/Error/403.vue'),
    meta: { title: '无权限访问', requireAuth: false, hidden: true }
  },
  // 兜底重定向
  { path: '*', redirect: '/404', hidden: true }
]

const router = new VueRouter({
  mode: process.env.NODE_ENV === 'production' ? 'hash' : 'history',
  base: process.env.BASE_URL || '/',
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { x: 0, y: 0 }
  }
})

// ─── 全局路由守卫 ─────────────────────────────────────────────
router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const token = getToken()
  const requireAuth = to.meta?.requireAuth !== false

  document.title = to.meta?.title
    ? `${to.meta.title} - ${process.env.VUE_APP_TITLE || '立升直播'}`
    : (process.env.VUE_APP_TITLE || '立升直播')

  if (token) {
    if (to.path === '/login') {
      next('/')
    } else {
      // 已登录但 store 中没有用户信息，尝试拉取（接口未就绪时用本地缓存兜底）
      if (!store.getters['user/userId']) {
        try {
          await store.dispatch('user/fetchUserInfo')
        } catch {
          // TODO: 联调时改为强制退出：resetToken + redirect to login
          // 开发阶段接口未就绪，直接放行（本地已有 mock 用户信息）
          console.warn('[Router] fetchUserInfo 失败，使用本地缓存继续（开发模式）')
        }
      }
      next()
    }
  } else {
    if (WHITE_LIST.includes(to.path) || !requireAuth) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
