const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')
const { createRequire } = require('node:module')
const babelRequire = createRequire(require.resolve('@vue/cli-plugin-babel/package.json'))
const babel = babelRequire('@babel/core')
const parser = babelRequire('@babel/parser')
const generate = babelRequire('@babel/generator').default
const { parseComponent, compileTemplate } = require('vue/compiler-sfc')
const { registerScreenPermissionHandlers } = require('../electron/screen-permissions')

const root = path.resolve(__dirname, '..')
const quietConsole = { log() {}, warn() {}, error() {} }
const flush = () => new Promise(resolve => setImmediate(resolve))
const serviceCode = babel.transformSync(fs.readFileSync(path.join(root, 'src/utils/screenPermission.js'), 'utf8'), {
  babelrc: false,
  configFile: false,
  plugins: [babelRequire.resolve('@babel/plugin-transform-modules-commonjs')]
}).code

function loadService(bridge) {
  const module = { exports: {} }
  vm.runInNewContext(serviceCode, {
    module,
    exports: module.exports,
    require: name => {
      assert.equal(name, 'vue')
      return { observable: value => value }
    },
    window: { electronAPI: bridge },
    console: quietConsole
  })
  return module.exports
}

function owner() {
  const events = new EventEmitter()
  return {
    _isDestroyed: false,
    _inactive: false,
    $once: (event, callback) => events.once(event, callback),
    $off: (event, callback) => events.off(event, callback),
    $watch: (_, callback) => {
      events.on('route', callback)
      return () => events.off('route', callback)
    },
    events
  }
}

test('students, browsers and missing bridge capabilities enter without prompting', async () => {
  let queries = 0
  const service = loadService({ getScreenAccessStatus: () => { queries++; return 'denied' }, openScreenPreferences() {} })
  assert.equal(await service.confirmScreenPermissionBeforeEntry(0), true)
  assert.equal(queries, 0)
  assert.equal(await loadService().confirmScreenPermissionBeforeEntry(1), true)
  assert.equal(await loadService({}).confirmScreenPermissionBeforeEntry(2), true)
})

test('granted permission and failed queries do not block the classroom', async () => {
  for (const getScreenAccessStatus of [() => 'granted', () => { throw new Error('IPC failed') }, () => undefined]) {
    const service = loadService({ getScreenAccessStatus, openScreenPreferences() {} })
    assert.equal(await service.confirmScreenPermissionBeforeEntry(1), true)
    assert.equal(service.screenShareDialog.visible, false)
  }
})

for (const status of ['not-determined', 'denied', 'restricted', 'unknown']) {
  test(`${status}: a teacher or assistant can postpone authorization and enter`, async () => {
    let queries = 0
    const service = loadService({ getScreenAccessStatus: () => { queries++; return status }, openScreenPreferences() {} })
    for (const role of [1, 2]) {
      const pending = service.confirmScreenPermissionBeforeEntry(role)
      await flush()
      assert.equal(service.screenShareDialog.visible, true)
      assert.equal(service.screenShareDialog.status, status)
      service.dismissScreenShareDialog()
      assert.equal(await pending, true)
      assert.equal(service.screenShareDialog.visible, false)
    }
    assert.equal(queries, 2, 'each entry must read current permission')
  })
}

test('opening settings stops this entry and the next entry rechecks authorization', async () => {
  let status = 'denied'
  let opened = 0
  const service = loadService({
    getScreenAccessStatus: () => status,
    openScreenPreferences: () => { opened++; return { success: true } }
  })
  const pending = service.confirmScreenPermissionBeforeEntry(1)
  await flush()
  await service.openScreenPreferences()
  assert.equal(await pending, false)
  assert.equal(opened, 1)
  status = 'granted'
  assert.equal(await service.confirmScreenPermissionBeforeEntry(1), true)
})

test('failed settings navigation keeps the guide open and allows postponing', async () => {
  for (const result of [{ success: false }, new Error('IPC failed')]) {
    const service = loadService({
      getScreenAccessStatus: () => 'denied',
      openScreenPreferences: () => result instanceof Error ? Promise.reject(result) : result
    })
    const pending = service.confirmScreenPermissionBeforeEntry(1)
    await flush()
    await service.openScreenPreferences()
    assert.equal(service.screenShareDialog.visible, true)
    assert.match(service.screenShareDialog.error, /Learn InClass/)
    assert.equal(service.screenShareDialog.opening, false)
    service.dismissScreenShareDialog()
    assert.equal(await pending, true)
  }
})

