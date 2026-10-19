<template>
  <div class="export-mask" :style="{ zIndex: dialogZIndex }" @click.self="cancel">
    <section ref="dialog" class="export-dialog" :class="{ 'configurable-export': configurable }" role="dialog" aria-modal="true" aria-labelledby="export-title" tabindex="-1" @keydown.esc.stop.prevent="cancel">
      <div v-if="configurable" class="export-header">
        <div class="export-art"><img :src="fileType === 'PDF' ? pdfIcon : wordIcon" :alt="fileType === 'PDF' ? 'PDF' : 'Word'"></div>
        <div>
          <h2 id="export-title">导出{{ fileType === 'PDF' ? 'PDF' : 'Word' }}</h2>
          <p class="question-total">已选择 {{ questionCount }} 道题 · {{ fileType === 'PDF' ? 'PDF' : 'Word（DOCX）' }}</p>
        </div>
      </div>
      <template v-else>
        <div class="export-art"><img :src="fileType === 'PDF' ? pdfIcon : wordIcon" :alt="fileType === 'PDF' ? 'PDF' : 'Word'"></div>
        <h2 id="export-title">导出{{ fileType === 'PDF' ? 'PDF' : 'Word' }}</h2>
        <p v-if="fileType === 'DOCX'" class="question-total">共{{ questionCount }}题</p>
      </template>
      <label for="export-file-name">{{ configurable ? '文件名' : '文件名' }}</label>
      <input id="export-file-name" v-model="fileTitle" type="text" :maxlength="configurable ? 30 : 210" autocomplete="off" :disabled="submitting || Boolean(shareFile)" @input="rememberSettings">
      <template v-if="configurable">
        <div class="export-switches">
          <div v-for="item in exportSwitches" :key="item.key" class="export-switch-row">
            <span>{{ item.label }}</span>
            <el-switch v-model="exportOptions[item.key]" :aria-label="item.label" active-color="#1F7CFF" :disabled="submitting || Boolean(shareFile)" @change="rememberSettings" />
          </div>
        </div>
        <label for="export-question-prefix">题目来源</label>
        <input id="export-question-prefix" v-model="exportOptions.questionPrefix" type="text" maxlength="30" placeholder="统一题目前缀（非必填）" :disabled="submitting || Boolean(shareFile)" @input="rememberSettings">
      </template>
      <p v-if="submitting" class="export-message" role="status">正在生成并准备文件，请稍候...</p>
      <p v-else-if="error && !configurable" class="export-message export-error" role="alert">{{ error }}</p>
      <p v-else-if="linkCopied" class="export-message" role="status">文件链接已复制。</p>
      <p v-else-if="shareFile" class="export-message" role="status">文件已生成，请点击“存到文件”完成保存。</p>
      <div class="export-actions">
        <button type="button" class="cancel-button" @click="cancel">取消</button>
        <button v-if="!shareFile" type="button" class="confirm-button" :disabled="submitting" @click="submit">{{ submitting ? '导出中...' : '确定' }}</button>
        <button v-else type="button" class="confirm-button" @click="savePrepared">存到文件</button>
      </div>
      <button v-if="shareFile" type="button" class="open-link" @click="copyFileLink">复制文件链接</button>
    </section>
  </div>
</template>

<script>
import { exportTeacherChatPaper } from '@/api/aiPaper'
import { PopupManager } from 'element-ui/lib/utils/popup'
import { buildExportPayload, buildQuestionListExportPayload } from '@/utils/aiPaperExport'
import { renderExportRichText } from '@/utils/mathText'
import { downloadExportedFile, sharePreparedExportFile } from '@/utils/downloadExportedFile'
import wordIcon from '@/assets/images/ai_question/file_word.png'
import pdfIcon from '@/assets/images/ai_question/file_pdf.png'

