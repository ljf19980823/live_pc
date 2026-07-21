<template>
  <div class="schedule-page">
    <!-- 顶部工具栏 -->
    <div class="schedule-toolbar">
      <div class="mode-toggle">
        <div
          class="mode-toggle__item"
          :class="{ active: viewMode === 'calendar' }"
          @click="switchToCalendarMode"
        >日历模式</div>
        <div
          class="mode-toggle__item"
          :class="{ active: viewMode === 'list' }"
          @click="switchToListMode"
        >列表模式</div>
      </div>

      <!-- 日历模式：月份导航 + 展开/收缩 -->
      <div class="toolbar-right" v-if="viewMode === 'calendar'">
        <div class="month-nav">
          <div class="month-nav__btn" @click="handlePrev">
            <img src="@/assets/images/Schedule/left.png" alt="" />
          </div>
          <div class="month-nav__label">{{ monthLabel }}</div>
          <div class="month-nav__btn" @click="handleNext">
            <img src="@/assets/images/Schedule/right.png" alt="" />
          </div>
        </div>
        <div class="scope-btn" @click="toggleScope">
          {{ calendarScope === 'month' ? '收缩为一周' : '展开为整月' }}
        </div>
      </div>

      <!-- 列表模式：时间区间 -->
      <div class="toolbar-right" v-else>
        <div class="range-picker-wrap">
          <span class="range-picker-label">时间区间</span>
          <el-date-picker
            v-model="listDateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            format="MM月dd日"
            :clearable="false"
            size="small"
            class="range-picker"
            @change="onListRangeChange"
          />
        </div>
      </div>
    </div>

    <!-- ========== 日历模式 ========== -->
    <template v-if="viewMode === 'calendar'">
      <div class="calendar-card" v-loading="scheduleLoading">
        <!-- 整月 -->
        <template v-if="calendarScope === 'month'">
          <div class="cal-weekdays">
            <div v-for="d in weekDays" :key="d" class="cal-weekday">{{ d }}</div>
          </div>
          <div class="cal-grid">
            <div
              v-for="(cell, idx) in calendarCells"
              :key="idx"
              class="cal-cell"
              :class="{
                'is-other': !cell.currentMonth,
                'is-today': cell.isToday,
                'has-class': cell.hasClass && !cell.isToday,
                'is-selected': cell.dateStr === selectedDate && !cell.isToday
              }"
              @click="cell.currentMonth && selectDate(cell.dateStr)"
            >
              <span class="cal-cell__today-tag" v-if="cell.isToday">今</span>
              <span class="cal-cell__day">{{ cell.dayText }}</span>
              <span class="cal-cell__dot" v-if="cell.currentMonth && cell.hasClass"></span>
            </div>
          </div>
        </template>

        <!-- 一周：与整月同款样式，仅展示 7 天 -->
        <template v-else>
          <div class="cal-weekdays">
            <div v-for="d in weekDays" :key="d" class="cal-weekday">{{ d }}</div>
          </div>
          <div class="cal-grid">
            <div
              v-for="(cell, idx) in weekCells"
              :key="idx"
              class="cal-cell"
              :class="{
                'is-today': cell.isToday,
                'has-class': cell.hasClass && !cell.isToday,
                'is-selected': cell.dateStr === selectedDate && !cell.isToday
              }"
              @click="selectDate(cell.dateStr)"
            >
              <span class="cal-cell__today-tag" v-if="cell.isToday">今</span>
              <span class="cal-cell__day">{{ cell.dayText }}</span>
              <span class="cal-cell__dot" v-if="cell.hasClass"></span>
            </div>
          </div>
        </template>

        <div class="cal-legend">
          <div class="cal-legend__item">
            <span class="cal-legend__dot cal-legend__dot--today"></span>
            <span>当天</span>
          </div>
          <div class="cal-legend__item">
            <span class="cal-legend__dot cal-legend__dot--class"></span>
            <span>有课</span>
          </div>
          <div class="cal-legend__item">
            <span class="cal-legend__dot cal-legend__dot--empty"></span>
            <span>无课</span>
          </div>
        </div>
      </div>

      <div class="course-panel">
        <div class="course-panel__title">
          {{ selectedDateLabel }}（共{{ selectedCourses.length }}节）
        </div>
        <div class="course-grid" v-if="selectedCourses.length">
          <div
            class="course-card"
            v-for="(course, idx) in selectedCourses"
            :key="course.id || idx"
          >
            <img
              :src="course.cover || defaultCover"
              class="course-card__cover"
              alt=""
            />
            <div class="course-card__info">
              <div class="course-card__name-row">
                <div class="course-card__name">{{ course.name }}</div>
                <!-- <div
                  class="course-card__status"
                  :class="{
                    'status-living': course.status === '直播中',
                    'status-finished': course.status === '已结束已开播' || course.status === '已结束未开播',
                    'status-soon': course.status === '未开始',
                    'status-not-broadcast': course.status === '未开播',
                    'status-unknown': course.status === '未知'
                  }"
                >
                  <i class="status-dot"></i>
                  <span>{{
                    course.status === '已结束已开播' || course.status === '已结束未开播'
                      ? '已结束'
                      : course.status
                  }}</span>
                </div> -->
              </div>
              <div class="course-card__time"  v-if="course.status === '已结束已开播' || course.status === '已结束未开播'">
                {{ course.realStartTime }}{{ course.realEndTime ? '-' + course.realEndTime : '' }}
                <template v-if="course.liveRealTime"> 共{{ course.liveRealTime =='0'?'1': course.liveRealTime }}分钟</template>
              </div>
              <div class="course-card__time" v-else>
                {{ course.startTime }}{{ course.endTime ? '-' + course.endTime : '' }}
                <template v-if="course.liveTime"> 共{{ course.liveTime }}分钟</template>
              </div>
              <div class="course-card__teacher">主讲：{{ course.teacherName || '-' }}</div>
            </div>
            <div
              v-if="course.status === '直播中' || course.status === '未开始'"
              class="course-card__btn"
              @click="enterLiveRoom(course)"
            >进入直播间</div>
            <div
              v-else-if="course.status === '已结束已开播' || course.status === '已结束未开播'"
              class="course-card__btn"
              @click="openVideo(course)"
            >查看回放</div>
          </div>
        </div>
        <EmptyState v-else description="暂无课程" />
      </div>
    </template>

    <!-- ========== 列表模式 ========== -->
    <div class="list-panel" v-else v-loading="scheduleLoading">
      <template v-if="listGroups.length">
        <div
          class="list-group"
          v-for="(group, gIdx) in listGroups"
          :key="group.date"
        >
          <div class="list-group__header">
            <span class="list-group__dot"></span>
            <span class="list-group__date">{{ group.dateLabel }}</span>
          </div>
          <div
            class="list-group__line"
            v-if="gIdx < listGroups.length - 1 || group.courses.length"
          ></div>
          <div class="list-group__courses">
            <div
              class="list-course-card"
              v-for="course in group.courses"
              :key="course.id"
            >
              <img
                :src="course.cover || defaultCover"
                class="list-course-card__cover"
                alt=""
              />
              <div class="list-course-card__info">
                <div class="list-course-card__name">{{ course.name }}</div>
                <div class="list-course-card__time" v-if="course.status === '已结束已开播' || course.status === '已结束未开播'">
                  {{ course.realStartTime }}{{ course.realEndTime ? '-' + course.realEndTime : '' }}
                  <template v-if="course.liveRealTime"> 共{{ course.liveRealTime =='0'?'1': course.liveRealTime}}分钟</template>
                </div>
                <div class="list-course-card__time" v-else>
                  {{ course.startTime }}{{ course.endTime ? '-' + course.endTime : '' }}
                  <template v-if="course.liveTime"> 共{{ course.liveTime }}分钟</template>
                </div>
                <div class="list-course-card__teacher">主讲：{{ course.teacherName || '-' }}</div>
              </div>
              <div
                v-if="course.status === '直播中' || course.status === '未开始'"
                class="list-course-card__btn"
                @click="enterLiveRoom(course)"
              >进入直播间</div>
              <div
                v-else-if="course.status === '已结束已开播' || course.status === '已结束未开播'"
                class="list-course-card__btn"
                @click="openVideo(course)"
              >查看回放</div>
            </div>
          </div>
        </div>
      </template>
      <EmptyState v-else description="暂无课程" />
    </div>

    <!-- 直播全屏 -->
    <div class="live-fullscreen" v-if="showLiveIframe">
      <LiveClassroomFrame :src="liveUrl" @exit="showLiveIframe = false" />
    </div>

    <!-- 回放播放器 -->
    <history-video-player
      :visible="playerVisible"
      :main-source="playerSource"
      :teacher-source="playerTeacherSource"
      :title="playerTitle"
      :history-lesson-id="playerHistoryLessonId"
      :allow-download="playerAllowDownload"
      @close="playerVisible = false"
    />
  </div>
