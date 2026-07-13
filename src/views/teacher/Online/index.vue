<template>
  <div class="online-page">
    <!-- 顶部：Tab + 操作按钮 -->
    <div class="online-header">
      <div class="online-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="online-tab"
          :class="{ active: activeTab === tab.key }"
          @click="switchOnlineTab(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
      <div class="online-actions">
        <div class="btn-create"  v-if="isTeacher && isAdd" @click="showCreateClass = true">
          <img src="@/assets/images/online/add_btn.png" class="btn-create__icon" alt="" />
          <span>新建课堂</span>
        </div>
        <div class="btn-schedule" @click="openSchedule">
          <img src="@/assets/images/online/kb_btn.png" class="btn-schedule__icon" alt="" />
          <span>查看课表</span>
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
      <LiveClassroomFrame :src="liveUrl" @exit="activeTab = 'live'" />
    </div>

    <!-- 待启课堂 -->
    <template v-if="activeTab === 'live'">
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
      <div class="online-count">共 {{ liveCourses.length }} 节课堂</div>
      <div class="pending-grid" v-loading="liveLoading">
        <template v-if="!liveLoading">
        <div
         v-for="(item, index) in liveCourses" :key="index" @click="enterLiveRoom(item)"
          class="pending-card"
        >
          <div class="pending-card__top">
            <div
              class="pending-card__badge"
              :class="item.status === 'living' ? 'is-living' : 'is-waiting'"
            >
              <template v-if="item.status === 'living'">
                课堂进行中<span class="pending-card__badge-sep">|</span>已直播 {{ item.minutes }}
              </template>
              <template v-else>
                课堂未开始<span class="pending-card__badge-sep">|</span>距离直播还有 {{ item.minutes }}
              </template>
            </div>
            <div class="pending-card__more_box" @click.stop>
                <el-popover
                placement="bottom-end"
                trigger="click"
                popper-class="ls_options_popover"
                :visible-arrow="false"
              >
                <div class="ls_options_menu">
                  <div v-if="isTeacher && item.status !== 'living' " class="ls_options_menu_item"  @click.stop="handleDeleteLive(item)">
                    <span>删除</span>
                  </div>
                  <div class="ls_options_menu_item"  @click.stop="openDetail(item)">
                    <span>详情</span>
                  </div>
                </div>
                <div slot="reference" class="pending-card__more">
                   <img src="@/assets/images/online/options.png" alt="" />
                </div>
              </el-popover>
             
            </div>
          </div>
          <div class="pending-card__title">{{ item.title }}</div>
          <div class="pending-card__time">{{ item.time }}</div>
          <div
            class="pending-card__btn"
            :class="{ active: item.status === 'living' }"
          >
            进入直播
          </div>
        </div>
        
        </template>
      </div>
      <empty-state v-if="liveCourses.length === 0 && !liveLoading" description="暂无待启课堂" />
    </template>

    <!-- 回放课堂 -->
    <template v-if="activeTab === 'history'">
      <div class="filter-bar">
        <div class="filter-bar__left">
          <div class="filter-item">
            <!-- <span class="filter-item__label">时间</span> -->
            <div
              class="filter-item__control filter-item__control--picker"
              @mousedown="fixDatePickerPosition('historyDatePicker')"
            >
              <el-date-picker
                :key="'history-date-' + datePickerRenderKey"
                ref="historyDatePicker"
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                align="left"
                :append-to-body="true"
                :picker-options="historyDatePickerOptions"
                popper-class="ls-online-date-popper"
                class="ls_date_picker ls_date_picker--daterange"
                size="mini"
                @focus="fixDatePickerPosition('historyDatePicker')"
              />
              <img src="@/assets/images/class/rl_icon.png" class="filter-item__icon" alt="" />
            </div>
          </div>
          <div class="filter-item">
            <!-- <span class="filter-item__label">班级</span> -->
            <div class="filter-item__control filter-item__control--select">
              <div class="ls_class_select_wrap">
                <el-select
                  v-model="selectedClass"
                  placeholder="全部班级"
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
                <i class="el-icon-arrow-down ls_class_select_arrow" />
              </div>
            </div>
          </div>
          <div class="filter-search">
            <img src="@/assets/images/liveClass/search.png" class="filter-search__icon" alt="" />
            <input
              v-model="searchKeyword"
              type="text"
              class="filter-search__input"
              placeholder="搜索课程关键字"
            />
          </div>
        </div>
        <div class="filter-bar__count">共 {{ historyTotal }} 节课堂</div>
      </div>
      <div class="replay-grid" v-loading="historyLoading">
        <template v-if="!historyLoading">
        <div
         v-for="(item, index) in historyCourses" :key="item.id || index" @click="openVideoPlayer(item)"
          class="replay-card"
        >
          <div class="replay-card__cover" >
            <div class="replay-card__more_box" @click.stop v-if="isTeacher">
              <el-popover
                placement="bottom-end"
                trigger="click"
                popper-class="ls_options_popover"
                :visible-arrow="false"
              >
                <div class="ls_options_menu">
                  <div class="ls_options_menu_item" @click.stop="publishAfterClassTest(item)">
                    <span>发布课后测</span>
                  </div>
                </div>
                <div slot="reference" class="replay-card__more">
                  <img src="@/assets/images/online/options.png" alt="" />
                </div>
              </el-popover>
            </div>
            <img :src="item.cover" alt="">
          </div>
          <div class="replay-card__body">
             <el-tooltip :content="item.name" placement="top" :enterable="false">
                <div class="replay-card__title">{{ item.name }}</div>
              </el-tooltip>
            <div class="replay-card__meta">
              <div style="color:#62748E">{{formatDate(item.generationTime) }}</div>
              <div class="replay-card__meta-sep" ></div>
              <div>{{ formatDuration(item.fileList && item.fileList.length != 0 ? (item.fileList[0].duration) :0)}}</div>
            </div>
            <div class="replay-card__meta">
              <div style="color:#62748E">主讲</div>
             
              <div>{{item.teacherName2 }}</div>
            </div>
          </div>
        </div>
        
        </template>
        
      </div>
       <empty-state v-if="historyCourses.length === 0 && !historyLoading" description="暂无回放课堂" />
      <div class="ls_pagination" v-if="historyTotal > historyPageSize">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="historyTotal"
          :page-size="historyPageSize"
          :current-page="historyPageNum"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </template>

    <!-- 课后测试 -->
    <template v-if="activeTab === 'quiz' && !showQuizDetail">
      <div class="filter-bar">
        <div class="filter-bar__left">
          <div class="filter-item">
            <!-- <span class="filter-item__label">时间</span> -->
            <div
              class="filter-item__control filter-item__control--picker filter-item__control--datetime"
              @mousedown="fixDatePickerPosition('quizDatePicker')"
            >
              <el-date-picker
                :key="'quiz-date-' + datePickerRenderKey"
                ref="quizDatePicker"
                v-model="quizDateRange"
                type="datetimerange"
                range-separator="-"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="yyyy-MM-dd HH:mm:ss"
                align="left"
                :append-to-body="true"
                :picker-options="quizDatePickerOptions"
                popper-class="ls-online-date-popper"
                class="ls_date_picker ls_date_picker--datetimerange"
                size="mini"
                @focus="fixDatePickerPosition('quizDatePicker')"
                @change="handleQuizSearch"
              />
              <img src="@/assets/images/class/rl_icon.png" class="filter-item__icon" alt="" />
            </div>
          </div>
          <div class="filter-item">
            <!-- <span class="filter-item__label">班级</span> -->
            <div class="filter-item__control filter-item__control--select">
              <div class="ls_class_select_wrap">
                <el-select
                  v-model="quizClassId"
                  placeholder="请选择班级"
                  size="mini"
                  filterable
                  class="ls_class_select"
                  @change="handleQuizClassChange"
                >
                  <el-option
                    v-for="cls in classList"
                    :key="cls.value"
                    :label="cls.label"
                    :value="cls.value"
                  />
                </el-select>
                <i class="el-icon-arrow-down ls_class_select_arrow" />
              </div>
            </div>
          </div>
          <div class="filter-item">
            <!-- <span class="filter-item__label">科目</span> -->
            <div class="filter-item__control filter-item__control--select">
              <div class="ls_class_select_wrap">
                <el-select
                  v-model="quizSubjectId"
                  placeholder="全部科目"
                  size="mini"
                  filterable
                  clearable
                  class="ls_class_select"
                  @change="handleQuizSearch"
                >
                  <el-option
                    v-for="opt in quizSubjectOptions"
                    :key="opt.id"
                    :label="opt.name"
                    :value="opt.id"
                  />
                </el-select>
                <i class="el-icon-arrow-down ls_class_select_arrow" />
              </div>
            </div>
          </div>
          <div class="filter-search filter-search--wide" v-clickoutside="closeQuizSuggest">
            <img src="@/assets/images/liveClass/search.png" class="filter-search__icon" alt="" />
            <input
              v-model="quizKeyword"
              type="text"
              class="filter-search__input"
              placeholder="搜索课后测名称、主讲老师"
              @focus="onQuizKeywordFocus"
              @input="onQuizKeywordInput"
              @keydown.enter.prevent="confirmQuizKeyword"
              @keydown.esc="closeQuizSuggest"
            />
            <i
              v-if="quizKeyword || quizFilterExamConfigId || quizFilterTeacherId"
              class="el-icon-circle-close filter-search__clear"
              @click="clearQuizKeyword"
            />
            <div
              v-if="quizSuggestVisible && quizSuggestGroups.length"
              class="filter-search__dropdown"
            >
              <div
                v-for="group in quizSuggestGroups"
                :key="group.type"
                class="filter-search__group"
              >
                <div class="filter-search__group-title">{{ group.label }}</div>
                <div
                  v-for="opt in group.items"
                  :key="`${group.type}-${opt.value}`"
                  class="filter-search__option"
                  @mousedown.prevent="selectQuizSuggest(opt)"
                >
                  {{ opt.label }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="quiz-grid" v-loading="quizLoading">
        <template v-if="!quizLoading">
          <div
            v-for="item in filteredQuizList"
            :key="item.examConfigId || item.id"
            class="quiz-card"
            @click="openQuizDetail(item)"
          >
            <div class="quiz-card__title" :title="item.name">{{ item.name }}</div>
            <div class="quiz-card__info">
              <div class="quiz-card__pill">{{ item.teacherName2 || item.teacherName || '-' }}</div>
              <div class="quiz-card__pill">{{ item.subjectName || item.subject || '-' }}</div>
              <div class="quiz-card__pill">{{ item.finishedStudentCount || 0 }}/{{ item.totalStudentCount || 0 }} 已完成</div>
              <div class="quiz-card__pill">{{ item.topicNum || 0 }} 题</div>
            </div>
            <div class="quiz-card__time">
              <span class="quiz-card__time-label">发布时间</span>
              <span class="quiz-card__time-value">{{ item.createTime || '-' }}</span>
            </div>
            <div class="quiz-card__btn" @click.stop="openQuizDetail(item)">查看详情</div>
          </div>
        </template>
      </div>
      <empty-state v-if="!quizLoading && filteredQuizList.length === 0" description="暂无课后测数据" />
    </template>
    <!-- 课后测试 - 学生做题详情 -->
    <AfterClassTestDetail
      v-if="activeTab === 'quiz' && showQuizDetail"
      :visible="showQuizDetail"
      :className="quizClassName"
      :courseInfo="currentQuizCourse"
      @close="showQuizDetail = false"
    />


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
                    <div class="class-duration-select-wrap">
                      <el-select v-model="classDuration" class="class-duration-select" :clearable="false">
                        <el-option
                          v-for="item in durationOptions"
                          :key="item"
                          :label="item + '分钟'"
                          :value="item"
                        />
                      </el-select>
                      <i class="el-icon-arrow-down class-duration-arrow"></i>
                    </div>
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
                <div class="masl_third_select_wrap">
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
                  <i class="el-icon-arrow-down masl_third_select_arrow"></i>
                </div>
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
            <el-image
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              class="cdc-qr-img"
              :preview-src-list="[qrCodeUrl]"
              fit="contain"
              alt="二维码"
            />
            <div v-else class="cdc-qr-placeholder"></div>
          </div>
          <div class="cdc-qr-actions">
            <div class="cdc-qr-action-btn" @click="copyQrCode">复制二维码</div>
            <div class="cdc-qr-action-btn" @click="saveQrCode">保存二维码</div>
          </div>
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
      :history-lesson-id="playerHistoryLessonId"
      :allow-download="playerAllowDownload"
      @close="playerVisible = false"
    />

  </div>
</template>

<script>
import { getLiveList, getHistoryList, getClassList, createLiveClass, createAliyunClass, getScheduleList, deleteLiveClass, getLiveDetail, getLiveShare, updateLive, getAfterQuizTeacherList, getSubjectOptions, getAfterQuizOptions, getTeacherOptions } from '@/api/modules/teacher'
import Clickoutside from 'element-ui/lib/utils/clickoutside'
import { checkTempStudentLiveRecord } from '@/api/modules/student'
import EmptyState from '@/components/EmptyState/index.vue'
import DialogCustome from '@/components/DialogCustome/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import AfterClassTestDetail from '@/views/teacher/Class/AfterClassTestDetail.vue'
import { getToken, getUserInfo } from '@/utils/auth'
import { mapGetters } from 'vuex'
export default {
  name: 'Online',
  components: { EmptyState, DialogCustome, VideoPlayer, AfterClassTestDetail },
  directives: { Clickoutside },
  data() {
    return {
      activeTab: 'live',
      tabs: [
        { key: 'live', label: '待启课堂' },
        { key: 'history', label: '回放课堂' },
        { key: 'quiz', label: '课后测试' }
      ],
      replayKeyword: '',
      quizKeyword: '',
      quizList: [],
      quizLoading: false,
      quizClassId: '',
      quizSubjectId: '',
      quizDateRange: [],
      quizSubjectOptions: [],
      datePickerRenderKey: 0,
      afterQuizOptions: [],
      teacherOptions: [],
      quizSuggestVisible: false,
      quizFilterExamConfigId: '',
      quizFilterTeacherId: '',
      showQuizDetail: false,
      currentQuizCourse: null,
      _datePickerPosTimer: null,
      quizDatePickerOptions: {
        disabledDate: (time) => time.getTime() > Date.now(),
        shortcuts: [
          {
            text: '本周',
            onClick(picker) {
              const now = new Date()
              const day = now.getDay() || 7
              const start = new Date(now)
              start.setDate(now.getDate() - day + 1)
              start.setHours(0, 0, 0, 0)
              const end = new Date(start)
              end.setDate(start.getDate() + 6)
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const now = new Date()
              const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近三月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近半年',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 6)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近一年',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
      historyDatePickerOptions: {
        shortcuts: [
          {
            text: '本周',
            onClick(picker) {
              const now = new Date()
              const day = now.getDay() || 7
              const start = new Date(now)
              start.setDate(now.getDate() - day + 1)
              start.setHours(0, 0, 0, 0)
              const end = new Date(start)
              end.setDate(start.getDate() + 6)
              end.setHours(23, 59, 59, 999)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const now = new Date()
              const start = new Date(now.getFullYear(), now.getMonth(), 1)
              const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近三月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近半年',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 6)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近一年',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setFullYear(start.getFullYear() - 1)
              start.setHours(0, 0, 0, 0)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },
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

      dateRange: null,
      selectedClass: '',
      searchKeyword: '',
      classList: [],
      liveCourses: [],
      historyCourses: [],
      liveLoading: false,
      historyLoading: false,
      _searchTimer: null,
      historyPageNum: 1,
      historyPageSize:8,
      historyTotal: 0,

      name:'',
      instr:'',
      showCreateClass: false,
      classStartTime: '',
      classDuration: 240,
      durationOptions: [15, 30, 40, 45, 60, 75, 90, 120, 135, 150, 180, 200, 240, 300],
      recordMode: 1,
      allowMic: 0,
      allowMicOptions: [ { label: '不支持', value: 0 },{ label: '支持', value: 1 },],
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
      playerHistoryLessonId: '',
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
   
    async showCreateClass(val) {
      if (val) {
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        this.classStartTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
        this.classDuration = 240
        this.recordMode = 1
        this.allowMic = 0
        this.isPlayBack = 1
        this.createClassId = []
        const userName = this.$store.getters['user/realName'] || ''
      
        const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
        this.name = userName ? `${userName}的课堂${dateStr}` : ''
        await this.fetchClassList()
        if (this.classList.length) {
          this.createClassId = this.classList.map(c => c.value)
        }
      } else {
        this.name = ''
        this.instr = ''
        this.classStartTime = ''
        this.classDuration = 240
        this.recordMode = 1
        this.allowMic = 0
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
      } else if (val === 'quiz') {
        this.stopLiveRefreshTimer()
        this.showQuizDetail = false
        this.initQuizTab()
      } else {
        this.stopLiveRefreshTimer()
      }
      // 离开直播间时清空 liveUrl：
      // v-if="activeTab === 'liveui'" 已经销毁 iframe DOM，
      // 同时清空 URL 字符串，让 V8 能尽快 GC 掉 iframe 内的
      // WebRTC 连接、摄像头/麦克风流等重量级资源的引用
      if (val !== 'liveui') {
        this.$nextTick(() => { this.liveUrl = '' })
      }
      this.$nextTick(() => {
        this.bindDatePickerPositionFix('historyDatePicker')
        this.bindDatePickerPositionFix('quizDatePicker')
      })
    },
    showQuizDetail(val) {
      if (val) {
        this.destroyOnlineDatePickers()
      } else {
        this.datePickerRenderKey += 1
        this.$nextTick(() => this.bindDatePickerPositionFix('quizDatePicker'))
      }
    },
    dateRange() {
      this.historyPageNum = 1
      this.fetchHistoryList()
    },
    selectedClass() {
      this.historyPageNum = 1
      this.fetchHistoryList()
    },
    searchKeyword() {
      clearTimeout(this._searchTimer)
      this.historyPageNum = 1
      this._searchTimer = setTimeout(() => this.fetchHistoryList(), 400)
    },
  },
created() {
    if(this.$route.query.from &&this.$route.query.from=='home' ){
        this.activeTab = 'quiz'
    }
    this.isTeacher = getUserInfo().role === 'TEACHER'
  },
  mounted() {
    console.log('[缓存优化0708]');
    this.preconnectLiveClassroomOrigins()
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
    
    // 监听 iframe 直播退出消息（保存引用以便 beforeDestroy 移除）
    this._onWindowMessage = (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data
        this.activeTab = 'live'
      } else if (event.data?.type === 'MINIMIZE_WINDOW') {
        window.electronAPI && window.electronAPI.minimizeWindow()
      }
    }
    window.addEventListener('message', this._onWindowMessage)

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
    // 确保 iframe 及其 WebRTC 资源在组件销毁时被完全释放
    this.liveUrl = ''
    this.destroyOnlineDatePickers()
    this.removeIpcListeners()
    clearTimeout(this._searchTimer)
    this.stopLiveRefreshTimer()
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange)
    }
    // 卸载全局 message 监听，防止组件重建累积导致渲染进程内存泄漏
    if (this._onWindowMessage) {
      window.removeEventListener('message', this._onWindowMessage)
      this._onWindowMessage = null
    }
    if (typeof this._removeScreenPermissionDenied === 'function') {
      this._removeScreenPermissionDenied()
      this._removeScreenPermissionDenied = null
    }
    if (typeof this._removeScreenCaptureFailed === 'function') {
      this._removeScreenCaptureFailed()
      this._removeScreenCaptureFailed = null
    }
  },
  computed: {
    ...mapGetters('user', ['userInfo']),
    ...mapGetters('app', ['hasUpdate', 'isForceUpdate', 'updateInfo']),
    quizClassName() {
      const cls = this.classList.find(c => c.value === this.quizClassId)
      return cls ? cls.label : ''
    },
    filteredQuizList() {
      return this.quizList
    },
    quizSuggestGroups() {
      const keyword = (this.quizKeyword || '').trim().toLowerCase()
      if (!keyword) return []
      const groups = []
      const quizItems = (this.afterQuizOptions || [])
        .filter(opt => (opt.name || '').toLowerCase().includes(keyword))
        .slice(0, 8)
        .map(opt => ({
          type: 'quiz',
          label: opt.name,
          value: opt.examConfigId
        }))
      if (quizItems.length) {
        groups.push({ type: 'quiz', label: '课后测名称', items: quizItems })
      }
      const teacherItems = (this.teacherOptions || [])
        .filter(opt => (opt.realName || '').toLowerCase().includes(keyword))
        .slice(0, 8)
        .map(opt => ({
          type: 'teacher',
          label: opt.realName,
          value: opt.teacherId
        }))
      if (teacherItems.length) {
        groups.push({ type: 'teacher', label: '主讲老师', items: teacherItems })
      }
      return groups
    },
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
    /**
     * 预连接直播课堂入口和阿里云 SDK CDN。
     * 课程列表页通常早于用户点击进入课堂渲染完成，
     * 这里利用这段空窗期完成 DNS、TCP、TLS 预热，减少 iframe 首次建连等待。
     */
    preconnectLiveClassroomOrigins() {
      const liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits'
      const origins = ['https://g.alicdn.com']

      try {
        origins.unshift(new URL(liveBaseUrl).origin)
      } catch (_) {}

      origins.forEach(origin => {
        if (!origin || document.head.querySelector(`link[data-live-preconnect="${origin}"]`)) {
          return
        }

        const preconnect = document.createElement('link')
        preconnect.rel = 'preconnect'
        preconnect.href = origin
        preconnect.crossOrigin = 'anonymous'
        preconnect.setAttribute('data-live-preconnect', origin)
        document.head.appendChild(preconnect)

        const dnsPrefetch = document.createElement('link')
        dnsPrefetch.rel = 'dns-prefetch'
        dnsPrefetch.href = `//${new URL(origin).host}`
        dnsPrefetch.setAttribute('data-live-preconnect', origin)
        document.head.appendChild(dnsPrefetch)
      })
    },

    /**
     * 预热 Electron 摄像头和麦克风权限。
     * 该流程不阻塞 iframe 创建，
     * 避免系统权限查询或首次授权弹窗拉长直播课堂首屏加载时间。
     */
    prepareElectronMediaPermissions() {
      if (!window.electronAPI) return

      Promise.all([
        window.electronAPI.getMediaAccessStatus('camera'),
        window.electronAPI.getMediaAccessStatus('microphone')
      ])
        .then(([camStatus, micStatus]) => {
          const requests = []
          if (camStatus !== 'granted') {
            requests.push(window.electronAPI.askForMediaAccess('camera'))
          }
          if (micStatus !== 'granted') {
            requests.push(window.electronAPI.askForMediaAccess('microphone'))
          }
          return requests.length ? Promise.all(requests) : undefined
        })
        .catch(() => {})
    },
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
      console.log(item, 'item')
      //  const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
      //   const lessonId = String(item.id || '')
      //   updateRecentStudy({ courseId, lessonId })
      // taskUuid 有值 → 跳转 AI听记页面
      if (item.taskUuid) {
        const fileList = item.fileList || []
        const mainFile = fileList.find(f => f.videoType == '1')
        const teacherFile = fileList.find(f => f.videoType == '2')
        const { userId } = getUserInfo()
        this.$router.push({
          name: 'AIListening',
          query: {
            videoUrl: mainFile ? mainFile.filePath || '' : '',
            teacherVideoUrl: teacherFile ? teacherFile.filePath || '' : '',
            meetingId: item.taskUuid,
            meetingTitle: item.name || '',
            scopeText: item.taskUuid,
            liveLessonId: item.liveLessonId || '',
            historyLessonId: item.historyLessonId || '',
            teacherId: userId || ''
          }
        })
        return
      }

      // taskUuid 无值 → 沿用原有双视频回放逻辑
      const fileList = item.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')

      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      this.playerTitle = item.name || '视频回放'
      this.playerHistoryLessonId = String(item.historyLessonId || item.liveLessonId || '')
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
            this.$set(this.selectedCourseItem, 'shareUrl', d.shareUrl || '')
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
          shareUrl: d.shareUrl || '',
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
        if (!startTime|| now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      }
      this.prepareElectronMediaPermissions()

      const {userId,realName,userName,role}=getUserInfo();
      const token =  getToken();
      const liveId = item.id;
      const roleNumber = role === "STUDENT" ? 0 : 1;

      if (role === "STUDENT") {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          console.log(res,'呼呼呼')
         if (res.data==false) {
             this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }

      let liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits/'; //直播正式环境
      if(process.env.NODE_ENV === 'development'){
        liveBaseUrl = "http://localhost:8000";  //本地开发环境
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId}&_t=${Date.now()}&token=${token}`;
      console.log(this.liveUrl,'直播地址')
    this.activeTab = 'liveui'
    },
    copyShareLink() {
      let url = this.selectedCourseItem && this.selectedCourseItem.shareUrl
      if (!url) return
      if(process.env.NODE_ENV === 'development'){
        url = url.replace('https://live.fjlsjy123.com/visitor/#', 'http://localhost:8080'); //访客-本地开发环境
      }
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
    async copyQrCode() {
      if (!this.qrCodeUrl) return
      if (!window.electronAPI?.copyImageToClipboard) {
        this.$message.warning('当前环境不支持复制图片')
        return
      }

      const result = await window.electronAPI.copyImageToClipboard(this.qrCodeUrl)
      if (result && result.success) {
        this.$message.success('二维码已复制')
      } else {
        this.$message.error((result && result.message) || '复制失败，请重试')
      }
    },
    async saveQrCode() {
      if (!this.qrCodeUrl) return

      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = this.qrCodeUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 138
        canvas.height = img.naturalHeight || 138
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const blob = await new Promise((resolve, reject) => {
          if (typeof canvas.toBlob === 'function') {
            canvas.toBlob(data => data ? resolve(data) : reject(new Error('toBlob failed')), 'image/png')
          } else {
            const dataURL = canvas.toDataURL('image/png')
            const arr = dataURL.split(',')
            const mime = arr[0].match(/:(.*?);/)[1]
            const bstr = atob(arr[1])
            let n = bstr.length
            const u8arr = new Uint8Array(n)
            while (n--) u8arr[n] = bstr.charCodeAt(n)
            resolve(new Blob([u8arr], { type: mime }))
          }
        })

        const name = (this.selectedCourseItem && this.selectedCourseItem.title) || '直播分享'
        const fileName = `${name}二维码.png`.replace(/[\\/:*?"<>|]/g, '')
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = fileName
        link.href = url
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        this.$message.success('二维码已保存')
      } catch (e) {
        this.$message.error('保存失败，请重试')
      }
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
        if (!startTime|| now < startTime - 30 * 60 * 1000) {
          this.$message.warning('时间还未到，请耐心等候')
          return
        }
      }
      this.prepareElectronMediaPermissions()

      const token =  getToken();
      const courseid = this.selectedCourseItem.id;
      const {userId,realName,userName,role}=getUserInfo();
      const roleNumber = role === "STUDENT" ? 0 : 1;
      if (role === "STUDENT") {
        try {
          const res = await checkTempStudentLiveRecord(courseid)
          if (res.data==false) {
             this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }
      
      let liveBaseUrl = window.LIVEBASE || 'https://live.fjlsjy123.com/auikits/'; //直播正式环境
      if(process.env.NODE_ENV === 'development'){
        liveBaseUrl = "http://localhost:8000";  //本地开发环境
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${userName}&liveid=${courseid}&token=${token}&classroomId=${this.selectedCourseItem.liveLessonId || ''}&_t=${Date.now()}`;
      console.log(this.liveUrl,'直播地址')
     this.activeTab = 'liveui'
    },

    async publishAfterClassTest(item) {
      this.prepareElectronMediaPermissions()

      const token =  getToken()
      console.log(token,'token值')
      const { userId, realName } = getUserInfo()
      const liveId = item.liveId

      let liveBaseUrl = 'https://live.fjlsjy123.com/auikits/'
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
      const params = {
        pageNum: this.historyPageNum,
        pageSize: this.historyPageSize,
      }
      if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0]) {
        params.startDate = this.dateRange[0]
        params.endDate = this.dateRange[1]
      }
      if (this.selectedClass) params.classId = this.selectedClass
      if (this.searchKeyword) params.keyword = this.searchKeyword
      this.historyLoading = true
      try {
        const res = await getHistoryList(params)
        const data = res.data || res || {}
        this.historyCourses = data.records || data.list || (Array.isArray(data) ? data : [])
        this.historyTotal = data.total || 0
      } catch (_) {} finally {
        this.historyLoading = false
      }
    },

    handleHistoryPageChange(page) {
      this.historyPageNum = page
      this.fetchHistoryList()
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
          playbackSettings: playbackSettings,
          mode: this.allowMic,
          extends: JSON.stringify({isAllowMic,playbackSettings,recordingType}),
          im_server: ['aliyun_new'],
        }
        await createLiveClass(params)
        // const result = await createLiveClass(params)
       
        // const liveData = result.data || result
        // const liveId = liveData.liveId
        // const liveLessonId = liveData.liveLessonId
        // const { userId, userName ,realName} = getUserInfo()
        // console.log(getUserInfo(),'输出一下')
        // await createAliyunClass({
        //   liveId,
        //   mode: this.allowMic,
        //   teacher_id: userId,
        //   teacher_nick: userName,
        //   title: this.name.trim(),
        //   extends: JSON.stringify({isAllowMic,playbackSettings,recordingType}),
        //   im_server: ['aliyun_new'],
        //   id: liveLessonId
        // })
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
         this.$router.push('/schedule')
    //   const now = new Date()
    //   this.scheduleYear = now.getFullYear()
    //   this.scheduleMonth = now.getMonth()
    //   const pad = n => String(n).padStart(2, '0')
    //   this.scheduleSelectedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    //   this.showSchedule = true
    //   this.fetchScheduleData(now.getFullYear(), now.getMonth() + 1)
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

    // ── 课后测试 ─────────────────────────────────────────────────────────
    async initQuizTab() {
      this.quizList = []
      this.quizLoading = true
      await this.fetchClassList()
      if (!this.quizClassId && this.classList.length) {
        this.quizClassId = this.classList[0].value
      }
      if (!this.quizClassId) {
        this.quizList = []
        this.quizSubjectOptions = []
        this.afterQuizOptions = []
        this.teacherOptions = []
        this.quizLoading = false
        return
      }
      await Promise.all([
        this.fetchQuizSubjectOptions(),
        this.fetchQuizFilterOptions()
      ])
      this.fetchQuizList()
    },
    async handleQuizClassChange() {
      this.quizSubjectId = ''
      this.quizKeyword = ''
      this.quizFilterExamConfigId = ''
      this.quizFilterTeacherId = ''
      this.quizSuggestVisible = false
      await Promise.all([
        this.fetchQuizSubjectOptions(),
        this.fetchQuizFilterOptions()
      ])
      this.fetchQuizList()
    },
    handleQuizSearch() {
      this.fetchQuizList()
    },
    switchOnlineTab(key) {
      if (key === this.activeTab) return
      this.destroyOnlineDatePickers()
      this.datePickerRenderKey += 1
      this.activeTab = key
      this.$nextTick(() => {
        this.bindDatePickerPositionFix('historyDatePicker')
        this.bindDatePickerPositionFix('quizDatePicker')
      })
    },
    destroyOnlineDatePickers() {
      if (this._datePickerPosTimer) {
        clearInterval(this._datePickerPosTimer)
        this._datePickerPosTimer = null
      }
      ;['historyDatePicker', 'quizDatePicker'].forEach((refName) => {
        const inst = this.$refs[refName]
        if (!inst) return
        try {
          inst.pickerVisible = false
          if (typeof inst.hidePicker === 'function') inst.hidePicker()
          if (typeof inst.destroyPopper === 'function') inst.destroyPopper()
          if (inst.picker) {
            const el = inst.picker.$el
            if (el && el.parentNode) el.parentNode.removeChild(el)
            if (typeof inst.picker.$destroy === 'function') inst.picker.$destroy()
            inst.picker = null
          }
          inst.popperElm = null
          inst._lsShowPatched = false
          inst._lsPosPatched = false
        } catch (e) {
          console.log(e, 'destroyOnlineDatePickers')
        }
      })
      document.querySelectorAll('.ls-online-date-popper').forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el)
      })
      document.querySelectorAll('body > .el-picker-panel, body > .el-date-range-picker').forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el)
      })
    },
    bindDatePickerPositionFix(refName) {
      const inst = this.$refs[refName]
      if (!inst || inst._lsShowPatched) return
      if (typeof inst.showPicker !== 'function') return
      inst._lsShowPatched = true
      const rawShow = inst.showPicker.bind(inst)
      inst.showPicker = () => {
        rawShow()
        this.fixDatePickerPosition(refName)
      }
    },
    fixDatePickerPosition(refName) {
      this.bindDatePickerPositionFix(refName)
      const apply = () => {
        const inst = this.$refs[refName]
        if (!inst || !inst.$el) return false
        const panel = inst.popperElm || (inst.picker && inst.picker.$el) ||
          document.querySelector('.ls-online-date-popper')
        if (!panel || panel.style.display === 'none') return false
        const rect = inst.$el.getBoundingClientRect()
        if (!rect.width && !rect.height) return false
        let left = rect.left
        const panelWidth = panel.offsetWidth || 0
        if (panelWidth && left + panelWidth > window.innerWidth - 8) {
          left = Math.max(8, window.innerWidth - panelWidth - 8)
        }
        const top = `${rect.bottom + 4}px`
        const leftPx = `${Math.max(8, left)}px`
        panel.style.setProperty('position', 'fixed', 'important')
        panel.style.setProperty('top', top, 'important')
        panel.style.setProperty('left', leftPx, 'important')
        panel.style.setProperty('transform', 'none', 'important')
        panel.style.setProperty('margin', '0', 'important')
        return true
      }
      if (this._datePickerPosTimer) {
        clearInterval(this._datePickerPosTimer)
        this._datePickerPosTimer = null
      }
      let tries = 0
      this._datePickerPosTimer = setInterval(() => {
        tries += 1
        apply()
        if (tries >= 25) {
          clearInterval(this._datePickerPosTimer)
          this._datePickerPosTimer = null
        }
      }, 16)
      this.$nextTick(() => apply())
    },
    async fetchQuizSubjectOptions() {
      if (!this.quizClassId) {
        this.quizSubjectOptions = []
        return
      }
      try {
        const res = await getSubjectOptions({ classId: this.quizClassId })
        const list = (res && res.data) ? res.data : []
        this.quizSubjectOptions = [{ id: '', name: '全部科目' }, ...list]
      } catch (e) {
        console.log(e, 'fetchQuizSubjectOptions error')
        this.quizSubjectOptions = []
      }
    },
    async fetchQuizFilterOptions() {
      if (!this.quizClassId) {
        this.afterQuizOptions = []
        this.teacherOptions = []
        return
      }
      try {
        const [quizRes, teacherRes] = await Promise.all([
          getAfterQuizOptions({ classId: this.quizClassId }),
          getTeacherOptions({ classId: this.quizClassId })
        ])
        this.afterQuizOptions = (quizRes && quizRes.data) ? quizRes.data : []
        this.teacherOptions = (teacherRes && teacherRes.data) ? teacherRes.data : []
      } catch (e) {
        console.log(e, 'fetchQuizFilterOptions error')
        this.afterQuizOptions = []
        this.teacherOptions = []
      }
    },
    onQuizKeywordFocus() {
      if ((this.quizKeyword || '').trim() && this.quizSuggestGroups.length) {
        this.quizSuggestVisible = true
      }
    },
    onQuizKeywordInput() {
      const keyword = (this.quizKeyword || '').trim()
      this.quizSuggestVisible = !!keyword
      // 仅在清空输入时重置筛选并刷新列表，输入过程中不改动列表
      if (!keyword && (this.quizFilterExamConfigId || this.quizFilterTeacherId)) {
        this.quizFilterExamConfigId = ''
        this.quizFilterTeacherId = ''
        this.fetchQuizList()
      }
    },
    clearQuizKeyword() {
      this.quizKeyword = ''
      this.quizFilterExamConfigId = ''
      this.quizFilterTeacherId = ''
      this.quizSuggestVisible = false
      this.fetchQuizList()
    },
    closeQuizSuggest() {
      this.quizSuggestVisible = false
    },
    selectQuizSuggest(opt) {
      if (!opt) return
      this.quizKeyword = opt.label || ''
      this.quizSuggestVisible = false
      if (opt.type === 'quiz') {
        this.quizFilterExamConfigId = opt.value
        this.quizFilterTeacherId = ''
      } else if (opt.type === 'teacher') {
        this.quizFilterTeacherId = opt.value
        this.quizFilterExamConfigId = ''
      }
      this.fetchQuizList()
    },
    confirmQuizKeyword() {
      this.quizSuggestVisible = false
    },
    async fetchQuizList() {
      if (!this.quizClassId) return
      const { userId } = getUserInfo()
      this.quizLoading = true
      try {
        const params = { classId: this.quizClassId, teacherId: userId }
        if (this.quizSubjectId) params.subjectId = this.quizSubjectId
        if (this.quizDateRange && this.quizDateRange.length === 2) {
          params.quizStartTime = this.quizDateRange[0]
          params.quizEndTime = this.quizDateRange[1]
        }
        if (this.quizFilterExamConfigId) params.examConfigId = this.quizFilterExamConfigId
        if (this.quizFilterTeacherId) params.teacherId = this.quizFilterTeacherId
        const res = await getAfterQuizTeacherList(params)
        this.quizList = (res && res.data) ? res.data : []
      } catch (e) {
        console.log(e, 'fetchQuizList error')
        this.quizList = []
      } finally {
        this.quizLoading = false
      }
    },
    openQuizDetail(item) {
      this.currentQuizCourse = { ...item, classId: this.quizClassId }
      this.showQuizDetail = true
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
.online-page {
  padding: 28px 24px 63px;
  min-height: 100%;
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

// ─── 顶部 Header ─────────────────────────────────────────────
.online-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.online-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239,246,255,0.8);
  border-radius: 12px;
  padding: 4px;
}

