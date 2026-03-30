<template>
  <div class="pagination-container" :class="{ hidden: !total }">
    <el-pagination
      :current-page.sync="currentPage"
      :page-sizes="pageSizes"
      :page-size.sync="pageSize"
      :layout="layout"
      :total="total"
      :background="background"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    total: { type: Number, required: true },
    page: { type: Number, default: 1 },
    limit: { type: Number, default: 20 },
    pageSizes: { type: Array, default: () => [10, 20, 30, 50] },
    layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
    background: { type: Boolean, default: true }
  },
  computed: {
    currentPage: {
      get() { return this.page },
      set(val) { this.$emit('update:page', val) }
    },
    pageSize: {
      get() { return this.limit },
      set(val) { this.$emit('update:limit', val) }
    }
  },
  methods: {
    handleSizeChange(val) {
      this.$emit('update:limit', val)
      this.$emit('pagination', { page: 1, limit: val })
    },
    handleCurrentChange(val) {
      this.$emit('update:page', val)
      this.$emit('pagination', { page: val, limit: this.pageSize })
    }
  }
}
</script>

<style lang="scss" scoped>
.pagination-container {
  padding: 16px 0;
  @include flex-between;
  &.hidden { display: none; }
}
</style>
