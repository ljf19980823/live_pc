<template>
  <div class="courseware">
    <div v-if="isTeacher" class="courseware-toolbar">
      <el-upload
        action=""
        multiple
        :show-file-list="false"
        :disabled="!association || uploading"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
      >
        <button class="courseware-upload" type="button" :disabled="!association || uploading">
          <i :class="uploading ? 'el-icon-loading' : 'el-icon-upload2'"></i>
          {{ uploading ? '上传中…' : '上传课件' }}
        </button>
      </el-upload>
    </div>

    <div v-if="uploadQueue.length" class="courseware-uploads" aria-live="polite">
      <div v-for="entry in uploadQueue" :key="entry.key" class="courseware-upload-entry">
        <div class="courseware-upload-info">
          <span class="courseware-upload-name" :title="entry.file.name">{{ entry.file.name }}</span>
          <button v-if="entry.status === 'error'" type="button" class="courseware-text-button" @click="uploadFile(entry.file, entry)">上传失败，重试</button>
          <span v-else>{{ entry.percent }}%</span>
        </div>
        <el-progress :percentage="entry.percent" :show-text="false" :status="entry.status === 'error' ? 'exception' : undefined" :stroke-width="3" />
      </div>
    </div>

    <div v-if="!association" class="courseware-placeholder">缺少课堂信息，暂无法查看课件</div>
    <div v-else-if="loading" class="courseware-placeholder" role="status"><i class="el-icon-loading"></i> 正在加载课件…</div>
    <div v-else-if="loadError" class="courseware-placeholder" role="alert">
      <span>课件加载失败，请重试</span>
      <button type="button" class="courseware-text-button" @click="fetchResources(pageNum)">重新加载</button>
    </div>
    <div v-else-if="!resources.length" class="courseware-placeholder">暂无课件</div>
    <div v-else class="courseware-list">
      <div
        v-for="item in resources"
        :key="item.id"
        class="courseware-card"
        role="button"
        tabindex="0"
        :aria-label="'查看课件：' + item.name"
        @click="openResource(item)"
        @keydown.enter.self.prevent="openResource(item)"
        @keydown.space.self.prevent="openResource(item)"
      >
        <img :src="getResourceTypeIcon(item)" class="courseware-icon" alt="" />
        <div class="courseware-info">
          <div class="courseware-name" :title="item.name">{{ item.name || '未命名课件' }}</div>
          <div class="courseware-meta">
            <span class="courseware-type">{{ resourceExtension(item).toUpperCase() || typeLabel(item.type) }}</span>
            <span>{{ item.size || formatSize(item.unit) }}</span>
          </div>
        </div>
        <div v-if="isStudent" class="courseware-progress" @click.stop>
          <el-progress
            type="circle"
            :percentage="normalizeResourceProgress(item.progressPercent)"
            :width="36"
            :stroke-width="2"
            :color="normalizeResourceProgress(item.progressPercent) >= 100 ? '' : '#71A0FF'"
            :status="normalizeResourceProgress(item.progressPercent) >= 100 ? 'success' : undefined"
          />
        </div>
        <div v-if="isTeacher" class="courseware-actions" @click.stop>
          <el-dropdown trigger="hover" placement="bottom-end" @command="command => handleCommand(command, item)">
            <button type="button" class="courseware-more" :aria-label="'课件操作：' + item.name" aria-haspopup="true" :disabled="isBusy(item)">
              <i :class="isBusy(item) ? 'el-icon-loading' : 'el-icon-more'"></i>
            </button>
            <el-dropdown-menu slot="dropdown" class="courseware-menu">
              <!-- <el-dropdown-item command="download" icon="el-icon-download">下载课件</el-dropdown-item> -->
              <el-dropdown-item command="rename" icon="el-icon-edit">修改课件名</el-dropdown-item>
              <el-dropdown-item command="delete" icon="el-icon-delete" class="courseware-menu-delete">删除课件</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="!loading && !loadError && total > pageSize"
      class="courseware-pagination"
      small
      layout="prev, pager, next"
      :pager-count="5"
      :current-page="pageNum"
      :page-size="pageSize"
      :total="total"
      @current-change="fetchResources"
    />

    <el-dialog
      title="修改课件名"
      :visible="renameVisible"
      width="440px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!renaming"
      :show-close="!renaming"
      @close="closeRename"
    >
      <el-input ref="renameInput" v-model="renameValue" aria-label="课件名称" placeholder="请输入课件名称" :disabled="renaming" @keyup.enter.native="confirmRename">
        <template v-if="renameSuffix" slot="append">{{ renameSuffix }}</template>
      </el-input>
      <span slot="footer">
        <el-button :disabled="renaming" @click="closeRename">取消</el-button>
        <el-button type="primary" :loading="renaming" :disabled="!renameValue.trim()" @click="confirmRename">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="删除课件"
      :visible="deleteVisible"
      width="400px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!deleting"
      :show-close="!deleting"
      @close="closeDelete"
    >
      <div>确认删除课件吗</div>
      <span slot="footer">
        <el-button :disabled="deleting" @click="closeDelete">取消</el-button>
        <el-button type="danger" :loading="deleting" @click="confirmDelete">删除</el-button>
      </span>
    </el-dialog>

    <FilePreview
      :visible="previewKind === 'document'"
      :file="previewFile"
      :preview-only="!isTeacher"
      @close="closePreview"
    />
    <VideoPlayer
      :visible="previewKind === 'video'"
      :source="previewFile ? previewFile.path : ''"
      :title="previewFile ? previewFile.name : ''"
      :allow-download="isTeacher ? '1' : '2'"
      @close="closeVideoPreview"
    />
    <el-dialog
      :title="previewFile ? previewFile.name : ''"
      :visible="previewKind === 'image' || previewKind === 'audio'"
      :width="previewKind === 'audio' ? '480px' : '800px'"
      append-to-body
      @close="closePreview"
    >
      <div @contextmenu="preventReadOnlyContextMenu">
        <img v-if="previewKind === 'image' && previewFile" :src="previewFile.path" class="courseware-preview-image" alt="课件图片" />
        <audio v-if="previewKind === 'audio' && previewFile" :src="previewFile.path" controls autoplay :controlslist="isTeacher ? null : 'nodownload'" class="courseware-preview-audio"></audio>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilePreview from '@/components/FilePreview/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import { getUserInfo } from '@/utils/auth'
