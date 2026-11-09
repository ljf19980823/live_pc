// DMG 只挂载磁盘，不会把 App 安装到固定位置。
// 使用 Electron 原生安装流程替换同名 App，避免直接运行挂载卷中的副本。
async function prepareMacInstallation ({ app, dialog, platform = process.platform }) {
  if (platform !== 'darwin' || !app.isPackaged || app.isInApplicationsFolder()) return true

  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: '安装 Learn InClass',
    message: '将 Learn InClass 安装到“应用程序”？',
    detail: '该位置已有的同名旧版本将被替换。安装后请从“应用程序”启动，并推出桌面上的安装磁盘。若要使用自选目录，请将 App 拖入该目录，替换旧版后再运行。',
    buttons: ['安装到“应用程序”', '从当前位置运行', '退出'],
    defaultId: 0,
    cancelId: 2
  })
  if (response === 1) return true
  if (response !== 0) return false

  try {
    app.moveToApplicationsFolder({
      conflictHandler: conflictType => {
        if (conflictType === 'exists') return true
        // 原生默认行为会转而打开正在运行的旧版，不能当作升级成功。
        dialog.showMessageBoxSync({
          type: 'info',
          title: '请先退出旧版本',
          message: '“应用程序”中的 Learn InClass 正在运行。',
          detail: '请退出旧版本后，重新打开新版本完成替换安装。',
          buttons: ['知道了']
        })
        return false
      }
    })
  } catch (error) {
    await dialog.showMessageBox({
      type: 'error',
      title: '安装未完成',
      message: '无法将 Learn InClass 安装到“应用程序”。',
      detail: `请将 App 手动拖入“应用程序”，选择“替换”后重新打开。\n${error.message}`,
      buttons: ['知道了']
    })
  }

  // 成功时 Electron 会从目标目录重新启动；取消授权或失败时也不继续运行副本。
  return false
}

module.exports = { prepareMacInstallation }
