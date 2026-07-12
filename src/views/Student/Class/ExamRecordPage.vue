<template>
  <div class="exam-record-page">
    <!-- 顶部 Header -->
    <div class="exam-record-header">
      <div class="exam-record-header-left" @click="handleBack">
        <div class="exam-record-back-btn">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L1 7L7 13" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="exam-record-header-title">考试记录</span>
      </div>
    </div>

    <!-- 做题详情子页面 -->
    <StudentAnswerDetail
      :visible="showDetail"
      :record-id="selectedRecord ? selectedRecord.id : ''"
      :attempt-index="selectedIndex"
      @close="showDetail = false"
    />

    <!-- 错题提升巩固子页面 -->
    <WrongExercisePage
      :visible="showWrongExercise"
      :record-id="wrongRecord ? wrongRecord.id : ''"
      @close="showWrongExercise = false"
    />

    <!-- 课后测报告 -->
    <AfterClassReport
      :visible="showReport"
      :class-id="reportClassId"
      :record-id="reportRecordId"
      :report-url="reportUrl"
      @close="showReport = false"
    />

    <!-- 内容区 -->
    <div class="exam-record-body" v-loading="loading">
      <!-- 顶部汇总横幅 -->
      <div class="exam-record-banner">
        <div class="exam-record-banner__title">{{ examInfo.name || '考试' }}</div>
        <div class="exam-record-banner__stats">
          <div class="exam-record-banner__stat">
            <div class="exam-record-banner__stat-label">考试次数</div>
            <div class="exam-record-banner__stat-value">{{ summary.examCount }} <span class="exam-record-banner__stat-unit">次</span></div>
          </div>
          <div class="exam-record-banner__stat">
            <div class="exam-record-banner__stat-label">最高分</div>
            <div class="exam-record-banner__stat-value">{{ summary.maxScore }} <span class="exam-record-banner__stat-unit">分</span></div>
          </div>
          <div class="exam-record-banner__stat">
            <div class="exam-record-banner__stat-label">最好正确</div>
            <div class="exam-record-banner__stat-value">{{ summary.maxCorrect }} <span class="exam-record-banner__stat-unit">题</span></div>
          </div>
        </div>
      </div>

      <!-- 考试记录卡片网格 -->
      <div class="exam-record-grid">
        <div
          class="exam-record-card"
          v-for="(record, index) in recordList"
          :key="record.id"
        >
          <div class="exam-record-card__header">
            <div class="exam-record-card__header-left">
              <div class="exam-record-card__title">第 {{ index + 1 }} 次考试</div>
              <div class="exam-record-card__time">{{ formatExamTime(record.examTime) }}</div>
            </div>
            <span class="exam-record-card__score">{{ record.score }} 分</span>
          </div>

          <div class="exam-record-card__progress">
            <span class="exam-record-card__progress-label">正确数量</span>
            <span class="exam-record-card__progress-value">{{ record.correctNum }} / {{ record.totalNum }} 题</span>
          </div>

          <div class="exam-record-card__actions">
            <button
            v-if="record.reportUrl"
              class="exam-record-card__btn exam-record-card__btn--outline"
              @click="handleViewReport(record)"
            >查看报告</button>
            <button
              class="exam-record-card__btn exam-record-card__btn--detail"
              @click="handleViewDetail(record, index)"
            >查看详情</button>
            <button
              v-if="record.hasErrorExercises === '1'"
              class="exam-record-card__btn exam-record-card__btn--primary"
              @click="handleWrongReview(record)"
            >错题提升</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && recordList.length === 0" class="exam-record-empty">
        <span class="exam-record-empty-text">暂无考试记录</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getAfterQuizRecordList } from '@/api/modules/teacher'
import StudentAnswerDetail from './StudentAnswerDetail.vue'
import WrongExercisePage from './WrongExercisePage.vue'
import AfterClassReport from '@/views/teacher/Class/AfterClassReport.vue'

