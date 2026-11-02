<template>
  <div class="file-preview-mask" v-if="visible" @click.self="handleClose">
    <div class="file-preview-box">
      <div class="file-preview-header">
        <div class="file-preview-title">{{ file && file.name ? file.name : '文件预览' }}</div>
        <div class="file-preview-header-actions">
          <div
            v-if="isStudent && fromTask"
            class="file-preview-collect-btn"
            :class="{ 'file-preview-collect-btn--active': isCollected }"
            @click="handleCollect"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" :fill="isCollected ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {{ isCollected ? '已收藏' : '收藏' }}
          </div>
          <!-- <div v-if="!isStudent || allowDownload === '1'" class="file-preview-download-btn" @click="handleDownload">下载</div> -->
          <img
            src="@/assets/images/login/close.png"
            class="file-preview-close"
            alt="关闭"
            @click="handleClose"
          >
        </div>
      </div>
      <div class="file-preview-body">
        <div v-if="loadError" class="file-preview-error">
          <div class="file-preview-error-text">{{ loadErrorMessage }}</div>
          <!-- <div class="file-preview-error-btn" @click="handleDownload">点击下载查看</div> -->
        </div>
        <div
          v-else
          class="file-preview-editor-wrap"
          v-loading="loading"
          element-loading-text="文件加载中..."
        >
          <iframe
            v-if="previewUrl"
            :key="previewUrl"
            :src="previewUrl"
            :title="file && file.name ? file.name : '文件预览'"
            class="file-preview-editor"
            frameborder="0"
            allowfullscreen
            @load="handlePreviewLoad"
            @error="handlePreviewError"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * FilePreview — 通用文件在线预览组件
 *
 * 调用永中在线预览接口获取地址，在弹窗内通过 iframe 展示。
 * 预览页的下载、打印、复制权限由服务端生成的预览链接控制。
 *
 * 使用示例：
 *   <FilePreview
 *     :visible="previewVisible"
 *     :file="{ name: 'report.pdf', path: 'https://example.com/report.pdf' }"
 *     @close="previewVisible = false"
 *   />
 *
 * Props：
 *   visible  {Boolean}  是否显示预览弹窗
 *   file     {Object}   预览的文件对象，格式见下方 props 说明
 *
 * Events：
 *   close    关闭弹窗时触发，父组件需将 visible 置为 false
 */

import { getUserInfo } from '@/utils/auth'
import { collectToggle } from '@/api'
import { getFilePreviewUrl } from '@/api/filePreview'

