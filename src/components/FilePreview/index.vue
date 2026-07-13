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
          <!-- PPT desktop：遮住顶部与左侧图标操作栏，保留右侧幻灯片缩略图目录 -->
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
 * 再以只读模式渲染文档；禁用下载、打印、复制等操作（可按权限放开）。
 *
 * 重要：本环境缺 help/zh（仅有 help/en），PPT 用 desktop 时必须 lang:'en'，
 * 否则会 404；同时勿配置 toolbarNoTabs / loaderName（会走不存在的 index_loader）。
 */

/** ONLYOFFICE 文档服务器 API 地址 */
const ONLYOFFICE_API_URL = 'https://live.fjlsjy123.com/onlyoffice/web-apps/apps/api/documents/api.js'

/**
 * 从路径中提取扩展名（去掉 query/hash）
 * @param {string} value
 * @returns {string}
 */
function extractExt(value) {
  const clean = String(value || '').split('?')[0].split('#')[0]
  const idx = clean.lastIndexOf('.')
  if (idx < 0) return ''
  return clean.slice(idx + 1).toLowerCase()
}

/**
 * 根据文件 URL + 类型生成稳定的 document.key。
 * 必须带上 fileType：OnlyOffice 会按 key 缓存文档，
 * PPT 若复用旧 PDF/Word 的 key，会提示「文件内容与扩展名不匹配」。
 * @param {string} url
 * @param {string} fileType
 * @returns {string}
 */
function buildDocumentKey(url, fileType) {
  let hash = 0
  const str = String(url || '')
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  const typePart = fileType ? `${fileType}-` : ''
  return `preview-${typePart}${Math.abs(hash).toString(16)}`.slice(0, 128)
}

/**
 * 支持预览的文件类型映射表
 * key   — 文件扩展名（小写）
 * value — ONLYOFFICE 所需的 documentType 与 fileType
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

let scriptLoaded = false
let scriptLoading = false
const scriptCallbacks = []

/**
 * 动态加载 ONLYOFFICE API 脚本。
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

let editorIdCounter = 0

export default {
  name: 'FilePreview',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    file: {
      type: Object,
      default: null
    },
    allowDownload: {
      type: String,
      default: '2'
    },
    fromTask: {
      type: Boolean,
      default: false
    },
    collectParams: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    const userInfo = getUserInfo() || {}
    return {
      isStudent: userInfo.role === 'STUDENT',
      loadError: false,
      editorInstance: null,
      editorContainerId: `onlyoffice-editor-${++editorIdCounter}`,
      isCollected: false,
      collecting: false
    }
  },

  computed: {
    isPreviewPresentation() {
      const info = this.getFileInfo()
      return !!(info && info.documentType === 'slide')
    }
  },

  watch: {
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
     * @returns {{ documentType, fileType, title, url } | null}
     */
    getFileInfo() {
      if (!this.file || !this.file.path) return null
      const name = this.file.name || ''
      const nameExt = extractExt(name)
      const pathExt = extractExt(this.file.path)
      const ext = SUPPORTED_TYPES[nameExt] ? nameExt : pathExt
      const typeInfo = SUPPORTED_TYPES[ext]
      if (!typeInfo) return null
      const titleWithExt = name
        ? (name.toLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`)
        : `预览.${ext}`
      return { ...typeInfo, title: titleWithExt, url: this.file.path }
    },

    /**
     * 初始化 ONLYOFFICE 编辑器。
     * PPT：desktop + slide + lang:en（本环境仅有 help/en，用 zh-CN 会 404）
     * 其他：embedded + zh-CN
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

      const userInfo = getUserInfo() || {}
      const isPresentation = fileInfo.documentType === 'slide'
      const canDownload = !this.isStudent || this.allowDownload === '1'
      const emptyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

      const customization = {
        customer: {
          name: '',
          address: '',
          mail: '',
          www: '',
          info: '',
          logo: emptyImage
        },
        logo: {
          image: emptyImage,
          imageDark: emptyImage,
          imageLight: emptyImage,
          imageEmbedded: emptyImage,
          url: '',
          visible: false
        },
        comments: false,
        chat: false,
        about: false,
        hideDownload: !canDownload,
        hidePrint: !canDownload,
        search: false,
        help: false,
        plugins: false
      }

      if (isPresentation) {
        // desktop 才能显示原生左侧幻灯片目录
        // 勿设 toolbarNoTabs / loaderName / loaderLogo，否则会请求 index_loader.html（404）
        Object.assign(customization, {
          compactHeader: true,
          compactToolbar: true,
          toolbarHideFileName: true,
          hideRightMenu: true,
          hideRulers: true,
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
        // 非 PPT 可安全使用 loader 定制 + embedded
        customization.loaderName = ' '
        customization.loaderLogo = emptyImage
        customization.embedded = {
          toolbarDocked: 'hidden',
          saveUrl: '',
          shareUrl: '',
          embedUrl: ''
        }
      }

      const config = {
        // PPT 用 desktop 显示左侧目录；其他用 embedded
        type: isPresentation ? 'desktop' : 'embedded',
        documentType: fileInfo.documentType,
        width: '100%',
        height: '100%',
        document: {
          fileType: fileInfo.fileType,
          key: buildDocumentKey(fileInfo.url, fileInfo.fileType),
          title: fileInfo.title,
          url: fileInfo.url,
          permissions: {
            edit: false,
            download: canDownload,
            print: canDownload,
            copy: false,
            search: false,
            comment: false,
            chat: false
          }
        },
        editorConfig: {
          mode: 'view',
          // PPT desktop 必须用 en：服务端缺 help/zh、help/zh-CN，用中文会 404
          lang: isPresentation ? 'en' : 'zh-CN',
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

    destroyEditor() {
      if (this.editorInstance && typeof this.editorInstance.destroyEditor === 'function') {
        try {
          this.editorInstance.destroyEditor()
        } catch (e) {
          // 销毁失败时静默处理
        }
      }
      this.editorInstance = null
      const el = document.getElementById(this.editorContainerId)
      if (el) el.innerHTML = ''
    },

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

    handleClose() {
      this.$emit('close')
    },

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
  background: #fff;
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

/* 遮住 OnlyOffice 左侧图标操作栏，不挡幻灯片缩略图目录 */
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

.toolbar-logo-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 42px;
  background: #F7F7F7;
  z-index: 11;
  pointer-events: none;
}

.toolbar-right-mask {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 42px;
  background: #F7F7F7;
  z-index: 11;
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
