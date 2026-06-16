<template>
  <div class="course-page">

    <!-- ===== 课程列表视图 ===== -->
    <template v-if="currentView === 'list'">
      <!-- 顶部标题区 -->
      <div class="course-page-header">
        <div class="course-page-title-group">
          <div class="course-page-title">课程</div>
          <div class="course-page-subtitle">管理课程与学习任务。</div>
        </div>
        <div class="course-page-header-right">
          <div class="course-tab-group">
            <button
              :class="['course-tab-btn', activeTab === 'all' ? 'active' : '']"
              @click="activeTab = 'all'"
            >全部课程</button>
            <button
              :class="['course-tab-btn', activeTab === 'recent' ? 'active' : '']"
              @click="activeTab = 'recent'"
            >最近学习</button>
          </div>
          <div class="course-search-box">
            <svg class="course-search-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#999" stroke-width="1.4"/>
              <path d="M10.5 10.5L14 14" stroke="#999" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchText"
              class="course-search-input"
              placeholder="搜索课程名称"
            />
          </div>
        </div>
      </div>

      <!-- 我的课程卡片 -->
      <div class="course-list-card">
        <div class="course-list-card-header">
          <div class="course-list-card-header-left">
            <div class="course-list-card-title">我的课程</div>
            <div class="course-list-card-subtitle">按课程卡片进入课程详情，继续管理对应学习任务。</div>
          </div>
          <div class="course-list-card-header-right">
            <div class="course-task-badge">
              <img src="@/assets/images/class/clock.png" class="course-task-badge-icon" alt="" />
              <span>{{ totalTaskCount }}个学习任务</span>
            </div>
            <div class="course-hide-done">
              <span class="course-hide-done-label">隐藏学完</span>
              <el-switch v-model="hideDone" />
            </div>
          </div>
        </div>

        <div class="course-grid">
          <div
            v-for="(item, index) in filteredCourseList"
            :key="index"
            class="course-card"
            @click="openDetail(item)"
          >
            <div class="course-card-cover" :style="{ background: item.bgGradient }">
              <span class="course-card-cover-char">{{ item.coverChar }}</span>
            </div>
            <div class="course-card-name">{{ item.name }}</div>
            <div class="course-card-tasks">{{ item.taskCount }}个学习任务</div>
            <div class="course-card-progress">
              <div class="course-progress-bar">
                <div class="course-progress-bar-fill" :style="{ width: item.progress + '%' }"></div>
              </div>
              <span class="course-progress-text">{{ item.progress }}%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 课程详情视图 ===== -->
    <template v-else>
      <!-- 顶部返回栏 -->
      <div class="detail-header">
        <div class="detail-header-back" @click="currentView = 'list'">
          <img src="@/assets/images/student/back.png" class="detail-back-icon" alt="" />
          <div class="detail-header-title-group">
            <div class="detail-header-title">课程详情</div>
            <div class="detail-header-subtitle">查看课程简介并继续你的学习任务。</div>
          </div>
        </div>
      </div>

      <!-- 详情内容区 -->
      <div class="detail-body">
        <!-- 左侧：课程信息 -->
        <div class="detail-left">
          <div class="detail-left-cover" :style="{ background: selectedCourse && selectedCourse.bgGradient }">
            <span class="detail-left-cover-char">{{ selectedCourse && selectedCourse.coverChar }}</span>
          </div>
          <div class="detail-left-info">
            <div class="detail-left-info-name">{{ selectedCourse && selectedCourse.name }}</div>
            <div class="detail-left-info-meta">
              <span class="detail-left-info-tag">{{ selectedCourse && selectedCourse.subject }}</span>
              <span class="detail-left-info-count">共{{ selectedCourse && selectedCourse.taskCount }}个学习任务</span>
            </div>
            <div class="detail-left-info-section">
              <div class="detail-left-info-section-title">课程简介</div>
              <div class="detail-left-info-desc">{{ selectedCourse && selectedCourse.description }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧：课程大纲 -->
        <div class="detail-right">
          <div class="detail-right-title">课程大纲</div>
          <div class="cdetail-list" v-loading="courseDetailLoading">
            <template v-for="(item, idx) in courseDetail.items">
              <!-- 直播课 -->
              <div v-if="item.type === 'live'" class="cdi-card" :key="idx"
                @click="handleCardClickWithLoading(`live-${idx}`, () => {})"
                v-loading="activeLoadingKey === `live-${idx}`"
                element-loading-background="rgba(255,255,255,0.7)">
                <div class="cdi-main">
                  <img src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                  <div class="cdi-info">
                    <div class="cdi-name">{{ item.title }}</div>
                    <div class="cdi-status-row">
                      <template v-if="item.isFinish == 1">
                        <div class="cdi-status-text">已结束</div>
                        <img v-if="item.isRecent && item.liveStatus !== '未开播'" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                      </template>
                      <template v-else-if="item.liveStatus == '直播中'">
                        <div class="cdi-status-text">已直播 <span class="yzb_text">{{ item.liveMin }}</span> </div>
                        <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                      </template>
                      <template v-else>
                        <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ item.liveMin }}</span> </div>
                        <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                      </template>
                      <span class="cdi-date-row">{{ item.date }}&nbsp;&nbsp;{{ item.timeStart }}{{ item.timeEnd ? ' - ' + item.timeEnd : '' }}</span>
                    </div>
                  </div>
                </div>
                <div class="cdi-actions">
                  <el-progress type="circle" :percentage="item.progress" :width="36" :stroke-width="2" :color="item.progress >= 100 ? '' : '#71A0FF'" :status="item.progress >= 100 ? 'success' : ''"></el-progress>
                </div>
              </div>

              <!-- 资源文件（历史课程/视频/图片/音频/资料） -->
              <div v-else-if="item.type === 'resource'" class="cdi-card" :key="idx"
                @click="handleCardClickWithLoading(`resource-${idx}`, () => {})"
                v-loading="activeLoadingKey === `resource-${idx}`"
                element-loading-background="rgba(255,255,255,0.7)">
                <div class="cdi-main">
                  <img v-if="['3','4'].includes(item.nodeType)" src="@/assets/images/class/videoIcon.png" class="cdi-type-icon" alt="" />
                  <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                  <div class="cdi-info">
                    <div class="cdi-name">{{ item.title }}</div>
                    <div class="cdi-file-row">
                      <span class="cdi-file-meta">{{ item.size }}</span>
                      <span class="cdi-file-meta">{{ item.date }}</span>
                      <img v-if="item.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                    </div>
                  </div>
                </div>
                <div class="cdi-actions" @click.stop>
                  <el-progress type="circle" :percentage="item.progress" :width="36" :stroke-width="2" :color="item.progress >= 100 ? '' : '#71A0FF'" :status="item.progress >= 100 ? 'success' : ''"></el-progress>
                </div>
              </div>

              <!-- 分组标题 -->
              <div v-else-if="item.type === 'group'" class="cdi-group-header" @click="toggleGroup(item)" :key="idx">
                <div class="cdi-group-left">
                  <div class="cdi-group-toggle-icon">
                    <img v-if="item.expanded" src="@/assets/images/class/xl.png" class="xlIcon" alt="">
                    <img v-else src="@/assets/images/class/ss.png" class="xlIcon" alt="">
                  </div>
                  <span class="cdi-group-title">{{ item.title }}</span>
                </div>
                <div class="cdi-actions" @click.stop>
                  <el-progress type="circle" :percentage="Math.round(parseFloat(item.percent)) || 0" :width="36" :stroke-width="2" :color="(Math.round(parseFloat(item.percent)) || 0) >= 100 ? '' : '#71A0FF'" :status="(Math.round(parseFloat(item.percent)) || 0) >= 100 ? 'success' : ''"></el-progress>
                </div>
              </div>

              <!-- 分组子项 -->
              <template v-if="item.type === 'group' && item.expanded">
                <template v-for="(child, ci) in item.children">
                  <!-- 二级分组标题 -->
                  <div v-if="child.type === 'group'" :key="`subgroup-${idx}-${ci}`"
                    class="cdi-group-header cdi-sub-group-header" @click.stop="toggleGroup(child)">
                    <div class="cdi-group-left">
                      <div class="cdi-group-toggle-icon">
                        <img v-if="child.expanded" src="@/assets/images/class/xl.png" class="xlIcon" alt="">
                        <img v-else src="@/assets/images/class/ss.png" class="xlIcon" alt="">
                      </div>
                      <span class="cdi-group-title">{{ child.title }}</span>
                    </div>
                    <div class="cdi-actions" @click.stop>
                      <el-progress type="circle" :percentage="Math.round(parseFloat(child.percent)) || 0" :width="36" :stroke-width="2" :color="(Math.round(parseFloat(child.percent)) || 0) >= 100 ? '' : '#71A0FF'" :status="(Math.round(parseFloat(child.percent)) || 0) >= 100 ? 'success' : ''"></el-progress>
                    </div>
                  </div>
                  <!-- 二级分组展开后的三级内容 -->
                  <template v-if="child.type === 'group' && child.expanded">
                    <div v-for="(grandchild, gi) in child.children" :key="`grandchild-${idx}-${ci}-${gi}`"
                      class="cdi-card cdi-card-in-group cdi-card-in-subgroup"
                      @click="handleCardClickWithLoading(`grandchild-${idx}-${ci}-${gi}`, () => {})"
                      v-loading="activeLoadingKey === `grandchild-${idx}-${ci}-${gi}`" element-loading-background="rgba(255,255,255,0.7)">
                      <div class="cdi-main">
                        <img v-if="grandchild.type === 'live'" src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                        <img v-else-if="['3','4'].includes(grandchild.nodeType)" src="@/assets/images/class/videoIcon.png" class="cdi-type-icon" alt="" />
                        <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                        <div class="cdi-info">
                          <div class="cdi-name">{{ grandchild.title }}</div>
                          <div v-if="grandchild.type === 'live'" class="cdi-status-row">
                            <template v-if="grandchild.isFinish == 1">
                              <div class="cdi-status-text">已结束</div>
                            </template>
                            <template v-else-if="grandchild.liveStatus == '直播中'">
                              <div class="cdi-status-text">已直播 <span class="yzb_text">{{ grandchild.liveMin }}</span> </div>
                              <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                            </template>
                            <template v-else>
                              <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ grandchild.liveMin }}</span> </div>
                              <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                            </template>
                            <span class="cdi-date-row">{{ grandchild.date }}&nbsp;&nbsp;{{ grandchild.timeStart }}{{ grandchild.timeEnd ? ' - ' + grandchild.timeEnd : '' }}</span>
                          </div>
                          <div v-else class="cdi-file-row">
                            <span class="cdi-file-meta">{{ grandchild.size }}</span>
                            <span class="cdi-file-meta">{{ grandchild.date }}</span>
                            <img v-if="grandchild.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                          </div>
                        </div>
                      </div>
                      <div class="cdi-actions" @click.stop>
                        <el-progress type="circle" :percentage="grandchild.progress" :width="36" :stroke-width="2" :color="grandchild.progress >= 100 ? '' : '#71A0FF'" :status="grandchild.progress >= 100 ? 'success' : ''"></el-progress>
                      </div>
                    </div>
                  </template>
                  <!-- 一级分组下的普通内容（resource / live） -->
                  <div v-if="child.type !== 'group'" :key="`child-${idx}-${ci}`" class="cdi-card cdi-card-in-group"
                    @click="handleCardClickWithLoading(`child-${idx}-${ci}`, () => {})"
                    v-loading="activeLoadingKey === `child-${idx}-${ci}`" element-loading-background="rgba(255,255,255,0.7)">
                    <div class="cdi-main">
                      <img v-if="child.type === 'live'" src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                      <img v-else-if="['3','4'].includes(child.nodeType)" src="@/assets/images/class/videoIcon.png" class="cdi-type-icon" alt="" />
                      <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                      <div class="cdi-info">
                        <div class="cdi-name">{{ child.title }}</div>
                        <div v-if="child.type === 'live'" class="cdi-status-row">
                          <template v-if="child.isFinish == 1">
                            <div class="cdi-status-text">已结束</div>
                          </template>
                          <template v-else-if="child.liveStatus == '直播中'">
                            <div class="cdi-status-text">已直播 <span class="yzb_text">{{ child.liveMin }}</span> </div>
                            <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                          </template>
                          <template v-else>
                            <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ child.liveMin }}</span> </div>
                            <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                          </template>
                          <span class="cdi-date-row">{{ child.date }}&nbsp;&nbsp;{{ child.timeStart }}{{ child.timeEnd ? ' - ' + child.timeEnd : '' }}</span>
                        </div>
                        <div v-else class="cdi-file-row">
                          <span class="cdi-file-meta">{{ child.size }}</span>
                          <span class="cdi-file-meta">{{ child.date }}</span>
                          <img v-if="child.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                        </div>
                      </div>
                    </div>
                    <div class="cdi-actions" @click.stop>
                      <el-progress type="circle" :percentage="child.progress" :width="36" :stroke-width="2" :color="child.progress >= 100 ? '' : '#71A0FF'" :status="child.progress >= 100 ? 'success' : ''"></el-progress>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script>