.online-tab {
  width:104px;
  height: 40px;
  text-align: center;
  line-height: 40px;
  font-size: 14px;
  font-weight: bold;
  color: #64748B;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;

  &:hover:not(.active) {
    color: #62748E
  }

  &.active {
    background: #FFFFFF;
    color: #1F7CFF;
    font-weight: bold;
    box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  }
}

.online-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-create {
    width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  background: #1F7CFF;
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: #1F7CFF;
  }

  &__icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }
}

.btn-schedule {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 40px;
   width: 110px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  color: #314158;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px #DBEAFE;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #CBD5E1;
  }

  &__icon {
    width: 17px;
    height: 17px;
    object-fit: contain;
  }
}

// ─── 数量文案 ────────────────────────────────────────────────
.online-count {
  font-size: 14px;
  color: #45556C;
  margin-bottom: 16px;
}

// ─── 筛选栏 ──────────────────────────────────────────────────
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFFFFF;
  padding:  16px;
  box-sizing: border-box;
  margin-bottom: 20px;
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1), 0px 0px 0px 1px rgba(226,232,240,0.8);
border-radius: 12px 12px 12px 12px;

  &__left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    min-width: 0;
  }

  &__count {
    flex-shrink: 0;
    font-size: 13px;
    color: #94A3B8;
    margin-left: 16px;
  }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  &__label {
    font-size: 14px;
    color: #45556C;
    white-space: nowrap;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 12px;
    background: #FFFFFF;
    box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    cursor: pointer;
    min-width: 132px;
    box-sizing: border-box;

    &--picker {
      position: relative;
      min-width: 250px;
      cursor: default;
      overflow: visible;
    }

    &--datetime {
      min-width: 250px;
    }

    &--select {
      min-width: 160px;
      cursor: default;
      padding-right: 8px;
    }
  }

  &__value {
    flex: 1;
    font-size: 14px;
    color: #1D293D;
    white-space: nowrap;
  }

  &__icon {
    width: 15px;
    height: 15px;
    object-fit: contain;
    opacity: 0.6;
    flex-shrink: 0;
    pointer-events: none;
  }

  &__arrow {
    font-size: 12px;
    color: #94A3B8;
  }
}

