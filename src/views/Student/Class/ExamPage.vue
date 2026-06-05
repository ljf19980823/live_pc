<template>
  <div class="exam-page">
    <!-- 顶部 Header -->
    <div class="exam-header">
      <div class="exam-header-left" @click="handleBack">
        <img src="@/assets/images/class/back_icon.png" class="exam-back-icon" alt="返回">
        <span class="exam-back-text">返回</span>
      </div>
      <div class="exam-header-title">考试 - {{ examInfo.name }}</div>
      <div class="exam-header-right">
        <img src="@/assets/images/class/clock.png" class="exam-timer-icon" alt="">
        <span class="exam-timer-text" :class="{ 'exam-timer-warning': remainTime <= 300 }">{{ formatTime(remainTime) }}</span>
      </div>
    </div>

    <!-- 主体 -->
    <div class="exam-body" v-loading="loading">
      <!-- 题目区域 -->
      <div class="exam-question-wrap">
        <div class="exam-question-card" v-if="currentQuestion">
          <!-- 题目类型 + 题号 -->
          <div class="exam-question-header">
            <span class="exam-q-type-badge">{{ getTypeName(currentQuestion) }}</span>
            <span class="exam-q-num">第 {{ currentIndex + 1 }} 题</span>
          </div>

          <!-- 材料（有 material 字段的题型均显示） -->
          <div v-if="currentQuestion.material" class="exam-material-box">
            <div class="exam-material-label">材料：</div>
            <img
              v-if="isUrl(currentQuestion.material)"
              :src="currentQuestion.material"
              class="exam-content-img"
              alt="材料图片"
            />
            <div v-else class="exam-material-content rich-text-content" v-html="currentQuestion.material"></div>
          </div>

          <!-- 题目内容 -->
          <div class="exam-question-content">
            <img
              v-if="currentQuestion.isImg"
              :src="currentQuestion.name"
              class="exam-content-img"
              alt="题目图片"
            />
            <div v-else class="rich-text-content" v-html="currentQuestion.name"></div>
          </div>

          <!-- 判断题 questType=3 -->
          <div v-if="currentQuestion.type === '3'" class="exam-options">
            <div
              class="exam-option"
              :class="{ 'exam-option-selected': answers[currentQuestion.id] === 'A' }"
              @click="selectSingleAnswer(currentQuestion.id, 'A')"
            >
              <span class="exam-option-label">A</span>
              <span class="exam-option-text">正确</span>
            </div>
            <div
              class="exam-option"
              :class="{ 'exam-option-selected': answers[currentQuestion.id] === 'B' }"
              @click="selectSingleAnswer(currentQuestion.id, 'B')"
            >
              <span class="exam-option-label">B</span>
              <span class="exam-option-text">错误</span>
            </div>
          </div>

          <!-- 单选题 questType=1 -->
          <div v-if="currentQuestion.type === '1'" class="exam-options">
            <div
              class="exam-option"
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              :class="{ 'exam-option-selected': answers[currentQuestion.id] === opt.id }"
              @click="selectSingleAnswer(currentQuestion.id, opt.id)"
            >
              <span class="exam-option-label">{{ opt.label }}</span>
              <div class="exam-option-body">
                <img v-if="opt.isImg" :src="opt.content" class="exam-option-img" alt="选项图片" />
                <div v-else class="exam-option-text rich-text-content" v-html="opt.content"></div>
              </div>
            </div>
          </div>

          <!-- 多选题 questType=2 -->
          <div v-if="currentQuestion.type === '2'" class="exam-options">
            <div
              class="exam-option"
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              :class="{ 'exam-option-selected': isMultiSelected(currentQuestion.id, opt.id) }"
              @click="toggleMultiAnswer(currentQuestion.id, opt.id)"
            >
              <span class="exam-option-label">{{ opt.label }}</span>
              <div class="exam-option-body">
                <img v-if="opt.isImg" :src="opt.content" class="exam-option-img" alt="选项图片" />
                <div v-else class="exam-option-text rich-text-content" v-html="opt.content"></div>
              </div>
            </div>
          </div>

          <!-- 填空/简答/计算/论述 questType=4/5/6/7 -->
          <div v-if="isTextType(currentQuestion.type)" class="exam-textarea-wrap">
            <el-input
              type="textarea"
              :rows="6"
              placeholder="请输入你的答案..."
              v-model="textAnswers[currentQuestion.id]"
              resize="none"
            />
          </div>
        </div>

        <!-- 上一题 / 下一题 导航 -->
        <div class="exam-nav">
          <button
            class="exam-nav-btn"
            :class="{ 'exam-nav-btn-disabled': currentIndex === 0 }"
            :disabled="currentIndex === 0"
            @click="prevQuestion"
          >
            &#8249; 上一题
          </button>
          <button
            class="exam-nav-btn exam-nav-btn-primary"
            :class="{ 'exam-nav-btn-disabled': currentIndex === questions.length - 1 }"
            :disabled="currentIndex === questions.length - 1"
            @click="nextQuestion"
          >
            下一题 &#8250;
          </button>
        </div>
      </div>

      <!-- 答题卡 -->
      <div class="exam-answer-card">
        <div class="answer-card-title">答题卡</div>
        <div class="answer-card-progress-row">
          <span class="answer-card-progress-label">答题进度</span>
          <span class="answer-card-progress-num">{{ answeredCount }}/{{ questions.length }}</span>
        </div>
        <div class="answer-card-grid">
          <div
            class="answer-card-item"
            v-for="(q, idx) in questions"
            :key="idx"
            :class="{
              'answer-card-item-current': idx === currentIndex,
              'answer-card-item-answered': idx !== currentIndex && isAnswered(q)
            }"
            @click="goToQuestion(idx)"
          >
            {{ idx + 1 }}
          </div>
        </div>
        <div class="answer-card-legend_text">做题状态</div>
        <div class="answer-card-legend">
          <div class="legend-item">
            <span class="legend-dot legend-dot-current"></span>
            <span class="legend-label">当前题目</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-dot-answered"></span>
            <span class="legend-label">已答题目</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot legend-dot-unanswered"></span>
            <span class="legend-label">未答题目</span>
          </div>
        </div>
        <button class="exam-submit-btn" @click="handleSubmit">提交考试</button>
      </div>
    </div>

    <!-- 退出确认弹窗 -->
    <transition name="exam-dialog-fade">
      <div v-if="showBackDialog" class="exam-dialog-mask" @click.self="showBackDialog = false">
        <div class="exam-dialog">
          <img src="@/assets/images/class/tips.png" class="exam-dialog-warning-icon" alt="">
          <div class="exam-dialog-title">退出考试</div>
          <div class="exam-dialog-desc">
            您正在考试中，确定退出吗？<br>退出后本次答题记录将不会保存。
          </div>
          <div class="exam-dialog-btns">
            <button class="exam-dialog-btn-cancel" @click="showBackDialog = false">继续考试</button>
            <button class="exam-dialog-btn-confirm exam-dialog-btn-danger" @click="confirmBack">确定退出</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 提交确认弹窗（有未答题目） -->
    <transition name="exam-dialog-fade">
      <div v-if="showSubmitDialog" class="exam-dialog-mask" @click.self="showSubmitDialog = false">
        <div class="exam-dialog">
          <img src="@/assets/images/class/tips.png" class="exam-dialog-warning-icon" alt="">
          <div class="exam-dialog-title">提交确认</div>
          <div class="exam-dialog-desc">
            还有 <span class="exam-dialog-count">{{ unansweredCount }}</span> 道题未作答，确定要提交吗？
          </div>
          <div class="exam-dialog-btns">
            <button class="exam-dialog-btn-cancel" @click="showSubmitDialog = false">继续答题</button>
            <el-button
              class="exam-dialog-btn-confirm exam-dialog-btn-el"
              type="primary"
              :loading="submitting"
              @click="confirmSubmit"
            >{{ submitting ? '提交中...' : '确认提交' }}</el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全部已答提交确认弹窗 -->
    <transition name="exam-dialog-fade">
      <div v-if="showAllAnsweredDialog" class="exam-dialog-mask" @click.self="showAllAnsweredDialog = false">
        <div class="exam-dialog">
          <img src="@/assets/images/class/tips.png" class="exam-dialog-warning-icon" alt="">
          <div class="exam-dialog-title">提交确认</div>
          <div class="exam-dialog-desc">
            您已完成全部 <span class="exam-dialog-count">{{ questions.length }}</span> 道题目，确认提交此次考试吗？
          </div>
          <div class="exam-dialog-btns">
            <button class="exam-dialog-btn-cancel" @click="showAllAnsweredDialog = false">继续答题</button>
            <el-button
              class="exam-dialog-btn-confirm exam-dialog-btn-el"
              type="primary"
              :loading="submitting"
              @click="confirmSubmit"
            >{{ submitting ? '提交中...' : '确认提交' }}</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { getExamDetail, gradeExam } from '@/api'

