// 兼容已有富文本答案，但不接受多字符、图片或公式作为判断题答案。
export function getTrueFalseAnswer(value) {
  const container = document.createElement('div')
  container.innerHTML = String(value || '')
  if (container.querySelector('img, video, audio, iframe, embed, object, svg, canvas, .ql-formula')) return ''
  const answer = container.textContent.trim().toUpperCase()
  return /^[AB]$/.test(answer) ? answer : ''
}
