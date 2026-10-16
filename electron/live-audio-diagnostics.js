const { app, ipcMain, powerSaveBlocker } = require('electron')
const os = require('os')
const { appendCrashLog } = require('./crash-logger')
const { FIX_VERSION, readAudioRuntimeState } = require('./live-audio-runtime')

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
  for (const key of ['reason', 'visibility', 'diagnosticsRevision', 'audioPath']) {
    if (typeof value[key] === 'string') result[key] = value[key].slice(0, 60)
  }
  for (const key of ['focused', 'pushing', 'directMicrophoneEnabled', 'routeSupported', 'sameAudioTrack']) {
    if (typeof value[key] === 'boolean') result[key] = value[key]
  }
  result.microphone = trackSummary(value.microphone)
  result.secondary = trackSummary(value.secondary)
  result.published = trackSummary(value.published)
  for (const key of ['elapsedMs', 'secondaryStreamType', 'nativeStateAgeMs']) {
    if (Number.isFinite(value[key])) result[key] = value[key]
  }
  if (value.volumeSettings && typeof value.volumeSettings === 'object') {
    result.volumeSettings = {}
    for (const key of ['audio', 'screen', 'custom']) {
      if (Number.isFinite(value.volumeSettings[key])) result.volumeSettings[key] = value.volumeSettings[key]
    }
  }
  if (value.mixer && typeof value.mixer === 'object') {
    result.mixer = {}
    if (typeof value.mixer.state === 'string') result.mixer.state = value.mixer.state.slice(0, 30)
    for (const key of ['currentTime', 'sampleRate', 'baseLatency']) {
      if (Number.isFinite(value.mixer[key])) result.mixer[key] = value.mixer[key]
    }
    if (value.mixer.clock && typeof value.mixer.clock === 'object') {
      const clock = value.mixer.clock
      result.mixer.clock = {}
      for (const key of ['sampledAtMs', 'wallDeltaMs', 'audioDeltaMs', 'ratio', 'consecutiveSlowSamples']) {
        if (Number.isFinite(clock[key])) result.mixer.clock[key] = clock[key]
      }
      if (typeof clock.slow === 'boolean') result.mixer.clock.slow = clock.slow
    }
  }
  return result
}

function registerLiveAudioDiagnostics (win, runtimeProfile = {}) {
  let active = false
  let blockerId = null
  let lastHeartbeat = 0
  let lastSample = {}
  let lastWritten = 0
  let lastAccepted = -Infinity
  let audioServiceProcesses = []
  let processSampleTime = null
  let clockWarning = false
  let lastClockWarning = -Infinity
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
      audioServiceProcesses, processSampleTime,
      environment: {
        fixVersion: FIX_VERSION, appVersion: app.getVersion(),
        electron: process.versions.electron, chrome: process.versions.chrome,
        platform: process.platform, osRelease: os.release(),
        disableRendererBackgrounding: app.commandLine.hasSwitch('disable-renderer-backgrounding'),
        audioRuntime: readAudioRuntimeState(app, runtimeProfile),
      },
    }
  }

  function write (reason, withMetrics = false) {
    if (win.isDestroyed() || contents.isDestroyed()) return
    ensureRunning()
    try {
      let metrics
      if (withMetrics) {
        try {
          const allMetrics = app.getAppMetrics()
          // 记录 Electron 实际报告的服务信息；配置开关不等于服务已切换到进程内。
          audioServiceProcesses = allMetrics.filter(item =>
            /audio/i.test(`${item.name || ''} ${item.serviceName || ''}`)
          ).map(item => ({
            pid: item.pid, type: item.type, name: item.name,
            serviceName: item.serviceName, sandboxed: item.sandboxed,
          }))
          processSampleTime = new Date().toISOString()
          metrics = allMetrics.slice(0, 20).map(item => ({
            pid: item.pid, type: item.type,
            name: item.name, serviceName: item.serviceName, sandboxed: item.sandboxed,
            cpu: item.cpu && item.cpu.percentCPUUsage,
            memoryKB: item.memory && item.memory.workingSetSize,
          }))
        } catch (_) { metrics = []; audioServiceProcesses = []; processSampleTime = null }
      }
      const state = snapshot(reason)
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
    if (!active) clockWarning = false
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
      const clock = lastSample.mixer && lastSample.mixer.clock
      if (active && clock && clock.slow && clock.consecutiveSlowSamples >= 2) {
        if (!clockWarning || now - lastClockWarning >= 30000) {
          write('mixer-clock-slow', true)
          lastClockWarning = now
        }
        clockWarning = true
      } else if (active && clock && clock.slow === false && clockWarning) {
        clockWarning = false
        write('mixer-clock-recovered', true)
      } else if (!clock) clockWarning = false
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
