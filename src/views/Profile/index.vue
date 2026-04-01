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
      <div class="logout-wrap">
        <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  name: 'Profile',
  computed: mapGetters('user', ['userInfo']),
  methods: {
    ...mapActions('user', ['logout']),
    async handleLogout() {
      await this.$store.dispatch('user/logout')
      // this.$router.push('/login')
    }
  }
}
</script>

<style lang="scss" scoped>
.page-title { font-size: 20px; font-weight: 600; margin: 0 0 20px; }
.logout-wrap { margin-top: 24px; text-align: right; }
</style>
