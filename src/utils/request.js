import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import { getToken, clearAuth } from './auth'
import router from '@/router'

// ─── 创建 axios 实例 ──────────────────────────────────────────
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: Number(process.env.VUE_APP_REQUEST_TIMEOUT) || 50000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

let deviceInfoPromise = null

function getFallbackDeviceInfo() {
  const userAgent = navigator.userAgent || ''
  const isMac = /Macintosh|Mac OS X/i.test(userAgent)
  const isWindows = /Windows/i.test(userAgent)

  return {
    deviceId: localStorage.getItem('deviceId') || '',
    deviceModel: navigator.platform || '',
    systemVersion: userAgent,
    osName: navigator.platform || '',
    deviceType: isMac ? 'mac' : isWindows ? 'windows' : 'web'
  }
}

async function getDeviceInfo() {
  if (!deviceInfoPromise) {
    deviceInfoPromise = (async () => {
      if (window.electronAPI?.getDeviceInfo) {
        return window.electronAPI.getDeviceInfo()
      }
      return getFallbackDeviceInfo()
    })().catch(error => {
      console.warn('[Device Info Error]', error)
      return getFallbackDeviceInfo()
    })
  }

  return deviceInfoPromise
}

function normalizeHeaderValue(value) {
  return encodeURIComponent(String(value))
}

function setDeviceHeaders(headers, deviceInfo) {
  if (!headers || !deviceInfo) return
  ;['deviceId', 'deviceModel', 'systemVersion', 'osName', 'deviceType'].forEach(key => {
    if (deviceInfo[key]) {
      headers[key] = normalizeHeaderValue(deviceInfo[key])
    }
  })
}

// ─── 请求拦截器 ───────────────────────────────────────────────
service.interceptors.request.use(
  async config => {
    const deviceInfo = await getDeviceInfo()
    setDeviceHeaders(config.headers, deviceInfo)

    // 携带 Token
    const token = getToken()
    if (token && !config.skipAuthorization) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 文件上传时自动切换 Content-Type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    return config
  },
  error => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// ─── 响应拦截器 ───────────────────────────────────────────────
service.interceptors.response.use(
  response => {
    // 文件流直接透传完整 response，不走业务码校验
    if (response.config?.responseType === 'blob') {
      return response
    }

    if (response.config?.rawResponse) {
      return response.data
    }

    const res = response.data

    // 根据业务状态码处理（按实际后端约定修改 code 字段名和成功值）
    const successCodes = [200, 0, '200', '0', 'success']
    if (successCodes.includes(res.code)) {
      return res
    }

    const businessMsgMap = {
      4011: '账号已在其他设备登录，当前登录已失效',
      4012: '当前账号正在直播中，无法顶号',
      4013: '当前账号正在直播中，无法顶号'
    }

    if ([4011, '4011'].includes(res.code)) {
      handleAccountInvalidated(businessMsgMap[4011])
      return Promise.reject(new Error(res.message || res.msg || businessMsgMap[4011]))
    }

    if ([4012, 4013, '4012', '4013'].includes(res.code)) {
      if (!response.config?.skipErrorMessage) {
        Message({
          message: businessMsgMap[res.code] || businessMsgMap[Number(res.code)],
          type: 'error',
          duration: 3000
        })
      }
      return Promise.reject(new Error(res.message || res.msg || businessMsgMap[res.code] || businessMsgMap[Number(res.code)]))
    }

    // Token 失效 / 未授权
    if ([401, 403, 'UNAUTHORIZED'].includes(res.code)) {
      handleUnauthorized()
      return Promise.reject(new Error(res.message || '登录已过期，请重新登录'))
    }

    // 其他业务错误
    if (!response.config?.skipErrorMessage) {
      Message({
        message: res.message || res.msg || '请求失败',
        type: 'error',
        duration: 3000
      })
    }
    return Promise.reject(new Error(res.message || res.msg || 'Error'))
  },
  error => {
    if (axios.isCancel(error)) {
      console.warn('[Request Cancelled]', error.message)
      return Promise.reject(error)
    }

    const status = error.response?.status
    const msgMap = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求地址不存在',
      408: '请求超时',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      4011: '账号已在其他设备登录，当前登录已失效',
      4012: '当前账号正在直播中，无法顶号',
      4013: '当前账号正在直播中，无法顶号'

    }

    const message = msgMap[status] || error.message || '网络异常，请检查网络连接'

    if (status === 401) {
      handleUnauthorized()
    } else if (status === 4011) {
      handleAccountInvalidated(message)
    } else if (!error.config?.skipErrorMessage) {
      Message({ message, type: 'error', duration: 3000 })
    }

    return Promise.reject(error)
  }
)

