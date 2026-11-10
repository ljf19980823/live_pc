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
    const { width, height } = container.getBoundingClientRect()
    const compact = width <= 760 && height <= 430
    const mini = width <= 580 && height <= 326
    const nano = width <= 380 && height <= 215
    container.classList.toggle('vp-controlbar-compact', compact)
    container.classList.toggle('vp-controlbar-mini', mini)
    container.classList.toggle('vp-controlbar-nano', nano)
  }

  function inject() {
    if (destroyed) return
    controlBar = container.querySelector('.prism-controlbar')
    const progress = controlBar && controlBar.querySelector('.prism-progress')
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
    subtitleControl = createToggle('字幕', currentSubtitleState, enabled => {
      currentSubtitleState = enabled
      if (useNativeSubtitles) setSubtitleTracks(enabled)
      onSubtitleChange(enabled)
    })
    if (useNativeSubtitles) setSubtitleTracks(currentSubtitleState)
    left.append(playButton, timeDisplay, seekControls)
    right.append(danmuControl.element)
    right.appendChild(speedControl.element)
    right.append(subtitleControl.element, volumeControl, fullscreenButton)
    controlBar.appendChild(row)
    container.classList.add('vp-controlbar-skin')
    updateResponsiveMode()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateResponsiveMode)
      resizeObserver.observe(container)
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
    })
    observer.observe(container, { subtree: true, attributes: true, attributeFilter: ['title'] })
    observer.observe(playButton, { attributes: true, attributeFilter: ['class'] })
    observer.observe(fullscreenButton, { attributes: true, attributeFilter: ['class'] })
    const volumeIcon = volumeControl.querySelector('.volume-icon')
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
      speedControl.destroy()
      events.forEach(([event, handler]) => {
        if (player.off) player.off(event, handler)
      })
      if (row) row.remove()
      container.classList.remove('vp-controlbar-compact', 'vp-controlbar-mini', 'vp-controlbar-nano')
      container.classList.remove('vp-controlbar-skin')
      danmuControl = null
      subtitleControl = null
    }
  }
}
