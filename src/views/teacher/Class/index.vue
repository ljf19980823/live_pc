<template>
  <div class="page-placeholder">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <div class="page-header-left">
        <span class="page-header-title">我的班级</span>
        <span class="page-header-count">共 {{ classList.length }} 个</span>
      </div>
      <div class="page-header-right">
        <div class="page-header-create" @click="handleAddClass()">
          <img src="@/assets/images/class/new_add.png" class="page-header-create-icon" alt="">
          <span>创建班级</span>
        </div>
        <img src="@/assets/images/class/new_notice.png" class="page-header-notice" @click="handleToAnnouncement()" alt="">
      </div>
    </div>

    <div class="page-body">
    <div class="app_container_box_left">
      <!-- 默认：搜索入口 + 筛选 -->
      <div class="app_container_box_left_search_box" v-if="isOpenSearch == false">
        <div class="app_container_box_left_search_box_entry" @click="openSearch()">
          <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
          <div class="app_container_box_left_search_box_top_text">搜索班级名称</div>
        </div>
        <div class="app_container_box_left_search_box_center">
          <el-dropdown trigger="click" @command="handleSortCommand" class="left-filter-dropdown">
            <div class="left-filter-btn">
              <span>{{ sortLabel }}</span>
              <i class="el-icon-arrow-down left-filter-arrow"></i>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="name_asc" :class="{ 'sort-active': sortType === 'name_asc' }">默认排序</el-dropdown-item>
                <el-dropdown-item command="name_desc" :class="{ 'sort-active': sortType === 'name_desc' }">班级名称 Z-A</el-dropdown-item>
                <el-dropdown-item command="time_asc" :class="{ 'sort-active': sortType === 'time_asc' }">创建时间升序</el-dropdown-item>
                <el-dropdown-item command="time_desc" :class="{ 'sort-active': sortType === 'time_desc' }">创建时间降序</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div class="left-filter-select">
            <el-select v-model="liveStatus" placeholder="全部" style="width: 100%;">
              <el-option key="" label="全部" value="" />
              <el-option key="未过期" label="未过期" value="未过期" />
              <el-option key="已过期" label="已过期" value="已过期" />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 搜索中：保持原样式 -->
      <div class="app_container_box_left_search_box" v-if="isOpenSearch == true">
        <div class="app_container_box_left_search_box_topBox">
          <div class="app_container_box_left_search_box_topBox_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input ref="searchInput" v-model="leftSearchText" :placeholder="searchType === 'class' ? '搜索班级' : '搜索学生'" clearable />
            </div>
          </div>
          <div class="app_container_box_left_search_box_topBox_cancel" @click="cancelSearch">取消</div>
        </div>
        <div class="app_container_box_left_search_box_choose">
          <div
            class="app_container_box_left_search_box_choose_detail"
            :class="{ 'app_container_box_left_search_box_choose_detail_active': searchType === 'class' }"
            @click="searchType = 'class'"
          >找班级</div>
          <div
            class="app_container_box_left_search_box_choose_detail"
            :class="{ 'app_container_box_left_search_box_choose_detail_active': searchType === 'student' }"
            @click="searchType = 'student'"
          >找学生</div>
        </div>
      </div>

      <div ref="leftClassList" class="app_container_box_left_list" v-if="isOpenSearch == false" v-loading="classListLoading">
        <div
          class="app_container_box_left_list_detail"
          :class="{ 'app_container_box_left_list_detail_active': selectedClassIndex === index }"
          v-for="(item, index) in classList"
          :key="index"
          @click="selectClass(index)"
        >
          <div class="class-card-header">
            <div class="app_container_box_left_list_detail_title">
              {{ item.alias || item.name }}
               <img v-if="item.pinned" src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleClassCardOptions(cmd, index)">
              <img @click.stop src="@/assets/images/class/new_options.png" class="class-card-options" alt="">
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pin">{{ item.pinned ? '取消置顶' : '置顶' }}</el-dropdown-item>
                  <el-dropdown-item command="alias">设置别名</el-dropdown-item>
                  <el-dropdown-item v-if="item.source !== '后台创建'" command="editName">修改班级名称</el-dropdown-item>
                  <el-dropdown-item v-if="item.source !== '后台创建'" command="editDate">修改有效期</el-dropdown-item>
                  <el-dropdown-item v-if="item.source !== '后台创建'" command="delete">删除班级</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="app_container_box_left_list_detail_count app_container_box_left_list_detail_count2">
            <span>{{ item.count }} 人</span>
            <span>{{ item.courseCnt || 0 }} 门课</span>
            <span>{{ item.source || '老师创建' }}</span>
          </div>
          <div class="class-card-validity">
            <span class="class-card-validity-label">有效期</span>
            <span
              class="class-card-validity-value"
              :class="{
                'is-urgent': item.remainDays >= 0 && item.remainDays <= 30,
                'is-expired': item.remainDays < 0
              }"
            >{{ getClassValidityText(item) }}</span>
          </div>
        </div>
        <EmptyState v-if="!classListLoading && classList.length === 0" description="暂无班级数据" />
      </div>

      <!-- 查询时的左边列表：保持原样式 -->
      <div class="app_container_box_left_list app_container_box_left_list_search" v-if="isOpenSearch == true">
        <div class="search_tips" v-if="!leftSearchText && searchType === 'class'">输入关键词查找班级</div>
        <div class="search_tips" v-if="!leftSearchText && searchType === 'student'">输入学生姓名/用户名/手机号查找学生所在班级</div>
        <template v-if="leftSearchText">
          <div
            class="app_container_box_left_list_detail2"
            v-for="(item, index) in searchList"
            :key="index"
            @click="selectSearchResult(item)"
          >
            <template v-if="searchType === 'class'">
              <div class="app_container_box_left_list_detail_title" v-html="highlightKeyword(item.name, leftSearchText)"></div>
            </template>
            <template v-else>
              <div class="app_container_box_left_list_detail_title">{{ item.className }}</div>
              <div class="app_container_box_left_list_detail_count" v-html="highlightKeyword(item.studentName, leftSearchText)"></div>
            </template>
          </div>
        </template>
        <EmptyState v-if="leftSearchText && searchList.length === 0" description="无搜素结果" />
      </div>
    </div>
    <div class="app_container_box_right">
      <!-- 课程详情视图 -->
      <template v-if="rightView === 'courseDetail'">
        <div class="cdetail-header">
          <div class="cdetail-header-back" @click="rightView = 'default'">
            <img src="@/assets/images/student/back.png" class="cdetail-back-icon" alt="" />
            <span class="cdetail-back-text">{{ selectedCourse ? selectedCourse.name : '' }}</span>
          </div>
          <div class="cdetail-task-count">{{ courseDetail.taskCount }}个学习任务</div>
        </div>
        <div class="cdetail-list" v-loading="courseDetailLoading">
          <template v-for="(item, idx) in courseDetail.items">
            <!-- 直播课 -->
            <div v-if="item.type === 'live'" class="cdi-card" :key="idx" @click="handleCardClickWithLoading(`live-${idx}`, () => enterLiveRoom(item))" v-loading="activeLoadingKey === `live-${idx}`" element-loading-background="rgba(255,255,255,0.7)">
              <div class="cdi-main">
                <img src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                <div class="cdi-info">
                  <div class="cdi-name">{{ item.title }}</div>
                  <div class="cdi-status-row">
                    <template v-if="item.isFinish == 1">
                      <div class="cdi-status-text">{{ item.liveStatus === '未开播' ? '未开播' : '已结束' }}</div>
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
                <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <!-- 资源文件（历史课程/视频/图片/音频/资料） -->
            <div v-else-if="item.type === 'resource'" class="cdi-card" :key="idx" @click="handleCardClickWithLoading(`resource-${idx}`, () => handleResourceClick(item))" v-loading="activeLoadingKey === `resource-${idx}`" element-loading-background="rgba(255,255,255,0.7)">
              <div class="cdi-main">
                <img v-if="['3','4'].includes(item.nodeType)" src="@/assets/images/class/videoIcon.png" class="cdi-type-icon" alt="" />
                <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                <div class="cdi-info">
                  <div class="cdi-name">{{ item.title }}</div>
                  <div class="cdi-file-row">
                    <span class="cdi-file-meta" v-if="item.size">{{ item.size }}</span>
                    <span class="cdi-file-meta" v-if="item.date">{{ item.date }}</span>
                    <img v-if="item.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                  </div>
                </div>
              </div>
              <div class="cdi-actions" @click.stop>
                <el-progress type="circle" :percentage="item.progress" :width="36" :stroke-width="2" :color="item.progress >= 100 ? '' : '#71A0FF'" :status="item.progress >= 100 ? 'success' : ''"></el-progress>
                <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
                <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
                <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, child)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
                            <div class="cdi-status-text">{{ grandchild.liveStatus === '未开播' ? '未开播' : '已结束' }}</div>
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
                      <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, grandchild)">
                        <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
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
                          <div class="cdi-status-text">{{ child.liveStatus === '未开播' ? '未开播' : '已结束' }}</div>
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
                    <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, child)">
                      <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </template>
            </template>
          </template>
        </div>
      </template>

      <!-- 默认视图 -->
      <template v-else>
      <!-- 无班级时空状态 -->
      <div v-if="!classListLoading && classList.length === 0" class="app_container_box_right_empty">
        <EmptyState description="暂无班级，请先创建班级" />
      </div>
      <template v-if="classList.length > 0">
      <div class="app_container_box_right_top">
        <div class="app_container_box_right_top_top">
          <div class="app_container_box_right_top_top_left">
            <div class="app_container_box_right_top_top_title">
              <div class="app_container_box_right_top_top_name">{{ currentClass.alias || currentClass.name }}</div>
              <div
                v-if="currentClass.alias && currentClass.name && currentClass.alias !== currentClass.name"
                class="app_container_box_right_top_top_realname"
              >{{ currentClass.name }}</div>
            </div>
          </div>
        </div>
        <div class="app_container_box_right_top_mess">
          <span>{{ currentClass.count }} 位学生</span>
          <span class="right-top-mess-dot">·</span>
          <span>{{ currentClass.courseCnt || 0 }} 门课程</span>
          <span class="right-top-mess-dot">·</span>
          <span>{{ currentClass.source || '老师创建' }}</span>
        </div>
        <div class="app_container_box_right_top_choose">
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'student'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'student' }">学生</div>
            <img v-if="rightTab === 'student'" src="@/assets/images/class/tab_active.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'course'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'course' }">课程</div>
            <img v-if="rightTab === 'course'" src="@/assets/images/class/tab_active.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'afterTest'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'afterTest' }">课后测</div>
            <img v-if="rightTab === 'afterTest'" src="@/assets/images/class/tab_active.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
        </div>
      </div>
      <!-- 学生tab列表 -->
      <div class="app_container_box_right_last student-tab" v-if="rightTab === 'student'">
        <div class="app_container_box_right_last_top student-tab-top">
          <div class="app_container_box_right_last_top_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input v-model="rightStudentSearch" placeholder="姓名/用户名/手机号" clearable />
            </div>
          </div>
        </div>
        <div class="app_container_box_right_last_list student-list" v-loading="studentListLoading">
          <div class="app_container_box_right_last_list_detail student-card" v-for="(item, index) in filteredStudentList" :key="index" @click="handleStudentDetail(item)">
            <img v-if="item.avatar" :src="item.avatar" class="student-card-avatar" alt="">
            <div v-else class="student-card-avatar student-card-avatar-placeholder">{{ (item.name || '').slice(-2) }}</div>
            <div class="student-card-info">
              <div class="student-card-name">{{ item.name }}</div>
              <div class="student-card-account">账号: {{ item.userName || '-' }}</div>
              <div class="student-card-join">{{ item.joinDesc || (item.joinDate ? (item.joinDate.slice(0, 10) + '进班') : '') }}</div>
            </div>
            <div class="student-card-actions" @click.stop>
              <span class="student-card-action student-card-action-reset" @click="handleStudentOptionsCommand('resetPassword', item)">重置密码</span>
              <span
                v-if="currentClass && currentClass.allowRemove == 1"
                class="student-card-action student-card-action-remove"
                @click="handleStudentOptionsCommand('removeStudent', item)"
              >移除学生</span>
            </div>
          </div>
          <EmptyState v-if="!studentListLoading && filteredStudentList.length === 0" :description="rightStudentSearch ? '无搜索结果' : '暂无学生数据'" style="width: 100%;" />
        </div>
      </div>
      <!-- 课程tab列表 -->
      <div class="app_container_box_right_last course-tab" v-if="rightTab === 'course'">
        <div class="app_container_box_right_last_top">
          <div class="app_container_box_right_last_top_num">共 {{ filteredCourseList.length }} 门课程</div>
          <div class="app_container_box_right_last_top_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input v-model="rightCourseSearch" placeholder="搜索课程名称" clearable />
            </div>
          </div>
        </div>
        <div class="app_container_box_right_last_list course-list" v-loading="courseListLoading">
          <div class="app_container_box_right_last_list_detailCourse" v-for="(item, index) in filteredCourseList" :key="index" @click="handleCourseClick(item)" style="cursor:pointer;">
            <div class="course-card-cover-wrap">
              <img :src="item.cover || require('@/assets/images/class/such.png')" class="app_container_box_right_last_list_detailCourse_fm" alt="">
              <div class="app_container_box_right_last_list_detailCourse_options" @click.stop>
                <el-dropdown trigger="click" @command="(cmd) => handleCourseOptionsCommand(cmd, item)">
                  <div class="app_container_box_right_last_list_detailCourse_options_box">
                    <img src="@/assets/images/class/new_options.png" class="app_container_box_right_last_list_detailCourse_options_icon" alt="">
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="app_container_box_right_last_list_detailCourse_name">{{ item.name }}</div>
            <div class="app_container_box_right_last_list_detailCourse_task">{{ item.taskCount }} 个学习任务</div>
            <div class="app_container_box_right_last_list_detailCourse_jd">
              <div class="app_container_box_right_last_list_detailCourse_jd_box">
                <div
                  class="app_container_box_right_last_list_detailCourse_jd_box_now"
                  :class="{ 'is-complete': Math.round(item.progress) >= 100 }"
                  :style="{ width: Math.round(item.progress) + '%' }"
                ></div>
              </div>
              <div class="app_container_box_right_last_list_detailCourse_jd_num">{{ Math.round(item.progress) }}%</div>
            </div>
          </div>
          <EmptyState v-if="!courseListLoading && filteredCourseList.length === 0" :description="rightCourseSearch ? '无搜索结果' : '暂无课程数据'" style="width: 100%;" />
        </div>
      </div>
      <!-- 课后测试tab列表 -->
      <div class="app_container_box_right_last after-test-tab" v-if="rightTab === 'afterTest' && !showAfterTestDetail">
        <!-- 筛选条件 -->
        <div class="filter-bar">
          <div class="filter-bar__left">
            <div class="filter-item">
              <div class="filter-item__control filter-item__control--picker filter-item__control--datetime">
                <el-date-picker
                  v-model="afterTestTimeRange"
                  type="datetimerange"
                  range-separator="-"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  value-format="yyyy-MM-dd HH:mm:ss"
                  :picker-options="afterTestDatePickerOptions"
                  :clearable="false"
                  class="ls_date_picker ls_date_picker--datetimerange"
                  size="mini"
                  @change="handleAfterTestSearch"
                />
                <i
                  v-if="afterTestTimeRange && afterTestTimeRange.length"
                  class="el-icon-circle-close filter-item__clear"
                  @click.stop="clearAfterTestTimeRange"
                />
                <img
                  v-else
                  src="@/assets/images/class/rl_icon.png"
                  class="filter-item__icon"
                  alt=""
                />
              </div>
            </div>
            <div class="filter-item">
              <div class="filter-item__control filter-item__control--select">
                <div class="ls_class_select_wrap">
                  <el-select
                    v-model="afterTestFilter.subjectId"
                    placeholder="全部科目"
                    size="mini"
                    :clearable="false"
                    filterable
                    class="ls_class_select"
                    @change="handleAfterTestSearch"
                  >
                    <el-option
                      v-for="opt in subjectOptions"
                      :key="opt.id"
                      :label="opt.name"
                      :value="opt.id"
                    />
                  </el-select>
                  <i
                    v-if="afterTestFilter.subjectId"
                    class="el-icon-circle-close ls_class_select_clear"
                    @click.stop="clearAfterTestField('subjectId')"
                  />
                  <i
                    v-else
                    class="el-icon-arrow-down ls_class_select_arrow"
                  />
                </div>
              </div>
            </div>
            <div class="filter-item">
              <div class="filter-item__control filter-item__control--select">
                <div class="ls_class_select_wrap">
                  <el-select
                    v-model="afterTestFilter.examConfigId"
                    placeholder="全部课后测"
                    size="mini"
                    :clearable="false"
                    filterable
                    class="ls_class_select"
                    @change="handleAfterTestSearch"
                  >
                    <el-option
                      v-for="opt in afterQuizOptions"
                      :key="opt.examConfigId"
                      :label="opt.name"
                      :value="opt.examConfigId"
                    />
                  </el-select>
                  <i
                    v-if="afterTestFilter.examConfigId"
                    class="el-icon-circle-close ls_class_select_clear"
                    @click.stop="clearAfterTestField('examConfigId')"
                  />
                  <i
                    v-else
                    class="el-icon-arrow-down ls_class_select_arrow"
                  />
                </div>
              </div>
            </div>
            <div class="filter-item">
              <div class="filter-item__control filter-item__control--select">
                <div class="ls_class_select_wrap">
                  <el-select
                    v-model="afterTestFilter.teacherId"
                    placeholder="全部老师"
                    size="mini"
                    :clearable="false"
                    filterable
                    class="ls_class_select"
                    @change="handleAfterTestSearch"
                  >
                    <el-option
                      v-for="opt in teacherOptions"
                      :key="opt.teacherId"
                      :label="opt.realName"
                      :value="opt.teacherId"
                    />
                  </el-select>
                  <i
                    v-if="afterTestFilter.teacherId"
                    class="el-icon-circle-close ls_class_select_clear"
                    @click.stop="clearAfterTestField('teacherId')"
                  />
                  <i
                    v-else
                    class="el-icon-arrow-down ls_class_select_arrow"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="after-test-list" v-loading="afterTestLoading">
          <EmptyState v-if="!afterTestLoading && afterTestList.length === 0" description="暂无课后测数据" style="width:100%;margin-top:60px;" />
          <div
            class="after-test-item"
            v-for="(item, index) in afterTestList"
            :key="index"
          >
            <div class="after-test-item__title" :title="item.name">{{ item.name }}</div>
            <div class="after-test-item__meta">
              <div class="after-test-item__meta-cell">{{ item.teacherName || item.teacherId || '-' }}</div>
              <div class="after-test-item__meta-cell">{{ item.subjectName || item.subject || '-' }}</div>
              <div class="after-test-item__meta-cell">{{ item.finishedStudentCount }}/{{ item.totalStudentCount }} 已完成</div>
              <div class="after-test-item__meta-cell">{{ item.topicNum }} 题</div>
            </div>
            <div class="after-test-item__time">
              <div class="after-test-item__time-label">发布时间</div>
              <div class="after-test-item__time-val">{{ formatAfterTestTime(item.createTime) }}</div>
            </div>
            <div class="after-test-item__actions">
              <button
                v-if="item.fileList && item.fileList.length != 0"
                class="after-test-item__btn after-test-item__btn--replay"
                @click.stop="openVideoPlayer(item)"
              >查看回放</button>
              <button class="after-test-item__btn" @click="openAfterTestDetail(item)">查看详情</button>
            </div>
          </div>
        </div>
      </div>
      <!-- 课后测试 - 学生做题详情子组件 -->
      <AfterClassTestDetail
        v-if="rightTab === 'afterTest' && showAfterTestDetail"
        :visible="showAfterTestDetail"
        :className="currentClass && (currentClass.alias || currentClass.name)"
        :courseInfo="currentAfterTestCourse"
        @close="showAfterTestDetail = false"
      />
      </template>
      </template>
    </div>
    </div>
    <!-- 重置密码弹窗 -->
    <DialogCustome width="616px" height="366px" :visible="showResetPasswordDialog" confirmText="确定并复制密码" title="重置密码" :confirmLoading="resetPasswordLoading" @cancel="onDialogCancel" @confirm="onDialogConfirm" @close="onDialogCancel">
      <div class="dialog_box">
        <div class="dialog_box_con">
          <img src="@/assets/images/class/pass.png" class="dialog_box_con_icon" alt="">
          <div class="dialog_box_con_title">输入密码</div>
          <div class="dialog_box_con_sx"></div>
          <div class="dialog_box_con_input">
            <el-input v-model="resetPasswordValue" style="width:100%" placeholder="8-20位，必须包含数字和大小写字母" @input="resetPasswordValue = resetPasswordValue.replace(/[^\x00-\x7F]/g, '')"></el-input>
          </div>
          <div class="dialog_box_con_btn" @click="generatePassword">自动生成</div>
          
        </div>
      </div>
    </DialogCustome>

    <!-- 新建班级弹窗 -->
    <DialogCustome
      width="616px"
      height="366px"
      :showClose='true'
      :visible="showAddClassDialog"
      :confirmText="addClassStep === 1 ? '下一步' : '创建'"
      :cancelText="addClassStep === 1 ? '取消' : '上一步'"
      :confirmLoading="createClassLoading"
      title="创建新班级"
      @cancel="onDialogCancelAdd"
      @confirm="onDialogConfirmAdd"
      @close="onDialogCloseAdd"
    >
      <!-- 第一步 -->
      <div class="dialog_box2" v-if="addClassStep === 1">
        <div class="dialog_box_con2">
          <el-input style="width:100%" placeholder="请输入班级名称" v-model="newClassName"></el-input>
        </div>
        <div class="dialog_box_con2">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入班级描述"
            maxlength="25"
            show-word-limit
            v-model="newClassDesc">
          </el-input>
        </div>
      </div>
      <!-- 第二步 -->
      <div class="dialog_box2" v-if="addClassStep === 2">
        <div class="dialog_box_con">
          <img src="@/assets/images/class/rl_icon.png" class="dialog_box_con_icon2" alt="">
          <div class="dialog_box_con_title">起始时间 <span class="required-star">*</span></div>
          <div class="dialog_box_con_sx"></div>
          <div class="dialog_box_con_date">
            <el-date-picker
              v-model="newClassStartDate"
              type="date"
              placeholder="请选择"
              style="width:100%"
              @change="onStartDateChange"
            />
          </div>
        </div>
        <div class="dialog_box_con">
          <img src="@/assets/images/class/rl_icon.png" class="dialog_box_con_icon2" alt="">
          <div class="dialog_box_con_title">结束时间 <span class="required-star">*</span></div>
          <div class="dialog_box_con_sx"></div>
          <div class="dialog_box_con_date">
            <el-date-picker
              v-model="newClassEndDate"
              type="date"
              :disabled-date="disabledEndDate"
              placeholder="请选择"
              style="width:100%"
            />
          </div>
        </div>
      </div>
    </DialogCustome>

    <StudentDetail :visible="showStudentDetail" :studentId="currentStudentId" :classId="selectedClassId" @close="showStudentDetail = false" />


    <!-- 视频播放弹窗 -->
    <VideoPlayer
      :visible="showVideoDialog"
      :source="currentVideoUrl"
      :title="currentResourceTitle"
      :allow-download="playerAllowDownload"
      @close="closeVideoDialog"
    />

    <!-- 历史课堂回放弹窗 -->
    <history-video-player
      :visible="playerVisible"
      :main-source="playerSource"
      :teacher-source="playerTeacherSource"
      :title="playerTitle"
      :history-lesson-id="playerHistoryLessonId"
      :allow-download="playerAllowDownload"
      @close="playerVisible = false"
    />

    <!-- 音频播放弹窗 -->
    <el-dialog
      :title="currentResourceTitle"
      :visible.sync="showAudioDialog"
      width="480px"
      :append-to-body="true"
      @close="closeAudioDialog"
    >
      <audio
        v-if="showAudioDialog"
        :src="currentAudioUrl"
        controls
        autoplay
        style="width:100%;margin:16px 0;display:block;"
      ></audio>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog
      :title="currentResourceTitle"
      :visible.sync="showImageDialog"
      width="800px"
      :append-to-body="true"
      @close="closeImageDialog"
    >
      <img
        v-if="showImageDialog"
        :src="currentImageUrl"
        style="width:100%;max-height:600px;object-fit:contain;display:block;"
        alt=""
      />
    </el-dialog>



  <!-- 设置别名弹窗 -->
    <DialogCustome width="616px" height="318px" :visible="aliasDialogVisible" title="设置别名"  @cancel="onDialogCancelAlias" @confirm="onDialogConfirmAlias">
      <div class="dialog_box2">
        <div class="dialog_box_con">
          
          <div class="dialog_box_con_input">
            <el-input v-model="aliasInput" style="width:100%" placeholder="班级别名仅自己可见" maxlength="20" show-word-limit></el-input>
          </div>
       
        </div>
        <div class="dialog_box_con_alias_tip">
          班级名称：{{ currentClass && currentClass.name }} <span class="dialog_box_con_alias_tip_btn" @click="aliasInput = currentClass && currentClass.name">填入</span>
        </div>
          
      </div>
    </DialogCustome>

    <!-- 修改班级名称弹窗 -->
    <DialogCustome
      width="616px"
      height="366px"
      :showClose="true"
      :visible="editNameDialogVisible"
      confirmText="确定"
      cancelText="取消"
      :confirmLoading="editNameLoading"
      title="修改班级名称"
      @cancel="editNameDialogVisible = false"
      @confirm="onDialogConfirmEditName"
      @close="editNameDialogVisible = false"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con2">
          <el-input style="width:100%" placeholder="请输入班级名称" v-model="editClassName"></el-input>
        </div>
        <div class="dialog_box_con2">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入班级描述"
            maxlength="25"
            show-word-limit
            v-model="editClassDesc">
          </el-input>
        </div>
      </div>
    </DialogCustome>

    <!-- 修改有效期弹窗 -->
    <DialogCustome
      width="616px"
      height="366px"
      :showClose="true"
      :visible="editDateDialogVisible"
      confirmText="确定"
      cancelText="取消"
      :confirmLoading="editDateLoading"
      title="修改有效期"
      @cancel="editDateDialogVisible = false"
      @confirm="onDialogConfirmEditDate"
      @close="editDateDialogVisible = false"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con">
          <img src="@/assets/images/class/rl_icon.png" class="dialog_box_con_icon2" alt="">
          <div class="dialog_box_con_title">起始时间 <span class="required-star">*</span></div>
          <div class="dialog_box_con_sx"></div>
          <div class="dialog_box_con_date">
            <el-date-picker
              v-model="editClassStartDate"
              type="date"
              placeholder="请选择"
              style="width:100%"
              :disabled="true"
            />
          </div>
        </div>
        <div class="dialog_box_con">
          <img src="@/assets/images/class/rl_icon.png" class="dialog_box_con_icon2" alt="">
          <div class="dialog_box_con_title">结束时间 <span class="required-star">*</span></div>
          <div class="dialog_box_con_sx"></div>
          <div class="dialog_box_con_date">
            <el-date-picker
              v-model="editClassEndDate"
              type="date"
              :disabled-date="disabledEditEndDate"
              placeholder="请选择"
              style="width:100%"
            />
          </div>
        </div>
      </div>
    </DialogCustome>

    <!-- 删除班级确认弹窗 -->
    <DialogCustome
      width="616px"
      height="240px"
      :showClose="true"
      :visible="deleteClassDialogVisible"
      confirmText="确定删除"
      cancelText="取消"
      :confirmLoading="deleteClassLoading"
      title="删除班级"
      @cancel="deleteClassDialogVisible = false"
      @confirm="onDialogConfirmDeleteClass"
      @close="deleteClassDialogVisible = false"
    >
      <div class="dialog_box2">
        <div style="text-align:center;padding:16px 0;color:#333;font-size:15px;">
          确定要删除班级「{{ currentClass && (currentClass.alias || currentClass.name) }}」吗？<br>
          <span style="color:#f56c6c;font-size:13px;">删除后数据不可恢复，请谨慎操作。</span>
        </div>
      </div>
    </DialogCustome>

    <!-- 文件预览 -->
    <FilePreview :visible="filePreviewVisible" :file="filePreviewData" @close="filePreviewVisible = false" />

    <!-- 直播间 -->
    <div v-if="showLiveIframe" class="live-iframe-overlay">
      <LiveClassroomFrame :src="liveUrl" @exit="showLiveIframe = false" />
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
  </div>

  
