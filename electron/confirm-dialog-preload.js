const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dialogAPI', {
  confirm: () => ipcRenderer.send('exit-dialog-confirm'),
  cancel: () => ipcRenderer.send('exit-dialog-cancel')
})
