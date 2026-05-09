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

  // ─── 版本更新 ─────────────────────────────────────────────────────────────
  // 获取当前应用版本号
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 检查是否有新版本，返回 { hasUpdate, version, downloadUrl, description }
  checkForUpdate: () => ipcRenderer.invoke('check-for-update'),

  // 开始下载更新包
  downloadUpdate: (url) => ipcRenderer.send('download-update', url),

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
})
