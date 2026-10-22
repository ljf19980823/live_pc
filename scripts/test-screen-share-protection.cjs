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
const { parseComponent } = require('vue/compiler-sfc')
const root = path.resolve(__dirname, '..')

function nativeSource() {
  const ast = parser.parse(fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8'))
  const declarations = []
  const handlers = []
  const variables = new Set(['mainWindow', 'screenGuardInterval', 'consecutiveDetections', 'screenGuardChecking',
    'screenGuardAlerting', 'screenGuardEnabled', 'allowTeacherScreenShare', 'teacherScreenSharing'])
  const functions = new Set(['updateWindowContentProtection', 'setTeacherScreenSharing', 'startScreenGuard', 'stopScreenGuard'])
  for (const node of ast.program.body) {
    if (node.type === 'VariableDeclaration') {
      const selected = node.declarations.filter(item => variables.has(item.id.name))
      if (selected.length) declarations.push(generate({ ...node, declarations: selected }).code)
    }
    if (node.type === 'FunctionDeclaration' && functions.has(node.id.name)) declarations.push(generate(node).code)
  }
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'on') {
      const event = node.arguments[0]?.value
      if ((node.callee.object.name === 'ipcMain' && ['set-screen-guard', 'set-classroom-screen-sharing'].includes(event)) ||
          (node.callee.object.object?.name === 'mainWindow' && event === 'render-process-gone')) handlers.push(generate(node).code)
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(ast.program)
  return declarations.join('\n') + '\nmainWindow = providedWindow;\n' + handlers.join('\n') + `
    function checkScreenGuard() { pollCalls++; }
    function scheduleScreenGuardInterval() { screenGuardInterval = 1; }
  `
}

function harness(role = 'TEACHER') {
  const protectedStates = []
  const ipcMain = new EventEmitter()
  const webContents = new EventEmitter()
  webContents.send = () => {}
  webContents.getURL = () => 'file:///app/dist/index.html'
  webContents.getOSProcessId = () => 1
  const main = {
    webContents, destroyed: false,
    isDestroyed() { return this.destroyed },
    setContentProtection: enabled => protectedStates.push(enabled)
  }
  const native = vm.createContext({
    providedWindow: main, ipcMain, pollCalls: 0, clearInterval() {},
    appendCrashLog() {}, getCrashDumpsDirectory: () => '/tmp'
  })
  vm.runInContext(nativeSource(), native)

  let bridge
  vm.runInNewContext(fs.readFileSync(path.join(root, 'electron/preload.js'), 'utf8'), {
    require: name => {
      assert.equal(name, 'electron')
      return {
        contextBridge: { exposeInMainWorld: (name, api) => { assert.equal(name, 'electronAPI'); bridge = api } },
        ipcRenderer: {
          send: (channel, ...args) => ipcMain.emit(channel, { sender: webContents }, ...args),
          on() {}, removeListener() {}, invoke() {}
        }
      }
    }
  })
  const iframeWindow = {}
  const module = { exports: {} }
  const source = parseComponent(fs.readFileSync(path.join(root, 'src/components/LiveClassroomFrame/index.vue'), 'utf8')).script.content
  const componentCode = babel.transformSync(source, {
    babelrc: false, configFile: false,
    plugins: [babelRequire.resolve('@babel/plugin-transform-modules-commonjs')]
  }).code
  vm.runInNewContext(componentCode, {
    module, exports: module.exports, URL, Date,
    navigator: { onLine: true },
    window: { electronAPI: bridge, addEventListener() {}, removeEventListener() {}, setTimeout: () => 1, clearTimeout() {} },
    require: name => {
      assert.equal(name, '@/utils/auth')
      return { getUserInfo: () => role ? { role } : null }
    }
  })
  const component = module.exports.default
  const frame = {
    ...component.data(), src: 'https://live.fjlsjy123.com/auikits/?role=1',
    $refs: { frame: { contentWindow: iframeWindow } }, $emit() {}
  }
  for (const [name, method] of Object.entries(component.methods)) frame[name] = method.bind(frame)
  component.watch.src.handler.call(frame, frame.src)
  component.mounted.call(frame)
  return {
    frame, main, bridge, ipcMain, native, protectedStates,
    isProtected: () => protectedStates.at(-1),
    message: (data, options = {}) => frame.handleMessage({
      data, source: iframeWindow, origin: 'https://live.fjlsjy123.com', ...options
    }),
    unmount: () => component.beforeDestroy.call(frame)
  }
}

test('teacher: iframe message crosses the real preload and IPC handlers, restoring protection on stop', () => {
  const h = harness()
  assert.equal(h.isProtected(), true)
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  assert.equal(h.isProtected(), false)
  assert.equal(h.native.pollCalls, 1, 'process detection remains enabled')
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: false })
  assert.equal(h.isProtected(), true)
})

for (const role of ['STUDENT', 'ASSISTANT', null]) {
  test(`${role}: even a message claiming teacher status cannot disable protection`, () => {
    const h = harness(role)
    h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true, role: 'TEACHER' })
    assert.equal(h.isProtected(), true)
    h.bridge.setClassroomScreenSharing(true)
    assert.equal(h.isProtected(), true, 'native guard requires a teacher classroom session')
  })
}

test('messages from another iframe, origin or invalid payload are ignored', () => {
  const h = harness()
  const message = { type: 'CLASSROOM_SCREEN_SHARE', active: true }
  h.message(message, { source: {} })
  h.message(message, { origin: 'https://other.example' })
  h.message({ ...message, active: 'true' })
  assert.equal(h.isProtected(), true)
})

test('IPC from another window cannot suspend or stop the main window guard', () => {
  const h = harness()
  h.ipcMain.emit('set-classroom-screen-sharing', { sender: {} }, true)
  h.ipcMain.emit('set-screen-guard', { sender: {} }, false)
  assert.equal(h.isProtected(), true)
})

for (const reset of [
  h => h.frame.beginLoading(30000),
  h => h.frame.fail('loading failed'),
  h => h.message({ type: 'CLASSROOM_BOOTSTRAP' }),
  h => h.message({ type: 'CLASSROOM_EXIT' }),
  h => h.message({ type: 'CLASSROOM_ERROR', message: 'initialization failed' }),
  h => h.main.webContents.emit('render-process-gone', {}, { reason: 'crashed' })
]) {
  test(`reload, exit or failure restores protection: ${reset}`, () => {
    const h = harness()
    h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
    assert.equal(h.isProtected(), false)
    reset(h)
    assert.equal(h.isProtected(), true)
  })
}

test('a delayed initial iframe load event does not cancel an active teacher sharing session', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.frame.handleFrameLoad()
  assert.equal(h.isProtected(), false)
})

test('a subsequent student/replay session cannot inherit a teacher sharing exception', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.bridge.setScreenGuard(true)
  assert.equal(h.isProtected(), true)
  h.bridge.setClassroomScreenSharing(true)
  assert.equal(h.isProtected(), true)
})

test('leaving the classroom removes the exception and retains the normal outside-classroom policy', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.unmount()
  assert.deepEqual(h.protectedStates.slice(-2), [true, false])
  h.bridge.setClassroomScreenSharing(true)
  h.bridge.setScreenGuard(true)
  assert.equal(h.isProtected(), true)
})

test('destroyed windows tolerate delayed sharing or guard messages', () => {
  const h = harness()
  h.main.destroyed = true
  assert.doesNotThrow(() => h.bridge.setClassroomScreenSharing(true))
  assert.doesNotThrow(() => h.bridge.setScreenGuard(false))
})
