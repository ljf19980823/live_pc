/**
 * 全局组件注册
 * 在 main.js 中 import 此文件即可
 */
import Vue from 'vue'
import Pagination from './Pagination/index.vue'
import SvgIcon from './SvgIcon/index.vue'
import EmptyState from './EmptyState/index.vue'

const components = { Pagination, SvgIcon, EmptyState }

Object.keys(components).forEach(name => {
  Vue.component(name, components[name])
})
