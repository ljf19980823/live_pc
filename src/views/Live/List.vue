<template>
  <div class="live-list-page">
    <div class="page-header">
      <h2 class="page-title">直播列表</h2>
      <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
        创建直播间
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="直播标题">
          <el-input v-model="queryForm.title" placeholder="请输入" clearable style="width:200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable style="width:120px">
            <el-option label="未开始" :value="0" />
            <el-option label="直播中" :value="1" />
            <el-option label="已结束" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="fetchList">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="直播标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status].type" size="small">
              {{ statusMap[row.status].label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="watchCount" label="观看人数" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="handleDetail(row)">详情</el-button>
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" class="text-danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        :page.sync="queryForm.page"
        :limit.sync="queryForm.limit"
        @pagination="fetchList"
      />
    </el-card>
  </div>
</template>

<script>
import { getLiveList, deleteLive } from '@/api'

export default {
  name: 'LiveList',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      queryForm: {
        title: '',
        status: '',
        page: 1,
        limit: 20
      },
      statusMap: {
        0: { label: '未开始', type: 'info' },
        1: { label: '直播中', type: 'success' },
        2: { label: '已结束', type: '' }
      }
    }
  },
  created() {
    this.fetchList()
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const res = await getLiveList(this.queryForm)
        this.list = res.data?.list || []
        this.total = res.data?.total || 0
      } finally {
        this.loading = false
      }
    },
    resetQuery() {
      this.queryForm = { title: '', status: '', page: 1, limit: 20 }
      this.fetchList()
    },
    handleCreate() {
      this.$message.info('创建直播间功能待实现')
    },
    handleDetail(row) {
      this.$router.push(`/live/room/${row.id}`)
    },
    handleEdit(row) {
      this.$message.info(`编辑 ${row.id}`)
    },
    handleDelete(row) {
      this.$confirm(`确定删除直播间「${row.title}」？`, '警告', {
        type: 'warning',
        confirmButtonText: '删除',
        confirmButtonClass: 'el-button--danger'
      }).then(async () => {
        await deleteLive(row.id)
        this.$message.success('删除成功')
        this.fetchList()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.live-list-page {}

.page-header {
  @include flex-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.search-card { margin-bottom: 16px; }
</style>
