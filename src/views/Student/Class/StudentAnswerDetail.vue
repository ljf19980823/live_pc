<template>
  <div class="sad" v-if="visible">
    <!-- 顶部标题栏 -->
    <div class="sad__header">
      <div class="sad__back" @click="$emit('close')">
        <img src="@/assets/images/class/back_icon.png" class="sad__back-arrow" alt="返回" />
        <span class="sad__back-text">返回</span>
      </div>
      <div class="sad__title">第{{ attemptIndex }}次 - 做题详情</div>
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

    <!-- 加载中 -->
    <div v-if="loading" class="sad__loading">
      <span>加载中...</span>
    </div>

    <!-- 主体内容 -->
    <div v-else class="sad__body">
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
            <span class="sad__q-type-tag">{{ q.questName || typeLabel(q.type) }}</span>
            <span class="sad__q-index">第 {{ idx + 1 }} 题</span>
            <span v-if="q.isPending" class="sad__q-result sad__q-result--pending">
              <span class="sad__q-result-icon">—</span>
              待判定
            </span>
            <span v-else class="sad__q-result" :class="q.isCorrect ? 'sad__q-result--correct' : 'sad__q-result--wrong'">
              <span class="sad__q-result-icon">{{ q.isCorrect ? '✓' : '✗' }}</span>
              {{ q.isCorrect ? '回答正确' : '回答错误' }}
            </span>
          </div>

          <!-- 材料 -->
          <div v-if="q.material" class="sad__q-material">{{ q.material }}</div>

          <!-- 题目题干 -->
          <div class="sad__q-stem">
            <img v-if="q.stemIsImg" :src="q.stem" class="sad__rich-img" />
            <span v-else v-html="q.stem"></span>
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
              <span class="sad__q-opt-text">
                <img v-if="opt.isImg" :src="opt.text" class="sad__rich-img" />
                <span v-else v-html="opt.text"></span>
              </span>
              <span v-if="isStudentChose(q, opt) && isCorrectOpt(q, opt)" class="sad__q-opt-icon sad__q-opt-icon--correct">✓</span>
              <span v-else-if="isStudentChose(q, opt) && !isCorrectOpt(q, opt)" class="sad__q-opt-icon sad__q-opt-icon--wrong">✗</span>
              <span v-else-if="!isStudentChose(q, opt) && isCorrectOpt(q, opt) && q.type !== 'multi'" class="sad__q-opt-icon sad__q-opt-icon--correct">✓</span>
              <span v-else-if="!isStudentChose(q, opt) && isCorrectOpt(q, opt) && q.type === 'multi'" class="sad__q-opt-icon sad__q-opt-icon--missed">✗</span>
            </div>
          </div>

          <!-- 单选/多选/判断题 学生答案 -->
          <div v-if="q.type === 'single' || q.type === 'multi' || q.type === 'judge'" class="sad__fill-wrap">
            <div class="sad__fill-block" :class="q.isCorrect ? 'sad__fill-block--correct' : 'sad__fill-block--wrong'">
              <div class="sad__fill-block-label">我的答案：</div>
              <div class="sad__fill-block-answer" :class="q.isCorrect ? 'sad__fill-block-answer--correct' : 'sad__fill-block-answer--wrong'">
                {{ q.studentAnswer && q.studentAnswer.length ? q.studentAnswer.join('') : '未作答' }}
              </div>
            </div>
          </div>

          <!-- 填空题 学生答案 -->
          <div v-if="q.type === 'fill'" class="sad__fill-wrap">
            <div
              v-for="(blank, bi) in q.blanks"
              :key="bi"
              class="sad__fill-item"
            >
              <div class="sad__fill-block" :class="blank.isCorrect ? 'sad__fill-block--correct' : 'sad__fill-block--wrong'">
                <span class="sad__fill-block-label">我的答案：</span>
                <span class="sad__fill-block-answer" :class="blank.isCorrect ? 'sad__fill-block-answer--correct' : 'sad__fill-block-answer--wrong'">{{ blank.studentAnswer || '未作答' }}</span>
              </div>
            </div>
          </div>

          <!-- 简答/计算/论述题 学生答案 -->
          <div v-if="q.type === 'essay'" class="sad__fill-wrap">
            <div class="sad__fill-block" :class="q.isPending ? 'sad__fill-block--correct' : (q.isCorrect ? 'sad__fill-block--correct' : 'sad__fill-block--wrong')">
              <div class="sad__fill-block-label">我的答案：</div>
              <div class="sad__fill-block-answer">{{ q.studentAnswer || '未作答' }}</div>
            </div>
          </div>

          <!-- 答案解析（含正确答案） -->
          <div
            v-if="q.analysis || (q.correctAnswer && q.correctAnswer.length) || (q.blanks && q.blanks[0] && q.blanks[0].correctAnswer)"
            class="sad__analysis"
          >
            <div class="sad__analysis-label">答案解析</div>
            <!-- 正确答案行 -->
            <div class="sad__analysis-correct-row">
              <span class="sad__analysis-correct-label">{{ q.type === 'essay' ? '参考答案' : '正确答案' }}：</span>
              <!-- 选择/判断：字母 -->
              <!-- <span v-if="q.type === 'single' || q.type === 'multi' || q.type === 'judge'" class="sad__analysis-correct-val">
                {{ q.correctAnswerRaw || '-' }}
              </span> -->
              <!-- 填空 -->
              <!-- <span v-else-if="q.type === 'fill' && q.blanks && q.blanks[0]" class="sad__analysis-correct-val">
                <img v-if="q.answerIsImg" :src="q.blanks[0].correctAnswer" class="sad__rich-img" />
                <span v-else v-html="q.blanks[0].correctAnswer || '-'"></span>
              </span> -->
              <!-- 简答/主观 -->
              <span  class="sad__analysis-correct-val">
                <img v-if="q.answerIsImg" :src="q.answer" class="sad__rich-img" />
                <span v-else v-html="q.answer || '-'"></span>
              </span>
            </div>
            <!-- 解析文字 -->
            <div v-if="q.analysis" class="sad__analysis-text">
              <img v-if="q.analysisIsImg" :src="q.analysis" class="sad__rich-img" />
              <span v-else v-html="q.analysis"></span>
            </div>
          </div>
        </div>

        <div v-if="!loading && questions.length === 0" class="sad__empty">暂无做题数据</div>
      </div>

      <!-- 右侧做题看板 -->
      <div class="sad__board">
        <div class="sad__board-title">考试看板</div>
        <div class="sad__board-stats">
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">总题数：</span>
            <span class="sad__board-stat-val">{{ examInfo.totalCount }} 题</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">正确题数：</span>
            <span class="sad__board-stat-val sad__board-stat-val--correct">{{ examInfo.correctCount }} 题</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">错误题数：</span>
            <span class="sad__board-stat-val sad__board-stat-val--wrong">{{ examInfo.totalCount - examInfo.correctCount }} 题</span>
          </div>
          <div class="sad__board-stat-row">
            <span class="sad__board-stat-label">正确率：</span>
            <span class="sad__board-stat-val sad__board-stat-val--rate">{{ examInfo.correctRate }}%</span>
          </div>
        </div>
        <div class="sad__board-nav">
          <button
            v-for="(q, idx) in questions"
            :key="q.id"
            class="sad__board-nav-btn"
            :class="q.isPending ? 'sad__board-nav-btn--pending' : (q.isCorrect ? 'sad__board-nav-btn--correct' : 'sad__board-nav-btn--wrong')"
            @click="scrollToQuestion(q.id)"
          >
            <span class="sad__board-nav-btn-icon">{{ q.isPending ? '—' : (q.isCorrect ? '✓' : '✗') }}</span>
            {{ idx + 1 }}
          </button>
        </div>
        <div class="sad__board-legend">
          <span class="sad__board-legend-item">
            <span class="sad__board-legend-dot sad__board-legend-dot--correct"></span>回答正确
          </span>
          <span class="sad__board-legend-item">
            <span class="sad__board-legend-dot sad__board-legend-dot--wrong"></span>回答错误
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAfterQuizRecordDetail } from '@/api/modules/teacher'

