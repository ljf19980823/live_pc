const layouts = new WeakMap()

function updateLayout(element) {
  const width = element.clientWidth
  if (!width || !element.children.length) return

  const gap = parseFloat(window.getComputedStyle(element).columnGap) || 0
  // 临时使用内容固有宽度测量，包含选项序号、富文本、图片和公式。
  // 测量与恢复在同一帧内完成，不会展示中间布局。
  element.style.gridTemplateColumns = 'max-content'
  const optionWidth = Math.max(...Array.from(element.children, option => option.offsetWidth))
  const columns = [4, 2, 1].find(count => count * optionWidth + (count - 1) * gap <= width) || 1
  element.classList.toggle('four-columns', columns === 4)
  element.classList.toggle('two-columns', columns === 2)
  element.classList.toggle('one-column', columns === 1)
  element.style.removeProperty('grid-template-columns')
}

export default {
  inserted(element) {
    const state = { frame: null, observer: null, disposed: false }
    const schedule = () => {
      if (state.disposed || state.frame !== null) return
      state.frame = window.requestAnimationFrame(() => {
        state.frame = null
        updateLayout(element)
      })
    }
    state.schedule = schedule
    layouts.set(element, state)

    if (window.ResizeObserver) {
      let lastWidth
      state.observer = new window.ResizeObserver(entries => {
        const width = entries[0].contentRect.width
        if (width !== lastWidth) {
          lastWidth = width
          schedule()
        }
      })
      state.observer.observe(element)
    }
    window.addEventListener('resize', schedule)
    element.addEventListener('load', schedule, true)
    element.addEventListener('error', schedule, true)
    if (document.fonts) {
      document.fonts.ready.then(schedule)
      document.fonts.addEventListener('loadingdone', schedule)
    }
    schedule()
  },
  componentUpdated(element) {
    const state = layouts.get(element)
    if (state) state.schedule()
  },
  unbind(element) {
    const state = layouts.get(element)
    if (!state) return
    state.disposed = true
    if (state.observer) state.observer.disconnect()
    if (state.frame !== null) window.cancelAnimationFrame(state.frame)
    window.removeEventListener('resize', state.schedule)
    element.removeEventListener('load', state.schedule, true)
    element.removeEventListener('error', state.schedule, true)
    if (document.fonts) document.fonts.removeEventListener('loadingdone', state.schedule)
    layouts.delete(element)
  }
}
