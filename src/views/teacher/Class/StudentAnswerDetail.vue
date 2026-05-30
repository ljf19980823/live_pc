<template>
  <div class="sad" v-if="visible">
    <!-- 顶部标题栏 -->
    <div class="sad__header">
      <div class="sad__back" @click="$emit('close')">
        <img src="@/assets/images/class/back_icon.png" class="sad__back-arrow" alt="返回" />
        <span class="sad__back-text">返回</span>
      </div>
      <div class="sad__title">{{ studentName }} - 第{{ attemptIndex }}次 - 做题详情</div>
      <div class="sad__header-right"></div>
    </div>

    <!-- 考试信息栏 -->
    <div class="sad__info-bar">
      <span class="sad__info-item">考试时间：<span class="sad__info-val">{{ examInfo.examTime }}</span></span>
      <span class="sad__info-item">
        得分：<span class="sad__info-val sad__info-val--score">{{ examInfo.score }} 分</span>
      </span>
      <span class="sad__info-item">
        正确率：<span class="sad__info-val sad__info-val--rate">{{ examInfo.correctRate }}% ({{ examInfo.correctCount }}/{{ examInfo.totalCount }})</span>
      </span>
    </div>

    <!-- 主体内容 -->
    <div class="sad__body">
      <!-- 左侧题目列表 -->
      <div class="sad__questions">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          :id="'sad-q-' + q.id"
          class="sad__question-card"
        >
          <!-- 题目头部 -->
          <div class="sad__q-header">
            <span class="sad__q-type-tag" :class="'sad__q-type-tag--' + q.type">{{ typeLabel(q.type) }}</span>
            <span class="sad__q-index">第 {{ idx + 1 }} 题</span>
            <span class="sad__q-result" :class="q.isCorrect ? 'sad__q-result--correct' : 'sad__q-result--wrong'">
              <span class="sad__q-result-icon">{{ q.isCorrect ? '✓' : '✗' }}</span>
              {{ q.isCorrect ? '回答正确' : '回答错误' }}
            </span>
          </div>

          <!-- 题目题干 -->
          <div class="sad__q-stem">
            {{ q.stem }}
            
          </div>

          <!-- 单选题 / 多选题 / 判断题 选项 -->
          <div v-if="q.type === 'single' || q.type === 'multi' || q.type === 'judge'" class="sad__q-options">
            <div
              v-for="opt in q.options"
              :key="opt.key"
              class="sad__q-option"
              :class="getOptionClass(q, opt)"
            >
              <span class="sad__q-opt-key">{{ opt.key }}.</span>
              <span class="sad__q-opt-text">{{ opt.text }}</span>
              <span v-if="isStudentChose(q, opt) && isCorrectOpt(q, opt)" class="sad__q-opt-icon sad__q-opt-icon--correct">✓</span>
              <span v-else-if="isStudentChose(q, opt) && !isCorrectOpt(q, opt)" class="sad__q-opt-icon sad__q-opt-icon--wrong">✗</span>
              <span v-else-if="!isStudentChose(q, opt) && isCorrectOpt(q, opt)" class="sad__q-opt-icon sad__q-opt-icon--wrong">✗</span>
            </div>
          </div>

          <!-- 单选/多选/判断题 答案汇总 -->
          <div v-if="q.type === 'single' || q.type === 'multi' || q.type === 'judge'" class="sad__fill-wrap">
            <div class="sad__fill-block" :class="q.isCorrect ? 'sad__fill-block--correct' : 'sad__fill-block--wrong'">
              <div class="sad__fill-block-label">学生答案：</div>
              <div class="sad__fill-block-answer" :class="q.isCorrect ? 'sad__fill-block-answer--correct' : 'sad__fill-block-answer--wrong'">
                {{ getOptionTexts(q, q.studentAnswer) }}
              </div>
            </div>
            <div v-if="!q.isCorrect" class="sad__fill-block sad__fill-block--right">
              <div class="sad__fill-block-label">正确答案：</div>
              <div class="sad__fill-block-answer sad__fill-block-answer--right">
                {{ getOptionTexts(q, q.correctAnswer) }}
              </div>
            </div>
          </div>

          <!-- 填空题 -->
          <div v-if="q.type === 'fill'" class="sad__fill-wrap">
            <div
              v-for="(blank, bi) in q.blanks"
              :key="bi"
              class="sad__fill-item"
            >
              <div class="sad__fill-block" :class="blank.isCorrect ? 'sad__fill-block--correct' : 'sad__fill-block--wrong'">
                <span class="sad__fill-block-label">学生答案：</span>
                <span class="sad__fill-block-answer" :class="blank.isCorrect ? 'sad__fill-block-answer--correct' : 'sad__fill-block-answer--wrong'">{{ blank.studentAnswer }}</span>
              </div>
              <div v-if="!blank.isCorrect" class="sad__fill-block sad__fill-block--right">
                <span class="sad__fill-block-label">正确答案：</span>
                <span class="sad__fill-block-answer sad__fill-block-answer--right">{{ blank.correctAnswer }}</span>
              </div>
            </div>
          </div>

          <!-- 答案解析 -->
          <div v-if="q.analysis" class="sad__analysis">
            <div class="sad__analysis-label">答案解析：</div>
            <div class="sad__analysis-text">{{ q.analysis }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧做题看板 -->
      <div class="sad__board">
        <div class="sad__board-title">做题看板</div>
        <div class="sad__board-stats">
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">题目总数</span>
            <span class="sad__board-stat-val">{{ examInfo.totalCount }}</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">回答正确</span>
            <span class="sad__board-stat-val sad__board-stat-val--correct">{{ examInfo.correctCount }}</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">回答错误</span>
            <span class="sad__board-stat-val sad__board-stat-val--wrong">{{ examInfo.totalCount - examInfo.correctCount }}</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">正确率</span>
            <span class="sad__board-stat-val sad__board-stat-val--rate">{{ examInfo.correctRate }}%</span>
          </div>
        </div>
        <div class="sad__board-nav">
          <button
            v-for="(q, idx) in questions"
            :key="q.id"
            class="sad__board-nav-btn"
            :class="q.isCorrect ? 'sad__board-nav-btn--correct' : 'sad__board-nav-btn--wrong'"
            @click="scrollToQuestion(q.id)"
          >{{ idx + 1 }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StudentAnswerDetail',
  props: {
    visible: { type: Boolean, default: false },
    studentName: { type: String, default: '学生1' },
    attemptIndex: { type: Number, default: 1 }
  },
  emits: ['close'],
  data() {
    return {
      examInfo: {
        examTime: '2025-06-15 14:30',
        score: 85,
        correctRate: 60,
        correctCount: 3,
        totalCount: 5
      },
      questions: [
        {
          id: 1,
          type: 'single',
          stem: '管理的首要职能是什么？',
          options: [
            { key: 'A', text: '计划' },
            { key: 'B', text: '组织' },
            { key: 'C', text: '领导' },
            { key: 'D', text: '控制' }
          ],
          studentAnswer: ['A'],
          correctAnswer: ['A'],
          isCorrect: true,
          analysis: '管理的首要职能是计划。计划是管理的首要职能，它为组织确定目标并制定实现目标的方案。'
        },
        {
          id: 2,
          type: 'multi',
          stem: '以下哪些属于管理的基本职能？',
          options: [
            { key: 'A', text: '计划' },
            { key: 'B', text: '组织' },
            { key: 'C', text: '协调' },
            { key: 'D', text: '控制' }
          ],
          studentAnswer: ['A', 'B', 'C'],
          correctAnswer: ['A', 'B', 'D'],
          isCorrect: false,
          analysis: '管理的基本职能包括计划、组织、领导和控制。协调虽然重要，但不属于管理的基本职能。'
        },
        {
          id: 3,
          type: 'judge',
          stem: '管理就是通过他人来完成工作。',
          options: [
            { key: 'A', text: '正确' },
            { key: 'B', text: '错误' }
          ],
          studentAnswer: ['A'],
          correctAnswer: ['A'],
          isCorrect: true,
          analysis: '这个说法是正确的。管理的本质就是通过协调和指导他人的工作来实现组织目标。'
        },
        {
          id: 4,
          type: 'single',
          stem: 'SWOT分析中的"O"代表什么？',
          options: [
            { key: 'A', text: '优势（Strengths）' },
            { key: 'B', text: '劣势（Weaknesses）' },
            { key: 'C', text: '机会（Opportunities）' },
            { key: 'D', text: '威胁（Threats）' }
          ],
          studentAnswer: ['B'],
          correctAnswer: ['C'],
          isCorrect: false,
          analysis: 'SWOT分析中，S代表优势（Strengths），W代表劣势（Weaknesses），O代表机会（Opportunities），T代表威胁（Threats）。'
        },
        {
          id: 5,
          type: 'fill',
          stem: '管理的四大基本职能包括计划、组织、____和控制。',
          blanks: [
            { studentAnswer: '领导', correctAnswer: '领导', isCorrect: true }
          ],
          isCorrect: true,
          analysis: '管理的四大基本职能是：计划、组织、领导和控制。'
        },
        {
          id: 6,
          type: 'single',
          stem: '下列哪项不属于计划职能的内容？',
          options: [
            { key: 'A', text: '确定组织目标' },
            { key: 'B', text: '制定实施方案' },
            { key: 'C', text: '评估员工绩效' },
            { key: 'D', text: '分配资源' }
          ],
          studentAnswer: ['C'],
          correctAnswer: ['C'],
          isCorrect: true,
          analysis: '评估员工绩效属于控制职能，而非计划职能。计划职能主要包括确定目标、制定方案和分配资源等内容。'
        },
        {
          id: 7,
          type: 'multi',
          stem: '有效的组织结构设计应遵循哪些原则？',
          options: [
            { key: 'A', text: '统一指挥原则' },
            { key: 'B', text: '管理幅度原则' },
            { key: 'C', text: '随机应变原则' },
            { key: 'D', text: '职权对等原则' }
          ],
          studentAnswer: ['A', 'B', 'D'],
          correctAnswer: ['A', 'B', 'D'],
          isCorrect: true,
          analysis: '有效的组织结构设计应遵循统一指挥、管理幅度和职权对等等原则，随机应变是领导风格而非组织结构设计原则。'
        },
        {
          id: 8,
          type: 'judge',
          stem: '正式组织是组织图上可见的关系，非正式组织是看不见的人际关系网络。',
          options: [
            { key: 'A', text: '正确' },
            { key: 'B', text: '错误' }
          ],
          studentAnswer: ['B'],
          correctAnswer: ['A'],
          isCorrect: false,
          analysis: '这个说法是正确的。正式组织通过组织图等文件明确规定，非正式组织则是自发形成的人际关系网络，两者共同影响着组织的运作。'
        },
        {
          id: 9,
          type: 'fill',
          stem: '按照决策的重要性，可以将决策分为战略决策、战术决策和____决策。',
          blanks: [
            { studentAnswer: '操作', correctAnswer: '业务', isCorrect: false }
          ],
          isCorrect: false,
          analysis: '按重要性分类，决策分为战略决策、战术决策和业务决策三个层次。'
        },
        {
          id: 10,
          type: 'single',
          stem: '马斯洛需求层次理论中，最高层次的需求是？',
          options: [
            { key: 'A', text: '安全需求' },
            { key: 'B', text: '社交需求' },
            { key: 'C', text: '尊重需求' },
            { key: 'D', text: '自我实现需求' }
          ],
          studentAnswer: ['D'],
          correctAnswer: ['D'],
          isCorrect: true,
          analysis: '马斯洛将人类需求从低到高分为五个层次：生理需求、安全需求、社交需求、尊重需求和自我实现需求。自我实现是最高层次。'
        }
      ]
    }
  },
  methods: {
    typeLabel(type) {
      const map = { single: '单选题', multi: '多选题', judge: '判断题', fill: '填空题' }
      return map[type] || type
    },
    isCorrectOpt(q, opt) {
      return q.correctAnswer && q.correctAnswer.includes(opt.key)
    },
    isStudentChose(q, opt) {
      return q.studentAnswer && q.studentAnswer.includes(opt.key)
    },
    getOptionClass(q, opt) {
      const studentChose = this.isStudentChose(q, opt)
      const isCorrect = this.isCorrectOpt(q, opt)
      if (studentChose && isCorrect) return 'sad__q-option--student-correct'
      if (studentChose && !isCorrect) return 'sad__q-option--student-wrong'
      if (!studentChose && isCorrect) return 'sad__q-option--answer-correct'
      return ''
    },
    getOptionTexts(q, keys) {
      if (!keys || !keys.length) return '未作答'
      return keys.map(k => {
        const opt = q.options && q.options.find(o => o.key === k)
        return opt ? `${k}. ${opt.text}` : k
      }).join('；')
    },
    scrollToQuestion(id) {
      const el = document.getElementById('sad-q-' + id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  },
  computed: {
    computedExamInfo() {
      const total = this.questions.length
      const correct = this.questions.filter(q => q.isCorrect).length
      return {
        totalCount: total,
        correctCount: correct,
        correctRate: total > 0 ? Math.round((correct / total) * 100) : 0
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        const total = this.questions.length
        const correct = this.questions.filter(q => q.isCorrect).length
        this.examInfo.totalCount = total
        this.examInfo.correctCount = correct
        this.examInfo.correctRate = total > 0 ? Math.round((correct / total) * 100) : 0
      }
    }
  }
}
</script>

<style scoped>
/* ===== 整体布局 ===== */
.sad {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #F5F6FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 3000;
}

/* ===== 顶部标题栏 ===== */
.sad__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  background: #fff;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
}
.sad__back {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  min-width: 80px;
}
.sad__back:hover { color: #0049FF; }
.sad__back-arrow {
  width: 15px;
  height: 15px;
  object-fit: contain;
  display: block;
}
.sad__back-text { font-size: 14px; }
.sad__title {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  text-align: center;
  flex: 1;
}
.sad__header-right { min-width: 80px; }

/* ===== 考试信息栏 ===== */
.sad__info-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
  font-size: 14px;
  color: #555;
}
.sad__info-val { color: #333333; font-weight: 500; }
.sad__info-val--score { color: #0049FF; font-weight: 700; font-size: 15px; }
.sad__info-val--rate { color: #00C853; font-weight: 600; }

/* ===== 主体内容 ===== */
.sad__body {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  overflow: hidden;
}

/* ===== 左侧题目列表 ===== */
.sad__questions {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}
.sad__questions::-webkit-scrollbar { width: 4px; }
.sad__questions::-webkit-scrollbar-thumb { background: #D9D9D9; border-radius: 2px; }

/* 题目卡片 */
.sad__question-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

/* 题目头部 */
.sad__q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.sad__q-type-tag {
  display: inline-block;
  padding: 0 10px;
  height: 28px;
  line-height: 28px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.sad__q-type-tag--single { background: #0049FF; }
.sad__q-type-tag--multi  { background: #9C27B0; }
.sad__q-type-tag--judge  { background: #FF6D00; }
.sad__q-type-tag--fill   { background: #00897B; }

.sad__q-index {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}
.sad__q-result {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}
.sad__q-result--correct { color: #00C853; }
.sad__q-result--wrong   { color: #FF2E00; }
.sad__q-result-icon { font-size: 13px; }

/* 题干 */
.sad__q-stem {
  font-size: 15px;
  color: #333333;
  line-height: 1.7;
  margin-bottom: 14px;
}
.sad__q-multi-hint {
  font-size: 13px;
  color: #888;
  margin-left: 4px;
}

/* ===== 选项样式 ===== */
.sad__q-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.sad__q-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 17px 16px;
  border-radius: 6px;
  font-size: 14px;
  color: #666666;
  background: #F8F8F8;
  position: relative;
   border: 2px solid #F8F8F8;
}
.sad__q-opt-key {
  font-weight: 500;
  min-width: 20px;
}
.sad__q-opt-text { flex: 1; }
.sad__q-opt-icon {
  font-size: 15px;
  font-weight: 700;
  margin-left: auto;
}
.sad__q-opt-icon--correct { color: #00C853; }
.sad__q-opt-icon--wrong   { color: #FF2E00; }

/* 学生选对了 => 绿色背景+绿色边框 */
.sad__q-option--student-correct {
  background: #E8F5E9;
  border-color: #00C853;
  color: #00C853;
  border: 2px solid #00C853;
}
/* 学生选错了 => 红色背景+红色边框 */
.sad__q-option--student-wrong {
  background: #FFEBEE;
  border-color: #FF2E00;
  color: #FF2E00;
   border: 2px solid #FF2E00;
}
/* 正确答案（学生未选） => 绿色边框 */
.sad__q-option--answer-correct {
  background: #E8F5E9;
  border-color: #00C853;
  color: #00C853;
}

/* ===== 填空题 ===== */
.sad__fill-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
  border-radius: 6px;
  overflow: hidden;
}
.sad__fill-item {
  display: flex;
  flex-direction: column;
}
.sad__fill-block {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
  padding: 16px 16px;
  font-size: 14px;
}
.sad__fill-block:last-child { border-bottom: none; }
.sad__fill-block--correct { background: #FAFAFA; }
.sad__fill-block--wrong   { background: #F8F9FA; }
.sad__fill-block--right   { background: #F0FFF4; }
.sad__fill-block-label {
  color: #888;
  white-space: nowrap;
  font-size: 12px;
}
.sad__fill-block-answer {
  font-size: 14px;
  font-weight: 400;
}
.sad__fill-block-answer--correct { color: #00C853; }
.sad__fill-block-answer--wrong   { color: #FF2E00; }
.sad__fill-block-answer--right   { color: #00C853; }

/* ===== 答案解析 ===== */
.sad__analysis {
  background: #FFFBF0;
  border: 1px solid #FFFBEB;
  border-left: 4px solid #FFA726;
  border-radius: 4px;
  padding: 16px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.sad__analysis-label {
  color: #666666;
  font-weight: 500;
}
.sad__analysis-text{
  color: #333333;
  font-size: 14px;
}
/* ===== 右侧做题看板 ===== */
.sad__board {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  align-self: flex-start;
  position: sticky;
  top: 0;
}
.sad__board-title {
  font-size: 15px;
  font-weight: bold;
  color: #222;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}
.sad__board-stats {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-bottom: 18px;
}
.sad__board-stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.sad__board-stat-label { color: #666666; }
.sad__board-stat-val { font-weight: 600; color: #333333; }
.sad__board-stat-val--correct { color: #00C853; }
.sad__board-stat-val--wrong   { color: #FF2E00; }
.sad__board-stat-val--rate    { color: #0049FF; }

/* 题目导航 */
.sad__board-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid #F0F0F0;
}
.sad__board-nav-btn {
  width: 47.8px;
  height: 47.8px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  outline: none;
}
.sad__board-nav-btn:hover {
  opacity: 0.85;
  transform: scale(1.05);
}
.sad__board-nav-btn--correct {
  background: #E8F5E9;
  color: #00C853;
}
.sad__board-nav-btn--wrong {
  background: #FFEBEE;
  color: #FF2E00;
}
</style>
