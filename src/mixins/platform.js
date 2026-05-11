/**
 * 平台检测 mixin
 * 优先使用 Electron 渲染进程注入的 process.platform，
 * 退回 navigator.userAgent 以兼容纯浏览器开发环境。
 */
function detectPlatform() {
  if (window.process && window.process.platform) {
    return window.process.platform
  }
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'win32'
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'darwin'
  return 'unknown'
}

export default {
  computed: {
    $platform() {
      return detectPlatform()
    },
    $isWindows() {
      return this.$platform === 'win32'
    },
    $isMac() {
      return this.$platform === 'darwin'
    }
  }
}
