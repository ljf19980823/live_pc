const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const Vue = require('vue')
const sfc = require('vue/compiler-sfc')

const root = path.resolve(__dirname, '..')
const accessSource = fs.readFileSync(path.join(root, 'src/utils/loginAccess.js'), 'utf8')
  .replace('export function ', 'function ')
const component = sfc.parseComponent(fs.readFileSync(path.join(root, 'src/views/Login/index.vue'), 'utf8'))
const template = sfc.compileTemplate({ source: component.template.content, filename: 'Login.vue', transformAssetUrls: false })
assert.deepEqual(template.errors, [])

function harness(url = 'https://example.com/#/login', electronAPI, nodeEnv = 'production') {
  let now = new Date(2026, 10, 6, 12)
  const window = { location: new URL(url), electronAPI }
  const calls = []
  const writes = []
  const storage = { getItem: () => null, setItem: (...args) => writes.push(args), removeItem: key => writes.push([key]) }
  const sandbox = {
    window, URLSearchParams,
    process: { env: { NODE_ENV: nodeEnv } },
    Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now.getTime()])) } },
    localStorage: storage, setInterval, clearInterval,
    setToken: value => writes.push(['token', value]),
    setUserInfo: value => writes.push(['user', value]),
    require: name => name
  }
  for (const name of ['ssoLogin', 'codeLogin', 'chooseLogin', 'sendCode']) {
    sandbox[name] = async data => {
      calls.push({ name, data })
      return { data: { token: 'signed-in-token', role: 'TEACHER', userId: 'teacher' } }
    }
  }
  vm.createContext(sandbox)
  vm.runInContext(accessSource, sandbox)
  const options = vm.runInContext(
    component.script.content.replace(/^import .+\n/gm, '').replace('export default ', 'const options = ') +
    '\n' + template.code + '\nObject.assign(options, { render, staticRenderFns })', sandbox)
  const route = Vue.observable({ fullPath: window.location.hash.slice(1), query: {} })
  const page = new Vue({
    ...options,
    beforeCreate() {
      this.$route = route
      this.$store = { commit() {}, getters: { 'user/role': 'TEACHER' } }
      this.$router = { push() {} }
      this.$message = { warning() {}, success() {} }
    }
  })
  page.form = { userName: 'teacher', password: 'password' }
  page.phoneForm = { phone: '13800138000', code: '123456' }
  return {
    page, calls, writes, window,
    allowed: () => sandbox.isAccountLoginAllowed(),
    date: value => { now = value },
    async navigate(nextUrl) {
      window.location = new URL(nextUrl)
      route.fullPath = window.location.hash.slice(1)
      await Vue.nextTick()
    }
  }
}

function nodes(node) {
  return [node, ...(node.children || []).flatMap(nodes)]
}

test('development H5 renders login forms and allows all login actions without debug', async () => {
  const actions = { handleLogin: 'ssoLogin', handleCodeLogin: 'codeLogin', handleSendCode: 'sendCode', handleChooseLogin: 'chooseLogin' }
  for (const [action, api] of Object.entries(actions)) {
    const h = harness('http://localhost:8080/login', undefined, 'development')
    assert.equal(h.allowed(), true)
    for (const loginType of ['1', '2']) {
      h.page.loginType = loginType
      assert.equal(nodes(h.page._render()).filter(node => node.tag === 'input').length, 2)
    }
    await h.page[action]({ userId: 'teacher', role: 'TEACHER', token: 'pending-token' }, 0)
    assert.equal(h.calls[0]?.name, api, action)
    h.page.$destroy()
  }
})

test('production H5 served on localhost still requires the date key', () => {
  assert.equal(harness('http://localhost:8080/#/login').allowed(), false)
  assert.equal(harness('http://localhost:8080/#/login?debug=66').allowed(), true)
})

test('production H5 allows login without debug only on the exact test hostname', async () => {
  const testSite = harness('https://test.live.fjlsjy123.com/#/login')
  assert.equal(testSite.page.loginAllowed, true)
  await testSite.page.handleLogin()
  assert.equal(testSite.calls[0]?.name, 'ssoLogin')
  testSite.page.$destroy()

  assert.equal(harness('https://live.fjlsjy123.com/#/login').allowed(), false)
  assert.equal(harness('https://test.live.fjlsjy123.com.example.com/#/login').allowed(), false)
})

