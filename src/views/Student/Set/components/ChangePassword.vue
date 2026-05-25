<template>
  <div class="cp-wrap">
    <div class="cp-page-title">修改密码</div>

    <!-- 成功状态 -->
    <div v-if="pageState === 'success'" class="cp-result">
      <div class="cp-result-icon">
        <img src="@/assets/images/set/ok.png" alt="">
      </div>
      <div class="cp-result-title">密码修改成功</div>
      <div class="cp-result-desc">请使用新密码重新登录</div>
      <div class="cp-back-btn" @click="handleBack">返回</div>
    </div>

    <!-- 失败状态 -->
    <div v-else-if="pageState === 'fail'" class="cp-result">
      <div class="cp-result-icon">
        <img src="@/assets/images/set/fail.png" alt="">
      </div>
      <div class="cp-result-title">密码修改失败</div>
      <div class="cp-result-desc">{{ failMsg || '密码修改失败，请稍后重试' }}</div>
      <div class="cp-back-btn cp-back-btn--retry" @click="handleBack">重新尝试</div>
    </div>

    <!-- 表单 -->
    <template v-else>
      <div class="cp-card">
        <!-- 当前密码 -->
        <div class="cp-field">
          <div class="cp-label">当前密码</div>
          <div class="cp-input-row" :class="{ 'is-error': errors.oldPwd }">
            <input
              :type="showOld ? 'text' : 'password'"
              class="cp-input"
              placeholder="请输入原密码"
              v-model="oldPwd"
              @input="clearError('oldPwd')"
            />
            <span class="cp-eye-btn" @click="showOld = !showOld">
              <svg v-if="!showOld" class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M6.61 6.61A11.45 11.45 0 0 0 2 12s3.64 7 10 7a11.45 11.45 0 0 0 5.39-1.39M9.88 4.24A9.77 9.77 0 0 1 12 4c6.36 0 10 7 10 7a18.65 18.65 0 0 1-2.16 3.19" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7S18.364 5 12 5Z" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#BBBCC6" stroke-width="1.8"/>
              </svg>
            </span>
          </div>
          <p v-if="errors.oldPwd" class="cp-error-msg">{{ errors.oldPwd }}</p>
        </div>

        <div class="cp-divider"></div>

        <!-- 新密码 -->
        <div class="cp-field">
          <div class="cp-label">新密码</div>
          <div class="cp-input-row" :class="{ 'is-error': errors.newPwd }">
            <input
              :type="showNew ? 'text' : 'password'"
              class="cp-input"
              placeholder="请输入新密码"
              v-model="newPwd"
              @input="clearError('newPwd')"
            />
            <span class="cp-eye-btn" @click="showNew = !showNew">
              <svg v-if="!showNew" class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M6.61 6.61A11.45 11.45 0 0 0 2 12s3.64 7 10 7a11.45 11.45 0 0 0 5.39-1.39M9.88 4.24A9.77 9.77 0 0 1 12 4c6.36 0 10 7 10 7a18.65 18.65 0 0 1-2.16 3.19" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7S18.364 5 12 5Z" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#BBBCC6" stroke-width="1.8"/>
              </svg>
            </span>
          </div>
          <p v-if="errors.newPwd" class="cp-error-msg">{{ errors.newPwd }}</p>
          <p v-else class="cp-hint">密码长度为 8-20 位，并包含大小写字母和数字</p>
        </div>

        <div class="cp-divider"></div>

        <!-- 确认新密码 -->
        <div class="cp-field cp-field--last">
          <div class="cp-label">确认新密码</div>
          <div class="cp-input-row" :class="{ 'is-error': errors.confirmPwd }">
            <input
              :type="showConfirm ? 'text' : 'password'"
              class="cp-input"
              placeholder="请再次输入新密码"
              v-model="confirmPwd"
              @input="clearError('confirmPwd')"
            />
            <span class="cp-eye-btn" @click="showConfirm = !showConfirm">
              <svg v-if="!showConfirm" class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M6.61 6.61A11.45 11.45 0 0 0 2 12s3.64 7 10 7a11.45 11.45 0 0 0 5.39-1.39M9.88 4.24A9.77 9.77 0 0 1 12 4c6.36 0 10 7 10 7a18.65 18.65 0 0 1-2.16 3.19" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else class="cp-eye-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7S18.364 5 12 5Z" stroke="#BBBCC6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="#BBBCC6" stroke-width="1.8"/>
              </svg>
            </span>
          </div>
          <p v-if="errors.confirmPwd" class="cp-error-msg">{{ errors.confirmPwd }}</p>
        </div>
      </div>

      <!-- 确认修改按钮 -->
      <div
        class="cp-submit-btn"
        :class="{ 'is-active': canSubmit, 'is-loading': loading }"
        @click="handleSubmit"
      >
        {{ loading ? '提交中...' : '确认修改' }}
      </div>
    </template>
  </div>
</template>

<script>
import { updatePassword } from '@/api/modules/teacher'

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/

