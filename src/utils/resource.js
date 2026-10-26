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
