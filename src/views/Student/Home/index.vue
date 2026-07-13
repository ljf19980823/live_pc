<template>
  <div class="app_container">
    <div class="app_container_show">
      <div class="app_container_show_title">{{ greetingText }}，{{ studentDisplayName }}</div>
      <div class="app_container_show_content">{{ currentDateText }}</div>
    </div>
    <div class="app_container_first">
      <div class="app_container_first_banner">
        <el-carousel
          height="100%"
          :autoplay="false"
          arrow="always"
          indicator-position="outside"
          class="app_container_top_carousel"
        >
          <el-carousel-item v-for="(item, index) in carouselList" :key="index">
            <img :src="item.url" class="app_container_top_img" alt="">
          </el-carousel-item>
        </el-carousel>
      </div>
      <div class="app_container_first_course" v-if="latestLive" @click="enterLiveRoom(latestLive)">
        <div class="app_container_first_course_top">
          <div class="app_container_first_course_tag">
            {{ latestLive.status=='living' ?'课堂进行中':'课堂未开始'}}
            <div class="app_container_first_course_tag_fill" v-if=" latestLive.status=='living'"></div>
          </div>
          <div class="app_container_first_course_title"  v-if="latestLive.status === 'living'">
            已直播 {{ latestLive.minutes }}
          </div>
          <div class="app_container_first_course_title"  v-else>
            距离直播还有 {{ latestLive.minutes }}
          </div>
        </div>
        <div class="app_container_first_course_name">{{ latestLive.title }}</div>
        <div class="app_container_first_course_third">
          <div class="app_container_first_course_third_time">{{ latestLive.time }}</div>
          <div class="app_container_first_course_third_teacher">主讲  {{ latestLive.teacherName2 }}</div>
        </div>
        <div class="app_container_first_course_btn_Box">
          <div class="app_container_first_course_btn">进入直播</div>
        </div>
      </div>
      <div class="app_container_first_course" v-else>
        <div class="app_container_first_course_top">
          <div class="app_container_first_course_tag">
            今日无课堂
          </div>
        </div>
        <div class="app_container_first_course_btn_Box">
          合理安排时间，认真学习哦
        </div>
      </div>
    </div>

    <div class="app_container_last">
      <div class="app_container_last_left">
        <div class="app_container_last_left_header">
          <div class="app_container_last_left_header_nav">
            <div class="app_container_last_left_header_nav_list" @click="toClass()">
              <img src="@/assets/images/home/bj.png" class="app_container_last_left_header_nav_list_icon" alt="">
              <div class="app_container_last_left_header_nav_list_text">班级</div>
            </div>
             <div class="app_container_last_left_header_nav_list" @click="toCourse()">
              <img src="@/assets/images/home/kc.png" class="app_container_last_left_header_nav_list_icon" alt="">
              <div class="app_container_last_left_header_nav_list_text">课程</div>
            </div>
            <div class="app_container_last_left_header_nav_list" @click="toSchedule()">
              <img src="@/assets/images/home/kcb.png" class="app_container_last_left_header_nav_list_icon" alt="">
              <div class="app_container_last_left_header_nav_list_text">课程表</div>
            </div>
            <div class="app_container_last_left_header_nav_list" @click="toAfter()">
              <img src="@/assets/images/home/khc.png" class="app_container_last_left_header_nav_list_icon" alt="">
              <div class="app_container_last_left_header_nav_list_text">课后测</div>
            </div>
          </div>
        </div>
        <div class="app_container_last_left_line">
          <div class="app_container_last_left_top" @click="toMessage()">
            <div class="app_container_last_left_top_title">消息中心</div>
            <div class="app_container_last_left_top_icon">更多</div>
          </div>
          <div class="app_container_last_left_list">
            <div class="app_container_last_left_list_detail" v-for="(item,index) in messageList" :key="item.id || index">
              <img v-if="item.sendPersonImg" :src="item.sendPersonImg" class="app_container_last_left_list_detail_img" alt="">
              <div v-else class="app_container_last_left_list_detail_img app_container_last_left_list_detail_avatar_text">
                {{ getAvatarText(item.sendPersonName) }}
              </div>
              <div class="app_container_last_left_list_detail_mess">
                <div class="app_container_last_left_list_detail_mess_top">
                  <div class="app_container_last_left_list_detail_mess_top_name">{{ item.sendPersonName }}</div>
                  <div class="app_container_last_left_list_detail_mess_top_time">{{ item.sendTime }}</div>
                </div>
                <div class="app_container_last_left_list_detail_mess_content">{{ item.content }}</div>
              </div>
            </div>
            <EmptyState description="暂无消息数据" v-if="messageList.length==0"/>
          </div>
        </div>
      </div>
      <div class="app_container_last_right">
        <div class="app_container_last_right_title">最近观看</div>
        <div class="app_container_last_right_list" v-loading="recentViewLoading">
          <div class="app_container_last_right_list_detail" v-for="(item,index) in recentViewList" :key="item.id || index" @click="handleRecentViewClick(item)">
            <div class="app_container_last_right_list_detail_top">
              <div class="app_container_last_right_list_detail_name">{{ item.name }}</div>
              <div class="app_container_last_right_list_detail_tag" :class="getRecentViewTypeClass(item.type)">{{ getRecentViewTypeLabel(item.type) }}</div>
            </div>
            <div class="app_container_last_right_list_detail_time">观看时间 {{ item.viewingDay || item.viewingTime || '-' }}</div>
            <div class="app_container_last_right_list_detail_last" v-if="item.teacherName2 ">
              <div class="app_container_last_right_list_detail_last_text">主讲</div>
              <div class="app_container_last_right_list_detail_last_title">{{ item.teacherName2 || item.teacherName || '-' }}</div>
            </div>
          </div>
          <EmptyState description="暂无最近观看" v-if="!recentViewLoading && recentViewList.length==0"/>
        </div>
      </div>
    </div>

    <!-- 直播全屏页面 -->
    <div class="page-placeholder_last full-screen" v-if="showLiveIframe">
      <LiveClassroomFrame :src="liveUrl" @exit="showLiveIframe = false" />
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { getTeacherNoticeList, getCarouselList, getLatestLive } from '@/api'
import { formatDate } from '@/utils'
import { getToken, getUserInfo } from '@/utils/auth'
import { checkTempStudentLiveRecord, getRecentViewList } from '@/api/modules/student'