.filter-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
 background: #F8FAFC;
border-radius: 10px 10px 10px 10px;
border: 1px solid #E2E8F0;
 width: 280px;

  &--wide {
    max-width: 360px;
    width: 360px;
  }

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
      color: #90A1B9 !important;
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

  &__dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 20;
    max-height: 280px;
    overflow-y: auto;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    padding: 8px 0;
  }

  &__group + &__group {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid #F1F5F9;
  }

  &__group-title {
    padding: 4px 12px 6px;
    font-size: 12px;
    color: #94A3B8;
    line-height: 16px;
  }

  &__option {
    padding: 8px 12px;
    font-size: 14px;
    color: #314158;
    line-height: 20px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background: #F8FAFC;
      color: #2563EB;
    }
  }
}

// ─── 待启课堂卡片 ────────────────────────────────────────────
.pending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.pending-card {
  background: #FFFFFF;
 box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  padding:21px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    border-radius: 10px 10px 10px 10px;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;

    &.is-living {
      background: #EFF6FF;
      color: #1F7CFF;
    }

    &.is-waiting {
      background: #F8FAFC;
      color: #62748E;
    }
  }

  &__badge-sep {
    margin: 0 6px;
    opacity: 0.5;
  }

  &__more {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;
    flex-shrink: 0;

    img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    &:hover {
      background: #F1F5F9;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: bold;
    color: #020618;
    line-height: 1.4;
    margin-bottom: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    font-size: 14px;
    color: #62748E;
    margin-bottom: 20px;
  }

  &__btn {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 14px;
    font-weight: bold;
    background: #F1F5F9;
    color: #90A1B9;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;

    &.active {
     background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
      color: #FFFFFF;
     box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;

      &:hover {
        opacity: 0.92;
      }
    }
  }
}

