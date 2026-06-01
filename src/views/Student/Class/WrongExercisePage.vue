<template>
  <div class="wep" v-if="visible">
    <!-- 顶部 Header -->
    <div class="wep__header">
      <div class="wep__back" @click="$emit('close')">
        <img src="@/assets/images/class/back_icon.png" class="wep__back-arrow" alt="返回" />
        <span class="wep__back-text">返回</span>
      </div>
      <div class="wep__title">错题提升巩固</div>
      <div class="wep__header-right"></div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="wep__loading">加载中...</div>

    <!-- 主体 -->
    <div v-else class="wep__body">
      <!-- 题目区 -->
      <div class="wep__question-wrap">
        <div class="wep__question-card" v-if="currentQuestion">
          <!-- 题目头部 -->
          <div class="wep__q-header">
            <span class="wep__q-type-badge">{{ getTypeName(currentQuestion) }}</span>
            <span class="wep__q-num">第 {{ currentIndex + 1 }} 题</span>
            <span
              v-if="getAnswerState(currentQuestion) === 'correct'"
              class="wep__q-result wep__q-result--correct"
            >
              <span class="wep__q-result-icon">✓</span>回答正确
            </span>
            <span
              v-else-if="getAnswerState(currentQuestion) === 'wrong'"
              class="wep__q-result wep__q-result--wrong"
            >
              <span class="wep__q-result-icon">✗</span>回答错误
            </span>
            <span
              v-else-if="getAnswerState(currentQuestion) === 'submitted'"
              class="wep__q-result wep__q-result--pending"
            >
              已提交
            </span>
          </div>

          <!-- 材料 -->
          <div v-if="currentQuestion.material" class="wep__q-material">
            <div class="wep__q-material-label">材料：</div>
            <img
              v-if="isUrl(currentQuestion.material)"
              :src="currentQuestion.material"
              class="wep__content-img"
              alt="材料图片"
            />
            <div v-else class="rich-text-content" v-html="currentQuestion.material"></div>
          </div>

          <!-- 题干 -->
          <div class="wep__q-stem">
            <img
              v-if="currentQuestion.isImg === '1'"
              :src="currentQuestion.name"
              class="wep__content-img"
              alt="题目图片"
            />
            <div v-else class="rich-text-content" v-html="currentQuestion.name"></div>
          </div>

          <!-- 判断题 questType=3 -->
          <div v-if="currentQuestion.questType === '3'" class="wep__options">
            <div
              v-for="opt in judgeOptions"
              :key="opt.id"
              class="wep__option"
              :class="getOptionClass(currentQuestion, opt.id)"
              @click="!isSubmitted(currentQuestion.id) && handleSingleSelect(currentQuestion, opt.id)"
            >
              <span class="wep__opt-label" :class="getOptLabelClass(currentQuestion, opt.id)">{{ opt.id }}</span>
              <span class="wep__opt-text">{{ opt.text }}</span>
              <span v-if="showOptIcon(currentQuestion, opt.id) === 'correct'" class="wep__opt-icon wep__opt-icon--correct">✓</span>
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'wrong'" class="wep__opt-icon wep__opt-icon--wrong">✗</span>
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'missed'" class="wep__opt-icon wep__opt-icon--correct">✓</span>
            </div>
          </div>

          <!-- 单选题 questType=1 -->
          <div v-else-if="currentQuestion.questType === '1'" class="wep__options">
            <div
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              class="wep__option"
              :class="getOptionClass(currentQuestion, opt.id)"
              @click="!isSubmitted(currentQuestion.id) && handleSingleSelect(currentQuestion, opt.id)"
            >
              <span class="wep__opt-label" :class="getOptLabelClass(currentQuestion, opt.id)">{{ opt.label }}</span>
              <div class="wep__opt-body">
                <img v-if="opt.isImg" :src="opt.content" class="wep__opt-img" alt="选项图片" />
                <span v-else class="wep__opt-text rich-text-content" v-html="opt.content"></span>
              </div>
              <span v-if="showOptIcon(currentQuestion, opt.id) === 'correct'" class="wep__opt-icon wep__opt-icon--correct">✓</span>
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'wrong'" class="wep__opt-icon wep__opt-icon--wrong">✗</span>
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'missed'" class="wep__opt-icon wep__opt-icon--correct">✓</span>
            </div>
          </div>

          <!-- 多选题 questType=2 -->
          <div v-else-if="currentQuestion.questType === '2'" class="wep__options">
            <div
              v-for="opt in currentQuestion.options"
              :key="opt.id"
              class="wep__option"
              :class="getOptionClass(currentQuestion, opt.id)"
              @click="!isSubmitted(currentQuestion.id) && toggleMulti(currentQuestion.id, opt.id)"
            >
              <span class="wep__opt-label" :class="getOptLabelClass(currentQuestion, opt.id)">{{ opt.label }}</span>
              <div class="wep__opt-body">
                <img v-if="opt.isImg" :src="opt.content" class="wep__opt-img" alt="选项图片" />
                <span v-else class="wep__opt-text rich-text-content" v-html="opt.content"></span>
              </div>
              <span v-if="showOptIcon(currentQuestion, opt.id) === 'correct'" class="wep__opt-icon wep__opt-icon--correct">✓</span>
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'wrong'" class="wep__opt-icon wep__opt-icon--wrong">✗</span>
              <!-- 多选：漏选的正确项显示红色✗ -->
              <span v-else-if="showOptIcon(currentQuestion, opt.id) === 'missed'" class="wep__opt-icon wep__opt-icon--wrong">✗</span>
            </div>
            <button
              v-if="!isSubmitted(currentQuestion.id)"
              class="wep__submit-answer-btn"
              @click="submitAnswer(currentQuestion)"
            >提交答案</button>
          </div>

          <!-- 填空/简答/计算/论述 questType=4/5/6/7 -->
          <div v-else-if="isTextType(currentQuestion.questType)" class="wep__textarea-wrap">
            <el-input
              type="textarea"
              :rows="6"
              placeholder="请输入你的答案..."
              v-model="textAnswers[currentQuestion.id]"
              resize="none"
              :disabled="isSubmitted(currentQuestion.id)"
            />
            <button
              v-if="!isSubmitted(currentQuestion.id)"
              class="wep__submit-answer-btn"
              @click="submitAnswer(currentQuestion)"
            >提交答案</button>
          </div>

          <!-- 我的答案（提交后显示，选择/判断/多选题） -->
          <div
            v-if="isSubmitted(currentQuestion.id) && !isTextType(currentQuestion.questType)"
            class="wep__my-answer-wrap"
          >
            <div
              class="wep__my-answer-block"
              :class="getAnswerState(currentQuestion) === 'correct' ? 'wep__my-answer-block--correct' : 'wep__my-answer-block--wrong'"
            >
              <div class="wep__my-answer-label">我的答案：</div>
              <div
                class="wep__my-answer-val"
                :class="getAnswerState(currentQuestion) === 'correct' ? 'wep__my-answer-val--correct' : 'wep__my-answer-val--wrong'"
              >
                {{ getMyAnswerText(currentQuestion) }}
              </div>
            </div>
          </div>

          <!-- 我的答案（主观题） -->
          <div
            v-if="isSubmitted(currentQuestion.id) && isTextType(currentQuestion.questType)"
            class="wep__my-answer-wrap"
          >
            <div class="wep__my-answer-block wep__my-answer-block--neutral">
              <div class="wep__my-answer-label">我的答案：</div>
              <div class="wep__my-answer-val">{{ textAnswers[currentQuestion.id] || '未作答' }}</div>
            </div>
          </div>

          <!-- 答案解析（提交后显示） -->
          <div v-if="isSubmitted(currentQuestion.id)" class="wep__analysis">
            <div class="wep__analysis-label">答案解析</div>
            <div class="wep__analysis-correct-row">
              <span class="wep__analysis-correct-label">
                {{ isTextType(currentQuestion.questType) ? '参考答案' : '正确答案' }}：
              </span>
              <span v-if="currentQuestion.answerIsImg === '1'" class="wep__analysis-correct-val">
                <img :src="currentQuestion.answer" class="wep__content-img" alt="答案图片" />
              </span>
              <span v-else class="wep__analysis-correct-val" v-html="currentQuestion.answer || '-'"></span>
            </div>
            <div v-if="currentQuestion.analysis" class="wep__analysis-text">
              <img
                v-if="currentQuestion.analysisIsImg === '1'"
                :src="currentQuestion.analysis"
                class="wep__content-img"
                alt="解析图片"
              />
              <span v-else v-html="currentQuestion.analysis"></span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="questions.length === 0" class="wep__empty">暂无错题数据</div>

        <!-- 上一题 / 下一题 -->
        <div class="wep__nav" v-if="questions.length > 0">
          <button
            class="wep__nav-btn"
            :class="{ 'wep__nav-btn--disabled': currentIndex === 0 }"
            :disabled="currentIndex === 0"
            @click="prevQuestion"
          >&#8249; 上一题</button>
          <button
            class="wep__nav-btn wep__nav-btn--primary"
            :class="{ 'wep__nav-btn--disabled': currentIndex === questions.length - 1 }"
            :disabled="currentIndex === questions.length - 1"
            @click="nextQuestion"
          >下一题 &#8250;</button>
        </div>
      </div>

      <!-- 右侧答题卡 -->
      <div class="wep__card">
        <div class="wep__card-title">答题卡</div>
        <div class="wep__card-progress-row">
          <span class="wep__card-progress-label">已答题数：</span>
          <span class="wep__card-progress-num">{{ answeredCount }} / {{ questions.length }}</span>
        </div>
        <div class="wep__card-grid">
          <div
            v-for="(q, idx) in questions"
            :key="q.id"
            class="wep__card-item"
            :class="getCardItemClass(q, idx)"
            @click="goToQuestion(idx)"
          >
            <span
              v-if="getAnswerState(q) === 'correct'"
              class="wep__card-icon"
            >✓</span>
            <span
              v-else-if="getAnswerState(q) === 'wrong'"
              class="wep__card-icon"
            >✗</span>
            {{ idx + 1 }}
          </div>
        </div>
        <div class="wep__card-legend-title">做题状态</div>
        <div class="wep__card-legend">
          <div class="wep__legend-item">
            <span class="wep__legend-dot wep__legend-dot--current"></span>
            <span class="wep__legend-label">当前题目</span>
          </div>
          <div class="wep__legend-item">
            <span class="wep__legend-dot wep__legend-dot--correct"></span>
            <span class="wep__legend-label">回答正确</span>
          </div>
          <div class="wep__legend-item">
            <span class="wep__legend-dot wep__legend-dot--wrong"></span>
            <span class="wep__legend-label">回答错误</span>
          </div>
          <div class="wep__legend-item">
            <span class="wep__legend-dot wep__legend-dot--unanswered"></span>
            <span class="wep__legend-label">未答题目</span>
          </div>
        </div>
        <button class="wep__restart-btn" @click="handleRestart">重新考试</button>
      </div>
    </div>
  </div>
