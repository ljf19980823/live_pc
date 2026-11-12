import seekBackwardIcon from '@/assets/images/videoControl/后退10秒@2x.png'
import seekForwardIcon from '@/assets/images/videoControl/快进10秒@2x.png'
import fullScreenIcon from '@/assets/images/videoControl/fullScreen.png'
import smallScreenIcon from '@/assets/images/videoControl/smallScreen.png'
import voiceIcon from '@/assets/images/videoControl/voice.png'
import mutedVoiceIcon from '@/assets/images/videoControl/voice_no.png'
import danmuOnIcon from '@/assets/images/videoControl/播放器 ／ 弹幕开启@2x.png'
import danmuOffIcon from '@/assets/images/videoControl/播放器 ／ 弹幕关闭@2x.png'
import playIcon from '@/assets/images/videoControl/播放器图标 ／ 播放@2x.png'
import pauseIcon from '@/assets/images/videoControl/播放器图标 ／ 暂停@2x.png'
import { ALIPLAYER_SPEED_LEVELS } from '@/utils/aliplayerConfig'
import '@/assets/styles/videoPlayerControlSkin.scss'

const INJECT_RETRY_LIMIT = 40
const INJECT_RETRY_DELAY = 100

function createToggle(label, initialValue, onChange) {
  const wrapper = document.createElement('div')
  wrapper.className = 'vp-control-toggle'

  const text = document.createElement('span')
  text.className = 'vp-control-toggle__label'
  text.textContent = label

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'vp-control-toggle__button'
  button.setAttribute('aria-label', label)

  const image = document.createElement('img')
  image.alt = ''
  image.draggable = false
  button.appendChild(image)

  let enabled = initialValue
  const update = () => {
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false')
    image.src = enabled ? danmuOnIcon : danmuOffIcon
  }
  const setValue = value => {
    enabled = !!value
    update()
  }
  button.addEventListener('click', event => {
    event.stopPropagation()
    enabled = !enabled
    update()
    onChange(enabled)
  })
  update()
  wrapper.append(text, button)
  return { element: wrapper, button, getValue: () => enabled, setValue }
}

function createSpeedControl(player, container) {
  function formatSpeed(speed) {
    const number = Number(speed)
    return `${Number.isInteger(number) ? number.toFixed(1) : number}×`
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'vp-control-speed'

  const label = document.createElement('span')
  label.className = 'vp-control-speed__label'
  label.textContent = '倍速'

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'vp-control-speed__button'
  button.setAttribute('aria-label', '选择播放倍速')
  button.setAttribute('aria-haspopup', 'listbox')
  button.setAttribute('aria-expanded', 'false')

  const value = document.createElement('span')
  value.className = 'vp-control-speed__value'
  button.appendChild(value)

  const menu = document.createElement('div')
  menu.className = 'vp-control-speed__menu'
  menu.setAttribute('role', 'listbox')
  menu.setAttribute('aria-label', '播放倍速')
  const options = ALIPLAYER_SPEED_LEVELS.map(level => {
    const option = document.createElement('button')
    option.type = 'button'
    option.className = 'vp-control-speed__option'
    option.setAttribute('role', 'option')
    option.dataset.speed = String(level.key)
    option.textContent = formatSpeed(level.key)
    menu.appendChild(option)
    return option
  })
  wrapper.append(label, button, menu)

  let selectedSpeed = 1
  let video = null
  const update = speed => {
    const nextSpeed = Number(speed)
    if (Number.isFinite(nextSpeed) && nextSpeed > 0) selectedSpeed = nextSpeed
    value.textContent = formatSpeed(selectedSpeed)
    options.forEach(option => {
      const selected = Number(option.dataset.speed) === selectedSpeed
      option.classList.toggle('is-selected', selected)
      option.setAttribute('aria-selected', selected ? 'true' : 'false')
    })
  }
  const closeMenu = () => {
    menu.classList.remove('is-open')
    button.setAttribute('aria-expanded', 'false')
  }
  const syncFromVideo = () => {
    if (video) update(video.playbackRate)
  }
  const onDocumentClick = event => {
    if (!wrapper.contains(event.target)) closeMenu()
  }
  button.addEventListener('click', event => {
    event.stopPropagation()
    const isOpen = menu.classList.toggle('is-open')
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
  })
  options.forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation()
      const speed = Number(option.dataset.speed)
      try { player.setSpeed(speed) } catch (_) {}
      update(speed)
      closeMenu()
    })
  })
  document.addEventListener('click', onDocumentClick)
  video = container.querySelector('video')
  if (video) {
    video.addEventListener('ratechange', syncFromVideo)
    syncFromVideo()
  } else update(1)

  return {
    element: wrapper,
    destroy() {
      document.removeEventListener('click', onDocumentClick)
      if (video) video.removeEventListener('ratechange', syncFromVideo)
    }
  }
}