export default {
  name: 'ExamRecordPage',
  components: { StudentAnswerDetail, WrongExercisePage, AfterClassReport },
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
      recordList: [],
      loading: false,
      showDetail: false,
      selectedRecord: null,
      selectedIndex: 1,
      showWrongExercise: false,
      wrongRecord: null,
      showReport: false,
      reportClassId: '',
      reportRecordId: '',
      reportUrl:''
    }
  },
  computed: {
    summary() {
      const list = this.recordList || []
      if (!list.length) {
        return { examCount: 0, maxScore: 0, maxCorrect: 0 }
      }
      let maxScore = Number(list[0].score) || 0
      let maxCorrect = Number(list[0].correctNum) || 0
      list.forEach(item => {
        const score = Number(item.score) || 0
        const correct = Number(item.correctNum) || 0
        if (score > maxScore) maxScore = score
        if (correct > maxCorrect) maxCorrect = correct
      })
      return {
        examCount: list.length,
        maxScore,
        maxCorrect
      }
    }
  },
  created() {
    this.fetchRecordList()
  },
  methods: {
    async fetchRecordList() {
      const examId = this.examInfo && this.examInfo.id
      if (!examId) return
      this.loading = true
      try {
        const res = await getAfterQuizRecordList({ examId, classId: this.classId })
        this.recordList = res.data.map(item => ({
          ...item,
          examTime: item.startTime || item.createTime || '',
          totalNum: item.topicNum || 0
        }))
      } catch (e) {
        this.recordList = []
      } finally {
        this.loading = false
      }
    },
    formatExamTime(time) {
      if (!time) return '-'
      const str = String(time).replace(/-/g, '.')
      // 保留到分钟：2026.07.16 21:32
      if (str.length >= 16) return str.substring(0, 16)
      return str
    },
    handleBack() {
      this.$emit('back')
    },
    handleViewReport(record) {
      this.reportClassId = this.classId || (this.examInfo && this.examInfo.classId) || ''
      this.reportRecordId = record.id || record.recordId || ''
      this.reportUrl = record.reportUrl ||''
      this.showReport = true
    },
    handleViewDetail(record, index) {
      this.selectedRecord = record
      this.selectedIndex = index + 1
      this.showDetail = true
    },
    handleWrongReview(record) {
      this.wrongRecord = record
      this.showWrongExercise = true
    }
  }
}
</script>

<style scoped lang="scss">
.exam-record-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

/* Header */
.exam-record-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  flex-shrink: 0;
  background: #F8FAFC;
}

.exam-record-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.exam-record-back-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.exam-record-header-left:hover .exam-record-back-btn {
  border-color: #1F7CFF;
}

.exam-record-header-left:hover .exam-record-back-btn svg path {
  stroke: #1F7CFF;
}

.exam-record-header-title {
  font-size: 20px;
  font-weight: bold;
  color: #020618;
  line-height: 1.2;
}

/* Body */
.exam-record-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 28px;
  box-sizing: border-box;
}

/* Banner */
.exam-record-banner {
  background: linear-gradient(90deg, #155DFC 0%, #00BCFF 100%);
  border-radius: 16px;
  padding: 24px 28px;
  box-sizing: border-box;
  margin-bottom: 20px;
  box-shadow: 0px 4px 12px -2px rgba(21, 93, 252, 0.25);

  &__title {
    font-size: 18px;
    font-weight: bold;
    color: #FFFFFF;
    line-height: 1.4;
    margin-bottom: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__stats {
    display: flex;
    align-items: flex-start;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__stat-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.2;
  }

  &__stat-value {
    font-size: 28px;
    font-weight: bold;
    color: #FFFFFF;
    line-height: 1.2;
  }

  &__stat-unit {
    font-size: 14px;
    font-weight: 500;
  }
}

/* Grid */
.exam-record-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  min-height: 120px;
}

/* Card */
.exam-record-card {
  background: #FFFFFF;
  box-shadow: 0px 1px 2px -1px rgba(0, 0, 0, 0.1), 0px 1px 3px 0px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  border: 1px solid #DBEAFE;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__header-left {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: bold;
    color: #020618;
    line-height: 1.4;
    margin-bottom: 6px;
  }

  &__time {
    font-size: 12px;
    color: #90A1B9;
    line-height: 1.2;
  }

  &__score {
    flex-shrink: 0;
    height: 28px;
    padding: 0 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: bold;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    background: #ECFDF5;
    color: #22B877;
  }

  &__progress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    height: 36px;
background: rgba(239,246,255,0.7);
border-radius: 10px 10px 10px 10px;
padding: 0 12px;
box-sizing: border-box;
  }

  &__progress-label {
    font-size: 11px;
    color: #90A1B9;
  }

  &__progress-value {
    font-size: 14px;
    font-weight: bold;
    color: #1F7CFF;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    margin-top: auto;
  }

  &__btn {
    height: 40px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;
    outline: none;
    white-space: nowrap;
    text-align: center;
    line-height: 40px;
    padding: 0 16px;
    min-width: 88px;

    &--outline {
      background: #FFFFFF;
      border-radius: 10px;
      border: 1px solid #BFE0FF;
      color: #1F7CFF;
    }

    &--detail {
      background: #EFF6FF;
      border-radius: 10px;
      color: #1F7CFF;
      border: none;
    }

    &--primary {
      background: linear-gradient(90deg, #155DFC 0%, #00BCFF 100%);
      box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
      border-radius: 10px;
      color: #FFFFFF;
      border: none;
    }
  }
}

/* Empty */
.exam-record-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
}

.exam-record-empty-text {
  font-size: 14px;
  color: #999999;
}

@media (max-width: 1024px) {
  .exam-record-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .exam-record-grid {
    grid-template-columns: 1fr;
  }
}
</style>
