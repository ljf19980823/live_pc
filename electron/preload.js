const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── 防录屏 ───────────────────────────────────────────────────────────────
  onScreenGuardChange: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('screen-guard-change', handler)
    return () => ipcRenderer.removeListener('screen-guard-change', handler)
  },

  // ─── 系统信息 ─────────────────────────────────────────────────────────────
  // 获取操作系统、CPU、内存信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  // 获取接口请求头所需的设备信息
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),

  // ─── 版本更新 ─────────────────────────────────────────────────────────────
  // 获取当前应用版本号
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 检查是否有新版本，返回 { hasUpdate, version, downloadUrl, description }
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),

  // 开始下载更新包
  downloadUpdate: (url) => ipcRenderer.send('download-update', url),
  
  // 最小化窗口
  minimizeWindow: () => ipcRenderer.send('window-minimize'),

  // 监听下载进度（0-100），返回移除监听的函数
  onUpdateProgress: (callback) => {
    const handler = (_, progress) => callback(progress)
    ipcRenderer.on('update-download-progress', handler)
    return () => ipcRenderer.removeListener('update-download-progress', handler)
  },

  // 监听下载完成，回调参数为本地文件路径，返回移除监听的函数
  onUpdateComplete: (callback) => {
    const handler = (_, filePath) => callback(filePath)
    ipcRenderer.on('update-download-complete', handler)
    return () => ipcRenderer.removeListener('update-download-complete', handler)
  },

  // 监听下载错误，返回移除监听的函数
  onUpdateError: (callback) => {
    const handler = (_, error) => callback(error)
    ipcRenderer.on('update-download-error', handler)
    return () => ipcRenderer.removeListener('update-download-error', handler)
  },

  // 打开安装包并退出应用
  installUpdate: (filePath) => ipcRenderer.send('install-update', filePath),

  // ─── macOS 媒体权限 ───────────────────────────────────────────────────────
  // 查询系统权限状态：'not-determined' | 'granted' | 'denied' | 'restricted'
  getMediaAccessStatus: (mediaType) => ipcRenderer.invoke('get-media-access-status', mediaType),
  // 主动弹出系统级授权对话框，返回 Promise<boolean>
  askForMediaAccess: (mediaType) => ipcRenderer.invoke('ask-for-media-access', mediaType),

  // ─── macOS 屏幕录制权限 ───────────────────────────────────────────────────
  // 查询屏幕录制权限状态（与摄像头/麦克风不同，无法通过代码弹窗申请）
  // 返回：'not-determined' | 'granted' | 'denied' | 'restricted'（非 macOS 返回 'granted'）
  getScreenAccessStatus: () => ipcRenderer.invoke('get-screen-access-status'),
  // 打开系统设置 → 隐私与安全性 → 屏幕录制，引导用户手动授权
  openScreenPreferences: () => ipcRenderer.invoke('open-screen-preferences'),
  // 打开崩溃日志所在目录（用于"反馈崩溃问题"按钮）
  openCrashLogFolder: () => ipcRenderer.invoke('open-crash-log-folder'),

  // 用系统默认浏览器打开外部链接
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  // 复制图片到系统剪贴板
  copyImageToClipboard: (url) => ipcRenderer.invoke('copy-image-to-clipboard', url),
  // 监听主进程通知：屏幕录制权限被拒绝（getDisplayMedia 被调用但权限不足时触发）
  onScreenPermissionDenied: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('screen-permission-denied', handler)
    return () => ipcRenderer.removeListener('screen-permission-denied', handler)
  },

  // 监听主进程通知：权限已授权但屏幕采集失败（重试多次后仍无法获取屏幕源）
  onScreenCaptureFailed: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('screen-capture-failed', handler)
    return () => ipcRenderer.removeListener('screen-capture-failed', handler)
  },

  // 监听直播 iframe 文档级加载失败
  onIframeLoadFailed: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('iframe-load-failed', handler)
    return () => ipcRenderer.removeListener('iframe-load-failed', handler)
  },

})