// questType: 1单选 2多选 3判断 4填空 5简答 6计算 7论述
const TYPE_MAP = {
  '1': '单选题',
  '2': '多选题',
  '3': '判断题',
  '4': '填空题',
  '5': '简答题',
  '6': '计算题',
  '7': '论述题'
}

// 需要文本输入的题型
const TEXT_TYPES = new Set(['4', '5', '6', '7'])

export default {
  name: 'ExamPage',
  props: {
    examInfo: {
      type: Object,
      default: () => ({})
    },
    classId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      questions: [],
      currentIndex: 0,
      // 单选/判断答案: { questionId: 'A' }
      answers: {},
      // 多选答案: { questionId: ['A', 'B'] }
      multiAnswers: {},
      // 填空/论述/材料分析答案: { questionId: 'text' }
      textAnswers: {},
      remainTime: 0,
      examTotalSeconds: 0,
      timerInterval: null,
      showSubmitDialog: false,
      showAllAnsweredDialog: false,
      showBackDialog: false,
      submitting: false,
      liveId:'',
      examConfigId:''
    }
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null
    },
    answeredCount() {
      return this.questions.filter(q => this.isAnswered(q)).length
    },
    unansweredCount() {
      return this.questions.length - this.answeredCount
    }
  },
  created() {
    this.fetchExamDetail()
  },
  beforeDestroy() {
    this.clearTimer()
  },
  methods: {
    getTypeName(q) {
      // questName 为自定义题型名称（如"完形填空"），优先展示
      return q.questName || q.typeName || TYPE_MAP[q.type] || '未知题型'
    },
    isTextType(type) {
      return TEXT_TYPES.has(type)
    },
    isUrl(str) {
      return typeof str === 'string' && /^https?:\/\//.test(str)
    },
    async fetchExamDetail() {
      if (!this.examInfo || !this.examInfo.id) return
      this.loading = true
      try {
        const res = await getExamDetail(this.examInfo.id)
        const data = res.data || {}
        this.liveId = data.liveId
        this.examConfigId = data.examConfigId
        this.questions = this._mapQuestions(data.topics || [])
        const duration = data.examDuration || this.examInfo.duration || 60
        this.remainTime = duration * 60
        this.examTotalSeconds = duration * 60
        this.startTimer()
      } catch (e) {
        console.error(e)
        this.$message.error('获取题目失败，请重试')
      } finally {
        this.loading = false
      }
    },
    _mapQuestions(list) {
      const OPT_KEYS = ['A', 'B', 'C', 'D', 'E']
      return list.map(item => {
        const type = String(item.questType || '1')
        const options = OPT_KEYS
          .filter(k => item[`option${k}`] != null && item[`option${k}`] !== '')
          .map(k => ({
            id: k,
            label: k,
            content: item[`option${k}`] || '',
            isImg: item[`optionIsImg${k}`] === '1'
          }))
        return {
          ...item,
          id: item.id,
          type,
          name: item.name || '',
          isImg: item.isImg === '1',
          typeName: item.typeName || '',
          questName: item.questName || '',
          material: item.material || '',
          options,
          serialNumber: item.serialNumber || 0,
          score: item.score || 0

        }
      }).sort((a, b) => a.serialNumber - b.serialNumber)
    },
    startTimer() {
      this.clearTimer()
      this.timerInterval = setInterval(() => {
        if (this.remainTime > 0) {
          this.remainTime -= 1
        } else {
          this.clearTimer()
          this.$message.warning('考试时间已到，正在为你上传考试结果')
          this.confirmSubmit()
        }
      }, 1000)
    },
    clearTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },
    formatTime(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      return [
        String(h).padStart(2, '0'),
        String(m).padStart(2, '0'),
        String(s).padStart(2, '0')
      ].join(':')
    },
    isAnswered(q) {
      if (!q) return false
      if (q.type === '2') {
        return (this.multiAnswers[q.id] || []).length > 0
      }
      if (TEXT_TYPES.has(q.type)) {
        return !!(this.textAnswers[q.id] && this.textAnswers[q.id].trim())
      }
      // 单选(1) / 判断(3)
      return !!this.answers[q.id]
    },
    isMultiSelected(questionId, optId) {
      return (this.multiAnswers[questionId] || []).includes(optId)
    },
    selectSingleAnswer(questionId, optId) {
      this.$set(this.answers, questionId, optId)
    },
    toggleMultiAnswer(questionId, optId) {
      const current = [...(this.multiAnswers[questionId] || [])]
      const idx = current.indexOf(optId)
      if (idx === -1) {
        current.push(optId)
      } else {
        current.splice(idx, 1)
      }
      this.$set(this.multiAnswers, questionId, current)
    },
    async saveTextAnswer(questionId) {
      const val = (this.textAnswers[questionId] || '').trim()
      if (!val) {
        this.$message.warning('请先输入答案')
        return
      }
      this.$set(this.textAnswers, questionId, val)
      this.$message.success('答案已保存')
    },
    prevQuestion() {
      if (this.currentIndex > 0) this.currentIndex -= 1
    },
    nextQuestion() {
      const q = this.currentQuestion
      if (q && this.isTextType(q.type)) {
        const val = (this.textAnswers[q.id] || '').trim()
        if (val) {
          this.$set(this.textAnswers, q.id, val)
        }
      }
      if (this.currentIndex < this.questions.length - 1) this.currentIndex += 1
    },
    goToQuestion(idx) {
      this.currentIndex = idx
    },
    handleSubmit() {
      if (this.unansweredCount > 0) {
        this.showSubmitDialog = true
      } else {
        this.showAllAnsweredDialog = true
      }
    },
    async confirmSubmit() {
      this.showSubmitDialog = false
      this.showAllAnsweredDialog = false
      this.submitting = true
      this.clearTimer()
      try {
        const answers = this.questions.map(q => {
          let studentAnswer = ''
          if (q.type === '2') {
            studentAnswer = (this.multiAnswers[q.id] || []).join('')
          } else if (TEXT_TYPES.has(q.type)) {
            studentAnswer = this.textAnswers[q.id] || ''
          } else {
            studentAnswer = this.answers[q.id] || ''
          }
          return {
            topicId: q.id,
            questType: q.type,
            studentAnswer,
            correctAnswer: q.answer,
            serialNumber: q.serialNumber,
            score: q.score
          }
        })
        const elapsed = this.examTotalSeconds - this.remainTime
        await gradeExam({
          liveId: this.liveId || '',
          examId: this.examInfo.id || '',
          examConfigId: this.examConfigId || '',
          examDuration: String(elapsed > 0 ? elapsed : 0),
          answers
        })
        this.$message.success('提交成功')
        this.$emit('submitted')
      } catch (e) {
        console.error(e)
        this.$message.error('提交失败，请重试')
        this.startTimer()
      } finally {
        this.submitting = false
      }
    },
    handleBack() {
      this.showBackDialog = true
    },
    confirmBack() {
      this.showBackDialog = false
      this.clearTimer()
      this.$emit('back')
    }
  }
}
</script>