test('repeated entry clicks do not issue additional checks or create another pending entry', async () => {
  let finishQuery
  let queries = 0
  const service = loadService({
    getScreenAccessStatus: () => { queries++; return new Promise(resolve => { finishQuery = resolve }) },
    openScreenPreferences() {}
  })
  const pending = service.confirmScreenPermissionBeforeEntry(1)
  assert.equal(await service.confirmScreenPermissionBeforeEntry(1), false)
  finishQuery('denied')
  await flush()
  assert.equal(await service.confirmScreenPermissionBeforeEntry(2), false)
  service.dismissScreenShareDialog()
  assert.equal(await pending, true)
  assert.equal(queries, 1)
})

for (const event of ['hook:beforeDestroy', 'hook:deactivated', 'route']) {
  test(`${event}: abandoning the page cancels a pending entry and removes temporary listeners`, async () => {
    const page = owner()
    const service = loadService({ getScreenAccessStatus: () => 'denied', openScreenPreferences() {} })
    const pending = service.confirmScreenPermissionBeforeEntry(1, page)
    await flush()
    page.events.emit(event)
    assert.equal(await pending, false)
    assert.equal(service.screenShareDialog.visible, false)
    assert.equal(page.events.eventNames().length, 0)
  })
}

test('a page destroyed during the permission query does not show a late dialog', async () => {
  const page = owner()
  let finishQuery
  const service = loadService({
    getScreenAccessStatus: () => new Promise(resolve => { finishQuery = resolve }),
    openScreenPreferences() {}
  })
  const pending = service.confirmScreenPermissionBeforeEntry(1, page)
  page.events.emit('hook:beforeDestroy')
  finishQuery('denied')
  assert.equal(await pending, false)
  assert.equal(service.screenShareDialog.visible, false)
})

test('native permission and capture-failure listeners register once and reuse one global dialog', () => {
  const callbacks = {}
  let subscriptions = 0
  let removals = 0
  const subscribe = kind => callback => {
    subscriptions++
    callbacks[kind] = callback
    return () => { removals++ }
  }
  const service = loadService({
    onScreenPermissionDenied: subscribe('permission'),
    onScreenCaptureFailed: subscribe('failure')
  })
  const remove = service.initializeScreenShareDialogs()
  assert.equal(service.initializeScreenShareDialogs(), remove)
  assert.equal(subscriptions, 2)
  callbacks.permission({ status: 'denied' })
  callbacks.failure()
  assert.equal(service.screenShareDialog.kind, 'permission')
  service.dismissScreenShareDialog()
  callbacks.failure()
  assert.equal(service.screenShareDialog.kind, 'capture-failed')
  remove()
  remove()
  assert.equal(removals, 2)
  assert.equal(service.screenShareDialog.visible, false)
})

function nativeHandlers({ platform = 'darwin', status = 'denied', registrationFails = false, navigationFails = false } = {}) {
  const handlers = {}
  const calls = []
  registerScreenPermissionHandlers({
    platform,
    ipcMain: { handle: (name, handler) => { handlers[name] = handler } },
    systemPreferences: { getMediaAccessStatus: type => { calls.push(`status:${type}`); return status } },
    desktopCapturer: { getSources: async options => {
      assert.deepEqual(options.types, ['screen'])
      assert.deepEqual(options.thumbnailSize, { width: 1, height: 1 })
      calls.push('register')
      if (registrationFails) throw new Error('registration failed')
      return []
    } },
    shell: { openExternal: async url => {
      assert.match(url, /Privacy_ScreenCapture$/)
      calls.push('open')
      if (navigationFails) throw new Error('navigation failed')
    } }
  })
  return { handlers, calls }
}

test('native status query only reads screen permission and never starts registration', () => {
  const { handlers, calls } = nativeHandlers()
  assert.equal(handlers['get-screen-access-status'](), 'denied')
  assert.deepEqual(calls, ['status:screen'])
})