</template>

<script>
import { getErrorExercises } from '@/api/modules/student'

const TEXT_TYPES = new Set(['4', '5', '6', '7'])
const TYPE_MAP = {
  '1': '单选题', '2': '多选题', '3': '判断题',
  '4': '填空题', '5': '简答题', '6': '计算题', '7': '论述题'
}

export default {
  name: 'WrongExercisePage',
  props: {
    visible: { type: Boolean, default: false },
    recordId: { type: String, default: '' }
  },
  data() {
    return {
      loading: false,
      questions: [],
      currentIndex: 0,
      // 单选/判断: { id: 'A' }
      answers: {},
      // 多选: { id: ['A', 'B'] }
      multiAnswers: {},
      // 主观题: { id: 'text' }
      textAnswers: {},
      // 已提交的题目id集合
      submittedIds: {},
      // 每题的对错结果: { id: 'correct'|'wrong'|'submitted' }
      results: {},
      judgeOptions: [
        { id: 'A', text: '正确' },
        { id: 'B', text: '错误' }
      ]
    }
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentIndex] || null
    },
    answeredCount() {
      return this.questions.filter(q => this.isSubmitted(q.id)).length
    }
  },
  watch: {
    visible(val) {
      if (val && this.recordId) {
        this.fetchQuestions()
      }
    },
    recordId(val) {
      if (val && this.visible) {
        this.fetchQuestions()
      }
    }
  },
  methods: {
    async fetchQuestions() {
      if (!this.recordId) return
      this.loading = true
      this.resetState()
      try {
        const res = await getErrorExercises(this.recordId)
        const list = (res.data || []).sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0))
        this.questions = list.map(item => {
          const OPT_KEYS = ['A', 'B', 'C', 'D', 'E']
          const options = OPT_KEYS
            .filter(k => item[`option${k}`] != null && item[`option${k}`] !== '')
            .map(k => ({
              id: k,
              label: k,
              content: item[`option${k}`] || '',
              isImg: item[`optionIsImg${k}`] === '1'
            }))
          return { ...item, options }
        })
      } catch (e) {
        this.$message.error('获取错题列表失败，请重试')
        this.questions = []
      } finally {
        this.loading = false
      }
    },
    resetState() {
      this.currentIndex = 0
      this.answers = {}
      this.multiAnswers = {}
      this.textAnswers = {}
      this.submittedIds = {}
      this.results = {}
    },
    getTypeName(q) {
      return q.questName || q.typeName || TYPE_MAP[q.questType] || '未知题型'
    },
    isTextType(type) {
      return TEXT_TYPES.has(type)
    },
    isUrl(str) {
      return typeof str === 'string' && /^https?:\/\//.test(str)
    },
    isSubmitted(id) {
      return !!this.submittedIds[id]
    },
    getAnswerState(q) {
      if (!this.isSubmitted(q.id)) return 'unanswered'
      return this.results[q.id] || 'submitted'
    },
    // 单选/判断：选中即提交判题
    handleSingleSelect(q, optId) {
      this.$set(this.answers, q.id, optId)
      this.doJudge(q, optId)
    },
    // 多选：切换选项
    toggleMulti(qId, optId) {
      const cur = [...(this.multiAnswers[qId] || [])]
      const idx = cur.indexOf(optId)
      if (idx === -1) cur.push(optId)
      else cur.splice(idx, 1)
      this.$set(this.multiAnswers, qId, cur)
    },
    // 多选/文本题手动提交
    submitAnswer(q) {
      if (q.questType === '2') {
        const selected = this.multiAnswers[q.id] || []
        if (selected.length === 0) {
          this.$message.warning('请至少选择一个选项')
          return
        }
        this.doJudge(q, selected.join(''))
      } else if (this.isTextType(q.questType)) {
        const val = (this.textAnswers[q.id] || '').trim()
        if (!val) {
          this.$message.warning('请先输入答案')
          return
        }
        this.$set(this.submittedIds, q.id, true)
        this.$set(this.results, q.id, 'submitted')
      }
    },
    // 判题逻辑
    doJudge(q, studentAnswerStr) {
      this.$set(this.submittedIds, q.id, true)
      const correctRaw = (q.answer || '').trim().toUpperCase()
      // 将正确答案解析成字母数组
      const correctLetters = this.parseAnswerLetters(correctRaw)
      // 将学生答案解析成字母数组（单选/判断是单个字母，多选是多个字母拼接）
      const studentLetters = this.parseAnswerLetters(studentAnswerStr.toUpperCase())
      const correct = correctLetters.sort().join('') === studentLetters.sort().join('')
      this.$set(this.results, q.id, correct ? 'correct' : 'wrong')
    },
    parseAnswerLetters(str) {
      if (!str) return []
      if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean)
      return str.split('').filter(c => /[A-E]/.test(c))
    },
    // 选项样式
    getOptionClass(q, optId) {
      const submitted = this.isSubmitted(q.id)
      const correctLetters = this.parseAnswerLetters((q.answer || '').toUpperCase())
      const isCorrectOpt = correctLetters.includes(optId)

      if (!submitted) {
        // 未提交时高亮当前选中
        if (q.questType === '2') {
          return (this.multiAnswers[q.id] || []).includes(optId) ? 'wep__option--selected' : ''
        }
        return this.answers[q.id] === optId ? 'wep__option--selected' : ''
      }

      // 已提交
      const studentLetters = q.questType === '2'
        ? (this.multiAnswers[q.id] || [])
        : (this.answers[q.id] ? [this.answers[q.id]] : [])
      const studentChose = studentLetters.includes(optId)

      if (studentChose && isCorrectOpt) return 'wep__option--student-correct'
      if (studentChose && !isCorrectOpt) return 'wep__option--student-wrong'
      if (!studentChose && isCorrectOpt) return 'wep__option--answer-correct'
      return ''
    },
    getOptLabelClass(q, optId) {
      const submitted = this.isSubmitted(q.id)
      if (!submitted) {
        if (q.questType === '2') {
          return (this.multiAnswers[q.id] || []).includes(optId) ? 'wep__opt-label--selected' : ''
        }
        return this.answers[q.id] === optId ? 'wep__opt-label--selected' : ''
      }
      const correctLetters = this.parseAnswerLetters((q.answer || '').toUpperCase())
      const isCorrectOpt = correctLetters.includes(optId)
      const studentLetters = q.questType === '2'
        ? (this.multiAnswers[q.id] || [])
        : (this.answers[q.id] ? [this.answers[q.id]] : [])
      const studentChose = studentLetters.includes(optId)
      if (studentChose && isCorrectOpt) return 'wep__opt-label--correct'
      if (studentChose && !isCorrectOpt) return 'wep__opt-label--wrong'
      if (!studentChose && isCorrectOpt) return 'wep__opt-label--correct'
      return ''
    },
    showOptIcon(q, optId) {
      if (!this.isSubmitted(q.id)) return null
      const correctLetters = this.parseAnswerLetters((q.answer || '').toUpperCase())
      const isCorrectOpt = correctLetters.includes(optId)
      const studentLetters = q.questType === '2'
        ? (this.multiAnswers[q.id] || [])
        : (this.answers[q.id] ? [this.answers[q.id]] : [])
      const studentChose = studentLetters.includes(optId)
      // 学生选中且正确 → ✓绿
      if (studentChose && isCorrectOpt) return 'correct'
      // 学生选中但错误 → ✗红
      if (studentChose && !isCorrectOpt) return 'wrong'
      // 学生未选，但这是正确答案：单选/判断 → ✓绿 提示正确项；多选 → ✗红 提示漏选
      if (!studentChose && isCorrectOpt) return q.questType === '2' ? 'missed' : 'correct'
      return null
    },
    getMyAnswerText(q) {
      let letters = []
      if (q.questType === '2') {
        letters = this.multiAnswers[q.id] || []
      } else {
        const a = this.answers[q.id]
        letters = a ? [a] : []
      }
      return letters.length ? letters.join('') : '未作答'
    },
    // 答题卡item样式
    getCardItemClass(q, idx) {
      const state = this.getAnswerState(q)
      if (idx === this.currentIndex) return 'wep__card-item--current'
      if (state === 'correct') return 'wep__card-item--correct'
      if (state === 'wrong') return 'wep__card-item--wrong'
      if (state === 'submitted') return 'wep__card-item--submitted'
      return ''
    },
    prevQuestion() {
      if (this.currentIndex > 0) this.currentIndex -= 1
    },
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) this.currentIndex += 1
    },
    goToQuestion(idx) {
      this.currentIndex = idx
    },
    handleRestart() {
      this.resetState()
    }
  }
}
</script>

