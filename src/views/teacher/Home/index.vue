<template>
  <div class="app_container">
    <div class="app_container_show">
      <div class="app_container_show_title">{{ greetingText }}，{{ teacherDisplayName }}</div>
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
          合理安排时间，认真备课哦
         </div>
      </div>
    </div>
   
    <div class="app_container_last">
      <div class="app_container_last_left">
        <div class="app_container_last_left_header">
          <div class="app_container_last_left_header_left"  v-if="isAdd" @click="toCreateClass">
            <div class="app_container_last_left_header_left_title">创建实时课堂</div>
            <img src="@/assets/images/home/add2.png" class="app_container_last_left_header_left_btn" alt="">
          </div>
          <div class="app_container_last_left_header_sx" v-if="isAdd"></div>
          <div class="app_container_last_left_header_nav">
            <div class="app_container_last_left_header_nav_list" @click="toClass()">
              <img src="@/assets/images/home/bj.png" class="app_container_last_left_header_nav_list_icon" alt="">

              <div class="app_container_last_left_header_nav_list_text">班级</div>
            </div>
            <div class="app_container_last_left_header_nav_list"  @click="toSchedule()">
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
          <!-- <img src="@/assets/images/home/right.png" class="app_container_last_left_top_icon" alt=""> -->
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
        <div class="app_container_last_right_title">待启课堂</div>
        <div class="app_container_last_right_list" v-loading="pendingLiveLoading">
          <div class="app_container_last_right_list_detail" v-for="(item,index) in pendingLiveList" :key="item.id || index" @click="enterLiveRoom(item)">
            <div class="app_container_last_right_list_detail_name">{{ item.title }}</div>
            <div class="app_container_last_right_list_detail_time">{{ item.time }}</div>
            <div class="app_container_last_right_list_detail_last">
              <div class="app_container_last_right_list_detail_last_text">开播提醒</div>
              <div class="app_container_last_right_list_detail_last_title"  v-if="item.status === 'living'">已直播 {{ item.minutes }}</div>
              <div class="app_container_last_right_list_detail_last_title"  v-else>距离直播还有 {{ item.minutes }}</div>
            </div>
          </div>
          <EmptyState description="暂无待启课堂" v-if="!pendingLiveLoading && pendingLiveList.length==0"/>
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
import { getLiveList } from '@/api/modules/teacher'
import { formatDate } from '@/utils'
import { getToken, getUserInfo } from '@/utils/auth'
import { checkTempStudentLiveRecord } from '@/api/modules/student'

