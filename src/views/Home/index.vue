<template>
  <div class="home-page">
    <h2 class="page-title">首页</h2>

    <!-- 数据概览卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col
        v-for="item in statCards"
        :key="item.key"
        :xs="24" :sm="12" :md="6"
      >
        <div class="stat-card">
          <div class="stat-icon" :style="{ background: item.bg }">
            <i :class="item.icon" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ item.label }}</p>
            <p class="stat-value">{{ item.value }}</p>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      statCards: [
        { key: 'live', label: '直播场次', value: '--', icon: 'el-icon-video-camera', bg: 'rgba(64,158,255,0.12)' },
        { key: 'watch', label: '累计观看', value: '--', icon: 'el-icon-view', bg: 'rgba(103,194,58,0.12)' },
        { key: 'fans', label: '粉丝数量', value: '--', icon: 'el-icon-star-on', bg: 'rgba(230,162,60,0.12)' },
        { key: 'income', label: '累计收益', value: '--', icon: 'el-icon-wallet', bg: 'rgba(245,108,108,0.12)' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page { padding: 0; }

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 20px;
}

.stats-row { margin-bottom: 24px; }

.stat-card {
  @include flex($align: center);
  gap: 16px;
  padding: 20px;
  background: $bg-white;
  border-radius: $border-radius-md;
  box-shadow: $shadow-sm;
  transition: box-shadow $transition-fast;
  &:hover { box-shadow: $shadow-md; }
}

.stat-icon {
  @include flex-center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
  i { font-size: 24px; color: $color-primary; }
}

.stat-info {
  min-width: 0;
  .stat-label { font-size: 13px; color: $text-secondary; margin: 0 0 4px; }
  .stat-value { font-size: 24px; font-weight: 700; color: $text-primary; margin: 0; }
}
</style>
