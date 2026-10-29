import { getHistoryList } from '@/api/modules/teacher'

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

export function getAIListeningRoute(item) {
  const replay = getReplayInfo(item)
  // 转写使用 taskUuid，AI 纪要使用直播课时 ID 和授课老师 ID。
  if (!replay.taskUuid || !replay.liveLessonId || !replay.teacherId) return null

  const mainFile = replay.fileList.find(file => file.videoType == '1')
  const teacherFile = replay.fileList.find(file => file.videoType == '2')
  return {
    name: 'AIListening',
    query: {
      videoUrl: mainFile ? mainFile.filePath || '' : (!replay.fileList.length ? replay.filePath || '' : ''),
      teacherVideoUrl: teacherFile ? teacherFile.filePath || '' : '',
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

  // 最近观看和课表的返回字段少于历史课堂列表，只在点击且参数不全时补齐。
  const pageSize = 50
  const seenPages = new Set()
  try {
    for (let pageNum = 1; ; pageNum++) {
      const response = await getHistoryList({ keyword: replay.name, pageNum, pageSize })
      const data = response.data || response || {}
      const records = data.records || data.list || (Array.isArray(data) ? data : [])
      if (!records.length) break

      const record = records.find(history => {
        if (replay.historyLessonId) {
          return String(history.historyLessonId || history.id || '') === String(replay.historyLessonId)
        }
        if (replay.liveLessonId) {
          return String(history.liveLessonId || '') === String(replay.liveLessonId)
        }
        return String(history.liveId || '') === String(replay.liveId)
      })
      if (record) {
        return {
          ...replay,
          taskUuid: record.taskUuid || replay.taskUuid,
          liveLessonId: record.liveLessonId || replay.liveLessonId,
          historyLessonId: record.historyLessonId || record.id || replay.historyLessonId,
          liveId: record.liveId || replay.liveId,
          teacherId: record.teacherId || replay.teacherId,
          fileList: Array.isArray(record.fileList) && record.fileList.length ? record.fileList : replay.fileList
        }
      }

      const pageKey = records.map(history => history.historyLessonId || history.id || '').join(',')
      if (seenPages.has(pageKey)) break
      seenPages.add(pageKey)
      const total = Number(data.total)
      if (records.length < pageSize || (Number.isFinite(total) && pageNum * pageSize >= total)) break
    }
  } catch (error) {
    console.warn('[Replay Info Error]', error)
  }
  return replay
}
