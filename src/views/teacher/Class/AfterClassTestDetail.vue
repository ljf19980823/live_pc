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
        <span class="act-detail__stats-item">总人数：<span class="act-detail__stats-val">{{ totalCount }}</span></span>
        <span class="act-detail__stats-item">已完成：<span class="act-detail__stats-val" style="color:#00C853">{{ doneCount }}</span></span>
        <span class="act-detail__stats-item">未完成：<span class="act-detail__stats-val" style="color:#FF2E00">{{ undoneCount }}</span></span>
        <span class="act-detail__stats-item">完成率：<span class="act-detail__stats-val act-detail__stats-val--blue">{{ completionRate }}%</span></span>
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
    <div class="act-detail__table-wrap">
      <table class="act-detail__table">
        <thead>
          <tr>
            <th>序号</th>
            <th>学生姓名</th>
            <th>分数</th>
            <th>状态</th>
            <th>做题时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in filteredList" :key="index">
            <td>{{ row.index }}</td>
            <td class="act-detail__td-name">{{ row.name }}</td>
            <td>
              <span v-if="row.status === 'done'" class="act-detail__score">{{ row.score }}分</span>
              <span v-else class="act-detail__score--empty">--</span>
            </td>
            <td>
              <span
                class="act-detail__tag"
                :class="row.status === 'done' ? 'act-detail__tag--done' : 'act-detail__tag--undone'"
              >{{ row.status === 'done' ? '已做题' : '未做题' }}</span>
            </td>
            <td class="act-detail__td-time">{{ row.status === 'done' ? row.doTime : '--' }}</td>
            <td>
              <button v-if="row.status === 'done'" class="act-detail__detail-btn" @click="openStudentDetail(row)">做题详情</button>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="6" class="act-detail__empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 学生做题详情子组件 -->
    <StudentAnswerDetail
      :visible="studentDetailVisible"
      :studentName="currentStudent.name"
      :attemptIndex="currentStudent.attemptIndex"
      @close="studentDetailVisible = false"
    />
  </div>
</template>

<script>
import StudentAnswerDetail from './StudentAnswerDetail.vue'

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
      default: '班级A'
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
      studentDetailVisible: false,
      currentStudent: { name: '学生1', attemptIndex: 1 },
      mockStudentList: [
        { index: 1,  name: '学生1', score: 100, status: 'done',   doTime: '2025-06-11 17:08' },
        { index: 2,  name: '学生1', score: 99,  status: 'done',   doTime: '2025-06-22 17:36' },
        { index: 3,  name: '学生2', score: 97,  status: 'done',   doTime: '2025-06-28 18:35' },
        { index: 4,  name: '学生2', score: 93,  status: 'done',   doTime: '2025-06-19 09:22' },
        { index: 5,  name: '学生3', score: null, status: 'undone', doTime: '' },
        { index: 6,  name: '学生4', score: 90,  status: 'done',   doTime: '2025-06-15 11:59' },
        { index: 7,  name: '学生4', score: 80,  status: 'done',   doTime: '2025-06-19 10:49' },
        { index: 8,  name: '学生5', score: 70,  status: 'done',   doTime: '2025-06-28 10:40' },
        { index: 9,  name: '学生5', score: 69,  status: 'done',   doTime: '2025-06-18 16:22' },
        { index: 10, name: '学生5', score: 65,  status: 'done',   doTime: '2025-06-20 12:43' },
        { index: 11, name: '学生6', score: 63,  status: 'done',   doTime: '2025-06-23 14:13' },
        { index: 12, name: '学生7', score: null, status: 'undone', doTime: '' },
        { index: 13, name: '学生8', score: 88,  status: 'done',   doTime: '2025-06-17 09:15' },
        { index: 14, name: '学生9', score: null, status: 'undone', doTime: '' },
        { index: 15, name: '学生10', score: 76, status: 'done',   doTime: '2025-06-21 14:30' },
      ]
    }
  },
  computed: {
    totalCount() {
      return this.mockStudentList.length
    },
    doneCount() {
      return this.mockStudentList.filter(s => s.status === 'done').length
    },
    undoneCount() {
      return this.mockStudentList.filter(s => s.status === 'undone').length
    },
    completionRate() {
      if (this.totalCount === 0) return 0
      return Math.round((this.doneCount / this.totalCount) * 100)
    },
    filteredList() {
      return this.mockStudentList.filter(s =>
        this.filterTab === 'done' ? s.status === 'done' : s.status === 'undone'
      )
    }
  },
  methods: {
    openStudentDetail(row) {
      this.currentStudent = {
        name: row.name,
        attemptIndex: row.attemptNo || 1
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
  padding: 14px 12px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #F5F5F5;
  text-align: center;
}
.act-detail__td-name {
  font-weight: 500;
  color: #222;
}
.act-detail__td-time {
  color: #666;
  font-size: 13px;
}

/* 分数 */
.act-detail__score {
  font-weight: 700;
  font-size: 15px;
  color: #0049FF;
}
.act-detail__score--empty {
  color: #999;
}

/* 状态标签 */
.act-detail__tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.act-detail__tag--done {
  background: #CAD9FF;
  color: #0049FF;
}
.act-detail__tag--undone {
  background: #FFEDED;
  color: #FF2E00;
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
  padding: 40px 0;
  font-size: 14px;
}
</style>
