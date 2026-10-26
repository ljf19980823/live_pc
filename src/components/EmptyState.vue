<template>
  <div class="empty-state" role="status">
    <img class="empty-state__image" :src="imageSrc" alt="" />
    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script>
import defaultImage from '@/assets/images/noData.png'

export default {
  name: 'EmptyState',
  props: {
    image: {
      type: String,
      default: defaultImage
    },
    title: {
      type: String,
      default: '暂无数据'
    },
    description: {
      type: String,
      default: ''
    }
  },
  computed: {
    imageSrc() {
      return this.image || defaultImage
    }
  }
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  padding: 80px 24px;
  text-align: center;
}

.empty-state__image {
  display: block;
  width: 167px;
  max-width: 100%;
  height: 156px;
  object-fit: contain;
}

.empty-state__title {
  max-width: 100%;
  margin: 12px 0 0;
  color: #132B48;
  font-size: 17px;
  font-weight: 600;
  line-height: 32px;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.empty-state__description {
  /* width: 340px; */
  max-width: 100%;
  margin: 8px 0 0;
  color: #406184;
  font-size: 15px;
  line-height: 30px;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.empty-state__actions {
  margin-top: 20px;
}

@media (max-width: 480px) {
  .empty-state {
    padding: 48px 20px;
  }

  .empty-state__image {
    width: 167px;
    height: 156px;
  }

  .empty-state__title {
    font-size: 14px;
    line-height: 28px;
  }

  .empty-state__description {
    font-size: 13px;
    line-height: 24px;
  }
}
</style>
