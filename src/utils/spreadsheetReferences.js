function isEscaped(text, index) {
  let cursor = index
  while (cursor > 0 && text[cursor - 1] === '\\') cursor -= 1
  return (index - cursor) % 2 === 1
}

// A1 引用中的 $ 是行/列锁定标记，不能当成 LaTeX 分隔符。
// 同时覆盖单元格、整行/整列区域以及中文紧邻的引用。
export function findSpreadsheetReferences(text) {
  const references = []
  const pattern = /\$?[a-z]{1,3}\$?\d+|\$?[a-z]{1,3}\s*:\s*\$?[a-z]{1,3}|\$?\d+\s*:\s*\$?\d+/gi
  for (const match of text.matchAll(pattern)) {
    const start = match.index
    const end = start + match[0].length
    if (!match[0].includes('$') || /[a-z0-9_$]/i.test(text[start - 1] || '') ||
        /[a-z0-9_$]/i.test(text[end] || '')) continue
    references.push({ start, end })
  }

  const dollars = new Set()
  references.forEach(({ start, end }) => {
    for (let index = start; index < end; index += 1) if (text[index] === '$') dollars.add(index)
  })
  // $A1+B2$ 是完整的数学表达式；$A1+$B2 则是两个单元格引用。
  return references.filter(({ start, end }) => {
    if (text[start] !== '$' || text.slice(start + 1, end).includes('$')) return true
    let close = text.indexOf('$', end)
    while (close >= 0 && isEscaped(text, close)) close = text.indexOf('$', close + 1)
    return close < 0 || dollars.has(close) || /\s/.test(text[close - 1]) ||
      /[a-z0-9_$]/i.test(text[close + 1] || '') || /[\r\n]/.test(text.slice(end, close))
  })
}

export function spreadsheetDollarPositions(text) {
  const positions = new Set()
  findSpreadsheetReferences(text).forEach(({ start, end }) => {
    for (let index = start; index < end; index += 1) if (text[index] === '$') positions.add(index)
  })
  return positions
}
