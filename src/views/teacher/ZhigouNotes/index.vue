<template>
  <div class="zhigou-notes-page">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-bar__left">
        <div class="filter-search">
          <img src="@/assets/images/liveClass/search.png" class="filter-search__icon" alt="" />
          <input
            v-model="searchKeyword"
            type="text"
            class="filter-search__input"
            placeholder="搜索知构笔记名称、关键字"
            @keydown.enter.prevent="handleSearch"
            @blur="handleSearch"
          />
          <i
            v-if="searchKeyword"
            class="el-icon-circle-close filter-search__clear"
            @mousedown.prevent="clearSearch"
          />
        </div>

        <div class="filter-item">
          <span class="filter-item__label">科目</span>
          <div class="filter-item__control filter-item__control--select">
            <div class="ls_class_select_wrap">
              <el-select
                v-model="subjectId"
                placeholder="全部科目"
                size="mini"
                class="ls_class_select"
                @change="handleSearch"
              >
                <el-option label="全部科目" value="" />
                <el-option
                  v-for="opt in subjectOptions"
                  :key="opt.id"
                  :label="opt.name"
                  :value="opt.id"
                />
              </el-select>
              <i class="el-icon-arrow-down ls_class_select_arrow" />
            </div>
          </div>
        </div>

        <div class="filter-item">
          <span class="filter-item__label">时间</span>
          <div class="filter-item__control filter-item__control--picker filter-item__control--datetime">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              :picker-options="datePickerOptions"
              class="ls_date_picker"
              size="mini"
              @change="handleSearch"
            />
            <img src="@/assets/images/class/rl_icon.png" class="filter-item__icon" alt="" />
          </div>
        </div>
      </div>

      <!-- 全部笔记态：浅色「重点笔记」；重点笔记态：实心「全部笔记」 -->
      <div
        class="filter-bar__btn"
        :class="{ 'is-soft': noteMode === 'all' }"
        @click="toggleNoteMode"
      >
        {{ noteMode === 'all' ? '重点笔记' : '全部笔记' }}
      </div>
    </div>

    <!-- 数量统计 -->
    <div class="notes-count">共 {{ total }} 条笔记</div>

    <!-- 笔记卡片网格 -->
    <div class="notes-grid" v-loading="loading">
      <div
        v-for="item in noteList"
        :key="item.id || item.historyLessonId"
        class="note-card"
        @click="openNote(item)"
      >
        <div class="note-card__cover">
          <img
            v-if="item.cover"
            :src="item.cover"
            class="note-card__cover-img"
            alt=""
          />

          <div
            class="note-card__star"
            :class="{ active: item.isPoint === '1' }"
            @click.stop="toggleImportant(item)"
          >
            <i class="el-icon-star-on" v-if="item.isPoint === '1'" />
            <i class="el-icon-star-off" v-else />
          </div>
        </div>

        <div class="note-card__body">
          <div class="note-card__meta">
            <span class="note-card__subject" v-if=" item.subjectName ">{{ item.subjectName || '未分类' }}</span>
            <span class="note-card__time">{{ formatTime(item.generationTime) }}</span>
          </div>
          <div class="note-card__title" :title="item.name">{{ item.name }}</div>
          <div class="note-card__teacher">主讲：{{ item.teacherName2 || item.teacherName || '-' }}</div>
          <div class="note-card__desc" v-if="item.summary">{{ item.summary || '暂无总结' }}</div>
        </div>
      </div>
    </div>

    <empty-state
      v-if="!loading && noteList.length === 0"
      description="暂无知构笔记"
    />

    <div class="ls_pagination" v-if="total > pageSize">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import EmptyState from '@/components/EmptyState/index.vue'
import { getSubjectOptions, getNoteList, updateNoteIsPoint } from '@/api/modules/teacher'
import { getUserInfo } from '@/utils/auth'

