import renderMathInElement from 'katex/contrib/auto-render'
import { needsReadableFraction, renderFormulaHtml } from './formulaLayout'
import { findSpreadsheetReferences } from './spreadsheetReferences'
import { escapeMathComparisons } from './mathHtml'

const ignoredMathContent = 'script, noscript, style, textarea, pre, code, option, math, svg, .ql-formula, .katex, .katex-display, .spreadsheet-reference'

function preserveSpreadsheetReferences(el) {
  const doc = el.ownerDocument
  const walker = doc.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach(node => {
    if (node.parentElement?.closest(ignoredMathContent)) return
    const references = findSpreadsheetReferences(node.data)
    if (!references.length) return
    const fragment = doc.createDocumentFragment()
    let start = 0
    references.forEach(reference => {
      fragment.appendChild(doc.createTextNode(node.data.slice(start, reference.start)))
      const literal = doc.createElement('span')
      literal.className = 'spreadsheet-reference'
      literal.textContent = node.data.slice(reference.start, reference.end)
      fragment.appendChild(literal)
      start = reference.end
    })
    fragment.appendChild(doc.createTextNode(node.data.slice(start)))
    node.replaceWith(fragment)
  })
}

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
  el.innerHTML = escapeMathComparisons(value)
  el.querySelectorAll('[style]').forEach(node => {
    // 从原始属性读取：浏览器的 CSSStyleDeclaration 会丢弃 width:131。
    const style = node.getAttribute('style')
    const normalized = normalizeInlineWidths(style)
    if (normalized !== style) node.setAttribute('style', normalized)
    // 表格展示时移除行内宽度，避免固定宽度影响布局。
    if (node.tagName === 'TABLE' || node.tagName === 'TD') node.style.removeProperty('width')
  })
  // 原文展示单元格的绝对/混合引用，不修改 HTML 属性或题目数据。
  preserveSpreadsheetReferences(el)
  // 只解析文本节点，不改动 HTML 属性和已有公式，也不写回题目数据。
  renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'math', 'svg'],
    ignoredClasses: ['ql-formula', 'katex', 'katex-display', 'spreadsheet-reference'],
    trust: false,
    strict: 'ignore',
    // 无效公式保留原文，其他公式和富文本仍可正常显示。
    throwOnError: true,
    errorCallback: () => {}
  })
  // 同时兼容历史题目保存的 KaTeX HTML、编辑器公式和刚解析的 LaTeX。
  el.querySelectorAll('.katex:not([data-formula-layout="readable"])').forEach(node => {
    const latex = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent
    if (!latex || !needsReadableFraction(latex, !!node.closest('.katex-display'))) return
    try {
      const template = el.ownerDocument.createElement('template')
      template.innerHTML = renderFormulaHtml(latex, { throwOnError: true, trust: false, strict: 'ignore' })
      node.replaceWith(template.content)
    } catch (error) {
      // 历史公式无法重新解析时保留已有的展示内容。
    }
  })
}

// 富文本展示统一使用 v-rich-html，同步处理公式与宽度，供布局测量使用。
export default {
  bind: renderRichText,
  update(el, binding) {
    if (binding.value !== binding.oldValue) renderRichText(el, binding)
  }
}
