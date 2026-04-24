<template>
  <div class="page-placeholder">
    <div class="page-placeholder_top">
      <div class="placeholder_top_detail" @click="activeTab = 'live'">
        <div class="placeholder_top_detail_text" :class="{ 'placeholder_top_detail_text_active': activeTab === 'live' }">实时课堂</div>
        <div class="placeholder_top_detail_hx" v-if="activeTab === 'live'"></div>
      </div>
      <div class="placeholder_top_detail" @click="activeTab = 'history'">
        <div class="placeholder_top_detail_text" :class="{ 'placeholder_top_detail_text_active': activeTab === 'history' }">历史课堂</div>
        <div class="placeholder_top_detail_hx" v-if="activeTab === 'history'"></div>
      </div>
      <div class="page_top_right_fixed">
        <div class="page_top_right_fixed_box">
          <div class="page_top_right_fixed_bk">
            <img src="@/assets/images/liveClass/bk_icon.png" class="page_top_right_fixed_bk_icon" alt="">
            <div class="page_top_right_fixed_bk_text">备课</div>
          </div>
          <div class="page_top_right_fixed_add">
            <img src="@/assets/images/liveClass/add_icon.png" class="page_top_right_fixed_add_icon" alt="">
            <div class="page_top_right_fixed_add_text">新建课堂</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时课堂 -->
    <div class="page-placeholder_last" v-if="activeTab === 'live'">
       <!-- ── 顶部更新横幅 ─────────────────────────────────────────────────── -->
    <transition name="banner-fade">
      <div v-if="hasUpdate && !bannerDismissed" class="update-banner">
        <span class="banner-dot" />
        <span class="banner-text">
          我们为您推出了更快、更稳定的 {{ updateInfo.version }} 客户端。
        </span>
        <a class="banner-link" @click="openUpdateDialog">立刻下载 &gt;</a>
      </div>
    </transition>

      <div class="placeholder_last_top">
        <div class="placeholder_last_top_total">共有{{ liveCourses.length }}节课</div>
        <div class="placeholder_last_top_btn">查看课表</div>
        <img src="@/assets/images/liveClass/refresh.png" class="placeholder_last_top_sx" alt="">
      </div>
      <div class="placeholder_last_table">
        <div class="placeholder_last_table_detail" v-for="(item, index) in liveCourses" :key="index">
          <img :src="item.statusImg" class="placeholder_last_table_detail_statusImg" alt="">
          <div class="placeholder_last_table_detail_top">
            <div class="placeholder_last_table_detail_top_top">
              <div class="placeholder_last_table_detail_top_top_title">{{ item.title }}</div>
              <div class="placeholder_last_table_detail_top_top_xq">
                <div class="placeholder_last_table_detail_top_top_xq_text">详情</div>
                <img src="@/assets/images/liveClass/xq_icon.png" class="placeholder_last_table_detail_top_top_xq_icon" alt="">
              </div>
            </div>
            <div class="placeholder_last_table_detail_top_last">
              <div class="placeholder_last_table_detail_top_last_time">{{ item.time }}</div>
              <div class="placeholder_last_table_detail_top_last_leve" v-if="item.status === 'living'">
                已直播 <span class="placeholder_last_table_detail_top_last_leve_yj">{{ item.minutes }}</span> 分钟
              </div>
              <div class="placeholder_last_table_detail_top_last_leve" v-else>
                距离直播还有 <span class="placeholder_last_table_detail_top_last_leve_jl">{{ item.minutes }}</span> 分钟
              </div>
            </div>
          </div>
          <div
            class="placeholder_last_table_detail_last"
            :class="{ 'placeholder_last_table_detail_last_disable': item.status !== 'living' }"
          >进入直播</div>
        </div>
      </div>
    </div>

    <!-- 历史课堂 -->
    <div class="page-placeholder_last" v-if="activeTab === 'history'">
      <div class="ls_top">
        <div class="ls_top_left">
          <div class="ls_top_left_time">
            <img src="@/assets/images/liveClass/time.png" class="ls_top_left_time_icon" alt="">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              class="ls_date_picker"
              size="mini"
            />
          </div>
          <div class="ls_top_left_class">
            <img src="@/assets/images/liveClass/class.png" class="ls_top_left_time_icon" alt="">
            <el-select
              v-model="selectedClass"
              placeholder="选择班级"
              size="mini"
              class="ls_class_select"
              clearable
            >
              <el-option
                v-for="cls in classList"
                :key="cls.value"
                :label="cls.label"
                :value="cls.value"
              />
            </el-select>
          </div>
          <div class="ls_top_left_search">
            <div class="ls_top_left_search_sx"></div>
            <div class="ls_top_left_search_box">
              <img src="@/assets/images/liveClass/search.png" class="ls_top_left_time_icon" alt="">
              <div class="ls_top_left_search_box_input">
                <input type="text" placeholder="搜索课程" v-model="searchKeyword">
              </div>
            </div>
          </div>
        </div>
        <div class="ls_top_right">共{{ filteredHistoryCourses.length }}节课</div>
      </div>
      <div class="ls_last">
        <div class="ls_last_detail" v-for="(item, index) in filteredHistoryCourses" :key="index">
          <div class="ls_last_detail_options">
            <div class="ls_last_detail_options_box">
              <img src="@/assets/images/liveClass/options.png" class="ls_last_detail_options_box_img" alt="">
            </div>
          </div>
          <img src="@/assets/images/such.png" class="ls_last_detail_img" alt="">
          <div class="ls_last_detail_center">
            <div class="ls_last_detail_title">{{ item.title }}</div>
            <div class="ls_last_detail_time">{{ item.duration }}</div>
          </div>
          <div class="ls_last_detail_last">{{ item.teacher }} · {{ item.date }}</div>
        </div>
      </div>
    </div>

     <!-- ── 升级提示弹窗 ──────────────────────────────────────────────────── -->
    <transition name="dialog-fade">
      <div v-if="dialogVisible" class="update-overlay" @click.self="onOverlayClick">
        <div class="update-dialog">

          <!-- 顶部插图区域 -->
          <div class="dialog-illustration">
            <div class="stars">
              <span class="star s1">✦</span>
              <span class="star s2">✦</span>
              <span class="star s3">✦</span>
            </div>
            <div class="rocket-wrap">
              <!-- 内联 SVG 火箭插图 -->
              <svg class="rocket-svg" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
                <!-- 火箭尾焰 -->
                <ellipse cx="60" cy="118" rx="14" ry="22" fill="#ffcc66" opacity="0.7"/>
                <ellipse cx="60" cy="112" rx="9" ry="14" fill="#ff9900" opacity="0.8"/>
                <!-- 火箭底座翼 -->
                <path d="M38 90 Q30 105 40 108 L50 98Z" fill="#5ecfcf"/>
                <path d="M82 90 Q90 105 80 108 L70 98Z" fill="#5ecfcf"/>
                <!-- 火箭主体 -->
                <rect x="44" y="50" width="32" height="52" rx="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
                <!-- 机头 -->
                <path d="M44 60 Q60 22 76 60Z" fill="#5ecfcf"/>
                <!-- 舷窗 -->
                <circle cx="60" cy="70" r="10" fill="#b3ecec" stroke="#5ecfcf" stroke-width="2"/>
                <circle cx="60" cy="70" r="6" fill="#e8f9f9"/>
                <!-- 图标装饰 -->
                <circle cx="32" cy="72" r="12" fill="#ff8c42" opacity="0.9"/>
                <text x="32" y="77" text-anchor="middle" font-size="12" fill="#fff">⊡</text>
                <circle cx="90" cy="60" r="11" fill="#a855f7" opacity="0.85"/>
                <text x="90" y="65" text-anchor="middle" font-size="11" fill="#fff">⚙</text>
                <circle cx="78" cy="88" r="9" fill="#3b9eff" opacity="0.85"/>
                <text x="78" y="93" text-anchor="middle" font-size="9" fill="#fff">▣</text>
              </svg>
            </div>
          </div>

          <!-- 标题 & 描述 -->
          <div class="dialog-body">
            <h3 class="dialog-title">升级提示</h3>
            <p class="dialog-desc">
              我们为您推出了更快、更稳定的 {{ updateInfo.version }} 客户端。
            </p>

            <!-- 下载中：进度条 -->
            <template v-if="downloading">
              <div class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: downloadProgress + '%' }" />
                  <span class="progress-label">{{ downloadProgress }}%</span>
                </div>
              </div>
              <p class="progress-tip">下载中…</p>
            </template>

            <!-- 下载完成：安装提示 -->
            <template v-else-if="downloaded">
              <p class="progress-tip success-tip">下载完成，即将安装并重启应用</p>
            </template>

            <!-- 下载出错 -->
            <template v-else-if="downloadError">
              <p class="progress-tip error-tip">下载失败：{{ downloadError }}</p>
              <div class="dialog-actions">
                <button class="btn-cancel" @click="closeDialog">取消</button>
                <button class="btn-upgrade" @click="startDownload">重试</button>
              </div>
            </template>

            <!-- 初始状态：操作按钮 -->
            <template v-else>
              <div class="dialog-actions">
                <button class="btn-cancel" @click="closeDialog">下次再说</button>
                <button class="btn-upgrade" @click="startDownload">立即升级</button>
              </div>
            </template>
          </div>

        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'LiveClass',
  data() {
    return {
    hasUpdate: false,
      bannerDismissed: false,
      updateInfo: {
        version: '',
        downloadUrl: '',
        description: ''
      },

      dialogVisible: false,
      downloading: false,
      downloaded: false,
      downloadProgress: 0,
      downloadError: '',
      downloadedFilePath: '',

      // 移除 IPC 监听器的清理函数
      _removeProgress: null,
      _removeComplete: null,
      _removeError: null,




      activeTab: 'live',
      dateRange: null,
      selectedClass: '',
      searchKeyword: '',
      classList: [
        { value: '1', label: '卓越班' },
        { value: '2', label: '精英班' },
        { value: '3', label: '提高班' },
        { value: '4', label: '基础班' },
        { value: '5', label: '冲刺班' },
      ],
      liveCourses: [
        {
          title: '给我报名个卓越班',
          time: '今天 11:31 - 16:31',
          status: 'living',
          minutes: 7,
          statusImg: require('@/assets/images/liveClass/zzzb.png'),
        },
        {
          title: '高中数学专题讲解',
          time: '今天 14:00 - 16:00',
          status: 'soon',
          minutes: 15,
          statusImg: require('@/assets/images/liveClass/jjks.png'),
        },
        {
          title: '语文写作技巧提升',
          time: '明天 09:00 - 11:00',
          status: 'soon',
          minutes: 30,
          statusImg: require('@/assets/images/liveClass/jjks.png'),
        },
        {
          title: '英语听力强化训练',
          time: '明天 14:00 - 16:00',
          status: 'soon',
          minutes: 55,
          statusImg: require('@/assets/images/liveClass/jjks.png'),
        },
      ],
      historyCourses: [
        { title: '立升备课-管理学', duration: '05:56', teacher: '思雅', date: '04-21', fullDate: '2026-04-21', classValue: '1' },
        { title: '高中物理力学精讲', duration: '43:12', teacher: '李明', date: '04-20', fullDate: '2026-04-20', classValue: '2' },
        { title: '化学有机物专题', duration: '51:08', teacher: '王芳', date: '04-19', fullDate: '2026-04-19', classValue: '3' },
        { title: '数学函数专项训练', duration: '38:45', teacher: '张伟', date: '04-18', fullDate: '2026-04-18', classValue: '1' },
        { title: '英语阅读理解技巧', duration: '29:33', teacher: '刘洋', date: '04-17', fullDate: '2026-04-17', classValue: '4' },
        { title: '语文古诗词赏析', duration: '44:21', teacher: '陈静', date: '04-16', fullDate: '2026-04-16', classValue: '5' },
        { title: '政治时事热点分析', duration: '35:50', teacher: '赵磊', date: '04-15', fullDate: '2026-04-15', classValue: '2' },
        { title: '历史近现代史专题', duration: '48:15', teacher: '孙丽', date: '04-14', fullDate: '2026-04-14', classValue: '3' },
        { title: '地理气候与环境', duration: '32:47', teacher: '周勇', date: '04-13', fullDate: '2026-04-13', classValue: '4' },
        { title: '生物细胞分裂讲解', duration: '41:20', teacher: '吴婷', date: '04-12', fullDate: '2026-04-12', classValue: '1' },
        { title: '物理电磁感应专题', duration: '39:05', teacher: '李明', date: '04-10', fullDate: '2026-04-10', classValue: '2' },
        { title: '数学立体几何讲解', duration: '46:33', teacher: '张伟', date: '04-08', fullDate: '2026-04-08', classValue: '1' },
        { title: '英语语法专项突破', duration: '27:18', teacher: '刘洋', date: '04-05', fullDate: '2026-04-05', classValue: '5' },
        { title: '语文现代文阅读', duration: '52:40', teacher: '陈静', date: '04-03', fullDate: '2026-04-03', classValue: '3' },
        { title: '化学电化学专题', duration: '44:55', teacher: '王芳', date: '04-01', fullDate: '2026-04-01', classValue: '4' },
      ],
    }
  },
  computed: {
    filteredHistoryCourses() {
      return this.historyCourses.filter(item => {
        const matchClass = !this.selectedClass || item.classValue === this.selectedClass
        const matchSearch = !this.searchKeyword || item.title.includes(this.searchKeyword)
        let matchDate = true
        if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
          const itemDate = new Date(item.fullDate)
          const startDate = new Date(this.dateRange[0])
          const endDate = new Date(this.dateRange[1])
          endDate.setHours(23, 59, 59, 999)
          matchDate = itemDate >= startDate && itemDate <= endDate
        }
        return matchClass && matchSearch && matchDate
      })
    },
  },
  mounted () {
    this.checkUpdate()
  },

  beforeDestroy () {
    this.removeIpcListeners()
  },

  methods: {
    // ── 检查版本更新 ────────────────────────────────────────────────────
    async checkUpdate () {
      if (!window.electronAPI?.checkForUpdate) return
      try {
        const result = await window.electronAPI.checkForUpdate()
        if (result && result.hasUpdate) {
          this.updateInfo = {
            version: result.version || '新版本',
            downloadUrl: result.downloadUrl || '',
            description: result.description || ''
          }
          this.hasUpdate = true
        }
      } catch (_) {
        // 静默处理，不影响主功能
      }
    },

    // ── 打开升级弹窗 ────────────────────────────────────────────────────
    openUpdateDialog () {
      this.dialogVisible = true
    },

    // ── 关闭弹窗（点击"下次再说"） ──────────────────────────────────────
    closeDialog () {
      if (this.downloading) return // 下载中不允许关闭
      this.dialogVisible = false
      this.bannerDismissed = false // 关闭弹窗后横幅仍保留
      this.downloadError = ''
    },

    // ── 点击遮罩层 ──────────────────────────────────────────────────────
    onOverlayClick () {
      if (!this.downloading && !this.downloaded) {
        this.closeDialog()
      }
    },

    // ── 开始下载 ─────────────────────────────────────────────────────────
    startDownload () {
      if (!window.electronAPI?.downloadUpdate) return
      if (!this.updateInfo.downloadUrl) {
        this.downloadError = '暂无下载地址，请稍后重试'
        return
      }

      this.downloading = true
      this.downloadProgress = 0
      this.downloadError = ''
      this.downloaded = false

      this.registerIpcListeners()
      window.electronAPI.downloadUpdate(this.updateInfo.downloadUrl)
    },

    // ── 注册下载进度监听 ─────────────────────────────────────────────────
    registerIpcListeners () {
      this.removeIpcListeners()

      if (window.electronAPI?.onUpdateProgress) {
        this._removeProgress = window.electronAPI.onUpdateProgress((progress) => {
          this.downloadProgress = progress
        })
      }

      if (window.electronAPI?.onUpdateComplete) {
        this._removeComplete = window.electronAPI.onUpdateComplete((filePath) => {
          this.downloading = false
          this.downloaded = true
          this.downloadedFilePath = filePath
          this.downloadProgress = 100
          // 延迟 1.5s 后自动安装
          setTimeout(() => this.installUpdate(), 1500)
        })
      }

      if (window.electronAPI?.onUpdateError) {
        this._removeError = window.electronAPI.onUpdateError((error) => {
          this.downloading = false
          this.downloadError = error || '未知错误'
        })
      }
    },

    // ── 移除 IPC 监听 ────────────────────────────────────────────────────
    removeIpcListeners () {
      if (this._removeProgress) { this._removeProgress(); this._removeProgress = null }
      if (this._removeComplete) { this._removeComplete(); this._removeComplete = null }
      if (this._removeError) { this._removeError(); this._removeError = null }
    },

    // ── 安装更新（打开安装包 & 退出应用）────────────────────────────────
    installUpdate () {
      if (window.electronAPI?.installUpdate && this.downloadedFilePath) {
        window.electronAPI.installUpdate(this.downloadedFilePath)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page-placeholder {
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  width: 100%;
  gap: 20px;
}
.page-placeholder_top {
  width: 100%;
  height: 68px;
  background: #ffffff;
  border-radius: 0px 0px 0px 0px;
  display: flex;
  justify-content: center;
  gap: 69px;
  position: relative;
}
.placeholder_top_detail {
  height: 100%;
  padding-top: 23px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 19px;
  cursor: pointer;
}
.placeholder_top_detail_text {
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}
.placeholder_top_detail_text_active {
  font-weight: bold;
  font-size: 16px;
  color: #0049ff;
}
.placeholder_top_detail_hx {
  width: 63px;
  height: 3px;
  background: #0049ff;
}
.page_top_right_fixed {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
}
.page_top_right_fixed_box {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}
.page_top_right_fixed_bk {
  width: 73px;
  height: 32px;
  border-radius: 4px 4px 4px 4px;
  border: 1px solid #999999;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.page_top_right_fixed_bk_icon {
  width: 16px;
  height: 16px;
}
.page_top_right_fixed_bk_text {
  font-size: 16px;
  font-weight: 400;
  color: #333333;
}
.page_top_right_fixed_add {
  width: 106px;
  height: 32px;
  background: #0049ff;
  border-radius: 4px 4px 4px 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.page_top_right_fixed_add_icon {
  width: 16px;
  height: 16px;
}
.page_top_right_fixed_add_text {
  color: #ffffff;
  font-size: 16px;
}
.page-placeholder_last {
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
  padding: 0 18px;
  box-sizing: border-box;
}
.placeholder_last_top {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 23px;
}
.placeholder_last_top_total {
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}
.placeholder_last_top_btn {
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  color: #0049ff;
  flex: 1;
  width: 0;
}
.placeholder_last_top_sx{
  width: 25px;
  height: 25px;
  cursor: pointer;
}
.placeholder_last_table {
  width: 100%;
  margin-top: 18px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 19px;
}
.placeholder_last_table_detail {
  position: relative;
  width: 314px;
  height: 163px;
  background: #ffffff;
  box-shadow: 0px 0px 8px 0px rgba(0, 73, 255, 0.1);
  border-radius: 8px 8px 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.placeholder_last_table_detail_statusImg {
  width: 67px;
  height: 67px;
  position: absolute;
  top: 0;
  right: 0;
}
.placeholder_last_table_detail_last {
  width: 100%;
  height: 43px;
  background: rgba(202, 217, 255, 0.2);
  border-radius: 0px 0px 8px 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  color: #0049ff;
}
.placeholder_last_table_detail_last_disable {
  font-weight: bold;
  font-size: 14px;
  color: #666666 !important;
  cursor: not-allowed !important;
}
.placeholder_last_table_detail_top {
  width: 100%;
  flex: 1;
  height: 0;
  padding: 12px 10px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
}
.placeholder_last_table_detail_top_last {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.placeholder_last_table_detail_top_last_time {
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}
.placeholder_last_table_detail_top_last_leve {
  color: #333333;
  font-size: 14px;
}
.placeholder_last_table_detail_top_last_leve_yj {
  color: #0049ff;
  font-weight: bold;
  font-size: 20px;
}
.placeholder_last_table_detail_top_last_leve_jl {
  color: #ff2e00;
  font-weight: bold;
  font-size: 20px;
}
.placeholder_last_table_detail_top_top {
  width: 100%;
}
.placeholder_last_table_detail_top_top_title {
  font-weight: bold;
  font-size: 14px;
  color: #333333;
  padding-right: 77px;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.placeholder_last_table_detail_top_top_xq {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-top: 10px;
  gap: 4px;
  cursor: pointer;
}
.placeholder_last_table_detail_top_top_xq_text {
  color: #0049ff;
  font-size: 14px;
  font-weight: 400;
}
.placeholder_last_table_detail_top_top_xq_icon {
  width: 13px;
  height: 9px;
}
.ls_top {
  width: 100%;
  height: 49px;
  background: #ffffff;
  border-radius: 4px 4px 4px 4px;
  padding: 0 24px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ls_top_right {
  padding: 3px 0 3px 21px;
  box-sizing: border-box;
  border-left: 1px solid #d9d9d9;
  font-weight: 400;
  font-size: 14px;
  color: #999999;
  white-space: nowrap;
}
.ls_top_left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 25px;
}
.ls_top_left_time {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.ls_top_left_time_icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.ls_top_left_time_text {
  font-weight: 400;
  font-size: 16px;
  color: #333333;
}
.ls_top_left_time_text span {
  padding: 0 15px;
  box-sizing: border-box;
}
.ls_top_left_class {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  padding: 3px 0 3px 21px;
  box-sizing: border-box;
  border-left: 1px solid #d9d9d9;
  width: 180px;
}
.ls_top_left_search_sx {
  width: 1px;
  height: 26px;
  background: #d9d9d9;
  margin-right: 25px;
}
.ls_top_left_search {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.ls_top_left_search_box {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 268px;
  height: 36px;
  background: #ffffff;
  border-radius: 28px 28px 28px 28px;
  border: 1px solid #d9d9d9;
  padding: 0 14px;
  box-sizing: border-box;
  gap: 8px;
}
.ls_top_left_search_box_input {
  flex: 1;
  width: 0;
}
.ls_top_left_search_box_input input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333333;
  background: transparent;
}
.ls_last {
  width: 100%;
  margin-top: 19px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}
.ls_last_detail {
  padding: 6px 5px 11px 5px;
  box-sizing: border-box;
  width: 193px;
  height: 220px;
  background: #ffffff;
  box-shadow: 0px 0px 8px 0px rgba(0, 73, 255, 0.1);
  border-radius: 8px 8px 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
}
.ls_last_detail_img {
  width: 100%;
  height: 108px;
  border-radius: 4px;
}
.ls_last_detail_center {
  flex: 1;
  width: 100%;
  height: 0;
  padding: 0 5px;
  box-sizing: border-box;
  margin-top: 5px;
}
.ls_last_detail_title {
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.ls_last_detail_time {
  display: inline-block;
  margin-top: 6px;
  height: 19px;
  border-radius: 10px;
  background: #cad9ff;
  padding: 0 9px;
  line-height: 19px;
  box-sizing: border-box;
  font-weight: 400;
  font-size: 12px;
  color: #363333;
}
.ls_last_detail_last {
  padding: 0 5px;
  box-sizing: border-box;
  font-weight: 400;
  font-size: 12px;
  color: #666666;
}
.ls_last_detail_options {
  position: absolute;
  top: 13px;
  right: 12px;
  width: 34px;
  height: 12px;
  cursor: pointer;
}
.ls_last_detail_options_box {
  width: 100%;
  height: 100%;
  border-radius: 7px;
  background: #0049ff;
  display: flex;
  justify-content: center;
  align-items: center;
}
.ls_last_detail_options_box_img {
  width: 20px;
  height: 4px;
}

/* Element UI 组件样式覆盖 */
.ls_date_picker {
  ::v-deep .el-range-editor {
    border: none;
    box-shadow: none;
    padding: 0;
    height: auto;
    background: transparent;
    &:hover,
    &.is-active {
      border: none;
      box-shadow: none;
    }
  }
  ::v-deep .el-range-input {
    font-size: 14px;
    color: #333333;
    background: transparent;
    width: 88px;
  }
  ::v-deep .el-range-separator {
    font-size: 14px;
    color: #333333;
    padding: 0 4px;
    line-height: normal;
  }
  ::v-deep .el-range__icon {
    display: none;
  }
  ::v-deep .el-range__close-icon {
    font-size: 14px;
  }
}

.ls_class_select {
  flex: 1;
  width: 0;
  ::v-deep .el-input__inner {
    border: none;
    box-shadow: none;
    padding: 0;
    height: auto;
    line-height: normal;
    font-size: 14px;
    color: #333333;
    background: transparent;
  }
  ::v-deep .el-input__suffix {
    right: 0;
  }
  ::v-deep .el-input {
    font-size: 14px;
  }
}




/* ── 顶部横幅 ─────────────────────────────────────────────────────────────── */
.update-banner {
  display: flex;
  align-items: center;
  padding: 9px 20px;
  background: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  font-size: 13px;
  color: #595959;
  gap: 8px;
  margin-bottom: 19px;

  .banner-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #faad14;
    flex-shrink: 0;
  }

  .banner-text {
    flex: 1;
  }

  .banner-link {
    color: #13c2c2;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: all 0.3s ease;
}
.banner-fade-enter,
.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* ── 弹窗遮罩 ─────────────────────────────────────────────────────────────── */
.update-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter,
.dialog-fade-leave-to {
  opacity: 0;
}

/* ── 弹窗卡片 ─────────────────────────────────────────────────────────────── */
.update-dialog {
  background: #fff;
  border-radius: 16px;
  width: 340px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

/* ── 顶部插图 ─────────────────────────────────────────────────────────────── */
.dialog-illustration {
  position: relative;
  background: linear-gradient(160deg, #d9f7fa 0%, #e8f9f9 60%, #f0fdfe 100%);
  padding: 28px 0 0;
  display: flex;
  justify-content: center;
  min-height: 150px;

  .stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .star {
    position: absolute;
    color: #ffe066;
    font-size: 16px;
    animation: twinkle 2s ease-in-out infinite;

    &.s1 { top: 18px; left: 40px; font-size: 14px; animation-delay: 0s; }
    &.s2 { top: 28px; right: 50px; font-size: 18px; animation-delay: 0.6s; }
    &.s3 { top: 10px; right: 90px; font-size: 12px; animation-delay: 1.2s; }
  }

  .rocket-wrap {
    position: relative;
    z-index: 1;
  }

  .rocket-svg {
    width: 120px;
    height: 140px;
    display: block;
    filter: drop-shadow(0 8px 16px rgba(94, 207, 207, 0.3));
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* ── 弹窗内容区 ───────────────────────────────────────────────────────────── */
.dialog-body {
  padding: 20px 24px 0;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 10px;
}

.dialog-desc {
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
  margin: 0 0 20px;
}

/* ── 操作按钮 ─────────────────────────────────────────────────────────────── */
.dialog-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
  margin: 0 -24px;

  button {
    flex: 1;
    height: 50px;
    border: none;
    background: transparent;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    &:active {
      background: #ebebeb;
    }
  }

  .btn-cancel {
    color: #8c8c8c;
    border-right: 1px solid #f0f0f0;
  }

  .btn-upgrade {
    color: #13c2c2;
    font-weight: 500;
  }
}

/* ── 进度条 ───────────────────────────────────────────────────────────────── */
.progress-wrap {
  margin: 0 0 10px;
}

.progress-bar {
  position: relative;
  height: 20px;
  background: #e8e8e8;
  border-radius: 10px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #36cfc9, #13c2c2);
    border-radius: 10px;
    transition: width 0.3s ease;
  }

  .progress-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

.progress-tip {
  font-size: 13px;
  color: #8c8c8c;
  margin: 6px 0 20px;
}

.success-tip {
  color: #52c41a;
}

.error-tip {
  color: #ff4d4f;
}

::v-deep .el-input--mini .el-input__icon{
  line-height: 1!important;
}
</style>
