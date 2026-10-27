import katex from 'katex'

// 只提升默认分数的排版层级；显式的 \tfrac、\textstyle 等仍由原公式控制。
const defaultFraction = /\\(?:frac|binom|genfrac|over|atop|choose)\b/

export function needsReadableFraction(latex, displayMode = false) {
  return !displayMode && defaultFraction.test(latex)
}

export function renderFormulaHtml(latex, options = {}) {
  if (!needsReadableFraction(latex, options.displayMode)) return katex.renderToString(latex, options)

  // 使用数学排版规则提升主分数，嵌套分数及上下标仍会自然缩小。
  // displayMode 保持 false，公式继续随文字排列，不增加块级换行。
  const html = katex.renderToString(`\\displaystyle ${latex}`, options)
  if (html.includes('class="katex-error"')) return katex.renderToString(latex, options)

  // annotation 是再次编辑和导出的源码，不能保存展示时添加的指令。
  const escaped = latex.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;'
  })[char])
  return html
    .replace(/(<annotation encoding="application\/x-tex">)[\s\S]*?(<\/annotation>)/,
      (match, open, close) => open + escaped + close)
    .replace('<span class="katex">', '<span class="katex" data-formula-layout="readable">')
}
