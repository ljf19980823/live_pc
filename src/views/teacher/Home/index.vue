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
      <div class="app_container_first_course">
        <div class="app_container_first_course_top">
          <div class="app_container_first_course_tag">
          课堂进行中
          <div class="app_container_first_course_tag_fill"></div>
        </div> 
        <div class="app_container_first_course_title">
         已直播 26 分钟
        </div>
        </div>
        <div class="app_container_first_course_name">英语阅读精讲直播课</div>
        <div class="app_container_first_course_third">
          <div class="app_container_first_course_third_time">今天 19:30-20:15</div>
          <div class="app_container_first_course_third_teacher">主讲  林老师</div>
        </div>
        <div class="app_container_first_course_btn">进入直播</div>
      </div>
    </div>
   
    <div class="app_container_last">
      <div class="app_container_last_left">
        <div class="app_container_last_left_header">
          <div class="app_container_last_left_header_left"  v-if="isAdd" @click="toCreateClass">
            <div class="app_container_last_left_header_left_title">创建班级</div>
            <img src="@/assets/images/home/add2.png" class="app_container_last_left_header_left_btn" alt="">
          </div>
          <div class="app_container_last_left_header_sx" v-if="isAdd"></div>
          <div class="app_container_last_left_header_nav">
            <div class="app_container_last_left_header_nav_list" @click="toClass()">
              <img src="@/assets/images/home/bj.png" class="app_container_last_left_header_nav_list_icon" alt="">

              <div class="app_container_last_left_header_nav_list_text">班级</div>
            </div>
            <div class="app_container_last_left_header_nav_list">
              <img src="@/assets/images/home/kcb.png" class="app_container_last_left_header_nav_list_icon" alt="">

              <div class="app_container_last_left_header_nav_list_text">课程表</div>
            </div>
            <div class="app_container_last_left_header_nav_list">
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
        <div class="app_container_last_right_list" >
          <div class="app_container_last_right_list_detail" v-for="(item,index) in 3" :key="index">
            <div class="app_container_last_right_list_detail_name">高三语文 · 行测申论冲刺课</div>
            <div class="app_container_last_right_list_detail_time">2026.07.16(周四) 13:07-17:07</div>
            <div class="app_container_last_right_list_detail_last">
              <div class="app_container_last_right_list_detail_last_text">开播提醒</div>
              <div class="app_container_last_right_list_detail_last_title">距离开播 3 小时</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
import { getTeacherNoticeList, getCarouselList } from '@/api'
import { formatDate } from '@/utils'

export default {
  data () {
    return {
      messageList: [],
      carouselList: [],
      greetingText: '',
      currentDateText: ''
    }
  },
  computed: {
    ...mapGetters('user', ['userInfo']),
    isAdd () {
      return this.userInfo?.isAdd === '1'
    },
    teacherDisplayName () {
      return this.userInfo?.realName || this.userInfo?.userName || '升升老师'
    }
  },
  created () {
    this.updateCurrentTimeInfo()
    this.fetchMessageList()
    this.fetchCarouselList()
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
      this.$router.push('/message')
    },
    toCreateClass () {
      localStorage.setItem('openCreateClass', '1')
      this.$router.push('/live-class')
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
    toClass(){
      this.$router.push('/class')
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
</style>