</template>

<script>
import { getClassList, getClassDetail, getClassStudents, getClassCourses, searchStudents, toggleClassTop, setClassAlias, createClass, updateClass, deleteClass, getCourseDetail, resetStudentPassword, removeClassStudent, getAfterQuizTeacherList, getSubjectOptions, getAfterQuizOptions, getTeacherOptions } from '@/api'
import FilePreview from '@/components/FilePreview/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import AfterClassTestDetail from './AfterClassTestDetail.vue'
import { getToken, getUserInfo } from '@/utils/auth'

export default { 
  name: 'Class',
  components: { FilePreview, VideoPlayer, AfterClassTestDetail },
  data() {
    return {
      activeLoadingKey: null,
      liveUrl: '',
      showLiveIframe: false,
      year: '',
      liveStatus: '未过期',
      isOpenSearch: false,
      showStudentDetail: false,
      currentStudentId: null,
      searchType: 'class',
      rightTab: 'student',
      selectedClassIndex: 0,
      selectedClassId: null,
      classList: [],
      studentList: [],
      courseList: [],
      classListLoading: false,
      studentListLoading: false,
      courseListLoading: false,
      searchClassList: [],
      searchStudentList: [],
      leftSearchText: '',
      rightStudentSearch: '',
      rightCourseSearch: '',
      sortType: 'name_asc',
      aliasDialogVisible: false,
      aliasInput: '',
      showResetPasswordDialog: false,
      resetPasswordValue: '',
      resetPasswordStudentUserName: '',
      resetPasswordLoading: false,
      showAddClassDialog: false,
      addClassStep: 1,
      newClassName: '',
      newClassDesc: '',
      newClassStartDate: new Date(),
      newClassEndDate: (() => {
        const d = new Date()
        d.setFullYear(d.getFullYear() + 1)
        return d
      })(),
      createClassLoading: false,
      rightView: 'default',
      selectedCourse: null,
      courseDetailLoading: false,
      // 课后测试
      showAfterTestDetail: false,
      currentAfterTestCourse: null,
      afterTestList: [],
      afterTestLoading: false,
      // 课后测筛选条件
      afterTestFilter: {
        subjectId: '',
        quizStartTime: '',
        quizEndTime: '',
        examConfigId: '',
        teacherId: '',
      },
      afterTestTimeRange: [],
      subjectOptions: [],
      afterQuizOptions: [],
      teacherOptions: [],
      afterTestFilterLoading: false,
      afterTestDatePickerOptions: {
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
      courseDetail: {
        taskCount: 0,
        items: []
      },
      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      playerHistoryLessonId: '',
      playerAllowDownload: '2',
      showVideoDialog: false,
      currentVideoUrl: '',
      showAudioDialog: false,
      currentAudioUrl: '',
      showImageDialog: false,
      currentImageUrl: '',
      currentResourceTitle: '',
      filePreviewVisible: false,
      filePreviewData: null,
      editNameDialogVisible: false,
      editNameLoading: false,
      editClassName: '',
      editClassDesc: '',
      editDateDialogVisible: false,
      editDateLoading: false,
      editClassStartDate: null,
      editClassEndDate: null,
      deleteClassDialogVisible: false,
      deleteClassLoading: false,

       // macOS 屏幕录制权限引导弹窗
      showScreenPermissionDialog: false,
      screenPermissionStatus: '',   // 'not-determined' | 'denied' | 'restricted'
      _removeScreenPermissionDenied: null,
      // macOS 屏幕采集失败弹窗（权限已授权但系统无法获取屏幕源）
      showScreenCaptureFailedDialog: false,
      _removeScreenCaptureFailed: null,
    }
  },
  watch: {
    '$store.state.user.token'(newVal, oldVal) {
      if (newVal && newVal !== oldVal) {
        this._sessionToken = newVal
        this.classList = []
        this.studentList = []
        this.courseList = []
        this.selectedClassId = null
        this.selectedClassIndex = 0
        this.searchClassList = []
        this.searchStudentList = []
        this.fetchClassList()
      }
    },
    liveStatus() {
      // 用户主动切换过滤状态时，清空已选班级，避免自动切换逻辑将状态回跳
      this.selectedClassId = null
      this.fetchClassList()
    },
    rightTab(val) {
      if (val === 'student') this.fetchStudentList(this.rightStudentSearch)
      else if (val === 'course') this.fetchCourseList()
      else if (val === 'afterTest') { this.fetchAfterTestFilterOptions(); this.fetchAfterTestList() }
    },
    rightStudentSearch(val) {
      clearTimeout(this._studentSearchTimer)
      this._studentSearchTimer = setTimeout(() => {
        this.fetchStudentList(val)
      }, 300)
    },
    rightCourseSearch(val) {
      clearTimeout(this._courseSearchTimer)
      this._courseSearchTimer = setTimeout(() => {
        this.fetchCourseList(val)
      }, 300)
    },
    leftSearchText(val) {
      clearTimeout(this._leftSearchTimer)
      this._leftSearchTimer = setTimeout(() => {
        if (!this.isOpenSearch) return
        if (this.searchType === 'class') {
          if (val) {
            this.fetchClassSearch(val)
          } else {
            this.searchClassList = []
          }
        } else {
          if (val) {
            this.fetchStudentSearch(val)
          } else {
            this.searchStudentList = []
          }
        }
      }, 300)
    },
    searchType(val) {
      if (!this.leftSearchText) {
        this.searchClassList = []
        this.searchStudentList = []
        return
      }
      if (val === 'class') {
        this.searchStudentList = []
        this.fetchClassSearch(this.leftSearchText)
      } else {
        this.searchClassList = []
        this.fetchStudentSearch(this.leftSearchText)
      }
    }
  },
  computed: {
    currentClass() {
      return this.classList[this.selectedClassIndex] || null
    },
    searchList() {
      if (!this.leftSearchText) return []
      if (this.searchType === 'class') {
        return this.searchClassList
      }
      return this.searchStudentList
    },
    filteredStudentList() {
      return this.studentList
    },
    filteredCourseList() {
      return this.courseList
    },
    sortLabel() {
      const map = {
        name_asc: '默认排序',
        name_desc: '班级名称 Z-A',
        time_asc: '创建时间升序',
        time_desc: '创建时间降序'
      }
      return map[this.sortType] || '默认排序'
    }
  },
  mounted() {
    this._sessionToken = this.$store.state.user.token
    this.fetchClassList()

    // 监听 iframe 直播退出消息
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'CLASSROOM_EXIT') {
        const { classId } = event.data;
        this.showLiveIframe =false;
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
  activated() {
    const currentToken = this.$store.state.user.token
    
    if (currentToken !== this._sessionToken) {
      this._sessionToken = currentToken
      this.fetchClassList()
    }
  },
  methods: {
    openAfterTestDetail(item) {
      this.currentAfterTestCourse = { ...item, classId: this.selectedClassId }
      this.showAfterTestDetail = true
    },
    async fetchAfterTestList() {
      if (!this.selectedClassId) return
      const { userId } = getUserInfo()
      this.afterTestLoading = true
      try {
        const params = { classId: this.selectedClassId, teacherId: userId }
        if (this.afterTestFilter.subjectId) params.subjectId = this.afterTestFilter.subjectId
        if (this.afterTestFilter.quizStartTime) params.quizStartTime = this.afterTestFilter.quizStartTime
        if (this.afterTestFilter.quizEndTime) params.quizEndTime = this.afterTestFilter.quizEndTime
        if (this.afterTestFilter.examConfigId) params.examConfigId = this.afterTestFilter.examConfigId
        if (this.afterTestFilter.teacherId) params.teacherId = this.afterTestFilter.teacherId
        const res = await getAfterQuizTeacherList(params)
        this.afterTestList = (res && res.data) ? res.data : []
      } catch (e) {
        console.log(e,'呼呼')
        this.afterTestList = []
      } finally {
        this.afterTestLoading = false
      }
    },
    async fetchAfterTestFilterOptions() {
      if (!this.selectedClassId) return
      try {
        const [subjectRes, quizRes, teacherRes] = await Promise.all([
          getSubjectOptions(),
          getAfterQuizOptions({ classId: this.selectedClassId }),
          getTeacherOptions({ classId: this.selectedClassId })
        ])
        this.subjectOptions = (subjectRes && subjectRes.data) ? subjectRes.data : []
        this.afterQuizOptions = (quizRes && quizRes.data) ? quizRes.data : []
        this.teacherOptions = (teacherRes && teacherRes.data) ? teacherRes.data : []
      } catch (e) {
        console.log(e, 'fetchAfterTestFilterOptions error')
      }
    },
    handleAfterTestSearch() {
      if (this.afterTestTimeRange && this.afterTestTimeRange.length === 2) {
        this.afterTestFilter.quizStartTime = this.afterTestTimeRange[0]
        this.afterTestFilter.quizEndTime = this.afterTestTimeRange[1]
      } else {
        this.afterTestFilter.quizStartTime = ''
        this.afterTestFilter.quizEndTime = ''
      }
      this.fetchAfterTestList()
    },
    clearAfterTestTimeRange() {
      this.afterTestTimeRange = []
      this.handleAfterTestSearch()
    },
    clearAfterTestField(field) {
      this.afterTestFilter[field] = ''
      this.handleAfterTestSearch()
    },
    handleAfterTestReset() {
      this.afterTestFilter = { subjectId: '', quizStartTime: '', quizEndTime: '', examConfigId: '', teacherId: '' }
      this.afterTestTimeRange = []
      this.fetchAfterTestList()
    },
    _mapClassItem(item) {
      const sourceMap = { '1': '后台创建', '0': '老师创建' }
      return {
        classId: item.classId,
        name: item.className || '',
        alias: item.classAlias || '',
        count: item.studentCount || 0,
        courseCount: item.courseCount || item.totalCourses || item.lessonCount || 0,
        pinned: item.isTop === 1,
        remainDays: item.remainDay || 0,
        startDate: item.beginTime || '',
        endDate: item.endTime || '',
        source: sourceMap[item.classMode] || '老师创建',
        status: item.status || '',
        courseCnt: item.courseCnt || '',
      }
    },
    async fetchClassList() {
      const sortMap = {
        'name_asc': 'classNameAsc',
        'name_desc': 'classNameDesc',
        'time_asc': 'createTimeAsc',
        'time_desc': 'createTimeDesc'
      }
      const params = {}
      if (this.liveStatus) params.status = this.liveStatus
      if (this.sortType) params.sortBy = sortMap[this.sortType] || this.sortType
      this.classListLoading = true
      try {
        const res = await getClassList(params)
        let list = (res.data || res.rows || []).map(item => this._mapClassItem(item))

        // 当前过滤条件下找不到目标班级，自动切换到另一个状态重新查询
        if (this.selectedClassId && this.liveStatus && list.findIndex(c => c.classId === this.selectedClassId) === -1) {
          const oppositeStatus = this.liveStatus === '未过期' ? '已过期' : '未过期'
          const resOther = await getClassList({ status: oppositeStatus, sortBy: params.sortBy })
          const otherList = (resOther.data || resOther.rows || []).map(item => this._mapClassItem(item))
          const idxInOther = otherList.findIndex(c => c.classId === this.selectedClassId)
          if (idxInOther !== -1) {
            this.liveStatus = oppositeStatus
            list = otherList
          }
        }

        this.classList = list
        if (this.selectedClassId) {
          const idx = list.findIndex(c => c.classId === this.selectedClassId)
          this.selectedClassIndex = idx !== -1 ? idx : 0
          if (idx === -1 && list.length > 0) this.selectedClassId = list[0].classId
        } else {
          this.selectedClassIndex = 0
          if (list.length > 0) this.selectedClassId = list[0].classId
        }
        if (this.selectedClassId) {
          this.fetchClassDetail(this.selectedClassId)
          this.fetchStudentList(this.rightStudentSearch)
        }
        this.$nextTick(() => { this.scrollToSelectedClass() })
      } catch (e) {
        console.error(e)
      } finally {
        this.classListLoading = false
      }
    },
    scrollToSelectedClass() {
      const container = this.$refs.leftClassList
      if (!container) return
      const items = container.querySelectorAll('.app_container_box_left_list_detail')
      const target = items[this.selectedClassIndex]
      if (!target) return
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.clientHeight
      const itemTop = target.offsetTop
      const itemBottom = itemTop + target.offsetHeight
      if (itemTop < containerTop || itemBottom > containerBottom) {
        container.scrollTo({ top: itemTop - container.clientHeight / 2 + target.offsetHeight / 2, behavior: 'smooth' })
      }
    },
    async fetchClassDetail(classId) {
      try {
        const res = await getClassDetail(classId)
        const detail = res.data || {}
        const idx = this.classList.findIndex(c => c.classId === classId)
        if (idx !== -1) {
          const sourceMap = { '1': '后台创建', '0': '老师创建' }
          this.classList.splice(idx, 1, {
            ...this.classList[idx],
            name: detail.className || this.classList[idx].name,
            alias: detail.classAlias || this.classList[idx].alias,
            count: detail.studentCount || this.classList[idx].count,
            courseCount: detail.courseCount || detail.totalCourses || detail.lessonCount || this.classList[idx].courseCount || 0,
            pinned: detail.isTop === 1,
            remainDays: detail.remainDay || this.classList[idx].remainDays,
            startDate: detail.beginTime || this.classList[idx].startDate,
            endDate: detail.endTime || this.classList[idx].endDate,
            source: sourceMap[detail.classMode] || this.classList[idx].source || '老师创建',
            status: detail.status || this.classList[idx].status,
            describe: detail.describe || '',
            isSelfCreate: detail.isSelfCreate,
            allowRemove: detail.allowRemove,
            isAllowInvite: detail.isAllowInvite,
            courseCnt: detail.courseCnt,
          })
        }
      } catch (e) {
        console.error(e)
      }
    },
    async fetchStudentList(keyword) {
       let isTeacher = getUserInfo().role === 'TEACHER'
      if (!this.selectedClassId || !isTeacher) return
      this.studentListLoading = true
      try {
        const params = {}
        if (keyword) params.keyword = keyword
        const res = await getClassStudents(this.selectedClassId, params)
        this.studentList = (res.data || res.rows || []).map(item => ({
          id: item.studentId,
          name: item.realName || item.userName || '',
          userName: item.userName || '',
          phone: item.phone || '',
          avatar: item.profilePicture || '',
          joinDate: item.joinTime || '',
          joinDesc: item.joinDesc || '',
          remark: item.remark || '',
          accountType: item.accountType
        }))
      } catch (e) {
        console.error(e)
        this.studentList = []
      } finally {
        this.studentListLoading = false
      }
    },
    async fetchCourseList(keyword) {
      if (!this.selectedClassId) return
      this.courseListLoading = true
      try {
        const params = {}
        if (keyword) params.keyword = keyword
        const res = await getClassCourses(this.selectedClassId, params)
        this.courseList = (res.data || res.rows || []).map(item => ({
          id: item.courseId,
          name: item.name || '',
          cover: item.cover || '',
          taskCount: item.totalLessons || 0,
          progress: item.progressPercent || 0
        }))
        const idx = this.classList.findIndex(c => c.classId === this.selectedClassId)
        if (idx !== -1) {
          this.$set(this.classList[idx], 'courseCount', this.courseList.length)
        }
      } catch (e) {
        console.error(e)
        this.courseList = []
      } finally {
        this.courseListLoading = false
      }
    },
    async fetchClassSearch(keyword) {
      try {
        const res = await getClassList({ keyword })
        this.searchClassList = (res.data || res.rows || []).map(item => ({
          classId: item.classId,
          name: item.className || '',
          count: item.studentCount || 0
        }))
      } catch (e) {
        console.error(e)
        this.searchClassList = []
      }
    },
    async fetchStudentSearch(keyword) {
      try {
        const res = await searchStudents({ keyword })
        this.searchStudentList = (res.data || res.rows || []).map(item => ({
          classId: item.classId,
          className: item.className || item.classAlias || '',
          studentName: item.realName || item.userName || '',
          studentId: item.studentId
        }))
      } catch (e) {
        console.error(e)
        this.searchStudentList = []
      }
    },
    openSearch() {
      this.isOpenSearch = true
      this.$nextTick(() => {
        this.$refs.searchInput && this.$refs.searchInput.focus()
      })
    },
    selectClass(index) {
      this.selectedClassIndex = index
      this.selectedClassId = this.classList[index]?.classId || null
      this.rightView = 'default'
      this.rightStudentSearch = ''
      this.rightCourseSearch = ''
      this.studentList = []
      this.courseList = []
      if (this.selectedClassId) {
        this.fetchClassDetail(this.selectedClassId)
        this.fetchCourseList()
      }
      if (this.rightTab === 'student') {
        this.fetchStudentList()
      } else {
        this.rightTab = 'student'
      }
    },
    selectSearchResult(item) {
      const isStudentSearch = this.searchType === 'student'
      const studentKeyword = isStudentSearch
        ? (item.studentName || this.leftSearchText || '')
        : ''

      this.selectedClassId = item.classId
      this.rightCourseSearch = ''
      this.rightView = 'default'
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
      this.searchStudentList = []

      if (isStudentSearch) {
        this.rightStudentSearch = studentKeyword
        this.rightTab = 'student'
      } else {
        this.rightStudentSearch = ''
      }

      this.fetchClassList()
    },
    cancelSearch() {
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
      this.searchStudentList = []
    },
    getClassValidityText(item) {
      if (!item) return ''
      if (item.remainDays < 0) return '已过期'
      if (item.remainDays === 0) return '今天到期'
      if (item.remainDays <= 30) return `剩余${item.remainDays}天`
      return `${this.formatDotDate(item.startDate)}-${this.formatDotDate(item.endDate)}`
    },
    formatDotDate(val) {
      if (!val) return ''
      return String(val).slice(0, 10).replace(/-/g, '.')
    },
    formatAfterTestTime(val) {
      if (!val) return '-'
      return String(val).replace(/-/g, '.').replace('T', ' ').slice(0, 16)
    },
    handleClassCardOptions(command, index) {
      this.selectedClassIndex = index
      this.selectedClassId = this.classList[index]?.classId || null
      this.handleOptionsCommand(command)
    },
    highlightKeyword(text, keyword) {
      if (!keyword || !text) return text
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const reg = new RegExp(`(${escaped})`, 'gi')
      return text.replace(reg, '<span style="color:#0049FF;">$1</span>')
    },
    async handleOptionsCommand(command) {
      if (command === 'pin') {
        const cls = this.classList[this.selectedClassIndex]
        try {
          await toggleClassTop(cls.classId)
          this.$message.success(cls.pinned ? '已取消置顶' : '已置顶')
          await this.fetchClassList()
        } catch (e) {
          // 接口失败时不更新本地状态，错误由拦截器统一提示
        }
      } else if (command === 'alias') {
        this.aliasInput = this.classList[this.selectedClassIndex].alias || ''
        this.aliasDialogVisible = true
      } else if (command === 'editName') {
        const cls = this.classList[this.selectedClassIndex]
        this.editClassName = cls.name || ''
        this.editClassDesc = cls.describe || ''
        this.editNameDialogVisible = true
      } else if (command === 'editDate') {
        const cls = this.classList[this.selectedClassIndex]
        this.editClassStartDate = cls.startDate ? new Date(cls.startDate) : null
        this.editClassEndDate = cls.endDate ? new Date(cls.endDate) : null
        this.editDateDialogVisible = true
      } else if (command === 'delete') {
        this.deleteClassDialogVisible = true
      }
    },
    onDialogCancelAlias() {
      this.aliasDialogVisible = false
      this.aliasInput = ''
    },
    async onDialogConfirmAlias() {
      const cls = this.classList[this.selectedClassIndex]
      const alias = this.aliasInput.trim()
      try {
        await setClassAlias(cls.classId, alias)
        cls.alias = alias
        this.aliasDialogVisible = false
        this.$message.success(alias ? '别名设置成功' : '别名已清除')
        this.aliasInput = ''
      } catch (e) {
        // 接口失败时保持弹窗打开，错误由拦截器统一提示
      }
    },
    async onDialogConfirmEditName() {
      const cls = this.classList[this.selectedClassIndex]
      if (!this.editClassName.trim()) {
        this.$message.warning('请输入班级名称')
        return
      }
      this.editNameLoading = true
      try {
        await updateClass(cls.classId, {
          className: this.editClassName.trim(),
          describe: this.editClassDesc
        })
        this.$message.success('班级名称修改成功')
        this.editNameDialogVisible = false
        await this.fetchClassList()
      } catch (e) {
        // 错误由请求拦截器统一提示
      } finally {
        this.editNameLoading = false
      }
    },
    async onDialogConfirmEditDate() {
      if (!this.editClassEndDate) {
        this.$message.warning('请选择结束时间')
        return
      }
      if (this.editClassStartDate && this.editClassEndDate < this.editClassStartDate) {
        this.$message.warning('结束时间必须大于等于起始时间')
        return
      }
      const cls = this.classList[this.selectedClassIndex]
      const fmt = d => {
        if (!d) return ''
        const date = d instanceof Date ? d : new Date(d)
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      }
      this.editDateLoading = true
      try {
        await updateClass(cls.classId, {
          beginTime: fmt(this.editClassStartDate),
          endTime: fmt(this.editClassEndDate)
        })
        this.$message.success('有效期修改成功')
        this.editDateDialogVisible = false
        await this.fetchClassList()
      } catch (e) {
        // 错误由请求拦截器统一提示
      } finally {
        this.editDateLoading = false
      }
    },
    disabledEditEndDate(date) {
      if (!this.editClassStartDate) return false
      const start = new Date(this.editClassStartDate)
      start.setHours(0, 0, 0, 0)
      return date.getTime() < start.getTime()
    },
    async onDialogConfirmDeleteClass() {
      const cls = this.classList[this.selectedClassIndex]
      this.deleteClassLoading = true
      try {
        await deleteClass(cls.classId)
        this.$message.success('班级删除成功')
        this.deleteClassDialogVisible = false
        this.selectedClassId = null
        await this.fetchClassList()
      } catch (e) {
        // 错误由请求拦截器统一提示
      } finally {
        this.deleteClassLoading = false
      }
    },
  async  handleStudentOptionsCommand(command, student) {
      if (command === 'resetPassword') {
        this.currentStudentId = student.id
        this.resetPasswordStudentUserName = student.userName || ''
        this.showResetPasswordDialog = true
      } else if (command === 'studentDetail') {
        this.currentStudentId = student.id
        this.showStudentDetail = true
      } else if (command === 'removeStudent') {
        const studentName = student.name || student.userName || ''
        try {
          await this.$confirm(`确认将学生 ${studentName} 从班级中移除吗？`, '移除学生', {
            confirmButtonText: '确认移除',
            cancelButtonText: '取消',
            type: 'warning'
          })
          await removeClassStudent(this.selectedClassId, student.id)
          this.$message.success('移除成功')
          this.fetchStudentList()
          this.fetchClassList()
        } catch (e) {
          // 取消或接口错误，不做处理
        }
      }
    },
    handleContentOptionsCommand(command, item) {
      if (command === 'learningProgress') {
        this.$router.push({
          path: '/learningProgress',
          query: {
            classId: this.selectedClassId,
            courseId: this.selectedCourse ? this.selectedCourse.id : '',
            lessonId: item.id
          }
        })
      }
    },
    handleCourseOptionsCommand(command, item) {
      if (command === 'learningProgress') {
        this.$router.push({
          path: '/learningProgress',
          query: {
            type: 'course',
            classId: this.selectedClassId,
            courseId: item.id
          }
        })
      }
    },
    handleStudentDetail(student) {
      this.currentStudentId = student.id
      this.showStudentDetail = true
    },
    handleSortCommand(command) {
      this.sortType = command
      this.fetchClassList()
    },
    handleToAnnouncement() {
      this.$router.push({ path: '/announcement', query: { classId: this.selectedClassId } })
    },
    onDialogCancel() {
      this.showResetPasswordDialog = false
      this.resetPasswordValue = ''
      this.resetPasswordStudentUserName = ''
    },
    generatePassword() {
      const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const lower = 'abcdefghijklmnopqrstuvwxyz'
      const digits = '0123456789'
      const all = upper + lower + digits
      let pwd = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)],
      ]
      for (let i = 3; i < 8; i++) {
        pwd.push(all[Math.floor(Math.random() * all.length)])
      }
      pwd = pwd.sort(() => Math.random() - 0.5)
      this.resetPasswordValue = pwd.join('')
    },
    async onDialogConfirm() {
      if (!this.resetPasswordValue) {
        this.$message.warning('请先输入或自动生成密码')
        return
      }
      this.resetPasswordLoading = true
      try {
        await resetStudentPassword({
          classId: this.selectedClassId,
          studentId: this.currentStudentId,
          password: this.resetPasswordValue,
        })
        const pwd = this.resetPasswordValue
        const userName = this.resetPasswordStudentUserName
        const text = `你的用户名是${userName} 密码是${pwd} 请妥善保管，为了你的账号安全，请及时修改密码`
        try {
          await navigator.clipboard.writeText(text)
          this.$message.success('密码重置成功，已复制到剪贴板')
        } catch {
          const ta = document.createElement('textarea')
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          this.$message.success('密码重置成功，已复制到剪贴板')
        }
        this.showResetPasswordDialog = false
        this.resetPasswordValue = ''
        this.resetPasswordStudentUserName = ''
      } finally {
        this.resetPasswordLoading = false
      }
    },
    handleAddClass() {
      this.showAddClassDialog = true
    },
    onDialogCancelAdd() {
      if (this.addClassStep === 2) {
        this.addClassStep = 1
      } else {
        this._resetAddClassDialog()
      }
    },
    async onDialogConfirmAdd() {
      if (this.addClassStep === 1) {
        if (!this.newClassName.trim()) {
          this.$message.warning('请输入班级名称')
          return
        }
        this.addClassStep = 2
      } else {
        if (!this.newClassStartDate) {
          this.$message.warning('请选择起始时间')
          return
        }
        if (!this.newClassEndDate) {
          this.$message.warning('请选择结束时间')
          return
        }
        if (this.newClassEndDate < this.newClassStartDate) {
          this.$message.warning('结束时间必须大于起始时间')
          return
        }
        const fmt = d => {
          if (!d) return ''
          const date = d instanceof Date ? d : new Date(d)
          return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
        }
        this.createClassLoading = true
        try {
          await createClass({
            className: this.newClassName.trim(),
            beginTime: fmt(this.newClassStartDate),
            endTime: fmt(this.newClassEndDate),
            describe: this.newClassDesc
          })
          this.$message.success('班级创建成功')
          this._resetAddClassDialog()
          await this.fetchClassList()
        } catch (e) {
          // 错误由请求拦截器统一提示
        } finally {
          this.createClassLoading = false
        }
      }
    },
    onStartDateChange(val) {
      if (val) {
        const end = new Date(val)
        end.setFullYear(end.getFullYear() + 1)
        this.newClassEndDate = end
      }
    },
    disabledEndDate(date) {
      if (!this.newClassStartDate) return false
      const start = new Date(this.newClassStartDate)
      start.setHours(0, 0, 0, 0)
      return date.getTime() <= start.getTime()
    },
    onDialogCloseAdd() {
      this._resetAddClassDialog()
    },
    _resetAddClassDialog() {
      this.showAddClassDialog = false
      this.addClassStep = 1
      this.newClassName = ''
      this.newClassDesc = ''
      this.newClassStartDate = new Date()
      const end = new Date()
      end.setFullYear(end.getFullYear() + 1)
      this.newClassEndDate = end
    },
    async handleCardClickWithLoading(key, handler) {
      this.activeLoadingKey = key
      try {
        await Promise.resolve(handler())
      } finally {
        this.activeLoadingKey = null
      }
    },
    handleResourceClick(item) {
      const url = item.filePath
      if (!url) {
        this.$message.warning('资源地址不存在')
        return
      }
     const videoTypes = ['4']
      const historyVideoTypes = ['3']
      const imageTypes = ['5']
      const audioTypes = ['6']
      if (videoTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '视频播放'
        this.playerAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
        console.log(url,'视频地址')
        this.currentVideoUrl = url
        this.showVideoDialog = true
      } else if (historyVideoTypes.includes(item.nodeType)) {
        this.openVideoPlayer(item, false, true)
      } else if (imageTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '图片预览'
        this.currentImageUrl = url
        this.showImageDialog = true
      } else if (audioTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '音频播放'
        this.currentAudioUrl = url
        this.showAudioDialog = true
      } else {
        console.log(item,'信息')
        this.filePreviewData = { name: item.title || '', path: url }
        this.filePreviewVisible = true
      }
    },
    closeVideoDialog() {
      this.showVideoDialog = false
      this.currentVideoUrl = ''
    },
    closeAudioDialog() {
      this.showAudioDialog = false
      this.currentAudioUrl = ''
    },
    closeImageDialog() {
      this.showImageDialog = false
      this.currentImageUrl = ''
    },
    handleCourseClick(item) {
      this.selectedCourse = item
      this.rightView = 'courseDetail'
      this.fetchCourseDetail(item.id)
    },
    _mapDetailNode(node) {
      if (node.type === '1') {
        return {
          id: node.id || node.lessonId || '',
          type: 'group',
          nodeType: node.type,
          title: node.name || '',
          percent: node.percent || '0',
          expanded: false,
          children: (node.children || []).map(child => this._mapDetailNode(child))
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
          id: node.id || node.lessonId || '',
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
          fileList: live.fileList || '',
          date,
          timeStart,
          timeEnd: '',
          progress: Math.round(parseFloat(node.percent)) || 0,
          isRecent: live.isRecentStudy === '1',
           historyLessonId:live.historyLessonId || ''
        }
      } else {
        // 3=历史课程 4=视频 5=图片 6=音频 7=资料
        const res = node.resource || node.historyLesson || {}
        const sizeStr = res.size ? `${res.size}` : ''
        return {
          id: node.id || node.lessonId || '',
          type: 'resource',
          nodeType: node.type,
          title: node.name || res.name || res.fileName || '',
          size: sizeStr,
          date: '',
          isRecent: res.isRecentStudy === '1',
          progress: Math.round(parseFloat(node.percent)) || 0,
          resourceUrl: res.resourceUrl || res.url || '',
          filePath: res.fileList && res.fileList.lenght!=0?res.fileList[0].filePath:res.filePath,
          historyLessonId:node.type=='3'?res.historyLessonId:"",
          taskUuid:node.type=='3'?res.taskUuid:"",
          fileList: res.fileList || [],
          duration:node.type=='3'?(res.fileList ? res.fileList[0].duration : 0):(node.type=='4'?node.resource.duration:0),
        }
      }
    },
    async fetchCourseDetail(courseId) {
      if (!courseId) return
      this.courseDetailLoading = true
      try {
        const params = { courseId }
        if (this.selectedClassId) params.classId = this.selectedClassId
        const res = await getCourseDetail(params)
        const data = res.data || {}
        this.courseDetail = {
          taskCount: data.totalLessons || 0,
          items: (data.detailTree || []).map(node => this._mapDetailNode(node))
        }
      } catch (e) {
        console.error(e)
        this.courseDetail = { taskCount: 0, items: [] }
      } finally {
        this.courseDetailLoading = false
      }
    },
    toggleGroup(item) {
      this.$set(item, 'expanded', !item.expanded)
    },
    openVideoPlayer(item) {
      const fileList = item.fileList || []
      const mainFile = fileList.find(f => f.videoType == '1')
      const teacherFile = fileList.find(f => f.videoType == '2')
      this.playerSource = mainFile ? mainFile.filePath || '' : ''
      this.playerTeacherSource = teacherFile ? teacherFile.filePath || '' : ''
      this.playerTitle = item.name || item.title || '视频回放'
      this.playerHistoryLessonId = String(item.historyLessonId || '')
      this.playerAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
      this.playerVisible = true
    },
    async enterLiveRoom(item) {
      console.log(item)
      if (item.isFinish == 1 && item.liveStatus !== '未开播') {
        this.openVideoPlayer(item)
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
      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const liveId = item.liveId
      const roleNumber = role === 'STUDENT' ? 0 : 1
      let liveBaseUrl = 'https://live.fjlsjy123.com/auikits/'
      if (process.env.NODE_ENV === 'development') {
        liveBaseUrl = 'http://localhost:8000'
      }
      this.liveUrl = `${liveBaseUrl}?role=${roleNumber}&liverole=${roleNumber}&userid=${userId}&username=${realName}&liveid=${liveId}&classroomId=${item.liveLessonId || ''}&_t=${Date.now()}&token=${token}`
      console.log(this.liveUrl,'直播地址')
      this.showLiveIframe = true
    }
  }
}
</script>

