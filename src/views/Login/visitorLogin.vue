<template>
  <div class="visitor-login-page">
    <LiveClassroomFrame
      v-if="showLiveIframe"
      class="visitor-live-frame"
      :src="liveUrl"
      @exit="showLiveIframe = false"
    />

    <div v-else class="visitor-login-shell">
      <div class="visitor-login-card">
        <img src="@/assets/images/login/logo.png" class="visitor-login-logo" alt="">
        <div class="visitor-login-title">访客进入直播间</div>

        <div class="visitor-login-form">
          <div class="visitor-login-field">
            <input
              v-model="form.userName"
              type="text"
              maxlength="20"
              placeholder="请输入用户名"
              @keyup.enter="handleVisitorLogin"
            >
          </div>

          <div class="visitor-login-field">
            <input
              v-model="form.phone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              @keyup.enter="handleVisitorLogin"
            >
          </div>

          <div class="visitor-login-field visitor-login-code-field">
            <input
              v-model="form.code"
              type="text"
              maxlength="6"
              placeholder="请输入验证码"
              @keyup.enter="handleVisitorLogin"
            >
            <button
              class="visitor-login-code-btn"
              :class="{ active: canSendCode }"
              type="button"
              :disabled="!canSendCode"
              @click="handleSendCode"
            >
              {{ sendCodeText }}
            </button>
          </div>
        </div>

        <button
          class="visitor-login-submit"
          type="button"
          :disabled="loginLoading"
          @click="handleVisitorLogin"
        >
          {{ loginLoading ? '进入中...' : '进入直播间' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { visitorSendCode, visitorLogin } from '@/api'
import LiveClassroomFrame from '@/components/LiveClassroomFrame/index.vue'
import { setToken, setUserInfo } from '@/utils/auth'

export default {
  name: 'VisitorLogin',
  components: { LiveClassroomFrame },
  data() {
    return {
      form: {
        userName: '',
        phone: '',
        code: ''
      },
      liveIdFromQuery: '',
      classroomIdFromQuery: '',
      sendCodeLoading: false,
      loginLoading: false,
      countdown: 0,
      countdownTimer: null,
      liveUrl: '',
      showLiveIframe: false
    }
  },
  computed: {
    liveId() {
      return this.liveIdFromQuery
    },
    classroomId() {
      return this.classroomIdFromQuery
    },
    isPhoneValid() {
      return /^1[3-9]\d{9}$/.test(this.form.phone.trim())
    },
    canSendCode() {
      return this.countdown === 0 && !this.sendCodeLoading && this.isPhoneValid && !!this.liveId
    },
    sendCodeText() {
      if (this.sendCodeLoading) return '发送中...'
      if (this.countdown > 0) return `${this.countdown}s后重发`
      return '获取验证码'
    }
  },
  created() {
    const liveParams = this.getLiveParamsFromUrl()
    this.liveIdFromQuery = liveParams.liveId
    this.classroomIdFromQuery = liveParams.classroomId
    console.log(liveParams, '直播间参数')
    if (!this.liveId) {
    //   this.$message.warning('直播间参数缺失')
    }
  },
  beforeDestroy() {
    this.clearCountdownTimer()
  },
  methods: {
    getLiveParamsFromUrl() {
      const query = window.location.href.split('?')[1] || ''
      const normalizedQuery = query.replace(/&&/g, '&')
      const params = new URLSearchParams(normalizedQuery)
      console.log('URL参数', params.toString())
      return {
        liveId: params.get('liveid') || '',
        classroomId: params.get('classroomId') || ''
      }
    },
    clearCountdownTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
    },
    startCountdown() {
      this.clearCountdownTimer()
      this.countdown = 60
      this.countdownTimer = setInterval(() => {
        this.countdown -= 1
        if (this.countdown <= 0) {
          this.countdown = 0
          this.clearCountdownTimer()
        }
      }, 1000)
    },
    validatePhone() {
      if (!this.form.phone.trim()) {
        this.$message.warning('请输入手机号')
        return false
      }
      if (!this.isPhoneValid) {
        this.$message.warning('请输入正确的手机号')
        return false
      }
      if (!this.liveId) {
        this.$message.warning('直播间参数缺失')
        return false
      }
      return true
    },
    async handleSendCode() {
      if (!this.validatePhone() || this.countdown > 0 || this.sendCodeLoading) return
      this.sendCodeLoading = true
      try {
        await visitorSendCode({
          phone: this.form.phone.trim(),
          liveId: this.liveId
        })
        this.$message.success('验证码已发送')
        this.startCountdown()
      } finally {
        this.sendCodeLoading = false
      }
    },
    async handleVisitorLogin() {
      if (this.loginLoading || !this.validatePhone()) return
      if (!this.form.userName.trim()) {
        this.$message.warning('请输入用户名')
        return
      }
      if (!this.form.code.trim()) {
        this.$message.warning('请输入验证码')
        return
      }

      this.loginLoading = true
      try {
        const res = await visitorLogin({
          liveId: this.liveId,
          userName: this.form.userName.trim(),
          phone: this.form.phone.trim(),
          code: this.form.code.trim()
        })
        const data = res.data || {}
        this.saveLoginData(data)
        this.enterLiveRoom(data)
        this.$message.success('登录成功')
      } finally {
        this.loginLoading = false
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
        realName: data.realName || data.userName || this.form.userName.trim(),
        profilePicture: data.profilePicture,
        phone: data.phone || this.form.phone.trim(),
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
      this.$store.commit('user/SET_ROLE', data.role || '')
    },
    enterLiveRoom(data) {

      const roleNumber =  0
   

      let liveBaseUrl = 'https://live.fjlsjy123.com'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://localhost:8000'
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&userid=${data.userId}&username=${data.realName || data.userName || this.form.userName.trim()}&liveid=${this.liveId}&classroomId=${this.classroomId || ''}&_t=${Date.now()}&token=${data.token}`
      console.log(this.liveUrl,'地址')
      this.showLiveIframe = true
    }
  }
}
</script>

<style lang="scss" scoped>
.visitor-login-page {
  width: 100vw;
  min-height: 100vh;
  background: url('../../assets/images/login/bg.png') center / cover no-repeat;
}

.visitor-live-frame {
  width: 100vw;
  height: 100vh;
}

.visitor-login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  box-sizing: border-box;
}

.visitor-login-card {
  width: 360px;
  max-width: 100%;
  padding: 34px 30px 32px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 16px;
  box-shadow: 0 18px 46px rgba(0, 73, 255, 0.12);
}

.visitor-login-logo {
  display: block;
  width: 96px;
  height: 105px;
  margin: 0 auto;
}

.visitor-login-title {
  margin-top: 20px;
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  color: #1f2a44;
}

.visitor-login-form {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.visitor-login-field {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  box-sizing: border-box;
  background: #f6f8fc;
  border: 1px solid #e5e9f2;
  border-radius: 8px;
}

.visitor-login-field input {
  flex: 1;
  width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #333;
}

.visitor-login-code-field {
  padding-right: 8px;
}

.visitor-login-code-btn {
  width: 92px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #cad9ff;
  color: #fff;
  font-size: 13px;
  cursor: not-allowed;
}

.visitor-login-code-btn.active {
  background: #0049ff;
  cursor: pointer;
}

.visitor-login-submit {
  width: 100%;
  height: 44px;
  margin-top: 28px;
  border: none;
  border-radius: 10px;
  background: #0049ff;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.visitor-login-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

::placeholder {
  color: #999;
}

@media (max-width: 480px) {
  .visitor-login-page {
    background-position: center top;
  }

  .visitor-login-shell {
    align-items: center;
    padding: 32px 16px;
  }

  .visitor-login-card {
    width: 100%;
    padding: 28px 20px 26px;
    border-radius: 12px;
  }

  .visitor-login-logo {
    width: 78px;
    height: 85px;
  }

  .visitor-login-title {
    margin-top: 16px;
    font-size: 18px;
  }

  .visitor-login-field {
    height: 46px;
  }

  .visitor-login-code-btn {
    width: 86px;
    font-size: 12px;
  }
}
</style>
