import seekBackwardIcon from '@/assets/icons/player/seek-backward-10.svg'
import seekForwardIcon from '@/assets/icons/player/seek-forward-10.svg'
import '@/assets/styles/aliplayerControls.scss'

const SEEK_STEP = 10
const FULLSCREEN_TRIGGER_HEIGHT = 96
const HIDE_DELAY = 2000
const controllers = []
let lastActive = null

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement
}

// 页面可能同时有听记视频和视频弹窗，快捷键只交给当前全屏或最上层的播放器。
function keyboardController() {
  const available = controllers.filter(item => item.available())
  const fullscreen = available.find(item => item.isFullscreen())
  if (fullscreen) return fullscreen
  const dialogs = available.filter(item => item.modal)
  const candidates = dialogs.length ? dialogs : available
  return candidates.includes(lastActive) ? lastActive : candidates[candidates.length - 1]
}

function onDocumentKeydown(event) {
  const controller = keyboardController()
  if (controller) controller.keydown(event)
}

/**
 * 为主播放器统一添加快捷键、跳转按钮和全屏底部悬浮操作。
 * canSeek 每次操作时检查业务权限；seekTo 可接入字幕及双视频同步逻辑。
 * 必须在播放器 dispose 前调用返回对象的 destroy，释放监听和延迟任务。
 */
