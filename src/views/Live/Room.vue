<template>
  <div class="live-room-page">
    <el-page-header @back="$router.back()" content="直播间" />
    <div class="room-content">
      <EmptyState description="直播间功能开发中" />
    </div>
  </div>
</template>

<script>
export default { name: 'LiveRoom' }
</script>

<style lang="scss" scoped>
.live-room-page { padding: 16px 0; }
.room-content { margin-top: 24px; }
</style>