export default {
  name: 'ZhigouNotes',
  components: { EmptyState },
  data() {
    return {
      loading: false,
      searchKeyword: '',
      subjectId: '',
      dateRange: null,
      noteMode: 'all', // all | important
      subjectOptions: [],
      noteList: [],
      pageNum: 1,
      pageSize: 8,
      total: 0,
      datePickerOptions: {
        disabledDate: (time) => time.getTime() > Date.now()
      }
    }
  },
  created() {
    this.fetchSubjectOptions()
    this.fetchNoteList()
  },
  methods: {
    async fetchSubjectOptions() {
      try {
        const res = await getSubjectOptions()
        this.subjectOptions = (res && res.data) ? res.data : []
      } catch (e) {
        console.log(e, 'fetchSubjectOptions error')
        this.subjectOptions = []
      }
    },

    async fetchNoteList() {
      this.loading = true
      try {
        const params = {
          pageNum: this.pageNum,
          pageSize: this.pageSize
        }
        const keyword = (this.searchKeyword || '').trim()
        if (keyword) params.keyword = keyword
        if (this.subjectId) params.subjectId = this.subjectId
        if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0]) {
          params.startDate = this.dateRange[0]
          params.endDate = this.dateRange[1]
        }
        if (this.noteMode === 'important') {
          params.isPoint = '1'
        }

        const res = await getNoteList(params)
        const data = (res && res.data) ? res.data : {}
        this.noteList = data.list || []
        this.total = data.total || 0
      } catch (e) {
        console.log(e, 'fetchNoteList error')
        this.noteList = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.pageNum = 1
      this.fetchNoteList()
    },

    clearSearch() {
      this.searchKeyword = ''
      this.handleSearch()
    },

    handlePageChange(page) {
      this.pageNum = page
      this.fetchNoteList()
    },

    toggleNoteMode() {
      this.noteMode = this.noteMode === 'all' ? 'important' : 'all'
      this.pageNum = 1
      this.fetchNoteList()
    },

    async toggleImportant(item) {
      const nextIsPoint = item.isPoint === '1' ? '2' : '1'
      const prevIsPoint = item.isPoint
      item.isPoint = nextIsPoint
      try {
        await updateNoteIsPoint({
          id: item.id || item.historyLessonId,
          isPoint: nextIsPoint
        })
        await this.fetchNoteList()
      } catch (e) {
        item.isPoint = prevIsPoint
        console.log(e, 'toggleImportant error')
      }
    },

    formatTime(timeStr) {
      if (!timeStr) return ''
      // yyyy-MM-dd HH:mm:ss → yyyy.MM.dd HH:mm
      const text = String(timeStr).replace(/-/g, '.')
      return text.length >= 16 ? text.substring(0, 16) : text
    },

    openNote(item) {
      if (!item.taskUuid) {
        this.$message.warning('该笔记暂未生成听记内容')
        return
      }
      const fileList = item.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')
      const userInfo = getUserInfo() || {}
      this.$router.push({
        name: 'AIListening',
        query: {
          videoUrl: mainFile ? mainFile.filePath || '' : '',
          teacherVideoUrl: teacherFile ? teacherFile.filePath || '' : '',
          meetingId: item.taskUuid,
          meetingTitle: item.name || '',
          scopeText: item.taskUuid,
          liveLessonId: item.liveLessonId || '',
          historyLessonId: item.historyLessonId || item.id || '',
          teacherId: item.teacherId || ''
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.zhigou-notes-page {
  height: 100%;
  box-sizing: border-box;
  padding: 28px 24px 80px;
  overflow-y: auto;
}

/* ── 顶部筛选栏 ─────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 0 16px;
  height: 74px;
  box-sizing: border-box;
  box-shadow: 0px 1px 2px -1px rgba(0, 0, 0, 0.1),
    0px 1px 3px 0px rgba(0, 0, 0, 0.1),
    0px 0px 0px 1px rgba(226, 232, 240, 0.8);
  border-radius: 12px;

  &__left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    min-width: 0;
  }

  &__btn {
    flex-shrink: 0;
    width: 96px;
    height: 40px;
    background: #EFF6FF;
    border-radius: 12px 12px 12px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: #1F7CFF;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.92;
    }

    &.is-soft {
      background: #eff6ff;
      color: #1f7cff;
      box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;

      &:hover {
        background: #dbeafe;
        opacity: 1;
      }
    }
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  &__label {
    font-size: 14px;
    color: #45556c;
    white-space: nowrap;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 12px;
    background: #ffffff;
    box-shadow: 0px 1px 2px -1px rgba(0, 0, 0, 0.1),
      0px 1px 3px 0px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    min-width: 132px;
    box-sizing: border-box;

    &--select {
      min-width: 140px;
      cursor: default;
      padding-right: 8px;
    }

    &--picker {
      min-width: 240px;
      cursor: default;
    }

    &--datetime {
      min-width: 260px;
    }
  }

  &__icon {
    width: 15px;
    height: 15px;
    object-fit: contain;
    opacity: 0.6;
    flex-shrink: 0;
    pointer-events: none;
  }
}

.filter-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  width: 300px;
  flex-shrink: 0;

  &__icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none !important;
    outline: none;
    background: transparent !important;
    font-size: 14px;
    color: #314158;

    &::placeholder {
      color: #90a1b9 !important;
      font-size: 14px !important;
    }
  }

  &__clear {
    flex-shrink: 0;
    font-size: 14px;
    color: #94A3B8;
    cursor: pointer;
    line-height: 1;

    &:hover {
      color: #64748B;
    }
  }
}

.ls_class_select_wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.ls_class_select_arrow {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.ls_class_select {
  width: 120px;

  ::v-deep .el-input__inner {
    border: none;
    box-shadow: none;
    font-size: 14px;
    color: #1d293d;
    background: transparent;
    padding-left: 0;
    padding-right: 22px;
    height: 38px;
    line-height: 38px;
  }

  ::v-deep .el-select__caret {
    display: none !important;
  }

  ::v-deep .el-input {
    font-size: 14px;
  }
}

.ls_date_picker {
  flex: 1;
  width: auto !important;

  ::v-deep .el-range-editor {
    border: none;
    box-shadow: none;
    padding: 0;
    height: auto;
    background: transparent;
    width: 100%;
    &:hover,
    &.is-active {
      border: none;
      box-shadow: none;
    }
  }
  ::v-deep .el-range-input {
    font-size: 14px;
    color: #1D293D;
    background: transparent;
    width: 88px;
  }
  ::v-deep .el-range-separator {
    font-size: 14px;
    color: #1D293D;
    padding: 0 4px;
    line-height: normal;
    width: auto;
  }
  ::v-deep .el-range__icon {
    display: none;
  }
  ::v-deep .el-range__close-icon {
    font-size: 14px;
  }
}

.filter-item__control--picker ::v-deep .el-input__inner {
  border: none !important;
}

/* ── 数量 ───────────────────────────────────────────────────── */
.notes-count {
  margin: 20px 0 17px;
  font-size: 14px;
  color: #45556C;
  line-height: 1;
}

/* ── 卡片网格 ───────────────────────────────────────────────── */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.note-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 1px 2px -1px rgba(0, 0, 0, 0.1),
    0px 1px 3px 0px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0px 4px 16px rgba(15, 23, 42, 0.1);
    transform: translateY(-2px);
  }

  &__cover {
    position: relative;
    width: 100%;
    height: 152.31px;
    overflow: hidden;
    background: #e2e8f0;
  }

  &__cover-img {
    width: 100%;
    height: 100%;
    // object-fit: cover;
    display: block;
  }

  &__star {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.9);
    box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
    border-radius: 10px 10px 10px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    cursor: pointer;

    i {
      font-size: 18px;
      color: #94a3b8;
    }

    &.active i {
      color: #FFB900;
    }

    &:hover {
      background: #ffffff;
    }
  }

  &__body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    flex: 1;
    box-sizing: border-box;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__subject {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    line-height: 1;
    white-space: nowrap;
    background: #EFF6FF;
    color: #1f7cff;
  }

  &__time {
    font-size: 12px;
    color: #90A1B9;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: bold;
    color: #020618;
    line-height: 1.4;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__teacher {
    font-size: 12px;
    color: #62748E;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  &__desc {
    flex: 1;
    padding: 10px 12px;
    background: #F8FAFC;
    border-radius: 10px 10px 10px 10px;
    font-size: 12px;
    color: #62748E;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }
}

.ls_pagination {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 12px 0;
  background: #fff;
  box-shadow: 0 -2px 8px 0 rgba(0, 0, 0, 0.06);
  z-index: 100;
}

/* ── 响应式 ─────────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .notes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .notes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-wrap: wrap;
    height: auto;
    padding: 14px 16px;
    gap: 12px;
  }

  .filter-bar__left {
    flex-wrap: wrap;
  }

  .filter-search {
    width: 100%;
    max-width: 360px;
  }
}

@media (max-width: 768px) {
  .zhigou-notes-page {
    padding: 16px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
