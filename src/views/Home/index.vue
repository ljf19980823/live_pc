<template>
  <div class="app_container">
    <div class="app_container_top">
      <img src="@/assets/images/such.png" class="app_container_top_img" alt="">
    </div>
    <div class="app_container_last">
      <div class="app_container_last_left">
        <div class="app_container_last_left_top" @click="toMessage()">
          <div class="app_container_last_left_top_title">新消息</div>
          <img src="@/assets/images/home/right.png" class="app_container_last_left_top_icon" alt="">
        </div>
        <div class="app_container_last_left_list">
          <div class="app_container_last_left_list_detail" v-for="(item,index) in 6" :key="index">
            <img src="@/assets/images/head.png" class="app_container_last_left_list_detail_img" alt="">
            <div class="app_container_last_left_list_detail_mess">
              <div class="app_container_last_left_list_detail_mess_top">
                <div class="app_container_last_left_list_detail_mess_top_name">管理员</div>
                <div class="app_container_last_left_list_detail_mess_top_time">2026-03.29</div>
              </div>
              <div class="app_container_last_left_list_detail_mess_content">生活不必急于求成，慢慢来，每一步都算数。愿你眼里有光，心中有爱，日子清欢，万事顺遂。生活就像一场温柔我是的撒的旅行，不必追赶别人的脚步</div>
            </div>
          </div>
        </div>
      </div>
      <div class="app_container_last_right">
        <img class="app_container_last_right_icon" src="@/assets/images/home/such.png" alt="">
        <div class="app_container_last_right_last">
          <div class="app_container_last_right_last_title">新建实时课堂</div>
          <img src="@/assets/images/home/add.png" class="app_container_last_right_last_icon" alt="">
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      
    }
  }, 
  methods:{
    toMessage(){
      this.$router.push('/message')
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
    padding: 16px 16px 16px 0;
  box-sizing: border-box;

}
.app_container_top{
  width: 100%;
  height: 36.8%;
  border-radius:12px;
}
.app_container_top_img{
  width: 100%;
  height: 100%;
}
.app_container_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.app_container_last_left{
  background: #ffffff;
  border-radius: 12px;
  width:72%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 21px;
  padding: 13px 20px;
  box-sizing: border-box;
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
font-size: 20px;
color: #333333;
}
.app_container_last_left_top_icon{
  width: 9px;
  height: 18px;
}
.app_container_last_left_list{
  width: 100%;
  flex: 1;
  height: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 19px;
  overflow: auto;
}
.app_container_last_left_list_detail{
  width: 100%;
  border-bottom: 1px solid #F3F4F8;
  padding-bottom: 12px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 11px;
  cursor: pointer;
}
.app_container_last_left_list_detail_img{
  width: 48px;
  height: 48px;
  border-radius: 4px;
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
  gap: 5px;
}
.app_container_last_left_list_detail_mess_top_name{
  font-weight: bold;
  color: #333333;
  font-size: 16px;

}
.app_container_last_left_list_detail_mess_top_time{
  font-weight: 400;
font-size: 12px;
color: #999999;
}
.app_container_last_left_list_detail_mess_content{
  margin-top: 10px;
  font-size: 14px;
  color: #999999;
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
  height: 155px;
  background: #FFFFFF;
border-radius: 12px 12px 12px 12px;
padding: 14px 0;
box-sizing: border-box;
display: inline-flex;
flex-direction: column;
justify-content: flex-start;
align-items: center;
gap: 15px;
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
</style>