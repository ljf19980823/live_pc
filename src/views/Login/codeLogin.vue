<template>
     <div class="app_container">
        <div class="app_container_box">
            <img src="@/assets/images/login/logo.png" class="app_container_logo" alt="">
            <div class="app_container_box_title">请使用 <span>立升云播APP</span> 扫码授课/登录</div>
            <div class="app_container_box_code_box">
                <img src="@/assets/images/login/code_such.png" class="app_container_box_code_img" alt="">
            </div>
            <div class="app_container_box_btn" @click="$router.push('/login')">账号密码登录</div>
        </div>
     </div>
</template>
<style lang="scss" scoped>
.app_container{
  
  width: 100vw;
  height: 100vh;
  
  // padding-top: 96px;
  box-sizing: border-box;
  background: url('../../assets/images/login/bg.png') no-repeat;
  background-size: 100% 100%;
}
.app_container_box{
  position: relative;
  top: -100px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
.app_container_logo{
  width: 128px;
  height: 140px;
}
.app_container_box_title{
    font-weight: bold;
font-size: 16px;
color: #333333;
margin-top: 28px;
}
.app_container_box_title span{
    color: #0049FF;
}
.app_container_box_code_box{
    margin-top: 24px;
    background: #FFFFFF;
border-radius: 8px 8px 8px 8px;
border: 1px solid #0049FF;
width: 188px;
height: 188px;
display: flex;
justify-content: center;
align-items: center;
}
.app_container_box_code_img{
    width: 170px;
    height: 170px;
}
.app_container_box_btn{
    font-weight: bold;
font-size: 14px;
color: #0049FF;
margin-top: 23px;
cursor: pointer;
}
</style>