<style scoped>
.exam-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #F5F7FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

/* Header */
.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
  background: #fff;
}
.exam-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  min-width: 80px;
  user-select: none;
}
.exam-header-left:hover {
  color: #0049FF;
}
.exam-back-icon {
  width: 15px;
  height: 15px;
  object-fit: contain;
  display: block;
}
.exam-back-text {
  font-size: 14px;
}
.exam-header-title {
  font-size: 20px;
  font-weight: bold;
  color: #333333;
  text-align: center;
  flex: 1;
}
.exam-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}
.exam-timer-icon {
  width: 20px;
  height: 20px;
}
.exam-timer-text {
  font-size: 16px;
  font-weight: 500;
  color: #0049FF;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}
.exam-timer-warning {
  color: #e74c3c;
}

/* Body */
.exam-body {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 24px;
  overflow: hidden;
  min-height: 0;
}

/* Question wrap */
.exam-question-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 16px;
}
.exam-question-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  flex: 1;
  overflow-y: auto;
}
.exam-question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.exam-q-type-badge {
  background: #0049FF;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
}
.exam-q-num {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.exam-material-box {
  background: #F8F9FF;
  border-left: 3px solid #0049FF;
  border-radius: 0 6px 6px 0;
  padding: 12px 16px;
  margin-bottom: 18px;
}
.exam-material-label {
  font-size: 13px;
  font-weight: 600;
  color: #0049FF;
  margin-bottom: 6px;
}
.exam-material-content {
  font-size: 14px;
  color: #444;
  line-height: 1.7;
  white-space: pre-wrap;
}
.exam-question-content {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 20px;
}
::v-deep .exam-question-content .rich-text-content p,
::v-deep .exam-material-content.rich-text-content p {
  margin: 0 0 4px;
  line-height: 1.8;
}
::v-deep .exam-question-content .rich-text-content img,
::v-deep .exam-material-content.rich-text-content img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
  display: block;
  margin: 6px 0;
}
::v-deep .exam-question-content .rich-text-content table,
::v-deep .exam-material-content.rich-text-content table {
  border-collapse: collapse;
  font-size: 14px;
  width: auto;
}
::v-deep .exam-question-content .rich-text-content td,
::v-deep .exam-question-content .rich-text-content th,
::v-deep .exam-material-content.rich-text-content td,
::v-deep .exam-material-content.rich-text-content th {
  border: 1px solid #d0d5e3;
  padding: 5px 10px;
}
::v-deep .exam-question-content .rich-text-content ol,
::v-deep .exam-question-content .rich-text-content ul,
::v-deep .exam-material-content.rich-text-content ol,
::v-deep .exam-material-content.rich-text-content ul {
  padding-left: 20px;
  margin: 4px 0;
}
::v-deep .exam-question-content .rich-text-content *,
::v-deep .exam-material-content.rich-text-content * {
  max-width: 100%;
}

