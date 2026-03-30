import Cookies from 'js-cookie'

const TOKEN_KEY = 'lisheng_live_token'
const USER_INFO_KEY = 'lisheng_live_user'

// ─── Token 操作 ───────────────────────────────────────────────
export function getToken() {
  return Cookies.get(TOKEN_KEY)
}

export function setToken(token, options = {}) {
  // 默认 7 天过期
  return Cookies.set(TOKEN_KEY, token, { expires: 7, ...options })
}

export function removeToken() {
  return Cookies.remove(TOKEN_KEY)
}

// ─── 用户信息操作（存 sessionStorage，关闭浏览器自动清除）─────
export function getUserInfo() {
  const info = sessionStorage.getItem(USER_INFO_KEY)
  try {
    return info ? JSON.parse(info) : null
  } catch {
    return null
  }
}

export function setUserInfo(userInfo) {
  sessionStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
}

export function removeUserInfo() {
  sessionStorage.removeItem(USER_INFO_KEY)
}

// ─── 清除所有认证信息 ─────────────────────────────────────────
export function clearAuth() {
  removeToken()
  removeUserInfo()
}
