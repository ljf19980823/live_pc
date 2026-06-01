<template>
  <div class="act-detail" v-if="visible">
    <!-- 顶部标题栏 -->
    <div class="act-detail__header">
      <div class="act-detail__back" @click="$emit('close')">
        <img src="@/assets/images/class/back_icon.png" class="act-detail__back-arrow" alt="返回" />
        <span class="act-detail__back-text">返回</span>
      </div>
      <div class="act-detail__title">{{ className }} - 学生做题情况</div>
      <div class="act-detail__header-right"></div>
    </div>

    <!-- 统计栏 -->
    <div class="act-detail__stats">
      <div class="act-detail__stats-left">
        <span class="act-detail__stats-item">总人数：<span class="act-detail__stats-val">{{ leaderboardData.totalStudentCount || 0 }}</span></span>
        <span class="act-detail__stats-item">已完成：<span class="act-detail__stats-val" style="color:#00C853">{{ leaderboardData.finishedStudentCount || 0 }}</span></span>
        <span class="act-detail__stats-item">未完成：<span class="act-detail__stats-val" style="color:#FF2E00">{{ leaderboardData.unFinishedStudentCount || 0 }}</span></span>
        <span class="act-detail__stats-item">完成率：<span class="act-detail__stats-val act-detail__stats-val--blue">{{ leaderboardData.finishedPercentage || 0 }}%</span></span>
      </div>
      <div class="act-detail__filter-btns">
        <button
          class="act-detail__filter-btn"
          :class="{ 'act-detail__filter-btn--active': filterTab === 'done' }"
          @click="filterTab = 'done'"
        >已做题</button>
        <button
          class="act-detail__filter-btn"
          :class="{ 'act-detail__filter-btn--active': filterTab === 'undone' }"
          @click="filterTab = 'undone'"
        >未做题</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="act-detail__table-wrap" v-loading="loading">
      <!-- 已做题排行榜 -->
      <template v-if="filterTab === 'done'">
        <table class="act-detail__table" v-if="leaderboardItems.length > 0">
          <thead>
            <tr>
              <th>排名</th>
              <th>学生姓名</th>
              <th>得分</th>
              <th>正确题数</th>
              <th>提交时间</th>
              <th>考试时长</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in leaderboardItems" :key="row.studentId || index">
              <td>
                <span class="act-detail__rank" :class="getRankClass(index + 1)">{{ index + 1 }}</span>
              </td>
              <td class="act-detail__td-student">
                <!-- <img
                  v-if="row.profilePicture"
                  :src="row.profilePicture"
                  class="act-detail__avatar"
                  alt=""
                />
                <span class="act-detail__avatar-placeholder" v-else>{{ (row.studentName || '').charAt(0) }}</span> -->
                <span class="act-detail__td-name">{{ row.studentName || '--' }}</span>
              </td>
              <td>
                <span class="act-detail__score">{{ row.score != null ? row.score + '分' : '--' }}</span>
              </td>
              <td>
                <span class="act-detail__correct">{{ row.correctNum }}/{{ row.topicNum }}</span>
              </td>
              <td class="act-detail__td-time">{{ row.submitTime || '--' }}</td>
              <td class="act-detail__td-time">{{ formatDuration(row.examDuration) }}</td>
              <td>
                <button class="act-detail__detail-btn" @click="openStudentDetail(row)">做题详情</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="act-detail__empty">暂无已做题学生数据</div>
      </template>

      <!-- 未做题列表 -->
      <template v-else>
        <div v-loading="unSubmitLoading">
          <table class="act-detail__table" v-if="unSubmitList.length > 0">
            <thead>
              <tr>
                <th>序号</th>
                <th>学生</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in unSubmitList" :key="row.studentId || index">
                <td>{{ index + 1 }}</td>
                <td class="act-detail__td-student">
                  <img
                    v-if="row.profilePicture"
                    :src="row.profilePicture"
                    class="act-detail__avatar"
                    alt=""
                  />
                
                  <span class="act-detail__td-name">{{ row.studentName || '--' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else-if="!unSubmitLoading" class="act-detail__empty">全部学生已完成做题</div>
        </div>
      </template>
    </div>

    <!-- 学生做题详情子组件 -->
    <StudentAnswerDetail
      :visible="studentDetailVisible"
      :student-name="currentStudent.studentName || ''"
      :record-id="currentStudent.recordId || ''"
      :attempt-index="currentStudent.attemptIndex || 1"
      @close="studentDetailVisible = false"
    />
  </div>
</template>

<script>
import StudentAnswerDetail from './StudentAnswerDetail.vue'
import { getAfterQuizLeaderboard, getAfterQuizUnSubmitList } from '@/api'

export default {
  name: 'AfterClassTestDetail',
  components: { StudentAnswerDetail },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    },
    courseInfo: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close'],
  data() {
    return {
      filterTab: 'done',
      loading: false,
      unSubmitLoading: false,
      leaderboardData: {
        finishedStudentCount: 0,
        unFinishedStudentCount: 0,
        totalStudentCount: 0,
        finishedPercentage: 0,
        leaderboardItems: []
      },
      unSubmitList: [],
      studentDetailVisible: false,
      currentStudent: {}
    }
  },
  computed: {
    leaderboardItems() {
      return this.leaderboardData.leaderboardItems || []
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.filterTab = 'done'
        this.fetchAll()
      }
    },
    courseInfo(val) {
      if (this.visible && val && val.examConfigId) {
        this.fetchAll()
      }
    },
    filterTab(val) {
      if (val === 'done') {
        this.fetchLeaderboard()
      } else {
        this.fetchUnSubmitList()
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.fetchAll()
    }
  },
  methods: {
    fetchAll() {
      this.fetchLeaderboard()
      this.fetchUnSubmitList()
    },
    async fetchLeaderboard() {
      const examConfigId = this.courseInfo && this.courseInfo.examConfigId
      if (!examConfigId) return
      this.loading = true
      try {
        const res = await getAfterQuizLeaderboard(examConfigId)
        if (res && res.data) {
          this.leaderboardData = {
            finishedStudentCount: res.data.finishedStudentCount || 0,
            unFinishedStudentCount: res.data.unFinishedStudentCount || 0,
            totalStudentCount: res.data.totalStudentCount || 0,
            finishedPercentage: res.data.finishedPercentage || 0,
            leaderboardItems: res.data.leaderboardItems || []
          }
        }
      } catch (e) {
        console.error('获取排行榜失败', e)
      } finally {
        this.loading = false
      }
    },
    async fetchUnSubmitList() {
      const examConfigId = this.courseInfo && this.courseInfo.examConfigId
      if (!examConfigId) return
      this.unSubmitLoading = true
      try {
        const res = await getAfterQuizUnSubmitList(examConfigId)
        this.unSubmitList = (res && res.data) ? res.data : []
      } catch (e) {
        console.error('获取未提交学生列表失败', e)
        this.unSubmitList = []
      } finally {
        this.unSubmitLoading = false
      }
    },
    getRankClass(rank) {
      if (rank === 1) return 'act-detail__rank--gold'
      if (rank === 2) return 'act-detail__rank--silver'
      if (rank === 3) return 'act-detail__rank--bronze'
      return ''
    },
    formatDuration(seconds) {
      if (!seconds && seconds !== 0) return '--'
      const s = parseInt(seconds, 10)
      if (isNaN(s)) return seconds
      if (s < 60) return s + '秒'
      const m = Math.floor(s / 60)
      const rem = s % 60
      return rem > 0 ? `${m}分${rem}秒` : `${m}分钟`
    },
    openStudentDetail(row) {
      this.currentStudent = {
        studentName: row.studentName,
        recordId: row.recordId,
        examId: row.examId
      }
      this.studentDetailVisible = true
    }
  }
}
</script>

<style scoped>
.act-detail {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

/* 顶部标题栏 */
.act-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 14px;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
}
.act-detail__back {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  min-width: 60px;
}
.act-detail__back:hover {
  color: #0049FF;
}
.act-detail__back-arrow {
  width: 15px;
  height: 15px;
  object-fit: contain;
  display: block;
}
.act-detail__back-text {
  font-size: 14px;
}
.act-detail__title {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  text-align: center;
  flex: 1;
}
.act-detail__header-right {
  min-width: 60px;
}

/* 统计栏 */
.act-detail__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid #F0F0F0;
  flex-shrink: 0;
}
.act-detail__stats-left {
  display: flex;
  align-items: center;
  gap: 24px;
}
.act-detail__stats-item {
  font-size: 14px;
  color: #555;
}
.act-detail__stats-val {
  font-weight: 600;
  color: #222;
}
.act-detail__stats-val--blue {
  color: #0049FF;
}

