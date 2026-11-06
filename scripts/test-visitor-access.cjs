process.env.NODE_ENV = 'production'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const Vue = require('vue')
const Vuex = require('vuex')
const VueRouter = require('vue-router')

Vue.use(Vuex)
Vue.use(VueRouter)

const root = path.resolve(__dirname, '..')
function load(relativePath, globals, exportExpression) {
  let source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  if (relativePath.endsWith('.vue')) source = require('vue/compiler-sfc').parseComponent(source).script.content
  source = source
    .replace(/^import .+\n/gm, '')
    .replace(/export default /, 'module.exports = ')
    .replace(/export function /g, 'function ')
  const context = { ...globals, module: { exports: {} } }
  vm.runInNewContext(source + (exportExpression ? `\nmodule.exports = ${exportExpression}` : ''), context)
  return context.module.exports
}

function harness({ cachedInfo = {}, responseInfo, failInfo = false, token: initialToken = 'token' } = {}) {
  let token = initialToken
  let infoCalls = 0
  const loadedPages = []
  const user = load('src/store/modules/user.js', {
    getToken: () => token,
    setToken: value => { token = value },
    clearAuth: () => { token = '' },
    getStoredUserInfo: () => ({ ...cachedInfo }),
    setUserInfo() {},
    console: { log() {}, warn() {} },
    async getUserInfo() {
      infoCalls++
      if (failInfo) throw new Error('network failed')
      return { data: responseInfo || cachedInfo }
    }
  })
  const store = new Vuex.Store({ modules: { user } })
  const { getVisitorEntryLocation } = load('src/utils/visitorAccess.js', {}, '{ getVisitorEntryLocation }')
  function TestRouter(options) {
    function stubComponents(routes) {
      for (const route of routes) {
        if (route.component) {
          const name = route.name || route.path
          route.component = () => {
            loadedPages.push(name)
            return Promise.resolve({ render: h => h('div') })
          }
        }
        if (route.children) stubComponents(route.children)
      }
    }
    stubComponents(options.routes)
    return new VueRouter({ ...options, mode: 'abstract' })
  }
  TestRouter.install = () => {}
  const router = load('src/router/index.js', {
    Vue, VueRouter: TestRouter, store,
    NProgress: { start() {}, done() {} },
    getToken: () => token,
    getPracticeRouteConfig: () => ({}),
    getVisitorEntryLocation,
    process: { env: { NODE_ENV: 'production' } },
    document: {},
    console: { log() {}, warn() {} }
  })
  return {
    router, store, loadedPages,
    get infoCalls() { return infoCalls },
    get token() { return token },
    async go(location) {
      try { await router.push(location) } catch (error) {
        if (!VueRouter.isNavigationFailure(error)) throw error
      }
      await new Promise(resolve => setImmediate(resolve))
      return router.currentRoute
    }
  }
}

const visitor = { role: 'VISITOR', userId: 'guest-id', liveId: 'live-id', classroomId: 'classroom-id' }

test('visitors cannot load any business route, including routes without roles metadata', async () => {
  const { router } = harness({ cachedInfo: visitor })
  const businessPaths = router.options.routes.flatMap(route => {
    if (route.children) return ['/', ...route.children.map(child => '/' + child.path)]
    return route.meta?.requireAuth !== false && route.path !== '*' ? [route.path] : []
  })
  for (const target of new Set(businessPaths)) {
    const h = harness({ cachedInfo: visitor })
    const route = await h.go(target)
    assert.equal(route.path, '/visitorLogin', target)
    assert.equal(route.query.liveid, 'live-id', target)
    assert.equal(route.query.classroomId, 'classroom-id', target)
    assert.deepEqual(h.loadedPages, ['VisitorLogin'], target + ' must be blocked before loading its component')
  }
})

test('visitors can open login, password recovery, classroom entry and error pages', async () => {
  for (const target of ['/login', '/codeLogin', '/forget', '/visitorLogin?liveid=shared-live', '/403', '/404']) {
    const h = harness({ cachedInfo: visitor })
    assert.equal((await h.go(target)).fullPath, target)
    assert.equal(h.infoCalls, 0)
  }
})