export function attachAliplayerControls(player, {
  container,
  isActive = () => true,
  canSeek = () => true,
  seekTo = seconds => {
    // SDK seek 有节流；直接设置进度，让连续点击逐次生效，并正常触发 seeked 同步。
    const video = container.querySelector('video')
    if (video) video.currentTime = seconds
    else player.seek(seconds)
  },
  modal = true
}) {
  if (!player || !container) return { destroy() {} }
  let destroyed = false
  let controls = null
  let retryTimer = null
  let retries = 0
  let hideTimer = null
  let shownByPointer = false
  let failed = false
  const events = []

  const controller = {
    modal,
    available: () => !destroyed && !failed && container.isConnected && isActive(),
    isFullscreen: () => !!fullscreenElement() && fullscreenElement().contains(container),
    keydown
  }

  function seekBy(offset) {
    if (!controller.available() || !canSeek()) return false
    const current = Number(player.getCurrentTime())
    const duration = Number(player.getDuration())
    if (!Number.isFinite(current) || !Number.isFinite(duration) || duration <= 0) return false
    seekTo(Math.max(0, Math.min(duration, current + offset)))
    return true
  }

  function keydown(event) {
    const video = container.querySelector('video')
    if (!video || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    const target = event.target
    if (target && (target.isContentEditable || (target.closest && target.closest(
      'input, textarea, select, button, a, [role="button"], [role="textbox"], [role="slider"], [contenteditable]:not([contenteditable="false"])'
    )))) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (seekBy(event.key === 'ArrowLeft' ? -SEEK_STEP : SEEK_STEP)) event.preventDefault()
    } else if (event.key === ' ') {
      event.preventDefault()
      // 长按空格仅切换一次，防止播放状态连续翻转。
      if (!event.repeat) {
        if (video.paused || video.ended) player.play()
        else player.pause()
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const volume = Number(player.getVolume())
      if (!Number.isFinite(volume)) return
      event.preventDefault()
      player.setVolume(Math.max(0, Math.min(1, Number((volume + (event.key === 'ArrowUp' ? 0.1 : -0.1)).toFixed(1)))))
    }
  }

  function updateState() {
    if (destroyed) return
    const duration = Number(player.getDuration())
    const disabled = failed || !canSeek() || !Number.isFinite(duration) || duration <= 0
    if (controls) controls.querySelectorAll('button').forEach(button => { button.disabled = disabled })
    // 按总时长一次性预留时间位数，播放跨小时时按钮也不移动。
    const hours = Number.isFinite(duration) && duration >= 3600 ? String(Math.floor(duration / 3600)).padStart(2, '0').length : 0
    container.style.setProperty('--aliplayer-time-width', `${2 * (hours ? hours + 6 : 5) + 3}ch`)
  }

  function inject() {
    if (destroyed) return
    const bar = container.querySelector('.prism-controlbar')
    if (!bar) {
      if (retries++ < 40) retryTimer = setTimeout(inject, 100)
      return
    }
    controls = document.createElement('div')
    controls.className = 'hrp-seek-controls'
    controls.setAttribute('role', 'group')
    controls.setAttribute('aria-label', '播放进度快捷操作')
    controls.addEventListener('dblclick', event => event.stopPropagation())
    const offsets = [-SEEK_STEP, SEEK_STEP]
    offsets.forEach(offset => {
      const backward = offset < 0
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `hrp-seek-btn hrp-seek-btn--${backward ? 'backward' : 'forward'}`
      button.title = backward ? '后退 10 秒（←）' : '前进 10 秒（→）'
      button.setAttribute('aria-label', backward ? '后退 10 秒' : '前进 10 秒')
      const icon = document.createElement('img')
      icon.className = 'hrp-seek-btn__icon'
      icon.src = backward ? seekBackwardIcon : seekForwardIcon
      icon.alt = ''
      icon.draggable = false
      icon.setAttribute('aria-hidden', 'true')
      button.appendChild(icon)
      button.addEventListener('click', event => {
        event.stopPropagation()
        lastActive = controller
        seekBy(offset)
      })
      controls.appendChild(button)
    })
    const anchor = bar.querySelector('.prism-time-display') || bar.querySelector('.prism-play-btn')
    if (anchor && anchor.parentNode === bar) bar.insertBefore(controls, anchor.nextSibling)
    else bar.appendChild(controls)
    updateState()
  }

  function clearHide() {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  function scheduleHide() {
    if (!controller.isFullscreen() || !shownByPointer || hideTimer) return
    hideTimer = setTimeout(() => {
      hideTimer = null
      if (!destroyed && controller.isFullscreen()) player.hideControlBar()
      shownByPointer = false
    }, HIDE_DELAY)
  }

  function onMouseMove(event) {
    lastActive = controller
    if (!controller.available() || !controller.isFullscreen()) return
    const nearBottom = event.clientY >= container.getBoundingClientRect().bottom - FULLSCREEN_TRIGGER_HEIGHT
    // 设置及音量面板可能高于底部区域，操作面板时仍保持控制栏显示。
    const onControls = event.target.closest && event.target.closest('.prism-controlbar, .prism-setting-list, .prism-volume-control, .prism-selector')
    if (nearBottom || onControls) {
      clearHide()
      // SDK 的此 API 同时清除内部隐藏计时，不需要通过点击视频唤出。
      player.showControlBar()
      shownByPointer = true
    } else scheduleHide()
  }

  function onFullscreenChange() {
    if (!controller.isFullscreen()) {
      clearHide()
      shownByPointer = false
    }
  }

  function activate() { lastActive = controller }
  function listen(event, handler) { player.on(event, handler); events.push([event, handler]) }
  container.classList.add('aliplayer-enhanced')
  // 捕获阶段可接收被进度条内部阻止冒泡的鼠标移动。
  container.addEventListener('mousemove', onMouseMove, true)
  container.addEventListener('mousedown', activate, true)
  container.addEventListener('mouseleave', scheduleHide)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  if (!controllers.length) document.addEventListener('keydown', onDocumentKeydown)
  controllers.push(controller)
  // 新打开的播放器立即取得快捷键，不必先点击视频来激活。
  lastActive = controller
  listen('error', () => { failed = true; updateState() })
  const stateEvents = ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked']
  stateEvents.forEach(event => listen(event, updateState))
  inject()

  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      clearHide()
      clearTimeout(retryTimer)
      events.forEach(([event, handler]) => player.off(event, handler))
      container.removeEventListener('mousemove', onMouseMove, true)
      container.removeEventListener('mousedown', activate, true)
      container.removeEventListener('mouseleave', scheduleHide)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      const index = controllers.indexOf(controller)
      if (index >= 0) controllers.splice(index, 1)
      if (lastActive === controller) lastActive = null
      if (!controllers.length) document.removeEventListener('keydown', onDocumentKeydown)
      if (controls) controls.remove()
      container.classList.remove('aliplayer-enhanced')
      container.style.removeProperty('--aliplayer-time-width')
    }
  }
}
