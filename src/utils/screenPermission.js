import Vue from 'vue'

export const screenShareDialog = Vue.observable({
  visible: false,
  kind: 'permission',
  status: '',
  opening: false,
  error: ''
})

const permissionStatuses = ['not-determined', 'granted', 'denied', 'restricted', 'unknown']
const manualSettingsMessage = '请手动前往“系统设置 → 隐私与安全性 → 录屏与系统录音（旧版为屏幕录制）”，为「Learn InClass」开启权限。'
let entryRequest = null
let removeNativeListeners = null

function showDialog(kind, status = '') {
  // 原生通知与进入前检查共用一份弹框，重复通知不叠加显示。
  if (screenShareDialog.visible || screenShareDialog.opening) return
  Object.assign(screenShareDialog, {
    visible: true,
    kind,
    status,
    opening: false,
    error: ''
  })
}

function closeDialog(continueEntry) {
  screenShareDialog.visible = false
  screenShareDialog.error = ''
  const resolve = entryRequest && entryRequest.resolve
  if (resolve) {
    entryRequest.resolve = null
    resolve(continueEntry)
  }
}

export function dismissScreenShareDialog() {
  if (screenShareDialog.opening) return
  closeDialog(true)
}

export async function openScreenPreferences() {
  if (!screenShareDialog.visible || screenShareDialog.opening) return
  screenShareDialog.opening = true
  screenShareDialog.error = ''
  try {
    const result = await window.electronAPI?.openScreenPreferences?.()
    if (!result || !result.success) {
      throw new Error(result?.message || '无法打开系统设置')
    }
    // 用户选择先去授权，本次不创建课堂 iframe。
    closeDialog(false)
  } catch (error) {
    console.warn('[ScreenPermission] 打开系统设置失败', error)
    screenShareDialog.error = `无法打开系统设置。${manualSettingsMessage}`
  } finally {
    screenShareDialog.opening = false
  }
}

/**
 * 仅对直播角色 1（教师）、2（助教）进行进入前检查。
 * owner 用于在页面销毁、被缓存隐藏或切换路由时取消尚未完成的进入操作。
 */
export async function confirmScreenPermissionBeforeEntry(liveRole, owner) {
  const isOwnerActive = () => !owner || (
    !owner._isDestroyed && !owner._isBeingDestroyed && !owner._inactive
  )
  if (!isOwnerActive()) return false
  if (![1, 2].includes(Number(liveRole))) return true

  const bridge = window.electronAPI
  if (!bridge?.getScreenAccessStatus || !bridge?.openScreenPreferences) return true
  if (entryRequest || screenShareDialog.visible || screenShareDialog.opening) return false

  const request = { cancelled: false, resolve: null, showingDialog: false }
  entryRequest = request
  const isCurrent = () => !request.cancelled && isOwnerActive()
  const cancel = () => {
    request.cancelled = true
    if (entryRequest === request && request.showingDialog) closeDialog(false)
  }
  let unwatchRoute
  if (owner) {
    owner.$once('hook:beforeDestroy', cancel)
    owner.$once('hook:deactivated', cancel)
    unwatchRoute = owner.$watch('$route.fullPath', cancel)
  }

  try {
    let status
    try {
      // Windows 在主进程返回 granted；浏览器没有此桥接时直接放行。
      status = await bridge.getScreenAccessStatus()
    } catch (error) {
      console.warn('[ScreenPermission] 查询录屏权限失败，继续进入课堂', error)
      return isCurrent()
    }
    if (!isCurrent()) return false
    if (status === 'granted') return true
    // 异常返回值按查询失败处理，避免把桥接错误显示成权限被拒绝。
    if (!permissionStatuses.includes(status)) return true
    if (screenShareDialog.visible) return false

    request.showingDialog = true
    showDialog('permission', status)
    const continueEntry = await new Promise(resolve => { request.resolve = resolve })
    return continueEntry && isCurrent()
  } finally {
    if (owner) {
      owner.$off('hook:beforeDestroy', cancel)
      owner.$off('hook:deactivated', cancel)
      if (unwatchRoute) unwatchRoute()
    }
    if (entryRequest === request) entryRequest = null
  }
}

/** 由 App 挂载时注册一次，避免 keep-alive 页面各自持有原生监听。 */
export function initializeScreenShareDialogs() {
  if (removeNativeListeners) return removeNativeListeners
  const bridge = window.electronAPI
  const removers = []
  if (bridge?.onScreenPermissionDenied) {
    removers.push(bridge.onScreenPermissionDenied(data => {
      showDialog('permission', data?.status || 'denied')
    }))
  }
  if (bridge?.onScreenCaptureFailed) {
    removers.push(bridge.onScreenCaptureFailed(() => showDialog('capture-failed')))
  }

  let removed = false
  removeNativeListeners = () => {
    if (removed) return
    removed = true
    removers.forEach(remove => { if (typeof remove === 'function') remove() })
    if (entryRequest) entryRequest.cancelled = true
    closeDialog(false)
    removeNativeListeners = null
  }
  return removeNativeListeners
}
