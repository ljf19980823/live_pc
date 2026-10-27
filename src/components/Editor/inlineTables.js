import Quill from 'quill'
import { normalizeTableHtml } from './table'
import { changeTableStructure, getTableGrid } from './tableStructure'

// Quill 1 没有单元格光标模型：隔离单元格的原生编辑事件，正文仍交给 Quill。
// 表格 DOM 始终留在原处，输入期间不替换节点，避免光标跳动和中文组词中断。
export default class InlineTables {
  constructor(quill, options) {
    this.quill = quill
    this.options = options
    this.root = quill.root
    this.cell = null
    this.range = null
    this.listeners = []
    this.toolbar = quill.getModule('toolbar')?.container
    const selection = quill.selection
    this.normalizeNative = selection.normalizeNative
    selection.normalizeNative = range => {
      if (this.findCell(range.startContainer)) return null
      return this.normalizeNative.call(selection, range)
    }
    this.listen(this.root, 'focusin', event => this.activate(this.findCell(event.target)))
    this.listen(this.root, 'pointerdown', event => {
      if (!this.findCell(event.target)) this.activate(null)
    })
    this.listen(document, 'selectionchange', () => this.rememberSelection())
    this.listen(this.root, 'keydown', event => this.handleKeydown(event))
    this.listen(this.root, 'beforeinput', event => this.handleBeforeInput(event))
    this.listen(this.root, 'input', event => {
      if (this.findCell(event.target)) this.quill.update(Quill.sources.USER)
    })
    this.listen(this.root, 'paste', event => this.handlePaste(event))
    this.listen(this.root, 'drop', event => {
      // 防止拖拽跨单元格改变原生 table 的结构；文本、图片可粘贴插入。
      if (this.findCell(event.target)) event.preventDefault()
    })
    this.listen(this.root, 'click', event => {
      const cell = this.findCell(event.target)
      if (!cell) return
      this.activate(cell)
      const formula = event.target.closest('.ql-formula')
      if (formula && this.options.onFormula) {
        event.preventDefault()
        event.stopImmediatePropagation()
        const range = document.createRange()
        range.selectNode(formula)
        this.range = range
        this.options.onFormula(formula)
      } else if (event.target.closest('a')) event.preventDefault()
    })
    if (this.toolbar) {
      this.listen(this.toolbar, 'mousedown', event => {
        if (!this.active) return
        this.rememberSelection()
        if (event.target.closest('button')) event.preventDefault()
      })
      this.listen(this.toolbar, 'click', event => this.handleToolbar(event))
      this.listen(this.toolbar, 'change', event => this.handleToolbar(event))
    }
    this.onChange = () => this.refresh()
    quill.on('text-change', this.onChange)
    this.refresh()
  }

  listen(node, type, handler) {
    node.addEventListener(type, handler, true)
    this.listeners.push(() => node.removeEventListener(type, handler, true))
  }

  get active() {
    return this.cell && this.root.contains(this.cell) && !this.options.readOnly()
  }

  findCell(node) {
    const element = node && (node.nodeType === 1 ? node : node.parentElement)
    const cell = element?.closest('td, th')
    return cell && cell.closest('.ql-preserved-table') && this.root.contains(cell) ? cell : null
  }

  refresh() {
    const editable = !this.options.readOnly()
    this.root.querySelectorAll('.ql-preserved-table td, .ql-preserved-table th').forEach(cell => {
      const value = String(editable)
      if (cell.getAttribute('contenteditable') !== value) cell.setAttribute('contenteditable', value)
    })
    this.root.querySelectorAll('.ql-preserved-table .ql-formula').forEach(node => {
      if (node.getAttribute('contenteditable') !== 'false') node.setAttribute('contenteditable', 'false')
    })
    if (!this.active) this.activate(null)
  }

  activate(cell) {
    if (this.options.readOnly()) cell = null
    if (cell !== this.cell) {
      this.cell?.removeAttribute('data-editor-table-active')
      this.cell = cell
      this.range = null
      this.quill.getModule('history')?.cutoff()
    }
    if (cell && !cell.hasAttribute('data-editor-table-active')) cell.setAttribute('data-editor-table-active', '')
    const entry = cell && getTableGrid(cell.closest('table')).cells.find(entry => entry.cell === cell)
    this.options.onSelection(entry ? { row: entry.row + 1, column: entry.col + 1 } : null)
  }

