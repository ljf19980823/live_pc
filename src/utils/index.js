/**
 * 通用工具函数
 */

// ─── 数据类型判断 ─────────────────────────────────────────────
export const isString = val => typeof val === 'string'
export const isNumber = val => typeof val === 'number'
export const isArray = val => Array.isArray(val)
export const isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val)
export const isEmpty = val => val === null || val === undefined || val === ''

// ─── 时间格式化 ───────────────────────────────────────────────
/**
 * 格式化时间
 * @param {Date|string|number} date
 * @param {string} fmt - 格式模板，如 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDate(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  const d = new Date(date)
  const map = {
    YYYY: d.getFullYear(),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0')
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, matched => map[matched])
}

// ─── 防抖 ─────────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// ─── 节流 ─────────────────────────────────────────────────────
export function throttle(fn, interval = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

// ─── 深拷贝 ───────────────────────────────────────────────────
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  const cloned = {}
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key])
  })
  return cloned
}

// ─── URL 参数操作 ─────────────────────────────────────────────
export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search)
  return params.get(key)
}

export function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

// ─── 数字格式化 ───────────────────────────────────────────────
/** 格式化观看人数，如 12300 → 1.2万 */
export function formatCount(num) {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(1) + '万'
  return String(num)
}

/** 格式化直播时长（秒） */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── 设备检测 ─────────────────────────────────────────────────
export function getDeviceType() {
  const ua = navigator.userAgent
  if (/iPad/i.test(ua)) return 'ipad'
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'tablet'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function isMobile() {
  return ['mobile'].includes(getDeviceType())
}

export function isTablet() {
  return ['ipad', 'tablet'].includes(getDeviceType())
}

// ─── 本地存储封装（带 JSON 序列化）────────────────────────────
export const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  },
  get(key, defaultValue = null) {
    const val = localStorage.getItem(key)
    try {
      return val !== null ? JSON.parse(val) : defaultValue
    } catch {
      return defaultValue
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  },
  clear() {
    localStorage.clear()
  }
}
