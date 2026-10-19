const CONTENT_TYPES = {
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PDF: 'application/pdf'
}

function safeFileName(fileName, fileType) {
  const extension = fileType === 'PDF' ? 'pdf' : 'docx'
  const name = String(fileName || `课后测.${extension}`).replace(/[\\/:*?"<>|]/g, '-')
  return `${name.replace(/\.(docx|pdf)$/i, '')}.${extension}`
}

function throwIfAborted(signal) {
  if (!signal || !signal.aborted) return
  const error = new Error('请求已取消')
  error.name = 'AbortError'
  throw error
}

function validFileUrl(url) {
  const value = String(url || '').trim()
  let parsed
  try {
    parsed = new URL(value, window.location.href)
  } catch (_) {
    parsed = null
  }
  if (!value || !parsed || !['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('导出接口返回的文件地址无效')
  }
  return parsed.href
}

async function prepareSharedFile(url, fileName, fileType, signal) {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return null
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`文件请求失败：${response.status}`)
  const blob = await response.blob()
  throwIfAborted(signal)
  const file = new File([blob], fileName, { type: CONTENT_TYPES[fileType] })
  return navigator.canShare({ files: [file] }) ? file : null
}

export function sharePreparedExportFile(file) {
  if (!file || typeof navigator.share !== 'function') {
    return Promise.reject(new Error('当前环境不支持系统文件分享'))
  }
  return navigator.share({ files: [file], title: file.name })
}

export async function openExportedFileForMobile(url, { signal } = {}) {
  const href = validFileUrl(url)
  throwIfAborted(signal)
  window.location.assign(href)
}

export async function downloadExportedFile(url, fileName, { fileType = 'DOCX', signal } = {}) {
  const href = validFileUrl(url)
  if (!CONTENT_TYPES[fileType]) throw new Error('不支持的导出格式')
  const name = safeFileName(fileName, fileType)
  throwIfAborted(signal)

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '')
  if (isMobile) {
    try {
      const file = await prepareSharedFile(href, name, fileType, signal)
      if (file) return { mode: 'mobile-share-ready', file }
    } catch (error) {
      if (error && error.name === 'AbortError') throw error
    }
    await openExportedFileForMobile(href, { signal })
    return { mode: 'mobile-open-link' }
  }

  const link = document.createElement('a')
  link.href = href
  link.download = name
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return { mode: 'browser' }
}
