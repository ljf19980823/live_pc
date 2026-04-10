<template>
     <div class="mask" v-if="visible">
        <div class="mask_con">
            <div class="masl_con_dialog">
                <div class="masl_con_dialog_top">
                    <img src="@/assets/images/student/close.png" class="masl_con_dialog_top_close" alt="" @click="$emit('close')">
                    <img src="@/assets/images/student/share.png" class="masl_con_dialog_top_share" alt="">
                </div>
                <div class="masl_con_dialog_con">
                    <div class="masl_con_dialog_con_basic">
                        <div class="masl_con_dialog_con_basic_top">
                            <img src="@/assets/images/class/such.png" class="masl_con_dialog_con_basic_top_fm" alt="">
                            <div class="masl_con_dialog_con_basic_top_title">霸王龙</div>
                        </div>
                        <div class="masl_con_dialog_con_basic_last">
                            <div class="masl_con_dialog_con_basic_last_detail">
                                <img src="@/assets/images/student/jb.png" class="masl_con_dialog_con_basic_last_detail_icon" alt="">
                                <div class="masl_con_dialog_con_basic_last_detail_title">2026-02-06进班</div>
                            </div>
                            <div class="masl_con_dialog_con_basic_last_detail">
                                <img src="@/assets/images/student/bz.png" class="masl_con_dialog_con_basic_last_detail_icon" alt="">
                                <div class="masl_con_dialog_con_basic_last_detail_title">我是无敌霸王龙</div>
                            </div>
                        </div>
                    </div>
                    <div class="masl_con_dialog_con_xq">
                        <div class="masl_con_dialog_con_xq_title">学情数据</div>
                        <div class="masl_con_dialog_con_xq_top">
                            <div class="masl_con_dialog_con_xq_top_left">更新时间：03-31  10:06</div>
                            <div class="masl_con_dialog_con_xq_top_right">
                                <div class="masl_con_dialog_con_xq_top_right_text">近 1 月</div>
                                <img src="@/assets/images/student/xl.png" class="masl_con_dialog_con_xq_top_right_xl" alt="">
                            </div>
                        </div>
                        <div class="masl_con_dialog_con_xq_detail">
                            <div class="masl_con_dialog_con_xq_detail_top">
                                <div class="masl_con_dialog_con_xq_detail_top_left">
                                    <img src="@/assets/images/student/sk.png" class="masl_con_dialog_con_xq_detail_top_left_icon" alt="">
                                    <div class="masl_con_dialog_con_xq_detail_top_left_title">上课</div>
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_top_right">
                                    <div class="masl_con_dialog_con_xq_detail_top_right_text">查看更多</div> 
                                    <img src="@/assets/images/student/right.png" class="masl_con_dialog_con_xq_detail_top_right_icon" alt="">
                                </div>
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_center">
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">出勤次数</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>/ 3</span>
                                    </div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_last">出勤率 0%</div>
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">上课时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      56  <span>分钟</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">观看历史课堂时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>分钟</span>
                                    </div>

                                </div>
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_last">
                                <img src="@/assets/images/student/tips.png" class="masl_con_dialog_con_xq_detail_last_icon" alt="">
                                <div class="masl_con_dialog_con_xq_detail_last_text">有3节课的在线时长低于开课时长的80%</div>
                            </div>
                        </div>
                        <div class="masl_con_dialog_con_xq_detail">
                            <div class="masl_con_dialog_con_xq_detail_top">
                                <div class="masl_con_dialog_con_xq_detail_top_left">
                                    <img src="@/assets/images/student/kc.png" class="masl_con_dialog_con_xq_detail_top_left_icon" alt="">
                                    <div class="masl_con_dialog_con_xq_detail_top_left_title">课程</div>
                                </div>
                               
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_center">
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">学完任务数</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>/ 3</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">学习时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      56  <span>分钟</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">进度</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>%</span>
                                    </div>

                                </div>
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
  name: 'StudentDetail',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['close'],
  methods: {
    
  }
}
</script>

