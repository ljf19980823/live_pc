/** 账号登录的前端调试开关，不用于服务端鉴权。日期使用浏览器本地时间。 */
export function isAccountLoginAllowed(location = window.location, electronAPI = window.electronAPI, now = new Date()) {
  // 本地开发服务直接放行；生产构建即使在 localhost 访问也仍需校验。
  if (process.env.NODE_ENV === 'development') return true
  if (typeof electronAPI?.getDeviceInfo === 'function') return true

  const key = String((now.getMonth() + 1) * now.getDate())
  const hash = location.hash || ''
  const hashQueryIndex = hash.indexOf('?')
  const queries = [location.search || '', hashQueryIndex < 0 ? '' : hash.slice(hashQueryIndex + 1)]

  return queries.some(query => {
    const values = new URLSearchParams(query).getAll('debug')
    return values.length === 1 && values[0] === key
  })
}
