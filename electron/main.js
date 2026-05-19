const { app, BrowserWindow, shell, ipcMain, Menu, session, systemPreferences, desktopCapturer } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const os = require('os')
const isDev = process.env.NODE_ENV === 'development'

// ─── 版本检查接口地址（请修改为实际的版本检查 API）────────────────────────────
// 接口需返回 JSON，格式示例：
// {
//   "version": "2.0.0",
//   "win_download_url": "https://example.com/setup-2.0.0.exe",
//   "mac_download_url": "https://example.com/app-2.0.0.dmg",
//   "description": "更快、更稳定的2.0客户端"
// }
const VERSION_CHECK_URL = 'http://47.92.30.163:8085/edu/sso/latestVersion'

let mainWindow
let screenGuardInterval = null
// 连续检测到威胁的次数，需达到阈值才显示警告（防止瞬时误报）
let consecutiveDetections = 0
const DETECTION_THRESHOLD = 2

// ─── 需要检测的录屏软件进程名（精确匹配白名单） ───────────────────────────
// 注意：gamebar.exe / gamebarpresencewriter.exe 是 Windows 系统后台常驻进程，
// 不代表用户正在录屏，故不纳入检测名单，避免误报。
const RECORDER_PROCESSES_WIN = [
  'obs64.exe', 'obs32.exe', 'obs.exe',        // OBS Studio
  'bdcam.exe',                                  // Bandicam 班迪录屏
  'fraps.exe',                                  // Fraps
  'camrecorder.exe', 'camtasia.exe',           // Camtasia
  'snagit32.exe', 'snagit64.exe',              // SnagIt
  'sharex.exe',                                 // ShareX
  'xsplit.broadcaster.exe',                    // XSplit
  'gamebar.exe', 'gamebarpresencewriter.exe',  // Windows 游戏录制
  'loom.exe',                                   // Loom
  'flashbackrecorder.exe',                     // FlashBack
  'debut.exe',                                  // Debut Video Capture
  'icecreamscreenrecorder.exe',                // IceCream
  'screenpresso.exe',                           // Screenpresso
  'captura.exe',                                // Captura
  'ezvid.exe',                                  // Ezvid
  'screencastify.exe',
  'wondersharefreevideoeditor.exe',
  'action.exe',                                 // Action! 录屏
  'd3dgear.exe',                                // D3DGear
  'mirilisaction.exe',                          // Mirillis Action
  'apowerrec.exe',                              // ApowerREC
  'gifcam.exe',                                 // GifCam
  'hypersnap.exe',                              // HyperSnap
  'recordmydesktop.exe',
  'tinytake.exe',                               // TinyTake
  'screenrec.exe',                              // ScreenRec
  'movavi screen recorder.exe',                 // Movavi
  'movaviscreen.exe',
  'drscreen.exe',                               // Dr.Screen
  'screentoaster.exe',
  'screencast-o-matic.exe',
  'flashback express recorder.exe',
  'veed.exe',
  'clipchamp.exe',                              // Clipchamp（Win11内置）
]

// macOS 进程二进制名（ps 命令输出，可能被截断至15字符）
const RECORDER_PROCESSES_MAC = [
  'obs',                    // OBS Studio
  'screenium',              // Screenium
  'kap',                    // Kap
  'screenpresso',           // Screenpresso
  'screenflick',            // ScreenFlick
  'reflector',              // Reflector 4
  'loopback',               // Loopback
  'recordit',               // RecordIt
  'screen studio',          // Screen Studio（热门 Mac 录屏）
  'loom',                   // Loom
  'mmhmm',                  // mmHmm 虚拟摄像头/录制
  'camo',                   // Camo
  'camtasia',               // Camtasia
  'screencastify',          // Screencastify
  'apowerrec',              // ApowerREC
  'icecreamscreenrecorder', // IceCream Screen Recorder
  'movavi screen rec',      // Movavi（截断后前15字符）
  'gyroflow toolbox',       // Gyroflow Toolbox
  'rottenwood',             // Rottenwood
  // ── 系统级录屏指标（最可靠）──────────────────────────────────────────
  // 任何 App 通过 ScreenCaptureKit 或旧版 API 录屏时，系统会启动此进程
  'screencaptured',         // ★ macOS 录屏守护进程，录屏必然出现
  'screensharingd',         // 屏幕共享守护进程（AirPlay/远程桌面共享）
]

