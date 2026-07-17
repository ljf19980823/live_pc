<template>
  <div class="resources-page" @click="closeAllMenus">
    <div class="resources-page_top">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">资料中心</h2>
        <p class="page-subtitle">集中管理个人资料与教研组共建素材。</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <span class="tab" :class="{ active: activeTab === 'my' }" @click="switchTab('my')">我的资料</span>
        <span class="tab" :class="{ active: activeTab === 'group' }" @click="switchTab('group')">教研组资料</span>
      </div>
    </div>

    <!-- ========== 我的资料 ========== -->
    <div v-if="activeTab === 'my'" class="my-resources">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn-outline" @click.stop="showNewFolderDialog = true">
            <img src="@/assets/images/material/add.png" alt="" class="btn-icon" />
            新建文件夹
          </button>
          <el-upload
            :action="''"
            :http-request="handleMyUpload"
            :show-file-list="false"
            :multiple="true"
            :disabled="myUploadLoading"
          >
            <button class="btn-outline btn-upload" type="button" :disabled="myUploadLoading" :class="{ 'btn-uploading': myUploadLoading }">
              <span v-if="myUploadLoading" class="upload-spin"></span>
              <template v-else>
                <img src="@/assets/images/material/upload.png" alt="" class="btn-icon upload-icon-default" />
                <img src="@/assets/images/material/upload_yes.png" alt="" class="btn-icon upload-icon-hover" />
              </template>
              {{ myUploadLoading ? '上传中...' : '上传资料' }}
            </button>
          </el-upload>
        </div>
        <div class="toolbar-right">
          <button class="btn-refresh" @click.stop="fetchMyFiles" :class="{ 'btn-refresh-loading': myLoading }">
            <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12C4 7.58172 7.58172 4 12 4C14.6528 4 17.0045 5.22108 18.5434 7.16132" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M20 12C20 16.4183 16.4183 20 12 20C9.34719 20 6.99549 18.7789 5.45663 16.8387" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M16 7L18.5 7.16132L18.6613 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 17L5.45663 16.8387L5.29535 19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            刷新
          </button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-loading="myLoading">
        <div class="file-list-header">
          <div class="col-name breadcrumb-nav">
            <template v-for="(crumb, idx) in myBreadcrumbs">
              <span
                :key="'mc-' + idx"
                class="crumb-item"
                :class="{ 'crumb-last': idx === myBreadcrumbs.length - 1 }"
                @click.stop="goToMyBreadcrumb(idx)"
              >{{ crumb.name }}</span>
              <span v-if="idx < myBreadcrumbs.length - 1" :key="'ms-' + idx" class="crumb-sep">/</span>
            </template>
          </div>
          <span class="col-operator">上传人</span>
          <span class="col-size">大小</span>
          <span class="col-date">日期</span>
          <span class="col-action">操作</span>
        </div>
        <div class="file-list-body">
          <div v-if="!myLoading && filteredMyFileList.length === 0" class="file-empty">
            暂无资料
          </div>
          <div
            class="file-item"
            v-for="item in filteredMyFileList"
            :key="item.id"
            :class="{ 'file-item-folder': item.fileType === '1' }"
            @click="handleMyItemClick(item)"
          >
            <div class="col-name">
              <div class="file-icon-wrap">
                <img :src="getFileIcon(item.fileType)" alt="" class="type-icon" />
              </div>
              <span class="file-name">{{ item.name }}</span>
              <span v-if="item.fileType === '1' && item.childCount > 0" class="child-count">{{ item.childCount }} 个</span>
            </div>
            <div class="col-operator">{{ item.operator || '—' }}</div>
            <div class="col-size">{{ item.size || '—' }}</div>
            <div class="col-date">{{ item.dateDesc || item.createTime || '—'}}</div>
            <div class="col-action" @click.stop>
              <button
                class="btn-delete"
                :class="{ 'btn-delete-active': item.deleteActive }"
                @mouseenter="item.deleteActive = true"
                @mouseleave="item.deleteActive = false"
                @click="openDeleteDialog(item)"
              >
                <img src="@/assets/images/material/delete_icon.png" alt="" class="action-icon" />
                删除
              </button>
              <div class="more-wrap">
                <button class="btn-more" @click.stop="toggleMore(item)">
                  <img src="@/assets/images/material/options_icon.png" alt="" class="options-icon" />
                </button>
                <div class="more-menu" v-if="item.showMore" @click.stop>
                  <div class="more-menu-item" @click="openRenameDialog(item)">重命名</div>
                  <div v-if="item.fileType !== '1'" class="more-menu-item" @click="handleDownloadFile(item)">下载</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 教研组资料 ========== -->
    <div v-if="activeTab === 'group'" class="group-resources">
      <!-- 顶部统计栏 -->
      <div class="group-stats-bar">
        <div class="group-stats-left">
          <div class="stats-badge">
            <img src="@/assets/images/material/jyz.png" alt="" class="badge-icon" />
            {{ groupList.length }} 个教研组
          </div>
          <div class="stats-badge" v-if="latestGroupUpdate">最近更新：{{ latestGroupUpdate }}</div>
        </div>
        <div class="group-stats-right">选择教研组后可新建、上传与管理资料</div>
      </div>

      <!-- 教研组卡片区（未选择教研组） -->
      <div v-if="!selectedGroup" class="group-card-section">
        <div class="group-card-section_box" v-loading="groupLoading">
          <div class="group-card-header">
            <div class="group-card-title-wrap">
              <div class="group-card-title">选择教研组</div>
              <div class="group-card-hint">点击教研组后查看组内资料。</div>
            </div>
            <div class="btn-build-library">共建资料库</div>
          </div>
          <div class="group-card-list">
            <div
              class="group-card"
              v-for="(group, gIdx) in groupList"
              :key="group.id"
              :class="`group-card-${getGroupColor(gIdx)}`"
              @click="selectGroup(group)"
            >
              <div class="group-card-top">
                <div class="group-avatar">
                  <img src="@/assets/images/material/jyz_icon.png" alt="" class="group-avatar-icon" />
                </div>
                <div class="group-card-arrow">
                  <img src="@/assets/images/material/right_icon.png" alt="" class="arrow-icon" />
                </div>
              </div>
              <div class="group-name">{{ group.groupName }}</div>
              <div class="group-info">{{ group.fileCount }} 个资料 · <span v-if="group.lastFileUpdateTime">更新于 {{ group.lastFileUpdateTime }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 教研组文件浏览器（已选择教研组） -->
      <div v-else class="group-file-section">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <button class="btn-outline btn-back" @click.stop="backToGroups">
              ← 返回教研组
            </button>
            <button class="btn-outline" @click.stop="showNewFolderDialog = true" v-if="selectedGroupInfo.myRole=='1'">
              <img src="@/assets/images/material/add.png" alt="" class="btn-icon" />
              新建文件夹
            </button>
            <el-upload
            v-if="selectedGroupInfo.myRole=='1'"
              :action="''"
              :http-request="handleGroupUpload"
              :show-file-list="false"
              :multiple="true"
              :disabled="groupUploadLoading"
            >
              <button class="btn-outline btn-upload" type="button" :disabled="groupUploadLoading" :class="{ 'btn-uploading': groupUploadLoading }">
                <span v-if="groupUploadLoading" class="upload-spin"></span>
                <template v-else>
                  <img src="@/assets/images/material/upload.png" alt="" class="btn-icon upload-icon-default" />
                  <img src="@/assets/images/material/upload_yes.png" alt="" class="btn-icon upload-icon-hover" />
                </template>
                {{ groupUploadLoading ? '上传中...' : '上传资料' }}
              </button>
            </el-upload>
          </div>
          <div class="toolbar-right">
            <button class="btn-refresh" @click.stop="fetchGroupFiles" :class="{ 'btn-refresh-loading': groupFileLoading }">
              <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12C4 7.58172 7.58172 4 12 4C14.6528 4 17.0045 5.22108 18.5434 7.16132" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M20 12C20 16.4183 16.4183 20 12 20C9.34719 20 6.99549 18.7789 5.45663 16.8387" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M16 7L18.5 7.16132L18.6613 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 17L5.45663 16.8387L5.29535 19.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              刷新
            </button>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="file-list file-list2" v-loading="groupFileLoading">
          <div class="file-list-header">
            <div class="col-name breadcrumb-nav">
              <template v-for="(crumb, idx) in groupFileBreadcrumbs">
                <span
                  :key="'gc-' + idx"
                  class="crumb-item"
                  :class="{ 'crumb-last': idx === groupFileBreadcrumbs.length - 1 }"
                  @click.stop="goToGroupBreadcrumb(idx)"
                >{{ crumb.name }}</span>
                <span v-if="idx < groupFileBreadcrumbs.length - 1" :key="'gs-' + idx" class="crumb-sep">/</span>
              </template>
            </div>
            <span class="col-operator">上传人</span>
            <span class="col-size">大小</span>
            <span class="col-date">日期</span>
            <span class="col-action">操作</span>
          </div>
          <div class="file-list-body">
            <div v-if="!groupFileLoading && filteredGroupFileList.length === 0" class="file-empty">
              暂无资料
            </div>
            <div
              class="file-item"
              v-for="item in filteredGroupFileList"
              :key="item.id"
              :class="{ 'file-item-folder': item.fileType === '1' }"
              @click="handleGroupItemClick(item)"
            >
              <div class="col-name">
                <div class="file-icon-wrap">
                  <img :src="getFileIcon(item.fileType)" alt="" class="type-icon" />
                </div>
                <span class="file-name">{{ item.name }}</span>
                <span v-if="item.fileType === '1' && item.childCount > 0" class="child-count">{{ item.childCount }} 个</span>
              </div>
              <div class="col-operator">{{ item.operator || '—' }}</div>
              <div class="col-size">{{ item.size || '—' }}</div>
              <div class="col-date">{{ item.dateDesc || item.createTime || '—'}}</div>
              <div class="col-action" @click.stop>
                <button
                  v-if="item.myRole == 1 || currentUserId == item.userId"
                  class="btn-delete"
                  :class="{ 'btn-delete-active': item.deleteActive }"
                  @mouseenter="item.deleteActive = true"
                  @mouseleave="item.deleteActive = false"
                  @click="openDeleteDialog(item)"
                >
                  <img src="@/assets/images/material/delete_icon.png" alt="" class="action-icon" />
                  删除
                </button>
                <div class="more-wrap">
                  <button class="btn-more" @click.stop="toggleMore(item)">
                    <img src="@/assets/images/material/options_icon.png" alt="" class="options-icon" />
                  </button>
                  <div class="more-menu" v-if="item.showMore" @click.stop>
                    <div class="more-menu-item" @click="openRenameDialog(item)">重命名</div>
                    <div v-if="item.fileType !== '1'" class="more-menu-item" @click="handleDownloadFile(item)">下载</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 新建文件夹弹窗 ========== -->
    <DialogCustome
      :visible="showNewFolderDialog"
      title="新建文件夹"
      width="500px"
      height="220px"
      :showClose="true"
      cancelText="取消"
      :confirmText="folderLoading ? '创建中...' : '确认'"
      :confirmDisabled="!newFolderName.trim() || folderLoading"
      @cancel="closeNewFolderDialog"
      @confirm="confirmNewFolder"
      @close="closeNewFolderDialog"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con2">
          <el-input
            style="width:100%"
            placeholder="请输入文件夹名称"
            v-model="newFolderName"
            ref="newFolderInput"
          />
        </div>
      </div>
    </DialogCustome>

    <!-- ========== 重命名弹窗 ========== -->
    <DialogCustome
      :visible="showRenameDialog"
      title="重命名文件夹"
      width="500px"
      height="220px"
      :showClose="true"
      cancelText="取消"
      :confirmText="renameLoading ? '保存中...' : '确认'"
      :confirmDisabled="!renameValue.trim() || renameLoading"
      @cancel="closeRenameDialog"
      @confirm="confirmRename"
      @close="closeRenameDialog"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con2">
          <el-input
            style="width:100%"
            v-model="renameValue"
            ref="renameInput"
          />
        </div>
      </div>
    </DialogCustome>

    <!-- ========== 删除确认弹窗 ========== -->
    <div class="delete-mask" v-if="showDeleteDialog" @click.self="closeDeleteDialog">
      <div class="delete-dialog">
        <div class="delete-dialog-header">
          <span class="delete-dialog-title">删除文件</span>
          <div class="delete-dialog-close" @click="closeDeleteDialog">✕</div>
        </div>
        <div class="delete-dialog-body">
          <p>确定要删除该文件吗？此操作无法撤销。</p>
        </div>
        <div class="delete-dialog-footer">
          <button class="delete-btn-cancel" :disabled="deleteLoading" @click="closeDeleteDialog">取消</button>
          <button class="delete-btn-confirm" :disabled="deleteLoading" :class="{ 'btn-deleting': deleteLoading }" @click="confirmDelete">
            {{ deleteLoading ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========== 视频播放弹窗 ========== -->
    <VideoPlayer
      :visible="showVideoDialog"
      :source="currentVideoUrl"
      :title="currentVideoTitle"
      @close="showVideoDialog = false; currentVideoUrl = ''"
    />

    <!-- ========== 图片预览弹窗 ========== -->
    <el-dialog
      :title="currentImageTitle"
      :visible.sync="showImageDialog"
      width="800px"
      :append-to-body="true"
      @close="showImageDialog = false; currentImageUrl = ''"
    >
      <img
        v-if="showImageDialog"
        :src="currentImageUrl"
        style="width:100%;max-height:600px;object-fit:contain;display:block;"
        alt=""
      />
    </el-dialog>

    <!-- ========== 文档预览弹窗（ONLYOFFICE）========== -->
    <FilePreview
      :visible="filePreviewVisible"
      :file="filePreviewData"
      @close="filePreviewVisible = false"
    />

  </div>
</template>

<script>
import DialogCustome from '@/components/DialogCustome/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import FilePreview from '@/components/FilePreview/index.vue'
import { getBusinessFileList, uploadBusinessFile, renameBusinessFile, deleteBusinessFile, getTeachingGroupList } from '@/api/modules/teacher'
import { getUserInfo } from '@/utils/auth'
export default {
  name: 'Resources',
  components: { DialogCustome, VideoPlayer, FilePreview },
  data() {
    return {
      activeTab: 'my',
      searchKeyword: '',

      // 我的资料
      myFileList: [],
      myLoading: false,
      myParentId: null,
      myBreadcrumbs: [{ id: null, name: '全部资料' }],

      // 教研组列表
      groupList: [],
      groupLoading: false,
      selectedGroup: null,
      selectedGroupInfo: null,

      // 教研组文件
      groupFileList: [],
      groupFileLoading: false,
      groupFileParentId: null,
      groupFileBreadcrumbs: [{ id: null, name: '全部资料' }],

      // 弹窗
      showNewFolderDialog: false,
      newFolderName: '',

      showRenameDialog: false,
      renameTarget: null,
      renameValue: '',

      showDeleteDialog: false,
      deleteTarget: null,

      folderLoading: false,
      renameLoading: false,
      deleteLoading: false,
      myUploadPendingCount: 0,
      groupUploadPendingCount: 0,
      latestGroupUpdate: '',

      // 文件预览
      showVideoDialog: false,
      currentVideoUrl: '',
      currentVideoTitle: '',
      showImageDialog: false,
      currentImageUrl: '',
      currentImageTitle: '',
      filePreviewVisible: false,
      filePreviewData: null,
    }
  },
  computed: {
    filteredMyFileList() {
      if (!this.searchKeyword.trim()) return this.myFileList
      return this.myFileList.filter(f => f.name && f.name.includes(this.searchKeyword.trim()))
    },
    filteredGroupFileList() {
      if (!this.searchKeyword.trim()) return this.groupFileList
      return this.groupFileList.filter(f => f.name && f.name.includes(this.searchKeyword.trim()))
    },
    myUploadLoading() {
      return this.myUploadPendingCount > 0
    },
    groupUploadLoading() {
      return this.groupUploadPendingCount > 0
    }

  },
  created() {
     
      const userInfo = getUserInfo() || {}
     
      this.currentUserId = userInfo.userId
       console.log( this.currentUserId,'用户id')
    this.fetchMyFiles()
    this.fetchGroupList()
  },
  methods: {
    switchTab(tab) {
      if (this.activeTab === tab) return
      this.activeTab = tab
      this.searchKeyword = ''
      if (tab === 'my') {
        this.fetchMyFiles()
      } else if (tab === 'group') {
        this.fetchGroupList()
      }
    },

    // ─── 我的资料 ────────────────────────────────────────────────
    fetchMyFiles() {
      this.myLoading = true
      const params = { type: '1' }
      if (this.myParentId) params.parentId = this.myParentId
      getBusinessFileList(params)
        .then(res => {
          this.myFileList = (res.data || []).map(f => ({
            ...f,
            showMore: false,
            deleteActive: false,
          }))
        })
        .finally(() => { this.myLoading = false })
    },
    handleMyItemClick(item) {
      if (item.fileType === '1') {
        this.myBreadcrumbs.push({ id: item.id, name: item.name })
        this.myParentId = item.id
        this.fetchMyFiles()
      } else {
        this.openFile(item)
      }
    },
    goToMyBreadcrumb(idx) {
      if (idx === this.myBreadcrumbs.length - 1) return
      this.myBreadcrumbs = this.myBreadcrumbs.slice(0, idx + 1)
      this.myParentId = this.myBreadcrumbs[idx].id
      this.fetchMyFiles()
    },

    // ─── 教研组列表 ──────────────────────────────────────────────
    fetchGroupList() {
      this.groupLoading = true
      getTeachingGroupList()
        .then(res => {
          this.latestGroupUpdate = res.data &&res.data.latestUpdateTime? res.data.latestUpdateTime:''
          this.groupList = res.data && res.data.list?res.data.list : []
        })
        .finally(() => { this.groupLoading = false })
    },
    getGroupColor(idx) {
      return ['blue', 'orange', 'green'][idx % 3]
    },
    selectGroup(group) {
      this.selectedGroup = group.groupId
      this.selectedGroupInfo = group
      this.groupFileParentId = null
      this.groupFileBreadcrumbs = [{ id: null, name: '全部资料' }]
      this.searchKeyword = ''
      this.fetchGroupFiles()
    },
    backToGroups() {
      this.selectedGroup = null
      this.selectedGroupInfo = null
      this.groupFileList = []
      this.groupFileParentId = null
      this.groupFileBreadcrumbs = [{ id: null, name: '全部资料' }]
      this.searchKeyword = ''
      this.fetchGroupList()
    },

    // ─── 教研组文件 ──────────────────────────────────────────────
    fetchGroupFiles() {
      if (!this.selectedGroup) return
      this.groupFileLoading = true
      const params = { type: '2', userGroupId: this.selectedGroup }
      if (this.groupFileParentId) params.parentId = this.groupFileParentId
      getBusinessFileList(params)
        .then(res => {
          this.groupFileList = (res.data || []).map(f => ({
            ...f,
            showMore: false,
            deleteActive: false,
          }))
        })
        .finally(() => { this.groupFileLoading = false })
    },
    handleGroupItemClick(item) {
      if (item.fileType === '1') {
        this.groupFileBreadcrumbs.push({ id: item.id, name: item.name })
        this.groupFileParentId = item.id
        this.fetchGroupFiles()
      } else {
        this.openFile(item)
      }
    },
    goToGroupBreadcrumb(idx) {
      if (idx === this.groupFileBreadcrumbs.length - 1) return
      this.groupFileBreadcrumbs = this.groupFileBreadcrumbs.slice(0, idx + 1)
      this.groupFileParentId = this.groupFileBreadcrumbs[idx].id
      this.fetchGroupFiles()
    },

    // ─── 文件打开/预览 ───────────────────────────────────────────
    openFile(item) {
      const url = item.url || item.fileUrl || item.path || ''
      const { fileType, name } = item
      // 图片
      if (fileType === '2') {
        this.currentImageTitle = name || '图片预览'
        this.currentImageUrl = url
        this.showImageDialog = true
        return
      }
      // 视频
      if (fileType === '4') {
        this.currentVideoTitle = name || '视频播放'
        this.currentVideoUrl = url
        this.showVideoDialog = true
        return
      }
      // 文档类（doc/ppt/pdf）→ ONLYOFFICE 预览
      if (['3', '5', '6'].includes(fileType)) {
        this.filePreviewData = { name: name || '', path: url }
        this.filePreviewVisible = true
        return
      }
      // 其他类型 → 下载
      if (url) {
        window.location.href = url
      }
    },

    // ─── 菜单控制 ────────────────────────────────────────────────
    closeAllMenus() {
      this.myFileList.forEach(f => { f.showMore = false })
      this.groupFileList.forEach(f => { f.showMore = false })
    },
    toggleMore(item) {
      const current = item.showMore
      this.closeAllMenus()
      item.showMore = !current
    },

    // ─── 新建文件夹 ──────────────────────────────────────────────
    closeNewFolderDialog() {
      this.showNewFolderDialog = false
      this.newFolderName = ''
    },
    confirmNewFolder() {
      if (!this.newFolderName.trim() || this.folderLoading) return
      const isGroup = this.activeTab === 'group'
      const formData = new FormData()
      formData.append('type', isGroup ? '2' : '1')
      formData.append('fileType', '1')
      const parentId = isGroup ? this.groupFileParentId : this.myParentId
      const level = isGroup ? this.groupFileBreadcrumbs.length : this.myBreadcrumbs.length
      if (parentId) formData.append('parentId', parentId)
      formData.append('level', String(level))
      formData.append('folderName', this.newFolderName.trim())
      if (isGroup && this.selectedGroup) formData.append('userGroupId', String(this.selectedGroup))

      this.folderLoading = true
      uploadBusinessFile(formData)
        .then(() => {
          this.$message.success('文件夹创建成功')
          this.closeNewFolderDialog()
          if (isGroup) {
            this.fetchGroupList()
            this.fetchGroupFiles()
          } else {
            this.fetchMyFiles()
          }
        })
        .finally(() => { this.folderLoading = false })
    },

    // ─── 重命名 ──────────────────────────────────────────────────
    openRenameDialog(item) {
      this.renameTarget = item
      this.renameValue = item.name
      this.showRenameDialog = true
      item.showMore = false
      this.$nextTick(() => {
        this.$refs.renameInput && this.$refs.renameInput.focus()
      })
    },
    closeRenameDialog() {
      this.showRenameDialog = false
      this.renameTarget = null
      this.renameValue = ''
    },
    confirmRename() {
      if (!this.renameValue.trim() || !this.renameTarget || this.renameLoading) return
      this.renameLoading = true
      renameBusinessFile(this.renameTarget.id, this.renameValue.trim())
        .then(() => {
          this.$message.success('重命名成功')
          this.renameTarget.name = this.renameValue.trim()
          this.closeRenameDialog()
        })
        .finally(() => { this.renameLoading = false })
    },

    // ─── 删除 ────────────────────────────────────────────────────
    openDeleteDialog(item) {
      this.deleteTarget = item
      this.showDeleteDialog = true
    },
    closeDeleteDialog() {
      this.showDeleteDialog = false
      this.deleteTarget = null
    },
    confirmDelete() {
      if (!this.deleteTarget || this.deleteLoading) return
      this.deleteLoading = true
      deleteBusinessFile(this.deleteTarget.id)
        .then(() => {
          this.$message.success('删除成功')
          const id = this.deleteTarget.id
          this.myFileList = this.myFileList.filter(f => f.id !== id)
          this.groupFileList = this.groupFileList.filter(f => f.id !== id)
          this.closeDeleteDialog()
        })
        .finally(() => { this.deleteLoading = false })
    },

    // ─── 上传资料 ────────────────────────────────────────────────
    handleMyUpload({ file }) {
      this.doUpload(file, '1', this.myParentId, this.myBreadcrumbs.length)
    },
    handleGroupUpload({ file }) {
      this.doUpload(file, '2', this.groupFileParentId, this.groupFileBreadcrumbs.length, this.selectedGroup)
    },
    doUpload(file, type, parentId, level, userGroupId) {
      const formData = new FormData()
      formData.append('type', type)
      formData.append('fileType', this.getFileTypeFromFile(file))
      formData.append('files', file)
      if (parentId) formData.append('parentId', parentId)
      formData.append('level', String(level))
      if (userGroupId) formData.append('userGroupId', String(userGroupId))

      const isGroupUpload = type === '2'
      if (isGroupUpload) {
        this.groupUploadPendingCount++
      } else {
        this.myUploadPendingCount++
      }
      uploadBusinessFile(formData)
        .then(() => {
          this.decreaseUploadPendingCount(isGroupUpload)
          const isUploadDone = isGroupUpload ? this.groupUploadPendingCount === 0 : this.myUploadPendingCount === 0
          if (isUploadDone) {
            this.$message.success('上传成功')
            if (type === '2') {
              this.fetchGroupList()
              this.fetchGroupFiles()
            } else {
              this.fetchMyFiles()
            }
          }
        }).catch(() => {
          this.decreaseUploadPendingCount(isGroupUpload)
        })
        .finally(() => {
        
        })
    },
    decreaseUploadPendingCount(isGroupUpload) {
      if (isGroupUpload) {
        this.groupUploadPendingCount = Math.max(this.groupUploadPendingCount - 1, 0)
      } else {
        this.myUploadPendingCount = Math.max(this.myUploadPendingCount - 1, 0)
      }
    },

    // ─── 工具方法 ────────────────────────────────────────────────
    getFileIcon(fileType) {
      if (fileType === '1') return require('@/assets/images/material/fold_icon.png')
      return require('@/assets/images/material/file_icon.png')
    },
    getFileTypeFromFile(file) {
      const ext = (file.name || '').split('.').pop().toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return '2'
      if (['doc', 'docx'].includes(ext)) return '3'
      if (['mp4', 'avi', 'mov', 'mkv', 'flv', 'm4a'].includes(ext)) return '4'
      if (['ppt', 'pptx'].includes(ext)) return '5'
      if (ext === 'pdf') return '6'
      return '7'
    },
    formatDate(dateStr) {
      if (!dateStr) return '—'
      return String(dateStr).slice(0, 19)
    },

    // ─── 下载文件 ────────────────────────────────────────────────
    async handleDownloadFile(item) {
      const url = item.url || item.fileUrl || item.path || ''
      if (!url) return
      item.showMore = false
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = item.name || '文件'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url
        a.download = item.name || '文件'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.resources-page {
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.resources-page_top {
  width: 100%;
  padding: 18px 40px 0 40px;
  background: #ffffff;
  box-sizing: border-box;
}

// 页面头部
.page-header {
  margin-bottom: 22px;
  .page-title {
    font-size: 20px;
    font-weight: bold;
    color: #202532;
    margin: 0 0 4px;
  }
  .page-subtitle {
    font-size: 13px;
    color: #8A93A3;
    margin: 4px 0 0;
  }
}

// Tabs
.tabs {
  display: flex;
  gap: 32px;
  margin-bottom: 10px;
  .tab {
    font-size: 16px;
    color: #667085;
    cursor: pointer;
    position: relative;
    &.active {
      color: #0049FF;
      font-weight: bold;
    }
  }
}

// 工具栏
.toolbar {
  display: flex;
  align-items: center;
  padding: 18px 40px;
  box-sizing: border-box;
  border-top: 1px solid #E9EDF4;
  background: rgba(255, 255, 255, 0.82);
  gap: 12px;
  .toolbar-left {
    display: flex;
    gap: 12px;
    flex: 1;
    align-items: center;
  }
  .toolbar-right {
    flex: 0 0 auto;
  }
}

.btn-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
}

.btn-back {
  color: #0049FF;
  border-color: #D0DCFF;
  background: #F0F5FF;
  &:hover { background: #e0ecff; }
}

// 上传按钮 hover 变蓝
.btn-upload {
  .upload-icon-hover { display: none; }
  .upload-icon-default { display: block; }
  &:hover {
    background: #F0F7FF;
    border-color: #0049FF;
    color: #0049FF;
    .upload-icon-default { display: none; }
    .upload-icon-hover { display: block; }
  }
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid #DFE5EE;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  color: #667085;
  cursor: pointer;
  transition: all 0.2s;
  .refresh-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    transition: transform 0.4s ease;
  }
  &:hover {
    background: #F0F5FF;
    border-color: #0049FF;
    color: #0049FF;
  }
  &.btn-refresh-loading .refresh-icon {
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 上传按钮 loading 状态
.btn-uploading {
  opacity: 0.7;
  cursor: not-allowed !important;
  pointer-events: none;
}

.upload-spin {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #ccc;
  border-top-color: #0049FF;
  border-radius: 50%;
  flex-shrink: 0;
  animation: spin 0.7s linear infinite;
}

// 文件列表
.file-list {
  flex: 1;
  height: 0;
  width: 100%;
  overflow: auto;
  background: #F3F4F8;
  border-radius: 10px;
  padding: 0 25px 25px 25px;
  box-sizing: border-box;
}
.file-list2{
 padding: 0 25px 25px 25px!important;
  box-sizing: border-box;
    margin-top: 25px;
}

.file-list-header {
  display: flex;
  align-items: center;
  padding: 14px 22px;
  background: #FBFCFF;
  border-bottom: 1px solid #EDF0F5;
  font-size: 13px;
  color: #8A93A3;
  .col-name { flex: 1;width: 0; }
  .col-operator { width: 120px; text-align: center; }
  .col-size { width: 140px; text-align: center; }
  .col-date { width: 150px; text-align: center; }
  .col-action { width: 140px; text-align: center; }
}

// 面包屑导航
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  .crumb-item {
    color: #0049FF;
    cursor: pointer;
    font-size: 13px;
    &:hover { text-decoration: underline; }
    &.crumb-last {
      color: #8A93A3;
      cursor: default;
      &:hover { text-decoration: none; }
    }
  }
  .crumb-sep {
    color: #C4C9D4;
    font-size: 13px;
  }
}

.file-empty {
  padding: 60px 0;
  text-align: center;
  font-size: 14px;
  color: #B0B8C8;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 15px 22px;
  background: #ffffff;
  border-bottom: 1px solid #EDF0F5;
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafcff; }
  &.file-item-folder { cursor: pointer; }

  .col-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    .file-icon-wrap {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
    }
    .type-icon {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .file-name {
      font-size: 14px;
      color: #2D3340;
      flex: 1;
      width: 0;
      word-break: break-all;
    }
    .child-count {
      font-size: 12px;
      color: #B0B8C8;
      background: #F3F4F8;
      padding: 2px 8px;
      border-radius: 10px;
      flex-shrink: 0;
    }
  }
  .col-operator {
    width: 120px;
    text-align: center;
    font-size: 14px;
    color: #5F6878;
  }
  .col-size {
    width: 140px;
    text-align: center;
    font-size: 14px;
    color: #5F6878;
  }
  .col-date {
    width: 150px;
    text-align: center;
    font-size: 14px;
    color: #8A93A3;
  }
  .col-action {
    width: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
  }
}

.action-icon {
  width: 13px;
  height: 13px;
  object-fit: contain;
  flex-shrink: 0;
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #E3E8F0;
  border-radius: 10px;
  background: #fff;
  font-size: 13px;
  color: #687385;
  cursor: pointer;
  transition: all 0.15s;
  &:hover, &.btn-delete-active {
    border-color: #FFE2E2;
    color: #FB2C36;
    background: #FEF2F2;
    .action-icon {
      filter: brightness(0) saturate(100%) invert(27%) sepia(89%) saturate(1643%) hue-rotate(336deg) brightness(99%) contrast(96%);
    }
  }
}

.more-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #E3E8F0;
  border-radius: 10px;
  background: #FFFFFF;
}

.btn-more {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  .options-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
}

.more-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 100;
  min-width: 90px;
  overflow: hidden;
  .more-menu-item {
    padding: 10px 16px;
    font-size: 13px;
    color: #333;
    cursor: pointer;
    &:hover { background: #f5f7ff; color: #0049FF; }
  }
}

// ========== 教研组 ==========
.group-resources {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;

  .group-stats-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 40px;
    box-sizing: border-box;
    border-top: 1px solid #E9EDF4;
    background: rgba(255, 255, 255, 0.82);
    flex-shrink: 0;
    .group-stats-left {
      display: flex;
      gap: 12px;
    }
    .stats-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      border: 1px solid #DFE5EE;
      border-radius: 12px;
      font-size: 14px;
      color: #4A5568;
      background: #fff;
      .badge-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
      }
    }
    .group-stats-right {
      font-size: 13px;
      color: #8A93A3;
    }
  }
}

.group-card-section {
  flex: 1;
  height: 0;
  width: 100%;
  background: #F3F4F8;
  padding: 25px 25px 25px 25px;
  box-sizing: border-box;
}
.group-card-section_box {
  height: 100%;
  overflow: auto;
  background: #ffff;
  border-radius: 10px;
  padding: 25px;
  box-sizing: border-box;
}

.group-card-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  .group-card-title-wrap {
    flex: 1;
    .group-card-title {
      font-size: 18px;
      font-weight: bold;
      color: #202532;
      margin-bottom: 4px;
    }
    .group-card-hint {
      font-size: 13px;
      color: #8A93A3;
    }
  }
  .btn-build-library {
    padding: 6px 14px;
    border-radius: 6px;
    background: #fff;
    color: #4080FF;
    font-size: 13px;
    flex-shrink: 0;
  }
}

.group-card-list {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.group-card {
  width: 33%;
  border-radius: 18px;
  padding: 21px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid transparent;
  &:hover { transform: translateY(-1px); border-color: #4080FF !important; }

  &.group-card-blue {
    background: linear-gradient(45deg, #E9F0FF 0%, #EBF2FF 14.29%, #EDF3FF 28.57%, #EFF5FF 42.86%, #F2F6FF 57.14%, #F4F8FF 71.43%, #F6F9FF 85.71%, #F8FBFF 100%);
    border-color: #E5EAF2;
  }
  &.group-card-orange {
    background: linear-gradient(45deg, #FFF4E4 0%, #FFF5E7 20%, #FFF6EA 40%, #FFF8EC 60%, #FFF9EF 80%, #FFFAF2 100%);
    border-color: #E5EAF2;
  }
  &.group-card-green {
    background: linear-gradient(45deg, #EAFBF4 0%, #ECFCF5 16.67%, #EFFCF6 33.33%, #F1FDF7 50%, #F3FEF9 66.67%, #F6FEFA 83.33%, #F8FFFB 100%);
    border-color: #E5EAF2;
  }

  .group-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .group-avatar {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    .group-avatar-icon {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }
  }
  .group-card-arrow {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    .arrow-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
  }
  .group-name {
    font-size: 16px;
    font-weight: bold;
    color: #202532;
    margin-bottom: 8px;
  }
  .group-info {
    font-size: 13px;
    color: #7B8495;
  }
}

// 教研组文件浏览区
.group-file-section {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
}

// 我的资料
.my-resources {
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

// 弹窗内容
.dialog_box2 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dialog_box_con2 {
  width: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px 17px 20px 29px;
}
.dialog_box_con2 :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
  height: 100%;
}
.dialog_box_con2 :deep(.el-input__inner) {
  color: #333333;
  font-size: 16px;
  padding: 0 !important;
}
.dialog_box_con2 :deep(.el-input__suffix) {
  color: #999999;
}
.dialog_box_con2 ::v-deep .el-input__inner::placeholder {
  color: #999999 !important;
  font-size: 16px !important;
}

// 自定义删除确认弹窗
.delete-mask {
  position: fixed;
  inset: 0;
  background: rgba(51, 51, 51, 0.60);
  z-index: 1022;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delete-dialog {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.delete-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 16px 24px;
}
.delete-dialog-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
.delete-dialog-close {
  width: 28px;
  height: 28px;
  border: 1.5px dashed #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  &:hover {
    border-color: #999;
    color: #666;
  }
}
.delete-dialog-body {
  padding: 4px 24px 24px;
  p {
    margin: 0;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
  }
}
.delete-dialog-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 20px;
  button {
    flex: 1;
    height: 46px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    outline: none;
    transition: opacity 0.2s;
    &:active { opacity: 0.8; }
  }
}
.delete-btn-cancel {
  background: #fff;
  color: #333;
  border: 1.5px solid #e0e0e0 !important;
}
.delete-btn-confirm {
  background: #F04444;
  color: #fff;
  &.btn-deleting {
    opacity: 0.65;
    cursor: not-allowed;
  }
}
</style>
