const TOKEN_KEY = 'lisheng_live_token'
const USER_INFO_KEY = 'lisheng_live_user'

// ─── Token 操作（使用 localStorage，兼容 Electron file:// 协议）────
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
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
