<template>
  <div v-if="visible" class="after-class-report">
    <div class="after-class-report__header">
      <button class="after-class-report__back" type="button" @click="handleBack">返回</button>
      <div class="after-class-report__title">课后测报告</div>
    </div>
    <div class="after-class-report__body">
      <iframe
        v-if="reportUrl"
        class="after-class-report__iframe"
        :src="String(reportUrl)"
        title="课后测报告"
        frameborder="0"
      />
      <div v-else class="after-class-report__empty">暂无报告</div>
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
    },
    reportUrl: {
      type: [String, Number],
      default: ''
    }
  },
  emits: ['close'],
  methods: {
    handleBack() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.after-class-report {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: #f6f8fb;
}

.after-class-report__header {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e8edf3;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.after-class-report__back {
  min-width: 72px;
  height: 32px;
  padding: 0 16px;
  font-size: 14px;
  color: #3b82f6;
  cursor: pointer;
  background: #eef5ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
}

.after-class-report__title {
  position: absolute;
  left: 50%;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  transform: translateX(-50%);
}

.after-class-report__body {
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.after-class-report__iframe {
  width: 100%;
  height: 100%;
  background: #fff;
  border: none;
  border-radius: 8px;
}

.after-class-report__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #8c96a5;
  background: #fff;
  border-radius: 8px;
}
</style>
