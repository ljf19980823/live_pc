<template>
  <div class="set-page">
    <!-- ── 左侧导航栏 ─────────────────── -->
    <aside class="set-sidebar">
      <!-- 用户信息头部 -->
      <div class="sidebar-user">
        <img v-if="userInfo.profilePicture" :src="userInfo.profilePicture" class="su-avatar_head" alt="">
        <div v-else class="su-avatar">{{ (userInfo.realName || userInfo.userName || '').slice(0, 2) }}</div>
        <div class="su-meta">
          <div class="su-name">{{ userInfo.realName || userInfo.userName }}</div>
          <div class="su-account">{{ userInfo.userName }}</div>
        </div>
      </div>

      <!-- 菜单列表 -->
      <nav class="set-nav">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="set-nav-item"
          :class="{ active: currentMenu === item.key }"
          @click="switchMenu(item.key)"
        >
          <img :src="currentMenu === item.key ? item.activeImg : item.img" class="item-icon" alt="" />
          <div class="item-label">{{ item.label }}</div>
          <img v-if="currentMenu === item.key" src="@/assets/images/set/right.png" class="set_nav_item_right" alt="">
        </div>
      </nav>

      <!-- 退出登录 -->
      <div class="set-logout_box" @click="handleLogout" @mouseenter="logoutHover = true" @mouseleave="logoutHover = false">
        <div class="set-logout">
          <img class="set-logout_img" :src="logoutHover ? require('@/assets/images/set/loginout_yes.png') : require('@/assets/images/set/loginout.png')" alt="">
          <div>退出登录</div>
        </div>
      </div>
    </aside>

    <!-- ── 右侧内容区 ─────────────────── -->
    <main class="set-content">

      <!-- ─── 我的信息 ─── -->
      <section  v-if="currentMenu === 'info' && !showChangePhone">
        <div class="section_top">
          <div class="section_top_left">
            <div class="section_top_left_text">我的信息</div>
          </div>
          <div class="section_top_right"></div>
        </div>

        <div class="section_last" style="width:664px">
          <!-- 用户信息卡片 -->
          <div class="white-card user-top-card">
            <div class="utc-left">
              <div class="utc-avatar-wrap" @click="showAvatarDialog = true">
                <img v-if="userInfo.profilePicture" :src="userInfo.profilePicture" class="utc-avatar_head" alt="">
                <div v-else class="utc-avatar">{{ (userInfo.realName || userInfo.userName || '').slice(0, 2) }}</div>
                <div class="utc-avatar-edit-mask">
                  <i class="el-icon-edit-outline utc-avatar-edit-icon"></i>
                </div>
              </div>
              <div class="utc-info">
                <div class="utc-name">{{ userInfo.realName || userInfo.userName }}</div>
                <div class="utc-role">学生 · {{ userInfo.userName }}</div>
              </div>
            </div>
            <div class="utc-right">
              <template v-if="!isEditing">
                <el-button type="primary" @click="isEditing = true">
                  <i class="el-icon-edit" /> 编辑信息
                </el-button>
              </template>
              <template v-else>
                <el-button @click="isEditing = false">
                  <i class="el-icon-close" /> 取消
                </el-button>
                <el-button type="primary" @click="handleSave">
                  <i class="el-icon-check" /> 保存
                </el-button>
              </template>
            </div>
          </div>

          <!-- 基本信息表单 -->
          <div class="white-card form-card">
            <p class="section-label">基本信息</p>

            <div class="form-field">
              <label>姓名</label>
              <el-input v-model="form.name" disabled />
            </div>

            <div class="form-field">
              <label>手机号码</label>
              <div class="phone-row">
                <el-input :value="'+86 ' + form.phone" disabled />
                <!-- <span class="inline-link" @click="openVerifyPhone">修改</span> -->
              </div>
            </div>

            <div class="form-field">
              <label>邮箱</label>
              <el-input v-model="form.email" :disabled="!isEditing" placeholder="请输入邮箱地址" />
            </div>
          </div>

          <!-- 提示信息 -->
          <!-- <div class="info-notice">
            <i class="el-icon-info notice-icon" />
            <span>个人信息仅用于平台内部展示，修改后实时生效。如需修改手机号码，请点击"修改"并完成验证。</span>
          </div> -->
        </div>
      </section>

     

      <!-- ─── 我的课表 ─── -->
      <section v-else-if="currentMenu === 'schedule' && !showChangePhone">
        <div class="section_top">
          <div class="section_top_left">
            <div class="section_top_left_text">我的课表</div>
          </div>
        </div>

        <div class="section_last schedule-section-last">
          <div class="schedule-body_box" v-loading="scheduleLoading">
            <!-- 日历 -->
            <div class="schedule-calendar">
              <div class="schedule-cal-header">
                <div class="schedule-cal-nav-box" @mousedown.prevent @click="prevScheduleMonth">
                  <i class="el-icon-arrow-left schedule-cal-nav"></i>
                </div>
                <div class="schedule-cal-selects">
                  <el-select v-model="scheduleMonth" size="mini" class="schedule-cal-select-month" :clearable="false">
                    <el-option v-for="(m, i) in monthNames" :key="i" :label="m" :value="i" />
                  </el-select>
                  <el-select v-model="scheduleYear" size="mini" class="schedule-cal-select-year" :clearable="false">
                    <el-option v-for="y in yearRange" :key="y" :label="y + ''" :value="y" />
                  </el-select>
                </div>
                <div class="schedule-cal-nav-box" @mousedown.prevent @click="nextScheduleMonth">
                  <i class="el-icon-arrow-right schedule-cal-nav"></i>
                </div>
              </div>
              <div class="schedule-cal-weekdays">
                <div v-for="d in weekDays" :key="d" class="schedule-cal-weekday">{{ d }}</div>
              </div>
              <div class="schedule-cal-grid">
                <div
                  v-for="(cell, idx) in calendarCells"
                  :key="idx"
                  class="schedule-cal-cell"
                  :class="{
                    'is-other-month': !cell.currentMonth,
                    'is-today': cell.isToday,
                    'is-selected': cell.dateStr === scheduleSelectedDate,
                    'has-class': cell.hasClass
                  }"
                  @click="cell.currentMonth && selectScheduleDate(cell.dateStr)"
                >
                  <span class="schedule-cal-day-num">{{ cell.isToday ? '今' : cell.day }}</span>
                </div>
              </div>
            </div>

            <!-- 课程列表 -->
            <div class="schedule-list" v-if="scheduleSelectedDate">
              <div class="schedule-list-title">
                {{ scheduleSelectedDateLabel }}（共{{ scheduleCoursesForDate.length }}节）
              </div>
              <div class="schedule-timeline" v-if="scheduleCoursesForDate.length > 0">
                <div
                  v-for="(course, idx) in scheduleCoursesForDate"
                  :key="idx"
                  class="schedule-timeline-item"
                >
                  <div class="schedule-timeline-left">
                    <div class="schedule-timeline-dot">
                      <div class="schedule-timeline-dot_white"></div>
                    </div>
                    <div class="schedule-timeline-line" v-if="idx < scheduleCoursesForDate.length - 1"></div>
                  </div>
                  <div class="schedule-timeline-content">
                    <div class="schedule-timeline-header">
                      <div class="schedule-timeline-time">{{ course.startTime }}{{ course.endTime ? '-' + course.endTime : '' }}</div>
                      <div
                        class="schedule-timeline-status"
                        :class="{
                          'status-living': course.status === '直播中',
                          'status-finished':  course.status === '已结束已开播' ||  course.status === '已结束未开播',
                          'status-soon': course.status === '未开始',
                          'status-not-broadcast': course.status === '未开播',
                          'status-unknown': course.status === '未知'
                        }"
                      >
                        <i class="status-dot"></i>
                        <span>{{ course.status === '已结束已开播' ||  course.status === '已结束未开播'?'已结束':course.status}}</span>
                      </div>
                    </div>
                    <div class="schedule-timeline-name">{{ course.name }}</div>
                    <div class="schedule-timeline-actions">
                      <button
                        v-if="course.status === '直播中' || course.status === '未开始'"
                        class="schedule-action-btn schedule-action-enter"
                        @click="enterLiveRoomFromSchedule(course)"
                      >进入直播间</button>
                      <button
                        v-if="course.status === '已结束已开播' || course.status === '已结束未开播'"
                        class="schedule-action-btn schedule-action-replay"
                        @click="openVideoFromSchedule(course)"
                      >查看回放</button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="schedule-empty" v-else>
                <div class="schedule-empty-text">暂无课程</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 设备和网络检测 ─── -->
      <section v-else-if="currentMenu === 'device' && !showChangePhone">

        <!-- 摄像头检测子页 -->
        <template v-if="currentDeviceCheck === 'camera'">
          <div class="section_top">
            <div class="section_top_left">
              <span class="back-btn" @click="closeDeviceCheck">
                <i class="el-icon-arrow-left" />
              </span>
              <div class="section_top_left_text">摄像头检测</div>
            </div>
          </div>
          <div class="section_last">
            <div class="white-card camera-check-card">
              <CameraCheck @result="onCameraResult" />
            </div>
          </div>
        </template>

        <!-- 麦克风检测子页 -->
        <template v-else-if="currentDeviceCheck === 'mic'">
          <div class="section_top">
            <div class="section_top_left">
              <span class="back-btn" @click="closeDeviceCheck">
                <i class="el-icon-arrow-left" />
              </span>
              <div class="section_top_left_text">麦克风检测</div>
            </div>
          </div>
          <div class="section_last">
            <div class="white-card camera-check-card">
              <MicCheck @result="onMicResult" />
            </div>
          </div>
        </template>

        <!-- 扬声器检测子页 -->
        <template v-else-if="currentDeviceCheck === 'speaker'">
          <div class="section_top">
            <div class="section_top_left">
              <span class="back-btn" @click="closeDeviceCheck">
                <i class="el-icon-arrow-left" />
              </span>
              <div class="section_top_left_text">扬声器检测</div>
            </div>
          </div>
          <div class="section_last">
            <div class="white-card camera-check-card">
              <SpeakerCheck @result="onSpeakerResult" />
            </div>
          </div>
        </template>

        <!-- 网络检测子页 -->
        <template v-else-if="currentDeviceCheck === 'network'">
          <div class="section_top">
            <div class="section_top_left">
              <span class="back-btn" @click="closeDeviceCheck">
                <i class="el-icon-arrow-left" />
              </span>
              <div class="section_top_left_text">网络检测</div>
            </div>
          </div>
          <div class="section_last">
            <NetworkCheck />
          </div>
        </template>

        <!-- 设备列表主页 -->
        <template v-else>
          <div class="section_top">
            <div class="section_top_left">
              <div class="section_top_left_text">设备和网络检测</div>
            </div>
            <div class="section_top_right">
              <div class="device-user-btn">{{ userInfo.realName || userInfo.userName }}</div>
            </div>
          </div>

          <div class="section_last">
            <!-- 系统信息卡片 -->
            <div class="white-card device-sys-card">
              <p class="device-card-label">系统信息</p>
              <div class="device-info-row">
                <span class="device-info-key">操作系统</span>
                <span class="device-info-val blue">{{ systemInfo.os }}</span>
              </div>
              <div class="device-info-row">
                <span class="device-info-key">CPU</span>
                <span class="device-info-val blue">{{ systemInfo.cpu }}</span>
              </div>
              <div class="device-info-row">
                <span class="device-info-key">内存</span>
                <span class="device-info-val">{{ systemInfo.memory }}</span>
              </div>
            </div>

            <!-- 设备检测卡片 -->
            <div class="white-card device-check-card">
              <div class="device-check-header">
                <p class="device-card-label">设备检测</p>
              </div>
              <div
                v-for="(item, idx) in deviceCheckItems"
                :key="idx"
                class="device-check-item"
                @click="openDeviceCheck(item.key)"
              >
                <div class="device-check-item-left">
                  <div class="device-check-icon">
                    <img :src="item.icon" class="device-icon-img" alt="" />
                  </div>
                  <span class="device-check-name">{{ item.name }}</span>
                </div>
                <div class="device-check-item-right">
                  <span
                    class="device-check-status"
                    :class="{
                      'status-ok': item.status === '正常',
                      'status-fail': item.status === '异常'
                    }"
                  >{{ item.status }}</span>
                  <i class="el-icon-arrow-right device-check-arrow"></i>
                </div>
              </div>
            </div>
          </div>
        </template>

      </section>

      <!-- ─── 设置 ─── -->
      <section v-else-if="currentMenu === 'settings' && !showChangePhone" >
        <div class="section_top">
          <div class="section_top_left">
            <div class="section_top_left_text">设置</div>
          </div>
         
        </div>
       <div class="section_last">
         <Settings />
       </div>
      </section>

      <!-- ─── 其他菜单占位 ─── -->
      <section v-else-if="currentMenu !== 'info' && currentMenu !== 'schedule' && currentMenu !== 'device' && currentMenu !== 'settings' && !showChangePhone" class="placeholder-section">
        <div class="placeholder-inner">
          <i class="el-icon-s-grid placeholder-icon" />
          <p>{{ currentMenuLabel }}</p>
        </div>
      </section>

      <!-- ─── 修改手机号 ─── -->
      <section v-if="showChangePhone" class="verify-section">
        <div class="verify-header">
          <span class="back-btn" @click="showChangePhone = false">
            <i class="el-icon-arrow-left" /> 返回
          </span>
          <span class="verify-page-title">修改手机号</span>
        </div>

        <div class="white-card verify-card">
          <h3 class="verify-sub">请输入新手机号码</h3>

          <div class="phone-input-row">
           
            <el-input v-model="changePhoneForm.phone" placeholder="请输入手机号" class="phone-number-input" />
          </div>

          <div class="code-row">
            <el-input v-model="changePhoneForm.code" placeholder="请输入验证码" />
            <span
              class="get-code-btn"
              :class="{ counting: changeCounting }"
              @click="startChangeCountdown"
            >{{ changeCounting ? `${changeCountdown}s 后重发` : '获取验证码' }}</span>
          </div>

          <el-button
            type="primary"
            class="next-btn"
            :disabled="!changePhoneForm.phone || !changePhoneForm.code"
            @click="handleConfirmChangePhone"
          >确定</el-button>
        </div>
      </section>


    </main>


     <!-- 选择头像弹窗 -->
      <DialogCustome
        :visible="showAvatarDialog"
        title="可选头像"
        width="420px"
        height="300px"
        :show-cancel="true"
        :show-confirm="selectedPresetIdx >= 0"
        :confirm-loading="avatarUploading"
        confirm-text="确认选择"
        cancel-text="取消"
        :show-close="true"
        @close="closeAvatarDialog"
        @cancel="closeAvatarDialog"
        @confirm="submitPresetAvatar"
      >
        <div class="avatar-dialog-content">
          <div class="avatar-preset-list">
            <div
              v-for="(avatar, idx) in presetAvatars"
              :key="idx"
              class="avatar-preset-item"
              :class="{ 'is-selected': selectedPresetIdx === idx }"
              @click="selectedPresetIdx = idx"
            >
              <div class="avatar-preset-bg">
                <img :src="avatar.img" class="avatar-preset-img" alt="" />
              </div>
            </div>
          </div>
          <div class="avatar-album-btn" :class="{ 'is-loading': avatarUploading }" @click="triggerFileInput">
            <span v-if="avatarUploading" class="avatar-album-spinner"></span>
            <span>从相册中选择</span>
          </div>
          <input ref="avatarFileInput" type="file" accept="image/*" style="display:none" @change="onAvatarFileChange" />
        </div>
      </DialogCustome>

    <!-- 直播间 -->
    <div v-if="showLiveIframe" class="live-iframe-overlay">
      <iframe :src="liveUrl" style="width: 100%; height: 100vh; background: #1E1E1E;" frameborder="0" allowfullscreen allow="camera;microphone;autoplay;display-capture;" allowusermedia></iframe>
    </div>

    <!-- 历史课堂回放 -->
    <history-video-player
      :visible="playerVisible"
      :main-source="playerSource"
      :teacher-source="playerTeacherSource"
      :title="playerTitle"
      :allow-download="currentAllowDownload"
      @close="playerVisible = false"
    />
  </div>
