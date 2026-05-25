<template>
  <div class="privacy-wrap">
    <div class="privacy-card">
      <p class="privacy-page-title">隐私政策</p>

      <div class="privacy-section">
        <div class="privacy-section-body" v-html="moduleValue || '暂无内容'" />
      </div>

      <p class="privacy-update-time" v-if="updateTime">最后更新：{{ updateTime }}</p>
    </div>
  </div>
</template>

<script>
import { getAgreement } from '@/api/modules/teacher'

export default {
  name: 'PrivacyPolicy',
  data() {
    return {
      moduleValue: '',
      updateTime: ''
    }
  },
  created() {
    this.fetchAgreement()
  },
  methods: {
    async fetchAgreement() {
      try {
        const res = await getAgreement('privacy_agreement')
        if (res && res.data) {
          this.moduleValue = res.data.moduleValue || ''
          this.updateTime = res.data.updateTime || res.data.createTime || ''
        }
      } catch (e) {
        console.error('获取隐私协议失败', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.privacy-wrap {
  width: 100%;
  padding: 24px 32px;
  box-sizing: border-box;
}

.privacy-card {

  border-radius: 12px;
}

.privacy-page-title {
  font-size: 13px;
  color: #888;
  font-weight: 400;
  margin: 0 0 18px 0;
}

.privacy-section {
  margin-bottom: 18px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.privacy-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.privacy-section-body {
  font-size: 13px;
  color: #444;
  line-height: 1.75;
  margin: 0;
  white-space: pre-line;
}

.privacy-update-time {
  font-size: 12px;
  color: #aaa;
  margin: 20px 0 0 0;
}
</style>
