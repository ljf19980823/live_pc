<template>
  <div :class="{ 'quiz-formula-enabled': enableFormula }" @focusout="handleEditorFocusout">
    <input
      ref="imageInput"
      class="quill-img"
      type="file"
      accept="image/*"
      @change="handleImageSelected"
    >
    <div v-if="tableSelection && !readOnly" class="editor-table-actions" @mousedown.prevent>
      <span>第 {{ tableSelection.row }} 行，第 {{ tableSelection.column }} 列</span>
      <el-button size="mini" @click="changeTableStructure('row-before')">上方插入行</el-button>
      <el-button size="mini" @click="changeTableStructure('row-after')">下方插入行</el-button>
      <el-button size="mini" @click="changeTableStructure('column-before')">左侧插入列</el-button>
      <el-button size="mini" @click="changeTableStructure('column-after')">右侧插入列</el-button>
      <el-button size="mini" type="danger" plain @click="changeTableStructure('row-delete')">删除所在行</el-button>
      <el-button size="mini" type="danger" plain @click="changeTableStructure('column-delete')">删除所在列</el-button>
      <el-button size="mini" type="danger" plain @click="changeTableStructure('table-delete')">删除表格</el-button>
    </div>
    <div class="editor" ref="editor" :style="styles"></div>
    <p v-if="hasTable && !readOnly" class="quiz-formula-hint">直接点击单元格编辑，Tab 切换单元格；上方可插入、删除行列。</p>
    <p v-if="enableMarkdown && !trueFalseOnly && !readOnly" class="quiz-formula-hint">支持 Markdown 和 LaTeX（$...$、$$...$$、\(...\)、\[...\]），粘贴或离开编辑区后自动渲染。</p>
    <p v-if="enableFormula && !trueFalseOnly && !readOnly" class="quiz-formula-hint">点击工具栏“公式”插入，点击正文中的公式可再次编辑。</p>
    <formula-dialog
      v-if="formulaDialogMounted"
      :visible="formulaDialogVisible"
      :value="formulaValue"
      :editing="formulaEditing"
      @close="closeFormulaDialog"
      @closed="handleFormulaDialogClosed"
      @confirm="insertFormula"
    />
  </div>
</template>

<script>
import Quill from "quill"
import "quill/dist/quill.core.css"
import "quill/dist/quill.snow.css"
import "quill/dist/quill.bubble.css"
import { uploadTopicImage } from "@/api/quizBuilder"
import { registerQuizFormula } from './formula'
import { getTrueFalseAnswer } from '@/utils/trueFalseAnswer'
import { registerPreservedTable, addTableMatcher, serializeEditorHtml } from './table'
import InlineTables from './inlineTables'
import { normalizeEditorMarkdown } from './markdown'
import { renderEditorMarkdown } from '@/utils/mathText'