<style scoped>
/* ===== 整体布局 ===== */
.wep {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #F5F7FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 3000;
}

/* ===== Header ===== */
.wep__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  background: #fff;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
}
.wep__back {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  min-width: 80px;
  user-select: none;
}
.wep__back:hover { color: #0049FF; }
.wep__back-arrow {
  width: 15px;
  height: 15px;
  object-fit: contain;
  display: block;
}
.wep__back-text { font-size: 14px; }
.wep__title {
  font-size: 20px;
  font-weight: bold;
  color: #333333;
  text-align: center;
  flex: 1;
}
.wep__header-right { min-width: 80px; }

/* ===== 加载 ===== */
.wep__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
}

/* ===== 主体 ===== */
.wep__body {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 24px;
  overflow: hidden;
  min-height: 0;
}

/* ===== 题目区 ===== */
.wep__question-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 16px;
}
.wep__question-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  flex: 1;
  overflow-y: auto;
}
.wep__q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.wep__q-type-badge {
  background: #0049FF;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 4px;
}
.wep__q-num {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.wep__q-result {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}
.wep__q-result--correct { color: #00C853; }
.wep__q-result--wrong   { color: #FF2E00; }
.wep__q-result--pending { color: #FF9800; }
.wep__q-result-icon { font-size: 13px; }

/* 材料 */
.wep__q-material {
  background: #F8F9FF;
  border-left: 3px solid #0049FF;
  border-radius: 0 6px 6px 0;
  padding: 12px 16px;
  margin-bottom: 18px;
}
.wep__q-material-label {
  font-size: 13px;
  font-weight: 600;
  color: #0049FF;
  margin-bottom: 6px;
}

/* 题干 */
.wep__q-stem {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 20px;
}
::v-deep .wep__q-stem .rich-text-content p { margin: 0 0 4px; line-height: 1.8; }
::v-deep .wep__q-stem .rich-text-content img {
  max-width: 100%; max-height: 300px; border-radius: 6px;
  object-fit: contain; display: block; margin: 6px 0;
}

/* 选项 */
.wep__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
::v-deep .wep__options img { mix-blend-mode: multiply !important; }

.wep__option {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1.5px solid #E5E8EF;
  border-radius: 8px;
  padding: 14px 18px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
  position: relative;
}
.wep__option:hover { border-color: #b3c6ff; background: #F5F8FF; }
.wep__option--selected {
  border-color: #0049FF !important;
  background: #EEF3FF !important;
}
.wep__option--student-correct {
  border-color: #00C853 !important;
  background: #E8F5E9 !important;
  cursor: default;
}
.wep__option--student-wrong {
  border-color: #FF2E00 !important;
  background: #FFEBEE !important;
  cursor: default;
}
.wep__option--answer-correct {
  border-color: #00C853 !important;
  background: #E8F5E9 !important;
  cursor: default;
}

.wep__opt-label {
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
.wep__opt-label--selected { background: #0049FF; color: #fff; }
.wep__opt-label--correct  { background: #00C853; color: #fff; }
.wep__opt-label--wrong    { background: #FF2E00; color: #fff; }

.wep__opt-body { flex: 1; min-width: 0; }
.wep__opt-text { font-size: 14px; color: #333; }
::v-deep .wep__opt-text.rich-text-content p { margin: 0; line-height: 1.7; }
::v-deep .wep__opt-text.rich-text-content img {
  max-width: 100%; max-height: 160px; border-radius: 4px;
  object-fit: contain; vertical-align: middle;
  mix-blend-mode: multiply !important;
}

.wep__opt-icon {
  font-size: 16px;
  font-weight: 700;
  margin-left: auto;
  flex-shrink: 0;
}
.wep__opt-icon--correct { color: #00C853; }
.wep__opt-icon--wrong   { color: #FF2E00; }

.wep__opt-img {
  max-width: 100%;
  max-height: 160px;
  border-radius: 4px;
  object-fit: contain;
  display: block;
  mix-blend-mode: multiply !important;
}
.wep__content-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  object-fit: contain;
  display: block;
  margin-top: 8px;
  mix-blend-mode: multiply !important;
}

/* 提交答案按钮 */
.wep__submit-answer-btn {
  align-self: flex-start;
  margin-top: 12px;
  padding: 9px 24px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.wep__submit-answer-btn:hover { background: #003acc; }

/* 主观题文本框 */
.wep__textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 我的答案 */
.wep__my-answer-wrap {
  margin-top: 14px;
  border-radius: 6px;
  overflow: hidden;
}
.wep__my-answer-block {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  font-size: 14px;
}
.wep__my-answer-block--correct { background: #F0FFF4; }
.wep__my-answer-block--wrong   { background: #FFF5F5; }
.wep__my-answer-block--neutral { background: #FAFAFA; }
.wep__my-answer-label {
  color: #888;
  font-size: 12px;
  white-space: nowrap;
}
.wep__my-answer-val {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
.wep__my-answer-val--correct { color: #00C853; }
.wep__my-answer-val--wrong   { color: #FF2E00; }

/* 答案解析 */
.wep__analysis {
  background: #FFFBF0;
  border: 1px solid #FFFBEB;
  border-left: 4px solid #FFA726;
  border-radius: 4px;
  padding: 16px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wep__analysis-label {
  color: #333;
  font-weight: 600;
  font-size: 14px;
}
.wep__analysis-correct-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}
.wep__analysis-correct-label {
  color: #666;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}
.wep__analysis-correct-val {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
.wep__analysis-text {
  color: #555;
  font-size: 14px;
  line-height: 1.7;
}
::v-deep .wep__analysis-text img {
  max-width: 100%; max-height: 300px;
  object-fit: contain; display: block; border-radius: 4px; margin: 4px 0;
  mix-blend-mode: multiply !important;
}

/* 空状态 */
.wep__empty {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 80px 0;
}

/* 上一题/下一题 */
.wep__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.wep__nav-btn {
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
.wep__nav-btn:hover:not(.wep__nav-btn--disabled) { border-color: #0049FF; color: #0049FF; }
.wep__nav-btn--primary {
  background: #0049FF;
  color: #fff;
  border-color: #0049FF;
}
.wep__nav-btn--primary:hover:not(.wep__nav-btn--disabled) {
  background: #003acc;
  border-color: #003acc;
  color: #fff;
}
.wep__nav-btn--disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== 右侧答题卡 ===== */
.wep__card {
  width: 319px;
  flex-shrink: 0;
  background: #fff;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-self: stretch;
  overflow-y: auto;
}
.wep__card-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
}
.wep__card-progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #F0F0F0;
}
.wep__card-progress-num {
  color: #0049FF;
  font-weight: 700;
  font-size: 14px;
}
.wep__card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}
.wep__card-item {
  width: 47px;
  height: 47px;
  border-radius: 6px;
  background: #F0F0F0;
  color: #999;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  user-select: none;
  position: relative;
  flex-direction: column;
  gap: 0;
}
.wep__card-item:hover { background: #d6e4ff; color: #0049FF; }
.wep__card-item--current  { background: #0049FF !important; color: #fff !important; }
.wep__card-item--correct  { background: #00C853 !important; color: #fff !important; }
.wep__card-item--wrong    { background: #F44336 !important; color: #fff !important; }
.wep__card-item--submitted { background: #FF9800 !important; color: #fff !important; }

.wep__card-icon {
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  position: absolute;
  top: 4px;
  right: 5px;
}

.wep__card-legend-title {
  font-size: 13px;
  color: #333;
  margin-bottom: 10px;
}
.wep__card-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid #F0F0F0;
  margin-bottom: 20px;
}
.wep__legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wep__legend-dot {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}
.wep__legend-dot--current    { background: #0049FF; }
.wep__legend-dot--correct    { background: #00C853; }
.wep__legend-dot--wrong      { background: #F44336; }
.wep__legend-dot--unanswered { background: #F0F0F0; border: 1px solid #DCDCDC; }
.wep__legend-label { font-size: 12px; color: #666; }

/* 重新考试按钮 */
.wep__restart-btn {
  width: 100%;
  height: 48px;
  background: #FF6600;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto;
}
.wep__restart-btn:hover { background: #e05a00; }
</style>
