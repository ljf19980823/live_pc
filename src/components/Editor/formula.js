import Quill from 'quill'
import katex from 'katex'

const Formula = Quill.import('formats/formula')
const Embed = Quill.import('blots/embed')

// 保留 Quill 的公式结构与 data-value，保存后的 HTML 可展示，也能还原为公式。
class QuizFormula extends Formula {
  static create(value) {
    const node = Embed.create.call(this)
    node.setAttribute('data-value', value)
    // Embed 构造器会隔离公式内容，并在两侧放置可编辑的光标守卫。
    // 外层不可设置 contenteditable=false，否则公式前后无法继续输入。
    katex.render(value, node, { throwOnError: false, trust: false, strict: 'ignore' })
    return node
  }
}

export function registerQuizFormula() {
  Quill.register(QuizFormula, true)
}
