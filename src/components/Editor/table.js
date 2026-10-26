import Quill from 'quill'
import { normalizeInlineWidths } from '@/utils/richTextHtml'

const BlockEmbed = Quill.import('blots/block/embed')
const Delta = Quill.import('delta')
const TABLE_CLASS = 'ql-preserved-table'

// 表格作为一个完整块进入 Delta，避免 Quill 1 将 tr/td 展平为段落。
// 单元格在原位置编辑，HTML 的变化由 Quill 的 MutationObserver 记录到历史。
export function normalizeTableHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html')
  const table = doc.querySelector('table')
  if (!table) return ''
  table.querySelectorAll('script,style,iframe:not(.ql-video),object,embed,link,meta,base,form,input,button,textarea,select').forEach(node => node.remove())
  ;[table, ...table.querySelectorAll('*')].forEach(node => {
    Array.from(node.attributes).forEach(({ name, value }) => {
      if (/^on/i.test(name) || /^(contenteditable|srcdoc|autofocus|data-editor-table-cell|data-editor-table-active)$/i.test(name) ||
          (/^(href|src|xlink:href|action|formaction)$/i.test(name) && /^\s*(javascript|vbscript|data:text\/html)\s*:/i.test(value.replace(/[\u0000-\u0020]/g, '')))) {
        node.removeAttribute(name)
      }
    })
    if (node.hasAttribute('style')) {
      node.setAttribute('style', normalizeInlineWidths(node.getAttribute('style')))
    }
    // 单元格编辑后的对齐应随 HTML 保存，列表展示不依赖 .ql-editor。
    const align = ['center', 'right', 'justify'].find(value => node.classList.contains(`ql-align-${value}`))
    if (align) node.style.textAlign = align
  })
  return table.outerHTML
}

class PreservedTable extends BlockEmbed {
  static create(value) {
    const node = super.create()
    node.setAttribute('contenteditable', 'false')
    node.innerHTML = normalizeTableHtml(value)
    return node
  }

  static value(node) {
    const table = node.querySelector('table')
    return table ? normalizeTableHtml(table.outerHTML) : ''
  }
}
PreservedTable.blotName = 'preservedTable'
PreservedTable.tagName = 'DIV'
PreservedTable.className = TABLE_CLASS

export function registerPreservedTable() {
  Quill.register(PreservedTable, true)
}

export function addTableMatcher(quill) {
  quill.clipboard.addMatcher('TABLE', node => new Delta().insert({
    preservedTable: normalizeTableHtml(node.outerHTML)
  }))
}

export function serializeEditorHtml(root) {
  const copy = root.cloneNode(true)
  copy.querySelectorAll(`.${TABLE_CLASS}`).forEach(node => {
    const table = node.querySelector('table')
    if (table) {
      const clean = new DOMParser().parseFromString(normalizeTableHtml(table.outerHTML), 'text/html').querySelector('table')
      node.replaceWith(clean)
    }
    else node.remove()
  })
  return copy.innerHTML
}
