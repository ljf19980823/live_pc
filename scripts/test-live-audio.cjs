// node scripts/test-live-audio.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')

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
    getVersion: () => 'test', commandLine: { hasSwitch: () => true },
    getAppMetrics: () => [{ pid: 1, type: 'Utility', cpu: { percentCPUUsage: 5 }, memory: { workingSetSize: 123 } }],
  }
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
  return { ...module.exports, app, logs, blockers, timers, ipcMain, handlers, window,
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
assert.equal(state.environment.fixVersion, 'win-audio-v1')
assert(!JSON.stringify(test.logs).includes('private-'))
assert(!JSON.stringify(test.logs).includes('https://private'))
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
macWin.emit('closed')
console.log('PASS: actual window state, IPC ownership, config repair, log filtering, power lifecycle, heartbeat expiry, crash cleanup, window recreation, macOS unaffected')

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
