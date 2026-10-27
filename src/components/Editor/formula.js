import Quill from 'quill'
import { renderFormulaHtml } from '@/utils/formulaLayout'

const Formula = Quill.import('formats/formula')
const Embed = Quill.import('blots/embed')

// 保留 Quill 的公式结构与 data-value，保存后的 HTML 可展示，也能还原为公式。
class QuizFormula extends Formula {
  static create(value) {
    const latex = typeof value === 'object' ? value.latex : value
    const displayMode = typeof value === 'object' && value.displayMode === true
    const node = Embed.create.call(this)
    node.setAttribute('data-value', latex)
    if (displayMode) node.setAttribute('data-display', 'block')
    // Embed 构造器会隔离公式内容，并在两侧放置可编辑的光标守卫。
    // 外层不可设置 contenteditable=false，否则公式前后无法继续输入。
    node.innerHTML = renderFormulaHtml(latex, { displayMode, throwOnError: false, trust: false, strict: 'ignore' })
    return node
  }

  static value(node) {
    const latex = node.getAttribute('data-value')
    return node.getAttribute('data-display') === 'block' ? { latex, displayMode: true } : latex
  }
}

export function registerQuizFormula() {
  Quill.register(QuizFormula, true)
}
