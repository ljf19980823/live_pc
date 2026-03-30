<template>
  <div class="error-page">
    <el-result icon="error" title="403" sub-title="抱歉，您没有权限访问此页面">
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script>
export default { name: 'Error403' }
</script>

<style lang="scss" scoped>
.error-page { @include flex-center; min-height: 100vh; }
</style>
