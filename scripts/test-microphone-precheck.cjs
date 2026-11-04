const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const actual = process.env.LISHENG_HOST_ROOT || path.resolve(__dirname, '..')
const dependencyRoot = process.env.LISHENG_HOST_DEPENDENCIES || actual
const projectRequire = createRequire(path.join(dependencyRoot, 'package.json'))
const babelRequire = createRequire(projectRequire.resolve('@vue/cli-plugin-babel/package.json'))
const babel = babelRequire('@babel/core')
const { parseComponent, compileTemplate } = projectRequire('vue/compiler-sfc')
function load(code, globals, require) {
  const module = { exports: {} }
  vm.runInNewContext(babel.transformSync(code, {
    babelrc: false, configFile: false,
    plugins: [babelRequire.resolve('@babel/plugin-transform-modules-commonjs')]
  }).code, { module, exports: module.exports, URL, URLSearchParams, ...globals, require })
  return module.exports
}
test('only normal teacher classroom URLs opt in, preserving version, token and hash', () => {
  const { withClassroomAppVersion: url } = load(fs.readFileSync(path.join(actual, 'src/utils/classroomUrl.js'), 'utf8'), {
    window: { location: { href: 'http://localhost:8080/' } }
  }, () => ({ version: 'test-version' }))
  const teacher = new URL(url('https://class.test/auikits/?role=1&token=some-token#/classroom?id=room'))
  assert.equal(teacher.searchParams.get('precheck'), '1')
  assert.equal(teacher.searchParams.get('appVersion'), 'test-version')
  assert.equal(teacher.searchParams.get('token'), 'some-token')
  assert.equal(teacher.hash, '#/classroom?id=room')
  for (const query of ['?role=0', '?role=2', '?role=1&afterClassTest=1', '?role=1#/classroom?afterClassTest=1']) {
    assert.equal(new URL(url(`https://class.test/${query}`)).searchParams.has('precheck'), false)
  }
})
function harness() {
  const descriptor = parseComponent(fs.readFileSync(path.join(actual, 'src/components/LiveClassroomFrame/index.vue'), 'utf8'))
  assert.deepEqual(descriptor.errors, [])
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'LiveClassroomFrame.vue', id: 'mic-check' }).errors, [])
  let nextTimer = 0
  const timers = new Map()
  const Component = load(descriptor.script.content, {
    navigator: { onLine: true },
    window: { setTimeout: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id }, clearTimeout: id => timers.delete(id) }
  }, () => ({ getUserInfo: () => ({ role: 'TEACHER' }) })).default
  const source = {}
  const ctx = { ...Component.data(), ...Component.methods,
    src: 'https://class.test/?role=1&precheck=1',
    $refs: { frame: { contentWindow: source } }, $emit() {},
  }
  for (const [name, getter] of Object.entries(Component.computed)) Object.defineProperty(ctx, name, { get: () => getter.call(ctx) })
  ctx.setScreenSharing = () => {}
  ctx.currentSrc = ctx.src
  ctx.beginLoading(30000)
  const send = (type, event = {}) => ctx.handleMessage({ source, origin: 'https://class.test', data: { type }, ...event })
  return { ctx, timers, send }
}
test('precheck removes the overlay and ignores a later React bootstrap timeout', () => {
  const { ctx, timers, send } = harness()
  assert.equal(timers.size, 1)
  send('CLASSROOM_PRECHECK_READY')
  assert.equal(ctx.status, 'precheck')
  assert.equal(timers.size, 0)
  send('CLASSROOM_BOOTSTRAP')
  assert.equal(ctx.status, 'precheck')
  assert.equal(timers.size, 0, 'human device checks are never timed as a network connection')
  send('CLASSROOM_ENTERING')
  assert.equal(ctx.status, 'loading')
  assert.equal(timers.size, 1)
  assert.equal([...timers.values()][0].ms, 90000)
  send('CLASSROOM_READY')
  assert.equal(ctx.status, 'ready')
  assert.equal(timers.size, 0)
})
test('only the current iframe and its expected origin can change precheck state', () => {
  const { ctx, send } = harness()
  send('CLASSROOM_PRECHECK_READY', { source: {} })
  assert.equal(ctx.status, 'loading')
  send('CLASSROOM_PRECHECK_READY', { origin: 'https://other.test' })
  assert.equal(ctx.status, 'loading')
  ctx.src = 'https://class.test/?role=0'
  ctx.currentSrc = ctx.src
  send('CLASSROOM_PRECHECK_READY')
  assert.equal(ctx.status, 'loading')
})
test('classroom errors and retries still restore ordinary connection handling', () => {
  const { ctx, timers, send } = harness()
  send('CLASSROOM_PRECHECK_READY')
  send('CLASSROOM_ENTERING')
  send('CLASSROOM_ERROR')
  assert.equal(ctx.status, 'error')
  assert.equal(timers.size, 0)
  ctx.retry()
  assert.equal(ctx.status, 'loading')
  assert.equal(new URL(ctx.currentSrc).searchParams.get('precheck'), '1')
  assert.equal(timers.size, 1)
})