export default {
  name: 'AiPaperExportDialog',
  props: {
    paper: { type: Object, default: () => ({}) },
    config: { type: Object, default: () => ({}) },
    questions: { type: Array, default: null },
    configurable: { type: Boolean, default: false },
    initialSettings: { type: Object, default: null },
    fileType: { type: String, required: true },
    stageName: { type: String, default: '' },
    subjectName: { type: String, default: '' },
    difficultyName: { type: String, default: '' }
  },
  data() {
    // 弹窗及后续 Element Message 使用同一层级管理，避免 warning 被遮罩遮住。
    PopupManager.zIndex = Math.max(PopupManager.zIndex, 3500)
    return {
      dialogZIndex: PopupManager.nextZIndex(),
      wordIcon, pdfIcon, fileTitle: this.configurable
        ? (this.initialSettings && typeof this.initialSettings.title === 'string' ? this.initialSettings.title : `${Array.from(this.subjectName || 'AI 生成').slice(0, 28).join('')}试卷`)
        : this.paper.title || 'AI 生成试卷',
      exportOptions: { showAnswer: true, showAnalysis: true, showKnowledge: true, showDifficulty: true, separateAnswerSection: true, questionPrefix: '', ...(this.configurable && this.initialSettings && this.initialSettings.options || {}) },
      exportSwitches: [
        { key: 'showAnswer', label: '显示答案' },
        { key: 'showAnalysis', label: '显示解析' },
        { key: 'showKnowledge', label: '显示知识点' },
        { key: 'showDifficulty', label: '显示难易程度' },
        { key: 'separateAnswerSection', label: '答案解析集中放在文末' }
      ],
      submitting: false, error: '', abortController: null,
      shareFile: null, exportedUrl: '', linkCopied: false
    }
  },
  computed: {
    questionCount() {
      if (this.questions !== null) return this.questions.length
      return (this.paper.groups || []).reduce((sum, group) => sum + (group.questions || []).length, 0)
    }
  },
  mounted() { this.$nextTick(() => this.$refs.dialog && this.$refs.dialog.focus()) },
  beforeDestroy() { if (this.abortController) this.abortController.abort() },
  methods: {
    rememberSettings() {
      this.error = ''
      if (this.configurable) this.$emit('settings-change', { title: this.fileTitle, options: { ...this.exportOptions } })
    },
    close() {
      this.rememberSettings()
      this.$emit('close')
    },
    reportError(message) {
      if (this.configurable) {
        this.error = ''
        this.$message.warning(message)
      } else {
        this.error = message
      }
    },
    cancel() {
      if (this.abortController) this.abortController.abort()
      this.close()
    },
    async submit() {
      if (this.submitting) return
      let payload
      try {
        payload = this.questions !== null ? buildQuestionListExportPayload({
          questions: this.questions, options: this.exportOptions, fileType: this.fileType, title: this.fileTitle
        }) : buildExportPayload({
          paper: this.paper, config: this.config, fileType: this.fileType, title: this.fileTitle,
          stageName: this.stageName, subjectName: this.subjectName, difficultyName: this.difficultyName,
          render: renderExportRichText
        })
      } catch (error) { this.reportError(error.message); return }
      this.error = ''
      this.submitting = true
      const controller = new AbortController()
      this.abortController = controller
      try {
        const result = await exportTeacherChatPaper(payload, { signal: controller.signal })
        if (controller.signal.aborted) return
        if (!result || !result.url) throw new Error('导出接口未返回文件地址，请重试')
        this.exportedUrl = result.url
        const fileName = `${payload.options.title}.${this.fileType === 'PDF' ? 'pdf' : 'docx'}`
        const delivery = await downloadExportedFile(result.url, fileName, { fileType: this.fileType, signal: controller.signal })
        if (controller.signal.aborted) return
        if (delivery.mode === 'mobile-share-ready') {
          this.shareFile = delivery.file
        } else {
          this.close()
        }
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') this.reportError(error.message || '导出失败，请重试')
      } finally {
        this.submitting = false
        this.abortController = null
      }
    },
    async savePrepared() {
      try {
        await sharePreparedExportFile(this.shareFile)
        this.close()
      } catch (error) {
        if (error.name !== 'AbortError') this.reportError('当前设备未能打开系统分享，请复制文件链接保存')
      }
    },
    async copyFileLink() {
      try {
        if (!this.exportedUrl) throw new Error('文件链接不存在')
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(this.exportedUrl)
          } catch (error) {
            this.copyFileLinkFallback()
          }
        } else {
          this.copyFileLinkFallback()
        }
        this.error = ''
        this.linkCopied = true
      } catch (error) {
        this.reportError('复制失败，请稍后重试')
      }
    },
    copyFileLinkFallback() {
      const input = document.createElement('textarea')
      input.value = this.exportedUrl
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      try {
        input.select()
        input.setSelectionRange(0, input.value.length)
        if (!document.execCommand('copy')) throw new Error('复制失败')
      } finally {
        input.remove()
      }
    }
  }
}
</script>

