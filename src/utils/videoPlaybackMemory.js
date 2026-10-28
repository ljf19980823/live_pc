import { getUserInfo } from '@/utils/auth'

const STORAGE_PREFIX = 'lisheng_video_progress_v1:'
const SAVE_INTERVAL = 5000
// 保留决定视频身份的查询参数，只排除会随播放授权更新的签名参数。
const AUTH_PARAMS = /^(auth_key|token|access_token|sign|signature|expires|expiration|security-token|ossaccesskeyid|x-oss-.*|x-amz-.*)$/i

function getStorageKey(source) {
  let videoKey = source
  try {
    const url = new URL(source, window.location.href)
    Array.from(url.searchParams.keys()).forEach(key => {
      if (AUTH_PARAMS.test(key)) url.searchParams.delete(key)
    })
    url.searchParams.sort()
    url.hash = ''
    videoKey = url.href
  } catch (e) {}

  let user = {}
  try { user = getUserInfo() || {} } catch (e) {}
  return STORAGE_PREFIX + JSON.stringify([
    String(user.institutionId || ''),
    String(user.userId ?? user.id ?? 'anonymous'),
    videoKey
  ])
}

/** 点播播放器共用的本机续播记录；绑定时固定账号和视频，避免切换时串写进度。 */
export function rememberVideoPlayback(player, source) {
  if (!player || !source) return { save() {}, destroy() {} }

  const key = getStorageKey(source)
  let restoreTime = 0
  try {
    const record = JSON.parse(localStorage.getItem(key))
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
