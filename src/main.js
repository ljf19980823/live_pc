import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// ─── ElementUI ────────────────────────────────────────────────
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'katex/dist/katex.min.css'
Vue.use(ElementUI, {
  size: 'medium',
  zIndex: 2000
})

// ─── 全局样式 ─────────────────────────────────────────────────
import '@/assets/styles/index.scss'

// ─── 全局组件 ─────────────────────────────────────────────────
import '@/components/index.js'

// ─── 题目富文本与数学公式渲染 ─────────────────────────────────
import richHtml from '@/utils/richTextHtml'
Vue.directive('rich-html', richHtml)

// ─── 富文本图片点击预览 ───────────────────────────────────────
import { setupRichTextImagePreview } from '@/utils/richTextImagePreview'
setupRichTextImagePreview()

// ─── 生产环境关闭控制台提示 ───────────────────────────────────
Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
