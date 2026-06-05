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
      <div class="page_top_right_fixed" v-if="isTeacher">
        <div class="page_top_right_fixed_box">
          <div class="page_top_right_fixed_bk">
            <img src="@/assets/images/liveClass/bk_icon.png" class="page_top_right_fixed_bk_icon" alt="">
            <div class="page_top_right_fixed_bk_text">备课</div>
          </div>
          <div class="page_top_right_fixed_add" v-if="isAdd" @click="showCreateClass = true">
            <img src="@/assets/images/liveClass/add_icon.png" class="page_top_right_fixed_add_icon" alt="">
            <div class="page_top_right_fixed_add_text">新建课堂</div>
          </div>
        </div>
      </div>
    </div>

    <!-- macOS 屏幕录制权限引导弹窗 -->
    <div v-if="showScreenPermissionDialog" class="screen-permission-mask">
      <div class="screen-permission-dialog">
        <div class="screen-permission-icon">🖥️</div>
        <div class="screen-permission-title">需要开启屏幕录制权限</div>
        <div class="screen-permission-desc" v-if="screenPermissionStatus === 'not-determined'">
          首次使用屏幕共享需要手动授权。请前往<br>
          <strong>系统设置 → 隐私与安全性 → 屏幕录制</strong><br>
          勾选「立升直播」后，<strong>重启应用</strong>即可正常使用屏幕共享。
        </div>
        <div class="screen-permission-desc" v-else>
          屏幕共享权限已被拒绝。请前往<br>
          <strong>系统设置 → 隐私与安全性 → 屏幕录制</strong><br>
          勾选「立升直播」后，<strong>重启应用</strong>即可正常使用屏幕共享。
        </div>
        <div class="screen-permission-steps">
          <div class="screen-permission-step">
            <span class="step-num">1</span>
            <span>点击「前往系统设置」按钮</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">2</span>
            <span>在列表中找到「立升直播」并勾选</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">3</span>
            <span>重启应用后重新进入直播间</span>
          </div>
        </div>
        <div class="screen-permission-btns">
          <div class="screen-permission-btn-primary" @click="openScreenPreferences">前往系统设置</div>
          <div class="screen-permission-btn-secondary" @click="showScreenPermissionDialog = false">稍后再说</div>
        </div>
      </div>
    </div>

    <!-- macOS 屏幕采集失败弹窗（权限已授权但系统无法采集屏幕） -->
    <div v-if="showScreenCaptureFailedDialog" class="screen-permission-mask">
      <div class="screen-permission-dialog">
        <div class="screen-permission-icon">⚠️</div>
        <div class="screen-permission-title">屏幕共享启动失败</div>
        <div class="screen-permission-desc">
          系统暂时无法采集屏幕画面（可能由休眠唤醒或系统资源不足引起）。<br>
          请<strong>重启应用</strong>后重新尝试屏幕共享。
        </div>
        <div class="screen-permission-steps">
          <div class="screen-permission-step">
            <span class="step-num">1</span>
            <span>退出并重新打开「立升直播」</span>
          </div>
          <div class="screen-permission-step">
            <span class="step-num">2</span>
            <span>重新进入直播间后再次开启屏幕共享</span>
          </div>
        </div>
        <div class="screen-permission-btns">
          <div class="screen-permission-btn-secondary" @click="showScreenCaptureFailedDialog = false">知道了</div>
        </div>
      </div>
    </div>

    <!-- 直播全屏页面 -->
    <div class="page-placeholder_last full-screen" v-if="activeTab === 'liveui'">
       <iframe :src="liveUrl" style="width: 100%; height: 100vh; background: #1E1E1E;" frameborder="0" allowfullscreen allow="camera;microphone;autoplay;display-capture;" allowusermedia></iframe>
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
        <div class="placeholder_last_top_total">共有 {{ liveCourses.length }} 节课</div>
        <div class="placeholder_last_top_btn" @click="openSchedule">查看课表</div>
        <img src="@/assets/images/liveClass/refresh.png" class="placeholder_last_top_sx" alt="" @click="fetchLiveList">
      </div>
      <div class="placeholder_last_table" v-loading="liveLoading">
        <template v-if="!liveLoading">
          <div class="placeholder_last_table_detail" v-for="(item, index) in liveCourses" :key="index" @click="enterLiveRoom(item)">
            <img v-if="item.statusImg" :src="item.statusImg" class="placeholder_last_table_detail_statusImg" alt="">
            <div class="placeholder_last_table_detail_top">
              <div class="placeholder_last_table_detail_top_top">
                <div class="placeholder_last_table_detail_top_top_title">{{ item.title }}</div>
                <div class="placeholder_last_table_detail_top_top_xq" @click.stop="openDetail(item)">
                  <div class="placeholder_last_table_detail_top_top_xq_text">详情</div>
                  <img src="@/assets/images/liveClass/xq_icon.png" class="placeholder_last_table_detail_top_top_xq_icon" alt="">
                </div>
              </div>
              <div class="placeholder_last_table_detail_top_last">
                <div class="placeholder_last_table_detail_top_last_time">{{ item.time }}</div>
                <div class="placeholder_last_table_detail_top_last_leve" v-if="item.status === 'living'">
                  已直播 <span class="placeholder_last_table_detail_top_last_leve_yj">{{ item.minutes }}</span> 
                </div>
                <div class="placeholder_last_table_detail_top_last_leve" v-else>
                  距离直播还有 <span class="placeholder_last_table_detail_top_last_leve_jl">{{ item.minutes }}</span> 
                </div>
              </div>
            </div>
            <div
              class="placeholder_last_table_detail_last"
            >进入直播
              <div v-if="isTeacher" class="placeholder_last_table_detail_last_del" :class="{ 'notallow': item.status === 'living', 'allow': item.status !== 'living' }" @click.stop="handleDeleteLive(item)">
                <img src="@/assets/images/liveClass/no_del.png">
              </div>
            </div>
          </div>
          <empty-state v-if="liveCourses.length === 0" description="暂无直播课堂" />
        </template>
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
              filterable
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
            <el-input
              v-model="searchKeyword"
              placeholder="搜索课程"
              clearable
              size="mini"
              class="ls_search_input"
            >
              <img
                slot="prefix"
                src="@/assets/images/liveClass/search.png"
                class="ls_top_left_time_icon ls_search_prefix_icon"
                alt=""
              >
            </el-input>
          </div>
        </div>
        <div class="ls_top_right">共{{ historyCourses.length }}节课</div>
      </div>
      <div class="ls_last" v-loading="historyLoading">
        <template v-if="!historyLoading">
          <div class="ls_last_detail" v-for="(item, index) in historyCourses" :key="item.id || index" @click="openVideoPlayer(item)">
            <div class="ls_last_detail_options" @click.stop v-if="isTeacher">
              <el-popover
                placement="bottom-end"
                trigger="click"
                popper-class="ls_options_popover"
                :visible-arrow="false"
              >
                <div class="ls_options_menu">
                  <div class="ls_options_menu_item" @click="publishAfterClassTest(item)">
                    <span>发布课后测</span>
                  </div>
                </div>
                <div slot="reference" class="ls_last_detail_options_box">
                  <img src="@/assets/images/liveClass/options.png" class="ls_last_detail_options_box_img" alt="">
                </div>
              </el-popover>
            </div>
            <img :src="item.cover || require('@/assets/images/such.png')" class="ls_last_detail_img" alt="">
            <div class="ls_last_detail_center">
              <div class="ls_last_detail_title">{{ item.name }}</div>
              <div class="ls_last_detail_time">{{ formatDuration(item.fileList && item.fileList.length != 0 ? (item.fileList[0].duration) :0) }}</div>
            </div>
            <div class="ls_last_detail_last">{{ item.teacherName }} · {{ formatDate(item.generationTime) }}</div>
          </div>
          <empty-state v-if="historyCourses.length === 0" description="暂无历史课堂" />
        </template>
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


    <!-- 新建课堂 -->
    <transition name="mask-fade">
    <div class="mask" v-if="showCreateClass">
      <div class="mask_con"  >
          <div class="masl_con_dialog create-class-dialog" v-loading="createLoading" element-loading-background="rgba(255,255,255,0.7)">
            <div class="masl_con_dialog_top" @click="showCreateClass = false">
              <img src="@/assets/images/liveClass/backIcon.png" class="masl_con_dialog_top_back" alt="" @click="showCreateClass = false">
              <div>新建课堂</div>
            </div>
            <div class="masl_con_dialog_last">
              <div class="masl_con_dialog_last_shadow">
                <div class="masl_con_dialog_last_shadow_detail">
                  <el-input style="width:100%" placeholder="输入课堂名称" v-model="name"  maxlength="40"
            show-word-limit></el-input>
                </div>
                <div class="masl_con_dialog_last_shadow_hx"></div>
                <div class="masl_con_dialog_last_shadow_detail">
                  <el-input  style="width:100%" placeholder="输入描述信息" v-model="instr"   maxlength="40"
            show-word-limit></el-input>
                </div>
              </div>
              <div class="masl_con_dialog_last_shadow">
                <div class="masl_con_dialog_last_shadow_top">
                  <div class="masl_con_dialog_last_shadow_top_detail">
                    <img src="@/assets/images/liveClass/timeIcon.png" class="masl_con_dialog_last_shadow_top_detail_icon" alt="">
                    <el-date-picker
                      v-model="classStartTime"
                      type="datetime"
                      placeholder="选择上课时间"
                      format="yyyy-MM-dd HH:mm"
                      value-format="yyyy-MM-dd HH:mm"
                      :clearable="false"
                      class="class-time-picker"
                      :picker-options="startTimePickerOptions"
                      @change="handleStartTimeChange"
                    />
                  </div>
                  <div class="masl_con_dialog_last_shadow_top_detail">
                    <div class="masl_con_dialog_last_shadow_top_detail_text">上课时长:</div>
                    <el-select v-model="classDuration" class="class-duration-select" :clearable="false">
                      <el-option
                        v-for="item in durationOptions"
                        :key="item"
                        :label="item + '分钟'"
                        :value="item"
                      />
                    </el-select>
                  </div>
                </div>
                <!-- <div class="masl_con_dialog_last_shadow_hx"></div>
                <div class="masl_con_dialog_last_shadow_second">
                  <div class="masl_con_dialog_last_shadow_second_label">上课对象：</div>
                  <div class="masl_con_dialog_last_shadow_second_choose">
                    <div class="masl_con_dialog_last_shadow_second_choose_detail">
                      <img src="@/assets/images/liveClass/yes.png" class="masl_con_dialog_last_shadow_second_choose_detail_no" alt="">
                     
                      <div class="masl_con_dialog_last_shadow_second_choose_detail_text">学生</div>
                    </div>
                     <div class="masl_con_dialog_last_shadow_second_choose_detail">
                      <img src="@/assets/images/liveClass/disabled.png" class="masl_con_dialog_last_shadow_second_choose_detail_no" alt="">
                      <div class="masl_con_dialog_last_shadow_second_choose_detail_text">老师</div>
                    </div>
                  </div>
                </div> -->
                <div class="masl_con_dialog_last_shadow_hx"></div>
                <el-select
                  v-model="createClassId"
                  placeholder="选择班级"
                  class="masl_con_dialog_last_shadow_third"
                  clearable
                  filterable
                  multiple
                  collapse-tags
                >
                  <el-option
                    v-for="cls in classList"
                    :key="cls.value"
                    :label="cls.label"
                    :value="cls.value"
                  />
                </el-select>
              </div>
              
              <div class="masl_con_dialog_last_shadow">
                <div class="masl_con_dialog_last_shadow_four">
                  <img src="@/assets/images/liveClass/lzfs.png" class="masl_con_dialog_last_shadow_four_icon" alt="">
                  <div class="masl_con_dialog_last_shadow_four_text">是否支持上麦：</div>
                </div>
                <div class="masl_con_dialog_last_shadow_hx"></div>
                <div class="masl_con_dialog_last_shadow_five">
                  <div
                    v-for="item in allowMicOptions"
                    :key="item.value"
                    class="masl_con_dialog_last_shadow_second_choose_detail"
                    @click="allowMic = item.value"
                  >
                    <img
                      :src="allowMic === item.value ? require('@/assets/images/liveClass/yes.png') : require('@/assets/images/liveClass/no.png')"
                      class="masl_con_dialog_last_shadow_second_choose_detail_no"
                      alt=""
                    >
                    <div class="masl_con_dialog_last_shadow_second_choose_detail_text">{{ item.label }}</div>
                  </div>
                </div>
              </div>

              <div class="masl_con_dialog_last_shadow">
                <div class="masl_con_dialog_last_shadow_four">
                  <img src="@/assets/images/liveClass/lzfs.png" class="masl_con_dialog_last_shadow_four_icon" alt="">
                  <div class="masl_con_dialog_last_shadow_four_text">录制方式：</div> 
                </div>
                 <div class="masl_con_dialog_last_shadow_hx"></div>
                 <div class="masl_con_dialog_last_shadow_five">
                    <div
                      v-for="item in recordModeOptions"
                      :key="item.value"
                      class="masl_con_dialog_last_shadow_second_choose_detail"
                      @click="recordMode = item.value"
                    >
                      <img
                        :src="recordMode == item.value ? require('@/assets/images/liveClass/yes.png') : require('@/assets/images/liveClass/no.png')"
                        class="masl_con_dialog_last_shadow_second_choose_detail_no"
                        alt=""
                      >
                      <div class="masl_con_dialog_last_shadow_second_choose_detail_text">{{ item.label }}</div>
                    </div>
                 </div>
              </div>
              <div class="masl_con_dialog_last_shadow">
                <div class="masl_con_dialog_last_shadow_four">
                  <img src="@/assets/images/liveClass/lzfs.png" class="masl_con_dialog_last_shadow_four_icon" alt="">
                  <div class="masl_con_dialog_last_shadow_four_text">回放设置：</div>
                </div>
                <div class="masl_con_dialog_last_shadow_hx"></div>
                <div class="masl_con_dialog_last_shadow_five">
                  <div
                    v-for="item in isPlayBackOptions"
                    :key="item.value"
                    class="masl_con_dialog_last_shadow_second_choose_detail"
                    @click="isPlayBack = item.value"
                  >
                    <img
                      :src="isPlayBack === item.value ? require('@/assets/images/liveClass/yes.png') : require('@/assets/images/liveClass/no.png')"
                      class="masl_con_dialog_last_shadow_second_choose_detail_no"
                      alt=""
                    >
                    <div class="masl_con_dialog_last_shadow_second_choose_detail_text">{{ item.label }}</div>
                  </div>
                </div>
              </div>
              <div class="masl_con_dialog_last_btn">
                <div class="masl_con_dialog_last_btn_cancel" @click="showCreateClass = false">取消</div>
                <div class="masl_con_dialog_last_btn_confirm" @click="handleCreateClass">确定</div>
              </div>
            </div>
          </div>
      </div>
    </div>
    </transition>

    <!-- 课表 -->
    <transition name="mask-fade">
      <div class="mask" v-if="showSchedule">
        <div class="mask_con">
          <div class="schedule-panel create-class-dialog">
            <div class="masl_con_dialog_top">
              <img src="@/assets/images/liveClass/backIcon.png" class="masl_con_dialog_top_back" alt="" @click="showSchedule = false">
              <div>课表</div>
            </div>
            <div class="schedule-body">
              <div class="schedule-body_box">
                <!-- 日历 -->
                <div class="schedule-calendar" v-loading="scheduleLoading">
                  <div class="schedule-cal-header">
                    <div class="schedule-cal-nav-box" @mousedown.prevent @click="prevScheduleMonth">
                      <i class="el-icon-arrow-left schedule-cal-nav"></i>
                    </div>
                    <div class="schedule-cal-selects">
                      <el-select v-model="scheduleMonth" size="mini" class="schedule-cal-select-month" :clearable="false">
                        <el-option v-for="(m, i) in monthNames" :key="i" :label="m" :value="i" />
                      </el-select>
                      <el-select v-model="scheduleYear" size="mini" class="schedule-cal-select-year" :clearable="false">
                        <el-option v-for="y in yearRange" :key="y" :label="y + ''" :value="y" />
                      </el-select>
                    </div>
                    <div class="schedule-cal-nav-box" @mousedown.prevent @click="nextScheduleMonth">
                      <i class="el-icon-arrow-right schedule-cal-nav"></i>
                    </div>
                  </div>
                  <div class="schedule-cal-weekdays">
                    <div v-for="d in weekDays" :key="d" class="schedule-cal-weekday">{{ d }}</div>
                  </div>
                  <div class="schedule-cal-grid">
                    <div
                      v-for="(cell, idx) in calendarCells"
                      :key="idx"
                      class="schedule-cal-cell"
                      :class="{
                        'is-other-month': !cell.currentMonth,
                        'is-today': cell.isToday,
                        'is-selected': cell.dateStr === scheduleSelectedDate,
                        'has-class': cell.hasClass
                      }"
                      @click="cell.currentMonth && selectScheduleDate(cell.dateStr)"
                    >
                      <span class="schedule-cal-day-num">{{ cell.isToday ? '今' : cell.day }}</span>
                    </div>
                  </div>
                </div>

                <!-- 课程列表 -->
                <div class="schedule-list" v-if="scheduleSelectedDate">
                  <div class="schedule-list-title">
                    {{ scheduleSelectedDateLabel }}（共{{ scheduleCoursesForDate.length }}节）
                  </div>
                  <div class="schedule-timeline" v-if="scheduleCoursesForDate.length > 0">
                    <div
                      v-for="(course, idx) in scheduleCoursesForDate"
                      :key="idx"
                      class="schedule-timeline-item"
                    >
                      <div class="schedule-timeline-left">
                        <div class="schedule-timeline-dot">
                          <div class="schedule-timeline-dot_white"></div>
                        </div>
                        <div class="schedule-timeline-line" v-if="idx < scheduleCoursesForDate.length - 1"></div>
                      </div>
                      <div class="schedule-timeline-content">
                        <div class="schedule-timeline-header">
                          <div class="schedule-timeline-time">{{ course.startTime }}{{ course.endTime ? '-' + course.endTime : '' }}</div>
                          <div
                            class="schedule-timeline-status"
                            :class="{
                              'status-living': course.status === '直播中',
                              'status-finished': course.status === '已结束已开播' ||  course.status === '已结束未开播',
                              'status-soon': course.status === '未开始',
                              'status-not-broadcast': course.status === '未开播',
                              'status-unknown': course.status === '未知'
                            }"
                          >
                            <i class="status-dot"></i>
                            <span>{{ course.status === '已结束已开播' ||  course.status === '已结束未开播'?'已结束':course.status}}</span>
                          </div>
                        </div>
                        <div class="schedule-timeline-name">{{ course.name }}</div>
                        <div class="schedule-timeline-actions">
                          <button
                            v-if="course.status === '直播中' || course.status === '未开始'"
                            class="schedule-action-btn schedule-action-enter"
                            @click="enterLiveRoomFromSchedule(course)"
                          >进入直播间</button>
                          <button
                            v-if="course.status === '已结束已开播' ||  course.status === '已结束未开播'"
                            class="schedule-action-btn schedule-action-replay"
                            @click="openVideoFromSchedule(course)"
                          >查看回放</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="schedule-empty" v-else>
                    <div class="schedule-empty-text">暂无课程</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 课程详情弹窗 -->
    <dialog-custome
      :visible="showDetailDialog"
      title="直播详情"
      width="490px"
      :height="isTeacher ? (detailShareEnabled ? '596px' : '360px') : '280px'"
      :bg-color="'#FFFFFF'"
      @close="onDialogCloseAdd"
      :show-cancel="false"
      :show-confirm="false"
      :show-close="true"
      @cancel="showDetailDialog = false"
    >
      <div class="cdc-wrap" v-loading="detailLoading" v-if="selectedCourseItem">
        <div class="cdc-liveTitle">{{selectedCourseItem.title}}</div>
        <div class="cdc-info-row">
          <span class="cdc-label">直播详情：</span>
          <span class="cdc-value">{{ selectedCourseItem.description || '-' }}</span>
        </div>
        <div class="cdc-info-row">
          <span class="cdc-label">主讲老师：</span>
          <span class="cdc-value">{{ selectedCourseItem.teacherName2 || '-' }}</span>
        </div>
        <div class="cdc-info-row" v-if="isTeacher">
          <span class="cdc-label">参与班级：</span>
          <span class="cdc-value">{{ selectedCourseItem.classInfosName }}</span>
        </div>

        <div class="cdc-divider" v-if="isTeacher"></div>

        <div class="cdc-share-header" v-if="isTeacher">
          <span class="cdc-share-label">分享链接</span>
          <el-switch :value="detailShareEnabled" active-color="#0049FF" @change="handleShareToggle"></el-switch>
        </div>

        <template v-if="detailShareEnabled">
          <div class="cdc-share-url-row">
            <div class="cdc-share-url">{{ selectedCourseItem.shareUrl || '' }}</div>
           
          <img  @click="copyShareLink" src="@/assets/images/liveClass/copy_icon.png" class="cdc-copy-icon" alt="" onerror="this.style.display='none'">
       
           
          </div>
          <div class="cdc-share-hint">分享直播链接，通过网页观看直播</div>
          <div class="cdc-qr-wrap">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" class="cdc-qr-img" alt="二维码" />
            <div v-else class="cdc-qr-placeholder"></div>
          </div>
          <div class="cdc-qr-hint">用微信/QQ扫码分享给任意学员</div>
        </template>

        <div class="cdc-bottom">
          <div class="cdc-time-row">
            <span class="cdc-time-text">{{ selectedCourseItem.time }}</span>
            <span class="cdc-live-min" v-if="selectedCourseItem.status === 'living'">
              已直播 <span class="cdc-min-num">{{ selectedCourseItem.minutes }}</span> 
            </span>
          </div>
          <div
            class="cdc-enter-btn"
            @click="enterLiveFromDetail"
          >进入直播</div>
        </div>
      </div>
    </dialog-custome>

    <history-video-player
      :visible="playerVisible"
      :main-source="playerSource"
      :teacher-source="playerTeacherSource"
      :title="playerTitle"
      :allow-download="playerAllowDownload"
      @close="playerVisible = false"
    />

  </div>
