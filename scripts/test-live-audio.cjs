// node scripts/test-live-audio.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')
const runtime = require('../electron/live-audio-runtime')

function runtimeApp (initial = {}) {
  const switches = new Map(Object.entries(initial))
  return {
    commandLine: {
      hasSwitch: name => switches.has(name),
      getSwitchValue: name => switches.get(name) || '',
      appendSwitch: (name, value = '') => switches.set(name, value),
    },
    disableHardwareAcceleration () { this.gpuDisabled = true },
    isHardwareAccelerationEnabled () { return !this.gpuDisabled },
  }
}

for (const [mode, inProcess, media, policy] of [
  ['baseline', false, false, false], ['in-process', true, false, false],
  ['background-media', false, true, false], ['background-policy', false, false, true],
  ['combined', true, true, true],
]) {
  const app = runtimeApp({ 'live-audio-mode': mode, 'disable-features': 'ExistingFeature,Other<Trial' })
  const profile = runtime.configureLiveAudioRuntime(app, 'win32', {})
  const state = runtime.readAudioRuntimeState(app, profile)
  assert.equal(state.mode, mode)
  assert.equal(state.modeSource, 'command-line')
  assert.equal(state.audioServiceOutOfProcessDisabled, inProcess)
  assert.equal(state.disableBackgroundMediaSuspend, media)
  assert.equal(state.disableBackgroundTimerThrottling, policy)
  assert.equal(state.disabledFeatures.includes('UseEcoQoSForBackgroundProcess'), policy)
  assert.equal(state.disabledFeatures.includes('CalculateNativeWinOcclusion'), policy)
  assert(state.disabledFeatures.includes('ExistingFeature') && state.disabledFeatures.includes('Other<Trial'))
  assert(!app.gpuDisabled)
}
const defaults = runtimeApp({ 'disable-features': 'AudioServiceOutOfProcess<ExistingTrial' })
const defaultProfile = runtime.configureLiveAudioRuntime(defaults, 'win32', {})
assert.equal(defaultProfile.mode, 'combined')
assert.equal(runtime.readAudioRuntimeState(defaults, defaultProfile).disabledFeatures.filter(value => value.startsWith('AudioServiceOutOfProcess')).length, 1)
const envApp = runtimeApp()
assert.equal(runtime.configureLiveAudioRuntime(envApp, 'win32', { LISHENG_AUDIO_MODE: 'baseline' }).mode, 'baseline')
const cliApp = runtimeApp({ 'live-audio-mode': 'in-process', 'live-audio-disable-gpu': '0' })
assert.equal(runtime.configureLiveAudioRuntime(cliApp, 'win32', { LISHENG_AUDIO_MODE: 'baseline', LISHENG_AUDIO_DISABLE_GPU: '1' }).mode, 'in-process')
assert(!cliApp.gpuDisabled, 'explicit CLI must override environment')
const invalidApp = runtimeApp({ 'live-audio-mode': 'typo' })
assert.equal(runtime.configureLiveAudioRuntime(invalidApp, 'win32', {}).mode, 'combined')
const gpu = runtimeApp({ 'live-audio-disable-gpu': '' })
assert.equal(runtime.configureLiveAudioRuntime(gpu, 'win32', {}).disableGpu, true)
assert(gpu.gpuDisabled)
assert.equal(runtime.readAudioRuntimeState(gpu, {}).hardwareAccelerationEnabled, false)
const gpuEnv = runtimeApp()
runtime.configureLiveAudioRuntime(gpuEnv, 'win32', { LISHENG_AUDIO_DISABLE_GPU: '1' })
assert(gpuEnv.gpuDisabled)
const otherPlatform = runtimeApp({ 'live-audio-mode': 'combined', 'live-audio-disable-gpu': '' })
assert.equal(runtime.configureLiveAudioRuntime(otherPlatform, 'darwin', {}).mode, 'baseline')
assert(!otherPlatform.commandLine.hasSwitch('disable-features') && !otherPlatform.gpuDisabled)
const main = fs.readFileSync(path.resolve(__dirname, '../electron/main.js'), 'utf8')
assert(main.indexOf('configureLiveAudioRuntime(app)') < main.indexOf('app.whenReady().then'), 'runtime must be configured before ready')
assert(main.includes('registerLiveAudioDiagnostics(mainWindow, liveAudioRuntime)'))
console.log('PASS: Windows startup profiles, CLI/environment precedence, feature merging, GPU opt-in, non-Windows isolation, pre-ready wiring')