export default {
  name: 'ChangePassword',
  data() {
    return {
      oldPwd: '',
      newPwd: '',
      confirmPwd: '',
      showOld: false,
      showNew: false,
      showConfirm: false,
      loading: false,
      pageState: 'form', // 'form' | 'success' | 'fail'
      failMsg: '',
      errors: {
        oldPwd: '',
        newPwd: '',
        confirmPwd: ''
      }
    }
  },
  computed: {
    canSubmit() {
      return (
        this.oldPwd.length > 0 &&
        this.newPwd.length > 0 &&
        this.confirmPwd.length > 0 &&
        !this.loading
      )
    }
  },
  methods: {
    clearError(field) {
      this.errors[field] = ''
    },
    validate() {
      let valid = true
      this.errors = { oldPwd: '', newPwd: '', confirmPwd: '' }

      if (!this.oldPwd) {
        this.errors.oldPwd = '请输入当前密码'
        valid = false
      }

      if (!this.newPwd) {
        this.errors.newPwd = '请输入新密码'
        valid = false
      } else if (!PWD_REGEX.test(this.newPwd)) {
        this.errors.newPwd = '密码长度为 8-20 位，并包含大小写字母和数字'
        valid = false
      }

      if (!this.confirmPwd) {
        this.errors.confirmPwd = '请再次输入新密码'
        valid = false
      } else if (this.confirmPwd !== this.newPwd) {
        this.errors.confirmPwd = '两次输入的密码不一致'
        valid = false
      }

      return valid
    },
    async handleSubmit() {
      if (!this.canSubmit) return
      if (!this.validate()) return

      this.loading = true
      try {
        await updatePassword({
          oldPassword: this.oldPwd,
          newPassword: this.newPwd
        })
        this.pageState = 'success'
      } catch (e) {
        const msg =
          e?.response?.data?.msg ||
          e?.response?.data?.message ||
          e?.message ||
          '密码修改失败，请稍后重试'
        this.failMsg = msg
        this.pageState = 'fail'
      } finally {
        this.loading = false
      }
    },
    handleBack() {
      this.pageState = 'form'
      this.failMsg = ''
      this.oldPwd = ''
      this.newPwd = ''
      this.confirmPwd = ''
      this.errors = { oldPwd: '', newPwd: '', confirmPwd: '' }
    }
  }
}
</script>

<style lang="scss" scoped>
.cp-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  box-sizing: border-box;
}

.cp-page-title {
  font-size: 13px;
  color: #909399;
  font-weight: 400;
  margin-bottom: 20px;
}

/* ========== 结果状态（成功 / 失败） ========== */
.cp-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 40px;
  padding-top: 52px;
}

.cp-result-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  img {
    width: 48px;
    height: 48px;
  }
}

.cp-result-title {
  font-size: 14px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12px;
}

.cp-result-desc {
  font-size: 12px;
  color: #999999;
  margin-bottom: 20px;
  text-align: center;
  max-width: 240px;
  line-height: 1.6;
}

.cp-back-btn {
  width: 66px;
  height: 36px;
  border-radius: 8px;
  background: #EEF3FF;
  color: #0049FF;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #dde3f8;
  }

  &.cp-back-btn--retry {
    width: 80px;
    background: #FFF0F0;
    color: #FF5252;

    &:hover {
      background: #ffe0e0;
    }
  }
}

/* ========== 表单 ========== */
.cp-card {
  background: #fff;
  border-radius: 13px;
  box-sizing: border-box;
  width: 100%;
}

.cp-divider {
  height: 1px;
  background: #F3F4F8;
  margin: 0 -24px;
  width: calc(100% + 48px);
}

.cp-field {
  padding: 20px 0;

  &.cp-field--last {
    padding-bottom: 24px;
  }
}

.cp-label {
  font-size: 14px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 14px;
}

.cp-input-row {
  display: flex;
  align-items: center;
  background: #F5F6FA;
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  box-sizing: border-box;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;

  &.is-error {
    border-color: #FF5252;
    background: #FFF5F5;
  }
}

.cp-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  height: 100%;

  &::placeholder {
    color: #BBBCC6;
    font-size: 14px;
  }
}

.cp-eye-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 6px;
  transition: background 0.15s;

  &:hover {
    background: #EDEEF3;
  }
}

.cp-eye-icon {
  width: 20px;
  height: 20px;
}

.cp-hint {
  font-size: 12px;
  color: #999999;
  margin-top: 10px;
  margin-bottom: 0;
  line-height: 1.5;
}

.cp-error-msg {
  font-size: 12px;
  color: #FF5252;
  margin-top: 8px;
  margin-bottom: 0;
  line-height: 1.5;
}

.cp-submit-btn {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  margin-top: 20px;
  cursor: not-allowed;
  background: #B8C4E8;
  transition: background 0.2s, opacity 0.2s;
  user-select: none;

  &.is-active {
    background: linear-gradient(90deg, #0049FF 0%, #71A0FF 100%);
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }

  &.is-loading {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
