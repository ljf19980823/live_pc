<template>
  <div class="course-page">

    <!-- ===== 课程列表视图 ===== -->
    <template v-if="currentView === 'list'">
      <!-- 顶部标题区 -->
      <div class="course-page-header">
        <div class="course-page-title-group">
          <div class="course-page-title">课程</div>
          <div class="course-page-subtitle">管理课程与学习任务</div>
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
              @keydown.enter="fetchCourseList"
              @blur="fetchCourseList"
            />
          </div>
        </div>
      </div>

      <!-- 我的课程卡片 -->
      <div class="course-list-card">
        <div class="course-list-card-header">
          <div class="course-list-card-header-left">
            <div class="course-list-card-title">我的课程</div>
            <div class="course-list-card-subtitle">按课程卡片进入课程详情，继续管理对应学习任务</div>
          </div>
          <div class="course-list-card-header-right">
            <div class="course-task-badge">
              <img src="@/assets/images/task_icon.png" class="course-task-badge-icon" alt="" />
              <span>{{ totalTaskCount }}个学习任务</span>
            </div>
            <div class="course-hide-done">
              <span class="course-hide-done-label">隐藏学完</span>
              <el-switch v-model="hideDone" />
            </div>
          </div>
        </div>

        <div class="course-grid" v-loading="courseListLoading" element-loading-background="rgba(255,255,255,0.7)">
          <div
            v-for="(item, index) in courseList"
            :key="item.id || index"
            class="course-card"
            @click="openDetail(item)"
          >
            <div class="course-card-cover" :style="item.cover ? {} : { background: item.bgGradient }">
              <img v-if="item.cover" :src="item.cover" class="course-card-cover-img" alt="" />
              <span v-else class="course-card-cover-char">{{ item.coverChar }}</span>
            </div>
            <div  class="course-card-box" >
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
          <div v-if="!courseListLoading && courseList.length === 0" class="course-empty">
            暂无课程
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 课程详情视图 ===== -->
    <template v-else>
      <!-- 顶部返回栏 -->
      <div class="detail-header">
        <div class="detail-header-back" @click="backToList">
          <img src="@/assets/images/course_back.png" class="detail-back-icon" alt="" />
          <div class="detail-header-title-group">
            <div class="detail-header-title">课程详情</div>
            <div class="detail-header-subtitle">查看课程简介并继续你的学习任务</div>
          </div>
        </div>
      </div>

      <!-- 详情内容区 -->
      <div class="detail-body">
        <!-- 左侧：课程信息 -->
        <div class="detail-left">
          <div class="detail-left-cover" :style="selectedCourse && selectedCourse.cover ? { backgroundImage: `url(${selectedCourse.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: selectedCourse && selectedCourse.bgGradient }">
           
          </div>
          <div class="detail-left-info">
            <div class="detail-left-info-name">{{ selectedCourse && selectedCourse.name }}</div>
            <div class="detail-left-info-meta">
              <span class="detail-left-info-tag" v-if="selectedCourse && selectedCourse.subjectName">{{ selectedCourse && selectedCourse.subjectName }}</span>
              <span class="detail-left-info-count">共{{ selectedCourse && selectedCourse.taskCount }}个学习任务</span>
            </div>
            <div class="detail-left-info-section">
              <div class="detail-left-info-section-title">课程简介</div>
              <div class="detail-left-info-desc"  v-html="selectedCourse && selectedCourse.description"></div>
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
                @click="handleCardClickWithLoading(`live-${idx}`, () => enterLiveRoom(item))"
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
                @click="handleCardClickWithLoading(`resource-${idx}`, () => handleResourceClick(item))"
                v-loading="activeLoadingKey === `resource-${idx}`"
                element-loading-background="rgba(255,255,255,0.7)">
                <div class="cdi-main">
                  <img v-if="['3','4'].includes(item.nodeType)" src="@/assets/images/class/videoIcon.png" class="cdi-type-icon" alt="" />
                  <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                  <div class="cdi-info">
                    <div class="cdi-name">{{ item.title }}</div>
                    <div class="cdi-file-row">
                      <span class="cdi-file-meta">{{ item.nodeType=='3'|| item.nodeType=='4' ? formatDuration(item.duration) :  item.size  }}</span>
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
                      @click="handleCardClickWithLoading(`grandchild-${idx}-${ci}-${gi}`, () => grandchild.type === 'resource' ? handleResourceClick(grandchild) : grandchild.type === 'live' ? enterLiveRoom(grandchild) : undefined)"
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
                            <span class="cdi-file-meta">{{ grandchild.nodeType=='3'|| grandchild.nodeType=='4' ? formatDuration(grandchild.duration) :  grandchild.size  }}</span>
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
                    @click="handleCardClickWithLoading(`child-${idx}-${ci}`, () => child.type === 'resource' ? handleResourceClick(child) : child.type === 'live' ? enterLiveRoom(child) : undefined)"
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
                          <span class="cdi-file-meta">{{ child.nodeType=='3'|| child.nodeType=='4' ? formatDuration(child.duration) :  child.size  }}</span>
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

  <!-- 直播 iframe -->
  <div v-if="showLiveIframe" class="live-iframe-overlay">
    <div class="live-iframe-back" @click="showLiveIframe = false">
      <span>← 返回课程</span>
    </div>
    <iframe :src="liveUrl" style="flex:1;border:none;width:100%;" allowfullscreen></iframe>
  </div>

  <!-- 视频播放弹窗 -->
  <VideoPlayer
    :visible="showVideoDialog"
    :source="currentVideoUrl"
    :title="currentResourceTitle"
    :allow-multiple="currentAllowMultiple"
    :allow-fast-forward="currentAllowFastForward"
    :allow-download="currentAllowDownload"
    :from-task="fromLearningTask"
    :collect-params="currentCollectParams"
    @close="closeVideoDialog"
    @collect-change="onChildCollectChange"
  />

  <!-- 历史课堂回放弹窗 -->
  <history-video-player
    :visible="playerVisible"
    :main-source="playerSource"
    :teacher-source="playerTeacherSource"
    :title="playerTitle"
    :history-lesson-id="playerHistoryLessonId"
    :allow-download="currentAllowDownload"
    :from-task="fromLearningTask"
    :collect-params="currentCollectParams"
    @close="closeHistoryPlayer"
    @collect-change="onChildCollectChange"
  />

  <!-- 文件预览弹窗 -->
  <FilePreview
    :visible="filePreviewVisible"
    :file="filePreviewData"
    :allow-download="currentAllowDownload"
    :from-task="fromLearningTask"
    :collect-params="currentCollectParams"
    @close="filePreviewVisible = false; fromLearningTask = false; isCollected = false"
    @collect-change="onChildCollectChange"
  />

  <!-- 音频播放弹窗 -->
  <el-dialog
    :title="currentResourceTitle"
    :visible.sync="showAudioDialog"
    width="480px"
    :append-to-body="true"
    @close="closeAudioDialog"
  >
    <audio v-if="showAudioDialog" :src="currentAudioUrl" controls autoplay style="width:100%;margin:16px 0;display:block;"></audio>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
      <el-button v-if="currentAllowDownload === '1'" type="primary" size="small" @click="handleAudioDownload">下载音频</el-button>
    </div>
  </el-dialog>

  <!-- 图片预览弹窗 -->
  <el-dialog
    :title="currentResourceTitle"
    :visible.sync="showImageDialog"
    width="800px"
    :append-to-body="true"
    @close="closeImageDialog"
  >
    <img v-if="showImageDialog" :src="currentImageUrl" style="width:100%;max-height:600px;object-fit:contain;display:block;" alt="" />
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
      <el-button v-if="currentAllowDownload === '1'" type="primary" size="small" @click="handleImageDownload">下载图片</el-button>
    </div>
  </el-dialog>

  </div>
