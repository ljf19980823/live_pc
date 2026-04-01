<template>
  <div class="page-placeholder">
    <div class="app_container_box_left">
      <div class="app_container_box_left_top">
        <div class="app_top_left_text">我的班级</div>
        <img src="@/assets/images/home/add.png" class="app_top_left_icon" alt="">
      </div>
      <div class="app_container_box_left_search_box">
        <div class="app_container_box_left_search_box_top">
          <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
          <div class="app_container_box_left_search_box_top_input">
            <input type="text" placeholder="搜索">
          </div>
        </div>
        <div class="app_container_box_left_search_box_center">
          <div class="app_container_box_left_search_box_center_left">
              <el-select
            v-model="liveStatus"
            placeholder="请选择状态"
            clearable
            style="width: 100%;"
          >
            <el-option
            
              key="1"
              label="未过期"
              value="1"
            />
             <el-option
            
              key="2"
              label="已过期"
              value="2"
            />
          </el-select>
          </div>
          <div class="app_container_box_left_search_box_center_right">
            <img src="@/assets/images/class/sx.png" class="app_container_box_left_search_box_center_right_img" alt="">
          </div>
        </div>
      </div>
      <div class="app_container_box_left_list">
        <div class="app_container_box_left_list_detail app_container_box_left_list_detail_active">
          <img src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">中国近现代史</div>
          <div class="app_container_box_left_list_detail_count">657人</div>
        </div>
         <div class="app_container_box_left_list_detail">
          <img src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">中国近现代史</div>
          <div class="app_container_box_left_list_detail_count">657人</div>
        </div>
        <div class="app_container_box_left_list_detail">
          <img src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">中国近现代史</div>
          <div class="app_container_box_left_list_detail_count">657人</div>
        </div>
      </div>
    </div>
    <div class="app_container_box_right">
      <div class="app_container_box_right_top">
        <div class="app_container_box_right_top_top">
          <div class="app_container_box_right_top_top_left">
            <div class="app_container_box_right_top_top_name">立升备课-管理学</div>
            <div class="app_container_box_right_top_top_tag">剩余30天</div>
          </div>
          <div class="app_container_box_right_top_top_right">
            <img src="@/assets/images/class/rl.png" class="app_container_box_right_top_top_right_rl" alt="">
            <img src="@/assets/images/class/options.png" class="app_container_box_right_top_top_right_options" alt="">
          </div>
        </div>
        <div class="app_container_box_right_top_mess">
          <div>98人</div>
          <div>2025-06-09  ~  2026-03-30 </div>
          <div>后台创建</div>
        </div>
        <div class="app_container_box_right_top_choose">
          <div class="app_container_box_right_top_choose_detail">
            <div class="app_container_box_right_top_choose_detail_text app_container_box_right_top_choose_detail_text_active">学生</div>
            <img src="@/assets/images/class/hx.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
          <div class="app_container_box_right_top_choose_detail">
            <div class="app_container_box_right_top_choose_detail_text">课程</div>
           
          </div>
        </div>
      </div>
      <div class="app_container_box_right_last">
        <div class="app_container_box_right_last_top">
          <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
          <div class="app_container_box_left_search_box_top_input">
            <input type="text" placeholder="姓名/用户名/手机号">
          </div>
        </div>
        <div class="app_container_box_right_last_list">
          <div class="app_container_box_right_last_list_detail" v-for="(item,index) in 10" :key="index">
            <div class="app_container_box_right_last_list_detail_top">
              <img src="@/assets/images/class/options.png" class="app_container_box_right_last_list_detail_top_options" alt="">
              <div class="app_container_box_right_last_list_detail_top_mess">
                <img src="@/assets/images/class/such.png" class="app_container_box_right_last_list_detail_top_mess_icon" alt="">
                <div class="app_container_box_right_last_list_detail_top_mess_mess">立升备课-管理学牛牛牛牛牛牛</div>
              </div>
            </div>
            <div class="app_container_box_right_last_list_detail_last">进班日期：2025-03-26</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default { 
  name: 'Class' ,
  data(){
    return {
      liveStatus:''
    }
  }
}
</script>

