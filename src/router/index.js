import Vue from 'vue'
import VueRouter from 'vue-router'
import store from '@/store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { getPracticeRouteConfig } from '@/utils/practiceRoute'
import { getVisitorEntryLocation } from '@/utils/visitorAccess'

Vue.use(VueRouter)

// 无需登录即可访问的白名单路由
const WHITE_LIST = ['/login','/forget', '/codeLogin', '/visitorLogin','/register', '/404', '/403']

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
    path: '/visitorLogin',
    name: 'VisitorLogin',
    component: () => import('@/views/Login/visitorLogin.vue'),
    meta: { title: '访客登录', requireAuth: false, hidden: true }
  },
  {
    path: '/announcement',
    name: 'Announcement',
    component: () => import('@/views/Announcement/index.vue'),
    meta: { title: '公告', icon: 'el-icon-chat-dot-round', keepAlive: true }
  },
  {
    path: '/learningProgress',
    name: 'LearningProgress',
    component: () => import('@/views/LearningProgress/index.vue'),
    meta: { title: '学习进度', icon: 'el-icon-chat-dot-round', keepAlive: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    // 访客只能进入独立直播入口，不能落入教师端首页。
    redirect: to => {
      const role = store.getters['user/role']
      if (role === 'VISITOR') {
        return getVisitorEntryLocation(store.getters['user/userInfo'], to.query)
      }
      return role === 'STUDENT' ? '/student/home' : '/home'
    },
    children: [
        {
        path: 'ai-listening',
        name: 'AIListening',
        component: () => import('@/components/AIListening/index.vue'),
        meta: { title: 'AI听记', hidden: true }
      },
      // ── 教师端 ──
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/teacher/Home/index.vue'),
        meta: { title: '首页', icon: 'el-icon-s-home', roles: ['teacher'] }
      },
       {
        path: 'online',
        name: 'Online',
        component: () => import('@/views/teacher/Online/index.vue'),
        meta: { title: '在线课堂', icon: 'el-icon-office-building', keepAlive: true, roles: ['teacher'] }
      },
      {
        path: 'notes',
        name: 'Notes',
        component: () => import('@/views/teacher/ZhigouNotes/index.vue'),
        meta: { title: '知构笔记', icon: 'el-icon-office-building', keepAlive: true, roles: ['teacher'] }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/teacher/Schedule/index.vue'),
        meta: { title: '课程表', icon: 'el-icon-office-building', keepAlive: true, roles: ['teacher'] }
      },
      {
        path: 'class',
        name: 'Class',
        component: () => import('@/views/teacher/Class/index.vue'),
        meta: { title: '班级', icon: 'el-icon-office-building',  keepAlive: true,roles: ['teacher'] }
      },
      {
        path: 'live-class',
        name: 'LiveClass',
        component: () => import('@/views/teacher/LiveClass/index.vue'),
        meta: { title: '实时课堂', icon: 'el-icon-video-camera-solid', roles: ['teacher'] }
      },
      {
        path: 'resources',
        name: 'Resources',
        component: () => import('@/views/teacher/Resources/index.vue'),
        meta: { title: '资料中心', icon: 'el-icon-folder-opened', keepAlive: true, roles: ['teacher'] }
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/teacher/Message/index.vue'),
        meta: { title: '消息', icon: 'el-icon-chat-dot-round', roles: ['teacher'] }
      },
      {
        path: 'set',
        name: 'Set',
        component: () => import('@/views/teacher/Set/index.vue'),
        meta: { title: '消息', icon: 'el-icon-chat-dot-round', roles: ['teacher'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人中心', hidden: true }
      },
      {
        path: 'ai-listening',
        name: 'AIListening',
        component: () => import('@/components/AIListening/index.vue'),
        meta: { title: 'AI听记', hidden: true }
      },
       
      // ── 学生端 ──
      {
        path: 'student/home',
        name: 'StudentHome',
        component: () => import('@/views/Student/Home/index.vue'),
        meta: { title: '首页', icon: 'el-icon-s-home', roles: ['student'] }
      },
      {
        path: 'student/class',
        name: 'StudentClass',
        component: () => import('@/views/Student/Class/index.vue'),
        meta: { title: '班级', icon: 'el-icon-office-building',keepAlive: true, roles: ['student'] }
      },
      {
        path: 'student/online',
        name: 'StudentOnline',
        // 与老师端共用在线课堂页（内部已按角色区分能力）
        component: () => import('@/views/Student/Online/index.vue'),
        meta: { title: '在线课堂', icon: 'el-icon-office-building', keepAlive: true,  roles: ['student'] }
      },
       {
        path: 'student/notes',
        name: 'studentNotes',
        component: () => import('@/views/Student/ZhigouNotes/index.vue'),
        meta: { title: '知构笔记', icon: 'el-icon-office-building', keepAlive: true, roles: ['student'] }
      },
      {
        path: 'student/schedule',
        name: 'studentSchedule',
        component: () => import('@/views/Student/Schedule/index.vue'),
        meta: { title: '课程表', icon: 'el-icon-office-building',  keepAlive: true, roles: ['student'] }
      },
      {
        path: 'student/live-class',
        name: 'StudentLiveClass',
        // component: () => import('@/views/Student/LiveClass/index.vue'),
        component: () => import('@/views/teacher/LiveClass/index.vue'),
        meta: { title: '实时课堂', icon: 'el-icon-video-camera-solid', roles: ['student'] }
      },
      {
        path: 'student/course',
        name: 'StudentCourse',
        component: () => import('@/views/Student/Course/index.vue'),
        meta: { title: '课程', icon: 'el-icon-folder-opened', roles: ['student'] }
      },
      {
        path: 'student/message',
        name: 'StudentMessage',
        component: () => import('@/views/Student/Message/index.vue'),
        meta: { title: '消息', icon: 'el-icon-chat-dot-round', roles: ['student'] }
      },
      {
        path: 'student/set',
        name: 'StudentSet',
        component: () => import('@/views/Student/Set/index.vue'),
        meta: { title: '消息', icon: 'el-icon-chat-dot-round', roles: ['student'] }
      },
      {
        path: 'student/profile',
        name: 'StudentProfile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人中心', hidden: true, roles: ['student'] }
      },

    ]
  },
  {
    path: '/create-practice',
    name: 'create-practice',
    component: () => import('@/views/teacher/publishTest/index.vue'),
    props: route => {
      const practiceConfig = getPracticeRouteConfig()
      return {
        practiceConfig,
        entrySource: route.query.entrySource || practiceConfig.entrySource || 'homework'
      }
    },
    meta: { title: '发布课后测', roles: ['teacher'], hidden: true }
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

  document.title = 'Learn InClass'

  // 访客也可打开账号登录页切换身份；白名单外的页面一律在身份确认后判断。
  if (WHITE_LIST.includes(to.path)) {
    const role = store.getters['user/role']
    if (to.path === '/login' && token && role && role !== 'VISITOR') {
      next('/')
      return
    }
    next()
    return
  }

  if (token) {
    if (!store.getters['user/userId'] || !store.getters['user/role']) {
      try {
        await store.dispatch('user/fetchUserInfo')
      } catch {
        // 无法确认身份时禁止继续加载业务页面。
        await store.dispatch('user/resetToken')
        next({ path: '/login', replace: true })
        return
      }
    }

    if (!store.getters['user/role']) {
      await store.dispatch('user/resetToken')
      next({ path: '/login', replace: true })
      return
    }

    if (store.getters['user/role'] === 'VISITOR') {
      const query = from.path === '/visitorLogin' ? from.query : to.query
      next(getVisitorEntryLocation(store.getters['user/userInfo'], query))
      return
    }

    next()
  } else {
    if (!requireAuth) {
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
