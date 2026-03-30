<template>
  <div class="profile-page">
    <h2 class="page-title">个人中心</h2>
    <el-card shadow="never">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ userInfo.name || '--' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userInfo.phone || '--' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email || '--' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ userInfo.createdAt || '--' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Profile',
  computed: mapGetters('user', ['userInfo'])
}
</script>

<style lang="scss" scoped>
.page-title { font-size: 20px; font-weight: 600; margin: 0 0 20px; }
</style>