export default {
  name: "Editor",
  components: {
    FormulaDialog: () => import(/* webpackChunkName: "quiz-formula-editor" */ './FormulaDialog.vue')
  },
  props: {
    trueFalseOnly: {
      type: Boolean,
      default: false,
    },
    enableFormula: {
      type: Boolean,
      default: true,
    },
    enableMarkdown: {
      type: Boolean,
      default: false,
    },
    /* 编辑器的内容 */
    value: {
      type: String,
      default: "",
    },
    /* 高度 */
    height: {
      type: Number,
      default: null,
    },
    /* 最小高度 */
    minHeight: {
      type: Number,
      default: null,
    },
    /* 只读 */
    readOnly: {
      type: Boolean,
      default: false,
    },
    /* 上传文件大小限制(MB) */
    fileSize: {
      type: Number,
      default: 5,
    },
    /* 类型（base64格式、url格式） */
    type: {
      type: String,
      default: "url",
    },
    options: {
      type: Object,
      default: () => ({}),
    }
  },
  data() {
    return {
      Quill: null,
      currentValue: "",
      imageUploading: false,
      imageInsertIndex: null,
      formulaDialogVisible: false,
      formulaDialogMounted: false,
      formulaValue: '',
      formulaEditing: false,
      formulaDisplayMode: false,
      formulaRange: null,
      tableSelection: null,
      defaultOptions: {
        theme: "snow",
        bounds: document.body,
        debug: "warn",
        modules: {
          // 工具栏配置
          toolbar: [
            ["bold", "italic", "underline", "strike"],       // 加粗 斜体 下划线 删除线
            ["blockquote", "code-block"],                    // 引用  代码块
            [{ list: "ordered" }, { list: "bullet" }],       // 有序、无序列表
            [{ indent: "-1" }, { indent: "+1" }],            // 缩进
            [{ size: ["small", false, "large", "huge"] }],   // 字体大小
            [{ header: [1, 2, 3, 4, 5, 6, false] }],         // 标题
            [{ color: [] }, { background: [] }],             // 字体颜色、字体背景颜色
            [{ align: [] }],                                 // 对齐方式
            ["clean"],                                       // 清除文本格式
            ["link", "image", "video"]                       // 链接、图片、视频
          ],
        },
        placeholder: "请输入内容",
        readOnly: this.readOnly,
      },
    }
  },
  computed: {
    hasTable() {
      return /<table\b/i.test(this.currentValue)
    },
    editorConfig() {
      if (this.trueFalseOnly) {
        return {
          ...this.defaultOptions,
          readOnly: this.readOnly,
          formats: [],
          modules: { toolbar: false },
          placeholder: '请输入 A 或 B',
        }
      }
      const options = this.options || {}
      const modules = this.options.modules
        ? {
            ...this.defaultOptions.modules,
            ...options.modules,
            toolbar: options.modules.toolbar === undefined
              ? this.defaultOptions.modules.toolbar
              : options.modules.toolbar
          }
        : options.modules === false
          ? false
          : this.defaultOptions.modules

      return {
        ...this.defaultOptions,
        ...options,
        readOnly: this.readOnly,
        modules
      }
    },
    styles() {
      let style = {}
      if (this.minHeight) {
        style.minHeight = `${this.minHeight}px`
      }
      if (this.height) {
        style.height = `${this.height}px`
      }
      return style
    }
  },
  watch: {
    readOnly(value) {
      if (this.Quill) this.Quill.enable(!value)
      this._inlineTables?.refresh()
    },
    value: {
      handler(val) {
        // 用户键入触发的 input 事件回传时，跳过重置，避免 placeholder 重影
        if (this._skipWatch && !this.trueFalseOnly && val === this.currentValue) {
          this._skipWatch = false
          return
        }
        const nextValue = this.normalizeValue(val)
        if (nextValue !== this.currentValue) {
          this._inlineTables?.activate(null)
          this.currentValue = nextValue
          if (this.Quill) {
            this.setEditorHtml(this.currentValue)
            this.syncEditorValue()
          }
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.init()
  },
  beforeDestroy() {
    this._inlineTables?.destroy()
    this._inlineTables = null
    if (this.Quill) {
      this.Quill.root.removeEventListener('click', this.handleFormulaClick, true)
    }
    if (this.Quill && (this.type === 'url' || this.trueFalseOnly || this.enableMarkdown)) {
      this.Quill.root.removeEventListener('paste', this.handlePasteCapture, true)
    }
    this.Quill = null
  },
  methods: {
    init() {
      this._skipWatch = false
      const editor = this.$refs.editor
      const scrollX = window.pageXOffset
      const scrollY = window.pageYOffset
      const config = this.editorConfig
      // 关闭编辑入口时，已有公式仍需正常回显。
      registerQuizFormula()
      registerPreservedTable()
      if (!this.trueFalseOnly && Array.isArray(config.formats) && !config.formats.includes('preservedTable')) {
        config.formats = [...config.formats, 'preservedTable']
      }
      if (this.enableFormula && !this.trueFalseOnly) {
        // 仅对启用公式的实例追加工具按钮，不修改共享的工具栏数组。
        if (config.modules && Array.isArray(config.modules.toolbar)) {
          config.modules = {
            ...config.modules,
            toolbar: [...config.modules.toolbar, ['formula']]
          }
        }
      }
      this.Quill = new Quill(editor, config)
      if (!this.trueFalseOnly) {
        addTableMatcher(this.Quill)
        this._inlineTables = new InlineTables(this.Quill, {
          readOnly: () => this.readOnly,
          onSelection: selection => { this.tableSelection = selection },
          onFormula: this.openTableFormula,
          onImage: this.selectTableImage,
          onLink: this.insertTableLink,
          normalizePaste: this.enableMarkdown ? normalizeEditorMarkdown : null,
          renderPlainPaste: this.enableMarkdown ? renderEditorMarkdown : null,
        })
      }
      if (this.enableFormula && !this.trueFalseOnly) {
        const toolbar = this.Quill.getModule('toolbar')
        if (toolbar) {
          toolbar.addHandler('formula', this.openFormulaDialog)
          const button = toolbar.container.querySelector('button.ql-formula')
          if (button) {
            button.textContent = '公式'
            button.title = '插入数学公式'
            button.setAttribute('aria-label', '插入数学公式')
          }
        }
        this.Quill.root.addEventListener('click', this.handleFormulaClick, true)
      }
      // 如果设置了上传地址则自定义图片上传事件
      if (this.type == 'url') {
        const toolbar = this.Quill.getModule("toolbar")
        if (toolbar) {
          toolbar.addHandler("image", value => {
            if (!value || this.imageUploading) return
            this._imageTableBookmark = null
            const range = this.Quill.getSelection(true)
            this.imageInsertIndex = range ? range.index : Math.max(0, this.Quill.getLength() - 1)
            this.$refs.imageInput.click()
          })
        }
      }
      if (this.type === 'url' || this.trueFalseOnly || this.enableMarkdown) {
        this.Quill.root.addEventListener('paste', this.handlePasteCapture, true)
      }
      this.setEditorHtml(this.currentValue)
      this.syncEditorValue()
      this.Quill.on("text-change", (delta, oldDelta, source) => {
        if (this.trueFalseOnly) {
          const text = this.Quill.getText()
          const hasEmbed = this.Quill.getContents().ops.some(op => typeof op.insert !== 'string')
          const valid = !hasEmbed && /^[ABab]?\n$/.test(text)
          const html = valid ? this.normalizeTrueFalseHtml(text) : this.currentValue
          if (!valid || /[ab]/.test(text)) {
            const range = this.Quill.getSelection()
            this.Quill.setContents(this.Quill.clipboard.convert(html), Quill.sources.SILENT)
            if (range) {
              this.$nextTick(() => {
                if (this.Quill) this.Quill.setSelection(Math.min(range.index, this.Quill.getLength() - 1), 0, Quill.sources.SILENT)
              })
            }
          }
          this.currentValue = html
          this.$emit('input', html)
          this.$emit('on-change', { html, text: this.Quill.getText(), quill: this.Quill })
          return
        }
        const html = this.normalizeHtml(serializeEditorHtml(this.Quill.root))
        const text = this.Quill.getText()
        const quill = this.Quill
        this.currentValue = html
        this._skipWatch = true
        this.$emit("input", html)
        this.$emit("on-change", { html, text, quill })
      })
      this.Quill.on("text-change", (delta, oldDelta, source) => {
        this.$emit("on-text-change", delta, oldDelta, source)
      })
      this.Quill.on("selection-change", (range, oldRange, source) => {
        this.$emit("on-selection-change", range, oldRange, source)
      })
      this.Quill.on("editor-change", (eventName, ...args) => {
        this.$emit("on-editor-change", eventName, ...args)
      })
      this.$nextTick(() => {
        if (document.activeElement === this.Quill.root) {
          this.Quill.blur()
        }
        window.scrollTo(scrollX, scrollY)
      })
    },
    normalizeTrueFalseHtml(value) {
      const answer = getTrueFalseAnswer(value)
      return answer ? `<p>${answer}</p>` : ''
    },
    normalizeValue(value) {
      if (this.trueFalseOnly) return this.normalizeTrueFalseHtml(value)
      return this.normalizeHtml(this.enableMarkdown ? normalizeEditorMarkdown(value) : value)
    },
    syncEditorValue() {
      if (!this.trueFalseOnly && !this.enableMarkdown) return
      this.currentValue = this.normalizeHtml(serializeEditorHtml(this.Quill.root))
      if (this.value !== this.currentValue) {
        this._skipWatch = true
        this.$emit('input', this.currentValue)
      }
    },
    handleEditorFocusout(event) {
      if (this.$el.contains(event.relatedTarget) || this.formulaDialogVisible) return
      this.renderMarkdownContent()
    },
    renderMarkdownContent() {
      if (!this.enableMarkdown || this.trueFalseOnly || this.readOnly || !this.Quill) return
      this.Quill.update()
      const html = serializeEditorHtml(this.Quill.root)
      const nextHtml = normalizeEditorMarkdown(html)
      if (nextHtml === html) return
      const next = this.Quill.clipboard.convert(nextHtml)
      const diff = this.Quill.getContents().diff(next)
      if (!diff.ops.length) return
      const history = this.Quill.getModule('history')
      history?.cutoff()
      this._inlineTables?.activate(null)
      this.Quill.updateContents(diff, Quill.sources.USER)
      history?.cutoff()
    },
    normalizeHtml(value) {
      const html = value === null || value === undefined ? "" : String(value)
      const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim()
      const hasMedia = /<(img|video|iframe|embed|object|table)\b/i.test(html)
      const hasFormula = /class=["'][^"']*\bql-formula\b/i.test(html)
      return text || hasMedia || hasFormula ? html : ""
    },
    openFormulaDialog() {
      if (this.trueFalseOnly || this.readOnly || !this.Quill) return
      this._formulaTableBookmark = null
      const range = this.Quill.getSelection(true)
      this.formulaRange = range
        ? { index: range.index, length: range.length }
        : { index: Math.max(0, this.Quill.getLength() - 1), length: 0 }
      this.formulaValue = ''
      this.formulaEditing = false
      this.formulaDisplayMode = false
      this.formulaDialogMounted = true
      this.formulaDialogVisible = true
    },
    handleFormulaClick(event) {
      const node = event.target.closest('.ql-formula')
      if (!node || this.readOnly || !this.Quill) return
      event.preventDefault()
      event.stopImmediatePropagation()
      const blot = Quill.find(node)
      if (!blot) return
      this.formulaRange = { index: this.Quill.getIndex(blot), length: 1 }
      this.formulaValue = node.getAttribute('data-value') || ''
      this.formulaEditing = true
      this.formulaDisplayMode = node.getAttribute('data-display') === 'block'
      this.formulaDialogMounted = true
      this.formulaDialogVisible = true
    },
    closeFormulaDialog() {
      this.formulaDialogVisible = false
    },
    handleFormulaDialogClosed() {
      this.formulaDialogMounted = false
      const range = this.formulaRange
      this.formulaRange = null
      const tableBookmark = this._formulaTableBookmark
      this._formulaTableBookmark = null
      if (tableBookmark) {
        this.$nextTick(() => this._inlineTables?.restore(tableBookmark))
        return
      }
      // 等弹窗、遮罩和公式键盘释放后，再恢复富文本光标。
      this.$nextTick(() => {
        if (!this.Quill || !range || this.readOnly || this.formulaDialogVisible) return
        const end = Math.max(0, this.Quill.getLength() - 1)
        const index = Math.min(range.index, end)
        this.Quill.focus()
        this.Quill.setSelection(index, Math.min(range.length, end - index), Quill.sources.SILENT)
      })
    },
    insertFormula(latex) {
      const value = this.formulaDisplayMode ? { latex, displayMode: true } : latex
      if (this._formulaTableBookmark && !this.readOnly) {
        const node = Quill.import('formats/formula').create(value)
        node.setAttribute('contenteditable', 'false')
        this._inlineTables.insertNode(node, this._formulaTableBookmark)
        this._formulaTableBookmark = this._inlineTables.bookmark()
        this.closeFormulaDialog()
        return
      }
      if (!this.Quill || !this.formulaRange || this.readOnly) return
      const { index, length } = this.formulaRange
      const Delta = Quill.import('delta')
      const history = this.Quill.getModule('history')
      if (history) history.cutoff()
      // 一次 Delta 完成替换，使撤销可以完整恢复原选区或旧公式。
      this.Quill.updateContents(new Delta().retain(index).delete(length).insert({ formula: value }), Quill.sources.USER)
      if (history) history.cutoff()
      this.formulaRange = { index: index + 1, length: 0 }
      this.closeFormulaDialog()
    },
    setEditorHtml(value) {
      this._formulaTableBookmark = null
      this._imageTableBookmark = null
      const delta = this.Quill.clipboard.convert(value || "")
      this.Quill.setContents(delta, Quill.sources.SILENT)
      this._inlineTables?.refresh()
      this.Quill.blur()
    },
    changeTableStructure(action) {
      this._inlineTables?.changeStructure(action)
    },
    openTableFormula(node) {
      if (!this.enableFormula || this.readOnly) return
      this._formulaTableBookmark = this._inlineTables.bookmark()
      if (!this._formulaTableBookmark) return
      if (node) this._formulaTableBookmark.range.selectNode(node)
      this.formulaRange = null
      this.formulaValue = node ? node.getAttribute('data-value') || '' : ''
      this.formulaEditing = !!node
      this.formulaDisplayMode = node?.getAttribute('data-display') === 'block'
      this.formulaDialogMounted = true
      this.formulaDialogVisible = true
    },
    selectTableImage(file) {
      if (this.readOnly || this.imageUploading) return
      this._imageTableBookmark = this._inlineTables.bookmark()
      if (!this._imageTableBookmark) return
      if (file) this.insertImage(file)
      else this.$refs.imageInput.click()
    },
    async insertTableLink(format, bookmark) {
      if (!bookmark) return
      try {
        const { value } = await this.$prompt(format === 'video' ? '请输入视频地址' : '请输入链接地址', '插入链接', {
          inputPattern: /^(https?:\/\/|mailto:|tel:)/i,
          inputErrorMessage: '请输入有效的链接地址',
        })
        if (!this._inlineTables || this.readOnly) return
        if (format === 'video') {
          this._inlineTables.insertNode(Quill.import('formats/video').create(value), bookmark)
        } else if (bookmark.range.collapsed) {
          const link = document.createElement('a')
          link.href = value
          link.textContent = value
          this._inlineTables.insertNode(link, bookmark)
        } else this._inlineTables.command('createLink', value, bookmark)
      } catch (error) {
        // 取消链接输入时恢复原单元格选区。
        this._inlineTables?.restore(bookmark)
      }
    },
    // 上传前校验格式和大小
    handleBeforeUpload(file) {
      const isImage = file && file.type && file.type.startsWith('image/')
      if (!isImage) {
        this.$message.error("请选择图片文件")
        return false
      }
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize
        if (!isLt) {
          this.$message.error(`上传文件大小不能超过 ${this.fileSize} MB`)
          return false
        }
      }
      return true
    },
    handleImageSelected(event) {
      const input = event.target
      const file = input.files && input.files[0]
      input.value = ''
      if (file) this.insertImage(file)
    },
    insertImageUrl(imageUrl, tableBookmark = this._imageTableBookmark) {
      if (!this.Quill || !imageUrl) return
      if (tableBookmark) {
        const node = document.createElement('img')
        node.src = imageUrl
        this._inlineTables?.insertNode(node, tableBookmark)
        this._imageTableBookmark = null
        return
      }
      const range = this.Quill.getSelection()
      const index = this.imageInsertIndex !== null
        ? this.imageInsertIndex
        : range
          ? range.index
          : Math.max(0, this.Quill.getLength() - 1)
      this.Quill.insertEmbed(index, "image", imageUrl, Quill.sources.USER)
      this.Quill.setSelection(index + 1, 0, Quill.sources.SILENT)
      this.imageInsertIndex = null
    },
    // 复制粘贴图片处理
    handlePasteCapture(e) {
      if (this.trueFalseOnly) {
        e.preventDefault()
        e.stopImmediatePropagation()
        const clipboard = e.clipboardData || window.clipboardData
        const text = clipboard ? clipboard.getData('text/plain').trim().toUpperCase() : ''
        if (this.readOnly || !/^[AB]$/.test(text)) return
        const range = this.Quill.getSelection(true)
        if (!range) return
        const Delta = Quill.import('delta')
        this.Quill.updateContents(new Delta().retain(range.index).delete(range.length).insert(text), Quill.sources.USER)
        this.Quill.setSelection(Math.min(range.index + 1, this.Quill.getLength() - 1), 0, Quill.sources.SILENT)
        return
      }
      const clipboard = e.clipboardData || window.clipboardData
      if (this.readOnly) return
      if (this.enableMarkdown && clipboard && !Array.from(clipboard.items || []).some(item => item.type.startsWith('image/'))) {
        // 单元格的粘贴由 InlineTables 使用原生选区处理。
        if (this._inlineTables?.findCell(e.target)) return
        const html = clipboard.getData('text/html')
        const text = clipboard.getData('text/plain')
        if (html || text) {
          e.preventDefault()
          e.stopImmediatePropagation()
          const range = this.Quill.getSelection(true)
          if (!range) return
          const content = this.Quill.clipboard.convert(html ? normalizeEditorMarkdown(html) : renderEditorMarkdown(text))
          const Delta = Quill.import('delta')
          const history = this.Quill.getModule('history')
          history?.cutoff()
          this.Quill.updateContents(new Delta().retain(range.index).delete(range.length).concat(content), Quill.sources.USER)
          this.Quill.setSelection(Math.min(range.index + content.length(), this.Quill.getLength() - 1), 0, Quill.sources.SILENT)
          history?.cutoff()
          return
        }
      }
      if (clipboard && clipboard.items) {
        for (let i = 0; i < clipboard.items.length; i++) {
          const item = clipboard.items[i]
          if (item.type.indexOf('image') !== -1) {
            e.preventDefault()
            this._imageTableBookmark = null
            const file = item.getAsFile()
            const range = this.Quill.getSelection(true)
            this.imageInsertIndex = range ? range.index : Math.max(0, this.Quill.getLength() - 1)
            this.insertImage(file)
            break
          }
        }
      }
    },
    async insertImage(file) {
      if (this.trueFalseOnly || this.imageUploading || !this.handleBeforeUpload(file)) return
      const tableBookmark = this._imageTableBookmark
      this.imageUploading = true
      try {
        const imageUrl = this.type === 'url' ? await uploadTopicImage(file) : await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('图片读取失败'))
          reader.readAsDataURL(file)
        })
        this.insertImageUrl(imageUrl, tableBookmark)
      } catch (error) {
        this.imageInsertIndex = null
        this._imageTableBookmark = null
        this.$message.error(error.message || "图片上传失败")
      } finally {
        this.imageUploading = false
      }
    }
  }
}
</script>

