<template>
  <div class="ua-wrap">
    <div class="ua-card">
      <p class="ua-page-title">用户协议</p>

      <div class="ua-section">
        <div class="ua-section-body" v-html="moduleValue || '暂无内容'" />
      </div>

      <p class="ua-update-time" v-if="updateTime">最后更新：{{ updateTime }}</p>
    </div>
  </div>
</template>

<script>
import { getAgreement } from '@/api/modules/teacher'

export default {
  name: 'UserAgreement',
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
        const res = await getAgreement('user_agreement')
       if (res && res.data && res.data.length!=0) {
          this.moduleValue = res.data[0].moduleValue || ''
          this.updateTime = res.data[0].updateTime || res.data[0].createTime || ''
        }
      } catch (e) {
        console.error('获取用户协议失败', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ua-wrap {
    width: 100%;
  padding: 24px 32px;
  box-sizing: border-box;
}

.ua-card {
 
  border-radius: 12px;

}

.ua-page-title {
  font-size: 13px;
  color: #888;
  font-weight: 400;
  margin: 0 0 18px 0;
}

.ua-section {
  margin-bottom: 18px;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.ua-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.ua-section-body {
  font-size: 13px;
  color: #444;
  line-height: 1.75;
  margin: 0;
    white-space: pre-line;
}

.ua-update-time {
  font-size: 12px;
  color: #aaa;
  margin: 20px 0 0 0;
}
</style>
