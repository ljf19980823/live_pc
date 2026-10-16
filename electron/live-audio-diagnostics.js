const { app, ipcMain, powerSaveBlocker } = require('electron')
const os = require('os')
const { appendCrashLog } = require('./crash-logger')

const controllers = new Map()
let registered = false

function trackSummary (track) {
  if (!track || typeof track !== 'object') return null
  const result = {}
  for (const key of ['id', 'readyState']) {
    if (typeof track[key] === 'string') result[key] = track[key].slice(0, 80)
  }
  for (const key of ['enabled', 'muted']) {
    if (typeof track[key] === 'boolean') result[key] = track[key]
  }
  result.settings = {}
  for (const key of ['sampleRate', 'sampleSize', 'channelCount', 'latency',
    'echoCancellation', 'noiseSuppression', 'autoGainControl']) {
    const value = track.settings && track.settings[key]
    if (typeof value === 'boolean' || Number.isFinite(value)) result.settings[key] = value
  }
  return result
}

function audioSummary (value) {
  if (!value || typeof value !== 'object') return {}
  const result = {}
  for (const key of ['reason', 'visibility']) {
    if (typeof value[key] === 'string') result[key] = value[key].slice(0, 60)
  }
  for (const key of ['focused', 'pushing', 'directMicrophoneEnabled', 'routeSupported', 'sameAudioTrack']) {
    if (typeof value[key] === 'boolean') result[key] = value[key]
  }
  result.microphone = trackSummary(value.microphone)
  result.published = trackSummary(value.published)
  if (value.mixer && typeof value.mixer === 'object') {
    result.mixer = {}
    if (typeof value.mixer.state === 'string') result.mixer.state = value.mixer.state.slice(0, 30)
    for (const key of ['currentTime', 'sampleRate', 'baseLatency']) {
      if (Number.isFinite(value.mixer[key])) result.mixer[key] = value.mixer[key]
    }
  }
  return result
}

function registerLiveAudioDiagnostics (win) {
  let active = false
  let blockerId = null
  let lastHeartbeat = 0
  let lastSample = {}
  let lastWritten = 0
  let lastAccepted = -Infinity
  const contents = win.webContents
  const isWindows = process.platform === 'win32'
  const removers = []

  function stopBlocker () {
    if (blockerId !== null) {
      try { powerSaveBlocker.stop(blockerId) } catch (_) {}
      blockerId = null
    }
  }

  function ensureRunning () {
    try {
      if (isWindows && !contents.isDestroyed() && contents.getBackgroundThrottling()) {
        contents.setBackgroundThrottling(false)
        appendCrashLog('live-audio', { type: 'background-throttling-restored' })
      }
    } catch (_) {}
  }

  function snapshot (reason) {
    return {
      time: new Date().toISOString(), reason,
      focused: win.isFocused(), minimized: win.isMinimized(), visible: win.isVisible(),
      backgroundThrottling: contents.getBackgroundThrottling(), active,
      suspensionBlocked: blockerId !== null,
      environment: {
        fixVersion: 'win-audio-v1', appVersion: app.getVersion(),
        electron: process.versions.electron, chrome: process.versions.chrome,
        platform: process.platform, osRelease: os.release(),
        disableRendererBackgrounding: app.commandLine.hasSwitch('disable-renderer-backgrounding'),
      },
    }
  }

  function write (reason, withMetrics = false) {
    if (win.isDestroyed() || contents.isDestroyed()) return
    ensureRunning()
    try {
      const state = snapshot(reason)
      let metrics
      if (withMetrics) {
        try {
          metrics = app.getAppMetrics().slice(0, 12).map(item => ({
            pid: item.pid, type: item.type,
            cpu: item.cpu && item.cpu.percentCPUUsage,
            memoryKB: item.memory && item.memory.workingSetSize,
          }))
        } catch (_) { metrics = [] }
      }
      appendCrashLog('live-audio', {
        type: reason, window: state, audio: lastSample, processes: metrics,
      })
      contents.send('live-audio-state', state)
      lastWritten = Date.now()
    } catch (_) {}
  }

  function setActive (value) {
    const changed = active !== value
    active = value
    if (active && isWindows && blockerId === null) {
      // 仅防止应用挂起；不强制保持屏幕点亮，也不等于提高音频线程优先级。
      try { blockerId = powerSaveBlocker.start('prevent-app-suspension') } catch (_) {}
    } else if (!active) stopBlocker()
    if (changed) write(active ? 'audio-active' : 'audio-inactive', active)
  }

  const controller = {
    snapshot,
    isActive: () => active,
    update (payload) {
      if (!payload || typeof payload.active !== 'boolean') return
      const now = Date.now()
      // 停用消息始终接受，不能因限流而把保活状态遗留在退出后的窗口。
      if (payload.active && active && now - lastAccepted < 1000) return
      lastAccepted = now
      lastHeartbeat = now
      lastSample = audioSummary(payload.snapshot)
      ensureRunning()
      setActive(payload.active)
      if (active && now - lastWritten > 15000) write('heartbeat', true)
    },
  }
  controllers.set(contents.id, controller)
  if (!registered) {
    registered = true
    ipcMain.handle('get-live-audio-environment', event => {
      return controllers.get(event.sender.id)?.snapshot('environment-request') || null
    })
    ipcMain.on('live-audio-diagnostic', (event, payload) => {
      controllers.get(event.sender.id)?.update(payload)
    })
  }

  for (const event of ['focus', 'blur', 'minimize', 'restore', 'hide', 'show']) {
    const handler = () => { if (active) write(`window-${event}`, true) }
    win.on(event, handler)
    removers.push(() => win.removeListener(event, handler))
  }
  const inactive = () => { setActive(false); lastSample = {} }
  contents.on('render-process-gone', inactive)
  contents.on('did-start-navigation', (_event, _url, inPlace, mainFrame) => {
    if (mainFrame && !inPlace) inactive()
  })
  const timer = setInterval(() => {
    if (active && Date.now() - lastHeartbeat > 45000) {
      write('heartbeat-timeout')
      setActive(false)
    }
  }, 15000)
  timer.unref?.()
  win.once('closed', () => {
    clearInterval(timer)
    stopBlocker()
    controllers.delete(contents.id)
    removers.forEach(remove => remove())
  })
  write('window-created')
  return controller
}

module.exports = { registerLiveAudioDiagnostics, audioSummary }
