<template>
     <div class="mask" v-if="visible">
        <div class="mask_con">
            <div class="masl_con_dialog">
                <div class="masl_con_dialog_top">
                    <img src="@/assets/images/student/close.png" class="masl_con_dialog_top_close" alt="" @click="$emit('close')">
                    <img src="@/assets/images/student/share.png" class="masl_con_dialog_top_share" alt="" @click="openShareDialog">
                </div>
                <div class="masl_con_dialog_con">
                    <div class="masl_con_dialog_con_basic">
                        <div class="masl_con_dialog_con_basic_top">
                            <img src="@/assets/images/class/such.png" class="masl_con_dialog_con_basic_top_fm" alt="">
                            <div class="masl_con_dialog_con_basic_top_title">霸王龙</div>
                        </div>
                        <div class="masl_con_dialog_con_basic_last">
                            <div class="masl_con_dialog_con_basic_last_detail">
                                <img src="@/assets/images/student/jb.png" class="masl_con_dialog_con_basic_last_detail_icon" alt="">
                                <div class="masl_con_dialog_con_basic_last_detail_title">2026-02-06进班</div>
                            </div>
                            <div class="masl_con_dialog_con_basic_last_detail" style="cursor:pointer;" @click="openAliasDialog">
                                <img src="@/assets/images/student/bz.png" class="masl_con_dialog_con_basic_last_detail_icon" alt="">
                                <div class="masl_con_dialog_con_basic_last_detail_title">{{ aliasDisplay }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="masl_con_dialog_con_xq">
                        <div class="masl_con_dialog_con_xq_title">学情数据</div>
                        <div class="masl_con_dialog_con_xq_top">
                            <div class="masl_con_dialog_con_xq_top_left">更新时间：03-31  10:06</div>
                            <div class="masl_con_dialog_con_xq_top_right">
                                <div class="masl_con_dialog_con_xq_top_right_text">近 1 月</div>
                                <img src="@/assets/images/student/xl.png" class="masl_con_dialog_con_xq_top_right_xl" alt="">
                            </div>
                        </div>
                        <div class="masl_con_dialog_con_xq_detail">
                            <div class="masl_con_dialog_con_xq_detail_top">
                                <div class="masl_con_dialog_con_xq_detail_top_left">
                                    <img src="@/assets/images/student/sk.png" class="masl_con_dialog_con_xq_detail_top_left_icon" alt="">
                                    <div class="masl_con_dialog_con_xq_detail_top_left_title">上课</div>
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_top_right">
                                    <div class="masl_con_dialog_con_xq_detail_top_right_text">查看更多</div> 
                                    <img src="@/assets/images/student/right.png" class="masl_con_dialog_con_xq_detail_top_right_icon" alt="">
                                </div>
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_center">
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">出勤次数</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>/ 3</span>
                                    </div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_last">出勤率 0%</div>
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">上课时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      56  <span>分钟</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">观看历史课堂时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>分钟</span>
                                    </div>

                                </div>
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_last">
                                <img src="@/assets/images/student/tips.png" class="masl_con_dialog_con_xq_detail_last_icon" alt="">
                                <div class="masl_con_dialog_con_xq_detail_last_text">有3节课的在线时长低于开课时长的80%</div>
                            </div>
                        </div>
                        <div class="masl_con_dialog_con_xq_detail">
                            <div class="masl_con_dialog_con_xq_detail_top">
                                <div class="masl_con_dialog_con_xq_detail_top_left">
                                    <img src="@/assets/images/student/kc.png" class="masl_con_dialog_con_xq_detail_top_left_icon" alt="">
                                    <div class="masl_con_dialog_con_xq_detail_top_left_title">课程</div>
                                </div>
                               
                            </div>
                            <div class="masl_con_dialog_con_xq_detail_center">
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">学完任务数</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>/ 3</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">学习时长</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      56  <span>分钟</span>
                                    </div>
                                   
                                </div>
                                <div class="masl_con_dialog_con_xq_detail_center_detail">
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_title">进度</div>
                                    <div class="masl_con_dialog_con_xq_detail_center_detail_num">
                                      0  <span>%</span>
                                    </div>

                                </div>
                            </div>
                          
                        </div>
                    </div>
                </div>
            </div>
        </div>

          <!-- 添加备注弹窗 -->
    <DialogCustome width="616px" height="318px" :visible="aliasDialogVisible" title="添加备注"  @cancel="onDialogCancelAlias" @confirm="onDialogConfirmAlias">
      <div class="dialog_box2">
        <div class="dialog_box_con">
          
          <div class="dialog_box_con_input">
            <el-input v-model="aliasInput" style="width:100%" placeholder="请输入你要添加的备注" maxlength="20" show-word-limit></el-input>
          </div>
       
        </div>
      
      </div>
    </DialogCustome>

          <!-- 分享弹窗 -->
    <DialogCustome width="616px" :showClose="true" :showConfirm="false" :showCancel="false" height="449px" :visible="shareDialogVisible" title="分享"  @close="onDialogCancelShare" >
      <div class="dialog_box2">
        <div class="dialog_box2_share_text">微信/QQ扫一扫，立即分享</div>
        <img ref="shareQrImg" src="@/assets/images/codeSuch.png" class="dialog_box2_share_img" crossorigin="anonymous" alt="">
        <div class="dialog_box2_share_link">
            <div class="dialog_box2_share_link_label">链接：</div>
            <div class="dialog_box2_share_link_input">
                <div class="dialog_box2_share_link_text">{{ shareLink }}</div>
                <div class="dialog_box2_share_link_btn" @click="copyShareLink">复制</div>
            </div>
        </div>
        <div class="dialog_box2_share_btn" @click="saveQrCode">保存二维码</div>
      
      </div>
    </DialogCustome>
     </div>
</template>
<script>
import DialogCustome from '@/components/DialogCustome/index.vue'

export default {
  name: 'StudentDetail',
  components: { DialogCustome },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      aliasDialogVisible: false,
      aliasInput: '',
      savedAlias: '我是无敌霸王龙',
      shareDialogVisible: false,
      shareLink: 'http:sajhdakshkajdhakhdakssadadasda'
    }
  },
  computed: {
    aliasDisplay() {
      return this.savedAlias || '添加备注'
    }
  },
  methods: {
    openAliasDialog() {
      this.aliasInput = this.savedAlias
      this.aliasDialogVisible = true
    },
    onDialogCancelAlias() {
      this.aliasDialogVisible = false
      this.aliasInput = ''
    },
    onDialogConfirmAlias() {
      this.savedAlias = this.aliasInput
      this.aliasDialogVisible = false
    },
    openShareDialog() {
      this.shareDialogVisible = true
    },
    onDialogCancelShare() {
      this.shareDialogVisible = false
    },
    async copyShareLink() {
      try {
        await navigator.clipboard.writeText(this.shareLink)
        this.$message.success('链接已复制')
      } catch {
        const input = document.createElement('input')
        input.value = this.shareLink
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.$message.success('链接已复制')
      }
    },
    async saveQrCode() {
      const img = this.$refs.shareQrImg
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 166
      canvas.height = img.naturalHeight || 166
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      // 优先用 toBlob，Safari 不支持时降级用 toDataURL
      const getBlob = () => new Promise((resolve, reject) => {
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png')
        } else {
          // Safari 旧版降级：toDataURL -> Blob
          const dataURL = canvas.toDataURL('image/png')
          const arr = dataURL.split(',')
          const mime = arr[0].match(/:(.*?);/)[1]
          const bstr = atob(arr[1])
          let n = bstr.length
          const u8arr = new Uint8Array(n)
          while (n--) u8arr[n] = bstr.charCodeAt(n)
          resolve(new Blob([u8arr], { type: mime }))
        }
      })

      try {
        const blob = await getBlob()

        // Chrome / Edge：弹出系统文件保存对话框
        if (window.showSaveFilePicker) {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: '分享二维码.png',
            types: [{ description: 'PNG 图片', accept: { 'image/png': ['.png'] } }]
          })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
          this.$message.success('二维码已保存')
        } else {
          // Safari / Firefox：<a download> 触发下载到默认目录
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = '分享二维码.png'
          link.href = url
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.$message.error('保存失败，请重试')
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.mask{
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 51, 51, 0.60);
  z-index: 1022;
  overflow: hidden;
}
.mask_con{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.masl_con_dialog{
    width: 543px;
    height: 100%;
    position: relative;
    background: #F3F4F8;
    border-radius: 16px;
    animation: slideInFromRight 0.3s ease;
    background: url('../../assets/images/student/bg.png') no-repeat;
    background-size: 100% 100%;
    border-radius: 4px 0 0 4px;
    padding: 28px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

}
.masl_con_dialog_top{
    padding: 0 16px;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_top_close{
    width: 14px;
    height: 14px;
    cursor: pointer;
}
.masl_con_dialog_top_share{
    width: 18px;
    height: 18px;
    cursor: pointer;
}
.masl_con_dialog_con{
    padding: 0 16px;
    box-sizing: border-box;
    width: 100%;
    flex: 1;
    height: 0;
    overflow: auto;
    margin-top: 40px;
}
.masl_con_dialog_con_basic{
    width: 100%;
}
.masl_con_dialog_con_basic_top{
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
}
.masl_con_dialog_con_basic_top_fm{
    width: 56px;
    height: 56px;
    border-radius: 50%;
}
.masl_con_dialog_con_basic_top_title{
    font-weight: bold;
font-size: 20px;
color: #333333;
}
.masl_con_dialog_con_basic_last{
    width: 100%;
    margin-top: 16px;
    display: flex;
    justify-content: flex-start;
    gap: 16px;
    align-items: center;
}
.masl_con_dialog_con_basic_last_detail{
    display: inline-flex;
    // max-width: 130px;
    justify-content: flex-start;
    align-items: center;
    gap: 3px;
    padding: 0 7px;
    box-sizing: border-box;
    height: 20px;
    background: #CAD9FF;
    border-radius: 4px;
}
.masl_con_dialog_con_basic_last_detail_icon{
    width: 10px;
    height: 10px;
}
.masl_con_dialog_con_basic_last_detail_title{
    font-weight: 400;
font-size: 12px;
color: #333333;
}
.masl_con_dialog_con_xq{
    margin-top: 32px;
    width: 100%;
}
.masl_con_dialog_con_xq_title{
    font-size: 18px;
    font-weight: bold;
    color: #333333;
}
.masl_con_dialog_con_xq_top{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}
.masl_con_dialog_con_xq_top_left{
    font-weight: 400;
    font-size: 12px;
    color: #666666;
}
.masl_con_dialog_con_xq_top_right{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}
.masl_con_dialog_con_xq_top_right_text{
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_con_xq_top_right_xl{
    width: 13px;
    height: 9px;
}
.masl_con_dialog_con_xq_detail{
    width: 100%;
    margin-top: 20px;
    background: #FFFFFF;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
padding: 16px;
box-sizing: border-box;
}
.masl_con_dialog_con_xq_detail_top{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_con_xq_detail_top_left{
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 6px;
}
.masl_con_dialog_con_xq_detail_top_left_icon{
    width: 19px;
    height: 18px;
}
.masl_con_dialog_con_xq_detail_top_left_title{
font-weight: bold;
font-size: 18px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_top_right{
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    align-items: center;
    cursor: pointer;
}
.masl_con_dialog_con_xq_detail_top_right_text{
    font-weight: 400;
font-size: 12px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_top_right_icon{
    width: 4px;
    height: 8px;
}
.masl_con_dialog_con_xq_detail_center{
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.masl_con_dialog_con_xq_detail_center_detail{
    width: 149px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #D9D9D9;
padding:  11px;
box-sizing: border-box;
align-self: stretch;
}
.masl_con_dialog_con_xq_detail_center_detail_title{
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_con_xq_detail_center_detail_num{
    font-weight: bold;
font-size: 20px;
color: #333333;
margin-top: 10px;
}
.masl_con_dialog_con_xq_detail_center_detail_num span{
    font-weight: 400;
font-size: 14px;
color: #666666;
}
.masl_con_dialog_con_xq_detail_center_detail_last{
font-weight: 400;
font-size: 12px;
color: #666666;
    margin-top: 10px;
}
.masl_con_dialog_con_xq_detail_last{
    width: 100%;
    margin-top: 12px;
    height: 34px;
background: #FFEDED;
border-radius: 8px 8px 8px 8px;
border: 1px solid #FF2E00;
padding: 0 12px;
box-sizing: border-box;
display: flex;
justify-content: flex-start;
align-items: center;
gap: 9px;
}
.masl_con_dialog_con_xq_detail_last_icon{
    width: 20px;
    height: 17px;
}
.masl_con_dialog_con_xq_detail_last_text{
font-weight: 400;
font-size: 14px;
color: #FF2E00;
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}


.dialog_box2{
   width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.dialog_box_con{
  width: 100%;
  height: 63px;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 0 17px 0 29px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog_box_con_input{
  flex: 1;
  width: 0;
}

.dialog_box_con_input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
  height: 100%;
}
.dialog_box_con_input :deep(.el-input__inner) {
  color: #333333;
  font-size: 16px;
  padding-left: 0!important;
}
.dialog_box_con_input :deep(.el-input__suffix) {
  color: #999999;
}
.dialog_box_con_input ::v-deep .el-input__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}

.dialog_box2_share_text{
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.dialog_box2_share_img{
    width: 166px;
    height: 166px;
    margin-top: 11px;
}
.dialog_box2_share_link{
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 18px;
    gap: 8px;
}
.dialog_box2_share_link_label{
font-size: 14px;
color: #333333;
}
.dialog_box2_share_link_input{
    width: 282px;
    height: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 7px;
    padding: 0 0 0 7px;
    box-sizing: border-box;
    background: #FFFFFF;
border-radius: 4px 4px 4px 4px;
border: 1px solid #D9D9D9;
}
.dialog_box2_share_link_text{
    flex: 1;
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
font-size: 14px;
color: #333333;
}
.dialog_box2_share_link_btn{
    background: #0049FF;
border-radius: 0px 4px 4px 0px;
width: 59px;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
font-weight: bold;
font-size: 14px;
color: #FFFFFF;
cursor: pointer;
}
.dialog_box2_share_btn{
    width: 125px;
    height: 51px;
    background: #CAD9FF;
    border-radius: 4px;
    border: 1px solid #0049FF;
    font-weight: 400;
font-size: 16px;
color: #0049FF;
cursor: pointer;
margin-top: 27px;
display: flex;
justify-content: center;
align-items: center;
}
</style>