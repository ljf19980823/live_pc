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
            <div class="app_last_right_detailBOX_title" v-if="currentDetail.title">{{ currentDetail.title }}</div>
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
import { getClassNotices } from '@/api/modules/teacher'

export default {
  name: 'Message',
  data() {
    return {
      showDetail: false,
      currentDetail: null,
      noticeList: [],
      classId: null
    }
  },
  computed: {
    currentList() {
      return this.noticeList
    }
  },
  created() {
    this.classId = this.$route.query.classId
    if (this.classId) {
      this.fetchNotices()
    }
  },
  methods: {
    async fetchNotices() {
      try {
        const res = await getClassNotices(this.classId)
        const data = res.data || res || []
        this.noticeList = (Array.isArray(data) ? data : []).map(item => ({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          sender: item.sendPerson || '',
          time: item.sendTime || item.createTime || '',
          joinDesc: item.joinDesc || '',
          attachCount: 0,
          hasImage: false,
          files: []
        }))
      } catch (e) {
        this.noticeList = []
      }
    },
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
.app_last_right_detailBOX_title{
  font-weight: bold;
  font-size: 16px;
  color: #333333;
  margin-bottom: 8px;
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
  white-space: pre-wrap;
}
</style>
