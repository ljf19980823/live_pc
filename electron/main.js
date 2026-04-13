const { app, BrowserWindow, shell, dialog } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

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
  mainWindow.setContentProtection(true)

  // 立即检测一次，之后每 3 秒检测一次
  checkScreenGuard()
  screenGuardInterval = setInterval(checkScreenGuard, 3000)
}

function stopScreenGuard () {
  if (screenGuardInterval) {
    clearInterval(screenGuardInterval)
    screenGuardInterval = null
  }
}

// ─── 创建主窗口 ──────────────────────────────────────────────────────────
function createWindow () {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(__dirname, '../build/icon.icns')

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
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
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['确认退出', '取消'],
      defaultId: 1,
      cancelId: 1,
      title: '退出确认',
      message: '确认退出当前应用程序？'
    })
    if (choice === 0) {
      stopScreenGuard()
      mainWindow.destroy()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
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