</template>

<script>
import { getAgreement } from '@/api/modules/teacher'
import { getScheduleList, getScheduleListByRange } from '@/api/modules/teacher'
import { getToken, getUserInfo } from '@/utils/auth'
import { mapGetters } from 'vuex'

const pad = n => String(n).padStart(2, '0')

export default {
  name: 'Schedule',
  data() {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    // 默认列表区间：今天起 5 天
    const end = new Date(now)
    end.setDate(end.getDate() + 4)
    const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`

    return {
      viewMode: 'calendar', // calendar | list
      calendarScope: 'month', // month | week
      scheduleYear: now.getFullYear(),
      scheduleMonth: now.getMonth(), // 0-based
      selectedDate: todayStr,
      weekAnchorDate: todayStr, // 周视图锚点
      listDateRange: [todayStr, endStr],
      weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      scheduleApiData: [],
      scheduleLoading: false,
      defaultCover: require('@/assets/images/student/such.png'),
      // 直播
      showLiveIframe: false,
      liveUrl: '',
      // 回放
      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      playerHistoryLessonId: '',
      playerAllowDownload: '2',

       // macOS 屏幕录制权限引导弹窗
      showScreenPermissionDialog: false,
      screenPermissionStatus: '',   // 'not-determined' | 'denied' | 'restricted'
      _removeScreenPermissionDenied: null,
      // macOS 屏幕采集失败弹窗（权限已授权但系统无法获取屏幕源）
      showScreenCaptureFailedDialog: false,
      _removeScreenCaptureFailed: null,

       limitTimeTeacher:30
    }
  },
  computed: {
    ...mapGetters('user', ['realName']),
    monthLabel() {
      return `${this.scheduleYear}年${pad(this.scheduleMonth + 1)}月`
    },
    // 与 Online 课表 scheduleDataByDate 同一套接口字段映射
    scheduleDataByDate() {
      const map = {}
      ;(this.scheduleApiData || []).forEach(item => {
        const dateStr = item.date
        if (!dateStr) return
        map[dateStr] = (item.lives || []).map(live => {
          const startTime = live.startTime ? live.startTime.substring(11, 16) : ''
          const endTime = live.endTime ? live.endTime.substring(11, 16) : ''
          const realStartTime = live.realStartTime ? live.realStartTime.substring(11, 16) : ''
          const realEndTime = live.realEndTime ? live.realEndTime.substring(11, 16) : ''
          let durationText = ''
          if (live.startTime && live.endTime) {
            const s = new Date(live.startTime.replace(/-/g, '/')).getTime()
            const e = new Date(live.endTime.replace(/-/g, '/')).getTime()
            if (e > s) {
              durationText = `${Math.round((e - s) / 60000)}分钟`
            }
          }
          return {
            // Online 课表原有字段
            ...live,
            id: live.id,
            name: live.name || '',
            startTime,
            endTime,
            realStartTime,
            realEndTime,
            fullStartTime: live.startTime || '',
            liveLessonId: live.liveLessonId || '',
            fileList: live.fileList || [],
            status: live.status,
            isStart: live.isStart,
            isFinish: live.isFinish,
            // 本页卡片展示 / 回放所需扩展字段（同源 live）
            durationText,
            fullEndTime: live.endTime || '',
            historyLessonId: live.historyLessonId || '',
            cover: live.cover || live.coverUrl || live.imgUrl || live.image || '',
            teacherName: live.teacherName2 || live.teacherName || this.realName || '',
            taskUuid: live.taskUuid || '',
            allowDownload: live.allowDownload
          }
        })
      })
      return map
    },
    calendarCells() {
      const year = this.scheduleYear
      const month = this.scheduleMonth
      const firstDay = new Date(year, month, 1).getDay()
      // 周一为一周起始：Sun=0 → 6, Mon=1 → 0, ...
      const mondayOffset = firstDay === 0 ? 6 : firstDay - 1
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const daysInPrevMonth = new Date(year, month, 0).getDate()
      const todayStr = this.todayStr()
      const cells = []

      for (let i = mondayOffset - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i
        const pm = month === 0 ? 12 : month
        const py = month === 0 ? year - 1 : year
        const dateStr = `${py}-${pad(pm)}-${pad(d)}`
        cells.push({
          day: d,
          dayText: pad(d),
          dateStr,
          currentMonth: false,
          isToday: false,
          hasClass: false
        })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
        cells.push({
          day: d,
          dayText: pad(d),
          dateStr,
          currentMonth: true,
          isToday: dateStr === todayStr,
          hasClass: !!(this.scheduleDataByDate[dateStr]?.length)
        })
      }
      const remaining = 42 - cells.length
      for (let d = 1; d <= remaining; d++) {
        const nm = month === 11 ? 1 : month + 2
        const ny = month === 11 ? year + 1 : year
        const dateStr = `${ny}-${pad(nm)}-${pad(d)}`
        cells.push({
          day: d,
          dayText: pad(d),
          dateStr,
          currentMonth: false,
          isToday: false,
          hasClass: false
        })
      }
      return cells
    },
    weekCells() {
      const anchor = this.parseDate(this.weekAnchorDate || this.selectedDate)
      const day = anchor.getDay()
      const mondayOffset = day === 0 ? 6 : day - 1
      const monday = new Date(anchor)
      monday.setDate(anchor.getDate() - mondayOffset)
      const todayStr = this.todayStr()
      const cells = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        const dayNum = d.getDate()
        cells.push({
          day: dayNum,
          dayText: pad(dayNum),
          dateStr,
          isToday: dateStr === todayStr,
          hasClass: !!(this.scheduleDataByDate[dateStr]?.length)
        })
      }
      return cells
    },
    selectedCourses() {
      if (!this.selectedDate) return []
      return this.scheduleDataByDate[this.selectedDate] || []
    },
    selectedDateLabel() {
      if (!this.selectedDate) return '课程列表'
      const parts = this.selectedDate.split('-')
      return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
    },
    listGroups() {
      if (!this.listDateRange || this.listDateRange.length !== 2) return []
      const [start, end] = this.listDateRange
      const groups = []
      const cursor = this.parseDate(start)
      const endDate = this.parseDate(end)
      while (cursor <= endDate) {
        const dateStr = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
        const courses = this.scheduleDataByDate[dateStr] || []
        if (courses.length) {
          groups.push({
            date: dateStr,
            dateLabel: `${cursor.getFullYear()}年${pad(cursor.getMonth() + 1)}月${pad(cursor.getDate())}日`,
            courses
          })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      return groups
    }
  },
  watch: {
    // 与 Online 课表一致：年月变化时按 year/month 重新拉取（整月模式）
    scheduleYear(val) {
      if (this.viewMode === 'calendar' && this.calendarScope === 'month') {
        this.fetchScheduleData(val, this.scheduleMonth + 1)
      }
    },
    scheduleMonth(val) {
      if (this.viewMode === 'calendar' && this.calendarScope === 'month') {
        this.fetchScheduleData(this.scheduleYear, val + 1)
      }
    }
  },
  mounted() {
    // 监听 iframe 直播退出消息（保存引用以便 beforeDestroy 移除）
    this._onWindowMessage = (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data
        this.showLiveIframe = false
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI && window.electronAPI.minimizeWindow()
      }
    }
    window.addEventListener('message', this._onWindowMessage)

    // macOS：监听主进程通知——屏幕录制权限被拒绝
    if (window.electronAPI?.onScreenPermissionDenied) {
      this._removeScreenPermissionDenied = window.electronAPI.onScreenPermissionDenied((data) => {
        this.screenPermissionStatus = data?.status || 'denied'
        this.showScreenPermissionDialog = true
      })
    }
    // macOS：监听主进程通知——权限已授权但屏幕采集仍然失败
    if (window.electronAPI?.onScreenCaptureFailed) {
      this._removeScreenCaptureFailed = window.electronAPI.onScreenCaptureFailed(() => {
        this.showScreenCaptureFailedDialog = true
      })
    }
      this.fetchAgreementTeacher()
    this.fetchScheduleData(this.scheduleYear, this.scheduleMonth + 1)
  },
  methods: {
    async fetchAgreementTeacher() {
      try {
        const res = await getAgreement('teacher_live_join_times')
        if (res && res.data && res.data.length!=0) {
          this.limitTimeTeacher = parseInt(res.data[0].moduleValue) 
        
        }else{
          this.limitTimeTeacher  = 30
        }
      } catch (e) {
        console.error('获取隐私协议失败', e)
      }
    },
    todayStr() {
      const t = new Date()
      return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
    },
    parseDate(str) {
      const [y, m, d] = str.split('-').map(Number)
      return new Date(y, m - 1, d)
    },
    /** 与 Online fetchScheduleData 一致：getScheduleList({ year, month }) */
    async fetchScheduleData(year, month) {
      const y = year != null ? year : this.scheduleYear
      const m = month != null ? month : this.scheduleMonth + 1
      this.scheduleLoading = true
      try {
        const res = await getScheduleList({ year: String(y), month: String(m) })
        this.scheduleApiData = res.data || res || []
      } catch (_) {
        this.scheduleApiData = []
      } finally {
        this.scheduleLoading = false
      }
    },
    /** 周视图跨月时合并拉取（同一 getScheduleList 接口） */
    async fetchRangeData(startStr, endStr) {
      this.scheduleLoading = true
      try {
        const start = this.parseDate(startStr)
        const end = this.parseDate(endStr)
        const months = new Set()
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
        while (cursor <= endMonth) {
          months.add(`${cursor.getFullYear()}-${cursor.getMonth()}`)
          cursor.setMonth(cursor.getMonth() + 1)
        }
        const results = await Promise.all(
          [...months].map(key => {
            const [y, m] = key.split('-').map(Number)
            return getScheduleList({ year: String(y), month: String(m + 1) })
              .then(res => res.data || res || [])
              .catch(() => [])
          })
        )
        const map = {}
        results.flat().forEach(item => {
          if (item && item.date) map[item.date] = item
        })
        this.scheduleApiData = Object.values(map)
      } catch (_) {
        this.scheduleApiData = []
      } finally {
        this.scheduleLoading = false
      }
    },
    /** 列表模式：按时间区间拉取 getScheduleListByRange({ startDate, endDate }) */
    async fetchListByRange(startDate, endDate) {
      if (!startDate || !endDate) return
      this.scheduleLoading = true
      try {
        const res = await getScheduleListByRange({ startDate, endDate })
        this.scheduleApiData = res.data || res || []
      } catch (_) {
        this.scheduleApiData = []
      } finally {
        this.scheduleLoading = false
      }
    },
    /** 周视图：按当前周起止日期拉取（可能跨月） */
    fetchWeekData() {
      const cells = this.weekCells
      if (!cells.length) return
      this.fetchRangeData(cells[0].dateStr, cells[cells.length - 1].dateStr)
    },
    selectDate(dateStr) {
      this.selectedDate = dateStr
      this.weekAnchorDate = dateStr
      const d = this.parseDate(dateStr)
      if (d.getFullYear() !== this.scheduleYear || d.getMonth() !== this.scheduleMonth) {
        this.scheduleYear = d.getFullYear()
        this.scheduleMonth = d.getMonth()
      }
    },
    toggleScope() {
      if (this.calendarScope === 'month') {
        this.calendarScope = 'week'
        this.weekAnchorDate = this.selectedDate
        this.$nextTick(() => this.fetchWeekData())
      } else {
        this.calendarScope = 'month'
        const d = this.parseDate(this.selectedDate)
        this.scheduleYear = d.getFullYear()
        this.scheduleMonth = d.getMonth()
        this.fetchScheduleData(this.scheduleYear, this.scheduleMonth + 1)
      }
    },
    handlePrev() {
      if (this.calendarScope === 'week') {
        this.shiftWeek(-7)
      } else {
        if (this.scheduleMonth === 0) {
          this.scheduleMonth = 11
          this.scheduleYear -= 1
        } else {
          this.scheduleMonth -= 1
        }
      }
    },
    handleNext() {
      if (this.calendarScope === 'week') {
        this.shiftWeek(7)
      } else {
        if (this.scheduleMonth === 11) {
          this.scheduleMonth = 0
          this.scheduleYear += 1
        } else {
          this.scheduleMonth += 1
        }
      }
    },
    shiftWeek(delta) {
      const d = this.parseDate(this.weekAnchorDate || this.selectedDate)
      d.setDate(d.getDate() + delta)
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      this.weekAnchorDate = dateStr
      this.selectedDate = dateStr
      // 避免仅改锚点时年月不变导致不请求；周视图统一按周区间拉数
      const y = d.getFullYear()
      const m = d.getMonth()
      if (y !== this.scheduleYear || m !== this.scheduleMonth) {
        this.scheduleYear = y
        this.scheduleMonth = m
      }
      this.$nextTick(() => this.fetchWeekData())
    },
    switchToCalendarMode() {
      if (this.viewMode === 'calendar') return
      this.viewMode = 'calendar'
      if (this.calendarScope === 'week') {
        this.$nextTick(() => this.fetchWeekData())
      } else {
        this.fetchScheduleData(this.scheduleYear, this.scheduleMonth + 1)
      }
    },
    switchToListMode() {
      if (this.viewMode === 'list') return
      this.viewMode = 'list'
      if (this.listDateRange && this.listDateRange.length === 2) {
        this.fetchListByRange(this.listDateRange[0], this.listDateRange[1])
      }
    },
    onListRangeChange(val) {
      if (val && val.length === 2) {
        this.fetchListByRange(val[0], val[1])
      }
    },
    prepareElectronMediaPermissions() {
      if (!window.electronAPI) return
      Promise.all([
        window.electronAPI.getMediaAccessStatus('camera'),
        window.electronAPI.getMediaAccessStatus('microphone')
      ])
        .then(([camStatus, micStatus]) => {
          const requests = []
          if (camStatus !== 'granted') {
            requests.push(window.electronAPI.askForMediaAccess('camera'))
          }
          if (micStatus !== 'granted') {
            requests.push(window.electronAPI.askForMediaAccess('microphone'))
          }
          return requests.length ? Promise.all(requests) : undefined
        })
        .catch(() => {})
    },
    async enterLiveRoom(course) {
      const now = Date.now()
      const startTime = course.fullStartTime
        ? new Date(course.fullStartTime.replace(/-/g, '/')).getTime()
        : null
      if (!startTime || now < startTime - this.limitTimeTeacher * 60 * 1000) {
        this.$message.warning('时间还未到，请耐心等候')
        return
      }
      this.prepareElectronMediaPermissions()
      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const roleNumber = role === 'STUDENT' ? 0 : 1
      let liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits/'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://localhost:8000'
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${realName}&liveid=${course.id}&classroomId=${course.liveLessonId}&_t=${Date.now()}&token=${token}`
      this.showLiveIframe = true
    },
    openVideo(course) {
      if (!course.fileList || course.fileList.length === 0 || course.status === '已结束未开播') {
        this.$message.warning('暂无回放视频')
        return
      }
      if (course.taskUuid) {
        const fileList = course.fileList || []
        const mainFile = fileList.find(f => f.videoType == '1')
        const teacherFile = fileList.find(f => f.videoType == '2')
        const { userId } = getUserInfo()
        this.$router.push({
          name: 'AIListening',
          query: {
            videoUrl: mainFile ? mainFile.filePath || '' : '',
            teacherVideoUrl: teacherFile ? teacherFile.filePath || '' : '',
            meetingId: course.taskUuid,
            meetingTitle: course.name || '',
            scopeText: course.taskUuid,
            liveLessonId: course.liveLessonId || '',
            historyLessonId: course.historyLessonId || '',
            teacherId: userId || ''
          }
        })
        return
      }
      const fileList = course.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')
      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      this.playerTitle = course.name || '视频回放'
      this.playerHistoryLessonId = String(course.historyLessonId || course.liveLessonId || '')
      this.playerAllowDownload = course.allowDownload != null ? String(course.allowDownload) : '2'
      this.playerVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.schedule-page {
  height: 100%;
  box-sizing: border-box;
  padding: 28px 24px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 顶部工具栏 ─────────────────────────────────────────────── */
.schedule-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.mode-toggle {
  display: flex;
  align-items: center;
  background: rgba(239,246,255,0.8);
  border-radius: 12px;
  padding: 4px;
  gap: 8px;
}
.mode-toggle__item {
    width: 112px;
    height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #62748E;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  font-weight: bold;
  &.active {
    background: #ffffff;
    color: #1F7CFF;
    font-weight: bold;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
}
.month-nav__btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  &:hover {
    opacity: 0.85;
  }
}
.month-nav__label {
  min-width: 100px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  padding: 0 4px;
  user-select: none;
  line-height: 36px;
}

.scope-btn {
  height: 36px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  border-radius: 12px;
  font-size: 14px;
  color: #314158;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  &:hover {
    border-color: #1F7CFF;
    color: #1F7CFF;
  }
}

.range-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.range-picker-label {
  font-size: 14px;
  color: #62748E;
  white-space: nowrap;
}
.range-picker {
  width: 240px;
  ::v-deep .el-input__inner {
    box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
    border-radius: 12px 12px 12px 12px;
    height: 36px;
    line-height: 20px;
  }
  ::v-deep .el-range-separator {
    line-height: 28px;
    color: #333;
  }

}
 ::v-deep .range-picker-wrap  .el-input__inner {
    box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE!important;
    border-radius: 12px 12px 12px 12px!important;
    height: 36px!important;
    line-height: 20px!important;
  }

/* ── 日历卡片 ───────────────────────────────────────────────── */
.calendar-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px 16px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.cal-weekday {
  text-align: center;
  font-size: 13px;
  color: #B0B5C0;
  font-weight: 400;
  padding: 4px 0;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.cal-cell {
  position: relative;
  height: 48px;
  border-radius: 12px;
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 9px 12px;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;

  &.is-other {
    opacity: 0.35;
    cursor: default;
  }

  &.has-class {
    background: #EFF6FF;
    .cal-cell__day {
      color: #1F7CFF;
    }
    .cal-cell__dot {
      background: #8EC5FF;
    }
  }

  &.is-selected {
    background: #d6e8ff;
    .cal-cell__day {
      color: #1F7CFF;
      font-weight: 600;
    }
  }

  &.is-today {
    background: #1F7CFF;
    .cal-cell__day {
      color: #ffffff;
      font-weight: 600;
    }
    .cal-cell__dot {
      background: rgba(255, 255, 255, 0.85);
    }
  }

  &:hover:not(.is-other):not(.is-today) {
    background: #E8F3FF;
  }
}
.cal-cell__day {
  font-size: 15px;
  color: #666666;
  line-height: 1;
  font-weight: 500;
}
.cal-cell__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #D0D4DC;
  margin-top: auto;
  align-self: center;
  margin-bottom: 2px;
}
.cal-cell__today-tag {
  position: absolute;
  top: 0;
  right: 0;
  background: #4E9AFF;
  color: #ffffff;
  font-size: 11px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 0 10px 0 8px;
}

/* ── 图例 ───────────────────────────────────────────────────── */
.cal-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 16px;
}
.cal-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999999;
}
.cal-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &--today {
    background: #1F7CFF;
  }
  &--class {
    background: #8EC5FF;
  }
  &--empty {
    background: #CAD5E2;
  }
}

