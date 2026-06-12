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
        <span class="tab" :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'">我的资料</span>
        <span class="tab" :class="{ active: activeTab === 'group' }" @click="activeTab = 'group'">教研组资料</span>
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
          <button class="btn-outline btn-upload">
            <img src="@/assets/images/material/upload.png" alt="" class="btn-icon upload-icon-default" />
            <img src="@/assets/images/material/upload_yes.png" alt="" class="btn-icon upload-icon-hover" />
            上传资料
          </button>
        </div>
        <div class="toolbar-right">
          <div class="search-box">
            <img src="@/assets/images/material/search_icon.png" alt="" class="search-img-icon" />
            <input type="text" placeholder="搜索资料名称" v-model="searchKeyword" @click.stop />
          </div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list">
        <div class="file-list-header">
          <span class="col-name">全部资料</span>
          <span class="col-size">大小</span>
          <span class="col-date">日期</span>
          <span class="col-action">操作</span>
        </div>
        <div class="file-list-body">
          <div
            class="file-item"
            v-for="item in filteredFileList"
            :key="item.id"
          >
            <div class="col-name">
              <div class="file-icon-wrap">
                <img
                  v-if="item.type === 'folder'"
                  src="@/assets/images/material/fold_icon.png"
                  alt=""
                  class="type-icon"
                />
                <img
                  v-else
                  src="@/assets/images/material/file_icon.png"
                  alt=""
                  class="type-icon"
                />
              </div>
              <span class="file-name">{{ item.name }}</span>
            </div>
            <div class="col-size">{{ item.size }}</div>
            <div class="col-date">{{ item.date || '—' }}</div>
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
            3 个教研组
          </div>
          <div class="stats-badge">最近更新：2026-02-02</div>
        </div>
        <div class="group-stats-right">选择教研组后可新建、上传与管理资料</div>
      </div>

      <!-- 教研组卡片区 -->
      <div class="group-card-section">
        <div class="group-card-section_box">
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
              v-for="group in groupList"
              :key="group.id"
              :class="[`group-card-${group.color}`, { 'group-card-active': selectedGroup === group.id }]"
              @click="selectedGroup = group.id"
            >
              <div class="group-card-top">
                <div class="group-avatar">
                  <img src="@/assets/images/material/jyz_icon.png" alt="" class="group-avatar-icon" />
                </div>
                <div class="group-card-arrow" :class="{ 'arrow-active': selectedGroup === group.id }">
                  <img src="@/assets/images/material/right_icon.png" alt="" class="arrow-icon" />
                </div>
              </div>
              <div class="group-name">{{ group.name }}</div>
              <div class="group-info">{{ group.count }} 个资料 · 更新于 {{ group.updateDate }}</div>
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
      confirmText="确认"
      :confirmDisabled="!newFolderName.trim()"
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
      confirmText="确认"
      :confirmDisabled="!renameValue.trim()"
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
          <button class="delete-btn-cancel" @click="closeDeleteDialog">取消</button>
          <button class="delete-btn-confirm" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import DialogCustome from '@/components/DialogCustome/index.vue'

export default {
  name: 'Resources',
  components: { DialogCustome },
  data() {
    return {
      activeTab: 'my',
      searchKeyword: '',
      selectedGroup: null,

      fileList: [
        { id: 1, type: 'folder', name: '大学英语期中复习资料', size: '2 个', date: null, showMore: false, deleteActive: false },
        { id: 2, type: 'folder', name: '班会记录', size: '1 个', date: null, showMore: false, deleteActive: false },
        { id: 3, type: 'pdf', name: '大学语文·期末复习资料包', size: '15 MB', date: '2026-01-25', showMore: false, deleteActive: false },
        { id: 4, type: 'ppt', name: '高等数学·函数与极限讲义', size: '20 KB', date: '2026-01-25', showMore: false, deleteActive: false },
        { id: 5, type: 'doc', name: '管理学案例：组织结构设计', size: '2.8 MB', date: '2026-01-19', showMore: false, deleteActive: false },
        { id: 6, type: 'other', name: '课堂互动题库 01-06', size: '42 MB', date: '2026-01-12', showMore: false, deleteActive: false },
      ],

      groupList: [
        { id: 1, name: '管理学教研组', count: 18, updateDate: '2026-02-02', color: 'blue' },
        { id: 2, name: '数学教研组', count: 12, updateDate: '2026-01-28', color: 'orange' },
        { id: 3, name: '公共基础教研组', count: 9, updateDate: '2026-01-21', color: 'green' },
      ],

      showNewFolderDialog: false,
      newFolderName: '',

      showRenameDialog: false,
      renameTarget: null,
      renameValue: '',

      showDeleteDialog: false,
      deleteTarget: null,
    }
  },
  computed: {
    filteredFileList() {
      if (!this.searchKeyword.trim()) return this.fileList
      return this.fileList.filter(f => f.name.includes(this.searchKeyword.trim()))
    }
  },
  methods: {
    closeAllMenus() {
      this.fileList.forEach(f => { f.showMore = false })
    },
    toggleMore(item) {
      const current = item.showMore
      this.closeAllMenus()
      item.showMore = !current
    },

    closeNewFolderDialog() {
      this.showNewFolderDialog = false
      this.newFolderName = ''
    },
    confirmNewFolder() {
      if (!this.newFolderName.trim()) return
      this.fileList.unshift({
        id: Date.now(),
        type: 'folder',
        name: this.newFolderName.trim(),
        size: '0 个',
        date: null,
        showMore: false,
        deleteActive: false,
      })
      this.closeNewFolderDialog()
    },

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
      if (!this.renameValue.trim() || !this.renameTarget) return
      this.renameTarget.name = this.renameValue.trim()
      this.closeRenameDialog()
    },

    openDeleteDialog(item) {
      this.deleteTarget = item
      this.showDeleteDialog = true
    },
    closeDeleteDialog() {
      this.showDeleteDialog = false
      this.deleteTarget = null
    },
    confirmDelete() {
      if (!this.deleteTarget) return
      this.fileList = this.fileList.filter(f => f.id !== this.deleteTarget.id)
      this.closeDeleteDialog()
    },
  }
}
</script>