</template>

<script>
import { getScheduleList, getTeachingGroupStats, getTeachingGroupList, getTeachingGroupDetail, getSsoInfo, updateSsoInfo, sendCode, updatePhone } from '@/api/modules/teacher'
import { checkTempStudentLiveRecord } from '@/api'
import { getToken, getUserInfo } from '@/utils/auth'
import Settings from './components/Settings.vue'
import CameraCheck from './components/CameraCheck.vue'
import MicCheck from './components/MicCheck.vue'
import SpeakerCheck from './components/SpeakerCheck.vue'
import NetworkCheck from './components/NetworkCheck.vue'

const GROUP_COLORS = [
  'linear-gradient(135deg, #0049FF 0%, #71A0FF 100%)',
  'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
  'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
]

const MEMBER_COLORS = [
  'linear-gradient(135deg, #0049FF 0%, #71A0FF 100%)',
  'linear-gradient(135deg, #6C63FF 0%, #A78BFA 100%)',
  'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)',
  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
]

export default {
  name: 'TeacherSet',
  components: { Settings, CameraCheck, MicCheck, SpeakerCheck, NetworkCheck },
  data() {
    return {
      systemInfo: { os: '获取中...', cpu: '获取中...', memory: '获取中...' },
      logoutHover: false,
      showAvatarDialog: false,
      selectedPresetIdx: -1,
      avatarUploading: false,
      presetAvatars: [
        { img: require('@/assets/images/set/head_1.png') },
        { img: require('@/assets/images/set/head_2.png') },
        { img: require('@/assets/images/set/head_3.png') },
        { img: require('@/assets/images/set/head_4.png') },
      ],
      currentMenu: 'info',
      isEditing: false,
      userInfo: {},
      form: {
        name: '',
        phone: '',
        email: ''
      },
      showChangePhone: false,
      changePhoneForm: {
        prefix: '+86',
        phone: '',
        code: ''
      },
      changeCounting: false,
      changeCountdown: 60,
      changeCountdownTimer: null,
      menuItems: [
        { key: 'info',     label: '我的信息',      img: require('@/assets/images/set/wdxx.png'),     activeImg: require('@/assets/images/set/wdxx_yes.png') },
        { key: 'schedule', label: '我的课表',      img: require('@/assets/images/set/wdkb.png'),     activeImg: require('@/assets/images/set/wdkb_yes.png') },
        { key: 'device',   label: '设备和网络检测', img: require('@/assets/images/set/sbhwljc.png'), activeImg: require('@/assets/images/set/sbhwljc_yes.png') },
        { key: 'settings', label: '设置',          img: require('@/assets/images/set/sz.png'),       activeImg: require('@/assets/images/set/sz_yes.png') }
      ],
      showGroupDetail: false,
      currentGroup: null,
      groupList: [],
      groupStats: { groupCount: 0, memberCount: 0 },
      groupLoading: false,
      groupDetailLoading: false,
      deviceCheckItems: [
        { key: 'camera',  name: '摄像头检测', status: '未检测', icon: require('@/assets/images/set/sxtjc.png') },
        { key: 'mic',     name: '麦克风检测', status: '未检测', icon: require('@/assets/images/set/mkfjc.png') },
        { key: 'speaker', name: '扬声器检测', status: '未检测', icon: require('@/assets/images/set/ysqjc.png') },
        { key: 'network', name: '网络检测',   status: '未检测', icon: require('@/assets/images/set/wljc.png') }
      ],
      currentDeviceCheck: null,
      scheduleYear: new Date().getFullYear(),
      scheduleMonth: new Date().getMonth(),
      scheduleSelectedDate: '',
      weekDays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      scheduleApiData: [],
      scheduleLoading: false,
      showLiveIframe: false,
      liveUrl: '',
      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      currentAllowMultiple: '2',
      currentAllowFastForward: '2',
      currentAllowDownload: '2',
      currentPlayingItem: null
    }
  },
  computed: {
    currentMenuLabel() {
      const item = this.menuItems.find(m => m.key === this.currentMenu)
      return item ? item.label : ''
    },
    yearRange() {
      const cur = new Date().getFullYear()
      const arr = []
      for (let y = cur - 3; y <= cur + 5; y++) arr.push(y)
      return arr
    },
    scheduleDataByDate() {
      const map = {}
      ;(this.scheduleApiData || []).forEach(item => {
        const dateStr = item.date
        if (!dateStr) return
        map[dateStr] = (item.lives || []).map(live => ({
          id: live.id,
          name: live.name || '',
          startTime: live.startTime ? live.startTime.substring(11, 16) : '',
          endTime: live.endTime ? live.endTime.substring(11, 16) : '',
          fullStartTime: live.startTime || '',
          liveId: live.liveId || live.id,
          liveLessonId: live.liveLessonId || '',
          fileList: live.fileList || [],
          status: live.status,
          isStart: live.isStart,
          isFinish: live.isFinish
        }))
      })
      return map
    },
    calendarCells() {
      const pad = n => String(n).padStart(2, '0')
      const year = this.scheduleYear
      const month = this.scheduleMonth
      const firstDayOfWeek = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const daysInPrevMonth = new Date(year, month, 0).getDate()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      const cells = []
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i
        const pm = month === 0 ? 12 : month
        const py = month === 0 ? year - 1 : year
        cells.push({ day: d, dateStr: `${py}-${pad(pm)}-${pad(d)}`, currentMonth: false, isToday: false, hasClass: false })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
        cells.push({ day: d, dateStr, currentMonth: true, isToday: dateStr === todayStr, hasClass: !!(this.scheduleDataByDate[dateStr]?.length) })
      }
      const remaining = 42 - cells.length
      for (let d = 1; d <= remaining; d++) {
        const nm = month === 11 ? 1 : month + 2
        const ny = month === 11 ? year + 1 : year
        cells.push({ day: d, dateStr: `${ny}-${pad(nm)}-${pad(d)}`, currentMonth: false, isToday: false, hasClass: false })
      }
      return cells
    },
    scheduleCoursesForDate() {
      if (!this.scheduleSelectedDate) return []
      return this.scheduleDataByDate[this.scheduleSelectedDate] || []
    },
    scheduleSelectedDateLabel() {
      if (!this.scheduleSelectedDate) return ''
      const parts = this.scheduleSelectedDate.split('-')
      return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
    }
  },
  watch: {
    scheduleYear(val) {
      if (this.currentMenu === 'schedule') {
        this.fetchScheduleData(val, this.scheduleMonth + 1)
      }
    },
    scheduleMonth(val) {
      if (this.currentMenu === 'schedule') {
        this.fetchScheduleData(this.scheduleYear, val + 1)
      }
    }
  },
  async mounted() {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    this.scheduleSelectedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    if (window.electronAPI?.getSystemInfo) {
      try {
        const info = await window.electronAPI.getSystemInfo()
        this.systemInfo = info
      } catch (e) {
        console.error('获取系统信息失败', e)
      }
    }
  // 监听 iframe 直播退出消息
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data;
        this.showLiveIframe = false;
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI.minimizeWindow();
      }
    });
    this.fetchUserInfo()
    this.loadDeviceCheckStatus()
  },
  methods: {
    closeAvatarDialog() {
      if (this.avatarUploading) return
      this.showAvatarDialog = false
      this.selectedPresetIdx = -1
    },
    triggerFileInput() {
      if (this.avatarUploading) return
      this.$refs.avatarFileInput && this.$refs.avatarFileInput.click()
    },
    async onAvatarFileChange(e) {
      const file = e.target.files && e.target.files[0]
      e.target.value = ''
      if (!file) return
      await this.uploadAvatar(file)
    },
    async submitPresetAvatar() {
      if (this.selectedPresetIdx < 0 || this.avatarUploading) return
      const imgUrl = this.presetAvatars[this.selectedPresetIdx].img
      try {
        const res = await fetch(imgUrl)
        const blob = await res.blob()
        const ext = blob.type.split('/')[1] || 'png'
        const file = new File([blob], `preset_avatar_${this.selectedPresetIdx + 1}.${ext}`, { type: blob.type })
        await this.uploadAvatar(file)
      } catch {
        this.$message.error('头像处理失败，请重试')
      }
    },
    async uploadAvatar(file) {
      this.avatarUploading = true
      try {
        await updateSsoInfo({ avatar: file })
        this.$message.success('头像更新成功')
        await Promise.all([
          this.fetchUserInfo(),
          this.$store.dispatch('user/fetchUserInfo')
        ])
        this.showAvatarDialog = false
        this.selectedPresetIdx = -1
      } catch {
        this.$message.error('头像上传失败，请重试')
      } finally {
        this.avatarUploading = false
      }
    },
    switchMenu(key) {
      this.currentMenu = key
      this.isEditing = false
      this.showGroupDetail = false
      this.currentGroup = null
      this.closeDeviceCheck()
      if (key === 'info') {
        this.fetchUserInfo()
      }
      if (key === 'schedule') {
        this.fetchScheduleData(this.scheduleYear, this.scheduleMonth + 1)
      }
    },

    // ─── 设备检测子页 ───────────────────────────────────────
    openDeviceCheck(key) {
      this.currentDeviceCheck = key
      if (key === 'network') {
        const item = this.deviceCheckItems.find(i => i.key === 'network')
        if (item) item.status = navigator.onLine ? '正常' : '异常'
        this.saveDeviceCheckStatus()
      }
    },
    closeDeviceCheck() {
      this.currentDeviceCheck = null
    },
    onCameraResult(result) {
      const item = this.deviceCheckItems.find(i => i.key === 'camera')
      if (item) item.status = result === 'ok' ? '正常' : '异常'
      this.saveDeviceCheckStatus()
      this.closeDeviceCheck()
      if (result === 'ok') {
        this.$message.success('摄像头检测正常')
      } else {
        this.$message.warning('摄像头检测异常，请参考常见问题进行排查')
      }
    },
    onMicResult(result) {
      const item = this.deviceCheckItems.find(i => i.key === 'mic')
      if (item) item.status = result === 'ok' ? '正常' : '异常'
      this.saveDeviceCheckStatus()
      this.closeDeviceCheck()
      if (result === 'ok') {
        this.$message.success('麦克风检测正常')
      } else {
        this.$message.warning('麦克风检测异常，请参考常见问题进行排查')
      }
    },
    onSpeakerResult(result) {
      const item = this.deviceCheckItems.find(i => i.key === 'speaker')
      if (item) item.status = result === 'ok' ? '正常' : '异常'
      this.saveDeviceCheckStatus()
      this.closeDeviceCheck()
      if (result === 'ok') {
        this.$message.success('扬声器检测正常')
      } else {
        this.$message.warning('扬声器检测异常，请参考常见问题进行排查')
      }
    },

    saveDeviceCheckStatus() {
      const statusMap = {}
      this.deviceCheckItems.forEach(i => { statusMap[i.key] = i.status })
      localStorage.setItem('device_check_status', JSON.stringify(statusMap))
    },
    loadDeviceCheckStatus() {
      try {
        const raw = localStorage.getItem('device_check_status')
        if (!raw) return
        const statusMap = JSON.parse(raw)
        this.deviceCheckItems.forEach(i => {
          if (statusMap[i.key]) i.status = statusMap[i.key]
        })
      } catch (e) {
        // 数据异常时忽略
      }
    },

    openVerifyPhone() {
      this.showChangePhone = true
      this.changePhoneForm = { prefix: '+86', phone: '', code: '' }
    },
    async fetchUserInfo() {
       if (!this.$store.getters['user/token']) return
      try {
        const res = await getSsoInfo()
        const data = res.data || res || {}
        this.userInfo = data
        this.form.name = data.realName || data.userName || ''
        this.form.phone = data.phone || ''
        this.form.email = data.email || ''
      } catch (e) {
        console.error('获取用户信息失败', e)
      }
    },
    async handleSave() {
      const emailVal = (this.form.email || '').trim()
      if (!emailVal) {
        this.$message.warning('邮箱不能为空')
        return
      }
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailReg.test(emailVal)) {
        this.$message.warning('请输入正确的邮箱格式')
        return
      }
      try {
        await updateSsoInfo({ email: emailVal })
        this.$message.success('保存成功')
        this.isEditing = false
        this.fetchUserInfo()
      } catch (e) {
        this.$message.error('保存失败，请稍后重试')
      }
    },
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('user/logout').then(() => {
          this.$router.push('/login')
        })
      }).catch(() => {})
    },
    async startChangeCountdown() {
      if (this.changeCounting) return
      const phone = (this.changePhoneForm.phone || '').trim()
      if (!phone) {
        this.$message.warning('请先输入手机号')
        return
      }
      try {
        await sendCode({ phone, type: 3 })
        this.$message.success('验证码已发送')
        this.changeCounting = true
        this.changeCountdown = 60
        this.changeCountdownTimer = setInterval(() => {
          this.changeCountdown--
          if (this.changeCountdown <= 0) {
            this.changeCounting = false
            clearInterval(this.changeCountdownTimer)
          }
        }, 1000)
      } catch (e) {
        this.$message.error('发送验证码失败，请稍后重试')
      }
    },
    async handleConfirmChangePhone() {
      try {
        await updatePhone({
          newPhone: this.changePhoneForm.phone,
          code: this.changePhoneForm.code
        })
        this.$message.success('手机号修改成功')
        this.showChangePhone = false
        this.form.phone = this.changePhoneForm.phone
        this.fetchUserInfo()
      } catch (e) {
        this.$message.error('修改失败，请稍后重试')
      }
    },
    async fetchGroupData() {
      this.groupLoading = true
      try {
        const [statsRes, listRes] = await Promise.all([
          getTeachingGroupStats(),
          getTeachingGroupList()
        ])
        this.groupStats = statsRes.data || statsRes || { groupCount: 0, memberCount: 0 }
        const rawList = listRes.data || listRes || []
        this.groupList = rawList.map((item, idx) => this.mapGroupListItem(item, idx))
      } catch (_) {
        this.groupList = []
        this.groupStats = { groupCount: 0, memberCount: 0 }
      } finally {
        this.groupLoading = false
      }
    },
    mapGroupListItem(item, idx) {
      const color = GROUP_COLORS[idx % GROUP_COLORS.length]
      const name = item.groupName || ''
      return {
        id: item.groupId,
        name,
        role: item.myRoleName || '',
        subject: item.description || '',
        subjectShort: name.slice(0, 2),
        color,
        memberCount: item.memberCount || 0,
        members: (item.memberAvatars || []).map((url, i) => ({
          avatarUrl: url,
          name: '',
          color: MEMBER_COLORS[i % MEMBER_COLORS.length]
        }))
      }
    },
    mapGroupDetail(detail, color) {
      const name = detail.groupName || ''
      return {
        id: detail.groupId,
        name,
        role: detail.myRoleName || '',
        subject: detail.description || '',
        subjectShort: name.slice(0, 2),
        color,
        memberCount: detail.memberCount || 0,
        members: (detail.members || []).map((m, i) => ({
          avatarUrl: m.avatar || '',
          avatarName: m.realName ? m.realName[0] : '?',
          fullName: m.realName || '',
          role: m.roleName || '',
          isSelf: !!m.isMe,
          color: MEMBER_COLORS[i % MEMBER_COLORS.length]
        }))
      }
    },
    async viewGroupDetail(group) {
      this.currentGroup = { ...group }
      this.showGroupDetail = true
      this.groupDetailLoading = true
      try {
        const res = await getTeachingGroupDetail(group.id)
        const detail = res.data || res
        this.currentGroup = this.mapGroupDetail(detail, group.color)
      } catch (_) {
        // 保留列表基础信息继续展示
      } finally {
        this.groupDetailLoading = false
      }
    },
    backToGroupList() {
      this.showGroupDetail = false
      this.currentGroup = null
    },
    async fetchScheduleData(year, month) {
      this.scheduleLoading = true
      try {
        const res = await getScheduleList({ year: String(year), month: String(month) })
        this.scheduleApiData = res.data || res || []
      } catch (_) {
        this.scheduleApiData = []
      } finally {
        this.scheduleLoading = false
      }
    },
    selectScheduleDate(dateStr) {
      this.scheduleSelectedDate = dateStr
    },
    prevScheduleMonth() {
      if (this.scheduleMonth === 0) {
        this.scheduleMonth = 11
        this.scheduleYear -= 1
      } else {
        this.scheduleMonth -= 1
      }
    },
    nextScheduleMonth() {
      if (this.scheduleMonth === 11) {
        this.scheduleMonth = 0
        this.scheduleYear += 1
      } else {
        this.scheduleMonth += 1
      }
    },
    async enterLiveRoomFromSchedule(course) {
      const now = Date.now()
      const startTime = course.fullStartTime ? new Date(course.fullStartTime.replace(/-/g, '/')).getTime() : null
      if (!startTime || now < startTime - 30 * 60 * 1000) {
        this.$message.warning('时间还未到，请耐心等候')
        return
      }
      if (window.electronAPI) {
        try {
          const [camStatus, micStatus] = await Promise.all([
            window.electronAPI.getMediaAccessStatus('camera'),
            window.electronAPI.getMediaAccessStatus('microphone'),
          ])
          const needsRequest = []
          if (camStatus !== 'granted') needsRequest.push(window.electronAPI.askForMediaAccess('camera'))
          if (micStatus !== 'granted') needsRequest.push(window.electronAPI.askForMediaAccess('microphone'))
          if (needsRequest.length) await Promise.all(needsRequest)
        } catch (_) {}
      }
      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const liveId = course.liveId
      const roleNumber = role === 'STUDENT' ? 0 : 1
      if (role === 'STUDENT') {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          if (res.data==false) {
             this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }
      let liveBaseUrl = 'https://live.fjlsjy123.com'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://192.168.2.16:8000'
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${course.liveLessonId || ''}&_t=${Date.now()}&token=${token}`
      console.log(this.liveUrl,'地址')
      this.showLiveIframe = true
    },
    openVideoFromSchedule(course) {
      if (!course.fileList || course.fileList.length === 0 || course.status === '已结束未开播') {
        this.$message.warning('暂无回放视频')
        return
      }
      const fileList = course.fileList
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')
      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      this.playerTitle = course.name || '视频回放'
      this.currentAllowMultiple = course.allowMultiple != null ? String(course.allowMultiple) : '2'
      this.currentAllowFastForward = course.allowFastForward != null ? String(course.allowFastForward) : '2'
      this.currentAllowDownload = course.allowDownload != null ? String(course.allowDownload) : '2'
      this.currentPlayingItem = course
      this.playerVisible = true
    },
  },
  beforeDestroy() {
    if (this.changeCountdownTimer) clearInterval(this.changeCountdownTimer)
  }
}
</script>

<style lang="scss" scoped>

// ─── 整体布局 ────────────────────────────────────────────────
.set-page {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #F0F3F6;
}

// ─── 左侧导航栏 ─────────────────────────────────────────────
.set-sidebar {
  width: 213px;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow-y: auto;
}

// 用户头部
.sidebar-user {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 18px;
  box-sizing: border-box;
  border-bottom: 1px solid #F2F3F7;
  cursor: pointer;
}

.su-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  //background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
  background:#0049FF;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.su-avatar_head{
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.su-meta {
  flex: 1;
  width: 0;
}

.su-name {
  width: 100%;
  font-weight: bold;
font-size: 13px;
color: #333333;
word-break: break-all;
}
.su-account{
  font-weight: 400;
font-size: 11px;
color: #999999;
margin-top: 5px;
}

.su-arrow {
  font-size: 12px;
  color: #C0C4CC;
  flex-shrink: 0;
}

// 菜单
.set-nav {
  height: 0;
  width: 100%;
  flex: 1;
  padding: 11px;
  box-sizing: border-box;

}

.set-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px;
  border-radius: 13px;
  cursor: pointer;
  transition: background $transition-fast;
  position: relative;
  margin-bottom: 2px;

  .item-icon {
    width: 15px;
    height: 15px;
  }

  .item-label {
    flex: 1;
    font-size: 13px;
    color: #666666;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-arrow {
    font-size: 12px;
    color: #C0C4CC;
    flex-shrink: 0;
    transition: color $transition-fast;
  }

  &:hover:not(.active) {
    background: #F5F7FF;

    // .item-icon,
    // .item-label { color: $color-primary; }
  }

  &.active {
    background: #EEF3FF;

    .item-icon,
    .item-label {
      color: #0049FF;
      font-weight: bold;
    }

    .item-arrow { color: $color-primary; }

    
  }
  .set_nav_item_right{

    width: 13px;
    height: 13px;
  }
}

// 退出登录
.set-logout_box{
  padding: 9px 11px 18px 11px;
  box-sizing: border-box;
  width: 100%;
  border-top: 1px solid #F2F3F7;
}
.set-logout {
  height: 37px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: 13px;

  cursor: pointer;
  font-size: 13px;
  color: $text-secondary;
  transition: color $transition-fast;

  i { font-size: 16px; }

  &:hover { color: #FF3B30; background: #FFF0F0;}
}
.set-logout_img{
  width: 15px;
  height: 15px;
}

// ─── 右侧内容区 ─────────────────────────────────────────────
.set-content {
  flex: 1;
  // padding: 24px 28px;
  // overflow-y: auto;
  width: 0;
  height: 100%;
  min-width: 0;
  section{
    width: 100%;
     height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
}
.section_top{
  width: 100%;
  display: flex;
  height: 56px;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px 0 32px;
  box-sizing: border-box;
  background: #ffffff;
  
}
.section_top_left{
  flex: 1;
  width: 0;
 display: flex;
 justify-content: flex-start;
 align-items: center;
}
.section_top_left_text{
   font-weight: bold;
font-size: 15px;
color: #333333;
}
.section_top_right{

}
.section_last{
  width: 100%;
  flex: 1;
  height: 0;
  overflow-y: auto;
  padding: 32px;
  box-sizing: border-box;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 18px;
}

// 通用白卡
.white-card {
  background: #fff;
  border-radius: $border-radius-lg;
  padding: 20px 24px;
  margin-bottom: 14px;
}

// 用户信息顶部卡片
.user-top-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  box-sizing: border-box;
}

.utc-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.utc-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
//background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
background:#0049FF;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.utc-avatar_head{
width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.utc-avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;

  .utc-avatar,
  .utc-avatar_head {
    width: 100%;
    height: 100%;
  }

  .utc-avatar-edit-mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 50%;
  }

  &:hover .utc-avatar-edit-mask {
    opacity: 1;
  }

  .utc-avatar-edit-icon {
    font-size: 20px;
    color: #fff;
  }
}

// ─── 选择头像弹窗 ───────────────────────────────
.avatar-dialog-content {
  padding: 8px 0 4px;
}

.avatar-preset-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-preset-item {
  cursor: pointer;
  border-radius: 20px;
  border: 3px solid transparent;
  transition: border-color 0.2s;

  &.is-selected {
    border-color: #0049FF;
  }
}

.avatar-preset-bg {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preset-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-album-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #0049FF;
  cursor: pointer;
  background: #F8F9FB;
  border-radius: 13px;
  border: 1px solid #EDEEF3;
  transition: background 0.15s;

  &:hover {
    background: #F0F5FF;
  }

  &.is-loading {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.avatar-album-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #0049FF;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
.utc-name {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 5px;
}

.utc-role {
  font-size: 12px;
  color: #999999;
}

.utc-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

// 基本信息表单
.form-card {
  .section-label {
    font-size: 13px;
    color: $text-secondary;
    margin: 0 0 18px;
  }
}

.form-field {
  margin-bottom: 20px;

  &:last-child { margin-bottom: 0; }

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    margin-bottom: 8px;
  }
}

.phone-row {
  display: flex;
  align-items: center;
  position: relative;

  .el-input { flex: 1; }

  .inline-link {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    z-index: 1;

    &:hover { opacity: 0.8; }
  }
}

// 提示信息
.info-notice {
  padding: 15px 17px;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 10px;
background: #EEF3FF;
border-radius: 13px 13px 13px 13px;
border: 1px solid #CAD9FF;

  .notice-icon {
    font-size: 16px;
    color: $color-primary;
    margin-top: 1px;
    flex-shrink: 0;
  }

  span {
    font-size: 13px;
    color: #4D6FD1;
    line-height: 1.7;
  }
}

// 占位区域
.placeholder-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.placeholder-inner {
  text-align: center;
  color: $text-secondary;

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.4;
  }

  p {
    font-size: 14px;
    margin: 0;
    opacity: 0.5;
  }
}

// ─── 身份验证 ────────────────────────────────────────────────
.verify-header {
height: 56px;
background: #FFFFFF;
border-radius: 0px 0px 0px 0px;
// border: 1px solid #EDEEF3;
  display: flex;
  align-items: center;
 padding: 0 24px;
 box-sizing: border-box;
  position: relative;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: $text-regular;
  cursor: pointer;
  transition: color $transition-fast;

  i { font-size: 14px; }

  &:hover { color: $color-primary; }
}

.verify-page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  white-space: nowrap;
}

.verify-card {
  width: 664px;
  padding: 40px;
  // margin: 40px auto 0;
  // box-sizing: border-box;
  background: none;

  .verify-sub {
    font-size: 15px;
    font-weight: bold;
    color: #333333;
    margin: 0 0 26px;
  }

  .verify-input {
    margin-bottom: 14px;
  }
}

.code-row {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 22px;

  .el-input { flex: 1; }

  .get-code-btn {
    position: absolute;
    right: 14px;
    font-size: 14px;
    color: $color-primary;
    cursor: pointer;
    font-weight: 500;
    transition: color $transition-fast;
    white-space: nowrap;
    z-index: 1;

    &.counting {
      color: $text-secondary;
      cursor: default;
    }

    &:not(.counting):hover { opacity: 0.8; }
  }
}

.next-btn {
  width: 100%;
  margin-bottom: 16px;
  font-size: 15px;
  height: 42px;
  border-radius: 12px 12px 12px 12px;

  &.is-disabled {
    background: #CAD9FF !important;
    border-color: #CAD9FF !important;
    color: #fff !important;
    cursor: not-allowed;
    opacity: 1 !important;
  }
}

.verify-note {
  text-align: center;
  font-size: 13px;
  color: #999999;
  margin: 0;
}

.phone-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  gap: 0;

  .phone-prefix-select {
    width: 90px;
    flex-shrink: 0;

    ::v-deep .el-input__inner {
      border-right: none !important;
      border-radius: 4px 0 0 4px !important;
      padding-right: 20px;
    }

    ::v-deep .el-input__suffix {
      right: 4px;
    }
  }

  .phone-number-input {
    flex: 1;

    
  }
}

.confirm-btn {
  background: #5ECEC8 !important;
  border-color: #5ECEC8 !important;

  &:not(.is-disabled):hover {
    opacity: 0.85;
  }

  &.is-disabled {
    background: #A8E6E3 !important;
    border-color: #A8E6E3 !important;
  }
}
// ─── 我的教研组 ────────────────────────────────────────────
.group-summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 13px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-sizing: border-box;

  .group-summary-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  .group-summary-icon-fallback {
    font-size: 20px;
    color: #0049FF;
    flex-shrink: 0;
  }

  .group-summary-text {
    font-size: 13px;
    color: #666;

    b {
      color: #333;
      font-weight: bold;
    }
  }
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.group-card {
  background: #fff;
  border-radius: 13px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 73, 255, 0.04);
  cursor: pointer;
}

.group-card-stripe {
  height: 4px;
  flex-shrink: 0;
  border-radius: 13px 0 0 13px;
  background: linear-gradient( 90deg, #0049FF 0%, #CAD9FF 100%);
}

.group-card-body {
  flex: 1;
  padding: 19px 22px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-card-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.group-role-badge {
  width: 36px;
height: 19px;
background: #EEF3FF;
border-radius: 20px 20px 20px 20px;
display: flex;
justify-content: center;
align-items: center;

  &.role-leader {
    font-weight: bold;
font-size: 10px;
color: #0049FF;
  }

  &.role-member {
    font-weight: normal;
font-size: 10px;
color: #71A0FF;
  }
}

.group-subject-tag {
  width: 40px;
  height: 40px;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
background: linear-gradient( 45deg, #0049FF 0%, #71A0FF 100%);
border-radius: 13px 13px 13px 13px;
}

.group-card-desc {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.group-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.group-members-row {
  display: flex;
  align-items: center;
  gap: 0;

  .group-member-count {
    font-size: 12px;
    color: #666666;
    margin-left: 10px;
  }
}
.group-card-bottom_xq{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 3px;
}
.group-card-bottom_xq_text{
font-weight: bold;
font-size: 12px;
color: #71A0FF;
}
.group-card-bottom_xq_icon{
  width: 13px;
  height: 13px;
}
.member-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.member-avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.group-detail-link {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;

  i {
    font-size: 12px;
  }

  &:hover {
    color: #0049FF;
  }
}

.group-total-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  text-align: center;
  font-size: 12px;
  color: #D9D9D9;
  padding: 8px 0;
}
.group-total-tip_hx{
  flex: 1;
  width: 0;
  height: 1px;
  background: #EDEEF3;
}

// ─── 我的课表 ────────────────────────────────────────────
.schedule-section-last {
  width: 664px;
  box-sizing: border-box;
  padding: 24px 32px !important;
}

.schedule-body_box {
  overflow-y: auto;
  height: 100%;
  background: #fff;
  border-radius: 13px;
  padding: 30px;
  box-sizing: border-box;
}

.schedule-calendar {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid #F3F4F8;
}

.schedule-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.schedule-cal-selects {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.schedule-cal-select-month { width: 90px !important; }
.schedule-cal-select-year  { width: 82px !important; }

.schedule-cal-nav-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover { background: #f0f0f0; }
}

.schedule-cal-nav {
  font-size: 14px;
  color: #666;
}

.schedule-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.schedule-cal-weekday {
  text-align: center;
  font-size: 12px;
  color: #b0b5c0;
  padding: 4px 0 6px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.schedule-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px 0;
}

.schedule-cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    transition: background 0.18s;
    z-index: 0;
  }

  &:hover:not(.is-other-month)::before { background: #F0F4FF; }

  &.is-other-month {
    color: #d0d0d0;
    cursor: default;
  }

  &.is-today::before       { background: #0049FF; }
  &.is-today               { color: #fff; font-weight: 600; }
  &.is-today:hover::before { background: #1a5cff; }

  &.is-selected:not(.is-today)::before { background: #E8EEFF; }
  &.is-selected:not(.is-today)         { color: #0049FF; font-weight: 600; }

  &.has-class.is-selected:not(.is-today)::before { background: #E8EEFF; }

  &.has-class:not(.is-today)::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 2px;
    border-radius: 2px;
    background: #4E80EE;
    z-index: 1;
  }

  &.has-class.is-selected:not(.is-today)::after { background: #0049FF; }

  &.has-class.is-today::after {
    content: '';
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.75);
    z-index: 1;
  }
}

.schedule-cal-day-num {
  position: relative;
  z-index: 1;
  line-height: 1;
  margin-top: -4px;
}

.schedule-list {
  margin-top: 40px;
}

.schedule-list-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
}

.schedule-timeline {
  display: flex;
  flex-direction: column;
}

.schedule-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.schedule-timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
}

.schedule-timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #71A0FF;
  flex-shrink: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.schedule-timeline-dot_white {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
}

.schedule-timeline-line {
  width: 1px;
  flex: 1;
  min-height: 24px;
  border-left: 1px dashed #71A0FF;
  margin: 2px 0;
}

.schedule-timeline-content {
  flex: 1;
  background: #F3F4F8;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
}

.schedule-timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.schedule-timeline-time {
  font-size: 14px;
  color: #666;
}

.schedule-timeline-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  flex-shrink: 0;
  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  &.status-living {
    color: #0049FF;
    .status-dot { background: #0049FF; box-shadow: 0 0 0 2px rgba(0, 73, 255, 0.2); }
  }
  &.status-finished {
    color: #BBBBBB;
    .status-dot { background: #BBBBBB; }
  }
  &.status-soon {
    color: #FF8C00;
    .status-dot { background: #FF8C00; }
  }
  &.status-not-broadcast {
    color: #9B59B6;
    .status-dot { background: #9B59B6; }
  }
  &.status-unknown {
    color: #BBBBBB;
    .status-dot { background: #BBBBBB; }
  }
}

.schedule-timeline-name {
  font-size: 14px;
  color: #333;
  font-weight: 400;
}

.schedule-empty {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.schedule-empty-text {
  font-size: 14px;
  color: #999;
}

// ─── 教研组详情页 ─────────────────────────────────────────
.gd-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #F3F4F8;
  border-radius: 13px;
  padding: 9px 12px;
  margin-right: 12px;
  transition: color 0.2s;
  flex-shrink: 0;

  i { font-size: 13px; }

  &:hover { color: #0049FF; }
}

.gd-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.gd-banner-card {
  border-radius: 14px;
  padding: 24px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #0049FF 0%, #71A0FF 100%);
}

.gd-banner-tag {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gd-banner-info {
  flex: 1;
}

.gd-banner-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
}

.gd-banner-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.gd-stats-card {
  background: #fff;
  border-radius: 13px;
  padding: 20px 22px;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.gd-stats-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1.2;
}

.gd-stats-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.gd-member-card {
  background: #fff;
  border-radius: 13px;
  padding: 20px 22px;
  box-sizing: border-box;
}

.gd-member-card-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.gd-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;

  & + & {
    border-top: 1px solid #F5F6FA;
  }
}

.gd-member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.gd-member-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.gd-member-info {
  flex: 1;
}

.gd-member-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.gd-member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.gd-member-self-badge {
  font-size: 11px;
  color: #0049FF;
  background: #EEF3FF;
  border: 1px solid #CAD9FF;
  border-radius: 20px;
  padding: 1px 7px;
  line-height: 1.5;
}

.gd-member-role {
  font-size: 12px;
  color: #999;
}

::v-deep .el-input__inner{

border: 1px solid #CAD9FF!important;
}
::v-deep .el-input__inner:hover{

border: 1px solid #0049FF!important;
}
::v-deep .el-input.is-disabled .el-input__inner{
background-color:#F8F9FB!important;
border: 1px solid #EDEEF3!important;
color: #999999!important;
}

// ─── 设备和网络检测 ──────────────────────────────────────────

.device-user-btn {
  background: #0049FF;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
}

.device-sys-card {
  padding: 20px 24px;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.device-check-card {
  padding: 20px 24px;
  box-sizing: border-box;
}

.device-card-label {
  font-size: 13px;
  color: #999;
  margin: 0 0 16px 0;
  font-weight: 400;
}

.device-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;

  & + & {
    border-top: 1px solid #F5F6FA;
  }
}

.device-info-key {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.device-info-val {
  font-size: 13px;
  color: #666;

  &.blue {
    color: #0049FF;
  }
}

.device-check-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;

  .device-card-label {
    margin-bottom: 0;
  }
}

.device-one-btn {
  font-size: 13px !important;
  padding: 7px 18px !important;
  border-radius: 8px !important;
}

.device-check-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  cursor: pointer;

  & + & {
    border-top: 1px solid #F5F6FA;
  }
}

.device-check-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-check-icon {
  width: 36px;
  height: 36px;
  // background: #F5F6FA;
  // border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .device-icon-img {
    width: 36px;
    height: 36px;
    // object-fit: contain;
  }
}

.device-check-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.device-check-item-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.device-check-status {
  font-size: 13px;
  color: #BBBBBB;

  &.status-ok  { color: #0049FF; }
  &.status-fail { color: #EF4444; }
}

.device-check-arrow {
  font-size: 13px;
  color: #BBBBBB;
}

// ─── 摄像头/麦克风检测卡片容器 ───────────────────────────────
.camera-check-card {
  padding: 24px 32px;
  box-sizing: border-box;
}

// ─── 设置 section ─────────────────────────────────────────
.settings-section {
  display: flex;
  flex: 1;
  height: 0;
  overflow: hidden;
}

// ─── 课表操作按钮 ─────────────────────────────────────────
.schedule-timeline-actions {
  margin-top: 8px;
}
.schedule-action-btn {
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  outline: none;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:active { opacity: 0.7; }
}
.schedule-action-enter {
  background: #0049FF;
  color: #fff;
}
.schedule-action-replay {
  background: #fff;
  color: #0049FF;
  border: 1px solid #0049FF;
}

// ─── 直播 iframe 全屏覆盖 ─────────────────────────────────
.live-iframe-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background: #1E1E1E;
}
</style>