/* ── 课程列表面板（日历模式） ───────────────────────────────── */
.course-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
  flex: 1;
//   min-height: 200px;
}
.course-panel__title {
  font-size: 16px;
  font-weight: bold;
  color: #020618;
  margin-bottom: 12px;
}
.course-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.course-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 13px;
  border: 1px solid #DBEAFE;
  border-radius: 12px;
  box-sizing: border-box;
  background: #ffffff;
  transition: border-color 0.2s;
  &:hover {
    border-color: #D0D8E8;
  }
}
.course-card__cover {
  width: 128px;
  height: 72px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.course-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.course-card__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.course-card__name {
  font-size: 14px;
  font-weight: bold;
  color: #020618;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.course-card__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  &.status-living {
    color: #22C55E;
  }
  &.status-finished {
    color: #94A3B8;
  }
  &.status-soon {
    color: #1F7CFF;
  }
  &.status-not-broadcast {
    color: #F59E0B;
  }
  &.status-unknown {
    color: #94A3B8;
  }
}
.course-card__time {
  font-size: 12px;
  color: #62748E;
}
.course-card__teacher {
  font-size: 12px;
  color: #62748E;
}
.course-card__btn {
  flex-shrink: 0;
  min-width: 80px;
  padding: 0 12px;
  height: 32px;
  background: linear-gradient(90deg, #155DFC 0%, #00BCFF 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.88;
  }
}

