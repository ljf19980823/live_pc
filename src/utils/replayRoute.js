import { getHistoryList } from '@/api/modules/teacher'
import { getUserInfo } from '@/utils/auth'

const REPLAY_LOOKUP_MAX_PAGES = 3
const REPLAY_LOOKUP_CACHE_TTL = 5 * 60 * 1000
const REPLAY_LOOKUP_MISS_TTL = 30 * 1000
const REPLAY_LOOKUP_CACHE_LIMIT = 200
const replayLookupCache = new Map()

function getReplayLookupKey(replay) {
  const user = getUserInfo() || {}
  return JSON.stringify([
    String(user.institutionId || ''),
    String(user.userId || user.id || ''),
    String(replay.name || ''),
    String(replay.historyLessonId || ''),
    String(replay.liveLessonId || ''),
    String(replay.liveId || '')
  ])
}

function getReplayMetadata(record) {
  return {
    taskUuid: record.taskUuid || '',
    liveLessonId: record.liveLessonId || '',
    historyLessonId: record.historyLessonId || record.id || '',
    liveId: record.liveId || '',
    teacherId: record.teacherId || '',
    // Keep only business identity in the short-lived cache; signed URLs are always re-fetched.
    fileList: Array.isArray(record.fileList)
      ? record.fileList
        .filter(file => file && file.videoId)
        .map(file => ({ videoId: file.videoId, videoType: file.videoType }))
      : []
  }
}

async function findReplayMetadata(replay) {
  const pageSize = 50
  const seenPages = new Set()
  for (let pageNum = 1; pageNum <= REPLAY_LOOKUP_MAX_PAGES; pageNum++) {
    const response = await getHistoryList({ keyword: replay.name, pageNum, pageSize })
    const data = response.data || response || {}
    const records = data.records || data.list || (Array.isArray(data) ? data : [])
    if (!records.length) return null

    const record = records.find(history => {
      if (replay.historyLessonId) {
        return String(history.historyLessonId || history.id || '') === String(replay.historyLessonId)
      }
      if (replay.liveLessonId) {
        return String(history.liveLessonId || '') === String(replay.liveLessonId)
      }
      return String(history.liveId || '') === String(replay.liveId)
    })
    if (record) return getReplayMetadata(record)

    const pageKey = records.map(history => history.historyLessonId || history.id || '').join(',')
    if (seenPages.has(pageKey)) return null
    seenPages.add(pageKey)
    const total = Number(data.total)
    if (records.length < pageSize || (Number.isFinite(total) && pageNum * pageSize >= total)) return null
  }
  return null
}

function mergeReplayMetadata(replay, metadata) {
  return {
    ...replay,
    ...metadata,
    taskUuid: metadata.taskUuid || replay.taskUuid,
    liveLessonId: metadata.liveLessonId || replay.liveLessonId,
    historyLessonId: metadata.historyLessonId || replay.historyLessonId,
    liveId: metadata.liveId || replay.liveId,
    teacherId: metadata.teacherId || replay.teacherId,
    fileList: replay.fileList.length ? replay.fileList : metadata.fileList
  }
}

// 学习任务的回放信息可能放在 historyLesson 中；各入口统一提取听记参数。
export function getReplayInfo(item = {}) {
  const history = item.historyLesson || {}
  return {
    ...history,
    ...item,
    name: item.name || item.title || history.name || '',
    fileList: Array.isArray(item.fileList) && item.fileList.length
      ? item.fileList
      : (Array.isArray(history.fileList) ? history.fileList : []),
    taskUuid: item.taskUuid || history.taskUuid || '',
    liveLessonId: item.liveLessonId || history.liveLessonId || '',
    historyLessonId: item.historyLessonId || history.historyLessonId || history.id || '',
    liveId: item.liveId || history.liveId || '',
    teacherId: item.teacherId || history.teacherId || ''
  }
}

export function getAIListeningRoute(item, playbackContext = null) {
  const replay = getReplayInfo(item)
  // 转写使用 taskUuid，AI 纪要使用直播课时 ID 和授课老师 ID。
  if (!replay.taskUuid || !replay.liveLessonId || !replay.teacherId) return null

  const mainFile = replay.fileList.find(file => file.videoType == '1')
  const teacherFile = replay.fileList.find(file => file.videoType == '2')
  return {
    name: 'AIListening',
    query: {
      videoId: mainFile ? mainFile.videoId || '' : (!replay.fileList.length ? replay.videoId || '' : ''),
      teacherVideoId: teacherFile ? teacherFile.videoId || '' : '',
      playbackContext: playbackContext ? JSON.stringify(playbackContext) : '',
      meetingId: replay.taskUuid,
      meetingTitle: replay.name || '视频回放',
      scopeText: replay.taskUuid,
      liveLessonId: replay.liveLessonId,
      historyLessonId: replay.historyLessonId,
      liveId: replay.liveId,
      teacherId: replay.teacherId
    }
  }
}

export async function resolveReplayInfo(item) {
  const replay = getReplayInfo(item)
  if (getAIListeningRoute(replay)) return replay
  if (!replay.name || !(replay.historyLessonId || replay.liveLessonId || replay.liveId)) return replay

  // Recent-view and schedule rows can omit AI metadata. Bound and cache this fallback lookup.
  const key = getReplayLookupKey(replay)
  const cached = replayLookupCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    try {
      const metadata = await cached.promise
      return metadata ? mergeReplayMetadata(replay, metadata) : replay
    } catch (_) {
      return replay
    }
  }

  const lookup = { expiresAt: Date.now() + REPLAY_LOOKUP_CACHE_TTL, promise: null }
  lookup.promise = findReplayMetadata(replay)
  replayLookupCache.set(key, lookup)
  if (replayLookupCache.size > REPLAY_LOOKUP_CACHE_LIMIT) {
    replayLookupCache.delete(replayLookupCache.keys().next().value)
  }
  try {
    const metadata = await lookup.promise
    if (!metadata) lookup.expiresAt = Date.now() + REPLAY_LOOKUP_MISS_TTL
    return metadata ? mergeReplayMetadata(replay, metadata) : replay
  } catch (error) {
    if (replayLookupCache.get(key) === lookup) replayLookupCache.delete(key)
    console.warn('[Replay Info Error]', error)
    return replay
  }
}