// macOS App 名称（通过 osascript 获取，完整无截断）
const RECORDER_APPS_MAC = [
  'obs studio', 'obs',
  'quicktime player',       // QuickTime 录屏时 screencaptured 会同时出现
  'screenium',
  'kap',
  'screenpresso',
  'screenflick',
  'reflector 4', 'reflector',
  'loopback',
  'record it!', 'recordit',
  'screen studio',
  'loom',
  'mmhmm',
  'camo',
  'camtasia',
  'screencastify',
  'apowerrec',
  'icecream screen recorder',
  'movavi screen recorder',
  'gyroflow toolbox',
  'rottenwood',
]

// ─── 进程名关键词模糊匹配（用于捕获未知录屏软件） ────────────────────────
// 匹配进程名中包含这些关键词的进程，作为补充检测（可能有少量误报）
const RECORDER_KEYWORDS = [
  'screenrecord', 'screen-record', 'screen_record',
  'screencapture', 'screen-capture', 'screen_capture',
  'screencast', 'screen-cast',
  'capturescreen',
  // 注意：'recorder'/'recording' 过于宽泛，macOS 上误报风险高，已移除
]

// 关键词匹配中需要排除的系统/常见无害进程（防止误报）
const KEYWORD_WHITELIST_WIN = [
  'audiodg.exe', 'svchost.exe', 'system', 'explorer.exe',
  'taskhostw.exe', 'runtimebroker.exe', 'searchapp.exe',
]
const KEYWORD_WHITELIST_MAC = [
  'systemuiserver', 'coreaudiod', 'coremediaio', 'avconferenced',
  'audioses', 'coreservicesd',
]

// ─── 需要检测的虚拟机进程名 ───────────────────────────────────────────────
const VM_PROCESSES_WIN = [
  'vmtoolsd.exe', 'vmwaretray.exe', 'vmwareuser.exe', 'vmnat.exe', // VMware
  'vboxservice.exe', 'vboxtray.exe',                                 // VirtualBox
  'prl_tools.exe', 'prl_cc.exe', 'prl_client_app.exe',             // Parallels
  'vmsrvc.exe', 'vmusrvc.exe',                                       // Virtual PC
  'qemu-ga.exe',                                                     // QEMU
]

const VM_PROCESSES_MAC = [
  'vmware-tools-daemon',  // VMware
  'vboxservice',          // VirtualBox
  'prl_tools',            // Parallels
]

// ─── 获取当前运行的所有进程名 ─────────────────────────────────────────────
function getRunningProcesses () {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('tasklist /fo csv /nh', { timeout: 5000 }, (err, stdout) => {
        if (err) { resolve([]); return }
        const processes = stdout.split('\n')
          .map(line => line.split(',')[0].replace(/"/g, '').toLowerCase().trim())
          .filter(Boolean)
        resolve(processes)
      })
    } else if (process.platform === 'darwin') {
      // ps -eo comm 会将进程名截断到 15 字符，改用 args 获取完整路径再取 basename
      exec('ps axo args=', { timeout: 5000 }, (err, stdout) => {
        if (err) { resolve([]); return }
        const processes = stdout.split('\n')
          .map(line => path.basename(line.trim().split(' ')[0]).toLowerCase())
          .filter(Boolean)
        resolve(processes)
      })
    } else {
      resolve([])
    }
  })
}

// ─── macOS：通过 osascript 获取完整 App 名称列表 ─────────────────────────
// ps 命令获取的是二进制名，osascript 获取的是 App 显示名（如 "QuickTime Player"）
// 两者互补，覆盖更多情况
function getMacAppNames () {
  return new Promise((resolve) => {
    if (process.platform !== 'darwin') { resolve([]); return }
    exec(
      'osascript -e \'tell application "System Events" to get name of every process\'',
      { timeout: 8000 },
      (err, stdout) => {
        if (err) { resolve([]); return }
        // 返回格式：App1, App2, App3, ...
        const apps = stdout.split(',')
          .map(name => name.trim().toLowerCase())
          .filter(Boolean)
        resolve(apps)
      }
    )
  })
}

