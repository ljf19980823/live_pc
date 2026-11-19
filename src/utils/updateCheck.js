import { get } from '@/utils/request'
import pkg from '../../package.json'

/**
 * Check for client updates through Electron, or through the backend API while
 * running the local development server in a browser.
 */
export async function checkForUpdate() {
  if (window.electronAPI?.checkForUpdate) {
    return window.electronAPI.checkForUpdate()
  }

  if (process.env.NODE_ENV !== 'development') return { hasUpdate: false }

  try {
    const response = await get('/edu/sso/latestVersion', {}, {
      skipAuthorization: true,
      skipErrorMessage: true
    })
    const data = response?.data ?? response ?? {}
    const version = data.systemVersion
    if (!version || version === pkg.version) return { hasUpdate: false }

    const platform = `${navigator.platform || ''} ${navigator.userAgent || ''}`
    const isMac = /mac|iphone|ipad/i.test(platform)
    return {
      hasUpdate: true,
      version,
      downloadUrl: isMac ? data.macUrl || '' : data.windowsUrl || '',
      updateContent: data.updateContent || '',
      isForceUpdate: data.isForceUpdate ?? '0'
    }
  } catch (error) {
    return { hasUpdate: false, error: error.message }
  }
}