test('native settings navigation still runs when registration fails', async () => {
  const { handlers, calls } = nativeHandlers({ registrationFails: true })
  assert.equal((await handlers['open-screen-preferences']()).success, true)
  assert.deepEqual(calls, ['status:screen', 'register', 'open'])
})

test('native settings errors are reported and authorized users skip registration', async () => {
  const { handlers, calls } = nativeHandlers({ status: 'granted', navigationFails: true })
  const result = await handlers['open-screen-preferences']()
  assert.equal(result.success, false)
  assert.match(result.message, /Learn InClass/)
  assert.deepEqual(calls, ['status:screen', 'open'])
})

test('non-macOS native handlers grant access without querying or opening settings', async () => {
  const { handlers, calls } = nativeHandlers({ platform: 'win32' })
  assert.equal(handlers['get-screen-access-status'](), 'granted')
  assert.equal((await handlers['open-screen-preferences']()).success, true)
  assert.deepEqual(calls, [])
})

const entryPoints = [
  ['Home', 'enterLiveRoom'],
  ['Online', 'enterLiveRoom'],
  ['Online', 'enterLiveFromDetail'],
  ['LiveClass', 'enterLiveRoom'],
  ['LiveClass', 'enterLiveFromDetail'],
  ['Class', 'enterLiveRoom'],
  ['Schedule', 'enterLiveRoom'],
  ['Set', 'enterLiveRoomFromSchedule']
]

for (const [page, methodName] of entryPoints) {
  test(`${page}.${methodName}: the real entry handler waits before mounting or preparing devices`, async () => {
    const source = fs.readFileSync(path.join(root, `src/views/teacher/${page}/index.vue`), 'utf8')
    const script = parseComponent(source).script.content
    const ast = parser.parse(script, { sourceType: 'module' })
    const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration
    const methods = component.properties.find(node => node.key.name === 'methods').value
    const method = methods.properties.find(node => node.key.name === methodName)
    assert.ok(method)
    for (const continueEntry of [false, true]) {
      let resolveCheck
      let preparationCount = 0
      const item = { id: 'live', liveId: 'live', liveLessonId: 'room', startTime: '2020-01-01 10:00:00', fullStartTime: '2020-01-01 10:00:00' }
      const context = {
        isTeacher: true,
        limitTimeTeacher: 30,
        liveUrl: '',
        activeTab: 'live',
        showLiveIframe: false,
        selectedCourseItem: item,
        prepareElectronMediaPermissions: () => { preparationCount++ },
        $message: { warning: message => assert.fail(message) }
      }
      const entry = vm.runInNewContext(`({ ${generate(method).code} })`, {
        console: quietConsole,
        process: { env: { NODE_ENV: 'production' } },
        window: { electronAPI: { getMediaAccessStatus: () => { preparationCount++; return 'granted' } } },
        getUserInfo: () => ({ userId: 'teacher', realName: 'Test', userName: 'Test', role: 'TEACHER' }),
        getToken: () => 'test-token',
        confirmScreenPermissionBeforeEntry: (role, owner) => {
          assert.equal(role, 1)
          assert.equal(owner, context)
          return new Promise(resolve => { resolveCheck = resolve })
        }
      })[methodName]
      const pending = entry.call(context, item)
      await flush()
      assert.equal(context.liveUrl, '')
      assert.equal(preparationCount, 0)
      resolveCheck(continueEntry)
      await pending
      if (continueEntry) {
        assert.match(context.liveUrl, /classroomId=room/)
        assert.ok(context.showLiveIframe || context.activeTab === 'liveui')
        assert.ok(preparationCount > 0)
      } else {
        assert.equal(context.liveUrl, '')
        assert.equal(context.showLiveIframe, false)
        assert.equal(context.activeTab, 'live')
        assert.equal(preparationCount, 0)
      }
    }
  })
}

test('the extracted dialog template compiles and contains current application and settings names', () => {
  const filename = path.join(root, 'src/components/ScreenShareDialog/index.vue')
  const source = fs.readFileSync(filename, 'utf8')
  const descriptor = parseComponent(source)
  const compiled = compileTemplate({ source: descriptor.template.content, filename })
  assert.deepEqual(compiled.errors, [])
  assert.match(source, /Learn InClass/)
  assert.match(source, /录屏与系统录音/)
  assert.doesNotMatch(source, /立升直播/)
})