  rememberSelection() {
    const selection = document.getSelection()
    if (!selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    const cell = this.findCell(range.startContainer)
    if (cell && cell === this.findCell(range.endContainer)) {
      this.activate(cell)
      this.range = range.cloneRange()
      this.updateToolbar()
    } else if (this.root.contains(range.startContainer) && !cell) this.activate(null)
  }

  updateToolbar() {
    if (!this.toolbar || !this.active) return
    const commands = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough' }
    Object.entries(commands).forEach(([format, command]) => {
      const button = this.toolbar.querySelector(`button.ql-${format}`)
      if (button) button.classList.toggle('ql-active', document.queryCommandState(command))
    })
  }

  bookmark() {
    this.rememberSelection()
    return this.active && this.range ? { cell: this.cell, range: this.range.cloneRange() } : null
  }

  restore(bookmark = this.bookmark()) {
    if (!bookmark || this.options.readOnly() || !this.root.contains(bookmark.cell) ||
        !bookmark.cell.contains(bookmark.range.startContainer) || !bookmark.cell.contains(bookmark.range.endContainer)) return false
    this.activate(bookmark.cell)
    bookmark.cell.focus({ preventScroll: true })
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(bookmark.range)
    this.range = bookmark.range.cloneRange()
    return true
  }

  focusCell(cell, atEnd = false) {
    if (!cell) return
    const range = document.createRange()
    range.selectNodeContents(cell)
    range.collapse(!atEnd)
    this.restore({ cell, range })
  }

  command(command, value = null, bookmark = this.bookmark()) {
    if (!this.restore(bookmark)) return
    document.execCommand(command, false, value)
    this.quill.update(Quill.sources.USER)
    this.rememberSelection()
  }

  insertNode(node, bookmark) {
    if (!this.restore(bookmark)) return
    this.quill.update(Quill.sources.USER)
    const history = this.quill.getModule('history')
    history?.cutoff()
    const range = document.getSelection().getRangeAt(0)
    range.deleteContents()
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    this.range = range.cloneRange()
    this.quill.update(Quill.sources.USER)
    history?.cutoff()
  }

  changeStructure(action) {
    if (!this.active) return
    this.quill.update(Quill.sources.USER)
    const history = this.quill.getModule('history')
    history?.cutoff()
    const table = this.cell.closest('table')
    const wrapper = table.closest('.ql-preserved-table')
    const next = action === 'table-delete' ? null : changeTableStructure(table, this.cell, action)
    if (next) {
      this.refresh()
      this.focusCell(next)
    } else {
      this.activate(null)
      if (table.parentElement === wrapper) {
        const index = this.quill.getIndex(Quill.find(wrapper))
        this.quill.deleteText(index, 1, Quill.sources.USER)
        this.quill.setSelection(Math.min(index, this.quill.getLength() - 1), 0, Quill.sources.SILENT)
      } else table.remove()
    }
    this.quill.update(Quill.sources.USER)
    history?.cutoff()
  }

  handleKeydown(event) {
    const cell = this.findCell(event.target)
    if (!cell || this.options.readOnly()) return
    this.activate(cell)
    // Quill 将整张表格当成一个块，不能让其处理格内退格、回车等按键。
    event.stopImmediatePropagation()
    if (event.isComposing || event.keyCode === 229) return
    const shortKey = event.ctrlKey || event.metaKey
    if (shortKey && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.preventDefault()
      this.undo(event.key.toLowerCase() === 'y' || event.shiftKey)
    } else if (shortKey && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      const range = document.createRange()
      range.selectNodeContents(cell)
      this.restore({ cell, range })
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const cells = getTableGrid(cell.closest('table')).cells.map(entry => entry.cell)
      const index = cells.indexOf(cell) + (event.shiftKey ? -1 : 1)
      if (cells[index]) this.focusCell(cells[index])
      else if (!event.shiftKey) this.changeStructure('row-after')
      else {
        const index = this.quill.getIndex(Quill.find(cell.closest('.ql-preserved-table')))
        this.activate(null)
        this.quill.setSelection(Math.max(0, index - 1), 0, Quill.sources.SILENT)
      }
    }
  }

  handleBeforeInput(event) {
    const cell = this.findCell(event.target)
    if (!cell) return
    if (this.options.readOnly()) { event.preventDefault(); return }
    if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
      event.preventDefault()
      this.undo(event.inputType === 'historyRedo')
      return
    }
    const selection = document.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      if (!cell.contains(range.startContainer) || !cell.contains(range.endContainer)) event.preventDefault()
    }
  }

  undo(redo) {
    if (!this.active) return
    const wrapper = this.cell.closest('.ql-preserved-table')
    const index = this.quill.getIndex(Quill.find(wrapper))
    const cellIndex = Array.from(wrapper.querySelectorAll('td, th')).indexOf(this.cell)
    this.quill.update(Quill.sources.USER)
    this.quill.getModule('history')?.[redo ? 'redo' : 'undo']()
    this.refresh()
    const node = this.quill.getLeaf(Math.min(index, this.quill.getLength() - 1))[0]?.domNode
    if (node?.classList?.contains('ql-preserved-table')) {
      const cells = node.querySelectorAll('td, th')
      this.focusCell(cells[Math.min(cellIndex, cells.length - 1)], true)
    }
  }

  handlePaste(event) {
    if (!this.findCell(event.target)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (this.options.readOnly()) return
    const clipboard = event.clipboardData
    const image = Array.from(clipboard?.items || []).find(item => item.type.startsWith('image/'))
    if (image) { this.options.onImage(image.getAsFile()); return }
    const sourceHtml = clipboard?.getData('text/html')
    const text = clipboard?.getData('text/plain') || ''
    const html = sourceHtml
      ? (this.options.normalizePaste?.(sourceHtml) || sourceHtml)
      : this.options.renderPlainPaste?.(text)
    if (html) {
      const safe = normalizeTableHtml(`<table><tbody><tr><td>${html}</td></tr></tbody></table>`)
      const doc = new DOMParser().parseFromString(safe, 'text/html')
      this.command('insertHTML', doc.querySelector('td')?.innerHTML || '')
    } else this.command('insertText', text)
  }

  handleToolbar(event) {
    if (!this.active) return
    const input = event.type === 'change' ? event.target.closest('select') : event.target.closest('button')
    if (!input) return
    const format = Array.from(input.classList).find(name => name.startsWith('ql-'))?.slice(3)
    if (!format) return
    event.preventDefault()
    event.stopImmediatePropagation()
    const value = input.value
    const bookmark = this.bookmark()
    const commands = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough', color: 'foreColor', background: 'hiliteColor', clean: 'removeFormat' }
    if (commands[format]) this.command(commands[format], value || ({ color: '#000000', background: 'transparent' }[format] || null), bookmark)
    else if (format === 'align') {
      // 去掉导入时的 Quill 对齐 class，以免覆盖新的原生对齐样式。
      this.cell.querySelectorAll('[class*="ql-align-"]').forEach(node => {
        ;['center', 'right', 'justify'].forEach(align => node.classList.remove(`ql-align-${align}`))
      })
      this.command({ center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' }[value] || 'justifyLeft', null, bookmark)
    } else if (format === 'list') this.command(value === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList', null, bookmark)
    else if (format === 'indent') this.command(value === '-1' ? 'outdent' : 'indent', null, bookmark)
    else if (format === 'header') this.command('formatBlock', value ? `h${value}` : 'p', bookmark)
    else if (format === 'blockquote' || format === 'code-block') this.command('formatBlock', format === 'blockquote' ? 'blockquote' : 'pre', bookmark)
    else if (format === 'size') this.command('fontSize', { small: '1', large: '4', huge: '6' }[value] || '3', bookmark)
    else if (format === 'font') this.command('fontName', { serif: 'serif', monospace: 'monospace' }[value] || 'sans-serif', bookmark)
    else if (format === 'formula') this.options.onFormula?.()
    else if (format === 'image') this.options.onImage()
    else if (format === 'link' || format === 'video') this.options.onLink(format, bookmark)
  }

  destroy() {
    this.listeners.forEach(remove => remove())
    this.quill.off('text-change', this.onChange)
    this.quill.selection.normalizeNative = this.normalizeNative
    this.activate(null)
  }
}