/* 切换按钮 */
.act-detail__filter-btns {
  display: flex;
  align-items: center;
  border: 1px solid #E0E0E0;
  border-radius: 6px;
  overflow: hidden;
}
.act-detail__filter-btn {
  padding: 6px 20px;
  font-size: 13px;
  color: #555;
  background: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  outline: none;
}
.act-detail__filter-btn + .act-detail__filter-btn {
  border-left: 1px solid #E0E0E0;
}
.act-detail__filter-btn--active {
  background: #0049FF;
  color: #fff;
}

/* 表格区域 */
.act-detail__table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}
.act-detail__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}
.act-detail__table thead tr {
  border-bottom: 1px solid #EBEBEB;
}
.act-detail__table th {
  padding: 14px 12px;
  text-align: center;
  font-size: 13px;
  color: #999;
  font-weight: 400;
  white-space: nowrap;
}
.act-detail__table td {
  padding: 12px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #F5F5F5;
  text-align: center;
}
.act-detail__td-time {
  color: #666;
  font-size: 13px;
}

/* 学生单元格 */
.act-detail__td-student {
  /* display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center; */
}
.act-detail__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.act-detail__avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E8EEFF;
  color: #0049FF;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.act-detail__td-name {
  font-weight: 500;
  color: #222;
}

/* 排名徽章 */
.act-detail__rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: #F0F0F0;
  color: #666;
}
.act-detail__rank--gold {
  background: #FFF3CD;
  color: #D48806;
}
.act-detail__rank--silver {
  background: #F0F0F0;
  color: #8C8C8C;
}
.act-detail__rank--bronze {
  background: #FDE8D8;
  color: #C06010;
}

/* 分数 */
.act-detail__score {
  font-weight: 700;
  font-size: 15px;
  color: #0049FF;
}

/* 正确题数 */
.act-detail__correct {
  font-size: 13px;
  color: #00C853;
  font-weight: 600;
}

/* 做题详情按钮 */
.act-detail__detail-btn {
  padding: 5px 14px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
  outline: none;
  white-space: nowrap;
}
.act-detail__detail-btn:hover {
  background: #003de0;
}

/* 空状态 */
.act-detail__empty {
  text-align: center;
  color: #aaa;
  padding: 60px 0;
  font-size: 14px;
}

</style>
