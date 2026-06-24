<template>
  <div class="acr" v-if="visible">
    <div class="acr__header">
      <div class="acr__back" @click="$emit('close')">
        <img src="@/assets/images/class/back_icon.png" class="acr__back-arrow" alt="返回" />
        <span class="acr__back-text">返回</span>
      </div>
      <div class="acr__title">课后测报告</div>
      <div class="acr__header-right"></div>
    </div>

    <div class="acr__body">
      <div v-if="!iframeUrl" class="acr__empty">暂无报告数据</div>
      <iframe
        v-else
        :src="iframeUrl"
        class="acr__iframe"
        frameborder="0"
        allowfullscreen
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AfterClassReport',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classId: {
      type: [String, Number],
      default: ''
    },
    recordId: {
      type: [String, Number],
      default: ''
    }
  },
  emits: ['close'],
  computed: {
    iframeUrl() {
      if (!this.classId || !this.recordId) return ''
      return `https://test.fjlsjy123.com/afterClassReport.html?classId=${this.classId}&recordId=${this.recordId}`
    }
  }
}
</script>

<style scoped>
.acr {
  position: fixed;
  inset: 0;
  background: #f5f6fa;
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.acr__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.acr__back {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #555;
  font-size: 14px;
}

.acr__back:hover {
  color: #0049FF;
}

.acr__back-arrow {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.acr__title {
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

.acr__header-right {
  width: 80px;
}

.acr__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.acr__iframe {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
}

.acr__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 14px;
}
</style>
