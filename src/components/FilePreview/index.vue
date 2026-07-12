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
          <div v-if="!isStudent || allowDownload === '1'" class="file-preview-download-btn" @click="handleDownload">下载</div>
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
          <div class="file-preview-error-text">该文件类型暂不支持在线预览</div>
          <div class="file-preview-error-btn" @click="handleDownload">点击下载查看</div>
        </div>
        <div
          v-else
          class="file-preview-editor-wrap"
          :class="{ 'file-preview-editor-wrap--presentation': isPreviewPresentation }"
        >
          <div :id="editorContainerId" class="file-preview-editor"></div>
          <div v-if="isPreviewPresentation" class="presentation-top-mask"></div>
          <div v-if="isPreviewPresentation" class="presentation-left-menu-mask"></div>
          <div class="toolbar-logo-mask"></div>
          <div class="toolbar-right-mask"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * FilePreview — 通用文件在线预览组件
 *
 * 基于 ONLYOFFICE Document Server 实现，先向后端换取 JWT，
 * 再以只读模式渲染文档；禁用下载、打印、复制等操作（可按权限放开），
 * 适合在各业务模块中复用。
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

/** ONLYOFFICE 文档服务器 API 地址 */
const ONLYOFFICE_API_URL = 'https://live.fjlsjy123.com/onlyoffice/web-apps/apps/api/documents/api.js'

/**
 * 根据文件 URL 生成稳定的 document.key（OnlyOffice 缓存/鉴权依赖）
 * @param {string} url
 * @returns {string}
 */
function buildDocumentKey(url) {
  let hash = 0
  const str = String(url || '')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return `preview-${Math.abs(hash).toString(16)}`.slice(0, 128)
}

/**
 * 支持预览的文件类型映射表
 * key   — 文件扩展名（小写）
 * value — ONLYOFFICE 所需的 documentType 与 fileType
 *   documentType: 'word'  文字类文档（pdf / doc / docx / txt）
 *   documentType: 'cell'  表格类文档（xls / xlsx / csv）
 *   documentType: 'slide' 演示文稿（ppt / pptx）
 */
const SUPPORTED_TYPES = {
  pdf:  { documentType: 'word',  fileType: 'pdf'  },
  doc:  { documentType: 'word',  fileType: 'doc'  },
  docx: { documentType: 'word',  fileType: 'docx' },
  txt:  { documentType: 'word',  fileType: 'txt'  },
  xls:  { documentType: 'cell',  fileType: 'xls'  },
  xlsx: { documentType: 'cell',  fileType: 'xlsx' },
  csv:  { documentType: 'cell',  fileType: 'csv'  },
  ppt:  { documentType: 'slide', fileType: 'ppt'  },
  pptx: { documentType: 'slide', fileType: 'pptx' }
}

/**
 * 以下三个变量用于确保 ONLYOFFICE API 脚本在整个应用生命周期内只加载一次。
 * scriptLoaded   — 脚本是否已加载完毕
 * scriptLoading  — 脚本是否正在加载中（防止并发重复插入 <script>）
 * scriptCallbacks — 脚本加载期间等待的 Promise 回调队列
 */
let scriptLoaded = false
let scriptLoading = false
const scriptCallbacks = []

/**
 * 动态加载 ONLYOFFICE API 脚本。
 * 首次调用时插入 <script> 标签，后续调用直接 resolve 或进入等待队列。
 * @returns {Promise<void>}
 */
function loadOnlyOfficeScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded && window.DocsAPI) {
      resolve()
      return
    }
    scriptCallbacks.push({ resolve, reject })
    if (scriptLoading) return
    scriptLoading = true
    const script = document.createElement('script')
    script.src = ONLYOFFICE_API_URL
    script.onload = () => {
      scriptLoaded = true
      scriptLoading = false
      scriptCallbacks.forEach(cb => cb.resolve())
      scriptCallbacks.length = 0
    }
    script.onerror = () => {
      scriptLoading = false
      scriptCallbacks.forEach(cb => cb.reject(new Error('OnlyOffice API 加载失败')))
      scriptCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

import { getUserInfo } from '@/utils/auth'
import { collectToggle, getOnlyOfficeToken } from '@/api'

/** 用于生成唯一的编辑器容器 id，避免同页面多实例冲突 */
let editorIdCounter = 0

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
     * @property {string} name - 文件名（含扩展名），用于识别文件类型及展示标题，例如 'report.pdf'
     * @property {string} path - 文件的完整可访问 URL，ONLYOFFICE 服务器将通过此地址拉取文件内容
     * @example { name: 'report.pdf', path: 'https://example.com/report.pdf' }
     */
    file: {
      type: Object,
      default: null
    },

    /**
     * 是否允许下载：1 允许，2 不允许
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
      /** 是否加载/预览失败（不支持的类型或脚本加载异常时为 true，显示兜底提示） */
      loadError: false,
      /** ONLYOFFICE DocEditor 实例，用于在关闭时主动销毁释放资源 */
      editorInstance: null,
      /** 编辑器挂载的 DOM 容器 id，每个组件实例唯一 */
      editorContainerId: `onlyoffice-editor-${++editorIdCounter}`,
      /** 是否已收藏 */
      isCollected: false,
      /** 收藏请求进行中 */
      collecting: false
    }
  },

  computed: {
    isPreviewPresentation() {
      if (!this.file || !this.file.path) return false
      const ext = this.file.path.split('.').pop().toLowerCase()
      return ext === 'ppt' || ext === 'pptx'
    }
  },

  watch: {
    /**
     * 监听 visible 变化：
     *   true  → 等待 DOM 更新后初始化编辑器
     *   false → 立即销毁编辑器，释放 iframe 资源
     */
    visible(val) {
      if (val) {
        this.isCollected = Number(this.collectParams.collectCount || 0) === 1
        this.$nextTick(() => {
          this.initEditor()
        })
      } else {
        this.destroyEditor()
      }
    }
  },

  methods: {
    /**
     * 根据 file prop 解析文件类型信息。
     * @returns {{ documentType, fileType, title, url } | null} 不支持的类型返回 null
     */
    getFileInfo() {
      if (!this.file || !this.file.path) return null
      const name = this.file.name || ''
      const ext = this.file.path.split('.').pop().toLowerCase()
      const typeInfo = SUPPORTED_TYPES[ext]
      console.log(typeInfo,'文件类型')
      if (!typeInfo) return null
      const titleWithExt = name.toLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`
      return { ...typeInfo, title: titleWithExt, url: this.file.path }
    },

    /**
     * 初始化 ONLYOFFICE 编辑器：
     * 1. 校验文件类型是否支持
     * 2. 动态加载 API 脚本（已加载则跳过）
     * 3. 向后端换取 JWT token
     * 4. 以只读模式创建 DocEditor 实例
     */
    async initEditor() {
      this.loadError = false
      const fileInfo = this.getFileInfo()
      if (!fileInfo) {
        this.loadError = true
        return
      }
      try {
        await loadOnlyOfficeScript()
      } catch (e) {
        this.loadError = true
        return
      }
      if (!window.DocsAPI) {
        this.loadError = true
        return
      }
      this.destroyEditor()

      const canDownload = !this.isStudent || this.allowDownload === '1'
      const userInfo = getUserInfo() || {}
      const isPresentation = fileInfo.documentType === 'slide'
      const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

      const customization = {
        loaderName: ' ',
        loaderLogo: emptyImage,
        customer: {
          name: '',
          address: '',
          mail: '',
          www: '',
          info: '',
          logo: emptyImage
        },
        // 新版 Docs 需 visible:false；透明图作旧版/无授权兜底
        logo: {
          image: emptyImage,
          imageDark: emptyImage,
          imageLight: emptyImage,
          imageEmbedded: emptyImage,
          url: '',
          visible: false
        }
      }

      if (isPresentation) {
        Object.assign(customization, {
          compactHeader: true,
          compactToolbar: true,
          toolbarNoTabs: true,
          toolbarHideFileName: true,
          hideRightMenu: true,
          hideRulers: true,
          plugins: false,
          help: false,
          feedback: false,
          goback: false,
          review: false,
          
          layout: {
            header: {
              editMode: false,
              save: false,
              users: false
            },
            leftMenu: {
              mode: false,
              navigation: true,
              search: false,
              comments: false,
              chat: false,
              spellcheck: false
            },
            rightMenu: {
              mode: false
            },
            statusBar: {
              actionStatus: false,
              docLang: false,
              textLang: false
            },
            toolbar: {
              collaboration: false,
              draw: false,
              file: false,
              home: false,
              layout: false,
              plugins: false,
              protect: false,
              references: false,
              save: false,
              view: false
            }
          }
        })
      } else {
        customization.embedded = {
          toolbarDocked: 'hidden',  // 嵌入模式下隐藏浮动工具栏
          saveUrl: '',              // 隐藏右侧"保存"按钮
          shareUrl: '',             // 隐藏右侧"分享"按钮
          embedUrl: ''              // 隐藏右侧"嵌入"按钮
        }
      }

      const config = {
        /**
         * PPT 使用 desktop 模式保留左侧幻灯片目录，其他文件继续使用 embedded 模式
         */
        type: isPresentation ? 'desktop' : 'embedded',
        documentType: fileInfo.documentType,
        width: '100%',
        height: '100%',
        document: {
          fileType: fileInfo.fileType,
          key: buildDocumentKey(fileInfo.url),
          title: fileInfo.title,
          url: fileInfo.url,
          permissions: {
            edit: false,
            download: !this.isStudent || this.allowDownload === '1',
            print: !this.isStudent || this.allowDownload === '1',
            copy: false,
            search: false,
            comment: false,
            chat: false
          }
        },
        editorConfig: {
          mode: 'view',
          lang: 'zh-CN',
          user: {
            id: String(userInfo.id || userInfo.userId || 'preview-user'),
            name: userInfo.nickname || userInfo.name || userInfo.username || '预览用户'
          },
          customization
        }
      }

      try {
        const tokenRes = await getOnlyOfficeToken(config)
        config.token = tokenRes.data
        this.editorInstance = new window.DocsAPI.DocEditor(this.editorContainerId, config)
      } catch (e) {
        this.loadError = true
      }
    },

    /**
     * 销毁编辑器实例并清空容器 innerHTML，
     * 防止下次打开时出现多个 iframe 重叠的问题。
     */
    destroyEditor() {
      if (this.editorInstance && typeof this.editorInstance.destroyEditor === 'function') {
        try {
          this.editorInstance.destroyEditor()
        } catch (e) {
          // 销毁失败时静默处理，不影响后续流程
        }
      }
      this.editorInstance = null
      const el = document.getElementById(this.editorContainerId)
      if (el) el.innerHTML = ''
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

  /** 组件销毁前主动释放编辑器资源 */
  beforeDestroy() {
    this.destroyEditor()
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

.file-preview-editor-wrap--presentation {
  background: #F7F7F7;
}

.file-preview-editor {
  width: 100%;
  height: 100%;
}

.presentation-top-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 42px;
  background: #F7F7F7;
  z-index: 10;
  pointer-events: auto;
}

.presentation-left-menu-mask {
  position: absolute;
  top: 42px;
  left: 0;
  bottom: 0;
  width: 48px;
  background: #F7F7F7;
  z-index: 10;
  pointer-events: auto;
}

/* 新版 OnlyOffice logo 在左上角，用遮罩兜底（Community / 配置未生效时） */
.toolbar-logo-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 42px;
  background: #F7F7F7;
  z-index: 10;
  pointer-events: none;
}

.toolbar-right-mask {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 42px;
  background: #F7F7F7;
  z-index: 10;
  pointer-events: none;
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