/** Apply the screenshot-based control bar skin to a visible Aliplayer instance. */
export function attachVideoPlayerControlSkin(player, {
  container,
  onDanmuChange = () => {},
  onSubtitleChange = () => {},
  subtitleEnabled = false,
  showSubtitleControl = false,
  useNativeSubtitles = true
} = {}) {
  if (!player || !container) return { destroy() {} }

  let destroyed = false
  let retryTimer = null
  let retries = 0
  let controlBar = null
  let row = null
  let observer = null
  let resizeObserver = null
  let usesWindowResize = false
  let danmuControl = null
  let subtitleControl = null
  let volumeIcon = null
  let volumePopup = null
  let thumbnailPopup = null
  let progressTime = null
  let progress = null
  let onVolumeIconClick = null
  let onProgressMouseMove = null
  let playerRoot = null
  let currentSubtitleState = !!subtitleEnabled
  const events = []

  function listen(event, handler) {
    if (!player.on) return
    player.on(event, handler)
    events.push([event, handler])
  }

  function dispatchDanmuState(enabled) {
    container.dispatchEvent(new CustomEvent('danmu-toggle', { bubbles: true, detail: { enabled } }))
  }

  function setSubtitleTracks(enabled) {
    const video = container.querySelector('video')
    const tracks = video && video.textTracks
    if (!tracks) return
    for (let index = 0; index < tracks.length; index++) {
      const track = tracks[index]
      if (track.kind === 'subtitles' || track.kind === 'captions') {
        track.mode = enabled ? 'showing' : 'disabled'
      }
    }
  }

  function updatePlayIcon(playButton) {
    if (!playButton) return
    const playing = playButton.classList.contains('playing')
    playButton.style.backgroundImage = `url("${playing ? pauseIcon : playIcon}")`
  }

  function updateVolumeIcon(volume) {
    if (!volume) return
    const icon = volume.querySelector('.volume-icon')
    if (!icon) return
    let currentVolume = 0
    try { currentVolume = Number(player.getVolume()) } catch (_) {}
    const muted = icon.classList.contains('mute') || (Number.isFinite(currentVolume) && currentVolume <= 0)
    icon.style.backgroundImage = `url("${muted ? mutedVoiceIcon : voiceIcon}")`
  }

  function updateFullscreenIcon(button) {
    if (!button) return
    button.style.backgroundImage = `url("${button.classList.contains('fullscreen') ? smallScreenIcon : fullScreenIcon}")`
  }

  function updateResponsiveMode() {
    const { width, height } = (playerRoot || container).getBoundingClientRect()
    const compact = width <= 760 && height <= 430
    const mini = width <= 580 && height <= 326
    const nano = width <= 380 && height <= 215
    const scale = width && height ? Math.max(1, Math.min(1.8, width / 1280, height / 720)) : 1
    const scaleToken = scale.toFixed(3)
    if (container.style.getPropertyValue('--vp-control-scale') !== scaleToken) {
      container.style.setProperty('--vp-control-scale', scaleToken)
      const scaledSizes = {
        '--vp-tooltip-min-width': 84,
        '--vp-tooltip-height': 36,
        '--vp-tooltip-padding-x': 12,
        '--vp-tooltip-font-size': 14,
        '--vp-tooltip-line-height': 34,
        '--vp-thumbnail-time-font-size': 12,
        '--vp-thumbnail-time-line-height': 20,
        '--vp-thumbnail-time-padding-x': 5,
        '--vp-volume-panel-width': 32,
        '--vp-volume-panel-height': 130,
        '--vp-volume-range-width': 4,
        '--vp-volume-range-height': 100,
        '--vp-volume-cursor-size': 15
      }
      Object.keys(scaledSizes).forEach(property => {
        container.style.setProperty(property, `${(scaledSizes[property] * scale).toFixed(2)}px`)
      })
    }
    container.classList.toggle('vp-controlbar-compact', compact)
    container.classList.toggle('vp-controlbar-mini', mini)
    container.classList.toggle('vp-controlbar-nano', nano)
    if (volumePopup && volumePopup.style.display !== 'none') {
      window.requestAnimationFrame(positionVolumePopup)
    }
  }

  function positionVolumePopup() {
    if (!volumeIcon || !volumePopup || volumePopup.style.display === 'none') return
    const root = playerRoot || container
    const playerRect = root.getBoundingClientRect()
    const iconRect = volumeIcon.getBoundingClientRect()
    const popupRect = volumePopup.getBoundingClientRect()
    const popupWidth = popupRect.width || 32
    const popupHeight = popupRect.height || 130
    const scale = Number(container.style.getPropertyValue('--vp-control-scale')) || 1
    const popupGap = 24 * scale
    const left = Math.max(8, Math.min(
      iconRect.left - playerRect.left + (iconRect.width - popupWidth) / 2,
      playerRect.width - popupWidth - 8
    ))
    const top = Math.max(8, iconRect.top - playerRect.top - popupHeight - popupGap)
    volumePopup.style.left = `${left}px`
    volumePopup.style.top = `${top}px`
    volumePopup.style.bottom = 'auto'
  }

  function clampProgressTooltip() {
    const tooltip = container.querySelector('.prism-tooltip')
    if (!tooltip || tooltip.style.display === 'none') return
    const playerWidth = (playerRoot || container).getBoundingClientRect().width
    const tooltipWidth = tooltip.getBoundingClientRect().width
    const currentLeft = parseFloat(tooltip.style.left) || 0
    const maxLeft = Math.max(8, playerWidth - tooltipWidth - 8)
    tooltip.style.left = `${Math.max(8, Math.min(currentLeft, maxLeft))}px`
  }

  function inject() {
    if (destroyed) return
    controlBar = container.querySelector('.prism-controlbar')
    playerRoot = container.querySelector('.prism-player') || container
    progress = controlBar && controlBar.querySelector('.prism-progress')
    const playButton = controlBar && controlBar.querySelector('.prism-play-btn')
    const timeDisplay = controlBar && controlBar.querySelector('.prism-time-display')
    const seekControls = controlBar && controlBar.querySelector('.hrp-seek-controls')
    const volumeControl = controlBar && controlBar.querySelector('.prism-volume')
    const fullscreenButton = controlBar && controlBar.querySelector('.prism-fullscreen-btn')

    if (!controlBar || !progress || !playButton || !timeDisplay || !seekControls || !volumeControl || !fullscreenButton) {
      if (retries++ < INJECT_RETRY_LIMIT) retryTimer = setTimeout(inject, INJECT_RETRY_DELAY)
      return
    }

    row = document.createElement('div')
    row.className = 'vp-controlbar-row'
    row.setAttribute('role', 'group')
    row.setAttribute('aria-label', '视频播放控制')
    const left = document.createElement('div')
    left.className = 'vp-controlbar-left'
    const right = document.createElement('div')
    right.className = 'vp-controlbar-right'
    row.append(left, right)

    const speedControl = createSpeedControl(player, container)

    danmuControl = createToggle('弹幕', true, enabled => {
      dispatchDanmuState(enabled)
      onDanmuChange(enabled)
    })
    danmuControl.element.classList.add('vp-control-toggle--danmu')
    if (showSubtitleControl) {
      subtitleControl = createToggle('字幕', currentSubtitleState, enabled => {
        currentSubtitleState = enabled
        if (useNativeSubtitles) setSubtitleTracks(enabled)
        onSubtitleChange(enabled)
      })
    }
    if (useNativeSubtitles) setSubtitleTracks(currentSubtitleState)
    left.append(playButton, timeDisplay, seekControls)
    right.append(danmuControl.element)
    right.appendChild(speedControl.element)
    if (subtitleControl) right.appendChild(subtitleControl.element)
    right.append(volumeControl, fullscreenButton)
    controlBar.appendChild(row)
    container.classList.add('vp-controlbar-skin')
    volumeIcon = volumeControl.querySelector('.volume-icon')
    volumePopup = playerRoot.querySelector('.prism-volume-control')
    thumbnailPopup = playerRoot.querySelector('.prism-thumbnail')
    progressTime = progress.querySelector('.prism-progress-time')
    if (volumePopup) volumePopup.classList.add('vp-volume-popup')
    if (thumbnailPopup) thumbnailPopup.classList.add('vp-thumbnail-preview')
    if (progressTime) {
      progressTime.classList.add('vp-progress-time')
      if (!progressTime.textContent.trim()) progressTime.style.display = 'none'
    }
    onVolumeIconClick = () => window.requestAnimationFrame(positionVolumePopup)
    onProgressMouseMove = () => window.requestAnimationFrame(clampProgressTooltip)
    if (volumeIcon) volumeIcon.addEventListener('click', onVolumeIconClick)
    if (progress) progress.addEventListener('mousemove', onProgressMouseMove)
    updateResponsiveMode()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateResponsiveMode)
      resizeObserver.observe(container)
      if (playerRoot !== container) resizeObserver.observe(playerRoot)
    } else {
      usesWindowResize = true
      window.addEventListener('resize', updateResponsiveMode)
    }

    const seekButtons = seekControls.querySelectorAll('.hrp-seek-btn__icon')
    if (seekButtons[0]) seekButtons[0].src = seekBackwardIcon
    if (seekButtons[1]) seekButtons[1].src = seekForwardIcon
    container.querySelectorAll('[title]').forEach(element => element.removeAttribute('title'))

    updatePlayIcon(playButton)
    updateVolumeIcon(volumeControl)
    updateFullscreenIcon(fullscreenButton)
    observer = new MutationObserver(records => {
      records.forEach(({ target }) => {
        if (target.nodeType === 1 && target.hasAttribute('title')) target.removeAttribute('title')
      })
      updatePlayIcon(playButton)
      updateVolumeIcon(volumeControl)
      updateFullscreenIcon(fullscreenButton)
      updateResponsiveMode()
    })
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['title'] })
    observer.observe(playButton, { attributes: true, attributeFilter: ['class'] })
    observer.observe(fullscreenButton, { attributes: true, attributeFilter: ['class'] })
    if (volumeIcon) observer.observe(volumeIcon, { attributes: true, attributeFilter: ['class'] })
    listen('volumechange', () => updateVolumeIcon(volumeControl))
    listen('volumnchanged', () => updateVolumeIcon(volumeControl))
  }

  inject()

  return {
    setSubtitleEnabled(enabled) {
      currentSubtitleState = !!enabled
      if (subtitleControl) subtitleControl.setValue(currentSubtitleState)
      if (useNativeSubtitles) setSubtitleTracks(currentSubtitleState)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      clearTimeout(retryTimer)
      if (observer) observer.disconnect()
      if (resizeObserver) resizeObserver.disconnect()
      if (usesWindowResize) window.removeEventListener('resize', updateResponsiveMode)
      if (volumeIcon && onVolumeIconClick) volumeIcon.removeEventListener('click', onVolumeIconClick)
      if (progress && onProgressMouseMove) progress.removeEventListener('mousemove', onProgressMouseMove)
      speedControl.destroy()
      events.forEach(([event, handler]) => {
        if (player.off) player.off(event, handler)
      })
      if (row) row.remove()
      container.classList.remove('vp-controlbar-compact', 'vp-controlbar-mini', 'vp-controlbar-nano')
      container.classList.remove('vp-controlbar-skin')
      ;[
        '--vp-control-scale',
        '--vp-tooltip-min-width', '--vp-tooltip-height', '--vp-tooltip-padding-x',
        '--vp-tooltip-font-size', '--vp-tooltip-line-height',
        '--vp-thumbnail-time-font-size', '--vp-thumbnail-time-line-height', '--vp-thumbnail-time-padding-x',
        '--vp-volume-panel-width', '--vp-volume-panel-height',
        '--vp-volume-range-width', '--vp-volume-range-height', '--vp-volume-cursor-size'
      ].forEach(property => container.style.removeProperty(property))
      danmuControl = null
      subtitleControl = null
      volumeIcon = null
      volumePopup = null
      thumbnailPopup = null
      progressTime = null
      progress = null
      onVolumeIconClick = null
      onProgressMouseMove = null
      playerRoot = null
    }
  }
}