/* ── 列表模式 ───────────────────────────────────────────────── */
.list-panel {
 background: #FFFFFF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
border-radius: 12px 12px 12px 12px;
  padding: 20px;
  box-sizing: border-box;
  flex: 1;
//   min-height: 300px;
}

.list-group {
  position: relative;
  padding-left: 24px;
  margin-bottom: 24px;
}
.list-group__header {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 12px;
  position: relative;
}
.list-group__dot {
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1F7CFF;
  border: 2px solid #D6E8FF;
  box-sizing: border-box;
  z-index: 1;
}
.list-group__date {
  font-size: 16px;
  font-weight: bold;
  color: #020618;
}
.list-group__line {
  position: absolute;
  left: 4px;
  top: 18px;
  bottom: -8px;
  width: 1px;
  background: #E5E8EF;
}
.list-group__courses {
  display: flex;
  flex-direction: column;
  gap: 12px;
//   padding-bottom: 20px;
}

.list-course-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 13px;
  background: rgba(239,246,255,0.3);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  box-sizing: border-box;
}
.list-course-card__cover {
  width: 150px;
  height: 84px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #F5F6FA;
}
.list-course-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.list-course-card__name {
  font-size: 16px;
  font-weight: bold;
  color: #020618;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list-course-card__time {
  font-size: 14px;
  color: #1F7CFF;
}
.list-course-card__teacher {
  font-size: 14px;
  color: #62748E;
}
.list-course-card__btn {
  flex-shrink: 0;
width: 96px;
height: 36px;
background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
border-radius: 12px 12px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  color: #ffffff;
  font-size: 14px;
  
  cursor: pointer;
  white-space: nowrap;
  user-select: none;

  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
}

/* ── 直播全屏 ───────────────────────────────────────────────── */
.live-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #000;
}

@media (max-width: 1100px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
}
</style>
