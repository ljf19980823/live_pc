import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import app from './modules/app'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    user,
    app
  },
  // 开发环境开启严格模式
  strict: process.env.NODE_ENV !== 'production'
})

export default store
