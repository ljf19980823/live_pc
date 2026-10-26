import axios from 'axios'
import { Message, MessageBox } from 'element-ui'

import { clearAuthInfo, getToken } from '@/utils/auth'

const AUTH_EXPIRED_EVENT = 'teacherone:auth-expired'
const AUTH_EXPIRED_MESSAGE_PATTERN = /未授权|未经授权|登录(?:状态)?(?:已)?(?:过期|超时)|登录失效|请重新登录|token\s*(?:已)?(?:过期|失效|无效)|invalid\s+token|token\s+expired|unauthorized/i
const NETWORK_ERROR_MESSAGE = '内容加载遇到问题，请稍后再试'
let lastErrorMessage = ''
let lastErrorMessageAt = 0
let networkErrorAlertActive = false
let lastNetworkErrorAlertAt = 0

// 沿用 AI 项目的响应协议，提示由 PC 端已有的 Element UI 展示。
function showResponsiveMessage(options) {
  if (options.modal) {
    return MessageBox.alert(options.message, options.title, {
      type: options.type,
      confirmButtonText: options.confirmText || '确定',
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false
    }).then(() => true, () => false)
  }
  Message(options)
  return Promise.resolve(true)
}

function isAuthExpiredResponse(responseData, status) {
  if (status === 401) {
    return true
  }

  if (!responseData || typeof responseData !== 'object') {
    return false
  }

  const message = String(responseData.message || responseData.msg || '')
  const code = String(responseData.code == null ? '' : responseData.code)

  return code === '401' || AUTH_EXPIRED_MESSAGE_PATTERN.test(message)
}

function notifyAuthExpired() {
  clearAuthInfo()

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  }
}

function shouldNotifyAuthExpired(config) {
  return !(config && config.skipAuthExpiredHandler)
}

export function isNetworkError(error) {
  return Boolean(error && !error.response && (
    error.code === 'ERR_NETWORK' || /^Network Error$/i.test(error.message || '')
  ))
}

export function showNetworkErrorAlert(error) {
  if (!isNetworkError(error)) return false

  const now = Date.now()
  if (networkErrorAlertActive || now - lastNetworkErrorAlertAt < 1500) return true

  networkErrorAlertActive = true
  lastNetworkErrorAlertAt = now
  showResponsiveMessage({
    type: 'error',
    title: '暂时无法加载',
    message: NETWORK_ERROR_MESSAGE,
    confirmText: '我知道了',
    modal: true
  }).finally(() => {
    networkErrorAlertActive = false
  })
  return true
}

export function getRequestErrorMessage(error) {
  const responseData = error.response && error.response.data
  const serverMessage = responseData && (responseData.message || responseData.msg)

  if (serverMessage) {
    return serverMessage
  }

  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return '请求超时，请稍后重试'
  }

  return error.message || '网络异常，请稍后重试'
}

function showErrorMessage(message, config, error) {
  if (showNetworkErrorAlert(error)) return
  if (config && config.skipErrorMessage) {
    return
  }

  const now = Date.now()
  if (message === lastErrorMessage && now - lastErrorMessageAt < 1500) {
    return
  }

  lastErrorMessage = message
  lastErrorMessageAt = now
  showResponsiveMessage({
    type: 'error',
    title: '请求失败',
    message,
    showClose: true
  })
}

const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 300000
})

service.interceptors.request.use(
  config => {
    const token = config.skipAuth ? '' : getToken()

    config.headers = config.headers || {}

    if (token && !config.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

service.interceptors.response.use(
  response => {
    const responseData = response.data

    if (responseData && typeof responseData === 'object' && 'code' in responseData) {
      if (responseData.code === 200 || responseData.code === 0) {
        return responseData.data
      }

      const authExpired = isAuthExpiredResponse(responseData)
      const shouldHandleAuthExpired = authExpired && shouldNotifyAuthExpired(response.config)
      if (shouldHandleAuthExpired) {
        notifyAuthExpired()
      }

      const message = responseData.message || responseData.msg || '请求失败'
      const error = new Error(message)
      error.data = responseData.data
      error.responseData = responseData
      error.isAuthExpired = authExpired
      if (!authExpired) {
        showErrorMessage(message, response.config)
      }
      return Promise.reject(error)
    }

    return responseData
  },
  error => {
    const responseData = error.response && error.response.data
    const authExpired = isAuthExpiredResponse(
      responseData,
      error.response && error.response.status
    )
    const shouldHandleAuthExpired = authExpired && shouldNotifyAuthExpired(error.config)
    if (shouldHandleAuthExpired) {
      notifyAuthExpired()
    }

    const message = getRequestErrorMessage(error)

    const requestError = new Error(message)
    requestError.response = error.response
    requestError.config = error.config
    requestError.data = responseData && typeof responseData === 'object'
      ? responseData.data
      : undefined
    requestError.responseData = responseData
    requestError.isAuthExpired = authExpired
    requestError.isNetworkError = isNetworkError(error)
    if (!authExpired) {
      showErrorMessage(message, error.config, error)
    }
    return Promise.reject(requestError)
  }
)

export default service
