<template>
  <div class="page-placeholder">
    <!-- 隐藏的文件输入 -->
    <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="onImageFileChange">
    <input ref="fileInput" type="file" multiple style="display:none" @change="onFileChange">

    <div class="app_top">
      <div class="app_top_left" @click="openSendDialog">
        <div class="app_top_left_text">消息</div>
        <img src="@/assets/images/home/add.png" class="app_top_left_icon" alt="">
      </div>
      <div class="app_top_right" v-if="showDetail == false">{{ activeTab === 'sent' ? '已发消息' : '已收消息' }}</div>
      <div class="app_top_right" @click="showDetail=false" v-if="showDetail == true">消息详情
        <img src="@/assets/images/message/back.png" class="app_top_right_back"  alt="">
      </div>
    </div>
    <div class="app_last">
      <div class="app_last_left">
        <div
          :class="activeTab === 'sent' ? 'app_last_left_detail_active' : 'app_last_left_detail'"
          @click="switchTab('sent')"
        >已发消息</div>
        <div
          :class="activeTab === 'received' ? 'app_last_left_detail_active' : 'app_last_left_detail'"
          @click="switchTab('received')"
        >已收消息</div>
      </div>
      <!-- 列表 -->
      <div class="app_last_right" v-if="showDetail == false">
        <EmptyState v-if="currentList.length === 0" description="暂无消息" />
        <div class="app_last_right_detail" @click="handleDetail(item)" v-for="(item) in currentList" :key="item.id">
          <!-- <img src="@/assets/images/message/such.png" class="app_last_right_detail_img" alt=""> -->
          <div class="app_last_right_detail_mess">
            <div class="app_last_right_detail_mess_top">
              <div class="app_last_right_detail_mess_top_left">
                <div class="app_last_right_detail_mess_top_name">{{ item.sender }}</div>
                <div class="app_last_right_detail_mess_top_time">{{ item.time }}</div>
                <div class="app_last_right_detail_mess_top_file" v-if="item.attachCount > 0">
                  <div class="app_last_right_detail_mess_top_file_sx"></div>
                  <img src="@/assets/images/message/file.png" class="app_last_right_detail_mess_top_file_icon" alt="">
                  <div class="app_last_right_detail_mess_top_file_text">{{ item.attachCount }}个附件</div>
                </div>
              </div>
              <img src="@/assets/images/message/options.png" class="app_last_right_detail_mess_top_options" alt="">
            </div>
            <div class="app_last_right_detail_mess_con">{{ item.content }}</div>
          </div>
        </div>
      </div>
      <!-- 详情 -->
      <div class="app_last_right" v-if="showDetail == true && currentDetail">
        <div class="app_last_right_detailBOX">
            <div class="app_last_right_detailBOX_top">
               <div class="app_last_right_detail_mess_top_name">{{ currentDetail.sender }}</div>
                <div class="app_last_right_detail_mess_top_time">{{ currentDetail.time }}</div>
            </div>
            <div class="app_last_right_detail_mess_con app_last_right_detail_mess_con_full">{{ currentDetail.content }}</div>
            <div class="app_last_right_detailBOX_last" v-if="currentDetail.hasImage || currentDetail.files.length > 0">
              <img v-if="currentDetail.hasImage" src="@/assets/images/message/such.png" class="app_last_right_detailBOX_last_img" alt="">
              <div
                class="app_last_right_detailBOX_last_file"
                v-for="(file, fi) in currentDetail.files"
                :key="fi"
              >
                <img src="@/assets/images/message/icon.png" class="app_last_right_detailBOX_last_file_icon" alt="">
                <div class="app_last_right_detailBOX_last_file_mess">
                  <div class="app_last_right_detailBOX_last_file_mess_title">{{ file.name }}</div>
                  <div class="app_last_right_detailBOX_last_file_mess_size">{{ file.size }}</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>


    <!-- 添加消息弹窗 -->
    <DialogCustome :visible="showDialog" title="发消息" @cancel="onDialogCancel" @confirm="onDialogConfirm" @close="onDialogCancel">
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
          <div class="receive_tc_box_right_top">已选择<span> {{ tempSelectedRecipients.length }} </span>人</div>
          <div class="receive_tc_box_right_list">
            <div
              class="receive_tc_box_right_list_detail"
              v-for="member in tempSelectedRecipients"
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
import { getTeacherNoticeList } from '@/api/modules/teacher'