<style lang="scss" scoped>
.page-placeholder{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
}
.app_container_box_left{
  width: 300px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
}
.app_container_box_left_top{
    width: 300px;
  height: 68px;
background: #FFFFFF;
display: flex;
justify-content: center;
align-items: center;
gap: 8px;
cursor: pointer;
border-bottom: 1px solid #F3F4F8;
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
.app_container_box_left_search_box{
  width: 100%;
  margin-top: 20px;
  padding: 0 16px ;
  box-sizing: border-box;
}
.app_container_box_left_search_box_top{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 36px;
background: #FFFFFF;
border-radius: 28px 28px 28px 28px;
border: 1px solid #999999;
gap: 8px;
padding: 0 14px;
box-sizing: border-box;
}
.app_container_box_left_search_box_top_icon{
  width: 16px;
  height: 16px;
}
.app_container_box_left_search_box_top_input{
  flex: 1;
  width: 0;
}
.app_container_box_left_search_box_top_input input{
  width: 100%;
  color: #333333;
  font-size: 14px;
}
.app_container_box_left_search_box_center{
  width: 100%;
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
}
.app_container_box_left_search_box_center_left{
width: 215px;
height: 36px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #999999;
}
.app_container_box_left_search_box_center_right{
  width: 36px;
height: 36px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #999999;
display: flex;
justify-content: center;
align-items: center;
}
.app_container_box_left_search_box_center_right_img{
  width: 16px;
  height: 16px;
}
.app_container_box_left_list{
  margin-top: 20px;
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
}
.app_container_box_left_list_detail{
  width: 300px;
height: 68px;
background: #FFFFFF;
border-radius: 0px 0px 0px 0px;
padding: 9px 30px 0 16px;
box-sizing: border-box;
position: relative;
cursor: pointer;
}
.app_container_box_left_list_detail_active{
  background: #CAD9FF!important;
}
.app_container_box_left_list_detail:hover{
  background: #F0F3F6!important;
}
.app_container_box_left_list_detail_title{
  font-weight: bold;
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
font-size: 14px;
color: #333333;
}
.app_container_box_left_list_detail_count{
  font-weight: 400;
font-size: 14px;
color: #666666;
margin-top: 9px;
}
.app_container_box_left_list_detail_chooseIcon{
  position: absolute;
  right: 2px;
  top: 2px;
  width: 14px;
  height: 14px;
}
.app_container_box_right{
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.app_container_box_right_top{
  width: 100%;
  padding: 21px 43px 2px 20px;
  box-sizing: border-box;
  border-left: 1px solid #F3F4F8;
  background: #FFFFFF;
}
.app_container_box_right_top_top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.app_container_box_right_top_top_left{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
}
.app_container_box_right_top_top_name{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_container_box_right_top_top_tag{
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border-radius: 16px;
  background: #FFEDED;
  border: 1px solid #FF2E00;
  font-weight: 400;
font-size: 14px;
color: #FF2E00;
padding: 0 9px;
box-sizing: border-box;
}
.app_container_box_right_top_top_right{
  display: flex;
  justify-content: flex-end;
  gap: 23px;
  align-items: center;
}
.app_container_box_right_top_top_right_rl{
  cursor: pointer;
  width: 20px;
  height: 18px;
}
.app_container_box_right_top_top_right_options{
  width: 20px;
  height: 4px;
}
.app_container_box_right_top_mess{
  margin-top: 22px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  font-weight: 400;
font-size: 14px;
color: #999999;
}
.app_container_box_right_top_choose{
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 40px;
  margin-top: 20px;
}
.app_container_box_right_top_choose_detail{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.app_container_box_right_top_choose_detail_text{
  font-weight: bold;
font-size: 16px;
color: #666666;
}
.app_container_box_right_top_choose_detail_hx{
  width: 31px;
  height: 3px;
}
.app_container_box_right_top_choose_detail_text_active{
  color: #333333!important;
}
.app_container_box_right_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  background: #F0F3F6;
  padding: 20px;
  box-sizing: border-box;
}
.app_container_box_right_last_top{
  width: 268px;
 display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 36px;
background: #FFFFFF;
border-radius: 28px 28px 28px 28px;
border: 1px solid #999999;
gap: 8px;
padding: 0 14px;
box-sizing: border-box;
}
.app_container_box_right_last_list{
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
  margin-top: 17px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px;
}
.app_container_box_right_last_list_detail{
  width: 190px;
background: #FFFFFF;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
display: flex;
flex-direction: column;
justify-content: space-between;
}
.app_container_box_right_last_list_detail_top{
  padding: 15px;
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 5px;
}
.app_container_box_right_last_list_detail_top_options{
  width: 20px;
  height: 4px;
}
.app_container_box_right_last_list_detail_top_mess{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}
.app_container_box_right_last_list_detail_top_mess_icon{
  width: 56px;
  height: 56px;
  border-radius: 50%;
}
.app_container_box_right_last_list_detail_top_mess_mess{
  flex: 1;
  width: 0;
  font-weight: bold;
font-size: 14px;
color: #333333;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 超出几行省略 */
  overflow: hidden;
  line-height: 22px;

}
.app_container_box_right_last_list_detail_last{
  width: 100%;
height: 36px;
background: #CAD9FF;
border-radius: 0px 0px 8px 8px;
padding-left: 12px;
line-height: 36px;
font-weight: 400;
font-size: 14px;
color: #666666;
}
</style>