test('Electron bridge allows login without debug; an empty bridge does not', () => {
  assert.equal(harness(undefined, { getDeviceInfo() {} }).allowed(), true)
  assert.equal(harness(undefined, {}).allowed(), false)
  assert.equal(harness(undefined, { getDeviceInfo: true }).allowed(), false)
})

test('debug works before and after the hash, and with history routes', () => {
  for (const url of [
    'https://example.com/?debug=66#/login',
    'https://example.com/#/login?debug=66',
    'https://example.com/login?debug=66',
    'https://example.com/#/login?redirect=%2Fhome&debug=66'
  ]) assert.equal(harness(url).allowed(), true, url)
})

test('missing, padded, empty, incorrect and duplicate debug parameters are rejected', () => {
  for (const query of ['', '?debug', '?debug=0', '?debug=false', '?debug=1', '?debug=066', '?debug=66x', '?debug=66&debug=66', '?redirect=debug%3D66']) {
    assert.equal(harness('https://example.com/#/login' + query).allowed(), false, query)
  }
})

test('key uses the local one-based month and current date, including a day change', () => {
  const h = harness('https://example.com/#/login?debug=66')
  h.date(new Date(2026, 10, 6, 23, 59))
  assert.equal(h.allowed(), true)
  h.date(new Date(2026, 10, 7, 0, 0))
  assert.equal(h.allowed(), false)
  h.window.location = new URL('https://example.com/#/login?debug=77')
  assert.equal(h.allowed(), true)
  h.date(new Date(2026, 0, 1))
  h.window.location = new URL('https://example.com/#/login?debug=1')
  assert.equal(h.allowed(), true)
  h.date(new Date(2026, 11, 31))
  h.window.location = new URL('https://example.com/#/login?debug=372')
  assert.equal(h.allowed(), true)
})

test('blocked page renders only the client prompt; both authorized login forms render', () => {
  const blocked = harness().page
  blocked.showMask = true
  blocked.showInviteMask = true
  const blockedNodes = nodes(blocked._render())
  assert.equal(blockedNodes.some(node => node.tag === 'input'), false)
  assert.ok(blockedNodes.some(node => node.text === '请使用桌面客户端登录'))
  for (const loginType of ['1', '2']) {
    const { page } = harness('https://example.com/#/login?debug=66')
    page.loginType = loginType
    const rendered = nodes(page._render())
    assert.equal(rendered.filter(node => node.tag === 'input').length, 2)
    assert.equal(rendered.some(node => node.text === '请使用桌面客户端登录'), false)
  }
})

test('all login actions recheck access after midnight before requests or token writes', async () => {
  for (const action of ['handleLogin', 'handleCodeLogin', 'handleSendCode', 'handleChooseLogin']) {
    const h = harness('https://example.com/#/login?debug=66')
    h.page.showMask = true
    h.page.eduUserList = [{ userId: 'teacher', token: 'pending-token' }]
    h.date(new Date(2026, 10, 7))
    await h.page[action]({ userId: 'teacher', token: 'pending-token' }, 0)
    assert.equal(h.calls.length, 0, action)
    assert.equal(h.writes.length, 0, action)
    assert.equal(h.page.loginAllowed, false, action)
    assert.equal(h.page.showMask, false, action)
    assert.equal(h.page.eduUserList.length, 0, action)
  }
})

test('authorized password, SMS, code sending and identity selection still reach their APIs', async () => {
  const actions = { handleLogin: 'ssoLogin', handleCodeLogin: 'codeLogin', handleSendCode: 'sendCode', handleChooseLogin: 'chooseLogin' }
  for (const [action, api] of Object.entries(actions)) {
    const h = harness('https://example.com/#/login?debug=66')
    await h.page[action]({ userId: 'teacher', role: 'TEACHER', token: 'pending-token' }, 0)
    assert.equal(h.calls[0]?.name, api, action)
    assert.equal(h.writes.some(([key]) => key === 'debug'), false)
    h.page.$destroy()
  }
})

test('removing debug on the same page hides the form and clears identity selection', async () => {
  const h = harness('https://example.com/#/login?debug=66')
  h.page.showMask = true
  await h.navigate('https://example.com/#/login')
  assert.equal(h.page.loginAllowed, false)
  assert.equal(h.page.showMask, false)
  await h.navigate('https://example.com/#/login?debug=66')
  assert.equal(h.page.loginAllowed, true)
  assert.equal(h.writes.length, 0)
})