<style>
.editor-table-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 8px; border: 1px solid #ccc; border-bottom: 0; background: #f5f7fa; }
.editor-table-actions > span { margin-right: 6px; font-size: 12px; color: #606266; }
.editor-table-actions .el-button { margin-left: 0; }
.ql-editor .ql-preserved-table {
  overflow-x: auto;
  white-space: normal;
}
.ql-editor .ql-preserved-table table {
  border-collapse: separate;
}
.ql-editor[contenteditable="true"] .ql-preserved-table td,
.ql-editor[contenteditable="true"] .ql-preserved-table th {
  cursor: text;
}
.ql-editor .ql-preserved-table [data-editor-table-active] { outline: 2px solid #409eff; outline-offset: -2px; }
.ql-editor[contenteditable="true"] .ql-preserved-table td:hover,
.ql-editor[contenteditable="true"] .ql-preserved-table th:hover {
  outline: 1px solid #409eff;
  outline-offset: -1px;
}
.quiz-formula-enabled .ql-toolbar button.ql-formula {
  width: auto;
  min-width: 42px;
  font-size: 13px;
}
.quiz-formula-enabled .ql-editor .ql-formula { cursor: pointer; }
.quiz-formula-enabled .ql-editor .ql-formula:hover { background: #ecf5ff; }
.ql-editor .ql-formula[data-display="block"] { display: block; height: auto; overflow-x: auto; text-align: center; }
.quiz-formula-hint { margin: 6px 0 0; color: #909399; font-size: 12px; line-height: 20px; }
.editor, .ql-toolbar {
  white-space: pre-wrap !important;
  line-height: normal !important;
}
.ql-editor:focus::before {
  display: none !important;
}
.quill-img {
  display: none;
}
.ql-snow .ql-tooltip[data-mode="link"]::before {
  content: "请输入链接地址:";
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0px;
  content: "保存";
  padding-right: 0px;
}
.ql-snow .ql-tooltip[data-mode="video"]::before {
  content: "请输入视频地址:";
}
.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: "14px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
  content: "10px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
  content: "18px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
  content: "32px";
}
.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: "文本";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
  content: "标题1";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
  content: "标题2";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
  content: "标题3";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before {
  content: "标题4";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before {
  content: "标题5";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="6"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="6"]::before {
  content: "标题6";
}
.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: "标准字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
  content: "衬线字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
  content: "等宽字体";
}

.ql-snow .ql-editor img{
  zoom:0.3!important
}
</style>
