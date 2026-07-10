<template>
  <div
    v-if="visible"
    ref="watermark"
    class="video-watermark"
  >
    <svg
      v-if="watermarkItems.length"
      class="video-watermark__svg"
      :viewBox="`0 0 ${containerWidth} ${containerHeight}`"
      preserveAspectRatio="none"
    >
      <text
        v-for="item in watermarkItems"
        :key="item.id"
        :x="item.x"
        :y="item.y"
        text-anchor="middle"
        dominant-baseline="middle"
        :transform="`rotate(-24 ${item.x} ${item.y})`"
        font-family="Arial, Helvetica, sans-serif"
        :font-size="WATERMARK_FONT_SIZE"
        font-weight="600"
        fill="#000"
        :fill-opacity="item.opacity"
      >{{ watermarkText }}</text>
    </svg>
  </div>
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

/** 水印位置随机变化范围，单个方向整体控制在 120px 内 */
const WATERMARK_RANDOM_RANGE = 120

/** 单个瓦片中的水印错位坐标，避免整体呈现规整的网格感 */
const WATERMARK_POINTS = [
  { xRatio: 0.28, yRatio: 0.24, opacity: 0.3 },
  { xRatio: 0.74, yRatio: 0.64, opacity: 0.3 }
]

function getRandomOffset() {
  return Math.round((Math.random() - 0.5) * WATERMARK_RANDOM_RANGE)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

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

  data() {
    return {
      containerWidth: 0,
      containerHeight: 0,
      watermarkPointOffsets: WATERMARK_POINTS.map(() => ({
        x: getRandomOffset(),
        y: getRandomOffset()
      })),
      resizeObserver: null,
      WATERMARK_FONT_SIZE
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

    tileSize() {
      const textLength = Array.from(this.watermarkText).length
      const estimatedTextWidth = textLength * WATERMARK_FONT_SIZE
      const width = Math.min(
        Math.max(estimatedTextWidth * 2.6, WATERMARK_MIN_TILE_WIDTH),
        WATERMARK_MAX_TILE_WIDTH
      )

      return {
        width,
        height: Math.round(width * WATERMARK_TILE_HEIGHT_RATIO)
      }
    },

    /** 按容器尺寸生成水印点，过滤掉边缘会被裁切的水印 */
    watermarkItems() {
      if (!this.watermarkText || !this.containerWidth || !this.containerHeight) {
        return []
      }

      const items = []
      const edgeSafeX = 150
      const edgeSafeY = 90
      const { width, height } = this.tileSize

      for (let baseY = 0; baseY < this.containerHeight; baseY += height) {
        for (let baseX = 0; baseX < this.containerWidth; baseX += width) {
          WATERMARK_POINTS.forEach((point, index) => {
            const offset = this.watermarkPointOffsets[index] || { x: 0, y: 0 }
            const x = baseX + clamp(Math.round(width * point.xRatio + offset.x), edgeSafeX, width - edgeSafeX)
            const y = baseY + clamp(Math.round(height * point.yRatio + offset.y), edgeSafeY, height - edgeSafeY)

            if (
              x < edgeSafeX ||
              x > this.containerWidth - edgeSafeX ||
              y < edgeSafeY ||
              y > this.containerHeight - edgeSafeY
            ) {
              return
            }

            items.push({
              id: `${baseX}-${baseY}-${index}`,
              x,
              y,
              opacity: point.opacity
            })
          })
        }
      }

      return items
    }
  },

  mounted() {
    this.$nextTick(this.updateContainerSize)

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.updateContainerSize)
      if (this.$refs.watermark) {
        this.resizeObserver.observe(this.$refs.watermark)
      }
    } else {
      window.addEventListener('resize', this.updateContainerSize)
    }
  },

  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    } else {
      window.removeEventListener('resize', this.updateContainerSize)
    }
  },

  methods: {
    updateContainerSize() {
      const watermarkEl = this.$refs.watermark
      if (!watermarkEl) return

      this.containerWidth = Math.round(watermarkEl.clientWidth)
      this.containerHeight = Math.round(watermarkEl.clientHeight)
    },

    /**
     * 将水印移动到指定容器内。
     * @param {HTMLElement} container 目标容器，常用于浏览器全屏元素
     */
    moveTo(container) {
      const watermarkEl = this.$refs.watermark
      if (container && watermarkEl && watermarkEl.parentNode !== container) {
        container.appendChild(watermarkEl)
        this.$nextTick(this.updateContainerSize)
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
        this.$nextTick(this.updateContainerSize)
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
}

.video-watermark__svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
