const { app, crashReporter, session } = require('electron')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// 北京时间固定为 UTC+8，日志排查时不依赖用户电脑的本地时区设置。
const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000
// 单个日志字段最大长度，避免远程脚本堆栈或 URL 参数把 crash.log 撑得过大。
const MAX_CRASH_LOG_VALUE_LENGTH = 1200
// 资源失败日志按 URL 和错误原因限流，避免同一个资源短时间失败时刷屏。
const RESOURCE_LOG_THROTTLE_MS = 10 * 1000
const LIVE_RESOURCE_DIAGNOSTIC_URLS = [
  'https://live.fjlsjy123.com/*',
  'http://live.fjlsjy123.com/*',
  'https://g.alicdn.com/apsara-media-box/*',
]

let runStateTimer = null
let runSessionId = ''
let localCrashReporterStarted = false
let mainProcessDiagnosticsRegistered = false
let liveResourceDiagnosticsRegistered = false
const resourceLogThrottleMap = new Map()

/**
 * 将日期格式化为 crash.log 使用的北京时间前缀。
 * @param {Date} date 需要格式化的日期对象，默认使用当前时间。
 * @returns {string} 格式：YYYY-MM-DD HH:mm:ss.SSS。
 */
function formatBeijingLogTime (date = new Date()) {
  const beijingDate = new Date(date.getTime() + BEIJING_TIME_OFFSET_MS)
  const pad2 = value => String(value).padStart(2, '0')
  const pad3 = value => String(value).padStart(3, '0')

  return `${beijingDate.getUTCFullYear()}-${pad2(beijingDate.getUTCMonth() + 1)}-${pad2(beijingDate.getUTCDate())} ` +
    `${pad2(beijingDate.getUTCHours())}:${pad2(beijingDate.getUTCMinutes())}:${pad2(beijingDate.getUTCSeconds())}.` +
    `${pad3(beijingDate.getUTCMilliseconds())}`
}

/**
 * 启用 Electron 本地 crash dump 采集。
 * 打包应用偶发 native 崩溃时，crash.log 可能来不及写入，dump 文件能补上底层证据。
 */
function startLocalCrashReporter () {
  try {
    crashReporter.start({
      uploadToServer: false,
      ignoreSystemCrashHandler: false,
      compress: false,
    })
    localCrashReporterStarted = true
  } catch (_) {
    localCrashReporterStarted = false
  }
}

/**
 * 获取本地 crashReporter 是否已经启动。
 * @returns {boolean} crashReporter 启动成功时返回 true。
 */
function isLocalCrashReporterStarted () {
  return localCrashReporterStarted
}

/**
 * 获取 Electron crash dump 文件目录。
 * @returns {string} crash dump 目录；获取失败时返回空字符串。
 */
function getCrashDumpsDirectory () {
  try {
    return crashReporter.getCrashesDirectory()
  } catch (_) {
    return ''
  }
}

/**
 * 将任意值转换为适合写入单行日志的字符串。
 * @param {*} value 日志字段值。
 * @param {number} maxLength 最大保留长度。
 * @returns {string} 已去除换行并截断后的字段内容。
 */
