<template>
  <div class="import-knowledge-picker">
    <el-popover ref="popover" v-model="open" trigger="click" placement="bottom-start"
      :disabled="disabled || loading" popper-class="practice-import-knowledge-popper" @show="syncTree">
      <div class="knowledge-tree-toolbar">
        <el-checkbox :value="allChecked" :indeterminate="partChecked" :disabled="disabled || loading || !knowledgeNodes.length" @change="toggleAll">全选当前章节</el-checkbox>
        <el-button type="text" :disabled="disabled || loading || !value.length" @click="toggleAll(false)">清空</el-button>
      </div>
      <el-input v-model="keyword" clearable size="small" placeholder="搜索知识点" />
      <div class="knowledge-tree-scroll">
        <el-tree ref="tree" :data="options" node-key="value" :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
          show-checkbox :check-strictly="false" default-expand-all
          :expand-on-click-node="false" :filter-node-method="filterNode" empty-text="所选章节暂无知识点" @check="emitChecked">
          <span slot-scope="{ data }" class="knowledge-tree-label" :title="data.name">{{ data.label }}</span>
        </el-tree>
      </div>
      <button slot="reference" type="button" class="knowledge-tree-reference" :disabled="disabled || loading"
        aria-haspopup="tree" :aria-expanded="String(open)">
        <span>{{ loading ? '知识点加载中...' : value.length ? `已选 ${selectedNodes.length} 个知识点` : !options.length ? '请先选择章节' : '请选择知识点' }}</span>
        <i :class="open ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" aria-hidden="true" />
      </button>
    </el-popover>
    <div v-if="selectedNodes.length" class="knowledge-tree-tags">
      <el-tag v-for="item in selectedNodes.slice(0, 3)" :key="item.value" size="small" :closable="!disabled && !loading"
        :title="item.pathLabel + '（取消此项及全部下级）'" @close="removeNode(item.value)"><span class="knowledge-tree-tag-name">{{ item.name }}</span></el-tag>
      <span v-if="selectedNodes.length > 3">+ {{ selectedNodes.length - 3 }}</span>
    </div>
  </div>
</template>

<script>
import { flattenImportCatalog } from '@/utils/topicImportCatalog'

export default {
  name: 'ImportKnowledgeTreePicker',
  props: {
    value: { type: Array, default: () => [] },
    options: { type: Array, default: () => [] },
    disabled: Boolean,
    loading: Boolean
  },
  data() { return { open: false, keyword: '' } },
  computed: {
    knowledgeNodes() { return flattenImportCatalog(this.options).filter(item => !item.group) },
    selectedNodes() {
      const selected = new Set(this.value)
      return this.knowledgeNodes.filter(item => selected.has(item.value))
    },
    allChecked() { return this.knowledgeNodes.length > 0 && this.selectedNodes.length === this.knowledgeNodes.length },
    partChecked() { return this.selectedNodes.length > 0 && !this.allChecked }
  },
  watch: {
    value() { this.syncTree() },
    options: { deep: true, handler() { this.syncTree() } },
    keyword(value) { if (this.$refs.tree) this.$refs.tree.filter(value) },
    disabled(value) { if (value) this.open = false },
    loading(value) { if (value) this.open = false }
  },
  mounted() { this.syncTree() },
  methods: {
    syncTree() {
      this.$nextTick(() => {
        if (!this.$refs.tree) return
        this.$refs.tree.setCheckedKeys(this.value)
        this.$refs.tree.filter(this.keyword)
        this.emitChecked()
        if (this.open && this.$refs.popover) this.$refs.popover.updatePopper()
      })
    },
    emitChecked() {
      if (this.disabled || this.loading || !this.$refs.tree) return
      // 章节根只承担该章全选；半选父知识点不作为已选值，沿用参考树的级联语义。
      const values = this.$refs.tree.getCheckedNodes(false).filter(item => !item.group).map(item => item.value)
      if (values.length !== this.value.length || values.some((value, index) => value !== this.value[index])) this.$emit('input', values)
    },
    toggleAll(checked) {
      if (this.disabled || this.loading || !this.$refs.tree) return
      this.$refs.tree.setCheckedKeys(checked ? this.options.map(item => item.value) : [])
      this.emitChecked()
    },
    removeNode(value) {
      if (this.disabled || this.loading || !this.$refs.tree) return
      this.$refs.tree.setChecked(value, false, true)
      this.emitChecked()
    },
    filterNode(keyword, data) {
      return !keyword || String(data.label || '').toLowerCase().includes(keyword.toLowerCase())
    }
  }
}
</script>

<style scoped>
.import-knowledge-picker { flex: 1; min-width: 0; }
.import-knowledge-picker > span { display: block; }
.knowledge-tree-reference {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; min-height: 38px; padding: 0 12px; border: 1px solid #dbe2ec;
  border-radius: 4px; background: #fff; color: #606266; font: inherit; cursor: pointer;
}
.knowledge-tree-reference[aria-expanded="true"] { border-color: #1F7CFF; }
.knowledge-tree-reference:disabled { background: #f5f7fa; color: #c0c4cc; cursor: not-allowed; }
.knowledge-tree-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.knowledge-tree-scroll { max-height: min(340px, calc(100vh - 240px)); overflow: auto; margin-top: 10px; }
.knowledge-tree-label { white-space: normal; overflow-wrap: anywhere; line-height: 20px; padding: 5px 0; }
.knowledge-tree-scroll ::v-deep .el-tree-node__content { height: auto; min-height: 32px; align-items: flex-start; }
.knowledge-tree-scroll ::v-deep .el-tree-node__expand-icon { margin-top: 4px; }
.knowledge-tree-scroll ::v-deep .el-checkbox { margin-top: 6px; }
.knowledge-tree-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; }
.knowledge-tree-tags .el-tag { display: inline-flex; align-items: center; max-width: 100%; }
.knowledge-tree-tag-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.knowledge-tree-tags ::v-deep .el-tag__close { flex-shrink: 0; }
</style>