<style scoped>
.export-mask { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; box-sizing: border-box; padding: 24px; background: rgba(32, 32, 39, .52); }
.export-dialog { box-sizing: border-box; width: min(100%, 400px); padding: 20px 25px 24px; border-radius: 18px; background: #fff; color: #292d3c; outline: none; }
.export-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.export-switches { margin-top: 20px; padding: 8px 14px; border: 1px solid #edf0f5; border-radius: 10px; background: #f8f9fc; }
.export-switch-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 38px; font-size: 13px; }
.export-switch-row .el-switch { flex-shrink: 0; }
.export-art { height: 126px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 10% 0, #f2f8ff 0 24%, transparent 25%), radial-gradient(circle at 90% 0, #f2f8ff 0 24%, transparent 25%); }
.export-art img { width: 100px; height: auto; object-fit: contain; }
.export-dialog h2 { margin: 3px 0 0; text-align: center; font-size: 24px; }
.question-total { margin: 2px 0 12px; color: #aaa; text-align: center; }
.export-dialog label { display: block; margin: 14px 0 10px; font-size: 17px; }
.export-dialog input { box-sizing: border-box; width: 100%; height: 48px; padding: 0 18px; border: 1px solid #BBD8FF !important; border-radius: 26px; outline-color: #1F7CFF; background: #fff !important; color: inherit; font: inherit; font-size: 16px; }
.export-message { min-height: 20px; margin: 9px 0 0; color: #777c91; font-size: 12px; }
.export-error { color: #d14256; }
.export-actions { display: flex; gap: 12px; margin-top: 20px; }
.export-actions button { flex: 1; height: 44px; border: 0; border-radius: 24px; font: inherit; font-size: 16px; cursor: pointer; }
.cancel-button { background: #f0f1f6; color: #2d3140; }
.confirm-button { background: #1F7CFF; color: #fff; }
.confirm-button:disabled { opacity: .65; cursor: wait; }
.open-link { display: block; margin: 12px auto 0; padding: 5px; border: 0; background: none; color: #1F7CFF; font: inherit; font-size: 13px; }
.configurable-export { width: min(100%, 420px); max-height: 100%; overflow-y: auto; padding: 24px; border-radius: 16px; }
.configurable-export .export-art { width: 48px; height: 48px; flex: 0 0 48px; border-radius: 10px; background: #f2f5fc; }
.configurable-export .export-art img { width: 34px; }
.configurable-export h2 { margin: 0; text-align: left; font-size: 20px; line-height: 28px; }
.configurable-export .question-total { margin: 3px 0 0; text-align: left; color: #8d96a7; font-size: 12px; line-height: 18px; }
.configurable-export > label { margin: 18px 0 8px; color: #4a5262; font-size: 13px; font-weight: 500; line-height: 20px; }
.configurable-export > input { height: 40px; padding: 0 12px; border-color: #dfe5ed !important; border-radius: 8px; font-size: 14px; transition: border-color .15s, box-shadow .15s; }
.configurable-export > input:focus { border-color: #1F7CFF !important; outline: none; box-shadow: 0 0 0 3px rgba(31, 124, 255, .1); }
.configurable-export > input::placeholder { color: #a6adbb !important; font-size: 13px !important; }
.configurable-export > input:disabled { color: #8d96a7; background: #f8f9fc !important; }
.configurable-export .export-actions { gap: 10px; margin-top: 24px; }
.configurable-export .export-actions button { height: 40px; border-radius: 8px; font-size: 14px; }
@media (max-width: 480px) {
  .export-mask { padding: 16px; }
  .configurable-export { padding: 20px; }
}
</style>
