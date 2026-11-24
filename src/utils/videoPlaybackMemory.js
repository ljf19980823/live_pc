import { getUserInfo } from '@/utils/auth'

const STORAGE_PREFIX = 'lisheng_video_progress_v1:'
const SAVE_INTERVAL = 5000
const AUTH_PARAMS = /^(auth_key|token|access_token|sign|signature|expires|expiration|security-token|ossaccesskeyid|x-oss-.*|x-amz-.*)$/i
const SIGNED_URL_IN_KEY = /(?:[?&]|%3[fF]|%26)(?:auth_key|token|access_token|sign|signature|expires|expiration|security-token|ossaccesskeyid|x-oss-[^=&]*|x-amz-[^=&]*)(?:=|%3[dD])/i
let signedUrlProgressKeysPurged = false

function getUserKey() {
  let user = {}
  try { user = getUserInfo() || {} } catch (e) {}
  return [
    String(user.institutionId || ''),
    String(user.userId ?? user.id ?? 'anonymous')
  ]
}

function removeAuthParams(url) {
  Array.from(url.searchParams.keys()).forEach(key => {
    if (AUTH_PARAMS.test(key)) url.searchParams.delete(key)
  })
  url.searchParams.sort()
  url.hash = ''
  return url.href
}

function hashResourceIdentity(value) {
  let first = 2166136261
  let second = 5381
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    first = Math.imul(first ^ code, 16777619)
    second = Math.imul(second, 33) ^ code
  }
  return `${(first >>> 0).toString(36)}${(second >>> 0).toString(36)}`
}

function getSourceIdentity(source) {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'https://localhost/'
    return removeAuthParams(new URL(source, baseUrl))
  } catch (e) {
    return String(source || '')
      .replace(/([?&])(?:auth_key|token|access_token|sign|signature|expires|expiration|security-token|ossaccesskeyid|x-oss-[^=&]*|x-amz-[^=&]*)=[^&#]*/ig, '$1')
      .replace(/[?&]$/, '')
      .split('#')[0]
  }
}

function getStorageKey(source, resourceId) {
  const videoKey = resourceId !== undefined && resourceId !== null && resourceId !== ''
    ? `resource:${String(resourceId)}`
    : `source:${hashResourceIdentity(getSourceIdentity(source))}`
  return STORAGE_PREFIX + JSON.stringify([...getUserKey(), videoKey])
}

// Previous versions used the unsigned URL as a storage key. Use it only to
// migrate existing progress; new records always use an opaque resource key.
function getLegacyStorageKey(source) {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'https://localhost/'
    const legacyIdentity = removeAuthParams(new URL(source, baseUrl))
    return STORAGE_PREFIX + JSON.stringify([...getUserKey(), legacyIdentity])
  } catch (e) {
    return ''
  }
}

function purgeSignedUrlProgressKeys() {
  if (signedUrlProgressKeysPurged) return
  signedUrlProgressKeysPurged = true
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index)
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue
      const value = localStorage.getItem(key) || ''
      if (SIGNED_URL_IN_KEY.test(key) || SIGNED_URL_IN_KEY.test(value)) localStorage.removeItem(key)
    }
  } catch (e) {}
}

purgeSignedUrlProgressKeys()

/** 点播播放器共用的本机续播记录；绑定时固定账号和视频，避免切换时串写进度。 */
export function rememberVideoPlayback(player, source, resourceId) {
  if (!player || !source) return { save() {}, destroy() {} }

  purgeSignedUrlProgressKeys()
  const key = getStorageKey(source, resourceId)
  let restoreTime = 0
  try {
    let rawRecord = localStorage.getItem(key)
    const legacyKey = getLegacyStorageKey(source)
    if (!rawRecord && legacyKey && legacyKey !== key) {
      rawRecord = localStorage.getItem(legacyKey)
      if (rawRecord) {
        localStorage.setItem(key, rawRecord)
        localStorage.removeItem(legacyKey)
      }
    }
    const record = JSON.parse(rawRecord)
    const time = Number(record && record.time)
    if (Number.isFinite(time) && time > 0) restoreTime = time
  } catch (e) {}

  let seekRequested = false
  let completed = false
  let destroyed = false
  let lastSavedAt = 0
  const listeners = []

  function readPosition() {
    try {
      return { time: Number(player.getCurrentTime()), duration: Number(player.getDuration()) }
    } catch (e) {
      return { time: NaN, duration: NaN }
    }
  }

  function clear() {
    try { localStorage.removeItem(key) } catch (e) {}
  }

  function restore() {
    if (destroyed || restoreTime <= 0) return
    const { duration } = readPosition()
    if (!Number.isFinite(duration) || duration <= 0) return
    // 视频已播完或资源时长发生变化时，从头播放。
    if (restoreTime >= duration) {
      restoreTime = 0
      clear()
      return
    }
    if (!seekRequested) {
      seekRequested = true
      try {
        player.seek(restoreTime)
      } catch (e) {
        seekRequested = false
        return
      }
    }
    if (Math.abs(readPosition().time - restoreTime) < 1) restoreTime = 0
  }

  function save(force = true) {
    // 加载和恢复完成之前，不用播放器的初始 0 秒覆盖已有记录。
    if (destroyed || restoreTime > 0 || completed) return
    const { time, duration } = readPosition()
    if (!Number.isFinite(time) || time < 0 || !Number.isFinite(duration) || duration <= 0) return
    if (time === 0 || time >= duration) {
      clear()
      return
    }
    const now = Date.now()
    if (!force && now - lastSavedAt < SAVE_INTERVAL) return
    try {
      localStorage.setItem(key, JSON.stringify({ time, duration }))
      lastSavedAt = now
    } catch (e) {
      // 存储被禁用或空间不足时，继续正常播放。
    }
  }

  function onTimeUpdate() {
    restore()
    save(false)
  }

  function onReady() {
    // 部分流在 loadedmetadata 后仍不能 seek，canplay 到达时允许重试。
    seekRequested = false
    restore()
  }

  function onSeeked() {
    const { time, duration } = readPosition()
    if (seekRequested && time > 0) restoreTime = 0
    if (time < duration) completed = false
    save()
  }

  function onEnded() {
    completed = true
    restoreTime = 0
    clear()
  }

  function onPlay() {
    completed = false
    restore()
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') save()
  }

  function listen(event, handler) {
    player.on(event, handler)
    listeners.push([event, handler])
  }

  listen('loadedmetadata', onReady)
  listen('durationchange', onReady)
  listen('canplay', onReady)
  listen('play', onPlay)
  listen('timeupdate', onTimeUpdate)
  listen('completeSeek', onSeeked)
  listen('seeked', onSeeked)
  // SDK 事件会携带事件对象，不能直接把 save 的 force 参数作为监听器。
  listen('pause', () => save())
  listen('error', () => save())
  listen('ended', onEnded)
  const onPageLeave = () => save()
  window.addEventListener('beforeunload', onPageLeave)
  window.addEventListener('pagehide', onPageLeave)
  document.addEventListener('visibilitychange', onVisibilityChange)
  restore()

  return {
    save,
    destroy() {
      if (destroyed) return
      save()
      destroyed = true
      listeners.forEach(([event, handler]) => player.off(event, handler))
      window.removeEventListener('beforeunload', onPageLeave)
      window.removeEventListener('pagehide', onPageLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