// ─── 执行一次检测并通知渲染进程 ──────────────────────────────────────────
async function checkScreenGuard () {
  if (!mainWindow || mainWindow.isDestroyed()) return

  try {
    const isMac = process.platform === 'darwin'
    const isWin = process.platform === 'win32'

    const processes = await getRunningProcesses()
    // macOS 额外获取 App 显示名（osascript），与二进制名互补
    const macAppNames = isMac ? await getMacAppNames() : []

    const recorderList = isWin ? RECORDER_PROCESSES_WIN : RECORDER_PROCESSES_MAC
    const vmList = isWin ? VM_PROCESSES_WIN : VM_PROCESSES_MAC
    const keywordWhitelist = isWin ? KEYWORD_WHITELIST_WIN : KEYWORD_WHITELIST_MAC

    let detectedRecorder = null
    let detectedVM = null

    // 1. 精确匹配已知录屏进程（二进制名）
    for (const p of recorderList) {
      if (processes.includes(p.toLowerCase())) {
        detectedRecorder = p
        break
      }
    }

    // 2. macOS：精确匹配 App 显示名（osascript 获取，无截断）
    if (!detectedRecorder && isMac) {
      for (const app of RECORDER_APPS_MAC) {
        if (macAppNames.includes(app.toLowerCase())) {
          detectedRecorder = app
          break
        }
      }
    }

    // 3. 关键词模糊匹配（捕获未知录屏软件），仅在精确匹配未命中时执行
    if (!detectedRecorder) {
      const allProcs = isMac ? [...new Set([...processes, ...macAppNames])] : processes
      for (const proc of allProcs) {
        if (keywordWhitelist.includes(proc)) continue
        const matched = RECORDER_KEYWORDS.find(kw => proc.includes(kw))
        if (matched) {
          detectedRecorder = `[keyword:${matched}] ${proc}`
          break
        }
      }
    }

    for (const p of vmList) {
      if (processes.includes(p.toLowerCase())) {
        detectedVM = p
        break
      }
    }

    const threatFound = !!(detectedRecorder || detectedVM)

    if (threatFound) {
      // 累计连续检测次数，达到阈值才真正报警（防瞬时误报）
      consecutiveDetections = Math.min(consecutiveDetections + 1, DETECTION_THRESHOLD)
    } else {
      // 未检测到威胁：立即重置计数，同时通知渲染层清除遮罩
      consecutiveDetections = 0
    }

    const shouldAlert = consecutiveDetections >= DETECTION_THRESHOLD

    mainWindow.webContents.send('screen-guard-change', {
      isRecording: shouldAlert ? !!detectedRecorder : false,
      isVM: shouldAlert ? !!detectedVM : false,
      detected: shouldAlert
    })
  } catch (e) {
    // 检测失败时静默处理，不影响主功能
  }
}

// ─── 启动防录屏守护 ──────────────────────────────────────────────────────
function startScreenGuard () {
  // 启用内容保护：窗口内容在任何截图/录屏工具中显示为黑色
  // mainWindow.setContentProtection(true)

  // 立即检测一次，之后每 3 秒检测一次
  // checkScreenGuard()
  // screenGuardInterval = setInterval(checkScreenGuard, 3000)
}

function stopScreenGuard () {
  if (screenGuardInterval) {
    clearInterval(screenGuardInterval)
    screenGuardInterval = null
  }
}

