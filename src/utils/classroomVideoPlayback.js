import {
  getHistoryList,
  getNoteList,
  getCourseDetail,
  getScheduleList,
  getScheduleListByRange,
  getAfterQuizList,
  getAfterQuizTeacherList,
  getLiveList
} from '@/api/modules/teacher'
import { getRecentViewList } from '@/api/modules/student'
import { getLatestLive } from '@/api/modules/live'

const SUCCESS_CODES = [200, 0, '200', '0', 'success']

function responseData(response) {
  if (!response || typeof response !== 'object') return response
  if (response.code !== undefined && !SUCCESS_CODES.includes(response.code)) {
    throw new Error(response.message || response.msg || '重新获取视频地址失败')
  }
  return response.data !== undefined ? response.data : response
}

function filesFromItems(items) {
  if (!Array.isArray(items)) return []
  return items.flatMap(item => Array.isArray(item && item.fileList) ? item.fileList : [])
}

function courseClassroomFiles(detailTree) {
  const files = []
  const visit = nodes => {
    if (!Array.isArray(nodes)) return
    nodes.forEach(node => {
      if (!node || typeof node !== 'object') return
      const type = String(node.type || '')
      if (type === '2' && Array.isArray(node.liveInfo && node.liveInfo.fileList)) {
        files.push(...node.liveInfo.fileList)
      } else if (type === '3' && Array.isArray(node.historyLesson && node.historyLesson.fileList)) {
        files.push(...node.historyLesson.fileList)
      }
      visit(node.children)
    })
  }
  visit(detailTree)
  return files
}

function extractClassroomFiles(context, payload) {
  switch (context.type) {
    case 'historyList': {
      const items = Array.isArray(payload) ? payload : payload && (payload.records || payload.list)
      return filesFromItems(items)
    }
    case 'noteList':
      return filesFromItems(payload && (payload.list || payload.records))
    case 'courseDetail':
      return courseClassroomFiles(payload && payload.detailTree)
    case 'recentView':
      return filesFromItems(Array.isArray(payload) ? payload.filter(item => String(item && item.type) === '3') : [])
    case 'scheduleMonth':
    case 'scheduleRange': {
      const groups = Array.isArray(payload) ? payload : []
      return groups.flatMap(group => filesFromItems(group && group.lives))
    }
    case 'studentQuiz':
    case 'teacherQuiz':
    case 'liveList':
      return filesFromItems(payload)
    case 'liveLatest':
      return Array.isArray(payload && payload.fileList) ? payload.fileList : []
    default:
      throw new Error('当前页面暂不支持自动刷新视频地址')
  }
}

async function requestPlaybackContext(context) {
  if (!context || typeof context !== 'object') throw new Error('缺少视频刷新上下文')
  const params = context.params || {}
  switch (context.type) {
    case 'historyList': return getHistoryList(params)
    case 'noteList': return getNoteList(params)
    case 'courseDetail': return getCourseDetail(params)
    case 'recentView': return getRecentViewList(params)
    case 'scheduleMonth': return getScheduleList(params)
    case 'scheduleRange': return getScheduleListByRange(params)
    case 'studentQuiz': return getAfterQuizList(params)
    case 'teacherQuiz': return getAfterQuizTeacherList(params)
    case 'liveList': return getLiveList(params)
    case 'liveLatest': return getLatestLive()
    default: throw new Error('当前页面暂不支持自动刷新视频地址')
  }
}

/**
 * Re-fetch a classroom video through the same business endpoint and query scope.
 * Only classroom fileList locations are inspected; courseware resources are excluded.
 */
export async function refreshClassroomVideos(context, videoIds) {
  const ids = Array.from(new Set((Array.isArray(videoIds) ? videoIds : [])
    .filter(videoId => videoId !== undefined && videoId !== null && videoId !== '')
    .map(String)))
  if (!ids.length) return []

  const response = await requestPlaybackContext(context)
  const payload = responseData(response)
  const requestedIds = new Set(ids)
  const matches = new Map()
  extractClassroomFiles(context, payload).forEach(file => {
    if (!file || !file.filePath) return
    const id = String(file.videoId)
    if (requestedIds.has(id) && !matches.has(id)) matches.set(id, file)
  })
  return ids.map(id => matches.get(id)).filter(Boolean)
}

export async function refreshClassroomVideo(context, videoId) {
  if (videoId === undefined || videoId === null || videoId === '') {
    throw new Error('视频缺少稳定 ID，无法刷新播放地址')
  }
  const [match] = await refreshClassroomVideos(context, [videoId])
  if (!match || !match.filePath) throw new Error('视频已不在当前结果中，请重新进入页面')
  return match
}

export function getPlaybackFile(fileList, videoType) {
  if (!Array.isArray(fileList)) return null
  return fileList.find(file => String(file && file.videoType) === String(videoType)) || null
}

export function fileIsExpiring(file, thresholdMs = 60000, now = Date.now()) {
  if (!file || file.urlExpireAt === undefined || file.urlExpireAt === null || file.urlExpireAt === '') return false
  const expiresAt = Number(file.urlExpireAt)
  return Number.isFinite(expiresAt) && expiresAt - now < thresholdMs
}

export function isNotFoundMediaError(error) {
  const visited = new Set()
  const findStatus = value => {
    if (!value || typeof value !== 'object' || visited.has(value)) return null
    visited.add(value)
    for (const key of ['status', 'statusCode', 'httpStatus', 'code']) {
      const number = Number(value[key])
      if (number === 404) return 404
    }
    for (const key of ['response', 'data', 'paramData', 'error', 'payload']) {
      const result = findStatus(value[key])
      if (result) return result
    }
    return null
  }
  return findStatus(error) === 404
}

export function getMediaRequestId(error) {
  const visited = new Set()
  const findId = value => {
    if (!value || typeof value !== 'object' || visited.has(value)) return ''
    visited.add(value)
    const headers = value.headers || {}
    const direct = value.requestId || value.requestID || value['x-oss-request-id'] || headers['x-oss-request-id'] || headers['X-Oss-Request-Id']
    if (direct) return String(direct)
    for (const key of ['response', 'data', 'paramData', 'error', 'payload']) {
      const result = findId(value[key])
      if (result) return result
    }
    return ''
  }
  return findId(error)
}

export function readPlaybackState(player, videoElement) {
  let currentTime = 0
  try { currentTime = Number(videoElement ? videoElement.currentTime : player && player.getCurrentTime()) || 0 } catch (e) {}
  let speed = 1
  try { speed = Number(videoElement && videoElement.playbackRate) || 1 } catch (e) {}
  let paused = true
  try {
    paused = videoElement ? videoElement.paused : !player || player.getStatus() !== 'playing'
  } catch (e) {}
  return { currentTime, speed, paused }
}

export function restorePlaybackState(player, videoElement, state) {
  if (!player || !state) return
  let duration = 0
  try { duration = Number(videoElement ? videoElement.duration : player.getDuration()) || 0 } catch (e) {}
  const target = duration > 0 ? Math.min(state.currentTime, Math.max(0, duration - 0.25)) : state.currentTime
  try { if (target > 0) player.seek(target) } catch (e) {}
  try { player.setSpeed(state.speed || 1) } catch (e) {}
  if (!state.paused) {
    try { player.play() } catch (e) {}
  } else {
    try { player.pause() } catch (e) {}
  }
}
