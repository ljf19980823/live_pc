import katex from 'katex'
import renderMathInElement from 'katex/contrib/auto-render'

// 只修复 width 的无单位数字，保留其他属性、已有单位和 !important。
export function normalizeInlineWidths(style) {
  const normalizeDeclaration = declaration => declaration.replace(
    /^(\s*width\s*:\s*)(\+?(?:\d+(?:\.\d*)?|\.\d+))(\s*(?:!\s*important\s*)?)$/i,
    '$1$2px$3'
  )
  let start = 0
  let depth = 0
  let result = ''

  // 字符串、注释和函数中的分号不是声明分隔符。
  const tokens = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\*[\s\S]*?\*\/|[();]/g
  let token
  while ((token = tokens.exec(style))) {
    if (token[0] === '(') depth += 1
    if (token[0] === ')') depth = Math.max(0, depth - 1)
    if (token[0] === ';' && depth === 0) {
      result += normalizeDeclaration(style.slice(start, token.index)) + ';'
      start = token.index + 1
    }
  }

  return result + normalizeDeclaration(style.slice(start))
}

function renderRichText(el, { value }) {
  el.innerHTML = value == null ? '' : String(value)
  el.querySelectorAll('.ql-formula[data-value]').forEach(node => {
    const formula = node.getAttribute('data-value') || ''
    if (!formula) return

    try {
      katex.render(formula, node, {
        throwOnError: false,
        trust: false,
        strict: 'ignore'
      })
    } catch (error) {
      node.textContent = formula
    }
  })
  el.querySelectorAll('[style]').forEach(node => {
    // 从原始属性读取：浏览器的 CSSStyleDeclaration 会丢弃 width:131。
    const style = node.getAttribute('style')
    const normalized = normalizeInlineWidths(style)
    if (normalized !== style) node.setAttribute('style', normalized)
    // 表格展示时移除行内宽度，避免固定宽度影响布局。
    if (node.tagName === 'TABLE' || node.tagName === 'TD') node.style.removeProperty('width')
  })
  // 只处理文本节点中的 LaTeX，保留富文本结构和已有的公式节点。
  renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'math'],
    ignoredClasses: ['katex', 'katex-display', 'ql-formula'],
    throwOnError: false,
    trust: false,
    strict: 'ignore'
  })
}

// 富文本展示统一使用 v-rich-html，内容更新时同步修复，供布局测量使用。
export default {
  bind: renderRichText,
  update(el, binding) {
    if (binding.value !== binding.oldValue) renderRichText(el, binding)
  }
}
