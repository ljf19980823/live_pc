<template>
     <div class="app_container">
        <div class="back_box">
            <div class="back_box_box" @click="handleBack()">
                <img src="@/assets/images/login/back.png" class="back_box_img" alt="">
                <div class="back_box_text">返回登录</div>
            </div>
        </div>
        <div class="app_container_box">
            <!-- 第一步 -->
            <div class="app_container_box_box" v-if="currentStep=='1'">
                <div class="app_container_box_text">重置密码</div>
                <div class="app_container_box_tips">请输入您绑定的手机号</div>
                <div class="app_container_box_input">
                    <el-input v-model="phone" style="width:100%"></el-input>
                </div>
                <div class="app_container_box_btn" @click="handleNextOne()">下一步</div>
            </div>
            <!-- 第二步 -->
            <div class="app_container_box_box" v-if="currentStep=='2'">
                <div class="app_container_box_text">重置密码</div>
                <div class="app_container_box_tips">验证码已发向您的手机134****1006发送验证码</div>
                <div class="app_container_box_box_mess">
                    <div class="app_container_box_input2">
                        <el-input v-model="code" placeholder="请输入验证码" style="width:100%"></el-input>
                    </div>
                    <div class="app_container_box_box_mess_code">获取验证码</div>
                </div>
                <div class="app_container_box_btn" @click="handleNextTwo()">下一步</div>
            </div>
             <!-- 第三步 -->
            <div class="app_container_box_box" v-if="currentStep=='3'">
                <div class="app_container_box_text">重置密码</div>
                <div class="app_container_box_tips">请输入您的新密码</div>
                <div class="app_container_box_input">
                    <el-input v-model="newPassword" placeholder="8-20位，必须包含数字和大小写字母" style="width:100%"></el-input>
                </div>
                <div class="app_container_box_tips" style="margin-top:16px">请确认您的新密码</div>
                <div class="app_container_box_input">
                    <el-input v-model="newPassword2" placeholder="请再次输入新密码" style="width:100%"></el-input>
                </div>
                <div class="app_container_box_btn" @click="handleToLogin()">完成</div>
            </div>
        </div>
     </div>
</template>
<script>
export default {
    data() {
        return {
            phone:'',
            code:'',
            currentStep:"1",
            newPassword:"",
            newPassword2:''
        }
    },
    methods:{
        handleBack(){
            this.$router.back()
        },
        handleNextOne(){
            this.currentStep ='2'
        },
         handleNextTwo(){
            this.currentStep ='3'
        },
        handleToLogin(){
            this.$router.push('/login')
        }
    }
}
</script>
<style lang="scss" scoped>
.app_container{
    
  width: 100vw;
  height: 100vh;
  
  // padding-top: 96px;
  box-sizing: border-box;
  background: url('../../assets/images/login/bg.png') no-repeat;
  background-size: 100% 100%;
}
.back_box{
    position: fixed;
    left: 17px;
    top: 24px;
}
.back_box_box{
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
    cursor: pointer;
}
.back_box_img{
    width: 8px;
    height: 16px;
}
.back_box_text{
    font-weight: bold;
font-size: 16px;
color: #0049FF;
}
.app_container_box{
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
.app_container_box_box{
    width: 300px;
    display: flex;
     justify-content: center;
    align-items: center;
    flex-direction: column;
}
.app_container_box_text{
    color: #333333;
    font-size: 16px;
    text-align: center;
    font-weight: bold;
}
.app_container_box_tips{
    font-weight: 400;
font-size: 14px;
color: #333333;
margin-top: 24px;
text-align: left;
width: 100%;
}
.app_container_box_input{
    margin-top: 8px;
    width: 100%;
    height: 42px;
}
.app_container_box_btn{
width: 300px;
height: 42px;
background: #0049FF;
border-radius: 12px 12px 12px 12px;
display: flex;
justify-content: center;
align-items: center;
font-weight: bold;
font-size: 16px;
color: #FFFFFF;
margin-top: 24px;
cursor: pointer;
}
::v-deep .el-input__inner{
    background: transparent!important;
    background-color: transparent!important;
    border-radius: 8px!important;
    border: 1px solid #666666!important;
    height: 42px!important;
    line-height: 42px!important;
}

.app_container_box_box_mess{
    width: 100%;
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.app_container_box_input2{
    width: 198px;
    height: 42px;
}
.app_container_box_box_mess_code{
    width: 94px;
height: 42px;
background: #71A0FF;
border-radius: 8px 8px 8px 8px;
color: #FFFFFF;
font-size: 14px;
display: flex;
justify-content: center;
align-items: center;
}
.app_container_box_box_mess_code_active{
    background: #0049FF;
}
</style>