export default {
  data () {
    return {
      messageList: [],
      carouselList: [],
      pendingLiveList: [],
      pendingLiveLoading: false,
      latestLive: null,
      greetingText: '',
      currentDateText: '',
      isTeacher: false,
      liveUrl:"",
      showLiveIframe: false,

       // macOS 屏幕录制权限引导弹窗
      showScreenPermissionDialog: false,
      screenPermissionStatus: '',   // 'not-determined' | 'denied' | 'restricted'
      _removeScreenPermissionDenied: null,
      // macOS 屏幕采集失败弹窗（权限已授权但系统无法获取屏幕源）
      showScreenCaptureFailedDialog: false,
      _removeScreenCaptureFailed: null,
    }
  },
  computed: {
    ...mapGetters('user', ['userInfo']),
    isAdd () {
      return this.userInfo?.isAdd === '1'
    },
    teacherDisplayName () {
      return this.userInfo?.realName || this.userInfo?.userName || '升升老师'
    },
   
  },
  created () {
     this.isTeacher = getUserInfo().role === 'TEACHER'
    this.updateCurrentTimeInfo()
    this.fetchMessageList()
    this.fetchCarouselList()
    this.fetchLatestLive()
    this.fetchPendingLiveList()
  },
  mounted () {
     // 监听 iframe 直播退出消息
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data;
        this.showLiveIframe =false;
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI.minimizeWindow();
      }
    });

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
    getLiveDateText (time) {
      if (!time) return ''
      const date = new Date(time.replace(/-/g, '/'))
      if (Number.isNaN(date.getTime())) return time.substring(0, 10)

      const today = new Date()
      const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
      if (isToday) return '今天'

      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    toMessage () {
      this.$router.push('/message')
    },
    toCreateClass () {
      localStorage.setItem('openCreateClass', '1')
      this.$router.push('/online')
    },
    async fetchMessageList () {
      try {
        const res = await getTeacherNoticeList({type:"1"})
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
          const isLiving = res.data.status == '直播中' ? true : false
          const now = Date.now()
          const startMs = res.data.startTime ? new Date(res.data.startTime.replace(' ', 'T')).getTime() : null
          const isWithin30Min = startMs !== null && !isLiving && (startMs - now) <= 30 * 60 * 1000 && (startMs - now) >= 0
        this.latestLive = {
          ...res.data,
           title: res.data.name,
            time: this.formatTimeRange(res.data.startTime, res.data.endTime),
            status: isLiving ? 'living' : 'soon',
            minutes: res.data.liveMin,
        }

      
        console.log('获取最近一场直播成功', this.latestLive)
      } catch (e) {
        console.error('获取最近一场直播失败', e)
        this.latestLive = null
      }
    },
    async fetchPendingLiveList () {
      this.pendingLiveLoading = true
      try {
        const res = await getLiveList()
        const list = res.data || res || []
         this.pendingLiveList = list.map(item => {
          const isLiving = item.status == '直播中' ? true : false
         
          return {
            ...item,
            title: item.name,
            time: this.formatTimeRange(item.startTime, item.endTime),
            status: isLiving ? 'living' : 'soon',
            minutes: item.liveMin,

          }
        })
       
      } catch (e) {
        console.error('获取待启课堂失败', e)
        this.pendingLiveList = []
      } finally {
        this.pendingLiveLoading = false
      }
    },
    // ── 工具方法 ─────────────────────────────────────────────────────────
    formatTimeRange(startTime, endTime) {
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

    toClass(){
      this.$router.push('/class')
    },
    toSchedule(){
      this.$router.push('/schedule')
    },
    toAfter(){
      this.$router.push({
        path:'/online',
        query:{
          from:'home'
        }
      })
    },

     async enterLiveRoom(item) {
      console.log(item)
      const now = Date.now()
      const startTime = item.startTime ? new Date(item.startTime.replace(/-/g, '/')).getTime() : null

      if (this.isTeacher) {
        // 老师：距开始时间30分钟以内（含）或已开始，均可进入
        if (!startTime || now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      } else {
        // 学生：当前时间 >= 直播开始时间 才可进入
        if (!startTime|| now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      }
      this.prepareElectronMediaPermissions()

      const {userId,realName,userName,role}=getUserInfo();
      const token =  getToken();
      const liveId = item.id;
      const roleNumber = role === "STUDENT" ? 0 : 1;

      if (role === "STUDENT") {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          console.log(res,'呼呼呼')
         if (res.data==false) {
             this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }

      let liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits/'; //直播正式环境
      if(process.env.NODE_ENV === 'development'){
        liveBaseUrl = "http://localhost:8000";  //本地开发环境
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId}&_t=${Date.now()}&token=${token}`;
      console.log(this.liveUrl,'直播地址')
   this.showLiveIframe = true
    },

    /**
     * 预热 Electron 摄像头和麦克风权限。
     * 该流程不阻塞 iframe 创建，
     * 避免系统权限查询或首次授权弹窗拉长直播课堂首屏加载时间。
     */
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

.app_container_top{
  width: 100%;
  height: 36.8%;
  border-radius:12px;
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
  background-image: url("@/assets/images/home/bg.png");
  background-repeat: no-repeat;
  padding: 20px;
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
background: #6DB7FD;
border-radius: 30px;
font-weight: normal;
font-size: 12px;
color: #FFFFFF;
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
  color: #FFFFFF;
  font-size: 12px;
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
.app_container_last_left_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.app_container_last_left_top_title{
  font-weight: bold;
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
  /* cursor: pointer; */
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
.app_container_last_right_list_detail_name{
  font-weight: bold;
font-size: 14px;
color: #020618;
line-height: 20px;
width: 100%;
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
  font-weight: bold;
font-size: 12px;
color: #0F172B;
}
.app_container_last_right_icon{
  width: 104px;
  height: 90px;
}
.app_container_last_right_last{
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.app_container_last_right_last_title{
  font-size: 16px;
  color: #666666;
}
.app_container_last_right_last_icon{
  width: 16px;
  height: 16px;
}
.app_container_first_course_name{
  font-size: 18px;
  color: #FFFFFF;
  line-height:1;
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
  color: #FFFFFF;
}
.app_container_first_course_third_teacher{
  padding: 0 10px;
height: 24px;
background: rgba(255,255,255,0.16);
border-radius: 29px 29px 29px 29px;
font-size: 14px;
color: #FFFFFF;
display: inline-flex;
justify-content: center;
align-items: center;
}
.app_container_first_course_btn_Box{
  width: 100%;
  height: 57px;
background: rgba(255,255,255,0.1);
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
background: linear-gradient( 90deg, #4496FF 0%, #439AFF 7.14%, #429FFF 14.29%, #41A3FF 21.43%, #40A8FF 28.57%, #3FACFF 35.71%, #3EB0FF 42.86%, #3DB4FF 50%, #3CB9FF 57.14%, #3BBDFF 64.29%, #3AC1FF 71.43%, #39C5FF 78.57%, #38CAFF 85.71%, #36CEFF 92.86%, #35D2FF 100%);
border-radius: 24px 24px 24px 24px;
font-size: 14px;
color: #FFFFFF;
display:flex;
justify-content: center; 
align-items: center;
}
.app_container_last_left_header{
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
.app_container_last_left_header_left{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  width: 184px;
height: 58px;
cursor: pointer;
background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
border-radius: 12px 12px 12px 12px;
}
.app_container_last_left_header_left_title{
  font-weight: bold;
font-size: 16px;
color: #FFFFFF;
}
.app_container_last_left_header_left_btn{
  width: 36px;
  height: 36px;
}
.app_container_last_left_line{
  
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
  border-radius: 12px 12px 12px 12px;
}
.app_container_last_left_header_sx{
  width: 1px;
height: 44px;
background: #DBEAFE;
border-radius: 0px 0px 0px 0px;
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
  font-weight: normal;
font-size: 12px;
color: #0F172B;

font-weight: bold;}

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