export default {
  data () {
    return {
      messageList: [],
      carouselList: [],
      recentViewList: [],
      recentViewLoading: false,
      latestLive: null,
      greetingText: '',
      currentDateText: '',
      liveUrl: '',
      showLiveIframe: false
    }
  },
  computed: {
    ...mapGetters('user', ['userInfo']),
    studentDisplayName () {
      return this.userInfo?.realName || this.userInfo?.userName || '同学'
    }
  },
  created () {
    this.updateCurrentTimeInfo()
    this.fetchMessageList()
    this.fetchCarouselList()
    this.fetchLatestLive()
    this.fetchRecentViewList()
  },
  mounted () {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        this.showLiveIframe = false
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI && window.electronAPI.minimizeWindow()
      }
    })
  },
  activated () {
    this.updateCurrentTimeInfo()
  },
  methods: {
    updateCurrentTimeInfo () {
      const now = new Date()
      const weekDays = ['日', '一', '二', '三', '四', '五', '六']

      this.greetingText = this.getGreetingText(now)
      this.currentDateText = `今天是${formatDate(now, 'YYYY年MM月DD日')}，星期${weekDays[now.getDay()]}`
    },
    getGreetingText (date) {
      const minutes = date.getHours() * 60 + date.getMinutes()

      if (minutes >= 6 * 60 + 1 && minutes <= 12 * 60) return '上午好'
      if (minutes >= 12 * 60 + 1 && minutes <= 18 * 60) return '下午好'
      return '晚上好'
    },
    getAvatarText (name) {
      return (name || '用户').trim().slice(0, 2)
    },
    toMessage () {
      this.$router.push('/student/message')
    },
    toClass () {
      this.$router.push('/student/class')
    },
    toCourse(){
      this.$router.push('/student/course')
    },
    toSchedule () {
      this.$router.push('/student/schedule')
    },
    toAfter () {
      this.$router.push({
        path: '/student/online',
        query: {
          from: 'home'
        }
      })
    },
    async fetchMessageList () {
      try {
        const res = await getTeacherNoticeList({ type: '1' })
        this.messageList = res.data || []
      } catch (e) {
        console.error('获取消息列表失败', e)
      }
    },
    async fetchCarouselList () {
      try {
        const res = await getCarouselList()
        this.carouselList = res.data || []
      } catch (e) {
        console.error('获取轮播图失败', e)
      }
    },
    async fetchLatestLive () {
      try {
        const res = await getLatestLive()
        if (!res || !res.data) {
          this.latestLive = null
          return
        }
        const isLiving = res.data.status == '直播中'
        this.latestLive = {
          ...res.data,
          title: res.data.name,
          time: this.formatTimeRange(res.data.startTime, res.data.endTime),
          status: isLiving ? 'living' : 'soon',
          minutes: res.data.liveMin
        }
      } catch (e) {
        console.error('获取最近一场直播失败', e)
        this.latestLive = null
      }
    },
    async fetchRecentViewList () {
      this.recentViewLoading = true
      try {
        const res = await getRecentViewList()
        this.recentViewList = res.data || []
      } catch (e) {
        console.error('获取最近观看失败', e)
        this.recentViewList = []
      } finally {
        this.recentViewLoading = false
      }
    },
    getRecentViewTypeLabel (type) {
      const map = {
        '2': '直播',
        '3': '回放课堂',
        '4': '视频',
        '5': '图片',
        '6': '音频',
        '7': '资料'
      }
      return map[String(type)] || '课程'
    },
    getRecentViewTypeClass (type) {
      const map = {
        '2': 'live',
        '3': 'hfkt',
        '4': 'sp',
        '5': 'tp',
        '6': 'yp',
        '7': 'zl'
      }
      return map[String(type)] || 'live'
    },
    formatTimeRange (startTime, endTime) {
      if (!startTime) return ''
      const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const todayStr = new Date().toISOString().substring(0, 10)

      const formatDateLabel = (dateStr, hideYear = false) => {
        if (dateStr === todayStr) return '今天'
        const d = new Date(dateStr)
        const label = hideYear ? dateStr.substring(5) : dateStr
        return `${label}(${WEEK[d.getDay()]})`
      }

      const startDateStr = startTime.substring(0, 10)
      const startHM = startTime.substring(11, 16)

      if (!endTime) return `${formatDateLabel(startDateStr)} ${startHM}`

      const endDateStr = endTime.substring(0, 10)
      const endHM = endTime.substring(11, 16)

      if (startDateStr === endDateStr) {
        return `${formatDateLabel(startDateStr)} ${startHM} - ${endHM}`
      }
      return `${formatDateLabel(startDateStr)} ${startHM} - ${formatDateLabel(endDateStr, true)} ${endHM}`
    },
    handleRecentViewClick (item) {
      // 直播：进入直播间；其他类型跳转课程页继续学习
      // if (String(item.type) === '2') {
      //   this.enterLiveRoom({
      //     ...item,
      //     id: item.contentId || item.id,
      //     liveLessonId: item.lessonId || item.liveLessonId || ''
      //   })
      //   return
      // }
      this.$router.push({
        path: '/student/course',
        query: item.courseId ? { courseId: item.courseId } : {}
      })
    },
    async enterLiveRoom (item) {
      const now = Date.now()
      const startTime = item.startTime ? new Date(item.startTime.replace(/-/g, '/')).getTime() : null

      // 学生：距开始时间 30 分钟以内（含）或已开始，均可进入
      if (!startTime || now < startTime - 30 * 60 * 1000) {
        this.$message.warning('时间还未到，请耐心等候')
        return
      }

      this.prepareElectronMediaPermissions()

      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const liveId = item.id
      const roleNumber = role === 'STUDENT' ? 0 : 1

      try {
        const res = await checkTempStudentLiveRecord(liveId)
        if (res.data == false) {
          this.$message.warning(res.message)
          return
        }
      } catch (_) {}

      let liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits/'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://localhost:8000'
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId}&_t=${Date.now()}&token=${token}`
      this.showLiveIframe = true
    },
    prepareElectronMediaPermissions () {
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
    }
  }
}
</script>
<style scoped>
.app_container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
  padding: 35px 24px 16px 24px;
  box-sizing: border-box;
}
.app_container_show{
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  gap:20px
}
.app_container_show_title{
  font-weight: bold;
  font-size: 24px;
  color: #020618;
  line-height: 1;
}
.app_container_show_content{
  font-weight: 400;
  font-size: 14px;
  color: #62748E;
  line-height: 1;
}
.app_container_first{
  width: 100%;
  display: flex;
  height: 26.8%;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.app_container_first_banner{
  width: 61%;
  height:100%;
  overflow: hidden;
}
.app_container_top_carousel{
  width: 100%;
  height: 100%;
  border-radius: 12px;
}
.app_container_top_carousel :deep(.el-carousel__container) {
  height: 100%;
}
.app_container_top_carousel :deep(.el-carousel__indicators--outside) {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}
.app_container_top_img{
  width: 100%;
  height: 100%;
  border-radius: 12px;
}
.app_container_first_course{
  cursor: pointer;
  flex: 1;
  width: 0;
  height:100%;
  border-radius: 12px;
  background-size: 100% 100%;
  background-image: url("@/assets/images/home/bg2.png");
  background-repeat: no-repeat;
  padding:15px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.app_container_first_course_top{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items:center;
  gap: 10px;
}
.app_container_first_course_tag{
  width: 84px;
  height: 24px;
  background: #EFFAF8;
  border-radius: 30px;
  font-weight: bold;
  font-size: 12px;
  color: #45D483;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.app_container_first_course_tag_fill{
  width: 6px;
  height: 6px;
  background: #45D483;
  border-radius: 50%;
  border: 1px solid #FFFFFF;
  position: absolute;
  right: 0;
  top: 0;
}
.app_container_first_course_title{
  color: #527391;
  font-size: 12px;
}
.app_container_first_course_name{
  font-size: 18px;
  color: #132B48;
  line-height:1;
  font-weight: bold;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}
.app_container_first_course_third{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 15px;
}
.app_container_first_course_third_time{
  font-size: 14px;
  color: #132B48;
}
.app_container_first_course_third_teacher{
  padding: 0 10px;
  height: 24px;
  background: rgba(255,255,255,0.16);
  border-radius: 29px 29px 29px 29px;
  font-size: 14px;
  color: #132B48;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.app_container_first_course_btn_Box{
  width: 100%;
  height: 57px;
  background: rgba(255, 255, 255, 0.26);
  border-radius: 16px 16px 16px 16px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-left: 14px;
  box-sizing: border-box;
  color: #FFFFFF;
  font-size: 14px;
}
.app_container_first_course_btn{
  width: 121px;
  height: 40px;
  background: linear-gradient( 90deg, #15C797 0%, #13CA99 12.5%, #12CE9B 25%, #10D19D 37.5%, #0DD59F 50%, #0AD8A1 62.5%, #07DCA3 75%, #04DFA5 87.5%, #00E3A7 100%);
  border-radius: 24px 24px 24px 24px;
  font-size: 14px;
  color: #FFFFFF;
  display:flex;
  justify-content: center;
  align-items: center;
}
.app_container_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.app_container_last_left{
  border-radius: 12px;
  width: 61%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.app_container_last_left_header{
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  width: 100%;
  padding:12px 12px;
  box-sizing: border-box;
  background: #FFFFFF;
  border-radius: 12px 12px 12px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.app_container_last_left_header_nav{
  flex: 1;
  width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.app_container_last_left_header_nav_list{
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  flex-direction: column;
  flex: 1;
  gap: 10px;
}
.app_container_last_left_header_nav_list_icon{
  width:44px;
  height:36px;
}
.app_container_last_left_header_nav_list_text{
  font-weight: bold;
  font-size: 12px;
  color: #0F172B;
}
.app_container_last_left_line{
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
  padding: 20px;
  box-sizing: border-box;
  background: #FFFFFF;
}
.app_container_last_left_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.app_container_last_left_top_title{
  font-weight: bold;
  font-size: 16px;
  color: #020618;
}
.app_container_last_left_top_icon{
  width: 48px;
  height: 24px;
  background: #EFF6FF;
  border-radius: 36px;
  font-weight: 400;
  font-size: 12px;
  color: #2B7FFF;
  display: flex;
  justify-content: center;
  align-items: center;
}
.app_container_last_left_list{
  width: 100%;
  flex: 1;
  height: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}
.app_container_last_left_list_detail{
  width: 100%;
  background: rgba(248,250,252,0.4);
  border-radius: 12px 12px 12px 12px;
  border: 1px solid rgba(219,234,254,0.7);
  padding: 12px 13px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 11px;
}
.app_container_last_left_list_detail_img{
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.app_container_last_left_list_detail_avatar_text{
  flex-shrink: 0;
  background: #0049FF;
  color: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 13px;
  font-weight: bold;
  overflow: hidden;
}
.app_container_last_left_list_detail_mess{
  flex: 1;
  width: 0;
}
.app_container_last_left_list_detail_mess_top{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 8px;
}
.app_container_last_left_list_detail_mess_top_name{
  font-weight: bolder;
  font-size: 16px;
  color: #0F172B;
}
.app_container_last_left_list_detail_mess_top_time{
  font-weight: 400;
  font-size: 12px;
  color:#90A1B9 ;
}
.app_container_last_left_list_detail_mess_content{
  margin-top: 10px;
  font-size: 14px;
  color: #62748E;
  font-weight: 500;
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.app_container_last_right{
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  cursor: pointer;
  flex: 1;
  width: 0;
  height: 100%;
  background: #FFFFFF;
  border-radius: 12px 12px 12px 12px;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
}
.app_container_last_right_title{
  font-weight: bold;
  font-size: 16px;
  color: #020618;
}
.app_container_last_right_list{
  flex: 1;
  width: 100%;
  height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: auto;
  gap: 12px;
}
.app_container_last_right_list_detail{
  padding: 13px;
  box-sizing: border-box;
  width: 100%;
  background: rgba(239,246,255,0.45);
  border-radius: 12px 12px 12px 12px;
  border: 1px solid #DBEAFE;
}
.app_container_last_right_list_detail_top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.app_container_last_right_list_detail_name{
  font-weight: bold;
  font-size: 14px;
  color: #020618;
  line-height: 20px;
  flex: 1;
  width: 0;
}
.app_container_last_right_list_detail_tag{
  height: 23px;
  padding: 0 8px;
  line-height: 23px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
}
.live{
  background: #ECFDF5;
  color: #009966;
}
.hfkt{
  background: #EFF6FF;
  color: #1F7CFF;
}
.zl{
  background: #F5F3FF;
  color: #7F22FE;
}
.sp{
  background: #FFF1F2;
  color: #EC003F;
}
.yp{
  background: #ECFEFF;
  color: #0092B8;
}
.tp{
  background: #FFFBEB;
  color:#E17100;
}
.app_container_last_right_list_detail_time{
  width: 100%;
  font-weight: 400;
  font-size: 12px;
  color: #62748E;
  margin-top: 8px;
}
.app_container_last_right_list_detail_last{
  width: 100%;
  margin-top: 12px;
  height: 32px;
  background: #FFFFFF;
  border-radius: 12px 12px 12px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  box-sizing: border-box;
}
.app_container_last_right_list_detail_last_text{
  font-weight: 400;
  font-size: 12px;
  color: #62748E;
}
.app_container_last_right_list_detail_last_title{
  font-weight: 400;
  font-size: 12px;
  color: #0F172B;
}
.full-screen{
  position: fixed;
  width: 100vw;
  height: 100%;
  top: 0;
  left: 0;
  padding: 0;
  z-index: 99999;
  overflow: hidden;
}
</style>
