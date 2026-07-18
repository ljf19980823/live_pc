<template>
  <div class="mask" v-if="visible">
    <div class="mask_con">
      <div class="sd_panel">
        <!-- 顶部栏 -->
        <div class="sd_header">
          <div class="sd_header_left">
            <div class="sd_back" @click.stop="$emit('close')">
              <img src="@/assets/images/student/xq_back.png" alt="">
            </div>
            <div class="sd_header_title">学生学情</div>
          </div>
          <div class="sd_time_select" @click.stop>
            <el-select
              v-model="selectedType"
              size="mini"
              popper-class="detail-filter-popper"
              @change="handleTypeChange"
            >
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-date-picker
              v-if="selectedType === 'custom'"
              v-model="customTimeRange"
              type="datetimerange"
              size="mini"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              class="sd_custom_time_picker"
              @change="handleCustomTimeChange"
            />
          </div>
        </div>

        <div class="sd_body">
          <!-- 学生信息 -->
          <div class="sd_card sd_profile">
            <img
              v-if="studentInfo.profilePicture"
              :src="studentInfo.profilePicture"
              class="sd_avatar"
              alt=""
            >
            <div v-else class="sd_avatar sd_avatar_placeholder">
              {{ (studentInfo.realName || studentInfo.userName || '').slice(-2) || '-' }}
            </div>
            <div class="sd_profile_info">
              <div class="sd_name">
                <template v-if="savedAlias">
                  <span>{{ savedAlias }}</span>
                  <span class="sd_name_origin">（{{ studentInfo.realName || studentInfo.userName || '-' }}）</span>
                </template>
                <template v-else>{{ studentInfo.realName || studentInfo.userName || '-' }}</template>
              </div>
              <div class="sd_meta">用户名：{{ studentInfo.userName || '-' }}</div>
              <div class="sd_date">进班日期：{{ studentInfo.joinDesc }}</div>
            </div>
            <div class="sd_remark_btn" @click="openAliasDialog">
              {{ savedAlias ? '修改备注' : '添加备注' }}
            </div>
          </div>

          <!-- 考勤追踪 -->
          <div class="sd_card">
            <div class="sd_section_title">
              <img src="@/assets/images/student/xq_kqzz.png" class="sd_section_icon sd_section_icon_blue" alt="">
              <span>考勤追踪</span>
            </div>
            <div class="sd_attend_grid">
              <div
                v-for="item in attendanceStats"
                :key="item.label"
                class="sd_attend_item"
              >
                <div class="sd_attend_label">{{ item.label }}</div>
                <div class="sd_attend_value" :style="{ color: item.color }">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- 学习情况 -->
          <div class="sd_card">
            <div class="sd_section_title">
               <img src="@/assets/images/student/xq_xxqk.png" class="sd_section_icon sd_section_icon_blue" alt="">
              <span>学习情况</span>
            </div>
            <div class="sd_learn_grid">
              <div
                v-for="(item, index) in learningStats"
                :key="item.label"
                class="sd_learn_item"
                :class="'sd_learn_item_' + (index % 3)"
              >
                <div class="sd_learn_label">{{ item.label }}</div>
                <div class="sd_learn_value">{{ item.value }}</div>
              </div>
            </div>
          </div>

          <!-- 观看详情 -->
          <div class="sd_watch">
            <div class="sd_watch_header">
              <div class="sd_watch_title">观看详情</div>
              <div class="sd_watch_filter">{{ timeRangeLabel }}</div>
            </div>
            <div class="sd_course_grid" v-if="watchCourseList.length">
              <div
                v-for="(course, index) in watchCourseList"
                :key="index"
                class="sd_course_card"
              >
                <div class="sd_course_cover_wrap">
                  <img :src="course.cover" class="sd_course_cover" alt="">
                 
                </div>
                <div class="sd_course_body">
                  <div class="sd_course_name">{{ course.title }}</div>
                  <div class="sd_course_meta">上课时长 {{ course.classDuration }} 分钟</div>
                  <div class="sd_course_meta">观看历史课堂 {{ course.historyDuration }}分钟</div>
                </div>
              </div>
            </div>
            <EmptyState v-else description="暂无数据" />
            <div class="sd_pagination" v-if="liveTotal > livePageSize">
              <el-pagination
                background
                small
                layout="prev, pager, next"
                :total="liveTotal"
                :page-size="livePageSize"
                :current-page="livePageNum"
                @current-change="handleLivePageChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加备注弹窗 -->
    <DialogCustome
      width="616px"
      height="318px"
      :visible="aliasDialogVisible"
      title="添加备注"
      @cancel="onDialogCancelAlias"
      @confirm="onDialogConfirmAlias"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con">
          <div class="dialog_box_con_input">
            <el-input
              v-model="aliasInput"
              style="width:100%"
              placeholder="请输入你要添加的备注"
              maxlength="20"
              show-word-limit
            />
          </div>
        </div>
      </div>
    </DialogCustome>
  </div>
