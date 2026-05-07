<template>
  <div class="file-preview-mask" v-if="visible" @click.self="handleClose">
    <div class="file-preview-box">
      <div class="file-preview-header">
        <div class="file-preview-title">{{ file && file.name ? file.name : '文件预览' }}</div>
        <img
          src="@/assets/images/login/close.png"
          class="file-preview-close"
          alt="关闭"
          @click="handleClose"
        >
      </div>
      <div class="file-preview-body">
        <div v-if="loadError" class="file-preview-error">
          <div class="file-preview-error-text">该文件类型暂不支持在线预览</div>
          <div class="file-preview-error-btn" @click="handleDownload">点击下载查看</div>
        </div>
        <div v-else :id="editorContainerId" class="file-preview-editor"></div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * FilePreview — 通用文件在线预览组件
 *
 * 基于 ONLYOFFICE Document Server 实现，以只读模式渲染文档，
 * 禁用下载、打印、复制等操作，适合在各业务模块中复用。
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
const ONLYOFFICE_API_URL = 'http://120.26.253.133:18106/web-apps/apps/api/documents/api.js'

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
    }
  },

  data() {
    return {
      /** 是否加载/预览失败（不支持的类型或脚本加载异常时为 true，显示兜底提示） */
      loadError: false,
      /** ONLYOFFICE DocEditor 实例，用于在关闭时主动销毁释放资源 */
      editorInstance: null,
      /** 编辑器挂载的 DOM 容器 id，每个组件实例唯一 */
      editorContainerId: `onlyoffice-editor-${++editorIdCounter}`
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
      return { ...typeInfo, title: name, url: this.file.path }
    },

    /**
     * 初始化 ONLYOFFICE 编辑器：
     * 1. 校验文件类型是否支持
     * 2. 动态加载 API 脚本（已加载则跳过）
     * 3. 以只读模式创建 DocEditor 实例
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
      const config = {
        /**
         * type: 'embedded' — 嵌入模式
         * 仅渲染文档内容区，完全去掉顶部工具栏、左侧面板、标题栏等所有操作 UI
         */
        type: 'embedded',
        documentType: fileInfo.documentType,
        width: '100%',
        height: '100%',
        document: {
          fileType: fileInfo.fileType,
          title: fileInfo.title,
          url: fileInfo.url,
          permissions: {
            edit: false,      // 禁止编辑
            download: false,  // 禁止下载
            print: false,     // 禁止打印
            copy: false,      // 禁止复制
            search: false,    // 禁止搜索
            comment: false,   // 禁止批注
            chat: false       // 禁止聊天
          }
        },
        editorConfig: {
          mode: 'view',
          lang: 'zh-CN',
          customization: {
            embedded: {
              toolbarDocked: 'hidden'   // 嵌入模式下隐藏浮动工具栏
            },
            logo: {
              // 用 1×1 透明 gif 替换 logo 图片，并清空跳转链接，达到隐藏效果
              image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              imageEmbedded: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              url: ''
            }
          }
        }
      }
      try {
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

    /** 关闭预览，向父组件抛出 close 事件 */
    handleClose() {
      this.$emit('close')
    },

    /** 不支持预览时的兜底操作：在新标签页中直接打开文件地址 */
    handleDownload() {
      if (this.file && this.file.path) {
        window.open(this.file.path, '_blank')
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

.file-preview-close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 16px;
}

.file-preview-body {
  flex: 1;
  height: 0;
  position: relative;
}

.file-preview-editor {
  width: 100%;
  height: 100%;
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