// ─── 自定义退出确认弹窗 ───────────────────────────────────────────────────
function showExitConfirmDialog () {
  const bounds = mainWindow.getBounds()
  const confirmWin = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    parent: mainWindow,
    modal: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'confirm-dialog-preload.js')
    }
  })

  confirmWin.loadFile(path.join(__dirname, 'confirm-dialog.html'))

  // 主窗口移动或缩放时同步更新弹窗的位置和尺寸
  const syncBounds = () => {
    if (!confirmWin.isDestroyed()) {
      confirmWin.setBounds(mainWindow.getBounds())
    }
  }
  mainWindow.on('move', syncBounds)
  mainWindow.on('resize', syncBounds)

  confirmWin.once('ready-to-show', () => {
    confirmWin.show()
  })

  const cleanup = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeListener('move', syncBounds)
      mainWindow.removeListener('resize', syncBounds)
    }
    ipcMain.removeListener('exit-dialog-confirm', onConfirm)
    ipcMain.removeListener('exit-dialog-cancel', onCancel)
    if (!confirmWin.isDestroyed()) confirmWin.destroy()
  }

  const onConfirm = () => {
    cleanup()
    stopScreenGuard()
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy()
  }

  const onCancel = () => {
    cleanup()
  }

  ipcMain.once('exit-dialog-confirm', onConfirm)
  ipcMain.once('exit-dialog-cancel', onCancel)

  confirmWin.on('closed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeListener('move', syncBounds)
      mainWindow.removeListener('resize', syncBounds)
    }
    ipcMain.removeListener('exit-dialog-confirm', onConfirm)
    ipcMain.removeListener('exit-dialog-cancel', onCancel)
  })
}