function setup (platform = 'win32') {
  let now = 100000
  const logs = []
  const blockers = new Set()
  const timers = new Set()
  const ipcMain = new EventEmitter()
  const handlers = new Map()
  ipcMain.handle = (name, handler) => {
    assert(!handlers.has(name), 'IPC handler must register once')
    handlers.set(name, handler)
  }
  const app = {
    ...runtimeApp({ 'disable-renderer-backgrounding': '' }),
    getVersion: () => 'test',
    getAppMetrics: () => [{ pid: 1, type: 'Utility', name: 'Audio Service', serviceName: 'audio.mojom.AudioService', sandboxed: true, cpu: { percentCPUUsage: 5 }, memory: { workingSetSize: 123 } }],
  }
  const profile = runtime.configureLiveAudioRuntime(app, platform, {})
  const source = fs.readFileSync(path.resolve(__dirname, '../electron/live-audio-diagnostics.js'), 'utf8')
  const module = { exports: {} }
  vm.runInNewContext(source, {
    module, exports: module.exports,
    process: { platform, versions: { electron: '25.9.8', chrome: '114' } },
    Date: class extends Date { constructor () { super(now) } static now () { return now } },
    setInterval: fn => { const timer = { fn, unref () {} }; timers.add(timer); return timer },
    clearInterval: timer => timers.delete(timer),
    require: name => {
      if (name === 'electron') return { app, ipcMain, powerSaveBlocker: {
        start: type => { assert.equal(type, 'prevent-app-suspension'); const id = blockers.size + 1; blockers.add(id); return id },
        stop: id => blockers.delete(id)
      } }
      if (name === 'os') return { release: () => 'test-os' }
      if (name === './live-audio-runtime') return runtime
      return { appendCrashLog: (source, data) => logs.push({ source, data }) }
    }
  })
  let number = 0
  function window () {
    const win = new EventEmitter()
    let throttling = true
    let minimized = false
    const messages = []
    win.isDestroyed = () => false
    win.isFocused = () => !minimized
    win.isVisible = () => !minimized
    win.isMinimized = () => minimized
    win.minimize = () => { minimized = true; win.emit('minimize') }
    win.webContents = Object.assign(new EventEmitter(), {
      id: ++number, isDestroyed: () => false,
      getBackgroundThrottling: () => throttling,
      setBackgroundThrottling: value => { throttling = value },
      send: (type, value) => messages.push({ type, value }),
    })
    return { win, messages }
  }
  return { ...module.exports,
    registerLiveAudioDiagnostics: win => module.exports.registerLiveAudioDiagnostics(win, profile),
    app, logs, blockers, timers, ipcMain, handlers, window,
    advance: ms => { now += ms } }
}

