import MarkdownIt from 'markdown-it'
import { renderFormulaHtml } from './formulaLayout'
import { spreadsheetDollarPositions } from './spreadsheetReferences'

function renderFormula(formula, displayMode, source, escapeHtml) {
  try {
    return renderFormulaHtml(formula, {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml'
    })
  } catch (error) {
    return `<span class="math-error">${escapeHtml(source || formula)}</span>`
  }
}

function findUnescaped(text, marker, fromIndex, ignoredPositions) {
  let index = text.indexOf(marker, fromIndex)
  while (index >= 0) {
    let slashCount = 0
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashCount += 1
    if (slashCount % 2 === 0 && !ignoredPositions?.has(index)) return index
    index = text.indexOf(marker, index + marker.length)
  }
  return -1
}

function mathPlugin(md) {
  // 块级解析先于段落拆分，保留 aligned / matrix 等公式中的空行。
  md.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
    if (state.sCount[startLine] - state.blkIndent >= 4) return false
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const firstLine = state.src.slice(start, state.eMarks[startLine])
    const open = firstLine.startsWith('$$') ? '$$' : firstLine.startsWith('\\[') ? '\\[' : ''
    if (!open) return false
    const close = open === '$$' ? '$$' : '\\]'
    let lastLine = startLine
    let closingIndex = findUnescaped(firstLine, close, open.length)
    let closingLine = firstLine
    if (closingIndex < 0) {
      for (lastLine = startLine + 1; lastLine < endLine; lastLine += 1) {
        if (state.sCount[lastLine] < state.blkIndent && !state.isEmpty(lastLine)) return false
        closingLine = state.src.slice(state.bMarks[lastLine] + state.tShift[lastLine], state.eMarks[lastLine])
        closingIndex = findUnescaped(closingLine, close, 0)
        if (closingIndex >= 0) break
      }
    }
    if (closingIndex < 0 || closingLine.slice(closingIndex + close.length).trim()) return false
    const content = lastLine === startLine
      ? firstLine.slice(open.length, closingIndex)
      : firstLine.slice(open.length) + '\n' + state.getLines(startLine + 1, lastLine, state.blkIndent, true) + closingLine.slice(0, closingIndex)
    if (!content.trim()) return false
    if (silent) return true
    const token = state.push('math_block', '', 0)
    token.block = true
    token.content = content.trim()
    token.markup = open
    token.map = [startLine, lastLine + 1]
    token.meta = { source: `${open}${content}${close}` }
    state.line = lastLine + 1
    return true
  }, { alt: ['paragraph', 'reference', 'blockquote', 'list'] })

  const addInlineRule = (name, open, close, displayMode) => {
    md.inline.ruler.before('escape', name, (state, silent) => {
      const start = state.pos
      if (!state.src.startsWith(open, start)) return false
      if (open === '$' && state.src.startsWith('$$', start)) return false
      const literalDollars = open === '$' ? spreadsheetDollarPositions(state.src) : null
      if (literalDollars?.has(start)) return false
      const contentStart = start + open.length
      const end = findUnescaped(state.src, close, contentStart, literalDollars)
      if (end < 0 || end === contentStart) {
        // 流式响应尚未闭合时保留分隔符，不交给 Markdown 的反斜杠转义规则。
        if (!silent) state.push('text', '', 0).content = open
        state.pos = contentStart
        return true
      }
      if (!silent) {
        const token = state.push(displayMode ? 'math_display' : 'math_inline', '', 0)
        token.content = state.src.slice(contentStart, end).trim()
        token.meta = { source: state.src.slice(start, end + close.length) }
      }
      state.pos = end + close.length
      return true
    })
  }

  // 长分隔符必须先于单个 $ 匹配。
  addInlineRule('math_dollar_block_inline', '$$', '$$', true)
  addInlineRule('math_bracket_inline', '\\[', '\\]', true)
  addInlineRule('math_parenthesis_inline', '\\(', '\\)', false)
  addInlineRule('math_dollar_inline', '$', '$', false)

  const renderMath = (tokens, index, displayMode) => renderFormula(tokens[index].content, displayMode, tokens[index].meta.source, md.utils.escapeHtml)
  md.renderer.rules.math_inline = (tokens, index) => renderMath(tokens, index, false)
  md.renderer.rules.math_display = (tokens, index) => renderMath(tokens, index, true)
  md.renderer.rules.math_block = (tokens, index) => renderMath(tokens, index, true) + '\n'
}

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: false
}).use(mathPlugin)

const defaultLinkOpen = markdown.renderer.rules.link_open || ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer nofollow')
  return defaultLinkOpen(tokens, index, options, env, self)
}

/** 安全渲染 AI 返回的 Markdown，并支持常用 LaTeX 分隔符。 */
export function renderMarkdownText(value) {
  return markdown.render(String(value == null ? '' : value))
}

/** 导出服务识别 MathML；只保留 KaTeX 的 MathML 分支，避免公式在文件中重复显示。 */
export function renderExportRichText(value) {
  const html = renderMarkdownText(value)
  if (typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('.katex').forEach(node => {
    const math = node.querySelector('.katex-mathml math')
    if (math) node.replaceWith(math.cloneNode(true))
  })
  return doc.body.innerHTML
}

/**
 * 安全渲染单行/行内文本中的 LaTeX 公式。
 *
 * 课堂笔记等结构化字段本身已有固定的 DOM 结构，使用 renderInline 可避免
 * Markdown 额外生成 p 标签，同时保留 $...$、$$...$$、\\(...\\) 和 \\[...\\]
 * 公式分隔符的支持。
 */
export function renderInlineMathText(value) {
  return markdown.renderInline(String(value == null ? '' : value))
}

// 编辑器使用公式嵌入节点，保留 LaTeX 源码，避免 Quill 将 KaTeX 拆成普通文本。
const editorMarkdown = new MarkdownIt({ html: false, breaks: true, linkify: true }).use(mathPlugin)
const renderEditorFormula = (tokens, index, displayMode) => {
  const token = tokens[index]
  const value = editorMarkdown.utils.escapeHtml(token.content)
  return `<span class="ql-formula" data-value="${value}"${displayMode ? ' data-display="block"' : ''}>${renderFormula(token.content, displayMode, token.meta.source, editorMarkdown.utils.escapeHtml)}</span>`
}
editorMarkdown.renderer.rules.math_inline = (tokens, index) => renderEditorFormula(tokens, index, false)
editorMarkdown.renderer.rules.math_display = (tokens, index) => renderEditorFormula(tokens, index, true)
editorMarkdown.renderer.rules.math_block = (tokens, index) => `<p>${renderEditorFormula(tokens, index, true)}</p>\n`

export function renderEditorMarkdown(value, inline = false) {
  const source = String(value == null ? '' : value)
  return inline ? editorMarkdown.renderInline(source) : editorMarkdown.render(source)
}

export function hasEditorMarkdown(value, inline = false) {
  const tokens = inline ? editorMarkdown.parseInline(value, {}) : editorMarkdown.parse(value, {})
  return tokens.some(token => !['paragraph_open', 'paragraph_close', 'inline'].includes(token.type) ||
    (token.children || []).some(child => !['text', 'softbreak', 'hardbreak'].includes(child.type)))
}