test('new routes are denied to visitors even when marked public outside the visitor allowlist', async () => {
  const h = harness({ cachedInfo: visitor })
  let loaded = false
  h.router.addRoute({
    path: '/new-page',
    meta: { requireAuth: false },
    component: () => { loaded = true; return Promise.resolve({}) }
  })
  assert.equal((await h.go('/new-page')).path, '/visitorLogin')
  assert.equal(loaded, false)
})

test('navigation away from the classroom retains its link parameters and replaces the denied entry', async () => {
  const h = harness({ cachedInfo: visitor })
  await h.go('/visitorLogin?liveid=current-live&classroomId=current-classroom')
  const route = await h.go('/resources?redirect=/home&token=untrusted')
  assert.equal(route.path, '/visitorLogin')
  assert.equal(route.query.liveid, 'current-live')
  assert.equal(route.query.classroomId, 'current-classroom')
  assert.equal(route.query.redirect, undefined)
  assert.equal(route.query.token, undefined)
  assert.equal(h.router.history.stack.some(entry => entry.path === '/resources'), false)
})

test('a token-only session is checked before loading a protected page and gets visitor restrictions', async () => {
  const h = harness({ responseInfo: visitor })
  assert.equal((await h.go('/resources')).path, '/visitorLogin')
  assert.equal(h.infoCalls, 1)
  assert.equal(h.store.getters['user/role'], 'VISITOR')
  assert.equal(h.store.getters['user/userId'], 'guest-id')
  await h.go('/online')
  assert.equal(h.infoCalls, 1, 'userId from the API must prevent repeated identity requests')
  assert.equal(h.loadedPages.includes('Resources'), false)
  assert.equal(h.loadedPages.includes('Online'), false)
})

test('an identity lookup failure or missing role cannot load a protected page or cause a login loop', async () => {
  for (const config of [{ failInfo: true }, { responseInfo: { userId: 'unknown' } }]) {
    const h = harness(config)
    assert.equal((await h.go('/resources')).path, '/login')
    assert.equal(h.token, '')
    assert.equal(h.loadedPages.includes('Resources'), false)
    assert.equal(h.infoCalls, 1)
  }
})

test('teacher and student home routing and anonymous login redirects continue to work', async () => {
  for (const [role, home] of [['TEACHER', '/home'], ['STUDENT', '/student/home']]) {
    const h = harness({ cachedInfo: { role, userId: 'member' } })
    assert.equal((await h.go('/')).path, home)
    assert.equal((await h.go('/login')).path, home)
    assert.equal(h.infoCalls, 0)
  }
  const h = harness({ token: '' })
  const route = await h.go('/resources')
  assert.equal(route.path, '/login')
  assert.equal(route.query.redirect, '/resources')
  assert.equal(h.loadedPages.includes('Resources'), false)
})

test('cached legacy id remains supported', () => {
  const h = harness({ cachedInfo: { role: 'TEACHER', id: 'legacy-id' } })
  assert.equal(h.store.getters['user/userId'], 'legacy-id')
})

test('visitor login saves the live link context for later blocked-route recovery', () => {
  let savedInfo
  const definition = load('src/views/Login/visitorLogin.vue', {
    LiveClassroomFrame: {},
    setToken() {},
    setUserInfo: info => { savedInfo = info }
  })
  definition.methods.saveLoginData.call({
    liveId: 'shared-live', classroomId: 'shared-classroom',
    form: { userName: 'Guest', phone: '13800000000' },
    $store: { commit() {} }
  }, { token: 'guest-token', userId: 'guest-id', role: 'VISITOR' })
  assert.equal(savedInfo.liveId, 'shared-live')
  assert.equal(savedInfo.classroomId, 'shared-classroom')
  assert.equal(savedInfo.role, 'VISITOR')
})

test('visitors have no business sidebar links or teacher settings entry', () => {
  const layout = load('src/layouts/DefaultLayout.vue', {
    mapGetters: () => ({}), mapActions: () => ({})
  })
  assert.equal(layout.computed.menuList.call({ role: 'VISITOR' }).length, 0)
  assert.equal(layout.computed.setPath.call({ role: 'VISITOR' }), '/visitorLogin')
})