<style lang="scss" scoped>
.mask{
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 51, 51, 0.60);
  z-index: 1000000;
  overflow: hidden;
}
.mask_con{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.masl_con_dialog{
    width: 543px;
    height: 100%;
    position: relative;
    background: #F3F4F8;
    border-radius: 16px;
    animation: slideInFromRight 0.3s ease;
    background: url('../../assets/images/student/bg.png') no-repeat;
    background-size: 100% 100%;
    border-radius: 4px 0 0 4px;
    padding: 28px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

}
.masl_con_dialog_top{
    padding: 0 16px;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_top_close{
    width: 14px;
    height: 14px;
    cursor: pointer;
}
.masl_con_dialog_top_share{
    width: 18px;
    height: 18px;
    cursor: pointer;
}
.masl_con_dialog_con{
    padding: 0 16px;
    box-sizing: border-box;
    width: 100%;
    flex: 1;
    height: 0;
    overflow: auto;
    margin-top: 40px;
}
.masl_con_dialog_con_basic{
    width: 100%;
}
.masl_con_dialog_con_basic_top{
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
}
.masl_con_dialog_con_basic_top_fm{
    width: 56px;
    height: 56px;
    border-radius: 50%;
}
.masl_con_dialog_con_basic_top_title{
    font-weight: bold;
font-size: 20px;
color: #333333;
}
.masl_con_dialog_con_basic_last{
    width: 100%;
    margin-top: 16px;
    display: flex;
    justify-content: flex-start;
    gap: 16px;
    align-items: center;
}
.masl_con_dialog_con_basic_last_detail{
    display: inline-flex;
    max-width: 130px;
    justify-content: flex-start;
    align-items: center;
    gap: 3px;
    padding: 0 7px;
    box-sizing: border-box;
    height: 20px;
    background: #CAD9FF;
    border-radius: 4px;
}
.masl_con_dialog_con_basic_last_detail_icon{
    width: 10px;
    height: 10px;
}
.masl_con_dialog_con_basic_last_detail_title{
    font-weight: 400;
font-size: 12px;
color: #333333;
}
.masl_con_dialog_con_xq{
    margin-top: 32px;
    width: 100%;
}
.masl_con_dialog_con_xq_title{
    font-size: 18px;
    font-weight: bold;
    color: #333333;
}
.masl_con_dialog_con_xq_top{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}
.masl_con_dialog_con_xq_top_left{
    font-weight: 400;
    font-size: 12px;
    color: #666666;
}
.masl_con_dialog_con_xq_top_right{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}
.masl_con_dialog_con_xq_top_right_text{
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_con_xq_top_right_xl{
    width: 13px;
    height: 9px;
}
.masl_con_dialog_con_xq_detail{
    width: 100%;
    margin-top: 20px;
    background: #FFFFFF;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
padding: 16px;
box-sizing: border-box;
}
.masl_con_dialog_con_xq_detail_top{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_con_xq_detail_top_left{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
}
.masl_con_dialog_con_xq_detail_top_left_icon{
    width: 19px;
    height: 18px;
}
.masl_con_dialog_con_xq_detail_top_left_title{
font-weight: bold;
font-size: 18px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_top_right{
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
    cursor: pointer;
}
.masl_con_dialog_con_xq_detail_top_right_text{
    font-weight: 400;
font-size: 12px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_top_right_icon{
    width: 4px;
    height: 8px;
}
.masl_con_dialog_con_xq_detail_center{
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_con_xq_detail_center_detail{
    width: 149px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #D9D9D9;
padding:  11px;
box-sizing: border-box;
align-self: stretch;
}
.masl_con_dialog_con_xq_detail_center_detail_title{
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_center_detail_num{
    font-weight: bold;
font-size: 20px;
color: #333333;
margin-top: 10px;
}
.masl_con_dialog_con_xq_detail_center_detail_num span{
    font-weight: 400;
font-size: 14px;
color: #666666;
}
.masl_con_dialog_con_xq_detail_center_detail_last{
font-weight: 400;
font-size: 12px;
color: #666666;
    margin-top: 10px;
}
.masl_con_dialog_con_xq_detail_last{
    width: 100%;
    margin-top: 12px;
    height: 34px;
background: #FFEDED;
border-radius: 8px 8px 8px 8px;
border: 1px solid #FF2E00;
padding: 0 12px;
box-sizing: border-box;
display: flex;
justify-content: flex-start;
align-items: center;
gap: 9px;
}
.masl_con_dialog_con_xq_detail_last_icon{
    width: 20px;
    height: 17px;
}
.masl_con_dialog_con_xq_detail_last_text{
font-weight: 400;
font-size: 14px;
color: #FF2E00;
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
</style>