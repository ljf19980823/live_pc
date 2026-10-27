import { renderEditorMarkdown, hasEditorMarkdown } from '@/utils/mathText'
import { escapeMathComparisons } from '@/utils/mathHtml'

const ignored = 'pre, code, .ql-formula, .katex, .katex-display'
const htmlTag = /<\/?(?:p|div|span|br|h[1-6]|strong|b|em|i|u|s|del|a|img|ol|ul|li|blockquote|pre|code|table|thead|tbody|tr|td|th|hr|video|iframe)\b[^>]*>/i

// 只将无格式的连续段落合并解析；已有样式、图片、表格和公式保留原结构。
function isPlainLine(node) {
  return node.nodeType === 3 || (node.nodeType === 1 &&
    /^(P|DIV)$/.test(node.tagName) && !node.attributes.length &&
    Array.from(node.childNodes).every(child => child.nodeType === 3 || child.nodeName === 'BR'))
}

function lineText(node) {
  if (node.nodeType === 3) return node.textContent
  return Array.from(node.childNodes).map(child => child.nodeName === 'BR' ? '\n' : child.textContent).join('')
}

function renderChildren(parent) {
  const children = Array.from(parent.childNodes)
  for (let index = 0; index < children.length;) {
    const node = children[index]
    if (isPlainLine(node) && (node.nodeType === 1 || !parent.matches('p, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, span'))) {
      const run = []
      while (index < children.length && isPlainLine(children[index])) run.push(children[index++])
      // HTML 元素之间的排版换行不应变成额外的空段落。
      const source = run.filter(child => child.nodeType !== 3 || child.textContent.trim()).map(lineText).join('\n')
      if (hasEditorMarkdown(source)) {
        const template = document.createElement('template')
        template.innerHTML = renderEditorMarkdown(source)
        parent.insertBefore(template.content, run[0])
        run.forEach(child => child.remove())
      }
      continue
    }
    index += 1
    if (node.nodeType === 1) {
      if (!node.matches(ignored)) renderChildren(node)
    } else if (node.nodeType === 3 && hasEditorMarkdown(node.textContent, true)) {
      const template = document.createElement('template')
      template.innerHTML = renderEditorMarkdown(node.textContent, true)
      node.replaceWith(template.content)
    }
  }
}

export function normalizeEditorMarkdown(value) {
  const source = String(value == null ? '' : value)
  if (!source.trim()) return source
  if (!htmlTag.test(source)) return renderEditorMarkdown(source)
  const doc = new DOMParser().parseFromString(escapeMathComparisons(source), 'text/html')
  renderChildren(doc.body)
  return doc.body.innerHTML
}
