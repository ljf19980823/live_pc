<template>
  <div />
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
    reportUrl() {
      if (!this.classId || !this.recordId) return ''
      return `https://live.fjlsjy123.com/portal/afterClassReport.html?classId=${this.classId}&recordId=${this.recordId}`
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.reportUrl) {
          if (window.electronAPI && window.electronAPI.openExternalUrl) {
            window.electronAPI.openExternalUrl(this.reportUrl)
          } else {
            window.open(this.reportUrl, '_blank')
          }
        }
        this.$emit('close')
      }
    }
  }
}
</script>
