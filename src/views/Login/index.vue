<template>
  <div class="login-page">
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
  </div>
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
      this.$refs.loginForm.validate(valid => {
        if (!valid) return
        this.loading = true

        // ── Mock 登录：跳过接口，直接写入 token 和用户信息 ──
        setTimeout(() => {
          setToken('mock-token-dev')
          this.$store.commit('user/SET_TOKEN', 'mock-token-dev')
          this.$store.commit('user/SET_USER_INFO', MOCK_USER)
          this.$store.commit('user/SET_ROLES', MOCK_USER.roles)
          setUserInfo(MOCK_USER)

          this.loading = false
          const redirect = this.$route.query.redirect || '/'
          this.$router.push(redirect)
          this.$message.success('登录成功')
        }, 300)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  @include flex-center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1D2035 0%, #2C3E6B 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: $bg-white;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;

  @include mobile {
    width: 100%;
    min-height: 100vh;
    border-radius: 0;
    padding: 60px 24px 24px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: $color-primary;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: $text-secondary;
  margin: 0;
}

.login-form {
  .el-form-item { margin-bottom: 20px; }
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 2px;
  margin-top: 8px;
}
</style>
