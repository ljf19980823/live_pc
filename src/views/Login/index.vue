<template>
  <div class="app_container">
    <div class="app_container_box">
      <img src="@/assets/images/login/logo.png" class="app_container_logo"  alt="">
      <div class="app_container_mess">
        <div class="app_container_mess_top">
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input type="text" placeholder="请输入账号名/账号ID">
            </div>
            <img class="app_container_mess_top_input_input_icon2" src="@/assets/images/login/xl.png" alt="">
          </div>
          <div class="app_container_mess_top_input">
            <div class="app_container_mess_top_input_input">
              <input type="text" placeholder="请输入登入密码">
            </div>
            <img  class="app_container_mess_top_input_input_icon" src="@/assets/images/login/password_yes.png" alt="">
          </div>
        </div>
        <div class="app_container_mess_tips">
          <div class="app_container_mess_tips_left">
            <img src="@/assets/images/login/check_no.png" class="app_container_mess_tips_left_icon" alt="">
            <div class="app_container_mess_tips_left_text">记住密码</div>
          </div>
          <div class="app_container_mess_tips_right" @click="handleForget()">忘记密码？</div>
        </div>
        <div class="app_container_mess_btn"  @click="handleLogin">{{ loading ? '登录中...' : '登 录' }}</div>
        <div class="app_container_mess_last">
          <div class="app_container_mess_last_left">邀请码加入课堂</div>
          <div class="app_container_mess_last_right">
            <div class="">扫码登录</div>
            <div class="app_container_mess_last_right_sx"></div>
            <div class="">手机号登入</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">立升直播</h1>
        <p class="login-subtitle">直播管理平台</p>
      </div>

      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter.native="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入账号"
            prefix-icon="el-icon-user"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-button
          type="primary"
          :loading="loading"
          class="login-btn"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
    </div>
  </div> -->
</template>

<script>
import { setToken, setUserInfo } from '@/utils/auth'

// TODO: 联调时删除此 mock 数据，改为真实接口登录
const MOCK_USER = {
  id: 1,
  name: '管理员',
  nickname: '管理员',
  phone: '13800000000',
  email: 'admin@lisheng.com',
  avatar: '',
  roles: ['admin'],
  createdAt: '2024-01-01'
}

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不少于 6 位', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    handleLogin() {
       setToken('mock-token-dev')
          this.$store.commit('user/SET_TOKEN', 'mock-token-dev')
          this.$store.commit('user/SET_USER_INFO', MOCK_USER)
          this.$store.commit('user/SET_ROLES', MOCK_USER.roles)
          setUserInfo(MOCK_USER)

          this.loading = false
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
          this.$message.success('登录成功')
      // this.$refs.loginForm.validate(valid => {
      //   if (!valid) return
      //   this.loading = true

      //   // ── Mock 登录：跳过接口，直接写入 token 和用户信息 ──
      //   setTimeout(() => {
      //     setToken('mock-token-dev')
      //     this.$store.commit('user/SET_TOKEN', 'mock-token-dev')
      //     this.$store.commit('user/SET_USER_INFO', MOCK_USER)
      //     this.$store.commit('user/SET_ROLES', MOCK_USER.roles)
      //     setUserInfo(MOCK_USER)

      //     this.loading = false
      //     const redirect = this.$route.query.redirect || '/'
      //     this.$router.push(redirect)
      //     this.$message.success('登录成功')
      //   }, 300)
      // })
    },
    handleForget(){
      this.$router.push('/forget')
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
  height: 14px;
}
.app_container_mess_top_input_input_icon2{
  width: 16px;
  height: 8px;
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

}
.app_container_mess_last{
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.app_container_mess_last_left{
  font-weight: 400;
font-size: 14px;
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
</style>
