<template>
  <div class="message-page">
    <!-- 隐藏的文件输入 -->
    <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="onImageFileChange">
    <input ref="fileInput" type="file" multiple style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.mp4,.mp3,.avi,.mov,.wmv,.mkv" @change="onFileChange">

    <!-- 顶部：列表态 / 详情态 返回 -->
    <div class="message-header" v-if="showDetail">
      <!-- <template v-if="!showDetail">
        <div class="message-tabs">
          <div class="message-tab active">已收消息</div>
        </div>
      </template> -->
      <template >
        <div class="message-detail-back" @click="closeDetail">
          <img src="@/assets/images/message/back.png" class="message-detail-back__icon" alt="">
          <span>消息详情</span>
        </div>
      </template>
    </div>

    <!-- 列表 -->
    <div v-if="!showDetail" class="list_container">
      <div class="message-count">共 {{ currentList.length }} 条消息</div>

      <div class="message-list" v-loading="loading">
        <EmptyState v-if="!loading && currentList.length === 0" description="暂无消息" />
        <div
          class="message-card"
          v-for="item in currentList"
          :key="item.id"
          @click="handleDetail(item)"
        >
          <div class="message-card__header">
            <div class="message-card__header-left">
              <span class="message-card__title">{{ item.sender }}</span>
              <span class="message-card__time">{{ formatTime(item.time) }}</span>
            </div>
            <div class="message-card__more" @click.stop>
              <el-popover
                placement="bottom-end"
                trigger="click"
                popper-class="ls_options_popover"
                :visible-arrow="false"
              >
                <div class="ls_options_menu">
                  <div class="ls_options_menu_item" @click.stop="handleDelete(item)">
                    <span>删除</span>
                  </div>
                </div>
                <div slot="reference" class="message-card__more-btn">
                  <img src="@/assets/images/online/options.png" alt="">
                </div>
              </el-popover>
            </div>
          </div>

          <div class="message-card__content">{{ item.content }}</div>

          <div
            class="message-card__media"
            v-if="item.images.length > 0 || item.files.length > 0"
            @click.stop
          >
            <el-image
              v-for="(img, ii) in item.images"
              :key="'img_' + item.id + '_' + ii"
              :src="img.filePath"
              :preview-src-list="item.images.map(i => i.filePath)"
              :initial-index="ii"
              class="message-card__img"
            />
            <div
              class="message-card__file"
              v-for="(file, fi) in item.files"
              :key="'file_' + item.id + '_' + fi"
              @click="previewFile(file)"
            >
              <img src="@/assets/images/message/link_icon.png" class="message-card__file-icon" alt="">
              <span class="message-card__file-name">{{ file.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情 -->
    <div class="message-detail" v-else-if="currentDetail">
      <div class="message-card message-card--detail">
        <div class="message-card__header">
          <div class="message-card__header-left">
            <span class="message-card__title">{{ currentDetail.sender }}</span>
            <span class="message-card__time">{{ formatTime(currentDetail.time) }}</span>
          </div>
        </div>
        <div class="message-card__content message-card__content--full">{{ currentDetail.content }}</div>
        <div
          class="message-card__media"
          v-if="currentDetail.images.length > 0 || currentDetail.files.length > 0"
        >
          <el-image
            v-for="(img, ii) in currentDetail.images"
            :key="'detail_img_' + ii"
            :src="img.filePath"
            :preview-src-list="currentDetail.images.map(i => i.filePath)"
            :initial-index="ii"
            class="message-card__img"
          />
          <div
            class="message-card__file"
            v-for="(file, fi) in currentDetail.files"
            :key="'detail_file_' + fi"
            @click="previewFile(file)"
          >
            <img src="@/assets/images/message/link_icon.png" class="message-card__file-icon" alt="">
            <span class="message-card__file-name">{{ file.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加消息弹窗 -->
    <DialogCustome :visible="showDialog" title="发消息" :confirmLoading="sendLoading" @cancel="onDialogCancel" @confirm="onDialogConfirm" @close="onDialogCancel">
      <div class="dialog_con">
        <div class="dialog_con_top" @click="handleChooseReceive">
          <div class="dialog_con_top_left">
            <div class="dialog_con_top_left_empty" v-if="selectedRecipients.length === 0">接收人</div>
            <div
              class="dialog_con_top_left_detail"
              v-for="(item, index) in selectedRecipients"
              :key="item.id"
            >
              <div class="dialog_con_top_left_detail_name">{{ item.name }}</div>
              <img
                src="@/assets/images/message/close.png"
                class="dialog_con_top_left_detail_close"
                alt=""
                @click.stop="removeRecipient(index)"
              >
            </div>
          </div>
          <img src="@/assets/images/message/add.png" class="dialog_con_top_btn" alt="" @click="handleChooseReceive">
        </div>
        <div class="dialog_con_last">
          <div class="dialog_con_last_con">
            <el-input
              class="my-input"
              type="textarea"
              :rows="5"
              style="width:100%"
              placeholder="消息内容"
              v-model="messageContent"
            ></el-input>
            <div class="dialog_con_last_con_other" v-if="selectedImages.length > 0 || selectedFiles.length > 0">
              <div
                class="dialog_con_last_con_other_img"
                v-for="(img, index) in selectedImages"
                :key="'img_' + index"
              >
                <img :src="img.url" class="dialog_con_last_con_other_img_img" alt="">
                <img
                  src="@/assets/images/message/close.png"
                  class="dialog_con_last_con_other_img_close"
                  alt=""
                  @click="removeImage(index)"
                >
              </div>
              <div
                class="dialog_con_last_con_other_file"
                v-for="(file, index) in selectedFiles"
                :key="'file_' + index"
              >
                <img src="@/assets/images/message/icon.png" class="dialog_con_last_con_other_file_fm" alt="">
                <div class="dialog_con_last_con_other_file_mess">
                  <div class="dialog_con_last_con_other_file_mess_title">{{ file.name }}</div>
                  <div class="dialog_con_last_con_other_file_mess_size">{{ file.size }}</div>
                </div>
                <img
                  src="@/assets/images/message/close.png"
                  class="dialog_con_last_con_other_img_close"
                  alt=""
                  @click="removeFile(index)"
                >
              </div>
            </div>
          </div>
          <div class="dialog_con_last_btn">
            <img src="@/assets/images/message/fileIcon.png" class="dialog_con_last_btn_file" alt="" @click="uploadFile">
            <img src="@/assets/images/message/imgIcon.png" class="dialog_con_last_btn_img" alt="" @click="uploadImage">
          </div>
        </div>
      </div>
    </DialogCustome>

    <!-- 文件预览 -->
    <FilePreview :visible="filePreviewVisible" :file="filePreviewData" @close="filePreviewVisible = false" />

    <!-- 选择接收人弹窗 -->
    <DialogCustome
      width="676px"
      height="585px"
      :visible="showDialogReceive"
      title="选择接收人"
      @cancel="onDialogCancelReceive"
      @confirm="onDialogConfirmReceive"
      @close="onDialogCancelReceive"
    >
      <div class="receive_tc_box">
        <div class="receive_tc_box_left">
          <div class="receive_tc_box_left_top">
            <div
              :class="['receive_tc_box_left_top_detail', receiveActiveTab === 'teacher' ? 'receive_tc_box_left_top_detail_active' : '']"
              @click="receiveActiveTab = 'teacher'"
            >老师</div>
            <div
              :class="['receive_tc_box_left_top_detail', receiveActiveTab === 'student' ? 'receive_tc_box_left_top_detail_active' : '']"
              @click="receiveActiveTab = 'student'"
            >学生</div>
          </div>
          <div class="receive_tc_box_left_list">
            <div
              class="receive_tc_box_left_list_detail"
              v-for="classItem in currentReceiveClasses"
              :key="classItem.id"
            >
              <div class="receive_tc_box_left_list_detail_class" @click="toggleClassExpand(classItem)">
                <img
                  :src="classItem.expanded ? require('@/assets/images/message/xl_yes.png') : require('@/assets/images/message/xl_no.png')"
                  alt=""
                  class="receive_tc_box_left_list_detail_class_xl"
                >
                <img src="@/assets/images/message/tag.png" alt="" class="receive_tc_box_left_list_detail_class_tag">
                <div class="receive_tc_box_left_list_detail_class_title">{{ classItem.name }}</div>
                <img
                  :src="isClassAllSelected(classItem) ? require('@/assets/images/message/choose_yes.png') : require('@/assets/images/message/choose_no.png')"
                  alt=""
                  class="receive_tc_box_left_list_detail_class_choose"
                  @click.stop="toggleClassSelect(classItem)"
                >
              </div>
              <div class="receive_tc_box_left_list_detail_second" v-if="classItem.expanded">
                <div
                  class="receive_tc_box_left_list_detail_second_detail"
                  v-for="member in classItem.members"
                  :key="member.id"
                  @click="toggleMemberSelect(member)"
                >
                  <img src="@/assets/images/message/such.png" class="receive_tc_box_left_list_detail_second_detail_fm" alt="">
                  <div class="receive_tc_box_left_list_detail_second_detail_name">{{ member.name }}</div>
                  <img
                    :src="isMemberSelected(member) ? require('@/assets/images/message/choose_yes.png') : require('@/assets/images/message/choose_no.png')"
                    alt=""
                    class="receive_tc_box_left_list_detail_class_choose"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="receive_tc_box_right">
          <div class="receive_tc_box_right_top">已选择<span> {{ currentTempList.length }} </span>人</div>
          <div class="receive_tc_box_right_list">
            <div
              class="receive_tc_box_right_list_detail"
              v-for="member in currentTempList"
              :key="member.id"
            >
              <img src="@/assets/images/message/such.png" class="receive_tc_box_right_list_detail_head" alt="">
              <div class="receive_tc_box_right_list_detail_title">{{ member.name }}</div>
              <img
                src="@/assets/images/message/close.png"
                class="receive_tc_box_right_list_detail_close"
                alt=""
                @click="removeTempRecipient(member)"
              >
            </div>
          </div>
        </div>
      </div>
    </DialogCustome>
  </div>
</template>

<script>
import { getTeacherNoticeList, getNoticeReceivers, createNotice, removeNotice } from '@/api/modules/teacher'
import FilePreview from '@/components/FilePreview/index.vue'

export default {
  name: 'Message',
  components: { FilePreview },
  data() {
    return {
      showDetail: false,
      filePreviewVisible: false,
      filePreviewData: null,
      showDialog: false,
      showDialogReceive: false,
      messageContent: '',
      activeTab: 'received',
      currentDetail: null,
      keyword: '',
      loading: false,
      sendLoading: false,
      receiveLoading: false,

      // 发消息弹窗
      selectedRecipients: [],
      tempTeacherRecipients: [],
      tempStudentRecipients: [],
      selectedImages: [],
      selectedFiles: [],

      // 选择接收人弹窗
      receiveActiveTab: 'teacher',
      teacherClasses: [],
      studentClasses: [],

      sentMessages: [],
      receivedMessages: []
    }
  },
  computed: {
    currentList() {
      return this.activeTab === 'sent' ? this.sentMessages : this.receivedMessages
    },
    currentReceiveClasses() {
      return this.receiveActiveTab === 'teacher' ? this.teacherClasses : this.studentClasses
    },
    currentTempList() {
      return this.receiveActiveTab === 'teacher' ? this.tempTeacherRecipients : this.tempStudentRecipients
    }
  },
  mounted() {
    this.fetchMessages()
  },
  methods: {
    async fetchMessages() {
      this.loading = true
      try {
        const type = this.activeTab === 'sent' ? '2' : '1'
        const params = { type }
        if (this.keyword) params.keyword = this.keyword
        const res = await getTeacherNoticeList(params)
        const list = (res.data || []).map(item => {
          const resourceInfoList = item.resourceInfoList || []
          const images = resourceInfoList.filter(r => r.type === '1')
          const fileItems = resourceInfoList.filter(r => r.type === '2')
          return {
            id: item.id,
            itemId: item.itemId,
            sender: item.sendPersonName || item.sendPerson || '',
            sendPerson: item.sendPerson,
            time: item.sendTime || '',
            content: item.content || '',
            attachCount: resourceInfoList.length,
            images: images,
            files: fileItems.map(f => ({ id: f.id, name: f.fileName || '', path: f.filePath || '' }))
          }
        })
        if (this.activeTab === 'sent') {
          this.sentMessages = list
        } else {
          this.receivedMessages = list
        }
      } catch (e) {
        // 请求失败不做额外处理
      } finally {
        this.loading = false
      }
    },
    handleDetail(item) {
      this.currentDetail = item
      this.showDetail = true
    },
    closeDetail() {
      this.showDetail = false
      this.currentDetail = null
    },
    formatTime(raw) {
      if (!raw) return ''
      const date = new Date(raw)
      if (isNaN(date.getTime())) return raw
      const pad = n => String(n).padStart(2, '0')
      return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    },

    // 发消息弹窗
    openSendDialog() {
      this.showDialog = true
    },
    onDialogCancel() {
      this.showDialog = false
    },
    async onDialogConfirm() {
      if (this.selectedRecipients.length === 0) {
        this.$message({ message: '请选择接收人', type: 'warning' })
        return
      }
      if (!this.messageContent.trim()) {
        this.$message({ message: '请输入消息内容', type: 'warning' })
        return
      }
      this.sendLoading = true
      try {
        const formData = new FormData()
        formData.append('content', this.messageContent.trim())
        this.selectedRecipients.forEach((r, i) => {
          formData.append(`receivers[${i}].userId`, r.id)
          formData.append(`receivers[${i}].type`, r.type)
        })
        this.selectedImages.forEach(img => {
          formData.append('images', img.file)
        })
        this.selectedFiles.forEach(f => {
          formData.append('files', f.file)
        })
        await createNotice(formData)
        this.resetSendDialog()
        this.showDialog = false
        this.$message({ message: '发送成功', type: 'success' })
        this.fetchMessages()
      } catch (e) {
        // 错误由请求拦截器统一处理
      } finally {
        this.sendLoading = false
      }
    },
    resetSendDialog() {
      this.messageContent = ''
      this.selectedRecipients = []
      this.selectedImages = []
      this.selectedFiles = []
    },

    // 将接口返回数据转换为班级树结构
    transformReceivers(list) {
      return (list || []).map(item => ({
        id: item.classId,
        name: item.classAlias || item.className || '',
        expanded: false,
        members: (item.users || []).map(u => ({
          id: u.userId,
          name: u.displayName || '',
          type: u.type
        }))
      }))
    },

    // 接收人相关
    async handleChooseReceive() {
      // 回显：按 type 拆分上次确认的结果到两个独立数组
      this.tempTeacherRecipients = this.selectedRecipients.filter(r => r.type === '2').map(r => ({ ...r }))
      this.tempStudentRecipients = this.selectedRecipients.filter(r => r.type === '1').map(r => ({ ...r }))
      this.showDialogReceive = true
      this.receiveLoading = true
      try {
        const [teacherRes, studentRes] = await Promise.all([
          getNoticeReceivers({ type: '0' }),
          getNoticeReceivers({ type: '1' })
        ])
        this.teacherClasses = this.transformReceivers(teacherRes.data)
        this.studentClasses = this.transformReceivers(studentRes.data)
      } catch (e) {
        // 错误由请求拦截器统一处理
      } finally {
        this.receiveLoading = false
      }
    },
    removeRecipient(index) {
      this.selectedRecipients.splice(index, 1)
    },
    onDialogCancelReceive() {
      this.showDialogReceive = false
    },
    onDialogConfirmReceive() {
      this.selectedRecipients = [
        ...this.tempTeacherRecipients.map(r => ({ ...r })),
        ...this.tempStudentRecipients.map(r => ({ ...r }))
      ]
      this.showDialogReceive = false
    },

    // 接收人弹窗内部操作
    toggleClassExpand(classItem) {
      this.$set(classItem, 'expanded', !classItem.expanded)
    },
    isMemberSelected(member) {
      return this.currentTempList.some(r => r.id === member.id)
    },
    isClassAllSelected(classItem) {
      return classItem.members.length > 0 && classItem.members.every(m => this.isMemberSelected(m))
    },
    toggleClassSelect(classItem) {
      const list = this.receiveActiveTab === 'teacher' ? this.tempTeacherRecipients : this.tempStudentRecipients
      const allSelected = this.isClassAllSelected(classItem)
      if (allSelected) {
        classItem.members.forEach(member => {
          const idx = list.findIndex(r => r.id === member.id)
          if (idx !== -1) list.splice(idx, 1)
        })
      } else {
        classItem.members.forEach(member => {
          if (!list.some(r => r.id === member.id)) {
            list.push({ id: member.id, name: member.name, type: member.type })
          }
        })
      }
    },
    toggleMemberSelect(member) {
      const list = this.receiveActiveTab === 'teacher' ? this.tempTeacherRecipients : this.tempStudentRecipients
      const idx = list.findIndex(r => r.id === member.id)
      if (idx === -1) {
        list.push({ id: member.id, name: member.name, type: member.type })
      } else {
        list.splice(idx, 1)
      }
    },
    removeTempRecipient(member) {
      const list = this.receiveActiveTab === 'teacher' ? this.tempTeacherRecipients : this.tempStudentRecipients
      const idx = list.findIndex(r => r.id === member.id)
      if (idx !== -1) list.splice(idx, 1)
    },

    // 图片上传
    uploadImage() {
      this.$refs.imageInput.click()
    },
    onImageFileChange(e) {
      Array.from(e.target.files).forEach(file => {
        const url = URL.createObjectURL(file)
        this.selectedImages.push({ name: file.name, url, file })
      })
      e.target.value = ''
    },
    removeImage(index) {
      this.selectedImages.splice(index, 1)
    },

    // 删除消息
    async handleDelete(item) {
      try {
        await this.$confirm('确定要删除该消息吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }
      try {
        const type = this.activeTab === 'sent' ? '2' : '1'
        await removeNotice({ itemId: item.itemId, type })
        this.$message({ message: '删除成功', type: 'success' })
        this.fetchMessages()
      } catch (e) {
        // 错误由请求拦截器统一处理
      }
    },

    // 文件上传
    uploadFile() {
      this.$refs.fileInput.click()
    },
    onFileChange(e) {
      Array.from(e.target.files).forEach(file => {
        const size = file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + 'MB'
          : Math.ceil(file.size / 1024) + 'KB'
        this.selectedFiles.push({ name: file.name, size, file })
      })
      e.target.value = ''
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },

    previewFile(file) {
      if (file.path) {
        this.filePreviewData = { name: file.name, path: file.path }
        this.filePreviewVisible = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.message-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden;
}

/* 顶部栏 */
.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

/* Tab：与设计图一致的分段切换 */
.message-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239,246,255,0.8);
  border-radius: 12px 12px 12px 12px;
  padding: 4px;
  box-sizing: border-box;
}

.message-tab {
  width: 112px;
  height: 40px;
  text-align: center;
  line-height: 40px;
  font-size: 14px;
  font-weight: bold;
  color: #62748E;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;

  &:hover:not(.active) {
    color: #62748E;
  }

  &.active {
    background: #FFFFFF;
    color: #1F7CFF;
    font-weight: bold;
    box-shadow: 0px 1px 2px -1px rgba(0, 0, 0, 0.1), 0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px #DBEAFE;
  }
}

/* 详情返回 */
.message-detail-back {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  cursor: pointer;
  user-select: none;

  &__icon {
    width: 7px;
    height: 14px;
  }
}

.list_container{
  background: #FFFFFF;
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  border-radius: 12px 12px 12px 12px;
  padding: 20px;
  box-sizing: border-box;
  flex: 1;
  height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 数量文案 */
.message-count {
  font-size: 14px;
  color: #45556C;
  margin-bottom: 16px;
  flex-shrink: 0;
  line-height: 20px;
}

/* 列表区域 */
.message-list {
  flex: 1;
  height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 详情区域 */
.message-detail {
  flex: 1;
  height: 0;
  overflow: auto;
}

/* 消息卡片 —— 按设计图静态还原 */
.message-card {
  width: 100%;
  background: rgba(239,246,255,0.5);
  border-radius: 12px 12px 12px 12px;
  border: 1px solid #DBEAFE;
  padding: 17px;
  box-sizing: border-box;
  flex-shrink: 0;
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(31, 124, 255, 0.08);
  }

  &--detail {
    cursor: default;

    &:hover {
      box-shadow: none;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__header-left {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex: 1;
    width: 0;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: bold;
    color: #020618;
    line-height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  }

  &__time {
    font-size: 12px;
    color: #90A1B9;
    line-height: 18px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__more {
    flex-shrink: 0;
  }

  &__more-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;

    img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    &:hover {
      background: #F1F5F9;
    }
  }

  &__content {
    font-size: 14px;
    color: #45556C;
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;

    &--full {
      /* 详情页完整展示 */
    }
  }

  &__media {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
  }

  &__img {
    width: 128px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__file {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 12px;
    background: #FFFFFF;
    box-shadow: 0px 0px 0px 1px #DBEAFE;
    border-radius: 10px 10px 10px 10px;
    cursor: pointer;
    box-sizing: border-box;

    &:hover {
      background: #E8EAEE;
    }
  }

  &__file-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  &__file-name {
    font-size: 12px;
    color: #45556C;
    line-height: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// ─── 发消息弹窗（保持原有样式）──────────────────────────────
.dialog_con {
  width: 100%;
}
.dialog_con_top {
  border-radius: 8px;
  width: 100%;
  height: 56px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 0 20px 0 17px;
  box-sizing: border-box;
  cursor: pointer;
}
.dialog_con_top_left {
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
}
.dialog_con_top_btn {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}
.dialog_con_top_left_detail {
  height: 32px;
  border-radius: 4px;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #CAD9FF;
  flex-shrink: 0;
}
.dialog_con_top_left_detail_name {
  color: #333333;
  font-size: 14px;
  white-space: nowrap;
}
.dialog_con_top_left_detail_close {
  width: 16px;
  height: 16px;
}
.dialog_con_top_left_empty {
  font-weight: 400;
  font-size: 16px;
  color: #999999;
}
.dialog_con_last {
  width: 100%;
  margin-top: 16px;
  background: #ffffff;
  padding: 11px 20px 16px 17px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.dialog_con_last_con {
  min-height: 228px;
  width: 100%;
}
.dialog_con_last_btn {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}
.dialog_con_last_btn_file {
  width: 19px;
  height: 18px;
  cursor: pointer;
}
.dialog_con_last_btn_img {
  width: 19px;
  height: 18px;
  cursor: pointer;
}
::v-deep .el-textarea__inner {
  padding: 0 !important;
  border: none !important;
  color: #333333 !important;
  font-size: 16px !important;
}
::v-deep .el-textarea__inner::placeholder {
  color: #999999 !important;
  font-size: 16px !important;
}
.dialog_con_last_con_other {
  width: 100%;
  margin-top: 19px;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.dialog_con_last_con_other_img {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 4px;
}
.dialog_con_last_con_other_img_img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
.dialog_con_last_con_other_img_close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.dialog_con_last_con_other_file {
  position: relative;
  width: 214px;
  height: 56px;
  background: #F3F4F8;
  border-radius: 4px;
  padding: 0 12px;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.dialog_con_last_con_other_file_mess {
  flex: 1;
  width: 0;
}
.dialog_con_last_con_other_file_mess_title {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.dialog_con_last_con_other_file_fm {
  width: 36px;
  height: 36px;
}
.dialog_con_last_con_other_file_mess_size {
  font-weight: 400;
  font-size: 14px;
  color: #999999;
  margin-top: 5px;
}

// ─── 选择接收人弹窗（保持原有样式）──────────────────────────
.receive_tc_box {
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 100%;
  gap: 12px;
}
.receive_tc_box_left {
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 12px;
  width: 361px;
}
.receive_tc_box_left_top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 9px;
}
.receive_tc_box_left_top_detail {
  width: 176px;
  height: 48px;
  background: #FFFFFF;
  border-radius: 8px;
  font-weight: 400;
  font-size: 16px;
  color: #333333;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.receive_tc_box_left_top_detail_active {
  background: #0049FF !important;
  color: #FFFFFF !important;
  font-weight: bold;
}
.receive_tc_box_left_list {
  flex: 1;
  height: 0;
  background: #FFFFFF;
  border-radius: 8px;
  overflow: auto;
  padding: 14px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.receive_tc_box_left_list_detail {
  width: 100%;
}
.receive_tc_box_left_list_detail_class {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_class_xl {
  width: 8px;
  height: 8px;
}
.receive_tc_box_left_list_detail_class_tag {
  margin: 0 6px 0 12px;
  width: 14px;
  height: 14px;
}
.receive_tc_box_left_list_detail_class_choose {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_class_title {
  margin-right: 10px;
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.receive_tc_box_left_list_detail_second {
  padding-left: 18px;
  box-sizing: border-box;
  width: 100%;
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-direction: column;
}
.receive_tc_box_left_list_detail_second_detail {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_second_detail_fm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_left_list_detail_second_detail_name {
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.receive_tc_box_right {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
  padding: 8px 0;
  box-sizing: border-box;
}
.receive_tc_box_right_top {
  font-weight: 400;
  font-size: 14px;
  color: #333333;
  padding: 0px 17px;
  box-sizing: border-box;
}
.receive_tc_box_right_top span {
  font-size: 20px;
  font-weight: bold;
}
.receive_tc_box_right_list {
  padding: 0px 17px;
  box-sizing: border-box;
  flex: 1;
  height: 0;
  overflow: auto;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 8px;
}
.receive_tc_box_right_list_detail {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.receive_tc_box_right_list_detail_head {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_right_list_detail_close {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.receive_tc_box_right_list_detail_title {
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
</style>

<style lang="scss">
.ls_options_popover {
  padding: 4px 0 !important;
  min-width: 120px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}
.ls_options_menu {
  display: flex;
  flex-direction: column;
}
.ls_options_menu_item {
  padding: 10px 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover {
    background: #f0f4ff;
    color: #0049ff;
  }
}
</style>