// ─── 创建主窗口 ──────────────────────────────────────────────────────────
function createWindow () {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.icns')

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 720,
    minWidth: 1320, //1280
    minHeight: 720,
    show: false,
    title: '立升直播',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:8080')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' && input.type === 'keyDown') {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools()
        } else {
          mainWindow.webContents.openDevTools()
        }
      }
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    startScreenGuard()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('close', (event) => {
    event.preventDefault()
    showExitConfirmDialog()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── 版本更新：工具函数 ───────────────────────────────────────────────────────
/**
 * 带进度回调的文件下载，自动跟随 301/302 重定向
 * @param {string} url 下载地址
 * @param {string} destPath 本地保存路径
 * @param {function} onProgress 进度回调(0-100)
 * @returns {Promise<string>} 保存路径
 */
function downloadFileWithProgress (url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    /** 解析最终 href，并处理相对路径 / 协议相对 // / 大小写 HTTPS: */
    const toAbsoluteHref = (reqUrl, baseHref) => {
      const s = String(reqUrl).trim()
      const base = baseHref || 'https://_/'
      try {
        return new URL(s, base).href
      } catch {
        throw new Error(`无效的下载地址: ${s}`)
      }
    }

    const moduleForHref = (href) => {
      const proto = new URL(href).protocol
      if (proto === 'https:') return https
      if (proto === 'http:') return http
      throw new Error(`不支持的协议: ${proto}`)
    }

    const doRequest = (reqUrl, baseHref) => {
      let href
      try {
        href = toAbsoluteHref(reqUrl, baseHref)
      } catch (e) {
        reject(e)
        return
      }

      const mod = moduleForHref(href)
      mod.get(href, (response) => {
        const code = response.statusCode
        // 跟随重定向（含相对 Location）
        if (code === 301 || code === 302 || code === 303 || code === 307 || code === 308) {
          const loc = response.headers.location
          if (!loc) {
            reject(new Error('重定向响应缺少 Location'))
            return
          }
          doRequest(loc, href)
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，状态码: ${response.statusCode}`))
          return
        }

        const totalLength = parseInt(response.headers['content-length'] || '0', 10)
        let downloaded = 0
        const file = fs.createWriteStream(destPath)

        response.on('data', (chunk) => {
          downloaded += chunk.length
          file.write(chunk)
          if (totalLength > 0) {
            onProgress(Math.min(99, Math.round((downloaded / totalLength) * 100)))
          }
        })

        response.on('end', () => {
          file.close(() => {
            onProgress(100)
            resolve(destPath)
          })
        })

        response.on('error', (err) => {
          file.close()
          fs.unlink(destPath, () => {})
          reject(err)
        })
      }).on('error', reject)
    }

    doRequest(url)
  })
}

// ─── macOS 媒体权限：状态查询 & 主动申请 ─────────────────────────────────────
ipcMain.handle('get-media-access-status', (_, mediaType) => {
  if (process.platform !== 'darwin') return 'granted'
  return systemPreferences.getMediaAccessStatus(mediaType)
})

ipcMain.handle('ask-for-media-access', async (_, mediaType) => {
  if (process.platform !== 'darwin') return true
  try {
    return await systemPreferences.askForMediaAccess(mediaType)
  } catch {
    return false
  }
})

// ─── 获取系统信息 ─────────────────────────────────────────────────────────────
ipcMain.handle('get-system-info', () => {
  const platform = os.platform()
  const release = os.release()

  let osName
  if (platform === 'win32') {
    const buildNum = parseInt((release.split('.')[2] || '0'), 10)
    const winVersion = buildNum >= 22000 ? 'Windows 11' : 'Windows 10'
    osName = `${winVersion} (${release})`
  } else if (platform === 'darwin') {
    const majorKernel = parseInt(release.split('.')[0], 10)
    const macVersionMap = {
      20: 'macOS 11 Big Sur',
      21: 'macOS 12 Monterey',
      22: 'macOS 13 Ventura',
      23: 'macOS 14 Sonoma',
      24: 'macOS 15 Sequoia',
    }
    const macName = macVersionMap[majorKernel] || `macOS (Darwin ${release})`
    osName = `${macName} (${release})`
  } else {
    osName = `${os.type()} ${release}`
  }

  const cpus = os.cpus()
  const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : '未知'
  const totalMemGB = Math.round(os.totalmem() / (1024 ** 3))

  return { os: osName, cpu: cpuModel, memory: `${totalMemGB} GB` }
})

// ─── 获取当前应用版本 ─────────────────────────────────────────────────────────
ipcMain.handle('get-app-version', () => app.getVersion())

// ─── 检查是否有新版本 ─────────────────────────────────────────────────────────
ipcMain.handle('check-for-update', async () => {
  try {
    const currentVersion = app.getVersion()
    // Node.js 18+ 内置 fetch；若运行环境不支持请改用 https.get
    const res = await fetch(VERSION_CHECK_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return { hasUpdate: false }

    const json = await res.json()
    const data = json.data ?? json
    const latestVersion = data.systemVersion
    const winUrl = data.windowsUrl
    const macUrl = data.macUrl

    if (!latestVersion || latestVersion === currentVersion) {
      return { hasUpdate: false }
    }

    const downloadUrl = process.platform === 'win32' ? winUrl : macUrl
    const isForceUpdate = data.isForceUpdate ?? 0
    return { hasUpdate: true, version: latestVersion, downloadUrl, isForceUpdate }
  } catch (e) {
    return { hasUpdate: false, error: e.message }
  }
})

// ─── 下载更新包（带进度推送）─────────────────────────────────────────────────
ipcMain.on('download-update', async (event, downloadUrl) => {
  const ext = process.platform === 'win32' ? '.exe' : '.dmg'
  const tempPath = path.join(os.tmpdir(), `lisheng-update${ext}`)

  // 若旧缓存文件存在先删除
  if (fs.existsSync(tempPath)) {
    try { fs.unlinkSync(tempPath) } catch (_) {}
  }

  try {
    await downloadFileWithProgress(downloadUrl, tempPath, (progress) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('update-download-progress', progress)
      }
    })
    if (!event.sender.isDestroyed()) {
      event.sender.send('update-download-complete', tempPath)
    }
  } catch (err) {
    if (!event.sender.isDestroyed()) {
      event.sender.send('update-download-error', err.message)
    }
  }
})

// ─── 打开安装包并退出应用 ─────────────────────────────────────────────────────
ipcMain.on('install-update', (event, filePath) => {
  shell.openPath(filePath).then(() => {
    setTimeout(() => app.quit(), 1500)
  })
})

// ─── 检测重新安装并清除旧会话数据（Windows + macOS 通用）────────────────────
// 原理：将可执行文件的"创建时间 (birthtimeMs)"作为安装指纹保存到 userData。
//   - 首次安装：无指纹文件 → 记录指纹，不清除数据
//   - 重新安装：系统为新文件分配新的创建时间 → 指纹不匹配 → 清除会话数据
//   - 版本升级（覆盖安装）：文件 birthtime 不变 → 指纹匹配 → 不清除数据
// Windows: NSIS 解压时文件获得新 birthtime；macOS: DMG 拖拽安装后文件为新拷贝
async function clearDataOnReinstall () {
  try {
    const userDataPath = app.getPath('userData')
    const markerFile = path.join(userDataPath, '.install-fingerprint')
    const exePath = app.getPath('exe')

    const exeStat = fs.statSync(exePath)
    const fingerprint = exeStat.birthtimeMs.toString()

    let storedFingerprint = ''
    try {
      storedFingerprint = fs.readFileSync(markerFile, 'utf8').trim()
    } catch (_) {}

    if (storedFingerprint && storedFingerprint !== fingerprint) {
      // 指纹不同 → 检测到重新安装，清除所有 Chromium 会话数据
      // （包含 localStorage、sessionStorage、Cookie、IndexedDB 等）
      await session.defaultSession.clearStorageData()
    }

    // 写入/更新安装指纹
    fs.mkdirSync(userDataPath, { recursive: true })
    fs.writeFileSync(markerFile, fingerprint)
  } catch (_) {
    // 静默处理，不影响主流程
  }
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  await clearDataOnReinstall()

  // ─── macOS 摄像头 / 麦克风 / 屏幕等权限处理 ─────────────────────────────
  // Electron 默认拒绝所有渲染进程的权限请求，需手动放行媒体权限。
  // 此处理器在 macOS 上触发系统级权限弹窗（用户首次使用时需手动授权）。
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const ALLOWED = [
      'media',          // getUserMedia（摄像头 + 麦克风）
      'camera',
      'microphone',
      'display-capture', // 屏幕共享
      'mediaKeySystem',
      'geolocation',
      'notifications',
      'fullscreen',
      'openExternal',
      'clipboard-read',
      'clipboard-sanitized-write',
    ]
    callback(ALLOWED.includes(permission))
  })

  // 检查渲染进程是否已拥有某项权限（供 navigator.permissions.query 使用）
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const ALLOWED = ['media', 'camera', 'microphone', 'display-capture', 'mediaKeySystem', 'fullscreen']
    return ALLOWED.includes(permission)
  })

  // ─── 屏幕共享：拦截 getDisplayMedia() 请求 ──────────────────────────────
  // Electron 17+ 必须通过此处理器才能在渲染进程（含 iframe）中使用屏幕共享。
  // 不设置此处理器时，getDisplayMedia() 会直接返回 false / 抛出异常。
  // 此处自动选取整个主屏幕，行为与摄像头/麦克风自动授权一致。
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1, height: 1 },
      })
      if (sources.length === 0) { callback({}); return }
      const streams = { video: sources[0] }
      // Windows 支持同步采集系统音频
      if (process.platform === 'win32') {
        streams.audio = 'loopback'
      }
      callback(streams)
    } catch (_) {
      callback({})
    }
  })

  // ─── macOS 系统级媒体权限申请 ────────────────────────────────────────────
  // systemPreferences.askForMediaAccess 触发 macOS "相机/麦克风" 系统弹窗。
  // 必须在主进程调用，renderer 无法直接触发系统级授权对话框。
  if (process.platform === 'darwin') {
    // 预先请求，避免用户进入直播间时才弹出打断体验
    Promise.all([
      systemPreferences.askForMediaAccess('camera'),
      systemPreferences.askForMediaAccess('microphone'),
    ]).catch(() => {})
  }

  // ─── 清除上次遗留的 HTTP 磁盘缓存，确保 iframe 直播页始终拉取最新版本 ───
  try {
    await session.defaultSession.clearCache()
  } catch (_) {}

  // ─── 拦截直播域名的响应头，强制禁用缓存 ────────────────────────────────
  // 原因：Electron/Chromium 会将 iframe 加载的外部 JS/CSS/HTML 写入磁盘缓存，
  // 导致服务端更新后客户端仍展示旧版本。通过覆盖响应头可彻底避免。
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://live.fjlsjy123.com/*', 'http://live.fjlsjy123.com/*'] },
    (details, callback) => {
      const headers = Object.assign({}, details.responseHeaders)
      headers['cache-control'] = ['no-cache, no-store, must-revalidate']
      headers['pragma'] = ['no-cache']
      headers['expires'] = ['0']
      callback({ responseHeaders: headers })
    }
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 监听来自渲染进程的最小化请求
ipcMain.on('window-minimize', (event) => {
  // 获取发送该消息的窗口并最小化
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isMinimized()) {
    win.minimize();
  }
});
