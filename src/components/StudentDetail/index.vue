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
              @change="fetchStudentDetail"
            >
              <el-option
                v-for="item in typeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
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
              <div class="sd_name">{{ studentInfo.realName || studentInfo.userName || '-' }}</div>
              <div class="sd_meta">用户名：{{ studentInfo.userName || '-' }}</div>
              <div class="sd_date">进班日期：{{ joinDateText }}</div>
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
            <div class="sd_course_grid">
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
import { getStudentDetail, saveStudentNote } from '@/api/modules/teacher'
import courseCover from '@/assets/images/student/such.png'

export default {
  name: 'StudentDetail',
  components: { DialogCustome },
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
        { label: '近1年', value: '6' }
      ],
      studentInfo: {},
      // 考勤追踪 - 先写死
      attendanceStats: [
        { label: '出勤次数', value: '18次', color: '#1F7CFF' },
        { label: '出勤率', value: '90%', color: '#009966' },
        { label: '迟到次数', value: '1次', color: '#E17100' },
        { label: '早退次数', value: '0次', color: '#45556C' }
      ],
      // 学习情况 - 先写死
      learningStats: [
        { label: '上课时长', value: '860分钟' },
        { label: '观看历史课堂时长', value: '420分钟' },
        { label: '连麦次数', value: '6次' },
        { label: '连麦时长', value: '38分钟' },
        { label: '随堂测次数', value: '14次' },
        { label: '课后测次数', value: '8次' },
        { label: '已看历史课堂数量', value: '12节' },
        { label: '总历史课堂数量', value: '18节' },
        { label: '评论数', value: '26条' }
      ],
      // 观看详情 - 先写死
      watchCourseList: [
        {
          cover: courseCover,
          tag: '行测+申论',
          title: '英语阅读精讲直播课',
          classDuration: 45,
          historyDuration: 18
        },
        {
          cover: courseCover,
          tag: '行测+申论',
          title: '英语阅读精讲直播课',
          classDuration: 45,
          historyDuration: 18
        },
        {
          cover: courseCover,
          tag: '行测+申论',
          title: '英语阅读精讲直播课',
          classDuration: 45,
          historyDuration: 18
        },
        {
          cover: courseCover,
          tag: '行测+申论',
          title: '英语阅读精讲直播课',
          classDuration: 45,
          historyDuration: 18
        }
      ]
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.fetchStudentDetail()
      } else {
        this.studentInfo = {}
        this.savedAlias = ''
      }
    }
  },
  computed: {
    timeRangeLabel() {
      const found = this.typeOptions.find(item => item.value === this.selectedType)
      return found ? found.label : '全部时间'
    },
    joinDateText() {
      if (!this.studentInfo.joinTime) return '-'
      return this.studentInfo.joinTime
    }
  },
  methods: {
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
  width: 600px;
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
  height: 154px;
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
