<template>
  <div class="page-placeholder">
    <div class="app_top">
      <div class="app_top_left" @click="showDialog = true">
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


    <!-- 添加消息弹窗 -->
    <DialogCustome :visible="showDialog" title="发消息" @cancel="onDialogCancel"  @confirm="onDialogConfirm">
      <div class="dialog_con">
        <div class="dialog_con_top" @click="handleChooseReceive()"> 
          <div class="dialog_con_top_left">
            <!-- <div class="dialog_con_top_left_empty">接收班级</div> -->
            <div class="dialog_con_top_left_detail" v-for="(item,index) in 10" :key="index">
              <div class="dialog_con_top_left_detail_name">大霸王龙</div>
              <img src="@/assets/images/message/close.png" class="dialog_con_top_left_detail_close" alt="">
            </div>
            
          </div>
          <img src="@/assets/images/message/add.png" class="dialog_con_top_btn" alt="">
        </div>
        <div class="dialog_con_last">
          <div class="dialog_con_last_con">
           <el-input
           class="my-input"
            type="textarea"
            :rows="5"
            style="width:100%"
            placeholder="消息内容"
            v-model="messageContent">
          </el-input>
          <div class="dialog_con_last_con_other">
            <div class="dialog_con_last_con_other_img">
              <img src="@/assets/images/message/such.png" class="dialog_con_last_con_other_img_img" alt="">
              <img src="@/assets/images/message/close.png" class="dialog_con_last_con_other_img_close" alt="">
            </div>
            <div class="dialog_con_last_con_other_file">
              <img src="@/assets/images/message/icon.png" class="dialog_con_last_con_other_file_fm" alt="">
              <div class="dialog_con_last_con_other_file_mess">
                <div class="dialog_con_last_con_other_file_mess_title">使用说明.docx</div>
                <div class="dialog_con_last_con_other_file_mess_size">13KB</div>
              </div>
              <img src="@/assets/images/message/close.png" class="dialog_con_last_con_other_img_close" alt="">
            </div>
          </div>
          </div>
          <div class="dialog_con_last_btn">
            <img src="@/assets/images/message/fileIcon.png" class="dialog_con_last_btn_file" alt="">
            <img src="@/assets/images/message/imgIcon.png" class="dialog_con_last_btn_img" alt="">
          </div>
        </div>
      </div>
      <!-- 自定义弹窗内容 -->
    </DialogCustome>

    <!-- 选择接收人弹窗 -->
     <DialogCustome width="676px" height="585px" :visible="showDialogReceive" title="选择接收人" @cancel="onDialogCancelReceive"  @confirm="onDialogConfirmReceive">
      <div class="receive_tc_box">
        <div class="receive_tc_box_left">
          <div class="receive_tc_box_left_top">
            <div class="receive_tc_box_left_top_detail receive_tc_box_left_top_detail_active">老师</div>
            <div class="receive_tc_box_left_top_detail">学生</div>
          </div>
          <div class="receive_tc_box_left_list">
            <div class="receive_tc_box_left_list_detail" v-for="(item,index) in 3" :key="index">
              <div class="receive_tc_box_left_list_detail_class">
                <img src="@/assets/images/message/xl_no.png" alt="" class="receive_tc_box_left_list_detail_class_xl">
                <img src="@/assets/images/message/tag.png" alt="" class="receive_tc_box_left_list_detail_class_tag">
                <div class="receive_tc_box_left_list_detail_class_title">铂金班</div>
                <img src="@/assets/images/message/choose_no.png" alt="" class="receive_tc_box_left_list_detail_class_choose">
              </div>
              <div class="receive_tc_box_left_list_detail_second">
                <div class="receive_tc_box_left_list_detail_second_detail" v-for="(item2,index2) in 3" :key="index2">
                  <img src="@/assets/images/message/such.png" class="receive_tc_box_left_list_detail_second_detail_fm" alt="">
                  <div class="receive_tc_box_left_list_detail_second_detail_name">立升老师-霸王龙</div>
                  <img src="@/assets/images/message/choose_yes.png" alt="" class="receive_tc_box_left_list_detail_class_choose">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="receive_tc_box_right">
          <div class="receive_tc_box_right_top">已选择<span>1</span>人</div> 
          <div class="receive_tc_box_right_list">
            <div class="receive_tc_box_right_list_detail" v-for="(item,index) in 3" :key="index">
              <img src="@/assets/images/message/such.png" class="receive_tc_box_right_list_detail_head" alt="">
              <div class="receive_tc_box_right_list_detail_title">立升老师-霸王龙</div>
              <img src="@/assets/images/message/close.png" class="receive_tc_box_right_list_detail_close" alt="">
            </div>
          </div> 
        </div>
      </div>
    </DialogCustome>
  </div>
</template>

