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
          <div class="filter-item__control filter-item__control--select">
            <div class="ls_class_select_wrap">
              <el-select
                v-model="timeRange"
                placeholder="全部时间"
                size="mini"
                class="ls_class_select"
                @change="handleSearch"
              >
                <el-option
                  v-for="opt in timeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <i class="el-icon-arrow-down ls_class_select_arrow" />
            </div>
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
    <div class="notes-count">共 {{ filteredNotes.length }} 条笔记</div>

    <!-- 笔记卡片网格 -->
    <div class="notes-grid" v-loading="loading">
      <div
        v-for="item in filteredNotes"
        :key="item.id"
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
            :class="{ active: item.isImportant }"
            @click.stop="toggleImportant(item)"
          >
            <i class="el-icon-star-on" v-if="item.isImportant" />
            <i class="el-icon-star-off" v-else />
          </div>
        </div>

        <div class="note-card__body">
          <div class="note-card__meta">
            <span
              class="note-card__subject"
            
            >{{ item.subjectName }}</span>
            <span class="note-card__time">{{ item.time }}</span>
          </div>
          <div class="note-card__title" :title="item.title">{{ item.title }}</div>
          <div class="note-card__teacher">主讲：{{ item.teacherName }}</div>
          <div class="note-card__desc">{{ item.description }}</div>
        </div>
      </div>
    </div>

    <empty-state
      v-if="!loading && filteredNotes.length === 0"
      description="暂无知构笔记"
    />
  </div>
</template>

<script>
import EmptyState from '@/components/EmptyState/index.vue'

export default {
  name: 'ZhigouNotes',
  components: { EmptyState },
  data() {
    return {
      loading: false,
      searchKeyword: '',
      subjectId: '',
      timeRange: '',
      noteMode: 'all', // all | important
      subjectOptions: [
        { id: 'english', name: '英语' },
        { id: 'chinese', name: '语文' },
        { id: 'math', name: '数学' },
        { id: 'science', name: '科学' },
        { id: 'history', name: '历史' },
        { id: 'physics', name: '物理' }
      ],
      timeOptions: [
        { label: '全部时间', value: '' },
        { label: '近一周', value: 'week' },
        { label: '近一月', value: 'month' },
        { label: '近三月', value: 'quarter' }
      ],
      noteList: [
        {
          id: 1,
          title: '英语阅读精讲直播课',
          teacherName: '林老师',
          subjectName: '英语',
          subjectKey: 'english',
          time: '2026.07.16 21:20',
          description: '梳理阅读题定位、长难句拆解与选项排除方法，重点记录主旨题和细节题答题路径。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 55%, #059669 100%)',
          cover: '',
          isImportant: true
        },
        {
          id: 2,
          title: '高三语文 · 行测申论冲刺课',
          teacherName: '周老师',
          subjectName: '语文',
          subjectKey: 'chinese',
          time: '2026.07.15 19:40',
          description: '归纳作文素材与论证结构，整理申论大作文常见框架与金句表达。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 55%, #D97706 100%)',
          cover: '',
          isImportant: false
        },
        {
          id: 3,
          title: '初二数学 · 函数图像专题',
          teacherName: '陈老师',
          subjectName: '数学',
          subjectKey: 'math',
          time: '2026.07.14 20:10',
          description: '总结一次函数、二次函数图像变换规律，记录易错点与典型例题解法。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 55%, #EA580C 100%)',
          cover: '',
          isImportant: true
        },
        {
          id: 4,
          title: '科学探索暑期营 · 光学实验',
          teacherName: '赵老师',
          subjectName: '科学',
          subjectKey: 'science',
          time: '2026.07.13 16:30',
          description: '记录光的折射、反射实验步骤与结论，整理实验报告关键观察要点。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 55%, #2563EB 100%)',
          cover: '',
          isImportant: false
        },
        {
          id: 5,
          title: '高一历史 · 近代史专题复习',
          teacherName: '吴老师',
          subjectName: '历史',
          subjectKey: 'history',
          time: '2026.07.12 18:00',
          description: '梳理近代史时间轴与重大事件因果，提炼选择题高频考点与答题模板。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 55%, #DC2626 100%)',
          cover: '',
          isImportant: true
        },
        {
          id: 6,
          title: '高二物理 · 力学综合提升',
          teacherName: '郑老师',
          subjectName: '物理',
          subjectKey: 'physics',
          time: '2026.07.11 21:05',
          description: '整理受力分析、动能定理与动量守恒的综合题思路，标注易混公式。',
          badge: '行测+申论',
          coverTitle: '国省考 基础早鸟班',
          coverGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 55%, #4F46E5 100%)',
          cover: '',
          isImportant: false
        }
      ]
    }
  },
  computed: {
    filteredNotes() {
      let list = this.noteList.slice()

      if (this.noteMode === 'important') {
        list = list.filter(item => item.isImportant)
      }

      if (this.subjectId) {
        list = list.filter(item => item.subjectKey === this.subjectId)
      }

      const keyword = (this.searchKeyword || '').trim()
      if (keyword) {
        list = list.filter(item => {
          const text = `${item.title}${item.description}${item.teacherName}${item.subjectName}`
          return text.includes(keyword)
        })
      }

      return list
    }
  },
  methods: {
    handleSearch() {
      // 预留接口查询；当前为前端筛选
    },
    toggleNoteMode() {
      this.noteMode = this.noteMode === 'all' ? 'important' : 'all'
    },
    toggleImportant(item) {
      item.isImportant = !item.isImportant
    },
    openNote(item) {
      // 预留笔记详情跳转
      console.log('open note', item.id)
    }
  }
}
</script>

<style lang="scss" scoped>
.zhigou-notes-page {
  height: 100%;
  box-sizing: border-box;
  padding: 28px 24px 28px;
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
    height: 140px;
    overflow: hidden;
    background: #e2e8f0;
  }

  &__cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__cover-placeholder {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 20px 16px 18px;
    box-sizing: border-box;
  }

  &__cover-badge {
    display: inline-flex;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    background: #1f7cff;
    border-radius: 6px;
    font-size: 11px;
    color: #ffffff;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
  }

  &__cover-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 1px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    line-height: 1.35;
    max-width: 72%;
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

    &.subject-english {
      background: #eff6ff;
      color: #1f7cff;
    }

    &.subject-chinese {
      background: #f3e8ff;
      color: #9333ea;
    }

    &.subject-math {
      background: #fff7ed;
      color: #ea580c;
    }

    &.subject-science {
      background: #ecfeff;
      color: #0891b2;
    }

    &.subject-history {
      background: #fef2f2;
      color: #dc2626;
    }

    &.subject-physics {
      background: #eef2ff;
      color: #4f46e5;
    }
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
