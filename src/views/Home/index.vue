<template>
  <div class="app_container">
    <div class="app_container_top">
      <img src="@/assets/images/such.png" class="app_container_top_img" alt="">
    </div>
    <div class="app_container_last">
      <div class="app_container_last_left">
        <div class="app_container_last_left_top"></div>
      </div>
      <div class="app_container_last_right"></div>
    </div>
  </div>
</template>
<style scoped>
.app_container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 15px;

}
.app_container_top{
  width: 100%;
  height: 296px;
  border-radius: 15px 15px 15px 15px;
}
.app_container_top_img{
  width: 100%;
  height: 100%;
}
.app_container_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: space-between;
  gap: 15px;
}
.app_container_last_left{
  background: #ffffff;
  border-radius: 15px;
  width:72%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 17px;
}
</style>