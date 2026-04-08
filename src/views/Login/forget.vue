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
                    <el-input v-model="phone" maxlength="11" placeholder="请输入手机号" style="width:100%"></el-input>
                </div>
                <div
                    class="app_container_box_btn"
                    :class="{ 'app_container_box_btn_active': isPhoneValid }"
                    @click="handleNextOne()"
                >下一步</div>
            </div>
            <!-- 第二步 -->
            <div class="app_container_box_box" v-if="currentStep=='2'">
                <div class="app_container_box_text">重置密码</div>
                <div class="app_container_box_tips">验证码已发送至您的手机 {{ maskedPhone }}</div>
                <div class="app_container_box_box_mess">
                    <div class="app_container_box_input2">
                        <el-input v-model="code" placeholder="请输入验证码" style="width:100%"></el-input>
                    </div>
                    <div
                        class="app_container_box_box_mess_code"
                        :class="{ 'app_container_box_box_mess_code_active': countdown === 0 }"
                        @click="handleSendCode()"
                    >{{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}</div>
                </div>
                <div
                    class="app_container_box_btn"
                    :class="{ 'app_container_box_btn_active': code.length > 0 }"
                    @click="handleNextTwo()"
                >下一步</div>
            </div>
             <!-- 第三步 -->
            <div class="app_container_box_box" v-if="currentStep=='3'">
                <div class="app_container_box_text">重置密码</div>
                <div class="app_container_box_tips">请输入您的新密码</div>
                <div class="app_container_box_input">
                    <el-input v-model="newPassword" type="password" show-password placeholder="8-20位，必须包含数字和大小写字母" style="width:100%"></el-input>
                </div>
                <div class="app_container_box_tips" style="margin-top:16px">请确认您的新密码</div>
                <div class="app_container_box_input">
                    <el-input v-model="newPassword2" type="password" show-password placeholder="请再次输入新密码" style="width:100%"></el-input>
                </div>
                <div
                    class="app_container_box_btn"
                    :class="{
                        'app_container_box_btn_active': isPasswordValid && newPassword === newPassword2 && newPassword2.length > 0,
                        'app_container_box_btn_loading': resetLoading
                    }"
                    @click="!resetLoading && handleResetPassword()"
                >
                    <i v-if="resetLoading" class="el-icon-loading" style="margin-right:6px;font-size:16px;"></i>
                    {{ resetLoading ? '提交中...' : '完成' }}
                </div>
            </div>
        </div>
     </div>
</template>
<script>
import { sendCode, resetPassword } from '@/api/modules/user'
export default {
    data() {
        return {
            phone:'',
            code:'',
            currentStep:"1",
            newPassword:"",
            newPassword2:'',
            countdown: 0,
            countdownTimer: null,
            resetLoading: false
        }
    },
    computed: {
        isPhoneValid() {
            return /^1[3-9]\d{9}$/.test(this.phone)
        },
        maskedPhone() {
            if (this.phone.length === 11) {
                return this.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            }
            return this.phone
        },
        isPasswordValid() {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{8,20}$/.test(this.newPassword)
        }
    },
    beforeDestroy() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer)
        }
    },
    methods:{
        handleBack(){
            this.$router.back()
        },
        handleNextOne(){
            if (!this.isPhoneValid) {
                this.$message.warning('请输入正确的手机号')
                return
            }
            this.currentStep = '2'
            this.handleSendCode()
        },
        async handleSendCode() {
            if (this.countdown > 0) return
            try {
                await sendCode({ phone: this.phone, type: 2 })
                this.$message.success('验证码已发送')
                this.countdown = 60
                this.countdownTimer = setInterval(() => {
                    this.countdown--
                    if (this.countdown <= 0) {
                        clearInterval(this.countdownTimer)
                        this.countdownTimer = null
                    }
                }, 1000)
            } catch (e) {
                this.$message.error(e.message || '验证码发送失败，请重试')
            }
        },
        handleNextTwo(){
            if (!this.code) {
                this.$message.warning('请输入验证码')
                return
            }
            this.currentStep = '3'
        },
        async handleResetPassword(){
            if (!this.isPasswordValid) {
                this.$message.warning('密码需至少8位，且包含数字、大写字母和小写字母')
                return
            }
            if (this.newPassword !== this.newPassword2) {
                this.$message.warning('两次输入的密码不一致')
                return
            }
            if (this.resetLoading) return
            this.resetLoading = true
            try {
                await resetPassword({
                    phone: this.phone,
                    code: this.code,
                    newPassword: this.newPassword
                })
                this.$message.success('密码重置成功')
                this.$router.push('/login')
            } catch (e) {
                console.log(e)
            } finally {
                this.resetLoading = false
            }
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
background: #CAD9FF;
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
.app_container_box_btn_active{
    background:#0049FF!important
}
.app_container_box_btn_loading{
    cursor: not-allowed;
    opacity: 0.7;
    pointer-events: none;
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