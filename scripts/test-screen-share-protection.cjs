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

function nativeSource(realDetection = false) {
  const ast = parser.parse(fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8'))
  const declarations = []
  const handlers = []
  const variables = new Set(['mainWindow', 'screenGuardInterval', 'consecutiveDetections', 'screenGuardChecking',
    'screenGuardAlerting', 'screenGuardEnabled', 'allowScreenshots', 'allowTeacherScreenShare', 'teacherScreenSharing'])
  const functions = new Set(['updateWindowContentProtection', 'setTeacherScreenSharing', 'startScreenGuard', 'stopScreenGuard'])
  if (realDetection) {
    functions.add('checkScreenGuard')
    for (const name of ['DETECTION_THRESHOLD', 'RECORDER_PROCESSES_WIN', 'RECORDER_PROCESSES_MAC',
      'RECORDER_APPS_MAC', 'RECORDER_KEYWORDS', 'KEYWORD_WHITELIST_WIN', 'KEYWORD_WHITELIST_MAC',
      'SCREENSHOT_PROCESSES', 'VM_PROCESSES_WIN', 'VM_PROCESSES_MAC']) variables.add(name)
  }
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
    ${realDetection ? '' : 'function checkScreenGuard() { pollCalls++; }'}
    function getRunningProcesses() { return Promise.resolve(runningProcesses); }
    function getMacAppNames() { return Promise.resolve(macAppNames); }
    function scheduleScreenGuardInterval() { screenGuardInterval = 1; }
  `
}

function harness(role = 'TEACHER', { platform = 'win32', realDetection = false } = {}) {
  const protectedStates = []
  const sentEvents = []
  const ipcMain = new EventEmitter()
  const webContents = new EventEmitter()
  webContents.send = (channel, data) => sentEvents.push({ channel, data })
  webContents.getURL = () => 'file:///app/dist/index.html'
  webContents.getOSProcessId = () => 1
  const main = {
    webContents, destroyed: false,
    isDestroyed() { return this.destroyed },
    setContentProtection: enabled => protectedStates.push(enabled)
  }
  const native = vm.createContext({
    providedWindow: main, ipcMain, pollCalls: 0, clearInterval() {},
    process: { platform }, runningProcesses: [], macAppNames: [],
    appendCrashLog() {}, getCrashDumpsDirectory: () => '/tmp'
  })
  vm.runInContext(nativeSource(realDetection), native)

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
    ...component.data(), src: 'https://test.live.fjlsjy123.com/auikits/?role=1',
    $refs: { frame: { contentWindow: iframeWindow } }, $emit() {}
  }
  for (const [name, method] of Object.entries(component.methods)) frame[name] = method.bind(frame)
  component.watch.src.handler.call(frame, frame.src)
  component.mounted.call(frame)
  return {
    frame, main, bridge, ipcMain, native, protectedStates, sentEvents,
    isProtected: () => protectedStates.at(-1),
    isSharing: () => vm.runInContext('teacherScreenSharing', native),
    guardEnabled: () => vm.runInContext('screenGuardEnabled', native),
    message: (data, options = {}) => frame.handleMessage({
      data, source: iframeWindow, origin: 'https://test.live.fjlsjy123.com', ...options
    }),
    unmount: () => component.beforeDestroy.call(frame)
  }
}

for (const role of ['TEACHER', 'STUDENT', 'ASSISTANT', null]) {
  test(`${role}: entering a live classroom allows screenshots and keeps process detection enabled`, () => {
    const h = harness(role)
    assert.equal(h.isProtected(), false)
    assert.equal(h.guardEnabled(), true)
    assert.equal(h.native.pollCalls, 1)
  })
}

test('teacher: sharing messages cross the real preload and IPC handlers without disabling screenshots', () => {
  const h = harness()
  assert.equal(h.isProtected(), false)
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  assert.equal(h.isSharing(), true)
  assert.equal(h.isProtected(), false)
  assert.equal(h.native.pollCalls, 1, 'process detection remains enabled')
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: false })
  assert.equal(h.isSharing(), false)
  assert.equal(h.isProtected(), false)
})

for (const role of ['STUDENT', 'ASSISTANT', null]) {
  test(`${role}: a message claiming teacher status cannot activate teacher sharing`, () => {
    const h = harness(role)
    h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true, role: 'TEACHER' })
    assert.equal(h.isSharing(), false)
    h.bridge.setClassroomScreenSharing(true)
    assert.equal(h.isSharing(), false, 'native guard requires a teacher classroom session')
    assert.equal(h.guardEnabled(), true)
  })
}

test('messages from another iframe, origin or invalid payload are ignored', () => {
  const h = harness()
  const message = { type: 'CLASSROOM_SCREEN_SHARE', active: true }
  h.message(message, { source: {} })
  h.message(message, { origin: 'https://other.example' })
  h.message({ ...message, active: 'true' })
  assert.equal(h.isSharing(), false)
})

test('IPC from another window cannot suspend or stop the main window guard', () => {
  const h = harness()
  h.ipcMain.emit('set-classroom-screen-sharing', { sender: {} }, true)
  h.ipcMain.emit('set-screen-guard', { sender: {} }, false)
  h.ipcMain.emit('set-screen-guard', { sender: {} }, true)
  assert.equal(h.isSharing(), false)
  assert.equal(h.guardEnabled(), true)
  assert.equal(h.isProtected(), false)
})

for (const reset of [
  h => h.frame.beginLoading(30000),
  h => h.frame.fail('loading failed'),
  h => h.message({ type: 'CLASSROOM_BOOTSTRAP' }),
  h => h.message({ type: 'CLASSROOM_EXIT' }),
  h => h.message({ type: 'CLASSROOM_ERROR', message: 'initialization failed' }),
  h => h.main.webContents.emit('render-process-gone', {}, { reason: 'crashed' })
]) {
  test(`reload, exit or failure clears sharing while preserving live screenshots: ${reset}`, () => {
    const h = harness()
    h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
    assert.equal(h.isSharing(), true)
    assert.equal(h.isProtected(), false)
    reset(h)
    assert.equal(h.isSharing(), false)
    assert.equal(h.isProtected(), false)
    assert.equal(h.guardEnabled(), true)
  })
}

test('a delayed initial iframe load event does not cancel an active teacher sharing session', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.frame.handleFrameLoad()
  assert.equal(h.isSharing(), true)
  assert.equal(h.isProtected(), false)
})

test('a subsequent replay session cannot inherit live screenshot or teacher sharing exceptions', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.bridge.setScreenGuard(true)
  assert.equal(h.isProtected(), true)
  assert.equal(vm.runInContext('allowScreenshots', h.native), false)
  h.bridge.setClassroomScreenSharing(true)
  assert.equal(h.isProtected(), true)
})

test('leaving the classroom removes the exception and retains the normal outside-classroom policy', () => {
  const h = harness()
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  h.unmount()
  assert.deepEqual(h.protectedStates.slice(-2), [false, false])
  assert.equal(h.guardEnabled(), false)
  assert.equal(vm.runInContext('allowScreenshots', h.native), false)
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

test('sessions without screenshot permission retain the teacher sharing exception', () => {
  const h = harness()
  h.bridge.setScreenGuard(true, { allowTeacherScreenShare: true })
  assert.equal(h.isProtected(), true)
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: true })
  assert.equal(h.isProtected(), false)
  h.message({ type: 'CLASSROOM_SCREEN_SHARE', active: false })
  assert.equal(h.isProtected(), true)
})

test('screenshot permission requires a boolean true and is reset on each session', () => {
  const h = harness()
  h.bridge.setScreenGuard(true, { allowScreenshots: 'true' })
  assert.equal(h.isProtected(), true)
  h.bridge.setScreenGuard(true, { allowScreenshots: true })
  assert.equal(h.isProtected(), false)
  h.bridge.setScreenGuard(true, null)
  assert.equal(h.isProtected(), true)
})

async function detect(h, processes, apps = []) {
  // 等待进入课堂时触发的首次异步检测结束，再模拟实际进程列表。
  await new Promise(resolve => setImmediate(resolve))
  h.native.runningProcesses = processes
  h.native.macAppNames = apps
  await vm.runInContext('checkScreenGuard()', h.native)
  await vm.runInContext('checkScreenGuard()', h.native)
  return h.sentEvents.filter(event => event.channel === 'screen-guard-change').at(-1).data
}

for (const [platform, processes, apps] of [
  ['win32', ['snippingtool.exe', 'wechat.exe', 'snagit32.exe', 'snagit64.exe', 'sharex.exe',
    'screenpresso.exe', 'hypersnap.exe', 'tinytake.exe'], []],
  ['darwin', ['screencapture', 'screencaptureui', 'screencaptured', 'screenpresso'], ['screenpresso']]
]) {
  test(`${platform}: screenshot tools do not trigger a recording overlay in live classrooms`, async () => {
    const h = harness('STUDENT', { platform, realDetection: true })
    const result = await detect(h, processes, apps)
    assert.equal(result.detected, false)
    assert.equal(result.isRecording, false)
    assert.equal(h.isProtected(), false)

    h.bridge.setScreenGuard(true)
    const replayResult = await detect(h, processes, apps)
    assert.equal(replayResult.isRecording, true, 'replay keeps the existing detection policy')
    assert.equal(h.isProtected(), true)
  })
}

for (const [platform, processes, apps, detectedRecorder, detectedVM] of [
  ['win32', ['obs64.exe', 'sharex.exe'], [], 'obs64.exe', null],
  ['darwin', ['obs', 'screencaptured'], [], 'obs', null],
  ['darwin', ['screencaptured'], ['obs studio'], 'obs studio', null],
  ['win32', ['custom-screenrecord.exe'], [], '[keyword:screenrecord] custom-screenrecord.exe', null],
  ['win32', ['sharex.exe', 'vmtoolsd.exe'], [], null, 'vmtoolsd.exe'],
  ['darwin', ['screencaptured', 'prl_tools'], [], null, 'prl_tools']
]) {
  test(`${platform}: live screenshots retain detection of ${detectedRecorder || detectedVM}`, async () => {
    const h = harness('STUDENT', { platform, realDetection: true })
    const result = await detect(h, processes, apps)
    assert.equal(result.detected, true)
    assert.equal(result.detectedRecorder, detectedRecorder)
    assert.equal(result.detectedVM, detectedVM)
    assert.equal(h.guardEnabled(), true)
    assert.equal(h.isProtected(), false)

    const cleared = await detect(h, [])
    assert.equal(cleared.detected, false, 'closing the recorder or VM clears the overlay')
  })
}
