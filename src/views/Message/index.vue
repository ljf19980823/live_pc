<template>
  <div class="page-placeholder">
    <div class="app_top">
      <div class="app_top_left">
        <div class="app_top_left_text">消息</div>
        <img src="@/assets/images/home/add.png" class="app_top_left_icon" alt="">
      </div>
      <div class="app_top_right" v-if="showDetail == false">已发消息</div>
      <div class="app_top_right" @click="showDetail=false" v-if="showDetail == true">消息详情
        <img src="@/assets/images/message/back.png" class="app_top_right_back"  alt="">
      </div>
    </div>
    <div class="app_last">
      <div class="app_last_left">
        <div class="app_last_left_detail_active">已发消息</div>
        <div class="app_last_left_detail">已收消息</div>
      </div>
      <!-- 列表 -->
      <div class="app_last_right" v-if="showDetail == false">
        <div class="app_last_right_detail" @click="handleDetail(item)" v-for="(item,index) in 10" :key="index">
          <img src="@/assets/images/message/such.png" class="app_last_right_detail_img" alt="">
          <div class="app_last_right_detail_mess">
            <div class="app_last_right_detail_mess_top">
              <div class="app_last_right_detail_mess_top_left">
                <div class="app_last_right_detail_mess_top_name">管理员</div>
                <div class="app_last_right_detail_mess_top_time">2026-03.29</div>
                <div class="app_last_right_detail_mess_top_file">
                  <div class="app_last_right_detail_mess_top_file_sx"></div>
                  <img src="@/assets/images/message/file.png" class="app_last_right_detail_mess_top_file_icon" alt="">
                  <div class="app_last_right_detail_mess_top_file_text">1个附件</div>
                </div>
              </div>
              <img src="@/assets/images/message/options.png" class="app_last_right_detail_mess_top_options" alt="">
            </div>
            <div class="app_last_right_detail_mess_con">生活就像一场温柔的旅行，不必追赶别人的脚步，也不必焦虑尚未到来的明天。认真对待每一件小事，珍惜身边的温暖，把平凡的日子过得热气腾腾。愿你在忙碌中不忘热爱，在疲惫时仍有期待，眼里有星光，心中有方向，所遇皆温柔，所行皆坦途。</div>
          </div>
        </div>
      </div>
      <!-- 详情 -->
      <div class="app_last_right" v-if="showDetail == true">
        <div class="app_last_right_detailBOX">
            <div class="app_last_right_detailBOX_top">
               <div class="app_last_right_detail_mess_top_name">管理员</div>
                <div class="app_last_right_detail_mess_top_time">2026-03.29</div>
            </div>
            <div class="app_last_right_detail_mess_con">生活就像一场温柔的旅行，不必追赶别人的脚步，也不必焦虑尚未到来的明天。认真对待每一件小事，珍惜身边的温暖，把平凡的日子过得热气腾腾。愿你在忙碌中不忘热爱，在疲惫时仍有期待，眼里有星光，心中有方向，所遇皆温柔，所行皆坦途。</div>
            <div class="app_last_right_detailBOX_last">
              <img src="@/assets/images/message/such.png" class="app_last_right_detailBOX_last_img" alt="">
              <div class="app_last_right_detailBOX_last_file">
                <img src="@/assets/images/message/icon.png" class="app_last_right_detailBOX_last_file_icon" alt="">
                <div class="app_last_right_detailBOX_last_file_mess">
                  <div class="app_last_right_detailBOX_last_file_mess_title">使用说明.docx</div>
                  <div class="app_last_right_detailBOX_last_file_mess_size">13KB</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'Message',
  data() {
    return {
      showDetail:false
    }
  },
  methods:{
    handleDetail(){
      this.showDetail=true
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
.app_top_left{
  width: 300px;
  height: 68px;
background: #FFFFFF;
display: flex;
justify-content: center;
align-items: center;
gap: 8px;
cursor: pointer;
}
.app_top_left_text{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_top_left_icon{
  width: 16px;
  height: 16px;
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
.app_last_left{
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
border-radius: 4px 4px 4px 4px;
}
.app_last_left_detail{
  cursor: pointer;
  width: 100%;
  height: 68px;
  background: #F0F3F6;
border-radius: 4px 4px 4px 4px;
padding-left: 24px;
line-height: 68px;
color: #333333;
font-size: 16px;
}
.app_last_left_detail_active{
  width: 100%;
  height: 68px;
  background: #CAD9FF;
border-radius: 4px 4px 4px 4px;
padding-left: 24px;
line-height: 68px;
color: #0049FF;
font-size: 16px;
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
</style>