export default {
  name: 'StudentCourse',
  data() {
    return {
      currentView: 'list',
      activeTab: 'all',
      searchText: '',
      hideDone: false,
      selectedCourse: null,
      courseDetailLoading: false,
      activeLoadingKey: null,

      courseList: [
        {
          id: 1,
          name: '立升备课-管理学',
          subject: '管理学',
          taskCount: 8,
          progress: 0,
          bgGradient: 'linear-gradient(135deg, #E8EDFF 0%, #C8D3FF 100%)',
          coverChar: '管',
          description: '本课程系统讲设管理学基本概念、原理和方法。涵盖计划、组织、领导、控制等核心职能，结合实际案例分析，帮助学生建立管理思维，提升解决实际管理问题的能力，为未来的职业发展打下坚实基础。',
        },
        {
          id: 2,
          name: '高等数学基础',
          subject: '数学',
          taskCount: 12,
          progress: 35,
          bgGradient: 'linear-gradient(135deg, #FFF8E6 0%, #FFE4A0 100%)',
          coverChar: '高',
          description: '本课程涵盖微积分、线性代数、概率论等高等数学核心内容，通过系统讲解与大量练习，帮助学生掌握高等数学的基本思想与解题方法。',
        },
        {
          id: 3,
          name: '大学语文阅读',
          subject: '语文',
          taskCount: 10,
          progress: 62,
          bgGradient: 'linear-gradient(135deg, #FFE8EE 0%, #FFBFCC 100%)',
          coverChar: '大',
          description: '本课程以经典文学作品为载体，培养学生的阅读理解能力与文学鉴赏能力，提升语言表达水平，弘扬中华优秀传统文化。',
        },
        {
          id: 4,
          name: '公共英语听说',
          subject: '英语',
          taskCount: 9,
          progress: 18,
          bgGradient: 'linear-gradient(135deg, #E8FFF2 0%, #AAFFD6 100%)',
          coverChar: '公',
          description: '本课程注重英语听说综合能力的培养，通过场景对话、听力练习与口语训练，帮助学生在实际生活与工作中自如运用英语进行交流。',
        },
      ],

      courseDetail: {
        taskCount: 8,
        items: [
          {
            type: 'live',
            title: '管理学备课',
            isFinish: 1,
            liveStatus: '已结束',
            liveMin: '',
            date: '2024-05-06',
            timeStart: '08:05',
            timeEnd: '13:36',
            progress: 0,
            isRecent: false,
          },
          {
            type: 'live',
            title: '管理学备课',
            isFinish: 0,
            liveStatus: '直播中',
            liveMin: '8 分钟',
            date: '2024-05-06',
            timeStart: '08:05',
            timeEnd: '13:36',
            progress: 25,
            isRecent: false,
          },
          {
            type: 'live',
            title: '管理学备课',
            isFinish: 0,
            liveStatus: '直播未开始',
            liveMin: '8 分钟',
            date: '2024-05-06',
            timeStart: '08:05',
            timeEnd: '13:36',
            progress: 0,
            isRecent: false,
          },
          {
            type: 'resource',
            title: '大学语文.pdf',
            nodeType: '2',
            size: '136MB',
            date: '2024-05-06',
            progress: 100,
            isRecent: true,
          },
          {
            type: 'group',
            title: '《铂金班课程》',
            expanded: false,
            percent: '100',
            children: [
              {
                type: 'resource',
                title: '铂金班讲义.pdf',
                nodeType: '2',
                size: '48MB',
                date: '2024-05-06',
                progress: 100,
                isRecent: false,
              },
              {
                type: 'live',
                title: '铂金班专题直播',
                isFinish: 1,
                liveStatus: '已结束',
                liveMin: '',
                date: '2024-05-07',
                timeStart: '09:00',
                timeEnd: '11:00',
                progress: 100,
                isRecent: false,
              },
            ],
          },
          {
            type: 'resource',
            title: '大学语文.pdf',
            nodeType: '2',
            size: '',
            date: '',
            progress: 30,
            isRecent: false,
          },
        ],
      },
    }
  },

  computed: {
    totalTaskCount() {
      return this.courseList.reduce((sum, item) => sum + item.taskCount, 0)
    },
    filteredCourseList() {
      let list = this.courseList
      if (this.hideDone) {
        list = list.filter(item => item.progress < 100)
      }
      if (this.searchText.trim()) {
        list = list.filter(item => item.name.includes(this.searchText.trim()))
      }
      if (this.activeTab === 'recent') {
        list = list.filter(item => item.progress > 0)
      }
      return list
    },
  },

  methods: {
    openDetail(course) {
      this.selectedCourse = course
      this.currentView = 'detail'
    },

    toggleGroup(item) {
      item.expanded = !item.expanded
    },

    handleCardClickWithLoading(key, fn) {
      if (this.activeLoadingKey) return
      this.activeLoadingKey = key
      try {
        fn()
      } finally {
        setTimeout(() => {
          this.activeLoadingKey = null
        }, 800)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
/* ===== 整体页面 ===== */
.course-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F0F3F6;
  overflow: hidden;
}

/* ===== 列表视图 - 顶部标题区 ===== */
.course-page-header {
  width: 100%;
  background: #FFFFFF;
  padding: 24px 30px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.course-page-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-page-title {
  font-size: 22px;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.course-page-subtitle {
  font-size: 13px;
  color: #999999;
  margin-top: 4px;
}

.course-page-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Tab 切换按钮 */
.course-tab-group {
  display: flex;
  align-items: center;
  background: #F0F3F6;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.course-tab-btn {
  height: 34px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #666666;
  transition: background 0.2s, color 0.2s;
  outline: none;

  &.active {
    background: #0049FF;
    color: #FFFFFF;
    font-weight: 600;
  }
}

/* 搜索框 */
.course-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  height: 38px;
  background: #F5F6FA;
  border-radius: 8px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #EBEBEB;
}

.course-search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.course-search-input {
  flex: 1;
  width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #333333;

  &::placeholder {
    color: #BBBBBB;
  }
}

/* ===== 我的课程卡片 ===== */
.course-list-card {
  flex: 1;
  overflow-y: auto;
  margin: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px 24px 16px;
  box-sizing: border-box;
}

.course-list-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.course-list-card-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-list-card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.course-list-card-subtitle {
  font-size: 12px;
  color: #999999;
}

.course-list-card-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* 学习任务徽标 */
.course-task-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  background: #FFF8ED;
  border: 1px solid #FFD591;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #FA8C16;
}

.course-task-badge-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 隐藏学完 */
.course-hide-done {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-hide-done-label {
  font-size: 13px;
  color: #666666;
}

/* ===== 课程卡片网格 ===== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.course-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 73, 255, 0.1);
  }
}

.course-card-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 10px;
}

.course-card-cover-char {
  font-size: 52px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.55);
  user-select: none;
  letter-spacing: 0;
}

.course-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.course-card-tasks {
  font-size: 12px;
  color: #999999;
  margin-bottom: 8px;
}

.course-card-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-progress-bar {
  flex: 1;
  height: 4px;
  background: #E8EEFF;
  border-radius: 2px;
  overflow: hidden;
}

.course-progress-bar-fill {
  height: 100%;
  background: #4D7CFF;
  border-radius: 2px;
  transition: width 0.3s;
}

.course-progress-text {
  font-size: 12px;
  color: #999999;
  flex-shrink: 0;
  min-width: 28px;
  text-align: right;
}

/* ===== 详情视图 ===== */
.detail-header {
  width: 100%;
  background: #FFFFFF;
  padding: 0 30px;
  box-sizing: border-box;
  height: 68px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.detail-header-back {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

.detail-back-icon {
  width: 7px;
  height: 14px;
  flex-shrink: 0;
}

.detail-header-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
  line-height: 1.2;
}

.detail-header-subtitle {
  font-size: 12px;
  color: #999999;
}

/* 详情主体 */
.detail-body {
  flex: 1;
  height: 0;
  display: flex;
  gap: 0;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
}

/* 左侧面板 */
.detail-left {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  background: #FFFFFF;
  border-radius: 12px;
  padding-bottom: 16px;
}

.detail-left-cover {
  width: 100%;
  height: 160px;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-left-cover-char {
  font-size: 64px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  user-select: none;
}

.detail-left-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-left-info-name {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
}

.detail-left-info-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-left-info-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #E8EEFF;
  color: #0049FF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.detail-left-info-count {
  font-size: 13px;
  color: #666666;
}

.detail-left-info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.detail-left-info-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333;
}

.detail-left-info-desc {
  font-size: 13px;
  color: #666666;
  line-height: 1.7;
}

/* 右侧面板 */
.detail-right {
  flex: 1;
  width: 0;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
}

.detail-right-title {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  padding: 16px 20px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #F3F4F8;
}

/* ===== 课程大纲（复用 Class/index.vue 样式） ===== */
.cdetail-list {
  flex: 1;
  height: 0;
  overflow-y: auto;
  background: #F0F3F6;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cdi-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 4px;
  padding: 14px 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background: rgba(202, 217, 255, 0.20) !important;
  }
}

.cdi-card-in-group {
  padding-left: 36px;
}

.cdi-sub-group-header {
  padding-left: 36px !important;
}

.cdi-card-in-subgroup {
  padding-left: 72px;
}

.cdi-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  width: 0;
}

.cdi-type-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.cdi-info {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdi-name {
  font-weight: 500;
  font-size: 16px;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cdi-status-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.cdi-status-text {
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

.cdi-date-row {
  font-size: 13px;
  color: #999999;
}

.cdi-file-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.cdi-file-meta {
  font-size: 13px;
  color: #999999;
  margin-right: 5px;
}

.cdi-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.cdi-actions ::v-deep .el-progress__text {
  font-size: 10px !important;
}

.cdi-actions ::v-deep .el-progress.is-success .el-progress__text {
  font-size: 18px !important;
  color: #67C23A !important;
}

.cdi-group-header {
  width: 100%;
  background: #FFFFFF;
  border-radius: 4px;
  padding: 14px 16px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.cdi-group-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cdi-group-toggle-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cdi-group-title {
  font-weight: 600;
  font-size: 14px;
  color: #333333;
}

.zbzClass {
  width: 88px;
  height: 26px;
}

.zbwksClass {
  width: 114px;
  height: 26px;
}

.yzb_text {
  color: #0EB520;
  font-size: 20px;
  font-weight: bold;
}

.jlzb_text {
  color: #FF2E00;
  font-size: 20px;
  font-weight: bold;
}

.zjxxIcon {
  width: 82px;
  height: 26px;
}

.xlIcon {
  width: 15px;
  height: 15px;
}
</style>