/* Options */
.exam-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
 
}
::v-deep .exam-options  img{
    mix-blend-mode: multiply!important;
  }
.exam-option {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1.5px solid #E5E8EF;
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.exam-option:hover {
  border-color: #b3c6ff;
  background: #F5F8FF;
}
.exam-option-selected {
  border-color: #0049FF !important;
  background: #EEF3FF !important;
}
.exam-option-label {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E5E8EF;
  color: #555;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.exam-option-selected .exam-option-label {
  background: #0049FF;
  color: #fff;
}
.exam-option-body {
  flex: 1;
  min-width: 0;
}
.exam-option-text {
  font-size: 14px;
  color: #333;
}
::v-deep .exam-option-text.rich-text-content p {
  margin: 0;
  line-height: 1.7;
}
::v-deep .exam-option-text.rich-text-content img {
  max-width: 100%;
  max-height: 160px;
  border-radius: 4px;
  object-fit: contain;
  vertical-align: middle;
}
::v-deep .exam-option-text.rich-text-content table {
  border-collapse: collapse;
  font-size: 13px;
}
::v-deep .exam-option-text.rich-text-content td,
::v-deep .exam-option-text.rich-text-content th {
  border: 1px solid #d0d5e3;
  padding: 4px 8px;
}
::v-deep .exam-option-text.rich-text-content ol,
::v-deep .exam-option-text.rich-text-content ul {
  padding-left: 18px;
  margin: 0;
}
::v-deep .exam-option-text.rich-text-content * {
  max-width: 100%;
}
.exam-option-img {
  max-width: 100%;
  max-height: 160px;
  border-radius: 4px;
  object-fit: contain;
  display: block;
}
.exam-content-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
  display: block;
  margin-top: 8px;
}

