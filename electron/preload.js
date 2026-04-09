const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onScreenGuardChange: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('screen-guard-change', handler)
    return () => ipcRenderer.removeListener('screen-guard-change', handler)
  }
})
