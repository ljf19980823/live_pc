import { getCourseDetail } from '@/api/modules/teacher'
import { getRecentViewList } from '@/api/modules/student'

const resourceIcons = {
  doc: require('@/assets/images/icon/Doc.png'),
  docx: require('@/assets/images/icon/Doc.png'),
  xls: require('@/assets/images/icon/Excel.png'),
  xlsx: require('@/assets/images/icon/Excel.png'),
  csv: require('@/assets/images/icon/Excel.png'),
  ppt: require('@/assets/images/icon/PPT.png'),
  pptx: require('@/assets/images/icon/PPT.png'),
  pdf: require('@/assets/images/icon/PDF.png'),
  mp4: require('@/assets/images/icon/Mp4.png'),
  mov: require('@/assets/images/icon/Mov.png'),
  mp3: require('@/assets/images/icon/Mp3.png'),
  wav: require('@/assets/images/icon/Wav.png'),
  zip: require('@/assets/images/icon/Zip.png'),
  rar: require('@/assets/images/icon/Zip.png'),
  '7z': require('@/assets/images/icon/Zip.png'),
  jpg: require('@/assets/images/icon/img.png'),
  jpeg: require('@/assets/images/icon/img.png'),
  png: require('@/assets/images/icon/img.png'),
  gif: require('@/assets/images/icon/img.png'),
  webp: require('@/assets/images/icon/img.png'),
  bmp: require('@/assets/images/icon/img.png')
}
const otherIcon = require('@/assets/images/icon/other.png')

export function isResourceUrlExpiring(urlExpireAt, thresholdMs = 30000, now = Date.now()) {
  if (urlExpireAt === undefined || urlExpireAt === null || urlExpireAt === '') return false
  const expiresAt = Number(urlExpireAt)
  return Number.isFinite(expiresAt) && expiresAt - now < thresholdMs
}

function responseData(response) {
  if (!response || typeof response !== 'object') return response
  return response.data !== undefined ? response.data : response
}

function findCourseResource(nodes, itemId) {
  if (!Array.isArray(nodes)) return null
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const nodeId = node.id || node.lessonId
    if (String(nodeId || '') === String(itemId || '') && (node.resource || node.historyLesson)) return node.resource || node.historyLesson
    const child = findCourseResource(node.children, itemId)
    if (child) return child
  }
  return null
}

function pickResourceFile(files, item) {
  if (!Array.isArray(files) || !files.length) return null
  const currentFile = Array.isArray(item && item.fileList) ? item.fileList[0] : null
  const name = currentFile && (currentFile.fileName || currentFile.name)
  return (name && files.find(file => file && (file.fileName || file.name) === name)) || files[0]
}

function mergeResourceUrl(item, resource) {
  const files = Array.isArray(resource && resource.fileList) ? resource.fileList : []
  const file = pickResourceFile(files, item)
  const filePath = (file && file.filePath) || (resource && (resource.filePath || resource.fileUrl)) || ''
  if (!filePath) throw new Error('资料地址刷新失败，请重新进入页面')
  return {
    ...item,
    filePath,
    urlExpireAt: file && file.urlExpireAt != null ? file.urlExpireAt : (resource && resource.urlExpireAt),
    fileList: files.length ? files : (item.fileList || [])
  }
}

/** Refresh a course resource from the same course detail endpoint that supplied it. */
export async function refreshCourseResource(item, params) {
  if (!item || !isResourceUrlExpiring(item.urlExpireAt)) return item
  const response = await getCourseDetail(params || {})
  const data = responseData(response) || {}
  const resource = findCourseResource(data.detailTree, item.resourceNodeId || item.id)
  if (!resource) throw new Error('资料已不在当前课程中，请重新进入页面')
  return mergeResourceUrl(item, resource)
}

/** Refresh a recent-view resource through the existing recent-view query. */
export async function refreshRecentResource(item, params = {}) {
  if (!item || !isResourceUrlExpiring(item.urlExpireAt)) return item
  const response = await getRecentViewList({ pageNum: 1, pageSize: 10, ...params })
  const data = responseData(response)
  const rows = Array.isArray(data) ? data : data && data.list
  const row = (Array.isArray(rows) ? rows : []).find(current =>
    String(current && (current.lessonId || current.id) || '') === String(item.id || '') &&
    (item.nodeType == null || String(current && current.type || '') === String(item.nodeType)) &&
    (!item.courseId || !current.courseId || String(current.courseId) === String(item.courseId))
  )
  if (!row) throw new Error('资料已不在最近观看中，请刷新页面后重试')
  return mergeResourceUrl(item, row)
}

export function getFileExtension(source) {
  const clean = String(source || '').split(/[?#]/)[0]
  let filename = clean.split('/').pop()
  try { filename = decodeURIComponent(filename) } catch (_) {}
  const index = filename.lastIndexOf('.')
  return index > 0 ? filename.slice(index + 1).toLowerCase() : ''
}

function resourceSources(item) {
  if (!item) return []
  const firstFile = item.fileList && item.fileList[0]
  const fromList = firstFile ? firstFile.fileName || firstFile.name || firstFile.filePath : ''
  // Preserve the existing course-node precedence before considering shared-resource fields.
  return [item.title, item.filePath, item.resourceUrl, fromList, item.name, item.fileUrl].filter(Boolean)
}

export function getResourceExtension(item) {
  for (const source of resourceSources(item)) {
    const extension = getFileExtension(source)
    if (extension) return extension
  }
  return ''
}

export function getResourceTypeIcon(item) {
  for (const source of resourceSources(item)) {
    const icon = resourceIcons[getFileExtension(source)]
    if (icon) return icon
  }
  return otherIcon
}

// liveLessonId identifies a lesson, not the livebroadcast business record.
export function getResourceAssociation({ historyLessonId, liveId } = {}) {
  const normalize = value => ['string', 'number'].includes(typeof value) ? String(value).trim() : ''
  const history = normalize(historyLessonId)
  const live = normalize(liveId)
  if (history) return { historyLessonId: history }
  return live ? { liveId: live } : null
}

export function normalizeResourceProgress(value) {
  const progress = Number(value)
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : 0
}