import { getFileExtension, getResourceExtension, getResourceTypeIcon, getResourceAssociation, normalizeResourceProgress } from '@/utils/resource'
import { getSharedResourceList, uploadSharedResource, updateSharedResource, deleteSharedResource } from '@/api/modules/resource'
import { updateCourseProgress } from '@/api/modules/teacher'

// 课件类型转换为进度接口类型：文档/其他→7，视频→4，音频→6，图片→5，链接→8。
const PROGRESS_TYPES = { '1': '7', '2': '4', '3': '6', '4': '5', '5': '7', '6': '8' }

// 进度限制在 0–100，并保留两位小数，避免丢失视频播放进度的小数部分。
function progressValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number)) * 100) / 100 : 0
}

export default {
  name: 'ClassroomCourseware',
  components: { FilePreview, VideoPlayer },
  props: {
    active: { type: Boolean, default: false },
    historyLessonId: { type: [String, Number], default: '' },
    liveId: { type: [String, Number], default: '' }
  },
  data() {
    return {
      resources: [],
      pageNum: 1,
      pageSize: 20,
      total: 0,
      loading: false,
      loadError: false,
      requestId: 0,
      contextVersion: 0,
      disposed: false,
      uploadQueue: [],
      uploadKey: 0,
      renameVisible: false,
      renameTarget: null,
      renameValue: '',
      renameSuffix: '',
      renaming: false,
      deleteVisible: false,
      deleteTarget: null,
      deleting: false,
      downloadingIds: [],
      previewKind: '',
      previewFile: null,
      previewResource: null,
      progressReports: new Map()
    }
  },
  computed: {
    role() {
      return this.$store.state.user.userInfo.role || (getUserInfo() || {}).role || ''
    },
    isTeacher() { return this.role === 'TEACHER' },
    isStudent() { return this.role === 'STUDENT' },
    association() {
      return getResourceAssociation({ historyLessonId: this.historyLessonId, liveId: this.liveId })
    },
    contextKey() { return JSON.stringify([this.association, this.role]) },
    uploading() { return this.uploadQueue.some(entry => entry.status === 'uploading') }
  },
  watch: {
    active: {
      immediate: true,
      handler(value) { if (value) this.fetchResources(1) }
    },
    contextKey() {
      // 切换课堂或身份时使旧请求失效，并清理旧课堂的列表、弹窗状态。
      this.contextVersion++
      this.requestId++
      this.resources = []
      this.total = 0
      this.pageNum = 1
      this.loading = false
      this.loadError = false
      this.uploadQueue = []
      this.renaming = false
      this.deleting = false
      this.downloadingIds = []
      this.closeRename()
      this.closeDelete()
      this.closePreview()
      if (this.active) this.fetchResources(1)
    }
  },
  methods: {
    getResourceTypeIcon,
    normalizeResourceProgress,
    isCurrentContext(version) { return !this.disposed && version === this.contextVersion },
    canManage(item) {
      return this.isTeacher && !!this.association && (!item || !!item.id)
    },
    isBusy(item) {
      return this.downloadingIds.includes(item.id) ||
        (this.renaming && this.renameTarget && this.renameTarget.id === item.id) ||
        (this.deleting && this.deleteTarget && this.deleteTarget.id === item.id)
    },
    async fetchResources(page = this.pageNum) {
      if (!this.association || this.disposed) return
      const version = this.contextVersion
      const requestId = ++this.requestId
      this.pageNum = page
      this.loading = true
      this.loadError = false
      try {
        const res = await getSharedResourceList({ ...this.association, pageNum: page, pageSize: this.pageSize })
        if (!this.isCurrentContext(version) || requestId !== this.requestId) return
        const data = res.data || {}
        // 列表可能暂未同步刚保存的进度，合并本地已确认值，避免显示回退。
        this.resources = (data.list || []).map(item => {
          const report = this.isStudent && this.progressReports.get(this.getProgressKey(item.id))
          return report && report.saved > progressValue(item.progressPercent)
            ? { ...item, progressPercent: report.saved }
            : item
        })
        this.total = Number(data.total) || 0
        const lastPage = Math.max(1, Math.ceil(this.total / this.pageSize))
        if (page > lastPage) return this.fetchResources(lastPage)
      } catch (_) {
        if (this.isCurrentContext(version) && requestId === this.requestId) this.loadError = true
      } finally {
        if (this.isCurrentContext(version) && requestId === this.requestId) this.loading = false
      }
    },
    beforeUpload(file) {
      if (!this.canManage()) return false
      if (file.size > 600 * 1024 * 1024) {
        this.$message.warning('上传文件大小不能超过600M')
        return false
      }
      return true
    },
    handleUpload({ file }) { return this.uploadFile(file) },
    async uploadFile(file, retryEntry) {
      if (!this.beforeUpload(file) || (retryEntry && retryEntry.status === 'uploading')) return
      const version = this.contextVersion
      const association = { ...this.association }
      const entry = retryEntry || { key: ++this.uploadKey, file, percent: 0, status: 'uploading' }
      entry.percent = 0
      entry.status = 'uploading'
      if (!retryEntry) this.uploadQueue.push(entry)
      const data = new FormData()
      data.append('file', file)
      Object.entries(association).forEach(([key, value]) => data.append(key, value))
      try {
        await uploadSharedResource(data, percent => {
          if (this.isCurrentContext(version)) entry.percent = Math.max(entry.percent, Math.min(100, percent))
        })
        if (!this.isCurrentContext(version)) return
        entry.percent = 100
        entry.status = 'success'
      } catch (_) {
        if (this.isCurrentContext(version)) entry.status = 'error'
      } finally {
        if (this.isCurrentContext(version) && !this.uploading) {
          const succeeded = this.uploadQueue.filter(item => item.status === 'success').length
          this.uploadQueue = this.uploadQueue.filter(item => item.status === 'error')
          if (succeeded) {
            this.$message.success('课件上传成功')
            this.fetchResources(1)
          }
        }
      }
    },
    handleCommand(command, item) {
      if (!this.canManage(item) || this.isBusy(item)) return
      if (command === 'download') this.downloadResource(item)
      if (command === 'rename') this.openRename(item)
      if (command === 'delete') {
        this.deleteTarget = item
        this.deleteVisible = true
      }
    },
    openRename(item) {
      if (!this.canManage(item) || this.renaming) return
      const name = item.name || ''
      const extension = this.resourceExtension(item)
      const suffix = extension && name.toLowerCase().endsWith('.' + extension) ? name.slice(-(extension.length + 1)) : ''
      this.renameTarget = item
      this.renameSuffix = suffix
      this.renameValue = suffix ? name.slice(0, -suffix.length) : name
      this.renameVisible = true
      this.$nextTick(() => { if (this.$refs.renameInput) this.$refs.renameInput.focus() })
    },
    closeRename() {
      if (this.renaming) return
      this.renameVisible = false
      this.renameTarget = null
      this.renameValue = ''
      this.renameSuffix = ''
    },
    async confirmRename() {
      if (!this.canManage(this.renameTarget) || !this.renameTarget || this.renaming || !this.renameValue.trim()) return
      const version = this.contextVersion
      const data = new FormData()
      data.append('resourceId', this.renameTarget.id)
      data.append('name', this.renameValue.trim() + this.renameSuffix)
      Object.entries(this.association).forEach(([key, value]) => data.append(key, value))
      this.renaming = true
      try {
        await updateSharedResource(data)
        if (!this.isCurrentContext(version)) return
        this.renaming = false
        this.closeRename()
        this.$message.success('课件名修改成功')
        await this.fetchResources(this.pageNum)
      } catch (_) {
        // Keep the entered name and dialog open for retry.
      } finally {
        if (this.isCurrentContext(version)) this.renaming = false
      }
    },
    closeDelete() {
      if (this.deleting) return
      this.deleteVisible = false
      this.deleteTarget = null
    },
    async confirmDelete() {
      if (!this.deleteTarget || !this.canManage(this.deleteTarget) || this.deleting) return
      const version = this.contextVersion
      const params = { ...this.association, resourceId: this.deleteTarget.id }
      const page = this.resources.length === 1 && this.pageNum > 1 ? this.pageNum - 1 : this.pageNum
      this.deleting = true
      try {
        const res = await deleteSharedResource(params)
        if (!this.isCurrentContext(version)) return
        if (res.data !== true) {
          this.$message.error('删除失败，请重试')
          return
        }
        this.deleting = false
        this.closeDelete()
        this.$message.success('课件已删除')
        await this.fetchResources(page)
      } catch (_) {
        // Keep the confirmation open for retry.
      } finally {
        if (this.isCurrentContext(version)) this.deleting = false
      }
    },
    resourceExtension(item) {
      return getFileExtension(item.fileUrl || item.resourceUrl) || getResourceExtension(item)
    },
    resourceFilename(item) {
      const name = item.name || '课件'
      const extension = this.resourceExtension(item)
      return extension && !name.toLowerCase().endsWith('.' + extension) ? name + '.' + extension : name
    },
    typeLabel(type) {
      return { '1': '文档', '2': '视频', '3': '音频', '4': '图片', '5': '文件', '6': '链接' }[type] || '文件'
    },
    formatSize(unit) {
      const bytes = Number(unit)
      if (!Number.isFinite(bytes) || bytes <= 0) return ''
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    getProgressKey(resourceId) {
      const user = this.$store.state.user.userInfo || {}
      const cached = getUserInfo() || {}
      const userId = user.userId || user.id || cached.userId || cached.id || ''
      return `${userId}:${resourceId}`
    },
    async reportResourceProgress(item, percent, version = this.contextVersion, contextKey = this.contextKey) {
      const id = String(item.id || '')
      const type = PROGRESS_TYPES[String(item.type || '')]
      if (!this.isStudent || !this.association || !id || !type || !(item.fileUrl || item.resourceUrl)) return
      const key = this.getProgressKey(id)
      // 同时核对课堂、身份和用户，旧预览的异步结果不能更新切换后的列表。
      const isCurrent = () => this.isCurrentContext(version) && this.contextKey === contextKey &&
        this.isStudent && this.getProgressKey(id) === key
      if (!isCurrent()) return
      let report = this.progressReports.get(key)
      if (!report) {
        report = { saved: progressValue(item.progressPercent), pending: Promise.resolve() }
        this.progressReports.set(key, report)
      }
      const requested = progressValue(percent)
      // 同一学生、同一资源共用串行队列，切换课堂也保留，避免低进度覆盖高进度。
      report.pending = report.pending.then(async () => {
        if (!isCurrent()) return
        const currentItem = this.resources.find(row => String(row.id) === id)
        report.saved = Math.max(report.saved, progressValue(item.progressPercent), progressValue(currentItem && currentItem.progressPercent))
        // 只提交新增进度，已完成或重复查看的课件不重复上报。
        if (requested <= report.saved) return
        try {
          // 独立课件以资源 ID 作为 lessonId，不提交课程、班级或直播关联 ID。
          const res = await updateCourseProgress({ lessonId: id, type, percent: String(requested) })
          // 业务错误由请求拦截器拒绝；成功响应可能仅有 code/message，无需 data 为 true。
          if (res.data === false) {
            if (isCurrent()) this.$message.error('学习进度更新失败，请重试')
            return
          }
          report.saved = requested
          if (!isCurrent()) return
          this.resources = this.resources.map(row => String(row.id) === id ? { ...row, progressPercent: requested } : row)
          await this.fetchResources(this.pageNum)
        } catch (_) {
          // 请求失败由拦截器提示，不标记完成、不阻断预览，下次查看时可重试。
        }
      })
      return report.pending
    },
    async openResource(item) {
      const path = item.fileUrl || item.resourceUrl || ''
      if (!path) {
        this.$message.warning('课件地址不存在')
        return
      }
      const extension = this.resourceExtension(item)
      const type = String(item.type || '')
      const version = this.contextVersion
      const contextKey = this.contextKey
      if (type === '6') {
        if (!/^https?:\/\//i.test(path)) {
          this.$message.warning('链接地址无效')
          return
        }
        try {
          if (window.electronAPI && window.electronAPI.openInAppUrl) {
            const opened = await window.electronAPI.openInAppUrl(path)
            if (!opened) {
              this.$message.warning('链接地址无效')
              return
            }
          } else window.open(path, '_blank', 'noopener,noreferrer')
        } catch (_) {
          this.$message.error('链接打开失败')
          return
        }
        await this.reportResourceProgress(item, 100, version, contextKey)
        return
      }
      this.previewFile = { name: this.resourceFilename(item), path, extension }
      if (type === '2' || ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv'].includes(extension)) this.previewKind = 'video'
      else if (type === '3' || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(extension)) this.previewKind = 'audio'
      else if (type === '4' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) this.previewKind = 'image'
      else this.previewKind = 'document'
      // 非视频进入预览即记为完成；视频保留本次预览上下文，关闭时按播放比例上报。
      this.previewResource = this.previewKind === 'video' ? { item: { ...item }, version, contextKey } : null
      if (this.previewKind !== 'video') await this.reportResourceProgress(item, 100, version, contextKey)
    },
    async closeVideoPreview(percent = 0) {
      const preview = this.previewResource
      this.closePreview()
      if (preview) await this.reportResourceProgress(preview.item, percent, preview.version, preview.contextKey)
    },
    closePreview() {
      this.previewKind = ''
      this.previewFile = null
      this.previewResource = null
    },
    preventReadOnlyContextMenu(event) { if (!this.isTeacher) event.preventDefault() },
    async downloadResource(item) {
      if (!this.canManage(item) || this.downloadingIds.includes(item.id)) return
      const url = item.fileUrl || item.resourceUrl || ''
      if (!url) { this.$message.warning('课件地址不存在'); return }
      const version = this.contextVersion
      this.downloadingIds.push(item.id)
      const filename = this.resourceFilename(item)
      const saveFile = (href, newTab = false) => {
        const link = document.createElement('a')
        link.href = href
        link.download = filename
        if (newTab) {
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
        }
        document.body.appendChild(link)
        link.click()
        link.remove()
      }
      try {
        const response = await fetch(url)
        if (!response.ok) {
          if (this.isCurrentContext(version)) this.$message.error('课件下载失败，请重试')
          return
        }
        const blob = await response.blob()
        if (!this.isCurrentContext(version) || !this.isTeacher) return
        const objectUrl = URL.createObjectURL(blob)
        saveFile(objectUrl)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      } catch (_) {
        // Public storage may allow direct access without exposing the file to cross-origin fetch.
        if (this.isCurrentContext(version) && this.isTeacher) saveFile(url, true)
      } finally {
        if (this.isCurrentContext(version)) this.downloadingIds = this.downloadingIds.filter(id => id !== item.id)
      }
    }
  },
  beforeDestroy() {
    this.disposed = true
    this.contextVersion++
    this.closePreview()
  }
}
</script>

<style lang="scss" scoped>
.courseware-toolbar { display: flex; justify-content: flex-end; margin: -4px 0 12px; }
.courseware-upload { display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 5px 13px; color: #fff; background: linear-gradient(100deg, #2469ff, #00b8ed); border: 0; border-radius: 16px; font-size: 12px; cursor: pointer; }
.courseware-upload:disabled { opacity: .5; cursor: not-allowed; }
.courseware-list { display: flex; flex-direction: column; gap: 8px; }
.courseware-card { display: flex; align-items: center; gap: 12px; min-height: 66px; padding: 10px 12px; border: 1px solid #e6edff; border-radius: 9px; cursor: pointer; box-sizing: border-box; transition: border-color .15s, background .15s; }
.courseware-card:hover, .courseware-card:focus-visible { border-color: #a9c8ff; background: #f8fbff; outline: none; }
.courseware-icon { width: 34px; height: 38px; flex-shrink: 0; object-fit: contain; }
.courseware-info { flex: 1; min-width: 0; }
.courseware-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #173154; font-size: 13px; font-weight: 500; line-height: 21px; }
.courseware-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; color: #8698b4; font-size: 11px; }
.courseware-type { padding: 1px 6px; background: #eef1ff; border-radius: 7px; color: #596aff; font-size: 10px; }
.courseware-actions, .courseware-progress { flex-shrink: 0; display: flex; align-items: center; }
.courseware-more { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: #f1f6ff; color: #6383b5; cursor: pointer; font-size: 14px; }
.courseware-more:hover, .courseware-more:focus-visible { background: #e1ecff; outline: 2px solid #a9c8ff; }
.courseware-more:disabled { opacity: .5; cursor: wait; }
.courseware-progress ::v-deep .el-progress__text { font-size: 10px !important; }
.courseware-progress ::v-deep .el-progress.is-success .el-progress__text { font-size: 18px !important; color: #67c23a !important; }
.courseware-placeholder { min-height: 120px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; color: #90a1b9; font-size: 13px; }
.courseware-text-button { border: 0; padding: 6px; background: transparent; color: #3b6fff; font-size: 12px; cursor: pointer; }
.courseware-pagination { margin-top: 18px; text-align: center; }
.courseware-uploads { margin-bottom: 12px; padding: 10px 12px; background: #f7faff; border-radius: 8px; }
.courseware-upload-entry + .courseware-upload-entry { margin-top: 12px; }
.courseware-upload-info { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 12px; color: #64748b; }
.courseware-upload-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.courseware-preview-image { display: block; width: 100%; max-height: 65vh; object-fit: contain; }
.courseware-preview-audio { width: 100%; display: block; margin: 16px 0; }
</style>

<style lang="scss">
.courseware-menu .el-dropdown-menu__item.courseware-menu-delete:not(.is-disabled) {
  color: #f15b62;

  &:hover,
  &:focus,
  &:active {
    color: #f15b62;
    background-color: #fef0f0;
  }
}
</style>
