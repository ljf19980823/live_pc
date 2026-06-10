<template>
  <div v-if="visible" class="ranking-page">
    <!-- 顶部 Header -->
    <div class="ranking-header">
      <div class="ranking-header-left" @click="handleBack">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 1L1 7L7 13" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="ranking-back-text">返回</span>
      </div>
      <div class="ranking-header-title">排行榜</div>
      <div class="ranking-header-right"></div>
    </div>

    <!-- 统计栏 -->
    <div class="ranking-stats">
      <span class="ranking-stats-total">总人数: <strong>{{ totalCount }}</strong></span>
      <span class="ranking-stats-beat">你已超越: <strong class="ranking-stats-percent">{{surpassPercentage}}%</strong> 的同学</span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="ranking-loading">
      <span>加载中...</span>
    </div>

    <!-- 暂无数据 -->
    <div v-else-if="!loading && rankList.length === 0" class="ranking-empty">
      <span>暂无排行榜数据</span>
    </div>

    <!-- 表格 -->
    <div v-else class="ranking-table-wrap">
      <!-- 表头 -->
      <div class="ranking-table-header">
        <div class="ranking-col ranking-col-rank">排名</div>
        <div class="ranking-col ranking-col-name">姓名</div>
        <div class="ranking-col ranking-col-score">分数</div>
        <div class="ranking-col ranking-col-time">用时</div>
        <div class="ranking-col ranking-col-action"></div>
      </div>

      <!-- 列表 -->
      <div class="ranking-table-body">
        <div
          v-for="(item, index) in rankList"
          :key="item.id"
          class="ranking-row"
          :class="{
            'ranking-row-no1': index === 0,
            'ranking-row-no2': index === 1,
            'ranking-row-no3': index === 2
          }"
        >
          <!-- 排名 -->
          <div class="ranking-col ranking-col-rank">
            <div v-if="index === 0" class="ranking-badge">
              <img :src="rankBadge1" class="ranking-badge-img" alt="" />
            </div>
            <div v-else-if="index === 1" class="ranking-badge">
              <img :src="rankBadge2" class="ranking-badge-img" alt="" />
            </div>
            <div v-else-if="index === 2" class="ranking-badge">
              <img :src="rankBadge3" class="ranking-badge-img" alt="" />
            </div>
            <span v-else class="ranking-num" :class="item.isMine ? 'ranking-num-mine' : ''">{{ item.rank }}</span>
          </div>

          <!-- 姓名 -->
          <div class="ranking-col ranking-col-name">
            <img :src="item.avatar" class="ranking-avatar" alt="" />
            <span class="ranking-name" :class="item.isMine ? 'ranking-name-mine' : ''">
              {{ item.name }}{{ item.isMine ? '（我）' : '' }}
            </span>
          </div>

          <!-- 分数 -->
          <div class="ranking-col ranking-col-score">
            <span class="ranking-score" :class="item.isMine ? 'ranking-score-mine' : ''">{{ item.score }}分</span>
          </div>

          <!-- 用时 -->
          <div class="ranking-col ranking-col-time">
            <span class="ranking-time" :class="item.isMine ? 'ranking-time-mine' : ''">{{ item.timeStr }}</span>
          </div>

          <!-- 操作 -->
          <div class="ranking-col ranking-col-action">
            <button  class="ranking-detail-btn" @click="openStudentDetail(item)">做题详情</button>
          </div>
        </div>
      </div>
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
import StudentAnswerDetail from '../../teacher/Class/StudentAnswerDetail.vue'
import { getQuizLeaderboard } from '@/api/modules/student'
import { getUserInfo } from '@/utils/auth'

const defaultAvatars = [
  require('@/assets/images/set/head_1.png'),
  require('@/assets/images/set/head_2.png'),
  require('@/assets/images/set/head_3.png'),
  require('@/assets/images/set/head_4.png')
]

function safeAvatar(url, index) {
  if (url) return url
  try {
    return defaultAvatars[index % defaultAvatars.length]
  } catch (e) {
    return ''
  }
}

