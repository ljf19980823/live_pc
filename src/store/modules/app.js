import { getDeviceType } from '@/utils'

const state = {
  // 侧边栏状态
  sidebar: {
    opened: true
  },
  // 设备类型：desktop / ipad / tablet / mobile
  device: getDeviceType(),
  // 屏幕宽度
  screenWidth: window.innerWidth,
  // 应用更新信息
  hasUpdate: false,
  isForceUpdate: 0,
  updateInfo: {
    version: '',
    downloadUrl: '',
    description: ''
  }
}

const mutations = {
  TOGGLE_SIDEBAR(state) {
    state.sidebar.opened = !state.sidebar.opened
  },
  OPEN_SIDEBAR(state) {
    state.sidebar.opened = true
  },
  CLOSE_SIDEBAR(state) {
    state.sidebar.opened = false
  },
  SET_DEVICE(state, device) {
    state.device = device
  },
  SET_SCREEN_WIDTH(state, width) {
    state.screenWidth = width
  },
  SET_UPDATE_INFO(state, { hasUpdate, isForceUpdate, updateInfo }) {
    state.hasUpdate = hasUpdate
    state.isForceUpdate = isForceUpdate
    state.updateInfo = updateInfo
  }
}

const actions = {
  toggleSidebar({ commit }) {
    commit('TOGGLE_SIDEBAR')
  },
  updateDevice({ commit }) {
    const width = window.innerWidth
    commit('SET_SCREEN_WIDTH', width)
    if (width <= 768) {
      commit('SET_DEVICE', 'mobile')
    } else if (width <= 1024) {
      commit('SET_DEVICE', 'tablet')
    } else {
      commit('SET_DEVICE', 'desktop')
    }
  }
}

const getters = {
  sidebarOpened: state => state.sidebar.opened,
  device: state => state.device,
  screenWidth: state => state.screenWidth,
  isMobile: state => state.device === 'mobile',
  isTablet: state => ['tablet', 'ipad'].includes(state.device),
  hasUpdate: state => state.hasUpdate,
  isForceUpdate: state => state.isForceUpdate,
  updateInfo: state => state.updateInfo
}

export default { namespaced: true, state, mutations, actions, getters }