// ─── 回放课堂卡片 ────────────────────────────────────────────
.replay-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.replay-card {
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  }

  &__cover {
    width: 100%;
    position: relative;
    height: 142px;
   img{
    width: 100%;
    height: 100%;
   }
  }

  &__more_box {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
  }

  &__more {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 10px;
    flex-shrink: 0;

    img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  }

  &__tag {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(31, 124, 255, 0.9);
    color: #FFFFFF;
    font-size: 11px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  &__cover-title {
    font-size: 20px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.35;
    white-space: pre-line;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    max-width: 60%;
  }

  &__mascot {
    position: absolute;
    right: 16px;
    bottom: 10px;
    width: 64px;
    height: 72px;
    pointer-events: none;
  }

  &__mascot-face {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 36px;
    background: #FFFFFF;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 12px;
      width: 6px;
      height: 8px;
      background: #1E293B;
      border-radius: 50%;
    }

    &::before { left: 8px; }
    &::after { right: 8px; }
  }

  &__mascot-body {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 48px;
    height: 40px;
    background: #FFFFFF;
    border-radius: 20px 20px 12px 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  &__body {
    padding: 16px 16px 16px;
  }

  &__title {
    font-size: 14px;
    font-weight: bold;
    color: #020618;
    line-height: 1.4;
    margin-bottom: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    width: 100%;
    height: 36px;
background: #F8FAFC;
border-radius: 10px 10px 10px 10px;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #314158;
    margin-bottom: 8px;
  }

  &__meta-sep {
    width: 1px;
    height: 12px;
    background: #E2E8F0;
  }

  &__teacher {
    font-size: 12px;
    color: #94A3B8;
  }
}