<script>
export default {
  name: 'Message',
  data() {
    return {
      showDetail: false,
      showDialog: false,
      showDialogReceive:false,
      messageContent:''
    }
  },
  methods: {
    handleDetail() {
      this.showDetail = true
    },
    onDialogCancel() {
      // 取消时的自定义逻辑
      this.showDialog = false
    },
    onDialogConfirm() {
      // 确定时的自定义逻辑
      this.showDialog = false
    },
    onDialogCancelReceive() {
      // 取消时的自定义逻辑
      this.showDialogReceive = false
    },
    onDialogConfirmReceive() {
      // 确定时的自定义逻辑
      this.showDialogReceive = false
    },
    handleChooseReceive(){
      // 确定时的自定义逻辑
      this.showDialogReceive = true
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



.dialog_con{
  width: 100%;
}
.dialog_con_top{
  border-radius: 8px 8px 8px 8px;
  width: 100%;
  height: 56px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 0 20px 0 17px;
  box-sizing: border-box;
  cursor: pointer;
}
.dialog_con_top_left{
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: center;
  overflow: auto;
}
.dialog_con_top_btn{
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.dialog_con_top_left_detail{
  height: 32px;
  display: inline-flex;
  border-radius: 4px 4px 4px 4px;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #CAD9FF;
  flex-shrink: 0;
}
.dialog_con_top_left_detail_name{
  color: #333333;
  font-size: 14px;
  white-space: nowrap;
}
.dialog_con_top_left_detail_close{
  width: 16px;
  height: 16px;
}
.dialog_con_top_left_empty{
  font-weight: 400;
font-size: 16px;
color: #999999;
}
.dialog_con_last{
  width: 100%;
  margin-top: 16px;
  background: #ffffff;
  padding: 11px 20px 16px 17px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.dialog_con_last_con{
  min-height: 228px;
  width: 100%;
}
.dialog_con_last_btn{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}
.dialog_con_last_btn_file{
  width: 19px;
  height: 18px;
  cursor: pointer;
}
.dialog_con_last_btn_img{
   width: 19px;
  height: 18px;
  cursor: pointer;
}
::v-deep .el-textarea__inner{
  padding: 0!important;
  border: none!important;
  color: #333333!important;
  font-size: 16px!important;
}
::v-deep .el-textarea__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}
.dialog_con_last_con_other{
  width: 100%;
  margin-top: 19px;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.dialog_con_last_con_other_img{
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 4px 4px 4px 4px;
}
.dialog_con_last_con_other_img_img{
  width: 100%;
  height: 100%;
  border-radius: 4px 4px 4px 4px;
}
.dialog_con_last_con_other_img_close{
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.dialog_con_last_con_other_file{
  position: relative;
  width: 214px;
height: 56px;
background: #F3F4F8;
border-radius: 4px 4px 4px 4px;
padding: 0 12px;
box-sizing: border-box;
display: flex;
justify-content: flex-start;
align-items: center;
gap: 8px;
}
.dialog_con_last_con_other_file_mess{
  flex: 1;
  width: 0;
}
.dialog_con_last_con_other_file_mess_title{
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.dialog_con_last_con_other_file_fm{
  width: 36px;
  height: 36px;
}
.dialog_con_last_con_other_file_mess_size{
  font-weight: 400;
font-size: 14px;
color: #999999;
margin-top: 5px;
}


.receive_tc_box{
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 100%;

  gap: 12px;
}
.receive_tc_box_left{
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 12px;
  width: 361px;
}
.receive_tc_box_left_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 9px;
}
.receive_tc_box_left_top_detail{
  width: 176px;
height: 48px;
background: #FFFFFF;
border-radius: 8px;
font-weight: 400;
font-size: 16px;
color: #333333;
display: flex;
justify-content: center;
align-items: center;
}
.receive_tc_box_left_top_detail_active{
  background: #0049FF!important;
  color: #FFFFFF!important;
  font-weight: bold;
}
.receive_tc_box_left_list{
  flex: 1;
  height: 0;
  background:#FFFFFF ;
  border-radius: 8px;
  overflow: auto;
  padding: 14px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.receive_tc_box_left_list_detail{
  width: 100%;
}
.receive_tc_box_left_list_detail_class{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_class_xl{
  width: 8px;
  height: 8px;
}
.receive_tc_box_left_list_detail_class_tag{
  margin: 0 6px 0 12px;
  width: 14px;
  height: 14px;
}
.receive_tc_box_left_list_detail_class_choose{
  width: 16px;
  height: 16px;
}
.receive_tc_box_left_list_detail_class_title{
  margin-right: 10px;
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}

.receive_tc_box_left_list_detail_second{
  padding-left: 18px;
  box-sizing: border-box;
  width: 100%;
   margin-top: 16px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-direction: column;
}
.receive_tc_box_left_list_detail_second_detail{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_second_detail_fm{
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_left_list_detail_second_detail_name{
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.receive_tc_box_right{
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px ;
  padding: 8px 17px;
  box-sizing: border-box;
}
.receive_tc_box_right_top{
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.receive_tc_box_right_top span{
  font-size: 20px;
  font-weight: bold;
}
.receive_tc_box_right_list{
  flex: 1;
  height: 0;
  overflow: auto;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 8px;
}
.receive_tc_box_right_list_detail{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.receive_tc_box_right_list_detail_head{
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_right_list_detail_close{
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.receive_tc_box_right_list_detail_title{
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
</style>