<style lang="scss" scoped>
.resources-page {
  box-sizing: border-box;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.resources-page_top{
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
background: rgba(255,255,255,0.82);

  gap: 12px;
  .toolbar-left {
    display: flex;
    gap: 12px;
    flex: 1;
  }
  .toolbar-right {
    flex: 0 0 220px;
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

// 上传资料按钮 hover 时变蓝色填充
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

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  box-sizing: border-box;
  border: 1px solid #DFE5EE;
  border-radius: 12px;
  background: #FFFFFF;
  .search-img-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    flex-shrink: 0;
  }
  input {
    border: none;
    background: transparent;
    font-size: 14px;
    color: #333;
    outline: none;
    width: 100%;
    &::placeholder { color: #99A2B2; }
  }
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

.file-list-header {
  display: flex;
  align-items: center;
  padding: 14px 24px;
  background: #FBFCFF;
  border-bottom: 1px solid #EDF0F5;
  font-size: 13px;
  color: #8A93A3;
  .col-name { flex: 1; }
  .col-size { width: 140px; text-align: center; }
  .col-date { width: 140px; text-align: center; }
  .col-action { width: 140px; text-align: center; }
}

.file-item {
  display: flex;
  align-items: center;
  padding: 15px 24px;
  background: #ffffff;
  border-bottom: 1px solid #EDF0F5;
  transition: background 0.15s;
  &:last-child { border-bottom: none; }
  &:hover { background: #fafcff; }

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
    }
  }
  .col-size {
    width: 140px;
    text-align: center;
    font-size: 14px;
    color: #5F6878;
  }
  .col-date {
    width: 140px;
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
  .group-stats-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
padding: 18px 40px;
box-sizing: border-box;
border-top: 1px solid #E9EDF4;
background: rgba(255,255,255,0.82);
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
      border-radius:12px;
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
 
  padding: 0 25px 25px 25px;
  box-sizing: border-box;
}
.group-card-section_box{
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
}

.group-card {
  flex: 1;
  border-radius: 18px 18px 18px 18px;
  padding: 21px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid transparent;
  &:hover { transform: translateY(-1px);  border-color: #4080FF !important; }

  &.group-card-blue {
   background: linear-gradient( 45deg, #E9F0FF 0%, #EBF2FF 14.29%, #EDF3FF 28.57%, #EFF5FF 42.86%, #F2F6FF 57.14%, #F4F8FF 71.43%, #F6F9FF 85.71%, #F8FBFF 100%);
    border-color: #E5EAF2;
  }
  &.group-card-orange {
background: linear-gradient( 45deg, #FFF4E4 0%, #FFF5E7 20%, #FFF6EA 40%, #FFF8EC 60%, #FFF9EF 80%, #FFFAF2 100%);
    border-color: #E5EAF2;
  }
  &.group-card-green {
   background: linear-gradient( 45deg, #EAFBF4 0%, #ECFCF5 16.67%, #EFFCF6 33.33%, #F1FDF7 50%, #F3FEF9 66.67%, #F6FEFA 83.33%, #F8FFFB 100%);
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

.my-resources,.group-resources{
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 25px;
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
}

</style>
