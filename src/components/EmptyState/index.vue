<template>
  <div class="empty-state">
    <el-empty :description="description" :image="image" :image-size="imageSize">
      <slot />
    </el-empty>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    description: { type: String, default: '暂无数据' },
    image: { type: String, default: '' },
    imageSize: { type: Number, default: 120 }
  }
}
</script>

<style lang="scss" scoped>
.empty-state {
  @include flex-center;
  padding: 40px 0;
  width: 100%;
}
</style>
