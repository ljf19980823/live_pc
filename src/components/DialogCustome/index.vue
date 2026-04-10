<template>
  <div class="mask" v-if="visible" @click.self="handleCancel">
     <div class="mask_con">
       <div class="masl_con_dialog" :style="{ width: width, height: height }">
           <img src="@/assets/images/close.png" class="dialog_close" alt="" @click="handleClose">
           <div class="masl_con_dialog_top">{{ title }}</div>
           <div class="masl_con_dialog_center">
             <slot></slot>
           </div>
           <div class="masl_con_dialog_last" v-if="showCancel || showConfirm">
              <div class="masl_con_dialog_last_cancel" v-if="showCancel" @click="handleCancel">{{ cancelText }}</div>
              <div class="masl_con_dialog_last_cobfirm" v-if="showConfirm" @click="handleConfirm">{{ confirmText }}</div>
           </div>
       </div>
     </div>
  </div>
</template>

<script>
export default {
  name: 'DialogCustome',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '发消息'
    },
    width: {
      type: String,
      default: '616px'
    },
    height: {
      type: String,
      default: '491px'
    },
    // :show-cancel="false"
    showCancel: {
      type: Boolean,
      default: true
    },
    showConfirm: {
      type: Boolean,
      default: true
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    confirmText: {
      type: String,
      default: '确定'
    }
  },
  methods: {
    handleCancel() {
      this.$emit('cancel')
    },
    handleConfirm() {
      this.$emit('confirm')
    },
    handleClose() {
      this.$emit('close')
    },
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
  z-index: 1000000;
}
.mask_con{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.masl_con_dialog{
    position: relative;
    background: #F3F4F8;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-direction: column;
}
.masl_con_dialog_top{
    width: 100%;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
font-size: 16px;
color: #333333;
border-radius: 16px 16px 0px 0px;
background: #ffffff;
}
.masl_con_dialog_center{
    flex: 1;
    height: 0;
    overflow: auto;
    background: #F3F4F8;
    padding: 16px;
    box-sizing: border-box;
}
.masl_con_dialog_last{
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 69px;
    border-radius: 0px 0px 16px 16px;
    background: #FFFFFF;
}
.masl_con_dialog_last_cancel{
    flex: 1;
    width: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
font-size: 16px;
color: #333333;
cursor: pointer;
}
.masl_con_dialog_last_cobfirm{
    flex: 1;
    width: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
font-size: 16px;
color: #0049FF;
border-left: 1px solid #F3F4F8;
box-sizing: border-box;
cursor: pointer;
}
.dialog_close{
  position: absolute;
  width: 30px;
  height: 30px;
  top: -30px;
  right: -30px;
  cursor: pointer;
}
</style>
