import { reportCdnError } from '@/api/modules/cdn'
import { getAuthKeyExpireAt } from '@/utils/playbackUrlExpiry'

function normalizeKey(key) {
  return String(key || '').toLowerCase().replace(/[_-]/g, '')
}

function findDiagnosticValue(value, keys, visited = new Set()) {
  const wanted = new Set(keys.map(normalizeKey))
  const visit = current => {
    if (typeof current === 'string') {
      const text = current.trim()
      if (/^[\[{]/.test(text)) {
        try { return visit(JSON.parse(text)) } catch (e) {}
      }
      return undefined
    }
    if (!current || typeof current !== 'object' || visited.has(current)) return undefined
    visited.add(current)

    const directKeys = new Set([
      ...Object.keys(current),
      'status', 'statusCode', 'httpStatus', 'code', 'errorCode', 'errCode', 'errno',
      'message', 'msg', 'stage', 'requestId', 'requestID', 'eagleId', 'eagleid',
      'clientIp', 'dns', 'nodeIp', 'edgeIp', 'serverIp', 'remoteAddress'
    ])
    for (const key of directKeys) {
      if (!wanted.has(normalizeKey(key))) continue
      let result
      try { result = current[key] } catch (e) { continue }
      if (result !== undefined && result !== null && result !== '') return result
    }
    for (const nested of Object.values(current)) {
      const result = visit(nested)
      if (result !== undefined) return result
    }
    return undefined
  }
  return visit(value)
}

function normalizeTimestamp(value) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null
  return timestamp < 1000000000000 ? timestamp * 1000 : timestamp
}

function getFullObjectAddress(source) {
  if (!source) return ''
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'https://localhost/'
    return new URL(source, baseUrl).href
  } catch (e) {
    return String(source)
  }
}

function getSourceHost(source) {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : 'https://localhost/'
    return new URL(source, baseUrl).hostname
  } catch (e) {
    return ''
  }
}

function sanitizeMessage(message) {
  return String(message || '视频加载失败')
    .replace(/([?&](?:auth_key|token|access_token|signature|sign)=)[^&\s]*/ig, '$1[REDACTED]')
    .replace(/https?:\/\/[^\s"'<>]+/ig, url => {
      try {
        const parsed = new URL(url)
        return `${parsed.origin}${parsed.pathname}`
      } catch (e) {
        return '[REDACTED_URL]'
      }
    })
    .slice(0, 1000)
}

function getHttpStatus(error) {
  const visited = new Set()
  const statusKeys = new Set(['httpstatus', 'statuscode', 'status', 'httpcode', 'code'])
  const visit = value => {
    if (typeof value === 'string') {
      const text = value.trim()
      if (/^[\[{]/.test(text)) {
        try { return visit(JSON.parse(text)) } catch (e) {}
      }
      return null
    }
    if (!value || typeof value !== 'object' || visited.has(value)) return null
    visited.add(value)
    const keys = new Set([...Object.keys(value), 'httpStatus', 'statusCode', 'status', 'httpCode', 'code'])
    for (const key of keys) {
      if (!statusKeys.has(normalizeKey(key))) continue
      let status
      try { status = Number(value[key]) } catch (e) { continue }
      if (Number.isInteger(status) && status >= 100 && status < 600) return status
    }
    for (const nested of Object.values(value)) {
      const status = visit(nested)
      if (status !== null) return status
    }
    return null
  }
  return visit(error)
}

function getPlatform() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  return 'pc'
}

export function createPlayerUuid() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch (e) {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.random() * 16 | 0
    return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16)
  })
}

function buildPayload(options = {}) {
  const error = options.error
  const file = options.file || {}
  const source = options.source || file.filePath || ''
  const headers = findDiagnosticValue(error, ['headers']) || {}
  const requestId = findDiagnosticValue(error, ['requestId', 'requestID', 'x-oss-request-id']) ||
    findDiagnosticValue(headers, ['x-oss-request-id', 'requestId']) || ''
  const fileExpiry = normalizeTimestamp(file.urlExpireAt)
  const sourceExpiry = getAuthKeyExpireAt(source)
  const currentTime = Number(options.currentTimeSeconds)
  const code = findDiagnosticValue(error, ['errorCode', 'errCode', 'errno', 'code'])
  const mediaUrlHost = getSourceHost(source)
  const reportedHttpStatus = getHttpStatus(error)

  const payload = {
    reportTime: Date.now(),
    courseId: String(options.courseId || ''),
    resourceId: String(options.resourceId || file.resourceId || file.videoId || file.id || file.lessonId || ''),
    objectPath: getFullObjectAddress(source),
    playerUuid: String(options.playerUuid || ''),
    requestId: String(requestId || ''),
    httpStatus: reportedHttpStatus,
    urlExpireAt: fileExpiry || sourceExpiry || null,
    error: {
      code: String(code || 'MEDIA_ERROR'),
      message: sanitizeMessage(findDiagnosticValue(error, ['message', 'msg']) || '视频加载失败'),
      stage: String(findDiagnosticValue(error, ['stage']) || options.stage || 'segment_load')
    },
    playback: {
      currentTimeSeconds: Number.isFinite(currentTime) ? currentTime : 0,
      retryCount: Math.max(0, Number(options.retryCount) || 0)
    },
    platform: String(options.platform || getPlatform()),
    eagleid: String(findDiagnosticValue(error, ['eagleId', 'eagleid', 'x-eagle-id', 'x-eagleid']) || ''),
    clientIp: String(findDiagnosticValue(error, ['clientIp', 'client_ip']) || ''),
    dns: String(findDiagnosticValue(error, ['dns', 'dnsName', 'host']) || mediaUrlHost),
    nodeIp: String(findDiagnosticValue(error, ['nodeIp', 'edgeIp', 'serverIp', 'remoteAddress', 'x-server-ip']) || '')
  }
  return payload
}

export function reportCdnPlaybackError(options = {}) {
  const payload = buildPayload(options)
  return reportCdnError(payload).catch(error => {
    console.warn('[CDN error report failed]', error && error.message)
    return null
  })
}
