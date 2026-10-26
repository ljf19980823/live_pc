import request from '@/utils/t1Request'
import { clearAuthInfo, getToken } from '@/utils/auth'
import { createPaperSseParser } from '@/utils/aiPaper'

const AI_BASE_URL = (process.env.VUE_APP_T1_AI_BASE_URL || process.env.VUE_APP_API_BASE_URL || '').replace(/\/$/, '')

export function generatePaperInBackground(payload, { signal } = {}) {
  return request({
    baseURL: AI_BASE_URL,
    url: '/v1/t1-ai/papers/generate',
    method: 'post',
    data: payload,
    signal,
    skipErrorMessage: true
  })
}

export function exportTeacherChatPaper(payload, { signal } = {}) {
  return request({
    url: '/v1/teacher-chat-export',
    method: 'post',
    data: payload,
    signal,
    skipErrorMessage: true
  })
}

/** POST SSE；使用 XHR progress 持续读取生成结果。 */
export function streamGeneratePaper(payload, { onEvent, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const parse = createPaperSseParser((event, data) => {
      if (event === 'error') throw new Error(data && (data.error || data.message) || '组卷失败')
      if (event === 'complete') completed = true
      if (onEvent) onEvent(event, data)
    })
    let consumed = 0
    let completed = false
    let settled = false

    const finish = (error) => {
      if (settled) return
      settled = true
      if (signal) signal.removeEventListener('abort', abort)
      if (error) reject(error)
      else resolve()
    }
    const consume = flush => {
      const body = xhr.responseText || ''
      const chunk = body.slice(consumed)
      consumed = body.length
      if (chunk || flush) parse(chunk, flush)
    }
    const abort = () => {
      xhr.abort()
      const error = new Error('请求已取消')
      error.name = 'AbortError'
      finish(error)
    }

    xhr.open('POST', `${AI_BASE_URL}/v1/t1-ai/papers/generate/stream`, true)
    xhr.timeout = 300000
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Accept', 'text/event-stream')
    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.onprogress = () => {
      try { consume(false) } catch (error) { finish(error); xhr.abort() }
    }
    xhr.onload = () => {
      if (settled) return
      if (xhr.status === 401) {
        clearAuthInfo()
        window.dispatchEvent(new CustomEvent('teacherone:auth-expired'))
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = '组卷请求失败'
        try {
          const body = JSON.parse(xhr.responseText)
          message = body.message || body.error || message
        } catch (error) { /* 非 JSON 错误响应 */ }
        finish(new Error(message))
        return
      }
      try {
        consume(true)
        finish(completed ? null : new Error('组卷连接已结束，但未收到完成事件'))
      } catch (error) { finish(error) }
    }
    xhr.onerror = () => finish(new Error('网络连接失败，请稍后重试'))
    xhr.ontimeout = () => finish(new Error('组卷等待超时，请稍后重试'))
    xhr.onabort = () => {
      if (!settled) {
        const error = new Error('请求已取消')
        error.name = 'AbortError'
        finish(error)
      }
    }
    if (signal) {
      if (signal.aborted) { abort(); return }
      signal.addEventListener('abort', abort, { once: true })
    }
    xhr.send(JSON.stringify(payload))
  })
}