// ─── 课后测试卡片 ────────────────────────────────────────────
.quiz-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  min-height: 200px;
}

.quiz-card {
 background: #FFFFFF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  padding: 21px;
  cursor: pointer;

  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &__title {
    font-size: 16px;
    font-weight: bold;
    color: #020618;
    line-height: 1.4;
    margin-bottom: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__pill {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background: #F8FAFC;
    border-radius: 10px;
    font-size: 12px;
    color: #314158;
    font-weight: bold;
    padding: 0 12px;
    box-sizing: border-box;
  }

  &__time {
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    background: #F8FAFC;
border-radius: 10px 10px 10px 10px;
padding: 0 12px;
box-sizing: border-box;
  }

  &__time-label {
    font-size: 12px;
    color: #90A1B9;
  }

  &__time-value {
    font-size: 12px;
    color: #314158;
    font-weight: bold;
  }

  &__btn {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
border-radius: 12px 12px 12px 12px;
    color: #FFFFFF;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;


   
  }
}

// ─── 响应式 ──────────────────────────────────────────────────
@media (max-width: 1280px) {
  .replay-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .pending-grid,
  .quiz-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .replay-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-bar {
    flex-wrap: wrap;
    gap: 12px;

    &__left {
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .online-page {
    padding: 16px;
  }

  .online-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .pending-grid,
  .quiz-grid,
  .replay-grid {
    grid-template-columns: 1fr;
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
  z-index: 1999;
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
  padding-right: 22px;
  font-size: 14px;
  color: #333333;
  height: 32px;
  line-height: 32px;
}
.masl_con_dialog_last_shadow_third .el-select__caret {
  display: none !important;
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
  width: 138px;
  height: 138px;
  border-radius: 10px 10px 10px 10px;
  // background: #1E2939;
  display: block;
  padding: 8px;
  box-sizing: border-box;
  cursor: zoom-in;
}
.cdc-qr-placeholder {
  width: 128px;
  height: 128px;
  border-radius: 10px;
  background: #1E2939;
}
.cdc-qr-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 auto 8px;
}
.cdc-qr-action-btn {
  width: 96px;
  height: 36px;
  border: 1px solid #0049FF;
  border-radius: 4px;
  background: #CAD9FF;
  color: #0049FF;
  font-size: 14px;
  line-height: 36px;
  text-align: center;
  cursor: pointer;
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


/* Element UI 组件样式覆盖 */

.ls_date_picker {
  flex: 1;
  width: 100% !important;
  min-width: 0;

  &--daterange {
    width: 220px !important;
    flex: 0 0 220px;
  }

  &--datetimerange {
    width: 220px !important;
    flex: 0 0 220px;
  }

  ::v-deep .el-range-editor {
    border: none;
    box-shadow: none;
    padding: 0;
    height: auto;
    background: transparent;
    width: 100% !important;
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
  ::v-deep .el-range-editor--datetimerange .el-range-input {
    width: 140px;
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
  color: #94A3B8;
  pointer-events: none;
}
.ls_class_select {
  width: 140px;

  ::v-deep .el-input__inner {
    border: none;
    box-shadow: none;
    font-size: 14px;
    color: #1D293D;
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
  ::v-deep .el-select__input {
    margin-left: 0 !important;
  }
}

.masl_third_select_wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
.masl_third_select_arrow {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #888;
  pointer-events: none;
}
.masl_con_dialog_last_shadow_third {
  ::v-deep .el-select__input{
    margin-left: 0!important;
  }
  ::v-deep .el-select__caret {
    display: none !important;
  }
}

.filter-item__control--picker ::v-deep .el-input__inner{
border:none!important
}
</style>

<style lang="scss">
.ls-online-date-popper {
  z-index: 4000 !important;
}
</style>
