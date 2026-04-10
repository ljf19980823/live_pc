<template>
  <div class="page-placeholder">
    <div class="app_top">
      <div class="app_top_right" @click="handleBack" v-if="showDetail == false">班级公告
         <img src="@/assets/images/message/back.png" class="app_top_right_back"  alt="">
      </div>
      <div class="app_top_right" @click="showDetail=false" v-if="showDetail == true">公告详情
        <img src="@/assets/images/message/back.png" class="app_top_right_back"  alt="">
      </div>
    </div>
    <div class="app_last">
      <!-- 列表 -->
      <div class="app_last_right" v-if="showDetail == false">
        <EmptyState v-if="currentList.length === 0" description="暂无公告" />
        <div class="app_last_right_detail" @click="handleDetail(item)" v-for="(item) in currentList" :key="item.id">
          <!-- <img src="@/assets/images/message/such.png" class="app_last_right_detail_img" alt=""> -->
          <div class="app_last_right_detail_mess">
            <div class="app_last_right_detail_mess_top">
              <div class="app_last_right_detail_mess_top_left">
                <img src="@/assets/images/class/gg_icon.png" class="app_last_right_detail_mess_top_left_icon" alt="">
                <div class="app_last_right_detail_mess_top_name">{{ item.sender }}</div>
                <div class="app_last_right_detail_mess_top_time">{{ item.time }}</div>
                <div class="app_last_right_detail_mess_top_file" v-if="item.attachCount > 0">
                  <div class="app_last_right_detail_mess_top_file_sx"></div>
                  <img src="@/assets/images/message/file.png" class="app_last_right_detail_mess_top_file_icon" alt="">
                  <div class="app_last_right_detail_mess_top_file_text">{{ item.attachCount }}个附件</div>
                </div>
              </div>
            
            </div>
            <div class="app_last_right_detail_mess_con">{{ item.content }}</div>
          </div>
        </div>
      </div>
      <!-- 详情 -->
      <div class="app_last_right" v-if="showDetail == true && currentDetail">
        <div class="app_last_right_detailBOX">
            <div class="app_last_right_detailBOX_top">
               <div class="app_last_right_detail_mess_top_name">{{ currentDetail.sender }}</div>
                <div class="app_last_right_detail_mess_top_time">{{ currentDetail.time }}</div>
            </div>
            <div class="app_last_right_detail_mess_con app_last_right_detail_mess_con_full">{{ currentDetail.content }}</div>
            <div class="app_last_right_detailBOX_last" v-if="currentDetail.hasImage || currentDetail.files.length > 0">
              <img v-if="currentDetail.hasImage" src="@/assets/images/message/such.png" class="app_last_right_detailBOX_last_img" alt="">
              <div
                class="app_last_right_detailBOX_last_file"
                v-for="(file, fi) in currentDetail.files"
                :key="fi"
              >
                <img src="@/assets/images/message/icon.png" class="app_last_right_detailBOX_last_file_icon" alt="">
                <div class="app_last_right_detailBOX_last_file_mess">
                  <div class="app_last_right_detailBOX_last_file_mess_title">{{ file.name }}</div>
                  <div class="app_last_right_detailBOX_last_file_mess_size">{{ file.size }}</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Message',
  data() {
    return {
      showDetail: false,
      activeTab: 'sent',
      currentDetail: null,

      sentMessages: [
        {
          id: 1,
          sender: '管理员',
          time: '2026-03-29',
          content: '生活就像一场温柔的旅行，不必追赶别人的脚步，也不必焦虑尚未到来的明天。认真对待每一件小事，珍惜身边的温暖，把平凡的日子过得热气腾腾。愿你在忙碌中不忘热爱，在疲惫时仍有期待，眼里有星光，心中有方向，所遇皆温柔，所行皆坦途。',
          attachCount: 1,
          hasImage: true,
          files: [{ name: '使用说明.docx', size: '13KB' }]
        },
        {
          id: 2,
          sender: '张老师',
          time: '2026-03-28',
          content: '明天上午9点有一个重要的线上直播课，请提前做好准备，检查好设备和网络连接，确保直播顺利进行。',
          attachCount: 0,
          hasImage: false,
          files: []
        },
        {
          id: 3,
          sender: '李老师',
          time: '2026-03-27',
          content: '本周课程安排已更新，请各位同学及时查看课程表，合理安排学习时间，有疑问请及时联系助教老师。',
          attachCount: 2,
          hasImage: true,
          files: [
            { name: '课程表.xlsx', size: '25KB' },
            { name: '学习资料.pdf', size: '128KB' }
          ]
        },
        {
          id: 4,
          sender: '王助教',
          time: '2026-03-26',
          content: '关于下周考试的通知，请各位同学认真复习第一章到第五章的内容，重点掌握核心知识点，做到融会贯通。',
          attachCount: 1,
          hasImage: false,
          files: [{ name: '复习提纲.docx', size: '45KB' }]
        },
        {
          id: 5,
          sender: '教务处',
          time: '2026-03-25',
          content: '五一假期放假通知：2026年5月1日至5月5日放假，5月6日正常上课。请各位同学提前做好安排，祝大家节日快乐！',
          attachCount: 0,
          hasImage: false,
          files: []
        }
      ],
      receivedMessages: [
        {
          id: 1,
          sender: '铂金班-小明',
          time: '2026-03-29',
          content: '老师好，我想请假明天的直播课，因为临时有事，能否课后给我补发录播视频？谢谢老师！',
          attachCount: 0,
          hasImage: false,
          files: []
        },
        {
          id: 2,
          sender: '黄金班-小红',
          time: '2026-03-28',
          content: '老师，我在学习第三章的时候遇到了一个问题，不太理解那个知识点，方便的话能详细解释一下吗？',
          attachCount: 1,
          hasImage: true,
          files: [{ name: '问题截图.png', size: '56KB' }]
        },
        {
          id: 3,
          sender: '钻石班-小华',
          time: '2026-03-27',
          content: '感谢老师精彩的直播课！今天的内容很实用，特别是实战环节让我受益匪浅，期待下次的课程！',
          attachCount: 0,
          hasImage: false,
          files: []
        },
        {
          id: 4,
          sender: '铂金班-小李',
          time: '2026-03-26',
          content: '老师您好，关于上次布置的作业，我完成了但是提交系统一直显示错误，麻烦看一下是什么问题。',
          attachCount: 1,
          hasImage: false,
          files: [{ name: '作业文件.zip', size: '2.3MB' }]
        },
        {
          id: 5,
          sender: '黄金班-小张',
          time: '2026-03-25',
          content: '老师，我对课程内容非常感兴趣，想了解一下是否有进阶课程或者推荐的学习资料，请问在哪里可以找到？',
          attachCount: 0,
          hasImage: false,
          files: []
        }
      ]
    }
  },
  computed: {
    currentList() {
      return this.activeTab === 'sent' ? this.sentMessages : this.receivedMessages
    }
  },
  methods: {
    handleBack() {
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    },
    handleDetail(item) {
      this.currentDetail = item
      this.showDetail = true
    }
  }
}
</script>

