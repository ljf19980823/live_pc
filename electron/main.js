const { app, BrowserWindow, shell } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let screenGuardInterval = null

// ─── 需要检测的录屏软件进程名 ─────────────────────────────────────────────
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
]

const RECORDER_PROCESSES_MAC = [
  'obs',                   // OBS Studio
  'quicktimeplayer',       // QuickTime Player（录屏状态下）
  'screenium',             // Screenium
  'kap',                   // Kap
  'screenpresso',          // Screenpresso
  'screenflick',           // ScreenFlick
  'reflector',             // Reflector
  'loopback',              // Loopback
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
      exec('ps -eo comm', { timeout: 5000 }, (err, stdout) => {
        if (err) { resolve([]); return }
        const processes = stdout.split('\n')
          .map(line => path.basename(line.trim()).toLowerCase())
          .filter(Boolean)
        resolve(processes)
      })
    } else {
      resolve([])
    }
  })
}

// ─── 执行一次检测并通知渲染进程 ──────────────────────────────────────────
async function checkScreenGuard () {
  if (!mainWindow || mainWindow.isDestroyed()) return

  try {
    const processes = await getRunningProcesses()

    const recorderList = process.platform === 'win32'
      ? RECORDER_PROCESSES_WIN
      : RECORDER_PROCESSES_MAC
    const vmList = process.platform === 'win32'
      ? VM_PROCESSES_WIN
      : VM_PROCESSES_MAC

    let detectedRecorder = null
    let detectedVM = null

    for (const p of recorderList) {
      if (processes.some(proc => proc === p.toLowerCase() || proc.startsWith(p.toLowerCase().replace('.exe', '')))) {
        detectedRecorder = p
        break
      }
    }

    for (const p of vmList) {
      if (processes.some(proc => proc === p.toLowerCase() || proc.startsWith(p.toLowerCase().replace('.exe', '')))) {
        detectedVM = p
        break
      }
    }

    mainWindow.webContents.send('screen-guard-change', {
      isRecording: !!detectedRecorder,
      isVM: !!detectedVM,
      detected: !!(detectedRecorder || detectedVM)
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
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    title: '立升直播',
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

  mainWindow.on('closed', () => {
    stopScreenGuard()
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
