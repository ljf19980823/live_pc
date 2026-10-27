<template>
  <el-dialog
    :title="editing ? '编辑公式' : '插入公式'"
    :visible="visible"
    append-to-body
    width="720px"
    top="8vh"
    custom-class="quiz-formula-dialog"
    :close-on-click-modal="false"
    @open="mountMathfield"
    @close="handleClose"
    @closed="handleClosed"
  >
    <div class="formula-templates" aria-label="常用公式模板">
      <button v-for="item in templates" :key="item.label" type="button" @mousedown.prevent @click="insertTemplate(item.latex)">
        {{ item.label }}
      </button>
    </div>
    <div ref="mathfieldHost" class="formula-mathfield-host"></div>
    <p class="formula-tip">点击模板或直接输入公式，按 Tab 切换填空位置。</p>
    <el-button type="text" @click="showLatex = !showLatex">{{ showLatex ? '收起' : '展开' }} LaTeX 输入</el-button>
    <el-input v-if="showLatex" :value="latex" type="textarea" :rows="3" placeholder="输入或粘贴 LaTeX 公式" @input="updateLatex" />
    <p v-if="error" class="formula-error" role="alert">{{ error }}</p>
    <div ref="keyboardHost" class="formula-keyboard-host"></div>
    <span slot="footer">
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="confirm">{{ editing ? '保存公式' : '插入公式' }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { MathfieldElement, initVirtualKeyboardInCurrentBrowsingContext } from 'mathlive'
import 'mathlive/fonts.css'
import katex from 'katex'
import { normalizeFormulaInput, getFormulaEditorMacros } from '@/utils/formulaInput'

// 字体由 webpack 随项目打包，不依赖外部 CDN。
MathfieldElement.fontsDirectory = null
MathfieldElement.soundsDirectory = null
MathfieldElement.locale = 'zh-cn'
// 课后测也会嵌入外层系统，在当前页面创建键盘，避免依赖父页面安装 MathLive。
initVirtualKeyboardInCurrentBrowsingContext()

export default {
  name: 'FormulaDialog',
  props: {
    visible: Boolean,
    editing: Boolean,
    value: { type: String, default: '' }
  },
  data() {
    return {
      latex: '',
      error: '',
      showLatex: true,  // 默认展开LaTeX输入框，方便用户直接粘贴公式
      templates: [
        { label: '分数', latex: '\\frac{#?}{#?}' },
        { label: '平方', latex: '#@^{2}' },
        { label: '上标', latex: '#@^{#?}' },
        { label: '下标', latex: '#@_{#?}' },
        { label: '根号', latex: '\\sqrt{#?}' },
        { label: '括号', latex: '\\left(#?\\right)' },
        { label: '求和', latex: '\\sum_{#?}^{#?}#?' },
        { label: '积分', latex: '\\int_{#?}^{#?}#?\\,\\mathrm{d}x' },
        { label: '极限', latex: '\\lim_{x\\to #?}#?' },
        { label: '矩阵', latex: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}' }
      ]
    }
  },
  mounted() {
    if (this.visible) this.mountMathfield()
  },
  beforeDestroy() {
    this.destroyMathfield()
  },
  methods: {
    mountMathfield() {
      this.$nextTick(() => {
        if (!this.visible || !this.$refs.mathfieldHost || this.mathfield) return
        this.latex = normalizeFormulaInput(this.value)
        this.error = ''
        const field = new MathfieldElement()
        field.setAttribute('aria-label', '数学公式编辑区')
        field.mathVirtualKeyboardPolicy = 'manual'
        field.addEventListener('input', this.handleInput)
        this.mathfield = field
        this.$refs.mathfieldHost.appendChild(field)
        // MathLive 的默认宏只能在挂载后读取；先保留默认宏，再设置公式。
        field.macros = getFormulaEditorMacros(field.macros)
        field.value = this.latex
        const keyboard = window.mathVirtualKeyboard
        this.previousKeyboardContainer = keyboard.container
        this.previousKeyboardLayouts = keyboard.layouts
        keyboard.container = this.$refs.keyboardHost
        keyboard.layouts = ['numeric', 'symbols', 'alphabetic', 'greek']
        keyboard.addEventListener('geometrychange', this.resizeKeyboard)
        field.focus()
        keyboard.show()
        this.resizeKeyboard()
      })
    },
    destroyMathfield() {
      if (!this.mathfield) return
      this.mathfield.blur()
      const keyboard = window.mathVirtualKeyboard
      keyboard.removeEventListener('geometrychange', this.resizeKeyboard)
      keyboard.hide()
      keyboard.container = this.previousKeyboardContainer || document.body
      keyboard.layouts = this.previousKeyboardLayouts
      this.mathfield.removeEventListener('input', this.handleInput)
      this.mathfield.remove()
      this.mathfield = null
    },
    handleClose() {
      this.destroyMathfield()
      this.$emit('close')
    },
    handleClosed() {
      this.destroyMathfield()
      this.$emit('closed')
    },
    resizeKeyboard() {
      if (this.$refs.keyboardHost) {
        this.$refs.keyboardHost.style.height = `${window.mathVirtualKeyboard.boundingRect.height}px`
      }
    },
    handleInput() {
      this.latex = normalizeFormulaInput(this.mathfield.value)
      this.error = ''
    },
    insertTemplate(latex) {
      if (!this.mathfield) return
      this.mathfield.focus()
      this.mathfield.insert(latex, { selectionMode: 'placeholder' })
      this.handleInput()
    },
    updateLatex(value) {
      this.latex = normalizeFormulaInput(value)
      this.error = ''
      if (this.mathfield) this.mathfield.value = this.latex
    },
    confirm() {
      const latex = normalizeFormulaInput(this.latex).trim()
      if (!latex) {
        this.error = '请先输入公式'
        return
      }
      if (/\\placeholder\b/.test(latex)) {
        this.error = '请先填写公式中的空白位置'
        return
      }
      try {
        katex.renderToString(latex, { throwOnError: true, trust: false, strict: 'ignore' })
      } catch (error) {
        this.error = '公式格式有误或包含暂不支持的命令，请检查后重试'
        return
      }
      this.$emit('confirm', latex)
    }
  }
}
</script>

<style>
.quiz-formula-dialog { max-width: calc(100vw - 32px); }
.quiz-formula-dialog .el-dialog__body { padding: 16px 24px; max-height: 68vh; overflow-y: auto; }
.quiz-formula-dialog .formula-templates { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.quiz-formula-dialog .formula-templates button { padding: 7px 12px; border: 1px solid #dbe2ec; border-radius: 5px; background: #f7f9fc; color: #394354; cursor: pointer; }
.quiz-formula-dialog .formula-templates button:hover { border-color: #409eff; color: #409eff; }
.quiz-formula-dialog math-field { display: block; width: 100%; min-height: 84px; padding: 14px; box-sizing: border-box; border: 1px solid #dbe2ec; border-radius: 6px; font-size: 26px; --primary: #409eff; }
.quiz-formula-dialog math-field:focus-within { outline: 2px solid #d9ecff; border-color: #409eff; }
.quiz-formula-dialog .formula-tip { margin: 10px 0 0; color: #909399; font-size: 12px; line-height: 20px; }
.quiz-formula-dialog .formula-error { color: #f56c6c; margin: 8px 0; }
.quiz-formula-dialog .formula-keyboard-host { position: relative; margin-top: 12px; }
</style>