/* Textarea */
.exam-textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Navigation */
.exam-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.exam-nav-btn {
  height: 38px;
  padding: 0 24px;
  border-radius: 8px;
  border: 1.5px solid #DCDCDC;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.exam-nav-btn:hover:not(.exam-nav-btn-disabled) {
  border-color: #0049FF;
  color: #0049FF;
}
.exam-nav-btn-primary {
  background: #0049FF;
  color: #fff;
  border-color: #0049FF;
}
.exam-nav-btn-primary:hover:not(.exam-nav-btn-disabled) {
  background: #003acc;
  border-color: #003acc;
  color: #fff;
}
.exam-nav-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Answer Card */
.exam-answer-card {
  width: 319px;
  flex-shrink: 0;
  background: #fff;
  /* border-radius: 12px; */
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 17px;
  align-self: stretch;
  overflow-y: auto;
}
.answer-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}
.answer-card-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}
.answer-card-progress-num {
  color: #0049FF;
  font-weight: 700;
  font-size: 14px;
}
.answer-card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding-top: 24px;
  box-sizing: border-box;
  border-top: 1px solid #F0F0F0;
  margin-top: 17px;
}
.answer-card-item {
  width: 47.8px;
  height: 47.8px;
  border-radius: 6px;
  background: #F0F0F0;
  color: #999999;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}
.answer-card-item:hover {
  background: #d6e4ff;
  color: #0049FF;
}
.answer-card-item-current {
  background: #0049FF !important;
  color: #fff !important;
}
.answer-card-item-answered {
  background: #B8CAFF;
  color: #0049FF;
}
.answer-card-legend_text{
  margin-top: 23px;
  color: #333333;
  font-size: 13px;
}
.answer-card-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 25px;
  box-sizing: border-box;
   border-bottom: 1px solid #F0F0F0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.legend-dot {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}
.legend-dot-current {
  background: #0049FF;
}
.legend-dot-answered {
  background: #B8CAFF;
}
.legend-dot-unanswered {
  background: #F0F0F0;
  border: 1px solid #DCDCDC;
}
.legend-label {
  font-size: 12px;
  color: #666;
}
.exam-submit-btn {
  width: 100%;
  height: 45px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 4px;
}
.exam-submit-btn:hover {
  background: #003acc;
}

/* Submit Dialog */
.exam-dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.exam-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 32px 40px;
  width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
.exam-dialog-warning-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
 
}
.exam-dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #333;
}
.exam-dialog-desc {
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 1.6;
}
.exam-dialog-count {
  color: #e74c3c;
  font-weight: 700;
}
.exam-dialog-btns {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  width: 100%;
}
.exam-dialog-btn-cancel {
  flex: 1;
  height: 40px;
  border: 1.5px solid #DCDCDC;
  background: #fff;
  color: #333;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.exam-dialog-btn-cancel:hover {
  border-color: #0049FF;
  color: #0049FF;
}
.exam-dialog-btn-confirm {
  flex: 1;
  height: 40px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.exam-dialog-btn-confirm:hover:not(:disabled) {
  background: #003acc;
}
.exam-dialog-btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.exam-dialog-btn-el.el-button {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  padding: 0;
  background: #0049FF;
  border-color: #0049FF;
}
.exam-dialog-btn-danger {
  background: #e74c3c;
  border-color: #e74c3c;
}
.exam-dialog-btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

/* Dialog transition */
.exam-dialog-fade-enter-active,
.exam-dialog-fade-leave-active {
  transition: opacity 0.2s;
}
.exam-dialog-fade-enter,
.exam-dialog-fade-leave-to {
  opacity: 0;
}
</style>
