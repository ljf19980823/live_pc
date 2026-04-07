<template>
  <div class="app_container">
    <div class="app_container_box">
      <img src="@/assets/images/login/logo.png" class="app_container_logo" alt="">
      <div class="app_container_mess" v-if="loginType=='1'">
        <div class="app_container_mess_top">
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input
                v-model="form.userName"
                type="text"
                placeholder="请输入账号名/账号ID"
                @keyup.enter="handleLogin"
              >
            </div>
            <img class="app_container_mess_top_input_input_icon2" src="@/assets/images/login/user.png" alt="">
          </div>
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入登录密码"
                @keyup.enter="handleLogin"
              >
            </div>
            <img
              class="app_container_mess_top_input_input_icon pwd-toggle"
              :src="showPassword ? require('@/assets/images/login/password_no.png') : require('@/assets/images/login/password_yes.png')"
              @click="showPassword = !showPassword"
              alt=""
            >
          </div>
        </div>
        <div class="app_container_mess_tips">
          <div class="app_container_mess_tips_left" @click="toggleRemember">
            <img
              :src="rememberPwd ? require('@/assets/images/login/check_yes.png') : require('@/assets/images/login/check_no.png')"
              class="app_container_mess_tips_left_icon"
              alt=""
            >
            <div class="app_container_mess_tips_left_text">记住密码</div>
          </div>
          <div class="app_container_mess_tips_right" @click="handleForget">忘记密码？</div>
        </div>
        <div
          class="app_container_mess_btn"
          :class="{ 'btn-disabled': loading }"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </div>
        <div class="app_container_mess_last">
          <!-- <div class="app_container_mess_last_left" @click="showInviteMask=true">邀请码加入课堂</div> -->
          <div class="app_container_mess_last_right">
            <div style="cursor:pointer"  @click="handleCodeLoginPath()">扫码登录</div>
            <div class="app_container_mess_last_right_sx"></div>
            <div style="cursor:pointer" @click="handlePhoneLogin()">手机号登录</div>
          </div>
        </div>
      </div>
      <div class="app_container_mess" v-if="loginType=='2'">
        <div class="app_container_mess_top" style="gap:28px">
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input
                v-model="phoneForm.phone"
                type="text"
                placeholder="请输入手机号"
                @keyup.enter="handleCodeLogin"
              >
            </div>
            <img class="app_container_mess_top_input_input_icon2" src="@/assets/images/login/user.png" alt="">
          </div>
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input
                v-model="phoneForm.code"
                type="text"
                placeholder="请输入验证码"
                @keyup.enter="handleCodeLogin"
              >
            </div>
            <div
              class="code_box"
              :class="{ 'code_box_active': countdown === 0 && !sendCodeLoading && isPhoneValid }"
              @click="handleSendCode"
            >
              {{ sendCodeLoading ? '发送中...' : countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
            </div>
          </div>
        </div>
        <div class="app_container_mess_tips">
          <div class="app_container_mess_tips_left" @click="toggleRememberPhone">
            <img
              :src="rememberPhone ? require('@/assets/images/login/check_yes.png') : require('@/assets/images/login/check_no.png')"
              class="app_container_mess_tips_left_icon"
              alt=""
            >
            <div class="app_container_mess_tips_left_text">记住手机号</div>
          </div>
        </div>
        <div
          class="app_container_mess_btn"
          :class="{ 'btn-disabled': codeLoginLoading }"
          @click="handleCodeLogin"
        >
          {{ codeLoginLoading ? '登录中...' : '登 录' }}
        </div>
        <div class="app_container_mess_last" style="justify-content: flex-end;">
          <div class="app_container_mess_last_right">
            <div style="cursor:pointer" @click="handleUserLogin()">用户名登录</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多用户选择弹窗 -->
    <div class="mask" v-if="showMask">
      <div class="mask_con">
        <div class="mask_con_con">
          <img
            src="@/assets/images/login/close.png"
            class="mask_con_con_top_close"
            @click="showMask = false"
            alt=""
          >
          <div class="mask_con_con_top">请选择登录身份</div>
          <div class="mask_con_con_list">
            <div
              v-for="(item, index) in eduUserList"
              :key="index"
              class="mask_con_con_list_detail"
              :class="{ 'item-loading': chooseLoading && currentChooseIndex === index }"
              @click="handleChooseLogin(item, index)"
            >
              <img
                :src="item.profilePicture || require('@/assets/images/class/such.png')"
                class="mask_con_con_list_detail_img"
                alt=""
                @error="onAvatarError"
              >
              <div class="mask_con_con_list_detail_mess">
                <div class="mask_con_con_list_detail_mess_name">
                  {{ item.institutionName || item.school || '立升教育' }}
                </div>
                <div class="mask_con_con_list_detail_mess_last">
                  <div :class="getRoleTagClass(item.role)">{{ getRoleLabel(item.role) }}</div>
                  <div class="mask_con_con_list_detail_mess_last_name">
                    {{ item.realName || item.userName }}
                  </div>
                </div>
              </div>
              <div class="mask_con_con_list_detail_btn">
                <span v-if="chooseLoading && currentChooseIndex === index">登录中...</span>
                <span v-else>进入</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请码加入弹窗 -->
    <div class="mask" v-if="showInviteMask">
       <div class="mask_con">
          <div class="inviteCode_box">
             <img
            src="@/assets/images/login/close.png"
            class="mask_con_con_top_close"
            @click="showInviteMask = false"
            alt=""
          >
            <div class="inviteCode_box_title">邀请码加入课堂</div>
            <div class="inviteCode_box_con">
              <div class="inviteCode_box_con_input">
                <input type="text" placeholder="请输入邀请码">
              </div>
              <div class="inviteCode_box_con_input">
                <input type="text" placeholder="请输入昵称">
              </div>
            </div>
            <div class="inviteCode_box_btn">加入课堂</div>
          </div>
       </div>
    </div>
  </div>
</template>

<script>
import { ssoLogin, chooseLogin, sendCode, codeLogin } from '@/api'
import { setToken, setUserInfo } from '@/utils/auth'

const REMEMBER_KEY = 'lisheng_remember_pwd'
const REMEMBER_PHONE_KEY = 'lisheng_remember_phone'

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      codeLoginLoading: false,
      sendCodeLoading: false,
      countdown: 0,
      countdownTimer: null,
      chooseLoading: false,
      currentChooseIndex: -1,
      showPassword: false,
      rememberPwd: false,
      rememberPhone: false,
      showMask: false,
      eduUserList: [],
      form: {
        userName: '',
        password: ''
      },
      phoneForm: {
        phone: '',
        code: ''
      },
      loginType: '1',
      showInviteMask:false
    }
  },
  created() {
    this.loadRemembered()
    this.loadRememberedPhone()
  },
  computed: {
    isPhoneValid() {
      return /^1[3-9]\d{9}$/.test(this.phoneForm.phone.trim())
    }
  },
  beforeDestroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },
  methods: {
    loadRemembered() {
      try {
        const saved = localStorage.getItem(REMEMBER_KEY)
        if (saved) {
          const { userName, password } = JSON.parse(saved)
          this.form.userName = userName || ''
          this.form.password = password || ''
          this.rememberPwd = true
        }
      } catch {
        // ignore
      }
    },

    toggleRemember() {
      this.rememberPwd = !this.rememberPwd
      if (!this.rememberPwd) {
        localStorage.removeItem(REMEMBER_KEY)
      }
    },

    getRoleLabel(role) {
      const map = {
        TEACHER: '老师',
        STUDENT: '学生',
        ADMIN: '管理员',
        PARENT: '家长'
      }
      return map[role] || role || '学生'
    },

    getRoleTagClass(role) {
      const teacherRoles = ['TEACHER', 'ADMIN']
      return teacherRoles.includes(role)
        ? 'mask_con_con_list_detail_mess_last_tag'
        : 'mask_con_con_list_detail_mess_last_tag2'
    },

    onAvatarError(e) {
      e.target.src = require('@/assets/images/class/such.png')
    },

    async handleLogin() {
      if (this.loading) return
      if (!this.form.userName.trim()) {
        this.$message.warning('请输入账号名/账号ID')
        return
      }
      if (!this.form.password) {
        this.$message.warning('请输入登录密码')
        return
      }

      this.loading = true
      try {
        const res = await ssoLogin({
          userName: this.form.userName.trim(),
          password: this.form.password
        })

        if (this.rememberPwd) {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({
            userName: this.form.userName.trim(),
            password: this.form.password
          }))
        } else {
          localStorage.removeItem(REMEMBER_KEY)
        }

        const data = res.data || {}
        const list = Array.isArray(data.eduUserList) ? data.eduUserList : []

        if (list.length > 1) {
          // 多用户：展示身份选择弹窗，token 由用户选择后再保存
          this.eduUserList = list
          this.showMask = true
        } else if (list.length === 1) {
          // 单用户：默认取第一个用户自动登录
          await this.handleChooseLogin(list[0], 0)
        } else {
          // 无用户列表：直接完成登录
          this.saveLoginData(data)
          this.$message.success('登录成功')
          this.navigateAfterLogin()
        }
      } catch (err) {
        // 错误已由 request.js 拦截器统一处理
      } finally {
        this.loading = false
      }
    },

    async handleChooseLogin(item, index) {
      if (this.chooseLoading) return
      this.chooseLoading = true
      this.currentChooseIndex = index
      try {
        // 先用选中用户自己的 token 写入 store 和 localStorage，供 chooseLogin 请求头鉴权
        setToken(item.token)
        this.$store.commit('user/SET_TOKEN', item.token)
        const res = await chooseLogin({
          role: item.role,
          userId: item.userId
        })
        const data = res.data || {}
        this.saveLoginData(data)
         this.$message.success('登录成功')
        this.navigateAfterLogin()
        // this.showMask = false
       
      } catch (err) {
        // 错误已由 request.js 拦截器统一处理
        this.showMask = false
      } finally {
        this.chooseLoading = false
        this.currentChooseIndex = -1
      }
    },

    saveLoginData(data) {
      const token = data.token || ''
      const userInfo = {
        token: data.token,
        tokenHead: data.tokenHead,
        role: data.role,
        userId: data.userId,
        userName: data.userName,
        realName: data.realName,
        profilePicture: data.profilePicture,
        phone: data.phone,
        sex: data.sex,
        email: data.email,
        school: data.school,
        grade: data.grade,
        gradeName: data.gradeName,
        address: data.address,
        institutionId: data.institutionId,
        institutionName: data.institutionName,
        campusId: data.campusId
      }
      setToken(token)
      setUserInfo(userInfo)
      this.$store.commit('user/SET_TOKEN', token)
      this.$store.commit('user/SET_USER_INFO', userInfo)
      this.$store.commit('user/SET_ROLES', data.role ? [data.role] : [])
    },

    navigateAfterLogin() {
      const redirect = this.$route.query.redirect || '/'
      console.log(redirect,'路透')
      this.$router.push(redirect)
    },

    loadRememberedPhone() {
      try {
        const saved = localStorage.getItem(REMEMBER_PHONE_KEY)
        if (saved) {
          const { phone } = JSON.parse(saved)
          this.phoneForm.phone = phone || ''
          this.rememberPhone = true
        }
      } catch {
        // ignore
      }
    },

    toggleRememberPhone() {
      this.rememberPhone = !this.rememberPhone
      if (!this.rememberPhone) {
        localStorage.removeItem(REMEMBER_PHONE_KEY)
      }
    },

    async handleSendCode() {
      if (this.countdown > 0 || this.sendCodeLoading) return
      if (!this.phoneForm.phone.trim()) {
        this.$message.warning('请输入手机号')
        return
      }
      if (!this.isPhoneValid) {
        this.$message.warning('请输入正确的手机号')
        return
      }
      this.sendCodeLoading = true
      try {
        await sendCode({ phone: this.phoneForm.phone.trim(), type: 1 })
        this.$message.success('验证码已发送')
        this.countdown = 60
        this.countdownTimer = setInterval(() => {
          this.countdown--
          if (this.countdown <= 0) {
            clearInterval(this.countdownTimer)
            this.countdownTimer = null
          }
        }, 1000)
      } catch {
        // ignore
      } finally {
        this.sendCodeLoading = false
      }
    },

    async handleCodeLogin() {
      if (this.codeLoginLoading) return
      if (!this.phoneForm.phone.trim()) {
        this.$message.warning('请输入手机号')
        return
      }
      if (!this.phoneForm.code.trim()) {
        this.$message.warning('请输入验证码')
        return
      }
      this.codeLoginLoading = true
      try {
        const res = await codeLogin({
          phone: this.phoneForm.phone.trim(),
          code: this.phoneForm.code.trim()
        })

        if (this.rememberPhone) {
          localStorage.setItem(REMEMBER_PHONE_KEY, JSON.stringify({
            phone: this.phoneForm.phone.trim()
          }))
        } else {
          localStorage.removeItem(REMEMBER_PHONE_KEY)
        }

        const data = res.data || {}
        const list = Array.isArray(data.eduUserList) ? data.eduUserList : []

        if (list.length > 1) {
          // 多用户：展示身份选择弹窗，token 由用户选择后再保存
          this.eduUserList = list
          this.showMask = true
        } else if (list.length === 1) {
          // 单用户：默认取第一个用户自动登录
          await this.handleChooseLogin(list[0], 0)
        } else {
          // 无用户列表：直接完成登录
          this.saveLoginData(data)
          this.$message.success('登录成功')
          this.navigateAfterLogin()
        }
      } catch {
        // ignore
      } finally {
        this.codeLoginLoading = false
      }
    },

    handleForget() {
      this.$router.push('/forget')
    },
    handlePhoneLogin() {
      this.loginType = '2'
    },
    handleUserLogin() {
      this.loginType = '1'
    },
    handleCodeLoginPath(){
      this.$router.push('/codeLogin')
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
.app_container_box{
  position: relative;
  top: -100px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
.app_container_logo{
  width: 128px;
  height: 140px;
}
.app_container_mess{
  width: 300px;
  margin-top: 42px;
}
.app_container_mess_top{
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 35px;
}
.app_container_mess_top_input{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #D9D9D9;
  gap: 10px;
}
.app_container_mess_top_input_input{
  flex: 1;
  width: 0;
  
}
.app_container_mess_top_input_input input{
  width: 100%;
  font-weight: 400;
font-size: 14px;
color: #333333;
border: none!important;
background: transparent!important;
}
.app_container_mess_top_input_input_icon{
  width: 20px;
  height: 16px;
}
.app_container_mess_top_input_input_icon2{
  width: 20px;
  height: 16px;
}
.app_container_mess_tips{
  margin-top: 19px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.app_container_mess_tips_left{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.app_container_mess_tips_left_icon{
  width: 16px;
  height: 16px; 
}
.app_container_mess_tips_left_text{
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.app_container_mess_tips_right{
  font-weight: 400;
font-size: 14px;
color: #333333;
cursor: pointer;
}
.app_container_mess_btn{
  margin-top: 29px;
  width: 100%;
  height: 42px;
  background: #0049FF;
  border-radius: 12px 12px 12px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: #FFFFFF;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s;
  &:active {
    opacity: 0.85;
  }
  &.btn-disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}
.app_container_mess_last{
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.app_container_mess_last_left{
  font-weight: 400;
font-size: 14px;
cursor: pointer;
color: #0049FF;
}
.app_container_mess_last_right{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-weight: 400;
font-size: 14px;
color: #0049FF;
}
.app_container_mess_last_right_sx{
  width: 1px;
height: 16px;
background: #D9D9D9;
}
.mask{
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 51, 51, 0.60);
}
.mask_con{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.mask_con_con{
  width: 406px;
background: #FFFFFF;
border-radius: 16px 16px 16px 16px;
position: relative;
padding: 18px 16px 31px 16px;
box-sizing: border-box;
}
.mask_con_con_top{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.mask_con_con_list{
  width: 100%;
  margin-top: 17px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.mask_con_con_list_detail{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 9px;
  padding: 13px 18px 13px 16px;
  box-sizing: border-box;
  background: #F3F4F8;
  border-radius: 8px 8px 8px 8px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #E0E6FF;
  }
}
.mask_con_con_list_detail_img{
  width: 56px;
  height: 56px;
  border-radius: 50%;
}
.mask_con_con_list_detail_mess{
  flex: 1;
  width: 0;
}
.mask_con_con_list_detail_btn{
  font-weight: bold;
font-size: 16px;
color: #0049FF;
cursor: pointer;
}
.mask_con_con_list_detail_mess_name{
  font-weight: bold;
  word-break: break-all;
  line-height: 22px;
font-size: 16px;
color: #333333;
}
.mask_con_con_list_detail_mess_last{
  margin-top: 11px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.mask_con_con_list_detail_mess_last_tag{
  width: 39px;
height: 21px;
background: #CAD9FF;
border-radius: 4px 4px 4px 4px;
font-size: 12px;
color: #0049FF;
display: flex;
justify-content: center;
align-items: center;
}
.mask_con_con_list_detail_mess_last_tag2{
  width: 39px;
height: 21px;
background: #CEFFD3;
border-radius: 4px 4px 4px 4px;
font-size: 12px;
color: #11B623;
display: flex;
justify-content: center;
align-items: center;
}
.mask_con_con_list_detail_mess_last_name{
  font-weight: 400;
font-size: 14px;
color: #666666;
word-break: break-all;
line-height: 22px;
}
.mask_con_con_top_close{
  cursor: pointer;
  position: absolute;
  right: 20px;
  top: 20px;
  width: 14px;
  height: 14px;
  &:hover {
    opacity: 0.7;
  }
}
.pwd-toggle {
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
}
.item-loading {
  opacity: 0.7;
  pointer-events: none;
}

::placeholder { /* 标准语法 */
    color: #999!important;
    font-size: 14px!important;
}

/* Chrome/Safari/Edge */
::-webkit-input-placeholder {
     color: #999!important;
    font-size: 14px!important;
}

/* Firefox 4-18 */
:-moz-placeholder {
     color: #999!important;
    font-size: 14px!important;
}

/* Firefox 19+ */
::-moz-placeholder {
    color: #999!important;
    font-size: 14px!important;
}

/* IE 10-11 */
:-ms-input-placeholder {
    color: #999!important;
    font-size: 14px!important;
}

.code_box{
  cursor:pointer;
  width: 84px;
  height: 25px;
  background: #CAD9FF;
  border-radius: 4px 4px 4px 4px;
  font-weight: 400;
font-size: 14px;
color: #FFFFFF;
display: flex;
justify-content: center;
align-items: center;
}
.code_box_active{
  background: #0049FF!important;
}

.inviteCode_box{
  width: 406px;
  height: 287px;
  border-radius: 16px;
  background: #F3F4F8;
  position: relative;
}
.inviteCode_box_title{
  width: 100%;
  height: 48px;
  text-align: center;
  padding-top: 18px;
  box-sizing: border-box;
  font-weight: bold;
font-size: 16px;
color: #333333;
background: #ffffff;
border-radius: 16px 16px 0 0;
}
.inviteCode_box_con{
  width: 100%;
  padding: 16px 11px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.inviteCode_box_con_input{
  width: 100%;
  height: 56px;
background: #FFFFFF;
border-radius: 8px 8px 8px 8px;
}
.inviteCode_box_con_input input{
  width: 100%;
  height: 100%;
  padding: 0 13px;
  box-sizing: border-box;
  font-size: 16px;
color: #333333;
}
.inviteCode_box_btn{
  width: 226px;
  height: 44px;
  margin: 11px auto 0;
  background: #0049FF;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center; 
  font-weight: bold;
  cursor: pointer;
font-size: 16px;
color: #FFFFFF;
}
</style>
