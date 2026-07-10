<template>
  <div
    v-if="visible"
    ref="watermark"
    class="video-watermark"
    :style="watermarkStyle"
  ></div>
</template>

<script>
/** 水印图案瓦片的最小宽度，瓦片越大，画面中的水印数量越少 */
const WATERMARK_MIN_TILE_WIDTH = 720

/** 水印图案瓦片的最大宽度，避免长用户名导致重复间距过大 */
const WATERMARK_MAX_TILE_WIDTH = 1080

/** 水印文字基础字号，需在清晰可辨和不影响观看之间保持平衡 */
const WATERMARK_FONT_SIZE = 14

/** 水印瓦片宽高比，控制铺满播放器区域时的纵向密度 */
const WATERMARK_TILE_HEIGHT_RATIO = 1.05

/** 单个瓦片中的水印错位坐标，避免整体呈现规整的网格感 */
const WATERMARK_POINTS = [
  { xRatio: 0.28, yRatio: 0.24, opacity: 0.3 },
  { xRatio: 0.74, yRatio: 0.64, opacity: 0.3 }
]

export default {
  name: 'VideoWatermark',

  props: {
    /** 用户信息，通常来自 /edu/sso/info */
    userInfo: {
      type: Object,
      default: () => ({})
    },

    /** 是否禁用水印，例如教师角色无需展示 */
    disabled: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    /**
     * 当前登录用户的播放器水印文案。
     * accountName 对应 /edu/sso/info 返回的 userName，displayName 优先取真实姓名。
     */
    watermarkText() {
      const accountName = String(this.userInfo.userName || '').trim()
      const displayName = String(
        this.userInfo.realName ||
        this.userInfo.nickName ||
        this.userInfo.name ||
        ''
      ).trim()

      if (accountName && displayName) return `${accountName}-${displayName}`

      return accountName || displayName
    },

    /** 未禁用且有水印文案时才渲染水印 */
    visible() {
      return !this.disabled && !!this.watermarkText
    },

    /** 基于 SVG 背景图生成错位、低密度的重复水印样式 */
    watermarkStyle() {
      if (!this.watermarkText) return {}

      const textLength = Array.from(this.watermarkText).length
      const estimatedTextWidth = textLength * WATERMARK_FONT_SIZE
      const width = Math.min(
        Math.max(estimatedTextWidth * 2.6, WATERMARK_MIN_TILE_WIDTH),
        WATERMARK_MAX_TILE_WIDTH
      )
      const height = Math.round(width * WATERMARK_TILE_HEIGHT_RATIO)
      const safeText = this.escapeSvgText(this.watermarkText)
      const watermarkTexts = WATERMARK_POINTS.map(point => {
        const x = Math.round(width * point.xRatio)
        const y = Math.round(height * point.yRatio)
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-24 ${x} ${y})" font-family="Arial, Helvetica, sans-serif" font-size="${WATERMARK_FONT_SIZE}" font-weight="600" fill="#000" fill-opacity="${point.opacity}">${safeText}</text>`
      }).join('')
      const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        watermarkTexts,
        '</svg>'
      ].join('')

      return {
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`,
        backgroundSize: `${width}px ${height}px`
      }
    }
  },

  methods: {
    /**
     * 转义 SVG 文本节点内容，防止用户名中的特殊字符破坏 SVG 结构。
     * @param {String} text 原始水印文本
     * @returns {String} 可安全写入 SVG text 节点的文本
     */
    escapeSvgText(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    },

    /**
     * 将水印移动到指定容器内。
     * @param {HTMLElement} container 目标容器，常用于浏览器全屏元素
     */
    moveTo(container) {
      const watermarkEl = this.$refs.watermark
      if (container && watermarkEl && watermarkEl.parentNode !== container) {
        container.appendChild(watermarkEl)
      }
    },

    /**
     * 将水印还原到原始播放器容器内。
     * @param {HTMLElement} container 原始播放器容器
     */
    restoreTo(container) {
      const watermarkEl = this.$refs.watermark
      if (container && watermarkEl && watermarkEl.parentNode !== container) {
        container.appendChild(watermarkEl)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.video-watermark {
  position: absolute;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
  background-repeat: repeat;
  background-position: 0 0;
}
</style>