export default {
  name: 'FilePreview',

  props: {
    /**
     * 是否显示预览弹窗
     * @type {Boolean}
     * @default false
     */
    visible: {
      type: Boolean,
      default: false
    },

    /**
     * 需要预览的文件对象
     * @type {Object|null}
     * @property {string} name - 文件名，用于弹窗及预览页标题，例如 'report.pdf'
     * @property {string} path - 文件的完整可访问 URL，预览服务将通过此地址拉取文件内容
     * @example { name: 'report.pdf', path: 'https://example.com/report.pdf' }
     */
    file: {
      type: Object,
      default: null
    },

    /**
     * 原有下载开关：1 允许，2 不允许；预览页内部权限由服务端链接控制
     * @type {String}
     * @default '2'
     */
    allowDownload: {
      type: String,
      default: '2'
    },

    /**
     * 是否从"学习任务"入口打开，true 时才对学生显示收藏按钮
     * @type {Boolean}
     * @default false
     */
    fromTask: {
      type: Boolean,
      default: false
    },

    /**
     * 收藏接口所需参数 { courseId, lessonId, type }
     * @type {Object}
     * @default {}
     */
    collectParams: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    const userInfo = getUserInfo() || {}
    return {
      /** 当前用户是否为学生角色，权限限制仅对学生生效 */
      isStudent: userInfo.role === 'STUDENT',
      /** 是否加载/预览失败 */
      loadError: false,
      loadErrorMessage: '',
      loading: false,
      previewUrl: '',
      /** 关闭或切换文件时取消请求，并忽略已经过期的响应 */
      previewController: null,
      previewRequestId: 0,
      /** 是否已收藏 */
      isCollected: false,
      /** 收藏请求进行中 */
      collecting: false
    }
  },

  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.isCollected = Number(this.collectParams.collectCount || 0) === 1
          this.initPreview()
        } else {
          this.destroyPreview()
        }
      }
    },
    file: {
      deep: true,
      handler() {
        if (this.visible) this.initPreview()
      }
    }
  },

  methods: {
    /** 获取预览链接；收藏、下载等业务操作仍由原组件处理。 */
    async initPreview() {
      this.destroyPreview()
      if (!this.visible) return
      this.loadError = false
      this.loadErrorMessage = ''
      if (!this.file || !this.file.path) {
        this.loadError = true
        this.loadErrorMessage = '该文件类型暂不支持在线预览'
        return
      }

      const requestId = this.previewRequestId
      const controller = new AbortController()
      this.previewController = controller
      this.loading = true
      try {
        const previewUrl = await getFilePreviewUrl({
          downloadUrl: this.file.path,
          fileName: this.file.name || '立升教育'
        }, { signal: controller.signal })
        if (requestId !== this.previewRequestId || !this.visible) return
        this.previewUrl = previewUrl
      } catch (error) {
        if (requestId !== this.previewRequestId || !this.visible) return
        this.loading = false
        this.loadError = true
        this.loadErrorMessage = error.isAxiosError
          ? '文件预览服务暂不可用，请稍后重试'
          : error.message || '文件预览失败，请稍后重试'
      } finally {
        if (requestId === this.previewRequestId) this.previewController = null
      }
    },

    handlePreviewLoad() {
      this.loading = false
    },

    handlePreviewError() {
      this.loading = false
      this.loadError = true
      this.loadErrorMessage = '文件预览加载失败，请稍后重试'
    },

    /** 清空 iframe，并阻止已关闭弹窗或旧文件的请求结果覆盖当前预览。 */
    destroyPreview() {
      this.previewRequestId += 1
      if (this.previewController) this.previewController.abort()
      this.previewController = null
      this.previewUrl = ''
      this.loading = false
    },

    /** 收藏/取消收藏 */
    async handleCollect() {
      if (this.collecting) return
      this.collecting = true
      try {
        const res = await collectToggle(this.collectParams)
        const collectCount = res?.data?.collectCount
        this.isCollected = collectCount !== undefined ? Number(collectCount) === 1 : !this.isCollected
        this.$message.success(this.isCollected ? '收藏成功' : '已取消收藏')
        this.$emit('collect-change', this.isCollected)
      } catch (e) {
        this.$message.error('操作失败，请重试')
      } finally {
        this.collecting = false
      }
    },

    /** 关闭预览，向父组件抛出 close 事件 */
    handleClose() {
      this.destroyPreview()
      this.$emit('close')
    },

    /** 不支持预览时的兜底操作：将文件下载到本地 */
    async handleDownload() {
      if (!this.file || !this.file.path) return
      const url = this.file.path
      const filename = this.file.name || url.split('/').pop() || '文件'
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        window.open(url, '_blank')
      }
    }
  },

  /** 组件销毁前主动释放预览资源 */
  beforeDestroy() {
    this.destroyPreview()
  }
}
</script>

<style lang="scss" scoped>
.file-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-preview-box {
  width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.file-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.file-preview-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.file-preview-collect-btn {
  display: flex;
  align-items: center;
  padding: 5px 14px;
  background: #f5f5f5;
  color: #555;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid #ddd;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #ebebeb;
  }

  &--active {
    background: #FFF8E1;
    color: #E6A817;
    border-color: #F5C842;
  }
}

.file-preview-download-btn {
  padding: 5px 14px;
  background: #0049FF;
  color: #fff;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }
}

.file-preview-close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.file-preview-body {
  flex: 1;
  height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}

.file-preview-editor-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.file-preview-editor {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.file-preview-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.file-preview-error-text {
  font-size: 16px;
  color: #999999;
}

.file-preview-error-btn {
  padding: 10px 24px;
  background: #0049FF;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
}
</style>
