import { spreadsheetDollarPositions } from './spreadsheetReferences'

function isEscaped(source, index) {
  let count = 0
  while (index > 0 && source[--index] === '\\') count += 1
  return count % 2 === 1
}

// 在交给 HTML 解析器之前保护 LaTeX 中的 <、>，否则 <f(x) 会被当成标签。
// HTML 标签和属性原样保留；已有实体不重复转义，已有公式和代码也不重写。
export function escapeMathComparisons(value) {
  const source = String(value == null ? '' : value)
  const literalDollars = spreadsheetDollarPositions(source)
  const tokens = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][\w:-]*)(?=[\s/>])(?:"[^"]*"|'[^']*'|[^'">])*>|\$\$?|\\[([]/gi
  const ignoredTags = /^(?:script|noscript|style|textarea|pre|code|option|math|svg)$/i
  const ignoredClass = /\bclass\s*=\s*(?:"[^"]*\b(?:ql-formula|katex|katex-display)\b[^"]*"|'[^']*\b(?:ql-formula|katex|katex-display)\b[^']*')/i
  let ignored = null
  let cursor = 0
  let result = ''
  let token
  while ((token = tokens.exec(source))) {
    const open = token[0]
    if (open[0] === '<') {
      const tag = token[1]?.toLowerCase()
      if (tag) {
        const closing = open.startsWith('</')
        if (ignored && tag === ignored.tag) {
          ignored.depth += closing ? -1 : /\/>$/.test(open) ? 0 : 1
          if (!ignored.depth) ignored = null
        } else if (!ignored && !closing && !/\/>$/.test(open) && (ignoredTags.test(tag) || ignoredClass.test(open))) {
          ignored = { tag, depth: 1 }
        }
      }
      continue
    }
    const start = token.index
    if (ignored || isEscaped(source, start) || (open === '$' && literalDollars.has(start))) continue
    const close = open === '\\(' ? '\\)' : open === '\\[' ? '\\]' : open
    let end = source.indexOf(close, tokens.lastIndex)
    while (end >= 0 && (isEscaped(source, end) || (open === '$' && literalDollars.has(end)))) {
      end = source.indexOf(close, end + close.length)
    }
    // 未闭合公式不能跨 HTML 容器吞掉后续段落或已有公式。
    if (end < 0 || /<\/|<!--/.test(source.slice(tokens.lastIndex, end))) continue
    const after = end + close.length
    result += source.slice(cursor, start) + source.slice(start, after).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    cursor = after
    tokens.lastIndex = after
  }
  return result + source.slice(cursor)
}