</template>

<script>
import DialogCustome from '@/components/DialogCustome/index.vue'
import EmptyState from '@/components/EmptyState/index.vue'
import { getStudentDetail, getStudentLiveStatistics, getStudentStatisticsSummary, saveStudentNote } from '@/api/modules/teacher'
import courseCover from '@/assets/images/student/such.png'

export default {
  name: 'StudentDetail',
  components: { DialogCustome, EmptyState },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: [String, Number],
      default: null
    },
    classId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      aliasDialogVisible: false,
      aliasInput: '',
      savedAlias: '',
      selectedType: '0',
      typeOptions: [
        { label: '全部时间', value: '0' },
        { label: '近1周', value: '1' },
        { label: '近2周', value: '2' },
        { label: '近1月', value: '3' },
        { label: '近3月', value: '4' },
        { label: '近半年', value: '5' },
        { label: '近1年', value: '6' },
        { label: '自定义时间', value: 'custom' }
      ],
      customTimeRange: [],
      studentInfo: {},
      studentSummary: {},
      watchCourseList: [],
      livePageNum: 1,
      livePageSize: 4,
      liveTotal: 0
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.livePageNum = 1
        this.fetchStudentDetail()
        this.fetchStudentSummary()
        this.fetchStudentLives()
      } else {
        this.studentInfo = {}
        this.studentSummary = {}
        this.watchCourseList = []
        this.liveTotal = 0
        this.savedAlias = ''
      }
    }
  },
  computed: {
    timeRangeLabel() {
      if (this.selectedType === 'custom') {
        return this.hasCustomTimeRange() ? `${this.customTimeRange[0]} 至 ${this.customTimeRange[1]}` : '自定义时间'
      }
      const found = this.typeOptions.find(item => item.value === this.selectedType)
      return found ? found.label : '全部时间'
    },
    joinDateText() {
      if (!this.studentInfo.joinTime) return '-'
      return this.studentInfo.joinTime
    },
    attendanceStats() {
      return [
        { label: '出勤次数', value: this.formatCount(this.studentSummary.attendedCount, '次'), color: '#1F7CFF' },
        { label: '出勤率', value: this.formatAttendanceRate(), color: '#009966' },
        { label: '迟到次数', value: this.formatCount(this.studentSummary.lateCount, '次'), color: '#E17100' },
        { label: '早退次数', value: this.formatCount(this.studentSummary.earlyLeaveCount, '次'), color: '#45556C' }
      ]
    },
    learningStats() {
      return [
        { label: '上课时长', value: this.formatCount(this.studentSummary.liveViewMinutes, '分钟') },
        { label: '观看历史课堂时长', value: this.formatCount(this.studentSummary.replayViewMinutes, '分钟') },
        { label: '连麦次数', value: this.formatCount(this.studentSummary.micCount, '次') },
        { label: '连麦时长', value: this.formatCount(this.studentSummary.micMinutes, '分钟') },
        { label: '随堂测次数', value: this.formatCount(this.studentSummary.inClassQuizCount, '次') },
        { label: '课后测次数', value: this.formatCount(this.studentSummary.afterQuizCount, '次') },
        { label: '已看历史课堂数量', value: this.formatCount(this.studentSummary.watchedReplayCount, '节') },
        { label: '总历史课堂数量', value: this.formatCount(this.studentSummary.relatedReplayCount, '节') },
        { label: '评论数', value: this.formatCount(this.studentSummary.commentCount, '条') }
      ]
    }
  },
  methods: {
    handleTypeChange() {
      this.livePageNum = 1
      if (this.selectedType === 'custom' && !this.hasCustomTimeRange()) return
      this.fetchStudentDetail()
      this.fetchStudentSummary()
      this.fetchStudentLives()
    },
    handleCustomTimeChange() {
      this.livePageNum = 1
      if (!this.hasCustomTimeRange()) return
      this.fetchStudentDetail()
      this.fetchStudentSummary()
      this.fetchStudentLives()
    },
    async fetchStudentDetail() {
      if (!this.classId || !this.studentId) return
      try {
        const params = this.selectedType === '0' ? {} : { type: this.selectedType }
        const res = await getStudentDetail(this.classId, this.studentId, params)
        const data = res.data || res || {}
        this.studentInfo = data
        this.savedAlias = data.remark || ''
      } catch (e) {
        console.error('获取学生详情失败', e)
      }
    },
    async fetchStudentSummary() {
      if (!this.studentId) return
      try {
        const res = await getStudentStatisticsSummary(this.getSummaryParams())
        this.studentSummary = res.data || res || {}
      } catch (e) {
        console.error('获取学生统计汇总失败', e)
        this.studentSummary = {}
      }
    },
    async fetchStudentLives() {
      if (!this.studentId) return
      try {
        const params = {
          ...this.getSummaryParams(),
          pageNum: this.livePageNum,
          pageSize: this.livePageSize
        }
        const res = await getStudentLiveStatistics(params)
        const data = res.data || res || {}
        this.watchCourseList = (data.list || []).map(item => ({
          ...item,
          cover: item.cover || courseCover,
          title: item.name || '-',
          classDuration: item.liveViewMinutes || 0,
          historyDuration: item.replayViewMinutes || 0
        }))
        this.liveTotal = Number(data.total) || 0
      } catch (e) {
        console.error('获取学生观看详情失败', e)
        this.watchCourseList = []
        this.liveTotal = 0
      }
    },
    handleLivePageChange(page) {
      this.livePageNum = page
      this.fetchStudentLives()
    },
    getSummaryParams() {
      const params = { studentId: this.studentId }
      const dimensionMap = {
        1: 'WEEK',
        3: 'MONTH',
        6: 'YEAR'
      }

      if (this.selectedType === 'custom' && this.hasCustomTimeRange()) {
        params.start = this.customTimeRange[0]
        params.end = this.customTimeRange[1]
      } else if (dimensionMap[this.selectedType]) {
        params.dimension = dimensionMap[this.selectedType]
      } else if (['2', '4', '5'].includes(this.selectedType)) {
        const daysMap = {
          2: 14,
          4: 90,
          5: 180
        }
        const end = new Date()
        const start = new Date(end)
        start.setDate(start.getDate() - daysMap[this.selectedType])
        params.start = this.formatDateTime(start)
        params.end = this.formatDateTime(end)
      }

      return params
    },
    hasCustomTimeRange() {
      return Array.isArray(this.customTimeRange) && this.customTimeRange.length === 2 && this.customTimeRange[0] && this.customTimeRange[1]
    },
    formatDateTime(date) {
      const pad = value => String(value).padStart(2, '0')
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hour = pad(date.getHours())
      const minute = pad(date.getMinutes())
      const second = pad(date.getSeconds())
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    },
    formatCount(value, unit) {
      const number = Number(value)
      return `${Number.isFinite(number) ? number : 0}${unit}`
    },
    formatAttendanceRate() {
      const rate = Number(this.studentSummary.attendanceRate)
      if (Number.isFinite(rate)) {
        return `${Math.round((rate > 1 ? rate : rate * 100) * 100) / 100}%`
      }

      const attendedCount = Number(this.studentSummary.attendedCount) || 0
      const requiredCount = Number(this.studentSummary.requiredCount) || 0
      if (!requiredCount) return '0%'
      return `${Math.round((attendedCount / requiredCount) * 10000) / 100}%`
    },
    openAliasDialog() {
      this.aliasInput = this.studentInfo.remark || this.savedAlias || ''
      this.aliasDialogVisible = true
    },
    onDialogCancelAlias() {
      this.aliasDialogVisible = false
      this.aliasInput = ''
    },
    async onDialogConfirmAlias() {
      if (!this.classId || !this.studentId) return
      try {
        await saveStudentNote(this.classId, this.studentId, this.aliasInput)
        this.savedAlias = this.aliasInput
        this.studentInfo = { ...this.studentInfo, remark: this.aliasInput }
        this.$message.success('备注保存成功')
      } catch (e) {
        this.$message.error('备注保存失败，请重试')
      } finally {
        this.aliasDialogVisible = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mask {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 51, 51, 0.6);
  z-index: 1022;
  overflow: hidden;
}

.mask_con {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.sd_panel {
  width: 700px;
  height: 100%;
  background: #F5F7FA;
  border-radius: 8px 0 0 8px;
  animation: slideInFromRight 0.3s ease;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.sd_header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 18px;
  box-sizing: border-box;
  background: #FFFFFF;
}

.sd_header_left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sd_back {
  width: 36px;
  height: 36px;

  cursor: pointer;


  img {
    width: 36px;
    height: 36px;
  }
}

.sd_header_title {
  font-size: 20px;
  font-weight: bold;
  color: #020618;
  line-height: 28px;
}

.sd_time_select {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 10px 10px 10px 10px;
border: 1px solid #E2E8F0;
  ::v-deep .el-select {
    width: 110px;
  }

  ::v-deep .el-input__inner {
    height: 32px;
    line-height: 32px;
    border-radius: 6px;
    border-color: #E5E6EB;
    background: #fff;
    color: #4E5969;
    font-size: 13px;
    padding-left: 12px;
  }

  ::v-deep .el-input__icon {
    line-height: 32px;
  }

  .sd_custom_time_picker {
    width: 380px;
  }
}

.sd_body {
  flex: 1;
  height: 0;
  overflow-y: auto;
  padding:0 20px 20px; 
  margin-top: 20px;
  box-sizing: border-box;
}

.sd_card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-sizing: border-box;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.sd_profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sd_avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.sd_avatar_placeholder {
  background: #4C7DFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.sd_profile_info {
  flex: 1;
  min-width: 0;
}

.sd_name {
  font-size: 18px;
  font-weight: bold;
  color: #020618;
  line-height: 26px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd_name_origin {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 400;
  color: #62748E;
}

.sd_meta {
  font-size: 14px;
  color: #62748E;
  line-height: 18px;
}
.sd_date {
  font-size: 12px;
  color: #90A1B9;
  line-height: 18px;
}

.sd_remark_btn {
  flex-shrink: 0;
  padding: 0 13px;
height: 36px;
background: #FFFFFF;
border-radius: 10px 10px 10px 10px;
border: 1px solid #BEDBFF;
  color: #1F7CFF;
  font-size: 14px;
  line-height: 36px;
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;

  &:hover {
    background: #E6F4FF;
  }
}

.sd_section_title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1D2129;
  margin-bottom: 14px;
}

.sd_section_icon {
  width: 28px;
  height: 28px;
 color: #0F172B;
 font-size: 16px;
 font-weight: bold;
}


.sd_attend_grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.sd_attend_item {
  background: #F8FAFC;
  border-radius: 10px;
  padding: 12px 8px;
  box-sizing: border-box;
  text-align: center;
}

.sd_attend_label {
  font-size: 12px;
  color: #90A1B9;
  line-height: 18px;
  margin-bottom: 6px;
}

.sd_attend_value {
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
}

.sd_learn_grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sd_learn_item {
  border-radius: 10px;
  padding: 12px 10px;
  box-sizing: border-box;
  min-height: 68px;
}

.sd_learn_item_0 {
  background: rgba(239, 246, 255, 0.70);
}

.sd_learn_item_1 {
  background: rgba(245, 243, 255, 0.60);
}

.sd_learn_item_2 {
  background: rgba(236, 253, 245, 0.60);
}

.sd_learn_label {
  font-size: 12px;
  color: #62748E;
  line-height: 18px;
  margin-bottom: 6px;
}

.sd_learn_value {
  font-size: 14px;
  font-weight: bold;
  color: #1D293D;
  line-height: 22px;
}

.sd_watch {
  margin-top: 4px;
}

.sd_watch_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sd_watch_title {
  font-size: 16px;
  font-weight: bold;
  color: #0F172B;
}

.sd_watch_filter {
  font-size: 12px;
  color: #90A1B9;
}

.sd_course_grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sd_course_card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.sd_course_cover_wrap {
  position: relative;
  width: 100%;
  height: 174px;
  overflow: hidden;
  background: #E8EEF5;
}

.sd_course_cover {
  width: 100%;
  height: 100%;
  display: block;
}

.sd_course_tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #36CFC9, #40A9FF);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
}

.sd_course_body {
  padding: 12px;
  box-sizing: border-box;
}

.sd_course_name {
  font-size: 14px;
  font-weight: bold;
  color: #0F172B;
  line-height: 20px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd_course_meta {
  font-size: 12px;
  color: #62748E;
  line-height: 18px;
}

.sd_pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0 4px;
}

.dialog_box2 {
  width: 100%;
  padding: 20px 0;
  box-sizing: border-box;
}

.dialog_box_con {
  width: 100%;
}

.dialog_box_con_input {
  width: 100%;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
