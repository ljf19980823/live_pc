import { login, logout, getUserInfo } from '@/api'
import { getToken, setToken, clearAuth, setUserInfo, getUserInfo as getStoredUserInfo } from '@/utils/auth'

const state = {
  token: getToken(),
  userInfo: getStoredUserInfo() || {},
  role: ''
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
  },
  SET_ROLE(state, role) {
    state.role = role
  },
  RESET(state) {
    state.token = ''
    state.userInfo = {}
    state.role = ''
  }
}

const actions = {
  // 登录
  async login({ commit }, loginForm) {
    const res = await login(loginForm)
    const token = res.data?.token || res.token
    commit('SET_TOKEN', token)
    setToken(token)
    return res
  },

  // 获取用户信息
  async fetchUserInfo({ commit }) {
    const res = await getUserInfo()
    const info = res.data || res
    commit('SET_USER_INFO', info)
    commit('SET_ROLE', info.role || '')
    setUserInfo(info)
    return info
  },

  // 退出登录
  async logout({ commit }) {
    try {
      await logout()
    } finally {
      commit('RESET')
      clearAuth()
    }
  },

  // 前端强制退出（Token 失效时调用）
  resetToken({ commit }) {
    commit('RESET')
    clearAuth()
  }
}

const getters = {
  token: state => state.token,
  userInfo: state => state.userInfo,
  userId: state => state.userInfo?.id,
  userName: state => state.userInfo?.userName,
  avatar: state => state.userInfo?.profilePicture,
  role: state => state.role,
  isLoggedIn: state => !!state.token
}

export default { namespaced: true, state, mutations, actions, getters }