const test = setup()
const { win, messages } = test.window()
const controller = test.registerLiveAudioDiagnostics(win)
assert.equal(controller.snapshot('test').backgroundThrottling, false)
assert.equal(test.blockers.size, 0)
test.ipcMain.emit('live-audio-diagnostic', { sender: { id: 999 } }, { active: true })
assert.equal(controller.isActive(), false, 'unregistered window cannot activate diagnostics')
test.ipcMain.emit('live-audio-diagnostic', { sender: win.webContents }, { active: true, snapshot: {
  reason: 'push-started', microphone: { id: 'mic', enabled: true, deviceId: 'private-device',
    settings: { sampleRate: 48000, echoCancellation: true, deviceId: 'private-device' } },
  token: 'private-token', url: 'https://private'
} })
assert.equal(controller.isActive(), true)
assert.equal(test.blockers.size, 1)
win.minimize()
assert(test.logs.some(item => item.data.type === 'window-minimize'))
assert(messages.some(item => item.value.minimized))
const state = test.handlers.get('get-live-audio-environment')({ sender: win.webContents })
assert.equal(state.environment.electron, '25.9.8')
assert.equal(state.environment.fixVersion, 'win-audio-v2')
assert.equal(state.environment.audioRuntime.mode, 'combined')
assert.equal(state.environment.audioRuntime.audioServiceOutOfProcessDisabled, true)
assert.equal(state.audioServiceProcesses[0].serviceName, 'audio.mojom.AudioService')
assert(state.processSampleTime)
assert(!JSON.stringify(test.logs).includes('private-'))
assert(!JSON.stringify(test.logs).includes('https://private'))
const clockSnapshot = {
  diagnosticsRevision: 'audio-clock-v3', audioPath: 'sdk-mixer', secondaryStreamType: 1,
  secondary: { id: 'screen', settings: { sampleRate: 48000, deviceId: 'private-device' } },
  volumeSettings: { audio: 1, screen: 1, token: 'private-token' },
  mixer: { state: 'running', clock: { ratio: 0.6633, slow: true, consecutiveSlowSamples: 2, wallDeltaMs: 5000, audioDeltaMs: 3317, token: 'private-token' } },
}
test.advance(5000)
controller.update({ active: true, snapshot: clockSnapshot })
assert.equal(test.logs.filter(item => item.data.type === 'mixer-clock-slow').length, 1)
test.advance(5000)
controller.update({ active: true, snapshot: clockSnapshot })
assert.equal(test.logs.filter(item => item.data.type === 'mixer-clock-slow').length, 1, 'native warning must be throttled')
test.advance(5000)
controller.update({ active: true, snapshot: { mixer: { clock: { ratio: 1, slow: false, consecutiveSlowSamples: 0 } } } })
assert.equal(test.logs.filter(item => item.data.type === 'mixer-clock-recovered').length, 1)
assert(!JSON.stringify(test.logs).includes('private-'))
controller.update({ active: false })
assert.equal(test.blockers.size, 0, 'inactive message must bypass heartbeat rate limit')
test.advance(1001)
controller.update({ active: true })
assert.equal(test.blockers.size, 1)
test.advance(46000)
for (const timer of test.timers) timer.fn()
assert.equal(test.blockers.size, 0, 'stale heartbeat must release power blocker')
test.advance(1001)
controller.update({ active: true })
win.webContents.emit('render-process-gone')
assert.equal(test.blockers.size, 0, 'renderer crash must release power blocker')
test.advance(1001)
controller.update({ active: true })
win.emit('closed')
assert.equal(test.blockers.size, 0)
assert.equal(test.timers.size, 0)
const next = test.window()
test.registerLiveAudioDiagnostics(next.win)
assert.equal(test.handlers.size, 1, 'recreated window must not duplicate IPC registration')
test.ipcMain.emit('live-audio-diagnostic', { sender: next.win.webContents }, { active: true })
test.app.getAppMetrics = () => { throw new Error('metrics unavailable') }
assert.doesNotThrow(() => next.win.emit('blur'))
next.win.emit('closed')

const mac = setup('darwin')
const macWin = mac.window().win
const macController = mac.registerLiveAudioDiagnostics(macWin)
macController.update({ active: true })
assert.equal(mac.blockers.size, 0, 'Windows workaround must not change macOS power management')
assert.equal(macController.snapshot('test').backgroundThrottling, true)
assert.equal(macController.snapshot('test').environment.audioRuntime.mode, 'baseline')
macWin.emit('closed')
console.log('PASS: window state, IPC ownership, config repair, audio process evidence, clock warnings/recovery, log filtering, power lifecycle, heartbeat expiry, crash cleanup, window recreation, macOS unaffected')

// 实际 Vue iframe 桥接：只接受当前课堂 iframe 的同源消息。
const frameSource = fs.readFileSync(path.resolve(__dirname, '../src/components/LiveClassroomFrame/index.vue'), 'utf8')
const script = frameSource.match(/<script>([\s\S]*?)<\/script>/)[1].replace('export default', 'module.exports =')
const forwarded = []
const reports = []
const bridgeModule = { exports: {} }
vm.runInNewContext(script, { module: bridgeModule, URL,
  window: { electronAPI: { reportLiveAudioDiagnostic: payload => reports.push(payload) } }
})
const frame = { contentWindow: { postMessage: (...args) => forwarded.push(args) } }
const component = { $refs: { frame }, currentSrc: 'https://class.example/classroom?token=private',
  ...bridgeModule.exports.methods }
const valid = { source: frame.contentWindow, origin: 'https://class.example',
  data: { type: 'LIVE_AUDIO_DIAGNOSTIC', active: true } }
component.handleMessage({ ...valid, source: {} })
component.handleMessage({ ...valid, origin: 'https://untrusted.example' })
assert.equal(reports.length, 0)
component.handleMessage(valid)
assert.equal(reports.length, 1)
assert.equal(reports[0].active, true)
component.forwardLiveAudioState({ minimized: true })
assert.equal(forwarded[0][0].type, 'LIVE_AUDIO_NATIVE_STATE')
assert.equal(forwarded[0][1], 'https://class.example')
console.log('PASS: iframe source/origin validation and native state forwarding')