// ─── 处理登录过期 ─────────────────────────────────────────────
let isShowUnauthorizedDialog = false
function handleUnauthorized() {
  if (isShowUnauthorizedDialog) return
  isShowUnauthorizedDialog = true
  MessageBox.confirm('登录已过期，请重新登录', '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
    showCancelButton: false,
    closeOnClickModal: false
  }).finally(() => {
    isShowUnauthorizedDialog = false
    clearAuth()
    router.push('/login')
  })
}
let isAccountDialog = false
function handleAccountInvalidated(message) {

  if (isAccountDialog || isShowUnauthorizedDialog) return
  isAccountDialog = true
  isShowUnauthorizedDialog = true
  MessageBox.confirm(message, '提示', {
    confirmButtonText: '重新登录',
    cancelButtonText: '取消',
    type: 'warning',
    showCancelButton: false,
    closeOnClickModal: false
  }).finally(() => {
    isAccountDialog = false
    setTimeout(() => {
      isShowUnauthorizedDialog = false
    }, 3000)
    clearAuth()
    router.push('/login')
  })
}

// ─── 取消请求工具 ─────────────────────────────────────────────
const pendingRequests = new Map()

function generateRequestKey(config) {
  const { method, url, params, data } = config
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join('&')
}

export function addPendingRequest(config) {
  const key = generateRequestKey(config)
  if (!pendingRequests.has(key)) {
    config.cancelToken = new axios.CancelToken(cancel => {
      pendingRequests.set(key, cancel)
    })
  }
}

export function removePendingRequest(config) {
  const key = generateRequestKey(config)
  if (pendingRequests.has(key)) {
    const cancel = pendingRequests.get(key)
    cancel(key)
    pendingRequests.delete(key)
  }
}

export function clearPendingRequests() {
  pendingRequests.forEach(cancel => cancel())
  pendingRequests.clear()
}

// ─── 封装常用请求方法 ─────────────────────────────────────────

/**
 * GET 请求
 * @param {string} url
 * @param {object} params - 查询参数
 * @param {object} config - 额外 axios 配置
 */
export function get(url, params = {}, config = {}) {
  return service.get(url, { params, ...config })
}

/**
 * POST 请求
 * @param {string} url
 * @param {object} data - 请求体
 * @param {object} config - 额外 axios 配置
 */
export function post(url, data = {}, config = {}) {
  return service.post(url, data, config)
}

/**
 * PUT 请求
 * @param {string} url
 * @param {object} data
 * @param {object} config
 */
export function put(url, data = {}, config = {}) {
  return service.put(url, data, config)
}

/**
 * PATCH 请求
 * @param {string} url
 * @param {object} data
 * @param {object} config
 */
export function patch(url, data = {}, config = {}) {
  return service.patch(url, data, config)
}

/**
 * DELETE 请求
 * @param {string} url
 * @param {object} params
 * @param {object} config
 */
export function del(url, params = {}, config = {}) {
  return service.delete(url, { params, ...config })
}

/**
 * 文件上传
 * @param {string} url
 * @param {FormData} formData
 * @param {Function} onProgress - 上传进度回调 (percent: number) => void
 */
export function upload(url, formData, onProgress) {
  return service.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    }
  })
}

/**
 * 文件下载
 * @param {string} url
 * @param {object} params
 * @param {string} filename - 下载文件名
 */
export async function download(url, params = {}, filename = 'download') {
  const response = await service.get(url, {
    params,
    responseType: 'blob'
  })
  // 拦截器透传了完整 response，data 是 Blob
  const blob = new Blob([response.data])

  // 尝试从 Content-Disposition 读取服务端文件名
  let finalFilename = filename
  const disposition = response.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (match && match[1]) {
    finalFilename = decodeURIComponent(match[1].replace(/['"]/g, '').trim())
  }

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

export default service
