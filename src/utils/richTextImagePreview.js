/**
 * 富文本（v-html）内图片点击放大预览
 * 约定：在 v-html 容器上加 class="rich-text-content"
 * 排除：img 带 data-no-preview 属性
 */
import Vue from 'vue'
import ImageViewer from 'element-ui/packages/image/src/image-viewer'

const RICH_TEXT_SELECTOR = '.rich-text-content'
const PREVIEW_Z_INDEX = 4000

let previewVm = null
let installed = false
let prevBodyOverflow = ''

function destroyPreview() {
  if (!previewVm) return
  previewVm.$destroy()
  previewVm = null
  if (typeof document !== 'undefined') {
    document.body.style.overflow = prevBodyOverflow
  }
}

/**
 * 打开图片预览（支持多图切换）
 * @param {string[]} urlList
 * @param {number} initialIndex
 */
export function openImagePreview(urlList, initialIndex = 0) {
  const list = (urlList || []).filter(Boolean)
  if (!list.length) return

  destroyPreview()

  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  const ViewerCtor = Vue.extend({
    render(h) {
      return h(ImageViewer, {
        props: {
          urlList: list,
          initialIndex: Math.min(Math.max(initialIndex, 0), list.length - 1),
          zIndex: PREVIEW_Z_INDEX,
          onClose: () => {
            destroyPreview()
          }
        }
      })
    }
  })

  previewVm = new ViewerCtor()
  previewVm.$mount()
}

function collectImages(container) {
  return Array.from(container.querySelectorAll('img')).filter(
    img => !img.hasAttribute('data-no-preview') && (img.currentSrc || img.src)
  )
}

function handleRichTextImageClick(e) {
  const target = e.target
  if (!target || target.tagName !== 'IMG') return
  if (target.hasAttribute('data-no-preview')) return
  // 预览层内、el-image 组件内的点击不处理
  if (target.closest('.el-image-viewer__wrapper, .el-image')) return

  const container = target.closest(RICH_TEXT_SELECTOR)
  if (!container) return

  const imgs = collectImages(container)
  if (!imgs.length) return

  const urlList = imgs.map(img => img.currentSrc || img.src)
  const initialIndex = Math.max(0, imgs.indexOf(target))

  e.preventDefault()
  openImagePreview(urlList, initialIndex)
}

/**
 * 注册全局点击监听（幂等）
 */
export function setupRichTextImagePreview() {
  if (installed || typeof document === 'undefined') return
  document.addEventListener('click', handleRichTextImageClick)
  installed = true
}