<style lang="scss" scoped>
.page-placeholder{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 0 16px 0;
  box-sizing: border-box;
}
.app_top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}
.app_top_right{
  background: #ffffff;
  position: relative;
  flex: 1;
  width: 0;
  display: flex;
  height: 68px;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}
.app_top_right_back{
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 7px;
  height: 14px;
  cursor: pointer;
}
.app_last{
  gap: 4px;
  flex: 1;
  height: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}
.app_last_right{
  flex: 1;
  width: 0;
  overflow: auto;
  padding-left: 16px;
  padding-top: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.app_last_right_detail{
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 4px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 17px;
  cursor: pointer;
}
.app_last_right_detail_img{
  width: 68px;
  height: 68px;
  border-radius: 4px;
}
.app_last_right_detail_mess{
  flex: 1;
  width: 0;
}
.app_last_right_detail_mess_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.app_last_right_detail_mess_top_left{
  display: flex;
  justify-content: flex-start;
  align-items:flex-end;
  gap: 8px;
}
.app_last_right_detail_mess_top_left_icon{
    width: 18px;
    height: 18px;
}
.app_last_right_detail_mess_top_name{
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}
.app_last_right_detail_mess_top_file{
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 8px;
}
.app_last_right_detail_mess_top_file_sx{
  width: 1px;
  height: 11px;
  background: #D9D9D9;
}
.app_last_right_detail_mess_top_file_icon{
  width: 15px;
  height: 14px;
}
.app_last_right_detail_mess_top_file_text{
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}
.app_last_right_detail_mess_top_time{
  font-weight: 400;
  font-size: 12px;
  color: #999999;
  align-self: flex-end;
}
.app_last_right_detail_mess_top_options{
  width: 20px;
  height: 4px;
}
.app_last_right_detail_mess_con{
  margin-top: 10px;
  width: 100%;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: #999999;
  font-size: 14px;
  line-height: 22px;
}
.app_last_right_detailBOX{
  width: 100%;
  padding: 12px;
  background: #ffffff;
  border-radius: 4px;
}
.app_last_right_detailBOX_top{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 8px;
}
.app_last_right_detailBOX_last{
  width: 100%;
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}
.app_last_right_detailBOX_last_img{
  width: 88px;
  height: 88px;
  border-radius: 4px;
}
.app_last_right_detailBOX_last_file{
  width: 214px;
  height: 56px;
  background: #F3F4F8;
  border-radius: 4px;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.app_last_right_detailBOX_last_file_icon{
  width: 36px;
  height: 36px;
}
.app_last_right_detailBOX_last_file_mess{
  flex: 1;
  width: 0;
}
.app_last_right_detailBOX_last_file_mess_title{
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.app_last_right_detailBOX_last_file_mess_size{
  font-weight: 400;
  font-size: 14px;
  color: #999999;
  margin-top: 5px;
}
.app_last_right_detail_mess_con_full{
  -webkit-line-clamp: unset;
  overflow: visible;
}
</style>