export default {
  name: 'StudentAnswerDetail',
  props: {
    visible: { type: Boolean, default: false },
    recordId: { type: String, default: '' },
    attemptIndex: { type: Number, default: 1 }
  },
  emits: ['close'],
  data() {
    return {
      loading: false,
      examInfo: {
        examTime: '',
        score: 0,
        correctRate: 0,
        correctCount: 0,
        totalCount: 0
      },
      questions: []
    }
  },
  methods: {
    async fetchDetail() {
      if (!this.recordId) return
      this.loading = true
      this.questions = []
      try {
        const res = await getAfterQuizRecordDetail(this.recordId)
        this.mapApiData(res.data || {})
      } catch (e) {
        this.questions = []
      } finally {
        this.loading = false
      }
    },
    mapApiData(data) {
      this.examInfo = {
        examTime: data.submitTime || data.startTime || '',
        score: data.score || 0,
        correctRate: data.accuracy || 0,
        correctCount: data.correctNum || 0,
        totalCount: data.topicNum || 0
      }
      const typeMap = {
        '1': 'single', '2': 'multi', '3': 'judge',
        '4': 'fill', '5': 'essay', '6': 'essay', '7': 'essay'
      }
      const sorted = (data.details || []).sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0))
      this.questions = sorted.map(item => {
        const type = typeMap[item.questType] || 'single'
        const isCorrect = item.isCorrect === '1'
        const isPending = item.isCorrect === '3'
        const q = {
          id: item.detailId || item.topicId,
          type,
          questName: item.questName || '',
          stem: item.name || '',
          stemIsImg: item.isImg === '1',
          isCorrect,
          isPending,
          analysis: item.analysis || '',
          analysisIsImg: item.analysisIsImg === '1',
          answerIsImg: item.answerIsImg === '1',
          answer: item.answer || '',
          material: item.material || ''
        }
        if (type === 'single' || type === 'multi' || type === 'judge') {
          const optKeys = ['A', 'B', 'C', 'D', 'E']
          const optFields = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE']
          const optIsImgFields = ['optionIsImgA', 'optionIsImgB', 'optionIsImgC', 'optionIsImgD', 'optionIsImgE']
          q.options = optKeys
            .map((key, i) => ({ key, text: item[optFields[i]], isImg: item[optIsImgFields[i]] === '1' }))
            .filter(opt => opt.text)
          if (type === 'judge' && q.options.length === 0) {
            q.options = [{ key: 'A', text: '正确', isImg: false }, { key: 'B', text: '错误', isImg: false }]
          }
          q.studentAnswer = this.parseAnswer(item.studentAnswer)
          q.correctAnswer = this.parseAnswer( item.answer|| item.correctAnswer)
          q.correctAnswerRaw = item.answer || item.correctAnswer || ''
        } else if (type === 'fill') {
          q.blanks = [{
            studentAnswer: item.studentAnswer || '',
            correctAnswer: item.answer || item.correctAnswer || '',
            isCorrect
          }]
        } else {
          q.studentAnswer = item.studentAnswer || ''
          q.correctAnswer = item.answer || item.correctAnswer || ''
        }
        return q
      })
    },
    parseAnswer(str) {
      if (!str) return []
      str = str.trim()
      if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean)
      const letters = str.split('').filter(c => /[A-E]/i.test(c))
      return letters.length > 0 ? letters.map(c => c.toUpperCase()) : (str ? [str] : [])
    },
    typeLabel(type) {
      const map = { single: '单选题', multi: '多选题', judge: '判断题', fill: '填空题', essay: '主观题' }
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
  watch: {
    visible(val) {
      if (val && this.recordId) {
        this.fetchDetail()
      }
    },
    recordId(val) {
      if (val && this.visible) {
        this.fetchDetail()
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

/* ===== 加载中 ===== */
.sad__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
}

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
  background: #0049FF;
}
.sad__q-type-tag--single { background: #0049FF; }
.sad__q-type-tag--multi  { background: #9C27B0; }
.sad__q-type-tag--judge  { background: #FF6D00; }
.sad__q-type-tag--fill   { background: #00897B; }
.sad__q-type-tag--essay  { background: #607D8B; }

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
.sad__q-result--pending { color: #FF9800; }
.sad__q-result-icon { font-size: 13px; }

/* 材料 */
.sad__q-material {
  font-size: 13px;
  color: #777;
  background: #F8F9FA;
  border-left: 3px solid #BDBDBD;
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 12px;
  line-height: 1.6;
}

/* 题干 */
.sad__q-stem {
  font-size: 15px;
  color: #333333;
  line-height: 1.7;
  margin-bottom: 14px;
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
.sad__q-opt-icon--missed  { color: #FF2E00; }

/* 学生选对了 => 绿色背景+绿色边框 */
.sad__q-option--student-correct {
  background: #E8F5E9;
  border: 2px solid #00C853;
  color: #00C853;
}
/* 学生选错了 => 红色背景+红色边框 */
.sad__q-option--student-wrong {
  background: #FFEBEE;
  border: 2px solid #FF2E00;
  color: #FF2E00;
}
/* 正确答案（学生未选） => 绿色边框 */
.sad__q-option--answer-correct {
  background: #E8F5E9;
  border-color: #00C853;
  color: #00C853;
}

/* ===== 填空题 / 主观题 ===== */
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
  font-size: 13px;
  color: #666;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sad__analysis-label {
  color: #333333;
  font-weight: 600;
  font-size: 14px;
}
.sad__analysis-correct-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px;
}
.sad__analysis-correct-label {
  color: #666666;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}
.sad__analysis-correct-val {
  color: #333333;
  font-size: 14px;
  font-weight: 500;
}
.sad__analysis-text {
  color: #555555;
  font-size: 14px;
  line-height: 1.7;
}

/* ===== 富文本 / 图片 ===== */
.sad__rich-img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
  border-radius: 4px;
  margin: 4px 0;
    mix-blend-mode: multiply!important;
}
/* 题干、选项内嵌 HTML 中的图片自动限宽 */
.sad__q-stem img,
.sad__q-opt-text img,
.sad__analysis-text img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  margin: 4px 0;
}

/* ===== 空状态 ===== */
.sad__empty {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 60px 0;
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
  margin-bottom: 16px;
}
.sad__board-nav-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sad__board-nav-btn:hover {
  opacity: 0.85;
  transform: scale(1.05);
}
.sad__board-nav-btn-icon {
  position: absolute;
  top: 4px;
  right: 5px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
.sad__board-nav-btn--correct {
  background: #00C853;
  color: #fff;
}
.sad__board-nav-btn--wrong {
  background: #F44336;
  color: #fff;
}
.sad__board-nav-btn--pending {
  background: #FF9800;
  color: #fff;
}

/* 图例 */
.sad__board-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}
.sad__board-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}
.sad__board-legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}
.sad__board-legend-dot--correct { background: #00C853; }
.sad__board-legend-dot--wrong   { background: #F44336; }
</style>