function formatSeconds(seconds) {
  if (seconds == null || seconds === '' || isNaN(Number(seconds))) return '-'
  const total = Math.floor(Number(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default {
  name: 'RankingPage',
  components: { StudentAnswerDetail },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    examConfigId: {
      type: String,
      default: ''
    },
    classId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      rankBadge1: require('@/assets/images/class/rank1.png'),
      rankBadge2: require('@/assets/images/class/rank2.png'),
      rankBadge3: require('@/assets/images/class/rank3.png'),
      loading: false,
      totalCount: 0,
      beatPercent: 0,
      surpassPercentage:0,
      rankList: [],
      studentDetailVisible: false,
      currentStudent: {}
    }
  },
  watch: {
    visible(val) {
      if (val && this.examConfigId) {
        this.fetchLeaderboard()
      }
    },
    examConfigId(val) {
      if (val && this.visible) {
        this.fetchLeaderboard()
      }
    }
  },
  mounted() {
    if (this.visible && this.examConfigId) {
      this.fetchLeaderboard()
    }
  },
  methods: {
    openStudentDetail(row) {
      this.currentStudent = {
        studentName: row.studentName,
        recordId: row.recordId,
        examId: row.examId
      }
      this.studentDetailVisible = true
    },
    handleBack() {
      this.$emit('back')
    },
    async fetchLeaderboard() {
      if (!this.examConfigId) return
      this.loading = true
      try {
        const res = await getQuizLeaderboard(this.examConfigId, this.classId)
        const data = res.data || res
        console.log(res,'测试')
        const userInfo = getUserInfo() || {}
        const myStudentId = userInfo.userId || userInfo.id || userInfo.studentId || ''

        this.totalCount = data.totalStudentCount || 0
        this.surpassPercentage = data.surpassPercentage || 0

        const items = data.leaderboardItems || []
        this.rankList = items.map((item, index) => {
          const isMine = !!myStudentId && (item.studentId === myStudentId)
          return {
            id: item.recordId || item.examId || index,
            rank: index + 1,
            name: item.studentName || '未知',
            score: item.score || 0,
            timeStr: formatSeconds(item.examDuration),
            isMine,
            avatar: safeAvatar(item.profilePicture, index),
            recordId: item.recordId || ''
          }
        })

        // 计算"你已超越"百分比：找到自己的排名，超越人数 / 总完成人数
        const myIndex = this.rankList.findIndex(r => r.isMine)
        if (myIndex >= 0 && items.length > 1) {
          const beatenCount = items.length - (myIndex + 1)
          this.beatPercent = Math.round((beatenCount / (items.length - 1)) * 100)
        } else if (data.finishedPercentage != null) {
          this.beatPercent = data.finishedPercentage
        } else {
          this.beatPercent = 0
        }
      } catch (e) {
        console.error('获取排行榜失败', e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.ranking-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #F5F7FA;
 z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #EFEFEF;
  flex-shrink: 0;
}
.ranking-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
}
.ranking-header-left:hover {
  opacity: 0.7;
}
.ranking-back-text {
  font-size: 14px;
  color: #333;
}
.ranking-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.ranking-header-right {
  width: 60px;
}

/* 统计栏 */
.ranking-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 24px;
  font-size: 14px;
  color: #333;
  background: #F5F7FA;
  flex-shrink: 0;
}
.ranking-stats-total strong {
  font-weight: 700;
  color: #333;
}
.ranking-stats-beat {
  color: #333;
}
.ranking-stats-percent {
  color: #FF6B00;
  font-weight: 700;
}

/* 表格容器 */
.ranking-table-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

/* 表头 */
.ranking-table-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  background: transparent;
}

/* 列宽 — 5列均分 */
.ranking-col {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.ranking-col-rank {
  justify-content: center;
}
.ranking-col-name {
  gap: 10px;
  justify-content: center;
}
.ranking-col-score {
  justify-content: center;
}
.ranking-col-time {
  justify-content: center;
}
.ranking-col-action {
  justify-content: center;
}

/* 行 */
.ranking-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 6px;
  background: #fff;
  transition: background 0.15s;
}
.ranking-row:hover{
  background: #FFF8F0!important;
  border: none;
}
/* NO.1 行 */
.ranking-row-no1 {
  background: linear-gradient( 90deg, rgba(255,248,220,0.72) 0%, rgba(255,255,255,0.96) 46%, rgba(255,250,238,0.72) 100%);

}

/* NO.2 行 */
.ranking-row-no2 {
 background: linear-gradient( 90deg, rgba(241,246,252,0.74) 0%, rgba(255,255,255,0.98) 48%, rgba(247,250,253,0.74) 100%);

}

/* NO.3 行 */
.ranking-row-no3 {
 background: linear-gradient( 90deg,rgba(255, 239, 226, 0.72) 0%, rgba(255, 255, 255, 0.97) 48%, rgba(255, 247, 241, 0.72) 100%);
}

/* 我的行 */
.ranking-row-mine {
  background: #FFF8F0;
  border: none;
}

/* 排名徽章 */
.ranking-badge {
  display: flex;
  align-items: center;
}
.ranking-badge-img {
  width: 100px;
  height: 38px;
  object-fit: contain;
}

/* 普通排名数字 */
.ranking-num {
  font-size: 14px;
  color: #666;
}
.ranking-num-mine {
  color: #FF6B00;
  font-weight: 700;
}

/* 头像 */
.ranking-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  flex-shrink: 0;
}

/* 姓名 */
.ranking-name {
  font-size: 14px;
  color: #333;
}
.ranking-name-mine {
  color: #FF6B00;
  font-weight: 600;
}

/* 分数 */
.ranking-score {
  font-size: 16px;
  font-weight: 700;
  color: #0049FF;
}
.ranking-score-mine {
  color: #FF6B00;
}

/* 用时 */
.ranking-time {
  font-size: 13px;
  color: #666;
}
.ranking-time-mine {
  color: #FF6B00;
  font-weight: 600;
}

/* 做题详情按钮 */
.ranking-detail-btn {
  padding: 5px 12px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.ranking-detail-btn:hover {
  background: #003acc;
}

/* 加载 / 空状态 */
.ranking-loading,
.ranking-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
}
</style>