</template>

<script>
import { getLiveList, getHistoryList, getClassList, createLiveClass, createAliyunClass, getScheduleList, deleteLiveClass, getLiveDetail, getLiveShare, updateLive } from '@/api/modules/teacher'
import { checkTempStudentLiveRecord } from '@/api/modules/student'
import EmptyState from '@/components/EmptyState/index.vue'
import DialogCustome from '@/components/DialogCustome/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import { getToken, getUserInfo } from '@/utils/auth'
import { mapGetters } from 'vuex'

export default {
  name: 'LiveClass',
  components: { EmptyState, DialogCustome, VideoPlayer },
  data() {
    return {
      liveUrl: '',
      bannerDismissed: false,

      dialogVisible: false,
      downloading: false,
      downloaded: false,
      downloadProgress: 0,
      downloadError: '',
      downloadedFilePath: '',

      _removeProgress: null,
      _removeComplete: null,
      _removeError: null,

      activeTab: 'live',
      dateRange: null,
      selectedClass: '',
      searchKeyword: '',
      classList: [],
      liveCourses: [],
      historyCourses: [],
      liveLoading: false,
      historyLoading: false,
      _searchTimer: null,

      name:'',
      instr:'',
      showCreateClass: false,
      classStartTime: '',
      classDuration: 240,
      durationOptions: [15, 30, 40, 45, 60, 75, 90, 120, 135, 150, 180, 200, 240, 300],
      recordMode: 1,
      allowMic: 1,
      allowMicOptions: [{ label: '支持', value: 1 }, { label: '不支持', value: 0 }],
      isPlayBack: 1,
      isPlayBackOptions: [{ label: '开启', value: 1 }, { label: '关闭', value: 0 }],
      createClassId: [],
      createLoading: false,

      showDetailDialog: false,
      selectedCourseItem: null,
      detailShareEnabled: false,
      detailLoading: false,

      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      playerAllowDownload: '2',

      showSchedule: false,
      scheduleYear: new Date().getFullYear(),
      scheduleMonth: new Date().getMonth(),
      scheduleSelectedDate: '',
      weekDays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      scheduleApiData: [],
      scheduleLoading: false,

      // macOS 屏幕录制权限引导弹窗
      showScreenPermissionDialog: false,
      screenPermissionStatus: '',   // 'not-determined' | 'denied' | 'restricted'
      _removeScreenPermissionDenied: null,
      // macOS 屏幕采集失败弹窗（权限已授权但系统无法获取屏幕源）
      showScreenCaptureFailedDialog: false,
      _removeScreenCaptureFailed: null,
      isTeacher: false
    }
  },
  watch: {
    allowMic(val) {
      const validValues = this.recordModeOptions.map(o => o.value)
      if (!validValues.includes(this.recordMode)) {
        this.recordMode = 1
      }
    },
    scheduleYear(val) {
      if (this.showSchedule) {
        this.fetchScheduleData(val, this.scheduleMonth + 1)
      }
    },
    scheduleMonth(val) {
      if (this.showSchedule) {
        this.fetchScheduleData(this.scheduleYear, val + 1)
      }
    },
    showCreateClass(val) {
      if (val) {
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        this.classStartTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
        this.classDuration = 240
        this.recordMode = 1
        this.allowMic = 1
        this.isPlayBack = 1
        this.createClassId = []
        const userName = this.$store.getters['user/realName'] || ''
      
        const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
        this.name = userName ? `${userName}的课堂${dateStr}` : ''
        this.fetchClassList()
      } else {
        this.name = ''
        this.instr = ''
        this.classStartTime = ''
        this.classDuration = 240
        this.recordMode = 1
        this.allowMic = 1
        this.isPlayBack = 1
        this.createClassId = []
      }
    },
    activeTab(val) {
      if (val === 'history') {
        this.stopLiveRefreshTimer()
        this.fetchHistoryList()
      } else if (val === 'live') {
        this.fetchLiveList()
        this.startLiveRefreshTimer()
      } else {
        this.stopLiveRefreshTimer()
      }
    },
    dateRange() {
      this.fetchHistoryList()
    },
    selectedClass() {
      this.fetchHistoryList()
    },
    searchKeyword() {
      clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => this.fetchHistoryList(), 400)
    },
  },
  created() {
    this.isTeacher = getUserInfo().role === 'TEACHER'
  },
  mounted() {
    this.checkUpdate()
    this.fetchLiveList()
    this.fetchClassList()
    this.startLiveRefreshTimer()
    this._onVisibilityChange = () => {
      if (document.hidden) {
        this.stopLiveRefreshTimer()
      } else if (this.activeTab === 'live') {
        this.startLiveRefreshTimer()
      }
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)
    console.log(localStorage.getItem('openCreateClass'),'打印看看')
    if (localStorage.getItem('openCreateClass') === '1') {
      localStorage.removeItem('openCreateClass')
      this.showCreateClass = true
    }
    
    // 监听 iframe 直播退出消息
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data;
        this.activeTab = 'live';
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI.minimizeWindow();
      }
    });

    // macOS：监听主进程通知——屏幕录制权限被拒绝
    if (window.electronAPI?.onScreenPermissionDenied) {
      this._removeScreenPermissionDenied = window.electronAPI.onScreenPermissionDenied((data) => {
        this.screenPermissionStatus = data?.status || 'denied'
        this.showScreenPermissionDialog = true
      })
    }
    // macOS：监听主进程通知——权限已授权但屏幕采集仍然失败
    if (window.electronAPI?.onScreenCaptureFailed) {
      this._removeScreenCaptureFailed = window.electronAPI.onScreenCaptureFailed(() => {
        this.showScreenCaptureFailedDialog = true
      })
    }
  },
  beforeDestroy() {
    this.removeIpcListeners()
    clearTimeout(this._searchTimer)
    this.stopLiveRefreshTimer()
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
    }
  },
  computed: {
    ...mapGetters('user', ['userInfo']),
    ...mapGetters('app', ['hasUpdate', 'isForceUpdate', 'updateInfo']),
    recordModeOptions() {
      const base = [
        { label: '无头像录制（白板）', value: 1 },
        { label: '录老师头像（白板+头像）', value: 2 }
      ]
      if (this.allowMic === 1 || this.allowMic === '1') {
        base.push({ label: '仅录老师头像（头像）', value: 4 })
      }
      return base
    },
    isAdd() {
      return this.userInfo?.isAdd === '1'
    },
    yearRange() {
      const cur = new Date().getFullYear()
      const arr = []
      for (let y = cur - 3; y <= cur + 5; y++) arr.push(y)
      return arr
    },
    scheduleDataByDate() {
      const map = {}
      ;(this.scheduleApiData || []).forEach(item => {
        const dateStr = item.date
        if (!dateStr) return
        map[dateStr] = (item.lives || []).map(live => ({
          id: live.id,
          name: live.name || '',
          startTime: live.startTime ? live.startTime.substring(11, 16) : '',
          endTime: live.endTime ? live.endTime.substring(11, 16) : '',
          fullStartTime: live.startTime || '',
          liveLessonId: live.liveLessonId || '',
          fileList: live.fileList || [],
          status: live.status,
          isStart: live.isStart,
          isFinish: live.isFinish
        }))
      })
      return map
    },
    calendarCells() {
      const pad = n => String(n).padStart(2, '0')
      const year = this.scheduleYear
      const month = this.scheduleMonth
      const firstDayOfWeek = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const daysInPrevMonth = new Date(year, month, 0).getDate()
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      const cells = []

      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i
        const pm = month === 0 ? 12 : month
        const py = month === 0 ? year - 1 : year
        cells.push({ day: d, dateStr: `${py}-${pad(pm)}-${pad(d)}`, currentMonth: false, isToday: false, hasClass: false })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
        cells.push({ day: d, dateStr, currentMonth: true, isToday: dateStr === todayStr, hasClass: !!(this.scheduleDataByDate[dateStr]?.length) })
      }
      const remaining = 42 - cells.length
      for (let d = 1; d <= remaining; d++) {
        const nm = month === 11 ? 1 : month + 2
        const ny = month === 11 ? year + 1 : year
        cells.push({ day: d, dateStr: `${ny}-${pad(nm)}-${pad(d)}`, currentMonth: false, isToday: false, hasClass: false })
      }
      return cells
    },
    scheduleCoursesForDate() {
      if (!this.scheduleSelectedDate) return []
      return this.scheduleDataByDate[this.scheduleSelectedDate] || []
    },
    scheduleSelectedDateLabel() {
      if (!this.scheduleSelectedDate) return ''
      const parts = this.scheduleSelectedDate.split('-')
      return `${parseInt(parts[1])}月${parseInt(parts[2])}日`
    },

    qrCodeUrl() {
      return this.selectedCourseItem?.qrcodeUrl || ''
    },

    startTimePickerOptions() {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      return {
        disabledDate(date) {
          return date < todayStart
        }
      }
    }
  },
  methods: {
    handleStartTimeChange(val) {
      if (!val) return
      const selected = new Date(val.replace(' ', 'T'))
      const now = new Date()
      if (selected < now) {
        const pad = n => String(n).padStart(2, '0')
        this.classStartTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      }
    },

    openVideoPlayer(item) {
      console.log(item,'输出')
      const fileList = item.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')

      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      console.log(this.playerSource)
      console.log(this.playerTeacherSource)
      this.playerTitle = item.name || '视频回放'
      this.playerAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
      this.playerVisible = true
    },

    // ── 分享链接开关 ────────────────────────────────────────────────────
    async handleShareToggle(val) {
      if (!this.selectedCourseItem) return
      if (!val) {
        // 关闭时弹确认框
        try {
          await this.$confirm('关闭后，已分享的外部学生都无法继续观看直播。', '关闭分享链接', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          })
        } catch {
          return
        }
        try {
          await updateLive(this.selectedCourseItem.id, { ifShare: '2' })
          this.detailShareEnabled = false
        } catch (e) {
          // 错误由请求拦截器统一处理
        }
      } else {
        // 开启时直接调用接口
        try {
          await updateLive(this.selectedCourseItem.id, { ifShare: '1' })
          this.detailShareEnabled = true
          // 若还没有二维码则拉取
          if (!this.selectedCourseItem.qrcodeUrl) {
            const res = await getLiveShare(this.selectedCourseItem.id)
            const d = res.data || {}
            this.$set(this.selectedCourseItem, 'qrcodeUrl', d.qrcodeUrl || '')
            this.$set(this.selectedCourseItem, 'shareUrl', d.qrcodeUrl || '')
          }
        } catch (e) {
          // 错误由请求拦截器统一处理
        }
      }
    },

    // ── 课程详情弹窗 ────────────────────────────────────────────────────
    async openDetail(item) {
      this.selectedCourseItem = { ...item }
      this.detailShareEnabled = false
      this.showDetailDialog = true
      this.detailLoading = true
      try {
        const res = await getLiveDetail(item.id)
        const d = res.data || {}
        this.selectedCourseItem = {
          ...this.selectedCourseItem,
          id: d.id || item.id,
          title: d.name || item.title || '',
          description: d.introduce || '',
          teacherName: d.teacherName || '',
          teacherName2: d.teacherName2 || '',
          time: this.formatTimeRange(d.startTime, d.endTime),
          minutes: d.liveMin || item.minutes || '',
          status:  d.status == '直播中'  ? 'living' : 'soon',
          qrcodeUrl: d.qrcodeUrl || '',
          shareUrl: d.qrcodeUrl || '',
          ifShare: d.ifShare || '2',
          classInfos:d.classInfos || [],
          classInfosName:d.classInfos && d.classInfos.length ? d.classInfos.map(item => item.className).join('、') : '-' 
        }
        console.log(this.selectedCourseItem ,'详情')
        this.detailShareEnabled = d.ifShare === '1'
      } catch (e) {
        // 错误由请求拦截器统一处理
      } finally {
        this.detailLoading = false
      }
    },
    async enterLiveRoom(item) {
      console.log(item)
      const now = Date.now()
      const startTime = item.startTime ? new Date(item.startTime.replace(/-/g, '/')).getTime() : null

      if (this.isTeacher) {
        // 老师：距开始时间30分钟以内（含）或已开始，均可进入
        if (!startTime || now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      } else {
        // 学生：当前时间 >= 直播开始时间 才可进入
        if (!startTime || now < startTime) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      }
      // macOS：进入直播间前先确保摄像头、麦克风已获得系统授权
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

      const {userId,realName,userName,role}=getUserInfo();
      const token = getToken();
      const liveId = item.id;
      const roleNumber = role === "STUDENT" ? 0 : 1;

      if (role === "STUDENT") {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          if (res && res.data === true) {
            this.$message.warning('超过直播观看次数上限，请先转为正式学员')
            return
          }
        } catch (_) {}
      }

      let liveBaseUrl = "https://live.fjlsjy123.com"; //直播正式环境
      if(process.env.NODE_ENV === 'development'){
        liveBaseUrl = "http://localhost:8000";  //本地开发环境
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId}&_t=${Date.now()}&token=${token}`;
      console.log(this.liveUrl,'直播地址')
    this.activeTab = 'liveui'
    },
    copyShareLink() {
      const url = this.selectedCourseItem && this.selectedCourseItem.shareUrl
      if (!url) return
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.$message.success('链接已复制')
        }).catch(() => {
          this._fallbackCopy(url)
        })
      } else {
        this._fallbackCopy(url)
      }
    },
    _fallbackCopy(text) {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      this.$message.success('链接已复制')
    },
   async enterLiveFromDetail() {
      const item = this.selectedCourseItem
      if (!item) return

      const now = Date.now()
      const startTime = item.startTime ? new Date(item.startTime.replace(/-/g, '/')).getTime() : null

      if (this.isTeacher) {
        if (!startTime || now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      } else {
        if (!startTime || now < startTime) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      }
      // macOS：进入直播间前先确保摄像头和麦克风已获得系统授权
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

      const token = getToken();
      const courseid = this.selectedCourseItem.id;
      const {userId,realName,userName,role}=getUserInfo();
      const roleNumber = role === "STUDENT" ? 0 : 1;
      if (role === "STUDENT") {
        try {
          const res = await checkTempStudentLiveRecord(courseid)
          if (res && res.data === true) {
            this.$message.warning('超过直播观看次数上限，请先转为正式学员')
            return
          }
        } catch (_) {}
      }

      let liveBaseUrl = "https://live.fjlsjy123.com"; //直播正式环境
      if(process.env.NODE_ENV === 'development'){
        liveBaseUrl = "http://localhost:8000";  //本地开发环境
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&userid=${userId}&username=${userName}&liveid=${courseid}&token=${token}&classroomId=${this.selectedCourseItem.liveLessonId || ''}&_t=${Date.now()}`;
      console.log(this.liveUrl,'直播地址')
     this.activeTab = 'liveui'
    },

    async publishAfterClassTest(item) {
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

      const token = getToken()
      const { userId, realName } = getUserInfo()
      const liveId = item.liveId

      let liveBaseUrl = 'https://live.fjlsjy123.com'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://localhost:8000'
      }

      this.liveUrl = `${liveBaseUrl}?role=1&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId|| ''}&afterClassTest=1&_t=${Date.now()}&token=${token}#/classroom?id=${item.liveLessonId|| ''}`
      console.log(this.liveUrl, '发布课后测直播地址')
      this.activeTab = 'liveui'
    },

    // ── 定时刷新 ────────────────────────────────────────────────────────
    startLiveRefreshTimer() {
      this.stopLiveRefreshTimer()
      this._liveRefreshTimer = setInterval(() => {
        if (this.activeTab === 'live' && !document.hidden) {
          this.fetchLiveList()
        }
      }, 2 * 60 * 1000)
    },
    stopLiveRefreshTimer() {
      if (this._liveRefreshTimer) {
        clearInterval(this._liveRefreshTimer)
        this._liveRefreshTimer = null
      }
    },

    // ── 实时课堂接口 ────────────────────────────────────────────────────
    async fetchLiveList() {
      this.liveLoading = true
      try {
        const res = await getLiveList()
        const list = res.data || res || []
        this.liveCourses = list.map(item => {
          const isLiving = item.status == '直播中' ? true : false
          const now = Date.now()
          const startMs = item.startTime ? new Date(item.startTime.replace(' ', 'T')).getTime() : null
          const isWithin30Min = startMs !== null && !isLiving && (startMs - now) <= 30 * 60 * 1000 && (startMs - now) >= 0
          let statusImg = null
          if (isLiving) {
            statusImg = require('@/assets/images/liveClass/zzzb.png')
          } else if (isWithin30Min) {
            statusImg = require('@/assets/images/liveClass/jjks.png')
          }
          return {
            ...item,
            title: item.name,
            time: this.formatTimeRange(item.startTime, item.endTime),
            status: isLiving ? 'living' : 'soon',
            minutes: item.liveMin,
            statusImg,
          }
        })
      } catch (_) {} finally {
        this.liveLoading = false
      }
    },

    // ── 删除课堂 ────────────────────────────────────────────────────────
    handleDeleteLive(item) {
      if(item.status=='living'){
        return;
      }
      this.$confirm('确认删除该课堂吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteLiveClass(item.id)
          this.$message.success('删除成功')
          this.fetchLiveList()
        } catch (_) {}
      }).catch(() => {})
    },

    // ── 历史课堂接口 ────────────────────────────────────────────────────
    async fetchHistoryList() {
      const params = {}
      if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0]) {
        params.startDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      }
      if (this.selectedClass) params.classId = this.selectedClass
      if (this.searchKeyword) params.keyword = this.searchKeyword
      this.historyLoading = true
      try {
        const res = await getHistoryList(params)
        this.historyCourses = res.data || res || []
      } catch (_) {} finally {
        this.historyLoading = false
      }
    },

    // ── 班级列表接口 ────────────────────────────────────────────────────
    async handleCreateClass() {
      if (this.createLoading) return
      if (!this.name || !this.name.trim()) {
        this.$message.warning('请输入课堂名称')
        return
      }
      if (!this.classStartTime) {
        this.$message.warning('请选择上课时间')
        return
      }
      const selectedTime = new Date(this.classStartTime.replace(' ', 'T'))
      console.log(selectedTime)
      console.log(new Date())
      const now = new Date()
      now.setSeconds(0, 0)
      selectedTime.setSeconds(0, 0)
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      if (selectedTime < fiveMinutesAgo) {
        this.$message.warning('上课时间不得早于当前时间，请重新选择')
        return
      }
      // 选择时间在5分钟误差内（已过期但未超5分钟），使用当前时间
      const isExpiredWithinTolerance = selectedTime < now
      this.createLoading = true
      try {
        // startTime 补充秒位，满足 yyyy-MM-dd HH:mm:ss 格式
        let startTime
        if (isExpiredWithinTolerance) {
          const pad = n => String(n).padStart(2, '0')
          const n = new Date()
          startTime = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())} ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`
        } else {
          startTime = this.classStartTime.length === 16
            ? this.classStartTime + ':00'
            : this.classStartTime
        }
        let isAllowMic = this.allowMic == '1' ? '1' : '2'
        let playbackSettings = this.isPlayBack
        let recordingType = String(this.recordMode)
        const params = {
          name: this.name.trim(),
          startTime,
          liveTime: String(this.classDuration),
          introduce: this.instr || undefined,
          recordingType: recordingType,
          classIds: this.createClassId.length ? this.createClassId : undefined,
          isAllowMic,
          isPlayBack: this.isPlayBack,
          playbackSettings: playbackSettings
        }
        const result = await createLiveClass(params)
        const liveData = result.data || result
        const liveId = liveData.liveId
        const liveLessonId = liveData.liveLessonId
        const { userId, userName } = getUserInfo()
        await createAliyunClass({
          liveId,
          mode: this.allowMic,
          teacher_id: userId,
          teacher_nick: userName,
          title: this.name.trim(),
          extends: JSON.stringify({isAllowMic,playbackSettings,recordingType}),
          im_server: ['aliyun_new'],
          id: liveLessonId
        })
        this.$message.success('课堂创建成功')
        this.showCreateClass = false
        this.fetchLiveList()
      } catch (e) {
        // 错误由请求拦截器统一处理
      } finally {
        this.createLoading = false
      }
    },

    openSchedule() {
      const now = new Date()
      this.scheduleYear = now.getFullYear()
      this.scheduleMonth = now.getMonth()
      const pad = n => String(n).padStart(2, '0')
      this.scheduleSelectedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
      this.showSchedule = true
      this.fetchScheduleData(now.getFullYear(), now.getMonth() + 1)
    },
    async fetchScheduleData(year, month) {
      this.scheduleLoading = true
      try {
        const res = await getScheduleList({ year: String(year), month: String(month) })
        this.scheduleApiData = res.data || res || []
      } catch (_) {
        this.scheduleApiData = []
      } finally {
        this.scheduleLoading = false
      }
    },
    selectScheduleDate(dateStr) {
      this.scheduleSelectedDate = dateStr
    },

    async enterLiveRoomFromSchedule(course) {
      const item = {
        ...course,
        startTime: course.fullStartTime,
      }
      await this.enterLiveRoom(item)
    },

    openVideoFromSchedule(course) {
      if (!course.fileList || course.fileList.length === 0 ||course.status=='已结束未开播' ) {
        this.$message.warning('暂无回放视频')
        return
      }
      this.openVideoPlayer(course)
    },
    prevScheduleMonth() {
      if (this.scheduleMonth === 0) {
        this.scheduleMonth = 11
        this.scheduleYear -= 1
      } else {
        this.scheduleMonth -= 1
      }
    },
    nextScheduleMonth() {
      if (this.scheduleMonth === 11) {
        this.scheduleMonth = 0
        this.scheduleYear += 1
      } else {
        this.scheduleMonth += 1
      }
    },

    async fetchClassList() {
      if (this.classList.length) return
      try {
        const res = await getClassList()
        const list = res.data || res || []
        console.log(res,'测试')
        this.classList = list.map(item => ({
          value: item.classId,
          label:item.classAlias?item.classAlias: item.className,
        }))
      } catch (_) {}
    },

    // ── 工具方法 ─────────────────────────────────────────────────────────
    formatTimeRange(startTime, endTime) {
      if (!startTime) return ''
      const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const todayStr = new Date().toISOString().substring(0, 10)

      const formatDateLabel = (dateStr, hideYear = false) => {
        if (dateStr === todayStr) return '今天'
        const d = new Date(dateStr)
        const label = hideYear ? dateStr.substring(5) : dateStr
        return `${label}(${WEEK[d.getDay()]})`
      }

      const startDateStr = startTime.substring(0, 10)
      const startHM = startTime.substring(11, 16)

      if (!endTime) return `${formatDateLabel(startDateStr)} ${startHM}`

      const endDateStr = endTime.substring(0, 10)
      const endHM = endTime.substring(11, 16)

      if (startDateStr === endDateStr) {
        return `${formatDateLabel(startDateStr)} ${startHM} - ${endHM}`
      }
      return `${formatDateLabel(startDateStr)} ${startHM} - ${formatDateLabel(endDateStr, true)} ${endHM}`
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      return dateStr.substring(5, 10)
    },

    formatDuration(seconds) {
      const s = parseInt(seconds, 10)
      if (!s || s < 0) return '00:00:00'
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':')
    },

    // ── 检查版本更新 ────────────────────────────────────────────────────
    async checkUpdate() {
      // App.vue 启动时已经检查过了，有结果直接复用
      if (this.hasUpdate) return
      if (!window.electronAPI?.checkForUpdate) return
      try {
        const result = await window.electronAPI.checkForUpdate()
        if (result && result.hasUpdate) {
          this.$store.commit('app/SET_UPDATE_INFO', {
            hasUpdate: true,
            isForceUpdate: result.isForceUpdate ?? 0,
            updateInfo: {
              version: result.version || '新版本',
              downloadUrl: result.downloadUrl || '',
              description: result.description || ''
            }
          })
        }
      } catch (_) {}
    },

    openUpdateDialog() {
      this.dialogVisible = true
    },

    closeDialog() {
      if (this.downloading) return
      this.dialogVisible = false
      this.bannerDismissed = false
      this.downloadError = ''
    },

    onOverlayClick() {
      if (!this.downloading && !this.downloaded) {
        this.closeDialog()
      }
    },

    startDownload() {
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

    registerIpcListeners() {
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

    removeIpcListeners() {
      if (this._removeProgress) { this._removeProgress(); this._removeProgress = null }
      if (this._removeComplete) { this._removeComplete(); this._removeComplete = null }
      if (this._removeError) { this._removeError(); this._removeError = null }
      if (this._removeScreenPermissionDenied) { this._removeScreenPermissionDenied(); this._removeScreenPermissionDenied = null }
      if (this._removeScreenCaptureFailed) { this._removeScreenCaptureFailed(); this._removeScreenCaptureFailed = null }
    },

    async openScreenPreferences() {
      if (window.electronAPI?.openScreenPreferences) {
        await window.electronAPI.openScreenPreferences()
      }
    },

    installUpdate() {
      if (window.electronAPI?.installUpdate && this.downloadedFilePath) {
        window.electronAPI.installUpdate(this.downloadedFilePath)
      }
    },
    onDialogCloseAdd(){
      this.showDetailDialog = false
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
.full-screen{
  position: fixed;
  width: 100vw;
  height: 100%;
  top: 0;
  left: 0;
  padding: 0;
  z-index: 99999;
  overflow: hidden;
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
  min-height: 120px;
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
  position: relative;
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
.placeholder_last_table_detail_last_del{
  position: absolute;
  top: 0;
  right: 0;
  width: 43px;
  height: 43px;
  cursor: pointer;
  img{
    position: absolute;
    top: 50%;
    left: 50%;
    width: 15px;
    height: 16px;
    transform: translate(-50%,-50%);
  }
  &.allow:hover{
    img{
      filter: grayscale(100%) sepia(100%) hue-rotate(-40deg) saturate(800%) brightness(0.8);
    }
  }
  &.notallow{
    cursor: not-allowed;
    &:hover{
      img{
        filter: initail;
      }
    }
  }
}
.placeholder_last_table_detail_last_disable {
  font-weight: bold;
  font-size: 14px;
  color: #999999 !important;
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
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.placeholder_last_table_detail_top_last_time {
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}
.placeholder_last_table_detail_top_last_leve {
  color: #333333;
  font-size: 14px;
  width: 100%;
  text-align: left;
  margin-top: 4px;
}
.placeholder_last_table_detail_top_last_leve_yj {
  color: #0049ff;
  font-weight: bold;
  font-size: 16px;
}
.placeholder_last_table_detail_top_last_leve_jl {
  color: #ff2e00;
  font-weight: bold;
  font-size: 16px;
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
  // width: 180px;
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
.ls_search_input {
  width: 268px;
  ::v-deep .el-input__inner {
    border-radius: 28px;
    border-color: #d9d9d9;
    font-size: 14px;
    color: #333333;
    padding-left: 30px;
    &:focus {
      border-color: #0049ff;
    }
  }
  ::v-deep .el-input__prefix {
    left: 10px;
    display: flex;
    align-items: center;
  }
  ::v-deep .el-input__suffix {
    right: 8px;
    display: flex;
    align-items: center;
  }
}
.ls_search_prefix_icon {
  width: 14px;
  height: 14px;
}
.ls_last {
  width: 100%;
  margin-top: 19px;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  min-height: 120px;
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
  width: 150px;
  // flex: 1;
  // width: 0;
  ::v-deep .el-input__inner {
   
    font-size: 14px;
    color: #333333;
    background: transparent;
  }
  ::v-deep .el-input__suffix {
    // right: 0;
  }
  ::v-deep .el-input {
    font-size: 14px;
  }
  ::v-deep .el-select__input{
    margin-left: 0!important;
  }
}

.masl_con_dialog_last_shadow_third {
    ::v-deep .el-select__input{
    margin-left: 0!important;
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



.class-time-picker {
  width: 175px !important;
}
.class-time-picker .el-input__inner {
  border: none;
  background: transparent;
  padding: 0;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.class-time-picker .el-input__prefix {
  display: none;
}
.class-duration-select {
  width: 110px !important;
}
.class-duration-select .el-input__inner {
  border: none;
  background: transparent;
  padding: 0 20px 0 0;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.mask-fade-enter-active {
  animation: maskFadeIn 0.35s ease;
}
.mask-fade-leave-active {
  animation: maskFadeOut 0.35s ease;
}
@keyframes maskFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes maskFadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.mask-fade-enter-active .create-class-dialog {
  animation: slideInFromRight 0.35s ease;
}
.mask-fade-leave-active .create-class-dialog {
  animation: slideOutToRight 0.35s ease;
}
@keyframes slideInFromRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes slideOutToRight {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

.mask{
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(51, 51, 51, 0.60);
  z-index: 2001;
  overflow: hidden;
}
.mask_con{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.masl_con_dialog{
    width: 662px;
    height: 100%;
    position: relative;
    background: #F3F4F8;
    background-size: 100% 100%;
    border-radius: 8px 0px 0px 8px;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    
}
.masl_con_dialog_top{
  padding: 18px 18px 32px 18px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  font-weight: bold;
font-size: 18px;
color: #333333;
}
.masl_con_dialog_top_back{
  width: 7px;
  height: 14px;
  cursor: pointer;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 18px;
}
.masl_con_dialog_last{
  flex: 1;
  width: 100%;
  height: 0;
  padding: 0 18px 18px 18px;
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 20px;
}
.masl_con_dialog_last_shadow{
  width: 100%;
  padding: 17px 22px;
  box-sizing: border-box;
  background: #FFFFFF;
  border-radius: 8px 8px 8px 8px;
 ::v-deep .el-input__inner {
    padding:0 15px 0 0 !important;
    font-size: 14px;
    color: #333333;
    background: transparent;
  }
  ::v-deep .el-input__icon{
    display: none!important;
  }
}
.masl_con_dialog_last_shadow_detail{
  width: 100%;
  
}
.masl_con_dialog_last_shadow_hx{
  height: 1px;
  width: 100%;
background: #F3F4F8;
margin: 13px 0;
}
.masl_con_dialog_last_shadow_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.masl_con_dialog_last_shadow_top_detail{
  width: 50%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.masl_con_dialog_last_shadow_top_detail_icon{
  width: 16px;
  height: 16px;
}
.masl_con_dialog_last_shadow_top_detail_text{
font-weight: 400;
font-size: 14px;
color: #333333;

}
.masl_con_dialog_last_shadow_second{
  width: 100%;
}
.masl_con_dialog_last_shadow_second_label{
  font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_last_shadow_second_choose{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 87px;
  align-items: center;
  margin-top: 15px;
}
.masl_con_dialog_last_shadow_second_choose_detail{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.masl_con_dialog_last_shadow_second_choose_detail_no{
  width: 16px;
  height: 16px;
}
.masl_con_dialog_last_shadow_second_choose_detail_text{
font-weight: 400;
font-size: 14px;
color: #333333;
}
.masl_con_dialog_last_shadow_third{
  width: 100% !important;
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.masl_con_dialog_last_shadow_third .el-input__inner {
  border: none;
  background: transparent;
  padding-left: 0;
  font-size: 14px;
  color: #333333;
  height: 32px;
  line-height: 32px;
}
.masl_con_dialog_last_shadow_four{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}
.masl_con_dialog_last_shadow_four_icon{
  width: 16px;
  height: 16px;
}
.masl_con_dialog_last_shadow_four_text{
  font-weight: 400;
  font-size: 14px;
  color: #333333;
}
.masl_con_dialog_last_shadow_five{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 32px;
}
.masl_con_dialog_last_btn{
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 21px;
}
.masl_con_dialog_last_btn_cancel{
  width: 67px;
height: 32px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #999999;
cursor: pointer;
display: flex;
justify-content: center;
align-items: center;
color: #333333;
font-size: 14px;
font-weight: bold;
}
.masl_con_dialog_last_btn_confirm{
  cursor: pointer;
  width: 67px;
height: 32px;
background: #0049FF;
border-radius: 4px 4px 4px 4px;
display: flex;
justify-content: center;
align-items: center;
font-weight: bold;
font-size: 14px;
color: #FFFFFF
}

/* ── 课表面板 ───────────────────────────────────────────────── */
.schedule-panel {
  width: 632px;
  height: 100%;
  background: #F3F4F8;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
}
.schedule-body {
  height: 0;
  flex: 1;
  padding: 0 16px 20px 16px;
border-radius: 8px 8px 8px 8px;
}
.schedule-body_box{
    overflow-y: auto;
  height: 100%;
  background: #FFFFFF;
border-radius: 8px 8px 8px 8px;
padding: 43px 30px 30px;
box-sizing: border-box;
}
/* 日历整体卡片 */
.schedule-calendar {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-sizing: border-box;
  border-radius: 16px 16px 16px 16px;
border: 1px solid #F3F4F8;
}

/* 日历头部 */
.schedule-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.schedule-cal-selects {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}
.schedule-cal-select-month {
  width: 90px !important;
}
.schedule-cal-select-year {
  width: 82px !important;
}
.schedule-cal-nav-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}
.schedule-cal-nav-box:hover {
  background: #f0f0f0;
}
.schedule-cal-nav {
  font-size: 14px;
  color: #666;
}

/* 星期行 */
.schedule-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.schedule-cal-weekday {
  text-align: center;
  font-size: 12px;
  color: #b0b5c0;
  padding: 4px 0 6px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 日期格子 */
.schedule-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px 0;
}
.schedule-cal-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  user-select: none;
}
.schedule-cal-cell::before {
  content: '';
  position: absolute;
  top: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.18s;
  z-index: 0;
}
.schedule-cal-day-num {
  position: relative;
  z-index: 1;
  line-height: 1;
  margin-top: -4px;
}
.schedule-cal-cell:hover:not(.is-other-month)::before {
  background: #F0F4FF;
}
.schedule-cal-cell.is-other-month {
  color: #d0d0d0;
  cursor: default;
}
.schedule-cal-cell.is-today::before {
  background: #0049FF;
}
.schedule-cal-cell.is-today {
  color: #fff;
  font-weight: 600;
}
.schedule-cal-cell.is-today:hover::before {
  background: #1a5cff;
}
.schedule-cal-cell.is-selected:not(.is-today)::before {
  background: #E8EEFF;
}
.schedule-cal-cell.is-selected:not(.is-today) {
  color: #0049FF;
  font-weight: 600;
}
.schedule-cal-cell.has-class.is-selected:not(.is-today)::before {
  background: #E8EEFF;
}
.schedule-cal-cell.has-class.is-today::after {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.75);
  z-index: 1;
}
.schedule-cal-cell.has-class:not(.is-today)::after {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 2px;
  border-radius: 2px;
  background: #4E80EE;
  z-index: 1;
}
.schedule-cal-cell.has-class.is-selected:not(.is-today)::after {
  background: #0049FF;
}

/* 课程列表 */
.schedule-list {
  margin-top: 60px;
}
.schedule-list-title {
 font-size: 16px;
 color: #333333;
  margin-bottom: 16px;
}
.schedule-timeline {
  display: flex;
  flex-direction: column;
}
.schedule-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 0;
}
.schedule-timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
  // padding-top: 10px;
}
.schedule-timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #71A0FF;
  flex-shrink: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.schedule-timeline-dot_white{
  width: 10px;
  height: 10px;
  background: #ffffff;
  border-radius: 50%;
}
.schedule-timeline-line {
  width: 1px;
  flex: 1;
  min-height: 24px;
  border-left: 1px dashed #71A0FF;
  margin: 2px 0;
}
.schedule-timeline-content {
  flex: 1;
  background: #F3F4F8;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
}
.schedule-timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.schedule-timeline-time {
  font-size: 14px;
  color: #666666;
}
.schedule-timeline-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  flex-shrink: 0;
  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  &.status-living {
    color: #0049FF;
    .status-dot { background: #0049FF; box-shadow: 0 0 0 2px rgba(0, 73, 255, 0.2); }
  }
  &.status-finished {
    color: #BBBBBB;
    .status-dot { background: #BBBBBB; }
  }
  &.status-soon {
    color: #FF8C00;
    .status-dot { background: #FF8C00; }
  }
  &.status-not-broadcast {
    color: #9B59B6;
    .status-dot { background: #9B59B6; }
  }
  &.status-unknown {
    color: #BBBBBB;
    .status-dot { background: #BBBBBB; }
  }
}
.schedule-timeline-name {
  font-size: 14px;
  color: #333;
  font-weight: 400;
}
.schedule-timeline-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}
.schedule-action-btn {
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  outline: none;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
  &:active { opacity: 0.7; }
}
.schedule-action-enter {
  background: #0049FF;
  color: #fff;
}
.schedule-action-replay {
  background: #fff;
  color: #0049FF;
  border: 1px solid #0049FF;
}
.schedule-empty {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.schedule-empty-text {
  font-size: 14px;
  color: #999;
}

/* ── 课程详情弹窗内容 ──────────────────────────────────────────────────── */
.cdc-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.cdc-info-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}
.cdc-label {
  font-size: 14px;
  color: #6A7282;
  white-space: nowrap;
  line-height: 20px;
}
.cdc-value {
  font-size: 14px;
  color: #364153;
  flex: 1;
  width: 0;
  line-height:20px
}
.cdc-divider {
  height: 1px;
  background: #F3F4F8;
  margin: 4px 0 16px;
}
.cdc-share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cdc-share-label {
  font-size: 14px;
  font-weight: bold;
  color: #364153;
}
.cdc-share-url-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  gap: 8px;
  justify-content: space-between;
  margin-bottom: 8px;
}
.cdc-share-url {
  flex: 1;
  width: 0;
  height: 38px;
  font-size: 13px;
  color: #333333;
  padding: 0 12px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #F9FAFB;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  line-height: 38px;
}
.cdc-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0049FF;
  color: #ffffff;
  font-size: 13px;
  padding: 0 14px;
  height: 40px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 0 8px 8px 0;
  gap: 4px;
  flex-shrink: 0;
}
.cdc-copy-icon {
  width: 80px;
  height: 36px;
  cursor: pointer;
}
.cdc-share-hint {
  font-size: 12px;
  color: #99A1AF;
  margin-bottom: 8px;
}
.cdc-qr-wrap {
  display: flex;
  align-items: center;
  margin: 0 auto ;
  justify-content: center;
  margin-bottom: 12px;
  width: 144px;
height: 144px;
background: linear-gradient( 45deg, #F3F4F6 0%, #E5E7EB 100%);
border-radius: 14px 14px 14px 14px;
border: 1px solid #E5E7EB;
}
.cdc-qr-img {
  width: 128px;
  height: 128px;
  border-radius: 10px 10px 10px 10px;
  background: #1E2939;
  display: block;
  padding: 8px;
  box-sizing: border-box;
}
.cdc-qr-placeholder {
  width: 128px;
  height: 128px;
  border-radius: 10px;
  background: #1E2939;
}
.cdc-qr-hint {
  font-size: 12px;
  color: #99A1AF;
  text-align: center;
  margin-bottom: 8px;
}
.cdc-bottom {
  margin-top: auto;
  padding-top: 12px;
}
.cdc-time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cdc-time-text {
  font-size: 14px;
  color: #6A7282;
}
.cdc-live-min {
  font-size: 14px;
  color: #364153;
}
.cdc-min-num {
  color: #0049FF;
  font-weight: bold;
}
.cdc-enter-btn {
  width: 100%;
 height: 44px;
background: #0049FF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 14px 14px 14px 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  cursor: pointer;

}
.cdc-enter-btn-disabled {
  background: #B0C4FF;
  cursor: not-allowed;
}
.cdc-liveTitle{
  font-weight: bold;
font-size: 16px;
color: #101828;
margin-bottom: 12px;
}

/* ─── macOS 屏幕录制权限引导弹窗 ──────────────────────────────────────── */
.screen-permission-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.screen-permission-dialog {
  background: #ffffff;
  border-radius: 16px;
  padding: 36px 40px 32px;
  width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.screen-permission-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.screen-permission-title {
  font-size: 20px;
  font-weight: 700;
  color: #101828;
  margin-bottom: 12px;
}
.screen-permission-desc {
  font-size: 14px;
  color: #4B5563;
  line-height: 1.7;
  margin-bottom: 20px;
}
.screen-permission-steps {
  width: 100%;
  background: #F9FAFB;
  border-radius: 10px;
  padding: 14px 18px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.screen-permission-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #374151;
}
.step-num {
  width: 22px;
  height: 22px;
  background: #0049FF;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.screen-permission-btns {
  display: flex;
  gap: 12px;
  width: 100%;
}
.screen-permission-btn-primary {
  flex: 1;
  height: 44px;
  background: #0049FF;
  color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #003de0; }
}
.screen-permission-btn-secondary {
  flex: 1;
  height: 44px;
  background: #F3F4F6;
  color: #6B7280;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #E5E7EB; }
}
</style>

<style lang="scss">
.ls_options_popover {
  padding: 4px 0 !important;
  min-width: 120px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}
.ls_options_menu {
  display: flex;
  flex-direction: column;
}
.ls_options_menu_item {
  padding: 10px 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  &:hover {
    background: #f0f4ff;
    color: #0049ff;
  }
}
</style>
