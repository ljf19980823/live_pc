const delimiters = [['$$', '$$'], ['\\[', '\\]'], ['\\(', '\\)'], ['$', '$']]

function findClosingDelimiter(source, marker, from) {
  let index = source.indexOf(marker, from)
  while (index >= 0) {
    let cursor = index
    while (cursor > 0 && source[cursor - 1] === '\\') cursor -= 1
    if ((index - cursor) % 2 === 0) return index
    index = source.indexOf(marker, index + marker.length)
  }
  return -1
}

// 公式弹窗接收单个表达式；正文粘贴常用的外层分隔符不进入校验和保存。
export function normalizeFormulaInput(value) {
  const source = String(value == null ? '' : value)
  const trimmed = source.trim()
  const pair = delimiters.find(([open]) => trimmed.startsWith(open))
  if (!pair) return source
  const [open, close] = pair
  const end = findClosingDelimiter(trimmed, close, open.length)
  if (end !== trimmed.length - close.length || end < 0) return source
  return trimmed.slice(open.length, end).trim()
}

export function getFormulaEditorMacros(macros = {}) {
  // MathLive 0.110 直接输出 U+2209，但其 Main 字库不含该字形。
  // 用标准否定叠加方式显示，保留 \notin 源码及其他内置宏。
  return { ...macros, notin: { def: '\\not\\in', expand: false } }
}