function formatLogValue (value, maxLength = MAX_CRASH_LOG_VALUE_LENGTH) {
  if (value === undefined || value === null) return ''

  let text = ''
  if (value instanceof Error) {
    text = value.stack || value.message || String(value)
  } else if (typeof value === 'object') {
    try {
      text = JSON.stringify(value)
    } catch (_) {
      text = String(value)
    }
  } else {
    text = String(value)
  }

  text = text.replace(/[\r\n\t]+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

/**
 * 生成本次应用运行的状态文件路径。
 * @returns {string} 运行状态文件绝对路径。
 */
function getRunStateFilePath () {
  return path.join(app.getPath('userData'), 'run-state.json')
}

/**
 * 写入应用运行状态，用于下次启动判断上次是否异常退出。
 * @param {string} status 状态值：running / exited。
 * @param {string} reason 状态原因。
 */
function writeRunState (status, reason = '') {
  try {
    const userDataPath = app.getPath('userData')
    const state = {
      status,
      reason,
      sessionId: runSessionId,
      pid: process.pid,
      version: app.getVersion(),
      platform: process.platform,
      updatedAt: formatBeijingLogTime(),
    }
    fs.mkdirSync(userDataPath, { recursive: true })
    fs.writeFileSync(getRunStateFilePath(), JSON.stringify(state, null, 2), 'utf8')
  } catch (_) {
    // 运行状态写入失败不能影响应用主流程。
  }
}

/**
 * 启动运行状态诊断：记录本次为 running，并在下次启动时识别上次异常退出。
 */
function startRunStateDiagnostics () {
  runSessionId = `${Date.now()}-${process.pid}-${crypto.randomBytes(4).toString('hex')}`

  try {
    const stateFile = getRunStateFilePath()
    if (fs.existsSync(stateFile)) {
      const previousState = JSON.parse(fs.readFileSync(stateFile, 'utf8'))
      if (previousState && previousState.status === 'running') {
        appendCrashLog('previous-exit', {
          type: 'abnormal',
          reason: 'last run ended without normal exit marker',
          exitCode: '',
          name: previousState.version || '',
          lastPid: previousState.pid,
          lastSessionId: previousState.sessionId,
          lastUpdatedAt: previousState.updatedAt,
          lastPlatform: previousState.platform,
        })
      }
    }
  } catch (err) {
    appendCrashLog('previous-exit', {
      type: 'state-read-failed',
      reason: err,
      exitCode: '',
      name: '',
    })
  }

  writeRunState('running', 'app-started')
  clearInterval(runStateTimer)
  runStateTimer = setInterval(() => {
    writeRunState('running', 'heartbeat')
  }, 30 * 1000)
}

/**
 * 标记应用已进入正常退出流程。
 * @param {string} reason 正常退出原因。
 */
function markRunStateExited (reason) {
  clearInterval(runStateTimer)
  runStateTimer = null
  writeRunState('exited', reason)
}

/**
 * 将崩溃诊断信息追加写入 crash.log。
 * @param {string} source 日志来源。
 * @param {object|*} details 日志详情。
 */
function appendCrashLog (source, details = {}) {
  try {
    const logDetails = details && typeof details === 'object'
      ? details
      : { reason: details }
    const reservedKeys = new Set(['type', 'reason', 'exitCode', 'name'])
    const extraFields = Object.keys(logDetails)
      .filter(key => !reservedKeys.has(key) && logDetails[key] !== undefined && logDetails[key] !== null && logDetails[key] !== '')
      .map(key => `${key}=${formatLogValue(logDetails[key])}`)
      .join(' ')
    const userDataPath = app.getPath('userData')
    const logFile = path.join(userDataPath, 'crash.log')
    const line = `${formatBeijingLogTime()} [${source}] ` +
      `type=${formatLogValue(logDetails.type || source)} ` +
      `reason=${formatLogValue(logDetails.reason)} ` +
      `exitCode=${formatLogValue(logDetails.exitCode)} ` +
      `name=${formatLogValue(logDetails.name)}${extraFields ? ` ${extraFields}` : ''}\n`
    fs.mkdirSync(userDataPath, { recursive: true })
    fs.appendFileSync(logFile, line, 'utf8')
    // 同步打印一份，开发模式下方便实时看到。
    // eslint-disable-next-line no-console
    console.error('[CRASH]', line.trim())
  } catch (_) {
    // 写日志失败不能反过来影响主流程。
  }
}

/**
 * 写入限流后的诊断日志。
 * @param {string} source 日志来源。
 * @param {object} details 日志详情。
 * @param {string} throttleKey 限流键。
 */
function appendThrottledCrashLog (source, details, throttleKey) {
  const now = Date.now()
  const key = `${source}:${throttleKey}`
  const lastTime = resourceLogThrottleMap.get(key) || 0

  if (now - lastTime < RESOURCE_LOG_THROTTLE_MS) return
  if (resourceLogThrottleMap.size > 300) resourceLogThrottleMap.clear()

  resourceLogThrottleMap.set(key, now)
  appendCrashLog(source, details)
}

/**
 * 提取 webRequest 诊断字段。
 * @param {object} details Electron webRequest 事件详情。
 * @returns {object} 可直接写入 crash.log 的字段。
 */
function buildResourceLogDetails (details) {
  return {
    type: details.resourceType || 'unknown',
    reason: details.error || `HTTP_${details.statusCode}`,
    exitCode: details.statusCode || '',
    name: details.url,
    method: details.method,
    fromCache: details.fromCache,
    referrer: details.referrer,
    webContentsId: details.webContentsId,
    frameId: details.frameId,
  }
}

/**
 * 监听直播页及其 SDK CDN 的资源失败，定位 ErrorBoundary 背后的真实失败 URL。
 */
function registerLiveResourceDiagnostics () {
  if (liveResourceDiagnosticsRegistered) return
  liveResourceDiagnosticsRegistered = true

  const filter = { urls: LIVE_RESOURCE_DIAGNOSTIC_URLS }

  session.defaultSession.webRequest.onErrorOccurred(filter, details => {
    appendThrottledCrashLog(
      'resource-fail',
      buildResourceLogDetails(details),
      `${details.error}:${details.resourceType}:${details.url}`
    )
  })

  session.defaultSession.webRequest.onCompleted(filter, details => {
    if (!details.statusCode || details.statusCode < 400) return

    appendThrottledCrashLog(
      'resource-http',
      buildResourceLogDetails(details),
      `${details.statusCode}:${details.resourceType}:${details.url}`
    )
  })
}

/**
 * 监听主进程未捕获异常和 Promise 拒绝，避免主进程直接退出时没有原因。
 */
function registerMainProcessDiagnostics () {
  if (mainProcessDiagnosticsRegistered) return
  mainProcessDiagnosticsRegistered = true

  process.on('uncaughtException', error => {
    appendCrashLog('main-exception', {
      type: 'uncaughtException',
      reason: error,
      exitCode: 1,
      name: app.getVersion(),
      crashDumpsDir: getCrashDumpsDirectory(),
    })
    process.exit(1)
  })

  process.on('unhandledRejection', reason => {
    appendCrashLog('main-exception', {
      type: 'unhandledRejection',
      reason,
      exitCode: '',
      name: app.getVersion(),
    })
  })
}

module.exports = {
  appendCrashLog,
  getCrashDumpsDirectory,
  isLocalCrashReporterStarted,
  markRunStateExited,
  registerLiveResourceDiagnostics,
  registerMainProcessDiagnostics,
  startLocalCrashReporter,
  startRunStateDiagnostics,
}