export default {
  name: 'Message',
  data() {
    return {
      showDetail: false,
      showDialog: false,
      showDialogReceive: false,
      messageContent: '',
      activeTab: 'sent',
      currentDetail: null,
      keyword: '',
      loading: false,

      // 发消息弹窗
      selectedRecipients: [],
      tempSelectedRecipients: [],
      selectedImages: [],
      selectedFiles: [],

      // 选择接收人弹窗
      receiveActiveTab: 'teacher',
      teacherClasses: [
        {
          id: 1,
          name: '铂金班',
          expanded: true,
          members: [
            { id: 101, name: '立升老师-王明' },
            { id: 102, name: '立升老师-李华' },
            { id: 103, name: '立升老师-张伟' }
          ]
        },
        {
          id: 2,
          name: '黄金班',
          expanded: false,
          members: [
            { id: 201, name: '立升老师-陈杰' },
            { id: 202, name: '立升老师-刘明' },
            { id: 203, name: '立升老师-赵磊' }
          ]
        },
        {
          id: 3,
          name: '钻石班',
          expanded: false,
          members: [
            { id: 301, name: '立升老师-孙倩' },
            { id: 302, name: '立升老师-周杰' }
          ]
        }
      ],
      studentClasses: [
        {
          id: 1,
          name: '铂金班',
          expanded: true,
          members: [
            { id: 1001, name: '铂金班-小明' },
            { id: 1002, name: '铂金班-小红' },
            { id: 1003, name: '铂金班-小华' }
          ]
        },
        {
          id: 2,
          name: '黄金班',
          expanded: false,
          members: [
            { id: 2001, name: '黄金班-小李' },
            { id: 2002, name: '黄金班-小张' },
            { id: 2003, name: '黄金班-小刘' }
          ]
        },
        {
          id: 3,
          name: '钻石班',
          expanded: false,
          members: [
            { id: 3001, name: '钻石班-小王' },
            { id: 3002, name: '钻石班-小陈' }
          ]
        }
      ],

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
        const list = (res.data || []).map(item => ({
          id: item.id,
          itemId: item.itemId,
          sender: item.sendPersonName || item.sendPerson || '',
          sendPerson: item.sendPerson,
          time: item.sendTime || '',
          content: item.content || '',
          attachCount: 0,
          hasImage: false,
          files: []
        }))
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
    switchTab(tab) {
      this.activeTab = tab
      this.showDetail = false
      this.currentDetail = null
      this.fetchMessages()
    },
    handleDetail(item) {
      this.currentDetail = item
      this.showDetail = true
    },

    // 发消息弹窗
    openSendDialog() {
      this.showDialog = true
    },
    onDialogCancel() {
      this.showDialog = false
    },
    onDialogConfirm() {
      if (this.selectedRecipients.length === 0) {
        this.$message({ message: '请选择接收人', type: 'warning' })
        return
      }
      if (!this.messageContent.trim()) {
        this.$message({ message: '请输入消息内容', type: 'warning' })
        return
      }
      const today = new Date()
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const newMsg = {
        id: Date.now(),
        sender: '管理员',
        time: dateStr,
        content: this.messageContent.trim(),
        attachCount: this.selectedImages.length + this.selectedFiles.length,
        hasImage: this.selectedImages.length > 0,
        files: this.selectedFiles.map(f => ({ name: f.name, size: f.size }))
      }
      this.sentMessages.unshift(newMsg)
      this.resetSendDialog()
      this.showDialog = false
      this.$message({ message: '发送成功', type: 'success' })
    },
    resetSendDialog() {
      this.messageContent = ''
      this.selectedRecipients = []
      this.selectedImages = []
      this.selectedFiles = []
    },

    // 接收人相关
    handleChooseReceive() {
      this.tempSelectedRecipients = this.selectedRecipients.map(r => ({ ...r }))
      this.showDialogReceive = true
    },
    removeRecipient(index) {
      this.selectedRecipients.splice(index, 1)
    },
    onDialogCancelReceive() {
      this.showDialogReceive = false
    },
    onDialogConfirmReceive() {
      this.selectedRecipients = this.tempSelectedRecipients.map(r => ({ ...r }))
      this.showDialogReceive = false
    },

    // 接收人弹窗内部操作
    toggleClassExpand(classItem) {
      classItem.expanded = !classItem.expanded
    },
    isMemberSelected(member) {
      return this.tempSelectedRecipients.some(r => r.id === member.id)
    },
    isClassAllSelected(classItem) {
      return classItem.members.length > 0 && classItem.members.every(m => this.isMemberSelected(m))
    },
    toggleClassSelect(classItem) {
      const allSelected = this.isClassAllSelected(classItem)
      if (allSelected) {
        classItem.members.forEach(member => {
          const idx = this.tempSelectedRecipients.findIndex(r => r.id === member.id)
          if (idx !== -1) this.tempSelectedRecipients.splice(idx, 1)
        })
      } else {
        classItem.members.forEach(member => {
          if (!this.isMemberSelected(member)) {
            this.tempSelectedRecipients.push({ id: member.id, name: member.name })
          }
        })
      }
    },
    toggleMemberSelect(member) {
      const idx = this.tempSelectedRecipients.findIndex(r => r.id === member.id)
      if (idx === -1) {
        this.tempSelectedRecipients.push({ id: member.id, name: member.name })
      } else {
        this.tempSelectedRecipients.splice(idx, 1)
      }
    },
    removeTempRecipient(member) {
      const idx = this.tempSelectedRecipients.findIndex(r => r.id === member.id)
      if (idx !== -1) this.tempSelectedRecipients.splice(idx, 1)
    },

    // 图片上传
    uploadImage() {
      this.$refs.imageInput.click()
    },
    onImageFileChange(e) {
      Array.from(e.target.files).forEach(file => {
        const url = URL.createObjectURL(file)
        this.selectedImages.push({ name: file.name, url })
      })
      e.target.value = ''
    },
    removeImage(index) {
      this.selectedImages.splice(index, 1)
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
        this.selectedFiles.push({ name: file.name, size })
      })
      e.target.value = ''
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.page-placeholder{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
    padding: 0 0 16px 0;
  box-sizing: border-box;
}
.app_top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}
.app_top_left{
  width: 300px;
  height: 68px;
background: #FFFFFF;
display: flex;
justify-content: center;
align-items: center;
gap: 8px;
cursor: pointer;
}
.app_top_left_text{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_top_left_icon{
  width: 16px;
  height: 16px;
}
.app_top_right{
  background: #ffffff;
  position: relative;
  flex: 1;
  width: 0;
  display: flex;
   height: 68px;
  justify-content: center;
  align-items: center;
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_top_right_back{
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  width: 7px;
  height: 14px;
  cursor: pointer;
}
.app_last{
  gap: 4px;
  flex: 1;
  height: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
}
.app_last_left{
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
border-radius: 4px 4px 4px 4px;
}
.app_last_left_detail{
  cursor: pointer;
  width: 100%;
  height: 68px;
  background: #F0F3F6;
border-radius: 4px 4px 4px 4px;
padding-left: 24px;
line-height: 68px;
color: #333333;
font-size: 16px;
}
.app_last_left_detail_active{
  width: 100%;
  height: 68px;
  background: #CAD9FF;
border-radius: 4px 4px 4px 4px;
padding-left: 24px;
line-height: 68px;
color: #0049FF;
font-size: 16px;
}
.app_last_right{
  flex: 1;
  width: 0;
  overflow: auto;
  padding-left: 16px;
  padding-top: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.app_last_right_detail{
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 4px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 17px;
  cursor: pointer;
}
.app_last_right_detail_img{
  width: 68px;
  height: 68px;
  border-radius: 4px;
}
.app_last_right_detail_mess{
  flex: 1;
  width: 0;

}
.app_last_right_detail_mess_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.app_last_right_detail_mess_top_left{
   display: flex;
  justify-content: flex-start;
  align-items:flex-end;
  gap: 8px;
}
.app_last_right_detail_mess_top_name{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_last_right_detail_mess_top_file{
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 8px;
}
.app_last_right_detail_mess_top_file_sx{
  width: 1px;
  height: 11px;
  background: #D9D9D9;

}
.app_last_right_detail_mess_top_file_icon{
  width: 15px;
  height: 14px;
}
.app_last_right_detail_mess_top_file_text{
  font-weight: 400;
font-size: 14px;
color: #666666;
}
.app_last_right_detail_mess_top_time{
  font-weight: 400;
font-size: 12px;
color: #999999;
align-self: flex-end;
}
.app_last_right_detail_mess_top_options{
  width: 20px;
  height: 4px;
}
.app_last_right_detail_mess_con{
  margin-top: 10px;
  width: 100%;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  color: #999999;
  font-size: 14px;
  line-height: 22px;
}
.app_last_right_detailBOX{
  width: 100%;
  padding: 12px;
  background: #ffffff;
  border-radius: 4px;
}
.app_last_right_detailBOX_top{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 8px;
}
.app_last_right_detailBOX_last{
  width: 100%;
  margin-top: 20px;
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
}
.app_last_right_detailBOX_last_img{
  width: 88px;
  height: 88px;
  border-radius: 4px;
}
.app_last_right_detailBOX_last_file{
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
.app_last_right_detailBOX_last_file_icon{
  width: 36px;
  height: 36px;
}
.app_last_right_detailBOX_last_file_mess{
  flex: 1;
  width: 0;
}
.app_last_right_detailBOX_last_file_mess_title{
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.app_last_right_detailBOX_last_file_mess_size{
font-weight: 400;
font-size: 14px;
color: #999999;
margin-top: 5px;
}
.app_last_right_detail_mess_con_full{
  -webkit-line-clamp: unset;
  overflow: visible;
}




.dialog_con{
  width: 100%;
}
.dialog_con_top{
  border-radius: 8px 8px 8px 8px;
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
.dialog_con_top_left{
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
}
.dialog_con_top_btn{
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}
.dialog_con_top_left_detail{
  height: 32px;
  display: inline-flex;
  border-radius: 4px 4px 4px 4px;
  padding: 0 14px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  background: #CAD9FF;
  flex-shrink: 0;
}
.dialog_con_top_left_detail_name{
  color: #333333;
  font-size: 14px;
  white-space: nowrap;
}
.dialog_con_top_left_detail_close{
  width: 16px;
  height: 16px;
}
.dialog_con_top_left_empty{
  font-weight: 400;
font-size: 16px;
color: #999999;
}
.dialog_con_last{
  width: 100%;
  margin-top: 16px;
  background: #ffffff;
  padding: 11px 20px 16px 17px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.dialog_con_last_con{
  min-height: 228px;
  width: 100%;
}
.dialog_con_last_btn{
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}
.dialog_con_last_btn_file{
  width: 19px;
  height: 18px;
  cursor: pointer;
}
.dialog_con_last_btn_img{
   width: 19px;
  height: 18px;
  cursor: pointer;
}
::v-deep .el-textarea__inner{
  padding: 0!important;
  border: none!important;
  color: #333333!important;
  font-size: 16px!important;
}
::v-deep .el-textarea__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}
.dialog_con_last_con_other{
  width: 100%;
  margin-top: 19px;
  display: flex;
  justify-content: flex-start;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.dialog_con_last_con_other_img{
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 4px 4px 4px 4px;
}
.dialog_con_last_con_other_img_img{
  width: 100%;
  height: 100%;
  border-radius: 4px 4px 4px 4px;
  object-fit: cover;
}
.dialog_con_last_con_other_img_close{
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.dialog_con_last_con_other_file{
  position: relative;
  width: 214px;
height: 56px;
background: #F3F4F8;
border-radius: 4px 4px 4px 4px;
padding: 0 12px;
box-sizing: border-box;
display: flex;
justify-content: flex-start;
align-items: center;
gap: 8px;
}
.dialog_con_last_con_other_file_mess{
  flex: 1;
  width: 0;
}
.dialog_con_last_con_other_file_mess_title{
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.dialog_con_last_con_other_file_fm{
  width: 36px;
  height: 36px;
}
.dialog_con_last_con_other_file_mess_size{
  font-weight: 400;
font-size: 14px;
color: #999999;
margin-top: 5px;
}


.receive_tc_box{
  width: 100%;
  display: flex;
  justify-content: space-between;
  height: 100%;

  gap: 12px;
}
.receive_tc_box_left{
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  gap: 12px;
  width: 361px;
}
.receive_tc_box_left_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 9px;
}
.receive_tc_box_left_top_detail{
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
.receive_tc_box_left_top_detail_active{
  background: #0049FF!important;
  color: #FFFFFF!important;
  font-weight: bold;
}
.receive_tc_box_left_list{
  flex: 1;
  height: 0;
  background:#FFFFFF ;
  border-radius: 8px;
  overflow: auto;
  padding: 14px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 16px;
}
.receive_tc_box_left_list_detail{
  width: 100%;
}
.receive_tc_box_left_list_detail_class{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_class_xl{
  width: 8px;
  height: 8px;
}
.receive_tc_box_left_list_detail_class_tag{
  margin: 0 6px 0 12px;
  width: 14px;
  height: 14px;
}
.receive_tc_box_left_list_detail_class_choose{
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_class_title{
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

.receive_tc_box_left_list_detail_second{
  padding-left: 18px;
  box-sizing: border-box;
  width: 100%;
   margin-top: 16px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-direction: column;
}
.receive_tc_box_left_list_detail_second_detail{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.receive_tc_box_left_list_detail_second_detail_fm{
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_left_list_detail_second_detail_name{
  flex: 1;
  width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.receive_tc_box_right{
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px ;
  padding: 8px 0;
  box-sizing: border-box;
}
.receive_tc_box_right_top{
  font-weight: 400;
font-size: 14px;
color: #333333;
  padding: 0px 17px;
  box-sizing: border-box;
}
.receive_tc_box_right_top span{
  font-size: 20px;
  font-weight: bold;
}
.receive_tc_box_right_list{
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
.receive_tc_box_right_list_detail{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.receive_tc_box_right_list_detail_head{
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.receive_tc_box_right_list_detail_close{
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.receive_tc_box_right_list_detail_title{
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