</template>

<script>
import { getAllCourseList, getRecentCourseList } from '@/api/modules/student'
import { getCourseDetail, updateRecentStudy, updateCourseProgress, collectToggle, checkTempStudentLiveRecord } from '@/api'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import HistoryVideoPlayer from '@/components/HistoryVideoPlayer/index.vue'
import FilePreview from '@/components/FilePreview/index.vue'
import { getToken, getUserInfo } from '@/utils/auth'
import { formatDuration } from '@/utils'
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #E8EDFF 0%, #C8D3FF 100%)',
  'linear-gradient(135deg, #FFF8E6 0%, #FFE4A0 100%)',
  'linear-gradient(135deg, #FFE8EE 0%, #FFBFCC 100%)',
  'linear-gradient(135deg, #E8FFF2 0%, #AAFFD6 100%)',
  'linear-gradient(135deg, #F0E8FF 0%, #D4AAFF 100%)',
  'linear-gradient(135deg, #E8F8FF 0%, #AAE0FF 100%)',
]

export default {
  name: 'StudentCourse',
  components: { VideoPlayer, HistoryVideoPlayer, FilePreview },
  data() {
    return {
      currentView: 'list',
      activeTab: 'all',
      searchText: '',
      hideDone: false,
      selectedCourse: null,
      courseDetailLoading: false,
      activeLoadingKey: null,
      courseListLoading: false,
      courseList: [],
      courseDetail: { taskCount: 0, items: [] },

      // 直播
      showLiveIframe: false,
      liveUrl: '',

      // 视频播放
      showVideoDialog: false,
      currentVideoUrl: '',
      currentResourceTitle: '',
      currentAllowMultiple: '1',
      currentAllowFastForward: '1',
      currentAllowDownload: '2',
      currentPlayingItem: null,

      // 历史回放
      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      playerHistoryLessonId: '',

      // 文件预览
      filePreviewVisible: false,
      filePreviewData: {},

      // 音频
      showAudioDialog: false,
      currentAudioUrl: '',

      // 图片
      showImageDialog: false,
      currentImageUrl: '',

      // 收藏
      fromLearningTask: false,
      currentCollectParams: {},
      isCollected: false,
      collecting: false,
    }
  },

  computed: {
    totalTaskCount() {
      return this.courseList.reduce((sum, item) => sum + (item.taskCount || 0), 0)
    },
  },

  watch: {
    activeTab() {
      this.fetchCourseList()
    },
    hideDone() {
      this.fetchCourseList()
    },
    searchText() {
      this.fetchCourseListDebounced()
    },
  },

  created() {
    this.fetchCourseList()
  },

  methods: {
    formatDuration,
    // ─── 列表加载 ──────────────────────────────────────────────
    backToList() {
      this.currentView = 'list'
      this.fetchCourseList()
    },

    fetchCourseListDebounced() {
      clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        this.fetchCourseList()
      }, 400)
    },

    async fetchCourseList() {
      this.courseListLoading = true
      try {
        const params = { hideStudy: this.hideDone ? '1' : '0' }
        if (this.searchText.trim()) params.keyword = this.searchText.trim()
        const res = this.activeTab === 'all'
          ? await getAllCourseList(params)
          : await getRecentCourseList(params)
        this.courseList = (res.data || []).map((item, index) => this.mapCourseItem(item, index))
      } catch (e) {
        this.courseList = []
      } finally {
        this.courseListLoading = false
      }
    },

    mapCourseItem(item, index) {
      const charCode = item.courseId ? item.courseId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : index
      return {
        ...item,
        id: item.courseId,
        taskCount: item.totalLessons || 0,
        progress: Math.round(item.progressPercent || 0),
        bgGradient: COVER_GRADIENTS[charCode % COVER_GRADIENTS.length],
        coverChar: item.name ? item.name.charAt(0) : '课',
        subject: item.label || '',
        description: item.describe || '',
      }
    },

    openDetail(course) {
      this.selectedCourse = course
      console.log(this.selectedCourse,'看戏')
      this.currentView = 'detail'
      this.fetchCourseDetail(course.id)
    },

    // ─── 课程详情加载 ──────────────────────────────────────────
    async fetchCourseDetail(courseId) {
      if (!courseId) return
      this.courseDetailLoading = true
      const expandedMap = this._saveExpandedState(this.courseDetail.items || [])
      try {
        const res = await getCourseDetail({ courseId })
        const data = res.data || {}
        if (data.describe) {
          this.$set(this.selectedCourse, 'description', data.describe)
        }
        if (data.subjectName) {
          this.$set(this.selectedCourse, 'subjectName', data.subjectName)
        }
        this.courseDetail = {
          taskCount: data.totalLessons || 0,
          items: (data.detailTree || []).map(node => this._mapDetailNode(node)),
        }
        this._restoreExpandedState(this.courseDetail.items, expandedMap)
      } catch (e) {
        this.courseDetail = { taskCount: 0, items: [] }
      } finally {
        this.courseDetailLoading = false
      }
    },

    _mapDetailNode(node) {
      if (node.type === '1') {
        return {
          id: node.id || '',
          type: 'group',
          nodeType: node.type,
          title: node.name || '',
          percent: node.percent || '0',
          expanded: false,
          allowMultiple: String(node.allowMultiple || '1'),
          allowFastForward: String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          collectCount: node.collectCount,
          children: (node.children || []).map(child => this._mapDetailNode(child)),
        }
      } else if (node.type === '2') {
        const live = node.liveInfo || {}
        const startTime = live.startTime || ''
        let date = '', timeStart = ''
        if (startTime) {
          const parts = startTime.split(' ')
          date = parts[0] || ''
          timeStart = (parts[1] || '').substring(0, 8)
        }
        return {
          id: node.id || '',
          type: 'live',
          nodeType: node.type,
          title: node.name || live.name || '',
          isFinish: live.isFinish,
          isStart: live.isStart,
          liveStatus: live.status || '',
          liveMin: live.liveMin,
          startTime: live.startTime || '',
          liveLessonId: live.liveLessonId || '',
          liveId: live.id || '',
          fileList: live.fileList || [],
          date,
          timeStart,
          timeEnd: '',
          progress: Math.round(parseFloat(node.percent)) || 0,
          isRecent: live.isRecentStudy === '1',
          allowMultiple: String(node.allowMultiple || '1'),
          allowFastForward: String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          collectCount: node.collectCount,
        }
      } else {
        const res = node.resource || node.historyLesson || {}
        const history = node.historyLesson || {}
        return {
          id: node.id || '',
          type: 'resource',
          nodeType: node.type,
          title: node.name || res.name || res.fileName || '',
          size: res.size ? String(res.size) : '',
          date: '',
          isRecent: res.isRecentStudy === '1',
          progress: Math.round(parseFloat(node.percent)) || 0,
          filePath: res.fileList && res.fileList.length ? res.fileList[0].filePath : (res.filePath || ''),
          allowMultiple:  String(node.allowMultiple || '1'),
          allowFastForward:String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          collectCount: node.collectCount,
          historyLessonId: node.type === '3'  ? history.historyLessonId : '',
          taskUuid:node.type=='3'?history.taskUuid:"",
          fileList: res.fileList || [],
          duration:node.type=='3'?(history.fileList ? history.fileList[0].duration : 0):(node.type=='4'?node.resource.duration:0),
        }
      }
    },

    _saveExpandedState(items, map = {}) {
      if (!items) return map
      items.forEach(item => {
        if (item.type === 'group') {
          map[item.id] = item.expanded || false
          if (item.children) this._saveExpandedState(item.children, map)
        }
      })
      return map
    },

    _restoreExpandedState(items, map) {
      if (!items || !map) return
      items.forEach(item => {
        if (item.type === 'group') {
          if (map[item.id] !== undefined) this.$set(item, 'expanded', map[item.id])
          if (item.children) this._restoreExpandedState(item.children, map)
        }
      })
    },

    toggleGroup(item) {
      this.$set(item, 'expanded', !item.expanded)
    },

    // ─── 卡片点击 ──────────────────────────────────────────────
    async handleCardClickWithLoading(key, handler) {
      this.activeLoadingKey = key
      try {
        await Promise.resolve(handler())
      } finally {
        this.activeLoadingKey = null
      }
    },

    // ─── 进入直播间 ────────────────────────────────────────────
    async enterLiveRoom(item) {
      if (item.isFinish == 1 && item.liveStatus === '已结束已开播') {
        this.openVideoPlayer(item, true, true)
        return
      }
      if (item.isFinish == 1 && item.liveStatus === '已结束未开播') {
        this.$message.warning('该课程暂无回放地址')
        return
      }
      const now = Date.now()
      const startTime = item.startTime ? new Date(item.startTime.replace(/-/g, '/')).getTime() : null
      if (!startTime || now < startTime - 30 * 60 * 1000) {
        this.$message.warning('时间还未到，请耐心等候')
        return
      }
      if (window.electronAPI) {
        try {
          const [camStatus, micStatus] = await Promise.all([
            window.electronAPI.getMediaAccessStatus('camera'),
            window.electronAPI.getMediaAccessStatus('microphone'),
          ])
          const needsRequest = []
          if (camStatus !== 'granted') needsRequest.push(window.electronAPI.askForMediaAccess('camera'))
          if (micStatus !== 'granted') needsRequest.push(window.electronAPI.askForMediaAccess('microphone'))
          if (needsRequest.length) await Promise.all(needsRequest)
        } catch (_) {}
      }
      try {
        const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
        const lessonId = String(item.id || '')
        await updateRecentStudy({ courseId, lessonId })
        this.fetchCourseDetail(this.selectedCourse.id)
      } catch (_) {}

      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const liveId = item.liveId
      const roleNumber = role === 'STUDENT' ? 0 : 1
      if (role === 'STUDENT') {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          if (res.data == false) {
            this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }
      let liveBaseUrl = 'https://live.fjlsjy123.com'
      if (process.env.NODE_ENV === 'development') liveBaseUrl = 'http://localhost:8000'
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId || ''}&_t=${Date.now()}&token=${token}`
      this.showLiveIframe = true
    },

    // ─── 资源点击 ──────────────────────────────────────────────
    async handleResourceClick(item) {
      const url = item.filePath
      if (!url) {
        this.$message.warning('资源地址不存在')
        return
      }
      const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
      const lessonId = String(item.id || '')
      const videoTypes = ['3', '4']
      const imageTypes = ['5']
      const audioTypes = ['6']

      try {
        const apiCalls = [updateRecentStudy({ courseId, lessonId })]
        if (item.progress < 100) {
          const isVideo = videoTypes.includes(item.nodeType)
          const percent = isVideo ? String(item.progress || 0) : '100'
          apiCalls.push(updateCourseProgress({ courseId, lessonId, type: String(item.nodeType || ''), percent }))
        }
        await Promise.all(apiCalls)
      } catch (_) {}
      this.fetchCourseDetail(courseId)

      const collectBase = {
        courseId,
        lessonId,
        type: String(item.nodeType || ''),
        collectCount: String(item.collectCount || 0),
        historyLessonId: String(item.historyLessonId || ''),
      }
      const initCollected = collectBase.collectCount == 1

      this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
      this.currentAllowMultiple = item.allowMultiple != null ? String(item.allowMultiple) : '2'
      this.currentAllowFastForward = item.allowFastForward != null ? String(item.allowFastForward) : '2'
      this.fromLearningTask = true
      this.currentCollectParams = collectBase
      this.isCollected = initCollected

      if (videoTypes.includes(item.nodeType)) {
           // taskUuid 有值 → 跳转 AI听记页面
        // if(item.taskUuid){
        //   const fileList = item.fileList || []
        //   const mainFile = fileList.find(f => f.videoType == '1')
        //   const teacherFile = fileList.find(f => f.videoType == '2')
        //   const { userId } = getUserInfo()
        //   this.$router.push({
        //     name: 'AIListening',
        //     query: {
        //       videoUrl: mainFile ? mainFile.filePath || '' : '',
        //       teacherVideoUrl: teacherFile ? teacherFile.filePath || '' : '',
        //       meetingId: item.taskUuid,
        //       meetingTitle: item.title || '',
        //       scopeText: item.taskUuid,
        //       liveLessonId: item.historyLessonId || '',
        //       teacherId: userId || ''
        //     }
        //   })
        //   return
        // }
        this.currentResourceTitle = item.title || '视频播放'
        this.currentVideoUrl = url
        this.currentPlayingItem = item
        this.showVideoDialog = true
      } else if (imageTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '图片预览'
        this.currentImageUrl = url
        this.showImageDialog = true
      } else if (audioTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '音频播放'
        this.currentAudioUrl = url
        this.showAudioDialog = true
      } else {
        this.filePreviewData = { name: item.title || '', path: url }
        this.filePreviewVisible = true
      }
    },

    // ─── 历史视频回放 ──────────────────────────────────────────
    async openVideoPlayer(item, updateRecent = false, fromTask = false) {
      if (updateRecent) {
        try {
          const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
          await updateRecentStudy({ courseId, lessonId: String(item.id || '') })
          this.fetchCourseDetail(this.selectedCourse.id)
        } catch (_) {}
      }
      const fileList = item.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')
      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      this.playerTitle = item.name || item.title || '视频回放'
      this.playerHistoryLessonId = String(item.historyLessonId || '')
      this.currentAllowMultiple = item.allowMultiple != null ? String(item.allowMultiple) : '2'
      this.currentAllowFastForward = item.allowFastForward != null ? String(item.allowFastForward) : '2'
      this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
      this.currentPlayingItem = item
      this.fromLearningTask = fromTask
      this.isCollected = fromTask ? String(item.collectCount || 0) == 1 : false
      if (fromTask) {
        this.currentCollectParams = {
          courseId: this.selectedCourse ? String(this.selectedCourse.id || '') : '',
          lessonId: String(item.id || ''),
          historyLessonId: String(item.historyLessonId || ''),
          type: '3',
          collectCount: String(item.collectCount || 0),
        }
      } else {
        this.currentCollectParams = {}
      }
      this.playerVisible = true
    },

    async closeVideoDialog(percent = 0) {
      this.showVideoDialog = false
      this.currentVideoUrl = ''
      this.fromLearningTask = false
      this.isCollected = false
      await this.saveVideoProgress(percent)
    },

    async closeHistoryPlayer(percent = 0) {
      this.playerVisible = false
      this.fromLearningTask = false
      this.isCollected = false
      await this.saveVideoProgress(percent)
    },

    async saveVideoProgress(percent) {
      const item = this.currentPlayingItem
      this.currentPlayingItem = null
      if (!item) return
      const newPercent = Math.max(percent, item.progress || 0)
      if (newPercent <= (item.progress || 0)) return
      try {
        const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
        await updateCourseProgress({
          courseId,
          lessonId: String(item.id || ''),
          type: String(item.nodeType || ''),
          percent: String(newPercent),
        })
        this.fetchCourseDetail(courseId)
      } catch (_) {}
    },

    closeAudioDialog() {
      this.showAudioDialog = false
      this.currentAudioUrl = ''
      this.fromLearningTask = false
      this.isCollected = false
    },

    async handleAudioDownload() {
      const url = this.currentAudioUrl
      if (!url) return
      const filename = this.currentResourceTitle || url.split('/').pop() || '音频'
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
      }
    },

    closeImageDialog() {
      this.showImageDialog = false
      this.currentImageUrl = ''
      this.fromLearningTask = false
      this.isCollected = false
    },

    async handleImageDownload() {
      const url = this.currentImageUrl
      if (!url) return
      const filename = this.currentResourceTitle || url.split('/').pop() || '图片'
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
      }
    },

    onChildCollectChange() {
      if (this.selectedCourse) this.fetchCourseDetail(this.selectedCourse.id)
    },

    async handleCollect() {
      if (this.collecting) return
      this.collecting = true
      try {
        const res = await collectToggle(this.currentCollectParams)
        const collectCount = res?.data?.collectCount
        this.isCollected = collectCount !== undefined ? Number(collectCount) === 1 : !this.isCollected
        this.$message.success(this.isCollected ? '收藏成功' : '已取消收藏')
        if (this.selectedCourse) this.fetchCourseDetail(this.selectedCourse.id)
      } catch (e) {
        this.$message.error('操作失败，请重试')
      } finally {
        this.collecting = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
/* ===== 直播 iframe 覆盖层 ===== */
.live-iframe-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.live-iframe-back {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  cursor: pointer;
  background: #f5f7fa;
  font-size: 14px;
  color: #333;
}

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
  border-radius: 10px;
  padding: 5px 7px;
  gap: 2px;
  border: 1px solid rgba(229, 234, 242, 0.60);
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
  gap: 6px;
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
  height: 36px;
  padding: 0 12px;
  background: #FFF4E4;
  border-radius: 10px;
  font-size: 13px;
  font-weight: bold;
  color: #B96B00;
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
.course-card-box{
  width: 100%;
  padding: 0 10px 10px 10px;
  box-sizing: border-box;
}
.course-card-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-card-cover-char {
  font-size: 52px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.55);
  user-select: none;
  letter-spacing: 0;
}

.course-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: #BBBBBB;
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
  height: 6px;
  background: #F0F3F6;
  border-radius: 2px;
  overflow: hidden;
}

.course-progress-bar-fill {
  height: 100%;
  background: #A3BFFF;
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
  padding: 26px 30px;
  box-sizing: border-box;
  // height: 68px;
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
  width: 36px;
  height: 36px;
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
  font-size: 13px;
  color: #8A93A3;
  margin-top: 4px;
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
  // background: #FFFFFF;
  // border-radius: 12px;
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
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  border-radius: 12px;
  background: #ffffff;
}

.detail-left-info-name {
  font-size: 18px;
  font-weight: bold;
  color: #202532;
}

.detail-left-info-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
}

.detail-left-info-tag {
  display: inline-block;
  padding: 2px 10px;
  background: #F0F5FF;
  color: #0049FF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.detail-left-info-count {
  font-size: 13px;
  color: #667085;
}

.detail-left-info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 25px;
  box-sizing: border-box;
  border-top: 1px solid #F0F3F6;
}

.detail-left-info-section-title {
  font-size: 15px;
  font-weight: 600;
  color: #202532;
}

.detail-left-info-desc {
  font-size: 13px;
  color: #667085;
  line-height: 1.7;
}

/* 右侧面板 */
.detail-right {
  flex: 1;
  width: 0;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  // background: #FFFFFF;
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
