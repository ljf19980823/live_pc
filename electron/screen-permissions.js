const SCREEN_SETTINGS_URL = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'

function registerScreenPermissionHandlers({ ipcMain, systemPreferences, desktopCapturer, shell, platform = process.platform }) {
  ipcMain.handle('get-screen-access-status', () => {
    if (platform !== 'darwin') return 'granted'
    return systemPreferences.getMediaAccessStatus('screen')
  })

  ipcMain.handle('open-screen-preferences', async () => {
    if (platform !== 'darwin') return { success: true }

    // 仅在用户点击“前往系统设置”后尝试访问屏幕源，让首次安装的应用
    // 有机会登记到系统权限列表；查询失败不影响后续打开设置。
    try {
      if (systemPreferences.getMediaAccessStatus('screen') !== 'granted') {
        await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1, height: 1 }
        })
      }
    } catch (error) {
      console.warn('[ScreenPermission] 屏幕访问登记失败，继续打开系统设置', error)
    }

    try {
      await shell.openExternal(SCREEN_SETTINGS_URL)
      return { success: true }
    } catch (error) {
      console.warn('[ScreenPermission] 打开录屏设置失败', error)
      return {
        success: false,
        message: '请手动前往“系统设置 → 隐私与安全性 → 录屏与系统录音”，为「Learn InClass」开启权限。'
      }
    }
  })
}

module.exports = { registerScreenPermissionHandlers }
