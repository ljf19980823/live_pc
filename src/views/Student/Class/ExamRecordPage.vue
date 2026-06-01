<template>
  <div class="exam-record-page">
    <!-- 顶部 Header -->
    <div class="exam-record-header">
      <div class="exam-record-header-left" @click="handleBack">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1L1 7L7 13" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="exam-record-back-text">返回</span>
      </div>
      <div class="exam-record-header-title">{{ examInfo.className || '立升备课' }} - {{ examInfo.name || '考试' }} - 考试记录</div>
      <div class="exam-record-header-right"></div>
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

  <!-- 内容区 -->
  <div class="exam-record-body">
    <div class="exam-record-list">
        <div
          class="exam-record-item"
          v-for="(record, index) in recordList"
          :key="record.id"
        >
          <!-- 左侧：第X次 -->
          <div class="exam-record-index">第 {{ index+1}} 次</div>

          <!-- 中间信息 -->
          <div class="exam-record-info">
            <div class="exam-record-info-col">
              <span class="exam-record-label">考试时间</span>
              <span class="exam-record-value">{{ record.examTime }}</span>
            </div>
            <div class="exam-record-info-col">
              <span class="exam-record-label">考试分数</span>
              <span class="exam-record-score">{{ record.score }}<span class="exam-record-score_unit">分</span></span>
            </div>
            <div class="exam-record-info-col">
              <span class="exam-record-label">做题正确数量</span>
              <span class="exam-record-value">{{ record.correctNum }}/{{ record.totalNum }}</span>
            </div>
          </div>

          <!-- 右侧操作按钮 -->
          <div class="exam-record-actions">
            <button class="exam-record-btn-outline" @click="handleViewDetail(record, index)">查看详情</button>
            <button v-if="record.hasErrorExercises === '1'" class="exam-record-btn-primary" @click="handleWrongReview(record)">
              <img src="@/assets/images/class/ct_icon.png" class="exam-record-btn-primary_img" alt="">
              错题提升巩固
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="recordList.length === 0" class="exam-record-empty">
          
          <span class="exam-record-empty-text">暂无考试记录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAfterQuizRecordList } from '@/api/modules/teacher'
import StudentAnswerDetail from './StudentAnswerDetail.vue'
import WrongExercisePage from './WrongExercisePage.vue'

export default {
  name: 'ExamRecordPage',
  components: { StudentAnswerDetail, WrongExercisePage },
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
      wrongRecord: null
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
        const res = await getAfterQuizRecordList({ examId })
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
    handleBack() {
      this.$emit('back')
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

<style scoped>
.exam-record-page {
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
.exam-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
  background: #fff;
}
.exam-record-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  min-width: 80px;
  user-select: none;
}
.exam-record-header-left:hover {
  color: #0049FF;
}
.exam-record-header-left:hover svg path {
  stroke: #0049FF;
}
.exam-record-back-text {
  font-size: 14px;
  color: #333333;
}
.exam-record-header-title {
  font-size: 20px;
  font-weight: bold;
  color: #333333;
  text-align: center;
  flex: 1;
}
.exam-record-header-right {
  min-width: 80px;
}

/* Body */
.exam-record-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  box-sizing: border-box;
}

/* List */
.exam-record-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
 width: 100%;
  margin: 0 auto;
}

/* Item */
.exam-record-item {
  background: #fff;
  border-radius: 12px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 40px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* Index */
.exam-record-index {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
  min-width: 64px;
  flex-shrink: 0;
}

/* Info */
.exam-record-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 70px;
}
.exam-record-info-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.exam-record-label {
  font-size: 12px;
  color: #999999;
}
.exam-record-value {
  font-size: 14px;
  color: #333333;
  font-weight: 500;
}
.exam-record-score {
  font-size: 20px;
  font-weight: bold;
  color: #0049FF;
}
.exam-record-score_unit{
  font-size: 14px;
}
/* Actions */
.exam-record-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.exam-record-btn-outline {
  height: 37.5px;
  padding: 0 20px;
  border: 1.5px solid #DCDCDC;
  background: #fff;
  color: #333333;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  white-space: nowrap;
}
.exam-record-btn-outline:hover {
  border-color: #0049FF;
  color: #0049FF;
}
.exam-record-btn-primary {
  height: 36px;
  padding: 0 16px;
  background: #FF6600;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.exam-record-btn-primary:hover {
  background: #e05a00;
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
.exam-record-btn-primary_img{
  width:16px ;
  height: 16px;
}
</style>
