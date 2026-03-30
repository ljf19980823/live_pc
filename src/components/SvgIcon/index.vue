<template>
  <i :class="['ls-icon', iconClass]" :style="iconStyle" />
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    icon: {
      type: String,
      required: true
    },
    size: {
      type: [String, Number],
      default: ''
    },
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconClass() {
      return this.icon.startsWith('el-') ? this.icon : `el-icon-${this.icon}`
    },
    iconStyle() {
      const style = {}
      if (this.size) style.fontSize = typeof this.size === 'number' ? `${this.size}px` : this.size
      if (this.color) style.color = this.color
      return style
    }
  }
}
</script>