<style lang="scss" scoped>
.page-placeholder{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F7FBFF;
  padding: 16px 20px 20px;
  box-sizing: border-box;
  overflow: hidden;
}
.page-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}
.page-header-left{
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-header-title{
  font-weight: bold;
  font-size: 20px;
  color: #020618;
}
.page-header-count{
  font-weight: 400;
  font-size: 14px;
  color: #90A1B9;
}
.page-header-right{
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-header-create{
  width: 112px;
height: 40px;
background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
border-radius: 10px 10px 10px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
  box-sizing: border-box;
}
.page-header-create-icon{
  width: 16px;
  height: 16px;
}
.page-header-notice{
  width: 40px;
  height: 40px;
  cursor: pointer;
  object-fit: contain;
  display: block;
}
.page-body{
  flex: 1;
  height: 0;
  display: flex;
  gap: 0;
  overflow: hidden;
  background: #FFFFFF;
  border-radius: 12px;
}

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
  gap: 6px;
  font-size: 14px;
  color: #333;
}
.app_container_box_left{
  width: 320px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: stretch;
  background: #FFFFFF;
  border-radius: 12px 0 0 12px;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  border-right: 1px solid #F0F0F0;
}
.app_container_box_left_search_box{
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
.app_container_box_left_search_box_entry{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 36px;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  gap: 8px;
  padding: 0 12px;
  box-sizing: border-box;
  cursor: pointer;
}
.app_container_box_left_search_box_top_icon{
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.app_container_box_left_search_box_top_text{
  font-weight: 400;
  font-size: 14px;
  color: #90A1B9;
}
.app_container_box_left_search_box_top_input{
  flex: 1;
  width: 0;
}
.app_container_box_left_search_box_top_input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
  height: 100%;
}
.app_container_box_left_search_box_top_input :deep(.el-input__inner) {
  color: #333333;
  font-size: 14px;
  padding-left: 0!important;
}
.app_container_box_left_search_box_top_input :deep(.el-input__suffix) {
  color: #999999;
}
.app_container_box_left_search_box_topBox{
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}
.app_container_box_left_search_box_topBox_search{
  flex: 1;
  width: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 36px;
  background: #FFFFFF;
  border-radius: 28px 28px 28px 28px;
  border: 1px solid #0049FF;
  gap: 8px;
  padding: 0 14px;
  box-sizing: border-box;
  cursor: pointer;
}
.app_container_box_left_search_box_topBox_cancel{
  font-weight: 400;
  font-size: 14px;
  color: #0049FF;
  cursor: pointer;
  flex-shrink: 0;
}
.app_container_box_left_search_box_choose{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 32px;
  margin-top: 16px;
}
.app_container_box_left_search_box_choose_detail{
  width: 73px;
  height: 36px;
  font-weight: 400;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666666;
  background: transparent;
  border-radius: 18px 18px 18px 18px;
  cursor: pointer;
}
.app_container_box_left_search_box_choose_detail_active{
  font-weight: 400;
  font-size: 14px;
  color: #333333;
  background: #D9D9D9;
  border-radius: 18px 18px 18px 18px;
}
.app_container_box_left_search_box_center{
  width: 100%;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.left-filter-dropdown{
  flex: 1;
  width: 0;
}
.left-filter-btn{
  width: 100%;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E8E8E8;
  background: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 13px;
  color: #333333;
}
.left-filter-arrow{
  font-size: 12px;
  color: #999999;
}
.left-filter-select{
  flex: 1;
  width: 0;
  height: 36px;
  :deep(.el-input__inner) {
    height: 36px;
    line-height: 36px;
    border-radius: 8px;
    border: 1px solid #E8E8E8!important;
    font-size: 13px;
  }
  :deep(.el-input__suffix) {
    display: flex;
    align-items: center;
  }
}
.sort-active {
  color: #0049FF !important;
  font-weight: 600;
}
.app_container_box_left_list{
  margin-top: 16px;
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.app_container_box_left_list_search{
  gap: 0;
}
.app_container_box_left_list_detail{
  width: 100%;
  min-height: 96px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #DBEAFE;
  padding: 14px 12px 12px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
}
.app_container_box_left_list_detail2{
  width: 100%;
  background: #FFFFFF;
  border-radius: 0;
  border: none;
  padding: 20px 16px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
}
.app_container_box_left_list_detail2:hover{
  background: #F0F3F6!important;
}
.app_container_box_left_list_detail2 .app_container_box_left_list_detail_title{
  font-weight: 400;
  width: 100%;
  flex: none;
  display: block;
  color: #333333;
  font-size: 14px;
}
.app_container_box_left_list_detail2 .app_container_box_left_list_detail_count{
  font-weight: 400;
  font-size: 14px;
  color: #666666;
  margin-top: 9px;
}
.app_container_box_left_list_detail_count2{
  display: flex;
  gap: 32px;
}
.app_container_box_left_list_detail_active{
  background: #EFF6FF!important;
  border-color: #8EC5FF!important;
}
.app_container_box_left_list_detail:hover{
  background: #F7F9FC!important;
}
.class-card-header{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.class-card-options{
  width: 28px;
  height: 28px;
  cursor: pointer;
  flex-shrink: 0;
  // margin-top: 2px;
}
.app_container_box_left_list_detail_title{
  font-weight: bold;
  flex: 1;
  width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 14px;
  color: #020618;
  display: flex;
  align-items: center;
  gap: 4px;
}
.app_container_box_left_list_detail_active .app_container_box_left_list_detail_title{
  color: #020618;
}
.app_container_box_left_list_detail_count{
  font-weight: 400;
  font-size: 12px;
  color: #62748E;
  margin-top: 8px;
  line-height: 18px;
}
.app_container_box_left_list_detail_chooseIcon{
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.class-card-validity{
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 29px;
  height: 29px;
background: #EFF6FF;
padding: 0 10px;
box-sizing:  border-box;
border-radius: 8px 8px 8px 8px;
}
.class-card-validity-label{
  color: #62748E;
  flex-shrink: 0;
}
.class-card-validity-value{
  color: #45556C;
  text-align: right;
  word-break: break-all;
}
.class-card-validity-value.is-urgent{
  color: #FF6900;
  font-weight: 500;
}
.class-card-validity-value.is-expired{
  color: #90A1B9;
}
.app_container_box_right{
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  background: #FFFFFF;
  border-radius: 0 12px 12px 0;
}
.app_container_box_right_empty{
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #FFFFFF;
}
.app_container_box_right_top{
  width: 100%;
  padding: 24px 24px 0;
  box-sizing: border-box;
  background: #FFFFFF;
  flex-shrink: 0;
}
.app_container_box_right_top_top{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.app_container_box_right_top_top_left{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.app_container_box_right_top_top_title{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}
.app_container_box_right_top_top_name{
  font-weight: bold;
  font-size: 20px;
  color: #020618;
  line-height: 28px;
}
.app_container_box_right_top_top_realname{
  font-weight: 400;
  font-size: 12px;
  color: #999999;
  line-height: 1.2;
  word-break: break-all;
}
.app_container_box_right_top_mess{
  margin-top: 8px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
  font-weight: 400;
  font-size: 14px;
  color: #62748E;
  line-height: 20px;
}
.right-top-mess-dot{
  color: #62748E;
}
.app_container_box_right_top_choose{
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 52px;
  margin-top: 20px;
  // border-bottom: 1px solid #F0F0F0;
}
.app_container_box_right_top_choose_detail{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  padding-bottom: 0;
}
.app_container_box_right_top_choose_detail_text{
  font-weight: 500;
  font-size: 14px;
  color: #62748E;
  line-height: 22px;
}
.app_container_box_right_top_choose_detail_hx{
  width: 40px;
  height: 10px;
  object-fit: contain;
  margin-bottom: -1px;
}
.app_container_box_right_top_choose_detail_text_active{
  color: #020618!important;
  font-weight: 600;
}
.app_container_box_right_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  background: #FFFFFF;
  padding: 10px 24px 24px;
  box-sizing: border-box;
}
.app_container_box_right_last_top_search{
  display: flex;
  justify-content:flex-start;
  align-items: center;
  width: 240px;
  height:36px;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  gap: 8px;
  padding: 0 12px;
  box-sizing: border-box;
}
.app_container_box_right_last_top{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 12px;
  box-sizing: border-box;
  background: rgba(239,246,255,0.45);
border-radius: 0px 0px 0px 0px;
border-top: 1px solid #DBEAFE;
border-bottom: 1px solid #DBEAFE;
}
.app_container_box_right_last_top3{
  background: rgba(239,246,255,0.45);
border-radius: 0px 0px 0px 0px;
border-top: 1px solid #DBEAFE;
border-bottom: 1px solid #DBEAFE;
}
.student-tab-top{
  justify-content: flex-start;
}
.app_container_box_right_last_top_num{
  font-weight: bold;
  font-size: 14px;
  color: #45556C;
}
.app_container_box_right_last_list{
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px;
}
.student-list{
  gap: 12px 16px;
}
.student-card{
  width: calc((100% - 16px) / 2);
  min-height: 88px;
  background: rgba(248,250,252,0.4);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  display: flex;
  align-items: center;
  padding: 16px;
  box-sizing: border-box;
  cursor: pointer;
  gap: 16px;
}
.student-card-avatar{
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}
.student-card-avatar-placeholder{
  background-color: #0049FF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}
.student-card-info{
  flex: 1;
  width: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.student-card-name{
  font-weight: 600;
  font-size: 14px;
  color: #020618;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.student-card-account,
.student-card-join{
  font-weight: 400;
  font-size: 12px;
  color: #62748E;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.student-card-actions{
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.student-card-action{
  font-size: 12px;
  line-height: 32px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: bold;
  text-align: center;
}
.student-card-action-reset{
  width: 74px;
height: 32px;
background: #FFFFFF;
box-shadow: 0px 0px 0px 1px #DBEAFE;
border-radius: 10px 10px 10px 10px;
border: 1px solid #D2E5FF;
color: #1F7CFF;
}
.student-card-action-remove{
  width: 74px;
height: 32px;
background: #FFFFFF;
box-shadow: 0px 0px 0px 1px #FFE2E2;
border-radius: 10px 10px 10px 10px;
border: 1px solid #FED5D7;
  color: #FB2C36;
}
.course-list{
  gap: 16px;
}
.app_container_box_right_last_list_detailCourse{
  width: calc((100% - 32px) / 3);
  background: #FFFFFF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  padding: 0 0 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  overflow: hidden;
  gap: 12px;
}
.course-card-cover-wrap{
  position: relative;
  width: 100%;
}
.app_container_box_right_last_list_detailCourse_options{
  position: absolute;
  top: 8px;
  right: 8px;
}
.app_container_box_right_last_list_detailCourse_options_box{
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.app_container_box_right_last_list_detailCourse_options_icon{
  width: 32px;
  height: 32px;
}
.app_container_box_right_last_list_detailCourse_fm{
  width: 100%;
  height: 128.61px;
  display: block;
}
.app_container_box_right_last_list_detailCourse_name{
  font-weight: bold;
  font-size: 14px;
  color: #020618;
  width: 100%;
  padding: 0 12px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app_container_box_right_last_list_detailCourse_task{
  margin-top: 6px;
  padding: 0 12px;
  box-sizing: border-box;
  font-weight: 400;
  font-size: 12px;
  color: #62748E;
}
.app_container_box_right_last_list_detailCourse_jd{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 0 12px;
  box-sizing: border-box;
}
.app_container_box_right_last_list_detailCourse_jd_box{
  flex: 1;
  width: 0;
  background: #EFF6FF;
  height: 6px;
  border-radius: 2px;
  overflow: hidden;
}
.app_container_box_right_last_list_detailCourse_jd_box_now{
  border-radius: 2px;
  height: 6px;
background: linear-gradient( 90deg, #7DD3FF 0%, #77CEFF 7.14%, #70C9FF 14.29%, #6AC4FF 21.43%, #63BFFF 28.57%, #5CBAFF 35.71%, #56B5FF 42.86%, #4FB0FF 50%, #48ABFF 57.14%, #41A6FF 64.29%, #3AA1FF 71.43%, #329BFF 78.57%, #2A96FF 85.71%, #2190FF 92.86%, #168BFF 100%);
}
.app_container_box_right_last_list_detailCourse_jd_box_now.is-complete{
background: linear-gradient( 90deg, #52DCAC 0%, #4EDAA7 10%, #4AD9A3 20%, #45D79E 30%, #41D69A 40%, #3CD495 50%, #37D291 60%, #32D18C 70%, #2CCF87 80%, #25CE83 90%, #1DCC7E 100%);
}
.app_container_box_right_last_list_detailCourse_jd_num{
  width: 34px;
  text-align: right;
  color:#90A1B9;
  font-size: 12px;
}
.search_tips{
  padding: 67px 40px 0 40px;
  box-sizing: border-box;
  text-align: center;
  font-weight: 400;
  font-size: 14px;
  color: #666666;
}

.app_container_box_left_list_detail_title_textCompare{
  color: #0049FF;
}
.dialog_box{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.dialog_box2{
   width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
.dialog_box_con{
  width: 100%;
  height: 63px;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 0 17px 0 29px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog_box_con2{
   width: 100%;
  
  background: #FFFFFF;
  border-radius: 8px;
  padding: 20px 17px 20px 29px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog_box_con_icon{
  width: 13px;
  height: 16.5px;
}
.dialog_box_con_icon2{
  width: 18px;
  height: 18px
}
.dialog_box_con_title{
  font-weight: 400;
font-size: 16px;
color: #999999;
margin-left: 10px;
}
.dialog_box_con_sx{
  margin: 0 16px;
  background: #999999;
  width: 1px;
  height: 29px;
}
.dialog_box_con_btn{
  width: 88px;
height: 36px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #0049FF;
display: flex;
justify-content: center;
align-items: center;
cursor: pointer;
color: #0049FF;
font-size: 16px;
}
.dialog_box_con_input{
  flex: 1;
  width: 0;
}

.dialog_box_con_input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
  height: 100%;
}
.dialog_box_con_input :deep(.el-input__inner) {
  color: #333333;
  font-size: 16px;
  padding-left: 0!important;
}
.dialog_box_con_input :deep(.el-input__suffix) {
  color: #999999;
}
.dialog_box_con_input ::v-deep .el-input__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}




.dialog_box_con2 :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
  height: 100%;
}
.dialog_box_con2 :deep(.el-input__inner) {
  color: #333333;
  font-size: 16px;
  padding: 0!important;
}
.dialog_box_con2 :deep(.el-input__suffix) {
  color: #999999;
}
.dialog_box_con2 ::v-deep .el-input__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}
.dialog_box_con2 :deep(.el-textarea__inner) {
  color: #333333;
  font-size: 16px;
  padding: 0!important;
  border: none!important;
}
.dialog_box_con2 ::v-deep .el-textarea__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}
.dialog_box_con_date{
  font-weight: 400;
  font-size: 16px;
  color: #333333;
  flex: 1;
  width: 0;
}
.dialog_box_con_date :deep(.el-date-editor) {
  width: 100% !important;
  box-shadow: none !important;
  background: transparent;
  border: none;
  padding: 0;
}
.dialog_box_con_date :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent;
  padding: 0;
}
.dialog_box_con_date :deep(.el-input__inner) {
  color: #333333;
  font-size: 16px;
  padding: 0 !important;
}
.dialog_box_con_date ::v-deep .el-input__inner::placeholder {
  color: #999999!important;
  font-size:16px!important
}
.required-star {
  color: #FF2E00;
  margin-left: 2px;
}
.dialog_box_con_date :deep(.el-input__prefix) {
  display: none!important;
}
.dialog_box_con_alias_tip{
  font-weight: 400;
font-size: 16px;
color: #999999;
margin-top: 8px;
align-self: flex-start;
padding:0 29px;
box-sizing: border-box;
}
.dialog_box_con_alias_tip_btn{
  cursor: pointer;
  padding-left: 16px;
  font-weight: 400;
font-size: 16px;
color: #0049FF;
}

/* ===== 课程详情视图样式 ===== */
.cdetail-header {
  width: 100%;
  height: 68px;
  background: #FFFFFF;
  // border-left: 1px solid #F3F4F8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px 0 24px;
  box-sizing: border-box;
  flex-shrink: 0;
}
.cdetail-header-back {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}
.cdetail-back-icon {
  width: 7px;
  height: 14px;
}
.cdetail-back-text {
  font-weight: bold;
  font-size: 16px;
  color: #333333;
}
.cdetail-task-count {
  font-size: 14px;
  color: #666666 ;
}
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

/* 通用卡片 */
.cdi-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 4px;
  padding: 14px 16px 14px 16px ;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items:center;
  gap: 8px;
}
.cdi-card:hover{
  background: rgba(202, 217, 255, 0.20)!important;
}
.cdi-card-in-group {
  // background: rgba(202, 217, 255, 0.20);
  padding-left: 36px;
}
.cdi-sub-group-header {
  padding-left: 36px!important;

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
.cdi-status-text b {
  color: #FF6B00;
  font-weight: 600;
}
.cdi-date-row {
  font-size: 13px;
  color: #999999;
}
.cdi-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.cdi-file-meta {
  font-size: 13px;
  color: #999999;
}

/* 徽标 */
.cdi-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  border-radius: 11px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 400;
}
.cdi-badge-live {
  background: #E8FFF3;
  border: 1px solid #00B578;
  color: #00B578;
}
.cdi-badge-upcoming {
  background: #F3F4F8;
  border: 1px solid #CCCCCC;
  color: #999999;
}
.cdi-badge-recent {
  background: #E8EEFF;
  color: #0049FF;
  border: 1px solid #C0CFFF;
}

/* 右侧操作区 */
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
.cdi-progress-wrap {
  width: 42px;
  height: 42px;
}
.cdi-check-circle {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cdi-options-dot {
  width: 36px;
  height: 36px;
  cursor: pointer;
}

/* 分组标题行 */
.cdi-group-header {
  width: 100%;
  background: #FFFFFF;
  border-radius: 4px;
  // box-shadow: 0px 0px 8px 0px rgba(0, 73, 255, 0.08);
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
.cdi-group-arrow-icon {
  width: 20px;
  height: 20px;
  background: #E8EEFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
.zbzClass{
  width: 88px;
  height: 26px;
}
.zbwksClass{
  width: 114px;
  height: 26px;
}
.yzb_text{
  color: #0EB520;
  font-size: 20px;
  font-weight: bold; 
}
.jlzb_text{
  color: #FF2E00;
  font-size: 20px;
  font-weight: bold;
}
.zjxxIcon{
  width: 82px;
  height: 26px;
}
.xlIcon{
  width: 15px;
  height: 15px;
}
.percentImg{
  width: 36px;
  height: 36px;
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

/* ─── 课后测试 tab 筛选栏（对齐学生端） ─────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  box-sizing: border-box;
  margin-bottom: 16px;
  background: rgba(239,246,255,0.45);
  border-radius: 0;
  border-top: 1px solid #DBEAFE;
  border-bottom: 1px solid #DBEAFE;
  overflow: visible;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    min-width: 0;
    overflow: visible;
    flex-wrap: wrap;
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
      min-width: 220px;
      cursor: default;
      overflow: visible;
    }

    &--datetime {
      min-width: 220px;
    }

    &--select {
      min-width: 160px;
      cursor: default;
      padding-right: 8px;
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
.ls_date_picker {
  flex: 1;
  ::v-deep .el-range-editor {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    padding: 0;
    height: 38px;
  }
  ::v-deep .el-range-input {
    font-size: 13px;
    color: #1D293D;
    background: transparent;
  }
  ::v-deep .el-range-separator {
    font-size: 13px;
    color: #94A3B8;
    line-height: 38px;
  }
  ::v-deep .el-range__icon,
  ::v-deep .el-input__icon {
    display: none;
  }
}
.ls_class_select_wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}
.ls_class_select_arrow,
.ls_class_select_clear {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #94A3B8;
}
.ls_class_select_arrow {
  pointer-events: none;
}
.ls_class_select_clear {
  font-size: 14px;
  cursor: pointer;
  z-index: 2;
  &:hover {
    color: #64748B;
  }
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
  ::v-deep .el-select__input {
    margin-left: 0 !important;
  }
}
.filter-item__clear {
  flex-shrink: 0;
  font-size: 14px;
  color: #94A3B8;
  cursor: pointer;
  line-height: 1;
  &:hover {
    color: #64748B;
  }
}
.filter-item__control--picker ::v-deep .el-input__inner {
  border: none !important;
}
.after-test-list {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px;
  width: 100%;
  flex: 1;
  height: 0;
  overflow-y: auto;
}
.after-test-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
}
.after-test-item {
  width: calc((100% - 16px) / 2);
  display: flex;
  flex-direction: column;
  padding: 21px;
  gap: 8px;
  background: #FFFFFF;
box-shadow: 0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1);
border-radius: 12px 12px 12px 12px;
border: 1px solid #DBEAFE;
  transition: border-color 0.15s;
}
.after-test-item:hover {
  border-color: #C9D7FF;
}
.after-test-item__title {
  font-size: 16px;
  font-weight: bold;
  color: #020618;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.after-test-item__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}
.after-test-item__meta-cell {
  background: #F8FAFC;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  color: #314158;
  line-height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}
.after-test-item__time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 18px;
  position: relative;
  padding: 0 12px;
  box-sizing: border-box;
height: 36px;
background: #F8FAFC;
border-radius: 10px 10px 10px 10px;
}
.after-test-item__time-label {
  color: #90A1B9;
  flex-shrink: 0;
}
.after-test-item__time-val {
  color: #314158;
}
.after-test-item__actions {
  display: flex;
  gap: 10px;
}
.after-test-item__btn {
  flex: 1;
  height: 36px;
 background: linear-gradient( 90deg, #155DFC 0%, #00BCFF 100%);
box-shadow: 0px 2px 4px -2px #DBEAFE, 0px 4px 6px -1px #DBEAFE;
border-radius: 12px 12px 12px 12px;
  color: #fff;
  border: none;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  outline: none;
}
.after-test-item__btn:hover {
  background: #003de0;
}
.after-test-item__btn--replay {
  background: #FFFFFF;
  border: 1px solid #155DFC;
  box-shadow: none;
  color: #155DFC;
}
.after-test-item__btn--replay:hover {
  background: #EFF6FF;
}
::v-deep .filter-item__control--datetime .el-date-editor--datetimerange.el-input__inner{
  width: 330px!important;
  min-width: 330px!important;
  .el-range-input{
    width: 142px!important;
  }
  .el-range-separator{
    line-height: 20px!important;
  }
}
</style>
