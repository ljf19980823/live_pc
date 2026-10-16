// 必须在 app.whenReady() 前调用。仅作用于 Windows，支持同包启动参数对照。
const FIX_VERSION = 'win-audio-v2'
const MODES = ['baseline', 'in-process', 'background-media', 'background-policy', 'combined']
const POLICY_FEATURES = ['CalculateNativeWinOcclusion', 'UseEcoQoSForBackgroundProcess']

function featureNames (value) {
  return String(value || '').split(',').map(value => value.trim()).filter(Boolean)
}

function configureLiveAudioRuntime (app, platform = process.platform, env = process.env) {
  const fromCommandLine = app.commandLine.getSwitchValue('live-audio-mode')
  const requested = fromCommandLine || env.LISHENG_AUDIO_MODE || 'combined'
  const valid = MODES.includes(requested)
  const mode = platform === 'win32' ? (valid ? requested : 'combined') : 'baseline'
  const disableGpu = platform === 'win32' && (
    app.commandLine.hasSwitch('live-audio-disable-gpu')
      ? app.commandLine.getSwitchValue('live-audio-disable-gpu') !== '0'
      : env.LISHENG_AUDIO_DISABLE_GPU === '1'
  )
  const profile = { mode, modeSource: fromCommandLine ? 'command-line' : env.LISHENG_AUDIO_MODE ? 'environment' : 'default',
    invalidMode: !valid, requestedInProcessAudio: false, disableGpu }
  if (platform !== 'win32') return profile

  const features = featureNames(app.commandLine.getSwitchValue('disable-features'))
  const addFeature = feature => {
    if (!features.some(value => value.split(/[<:]/)[0] === feature)) features.push(feature)
  }
  if (mode === 'in-process' || mode === 'combined') {
    addFeature('AudioServiceOutOfProcess')
    profile.requestedInProcessAudio = true
  }
  if (mode === 'background-policy' || mode === 'combined') {
    POLICY_FEATURES.forEach(addFeature)
    app.commandLine.appendSwitch('disable-background-timer-throttling')
  }
  if (features.length) app.commandLine.appendSwitch('disable-features', features.join(','))
  if (mode === 'background-media' || mode === 'combined') {
    app.commandLine.appendSwitch('disable-background-media-suspend')
  }
  if (disableGpu) app.disableHardwareAcceleration()
  return profile
}

function readAudioRuntimeState (app, profile) {
  const disabled = featureNames(app.commandLine.getSwitchValue('disable-features'))
  return {
    ...profile,
    hardwareAccelerationEnabled: typeof app.isHardwareAccelerationEnabled === 'function'
      ? app.isHardwareAccelerationEnabled() : undefined,
    disabledFeatures: disabled,
    disableBackgroundMediaSuspend: app.commandLine.hasSwitch('disable-background-media-suspend'),
    disableBackgroundTimerThrottling: app.commandLine.hasSwitch('disable-background-timer-throttling'),
    // 开关只表明请求的配置，实际音频服务进程还需结合进程采样确认。
    audioServiceOutOfProcessDisabled: disabled.some(value => value.split(/[<:]/)[0] === 'AudioServiceOutOfProcess'),
  }
}

module.exports = { FIX_VERSION, configureLiveAudioRuntime, readAudioRuntimeState }
