<template>
  <div class="page-placeholder">
    <div class="app_container_box_left">
      <div class="app_container_box_left_top">
        <div class="app_top_left_text">我的班级<span class="app_top_left_count">({{ classList.length }})</span></div>
        <img src="@/assets/images/home/add.png" @click="handleAddClass()" class="app_top_left_icon" alt="">
      </div>
      <div class="app_container_box_left_search_box" v-if="isOpenSearch == false">
        <div class="app_container_box_left_search_box_top" @click="openSearch()">
          <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
          <div class="app_container_box_left_search_box_top_text">
            搜索
          </div>
        </div>
        <div class="app_container_box_left_search_box_center">
          <!-- <div class="app_container_box_left_search_box_center_left">
              <el-select
            v-model="year"
            placeholder="请选择年份"
            clearable
            style="width: 100%;"
          >
            <el-option
            
              key=""
              label="全部"
              value=""
            />
             <el-option
            
              key="2026"
              label="2026"
              value="2026"
            />
          </el-select>
          </div> -->
          <div class="app_container_box_left_search_box_center_left">
              <el-select
            v-model="liveStatus"
            placeholder="状态"
            style="width: 100%;"
          >
            <el-option
              key=""
              label="全部"
              value=""
            />
            <el-option
              key="未过期"
              label="未过期"
              value="未过期"
            />
             <el-option
              key="已过期"
              label="已过期"
              value="已过期"
            />
          </el-select>
          </div>
          <el-dropdown trigger="click" @command="handleSortCommand">
            <div class="app_container_box_left_search_box_center_right">
              <img src="@/assets/images/class/sx.png" class="app_container_box_left_search_box_center_right_img" alt="">
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="name_asc" :class="{ 'sort-active': sortType === 'name_asc' }">班级名称 A-Z</el-dropdown-item>
                <el-dropdown-item command="name_desc" :class="{ 'sort-active': sortType === 'name_desc' }">班级名称 Z-A</el-dropdown-item>
                <el-dropdown-item command="time_asc" :class="{ 'sort-active': sortType === 'time_asc' }">创建时间升序</el-dropdown-item>
                <el-dropdown-item command="time_desc" :class="{ 'sort-active': sortType === 'time_desc' }">创建时间降序</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div  class="app_container_box_left_search_box" v-if="isOpenSearch==true">
        <div class="app_container_box_left_search_box_topBox">
           <div class="app_container_box_left_search_box_topBox_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input ref="searchInput" v-model="leftSearchText" :placeholder="searchType === 'class' ? '搜索班级' : '搜索学生'" clearable />
            </div>
          </div>
          <div class="app_container_box_left_search_box_topBox_cancel" @click="cancelSearch">取消</div>
        </div>
        <!-- <div class="app_container_box_left_search_box_choose">
          <div
            class="app_container_box_left_search_box_choose_detail"
            :class="{ 'app_container_box_left_search_box_choose_detail_active': searchType === 'class' }"
            @click="searchType = 'class'"
          >找班级</div>
        </div> -->
      </div>
      <div ref="leftClassList" class="app_container_box_left_list" v-if="isOpenSearch==false" v-loading="classListLoading">
        <div
          class="app_container_box_left_list_detail"
          :class="{ 'app_container_box_left_list_detail_active': selectedClassIndex === index }"
          v-for="(item, index) in classList"
          :key="index"
          @click="selectClass(index)"
        >
          <img v-if="item.pinned" src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">{{ item.alias || item.name }}</div>
          <!-- <div class="app_container_box_left_list_detail_count">{{ item.count }}人</div> -->
        </div>
        <EmptyState v-if="!classListLoading && classList.length === 0" description="暂无班级数据" />
      </div>

      <!-- 查询时的左边列表 -->
      <div class="app_container_box_left_list" v-if="isOpenSearch==true">
        <div class="search_tips" v-if="!leftSearchText &&searchType === 'class'">输入关键词查找班级</div>
        <template v-if="leftSearchText">
          <div
            class="app_container_box_left_list_detail2"
            v-for="(item, index) in searchList"
            :key="index"
            @click="selectSearchResult(item)"
          >
            <div class="app_container_box_left_list_detail_title" v-html="highlightKeyword(item.name, leftSearchText)"></div>
          </div>
        </template>
        <EmptyState v-if="leftSearchText && searchList.length === 0" description="无搜素结果" />
      </div>
    </div>
    <div class="app_container_box_right">
      <!-- 课程详情视图 -->
      <template v-if="rightView === 'courseDetail'">
        <div class="cdetail-header">
          <div class="cdetail-header-back" @click="handleBackToCourseList">
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
                <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown> -->
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
                    <span class="cdi-file-meta">{{ item.nodeType=='3'|| item.nodeType=='4' ? formatDuration(item.duration) :  item.size  }}</span>
                    <span class="cdi-file-meta">{{ item.date }}</span>
                    <img v-if="item.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                  </div>
                </div>
              </div>
              <div class="cdi-actions" @click.stop>
                <el-progress type="circle" :percentage="item.progress" :width="36" :stroke-width="2" :color="item.progress >= 100 ? '' : '#71A0FF'" :status="item.progress >= 100 ? 'success' : ''"></el-progress>
                <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown> -->
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
                <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, item)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown> -->
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
                <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, child)">
                  <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown> -->
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
                      <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, grandchild)">
                        <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown> -->
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
                    <!-- <el-dropdown trigger="click" @command="(cmd) => handleContentOptionsCommand(cmd, child)">
                      <img @click.stop src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown> -->
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
            <div class="app_container_box_right_top_top_title" @click="showClassDetail = true" style="cursor:pointer;">
              <div class="app_container_box_right_top_top_name">{{ currentClass.alias || currentClass.name }}</div>
              <div
                v-if="currentClass.alias && currentClass.name && currentClass.alias !== currentClass.name"
                class="app_container_box_right_top_top_realname"
              >{{ currentClass.name }}</div>
            </div>
            <div
              class="app_container_box_right_top_top_tag"
              :class="{ 'is-expired': currentClass.remainDays < 0 }"
            >{{ currentClass.remainDays < 0 ? `已过期${Math.abs(currentClass.remainDays)}天` : ( currentClass.remainDays==0? `今天到期` : `剩余${currentClass.remainDays}天` )}}</div>
          </div>
          <div class="app_container_box_right_top_top_right">
            <img @click="handleToAnnouncement()" src="@/assets/images/class/rl.png" class="app_container_box_right_top_top_right_rl" alt="">
            <el-dropdown trigger="click" @command="handleOptionsCommand">
              <img src="@/assets/images/class/options.png" class="app_container_box_right_top_top_right_options" alt="">
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pin">
                    {{ currentClass.pinned ? '取消置顶' : '置顶' }}
                  </el-dropdown-item>
                 
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="app_container_box_right_top_mess">
          <!-- <div>{{ currentClass.count }}人</div> -->
          <div>{{ currentClass.startDate }}  ~  {{ currentClass.endDate }}</div>
        </div>
        <div class="app_container_box_right_top_choose">
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'course'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'course' }">课程</div>
            <img v-if="rightTab === 'course'" src="@/assets/images/class/hx.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'quiz'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'quiz' }">课后测试</div>
            <img v-if="rightTab === 'quiz'" src="@/assets/images/class/hx.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
        </div>
      </div>
      <!-- 课程tab列表 -->
      <div class="app_container_box_right_last" v-if="rightTab === 'course'">
        <div class="app_container_box_right_last_top">
          <div class="app_container_box_right_last_top_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input v-model="rightCourseSearch" placeholder="搜索课程" clearable />
            </div>
          </div>
          <div class="app_container_box_right_last_top_num">共{{ filteredCourseList.length }}个课程</div>
        </div>
        <div class="app_container_box_right_last_list" v-loading="courseListLoading">
          <div class="app_container_box_right_last_list_detailCourse" v-for="(item, index) in filteredCourseList" :key="index" @click="handleCourseClick(item)" style="cursor:pointer;">
            <img :src="item.cover || require('@/assets/images/class/such.png')" class="app_container_box_right_last_list_detailCourse_fm" alt="">
            <div class="app_container_box_right_last_list_detailCourse_name">{{ item.name }}</div>
            <div class="app_container_box_right_last_list_detailCourse_task">{{ item.taskCount }}个学习任务</div>
            <div class="app_container_box_right_last_list_detailCourse_jd">
              <div class="app_container_box_right_last_list_detailCourse_jd_box">
                <div class="app_container_box_right_last_list_detailCourse_jd_box_now" :style="{ width: Math.round(item.progress) + '%' }"></div>
              </div>
              <div class="app_container_box_right_last_list_detailCourse_jd_num">{{ Math.round(item.progress) }}%</div>
            </div>
            <!-- <div class="app_container_box_right_last_list_detailCourse_options" @click.stop>
              <el-dropdown trigger="click" @command="(cmd) => handleCourseOptionsCommand(cmd, item)">
                <div class="app_container_box_right_last_list_detailCourse_options_box">
                  <img src="@/assets/images/class/options3.png" class="app_container_box_right_last_list_detailCourse_options_icon" alt="">
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="learningProgress">学习进度</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div> -->
          </div>
          <EmptyState v-if="!courseListLoading && filteredCourseList.length === 0" :description="rightCourseSearch ? '无搜索结果' : '暂无课程数据'" style="width: 100%;" />
        </div>
      </div>

      <!-- 课后测tab列表 -->
      <template v-if="rightTab === 'quiz'">
      
        <div class="app_container_box_right_last quiz-list-wrap" v-loading="afterQuizLoading">
          <div class="after-test-filter">
          <div class="after-test-filter__group">
            <el-select
              v-model="afterQuizFilter.subjectId"
              placeholder="请选择科目"
              clearable
              filterable
              class="after-test-filter__select"
              @change="handleAfterQuizSearch"
            >
              <el-option
                v-for="opt in subjectOptions"
                :key="opt.id"
                :label="opt.name"
                :value="opt.id"
              />
            </el-select>
          </div>
          <div class="after-test-filter__divider"></div>
          <div class="after-test-filter__group">
            <el-date-picker
              v-model="afterQuizTimeRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="直播开始时间"
              end-placeholder="直播结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              :picker-options="afterQuizDatePickerOptions"
              class="after-test-filter__datepicker"
              @change="handleAfterQuizSearch"
            />
          </div>
          <div class="after-test-filter__divider"></div>
          <div class="after-test-filter__group">
            <el-select
              v-model="afterQuizFilter.examConfigId"
              placeholder="请选择课后测"
              clearable
              filterable
              class="after-test-filter__select"
              @change="handleAfterQuizSearch"
            >
              <el-option
                v-for="opt in afterQuizOptions"
                :key="opt.examConfigId"
                :label="opt.name"
                :value="opt.examConfigId"
              />
            </el-select>
          </div>
          <div class="after-test-filter__divider"></div>
          <div class="after-test-filter__group">
            <el-select
              v-model="afterQuizFilter.teacherId"
              placeholder="请选择上课老师"
              clearable
              filterable
              class="after-test-filter__select"
              @change="handleAfterQuizSearch"
            >
              <el-option
                v-for="opt in teacherOptions"
                :key="opt.teacherId"
                :label="opt.realName"
                :value="opt.teacherId"
              />
            </el-select>
          </div>
        </div>
          <EmptyState v-if="!afterQuizLoading && afterQuizList.length === 0" description="暂无课后测数据" style="width:100%;margin-top:60px;" />
          <div class="quiz-item" v-for="(item, index) in afterQuizList" :key="index" @click="startExam(item)">
            <div class="quiz-item-left">
              <img :src="item.cover || require('@/assets/images/class/such.png')" class="quiz-item-cover" alt="">
              <div class="quiz-item-play-icon" v-if="item.fileList && item.fileList.length!=0" @click.stop="openVideoPlayer(item, false, false, true)">
                <img src="@/assets/images/class/play.png" class="quiz-play-btn" alt="">
              </div>
            </div>
            <div class="quiz-item-body">
              <div class="quiz-item-title-row">
                <span class="quiz-item-name">{{ item.name }}</span>
                <span class="quiz-item-status" :class="item.finishStatus === '1' ? 'quiz-status-done' : 'quiz-status-todo'">
                  {{ item.finishStatus === '1' ? '已做题' : '未做题' }}
                </span>
                <span class="quiz-item-date">发布时间: {{ item.createTime }}</span>
              </div>
              <div class="quiz-item-meta-row">
                <span class="quiz-item-meta">做题次数: {{ item.finishNum }}次</span>
                <span class="quiz-item-meta">题目数量: {{ item.topicNum }}题</span>
                <span class="quiz-item-meta">
                  <span :class="item.finishStatus === '1' ? 'quiz-score-done' : 'quiz-score-none'">
                    {{ item.finishStatus === '1' ? item.finishScore + ' 分' : '' }}
                  </span>
                  <span class="quiz-score-done" style="cursor:pointer;" @click.stop="openRanking(item)">{{item.finishStatus === '1'?'(查看排行榜)':'查看排行榜'}}</span>
                </span>
              </div>
            </div>
            <div class="quiz-item-actions">
              <button class="quiz-btn-primary" @click.stop="startExam(item)">去考试</button>
              <button class="quiz-btn-outline" @click.stop="openExamRecord(item)">考试记录</button>
            </div>
          </div>
        </div>
      </template>
      </template>
      </template>
    </div>
    <!-- 班级详情抽屉 -->
    <transition name="class-detail-fade">
      <div class="class-detail-mask" v-if="showClassDetail" @click.self="showClassDetail = false">
        <div class="class-detail-drawer">
          <div class="class-detail-drawer__header">
            <img src="@/assets/images/liveClass/backIcon.png" class="class-detail-drawer__back" alt="" @click="showClassDetail = false">
            <span class="class-detail-drawer__title">班级详情</span>
            <img src="@/assets/images/close.png" class="class-detail-drawer__close" alt="" @click="showClassDetail = false">
          </div>
          <div class="class-detail-drawer__body">
            <div class="class-detail-drawer__item">
              <div class="class-detail-drawer__label">班级名称</div>
              <div class="class-detail-drawer__value class-detail-drawer__value--bold">{{ currentClass && (currentClass.alias || currentClass.name) }}</div>
            </div>
            <div class="class-detail-drawer__item">
              <div class="class-detail-drawer__label">班级有效期</div>
              <div class="class-detail-drawer__value class-detail-drawer__value--bold">{{ currentClass && currentClass.startDate }} ~ {{ currentClass && currentClass.endDate }}</div>
            </div>
            <div class="class-detail-drawer__item">
              <div class="class-detail-drawer__label">班级描述</div>
              <div class="class-detail-drawer__value">{{ currentClass && currentClass.describe || '暂无描述' }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 加入班级弹窗 -->
    <DialogCustome
      width="616px"
      height="318px"
      :visible="showJoinClassDialog"
      title="请输入你的班级邀请码"
      confirmText="加入班级"
      :confirmLoading="joinClassLoading"
      :confirmDisabled="!joinClassCode.trim()"
      @cancel="showJoinClassDialog = false; joinClassCode = ''"
      @confirm="handleJoinClass"
      @close="showJoinClassDialog = false; joinClassCode = ''"
    >
      <div class="dialog_box2">
        <div class="dialog_box_con">
          <div class="dialog_box_con_input">
            <el-input v-model="joinClassCode" style="width:100%" placeholder="请输入班级邀请码" clearable />
          </div>
        </div>
      </div>
    </DialogCustome>


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
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
        <el-button
          v-if="isStudent && fromLearningTask"
          :type="isCollected ? 'warning' : 'default'"
          size="small"
          :loading="collecting"
          @click="handleCollect"
        >{{ isCollected ? '已收藏' : '收藏' }}</el-button>
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
      <img
        v-if="showImageDialog"
        :src="currentImageUrl"
        style="width:100%;max-height:600px;object-fit:contain;display:block;"
        alt=""
      />
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
        <el-button
          v-if="isStudent && fromLearningTask"
          :type="isCollected ? 'warning' : 'default'"
          size="small"
          :loading="collecting"
          @click="handleCollect"
        >{{ isCollected ? '已收藏' : '收藏' }}</el-button>
        <el-button v-if="currentAllowDownload === '1'" type="primary" size="small" @click="handleImageDownload">下载图片</el-button>
      </div>
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
    <FilePreview :visible="filePreviewVisible" :file="filePreviewData" :allow-download="currentAllowDownload" :from-task="fromLearningTask" :collect-params="currentCollectParams" @close="filePreviewVisible = false; fromLearningTask = false; isCollected = false" @collect-change="onChildCollectChange" />

    <!-- 考试页面 -->
    <ExamPage
      v-if="showExam"
      :examInfo="currentExamItem"
      :classId="selectedClassId"
      @back="onExamBack"
      @submitted="onExamSubmitted"
    />

    <!-- 考试记录页面 -->
    <ExamRecordPage
      v-if="showExamRecord"
      :examInfo="currentExamRecordItem"
      :classId="selectedClassId"
      @back="showExamRecord = false"
    />

    <!-- 排行榜页面 -->
    <RankingPage
      :visible="showRanking"
      :examConfigId="rankingExamConfigId"
      :classId="selectedClassId"
      @back="showRanking = false"
    />

    <!-- 直播间 -->
    <div v-if="showLiveIframe" class="live-iframe-overlay">
      
      <iframe :src="liveUrl" style="width: 100%; height: 100vh; background: #1E1E1E;" frameborder="0" allowfullscreen allow="camera;microphone;autoplay;display-capture;" allowusermedia></iframe>
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
import { checkTempStudentLiveRecord } from '@/api/modules/student'
import { getClassList, getClassDetail, getClassCourses, toggleClassTop, setClassAlias, updateClass, deleteClass, getCourseDetail, joinClass, updateRecentStudy, updateCourseProgress, getAfterQuizList, collectToggle, getSubjectOptions, getAfterQuizOptions, getTeacherOptions, addBusinessView } from '@/api'
import FilePreview from '@/components/FilePreview/index.vue'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import ExamPage from './ExamPage.vue'
import ExamRecordPage from './ExamRecordPage.vue'
import RankingPage from './RankingPage.vue'
import { getToken, getUserInfo } from '@/utils/auth'
import { formatDuration } from '@/utils'

export default { 
  name: 'Class',
  components: { FilePreview, VideoPlayer, ExamPage, ExamRecordPage, RankingPage },
  data() {
    const userInfo = getUserInfo() || {}
    return {
      activeLoadingKey: null,
      isStudent: userInfo.role === 'STUDENT',
      // 收藏相关：标记是否从"学习任务"入口打开，以及当前收藏接口所需参数
      fromLearningTask: false,
      skipProgressOnClose: false,
      currentCollectParams: {},
      isCollected: false,
      collecting: false,
      liveUrl: '',
      showLiveIframe: false,
      year: '',
      liveStatus: '未过期',
      isOpenSearch: false,
      searchType: 'class',
      rightTab: 'course',
      selectedClassIndex: 0,
      selectedClassId: null,
      classList: [],
      courseList: [],
      classListLoading: false,
      courseListLoading: false,
      searchClassList: [],
      leftSearchText: '',
      rightCourseSearch: '',
      sortType: 'name_asc',
      aliasDialogVisible: false,
      aliasInput: '',
      showClassDetail: false,
      showJoinClassDialog: false,
      joinClassCode: '',
      joinClassLoading: false,
      rightView: 'default',
      selectedCourse: null,
      courseDetailLoading: false,
      courseDetail: {
        taskCount: 0,
        items: []
      },
      playerVisible: false,
      playerSource: '',
      playerTeacherSource: '',
      playerTitle: '',
      playerHistoryLessonId: '',
      showVideoDialog: false,
      currentVideoUrl: '',
      currentPlayingItem: null,
      showAudioDialog: false,
      currentAudioUrl: '',
      showImageDialog: false,
      currentImageUrl: '',
      currentResourceTitle: '',
      filePreviewVisible: false,
      filePreviewData: null,
      currentAllowMultiple: '2',
      currentAllowFastForward: '2',
      currentAllowDownload: '2',
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

      // 课后测
      afterQuizList: [],
      afterQuizLoading: false,
      afterQuizFilter: { subjectId: '', quizStartTime: '', quizEndTime: '', examConfigId: '', teacherId: '' },
      afterQuizTimeRange: [],
      afterQuizDatePickerOptions: { disabledDate: (time) => time.getTime() > Date.now() },
      subjectOptions: [],
      afterQuizOptions: [],
      teacherOptions: [],

      // 考试
      showExam: false,
      currentExamItem: null,

      // 考试记录
      showExamRecord: false,
      currentExamRecordItem: null,

      // 排行榜
      showRanking: false,
      rankingExamConfigId: '',

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
        this.courseList = []
        this.selectedClassId = null
        this.selectedClassIndex = 0
        this.searchClassList = []
        this.fetchClassList()
      }
    },
    liveStatus() {
      // 用户主动切换过滤状态时，清空已选班级，避免自动切换逻辑将状态回跳
      this.selectedClassId = null
      this.fetchClassList()
    },
    rightTab(val) {
      if (val === 'course') this.fetchCourseList()
      if (val === 'quiz') { this.fetchAfterQuizFilterOptions(); this.fetchAfterQuizList() }
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
        if (val) {
          this.fetchClassSearch(val)
        } else {
          this.searchClassList = []
        }
      }, 300)
    }
  },
  computed: {
    currentClass() {
      return this.classList[this.selectedClassIndex] || null
    },
    searchList() {
      return this.leftSearchText ? this.searchClassList : []
    },
    filteredCourseList() {
      return this.courseList
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
    formatDuration,
    _mapClassItem(item) {
      const sourceMap = { '1': '后台创建', '0': '' }
      return {
        classId: item.classId,
        name: item.className || '',
        alias: item.classAlias || '',
        count: item.studentCount || 0,
        pinned: item.isTop === 1,
        remainDays: item.remainDay || 0,
        startDate: item.beginTime || '',
        endDate: item.endTime || '',
        source: sourceMap[item.classMode] || '',
        status: item.status || ''
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
          this.fetchCourseList()
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
          const sourceMap = { '1': '后台创建', '0': '' }
          this.classList.splice(idx, 1, {
            ...this.classList[idx],
            name: detail.className || this.classList[idx].name,
            alias: detail.classAlias || this.classList[idx].alias,
            count: detail.studentCount || this.classList[idx].count,
            pinned: detail.isTop === 1,
            remainDays: detail.remainDay || this.classList[idx].remainDays,
            startDate: detail.beginTime || this.classList[idx].startDate,
            endDate: detail.endTime || this.classList[idx].endDate,
            source: sourceMap[detail.classMode] || this.classList[idx].source,
            status: detail.status || this.classList[idx].status,
            describe: detail.describe || '',
            isSelfCreate: detail.isSelfCreate,
            allowRemove: detail.allowRemove,
            isAllowInvite: detail.isAllowInvite
          })
        }
      } catch (e) {
        console.error(e)
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
      } catch (e) {
        console.error(e)
        this.courseList = []
      } finally {
        this.courseListLoading = false
      }
    },
    async fetchAfterQuizList() {
      if (!this.selectedClassId) return
      const userInfo = getUserInfo() || {}
      const studentId = userInfo.userId || userInfo.id || userInfo.studentId || ''
      this.afterQuizLoading = true
      try {
        const params = { classId: this.selectedClassId, studentId }
        if (this.afterQuizFilter.subjectId) params.subjectId = this.afterQuizFilter.subjectId
        if (this.afterQuizFilter.quizStartTime) params.quizStartTime = this.afterQuizFilter.quizStartTime
        if (this.afterQuizFilter.quizEndTime) params.quizEndTime = this.afterQuizFilter.quizEndTime
        if (this.afterQuizFilter.examConfigId) params.examConfigId = this.afterQuizFilter.examConfigId
        if (this.afterQuizFilter.teacherId) params.quizTeacherId = this.afterQuizFilter.teacherId
        const res = await getAfterQuizList(params)
        this.afterQuizList = res.data || []
      } catch (e) {
        console.error(e)
        this.afterQuizList = []
      } finally {
        this.afterQuizLoading = false
      }
    },
    async fetchAfterQuizFilterOptions() {
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
        console.log(e, 'fetchAfterQuizFilterOptions error')
      }
    },
    handleAfterQuizSearch() {
      if (this.afterQuizTimeRange && this.afterQuizTimeRange.length === 2) {
        this.afterQuizFilter.quizStartTime = this.afterQuizTimeRange[0]
        this.afterQuizFilter.quizEndTime = this.afterQuizTimeRange[1]
      } else {
        this.afterQuizFilter.quizStartTime = ''
        this.afterQuizFilter.quizEndTime = ''
      }
      this.fetchAfterQuizList()
    },
    openRanking(item) {
      this.rankingExamConfigId = item.examConfigId || item.configId || String(item.id || '')
      this.showRanking = true
    },
    startExam(item) {
      this.currentExamItem = {
        id: item.id || item.quizId || item.examId,
        name: item.name || item.examName || '',
        duration: item.duration || 60,
        examConfigId: item.examConfigId || item.configId || '',
        liveId: item.liveId || ''
      }
      this.showExam = true
    },
    openExamRecord(item) {
      const cls = this.currentClass || {}
      this.currentExamRecordItem = {
        id: item.id || item.quizId || item.examId,
        name: item.name || item.examName || '',
        className: cls.alias || cls.name || ''
      }
      this.showExamRecord = true
    },
    onExamBack() {
      this.showExam = false
      this.fetchAfterQuizList()
    },
    onExamSubmitted() {
      this.showExam = false
      this.fetchAfterQuizList()
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
      this.rightCourseSearch = ''
      this.courseList = []
      this.afterQuizList = []
      if (this.selectedClassId) {
        this.fetchClassDetail(this.selectedClassId)
      }
      if (this.rightTab === 'course') {
        this.fetchCourseList()
      } else if (this.rightTab === 'quiz') {
        this.fetchAfterQuizList()
      } else {
        this.rightTab = 'course'
      }
    },
    selectSearchResult(item) {
      this.selectedClassId = item.classId
      this.rightCourseSearch = ''
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
      this.fetchClassList()
    },
    cancelSearch() {
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
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
    handleSortCommand(command) {
      this.sortType = command
      this.fetchClassList()
    },
    handleToAnnouncement() {
      this.$router.push({ path: '/announcement', query: { classId: this.selectedClassId } })
    },
    handleAddClass() {
      this.showJoinClassDialog = true
    },
    async handleJoinClass() {
      if (!this.joinClassCode.trim()) return
      this.joinClassLoading = true
      try {
        let res =  await joinClass({ classCode: this.joinClassCode.trim() })
        this.$message.success(res.data)
        this.showJoinClassDialog = false
        this.joinClassCode = ''
        await this.fetchClassList()
      } catch (e) {
        // 错误由请求拦截器统一提示
      } finally {
        this.joinClassLoading = false
      }
    },
    async handleCardClickWithLoading(key, handler) {
      this.activeLoadingKey = key
      try {
        await Promise.resolve(handler())
      } finally {
        this.activeLoadingKey = null
      }
    },
    async handleResourceClick(item) {
      console.log(item,'测试阿达瓦')
      const url = item.filePath
      if (!url) {
        this.$message.warning('资源地址不存在')
        return
      }
      const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
      const lessonId = String(item.id || '')
      const videoTypes = ['4']
      const historyVideoTypes = ['3']
      const imageTypes = ['5']
      const audioTypes = ['6']

      // 更新最近学习记录 + 学习进度，完成后刷新课时列表
      try {
        const apiCalls = [updateRecentStudy({ courseId, lessonId,type:'4' })]
        if (item.progress < 100) {
          const isVideo = videoTypes.includes(item.nodeType) || historyVideoTypes.includes(item.nodeType)
          const percent = isVideo ? String(item.progress || 0) : '100'
          apiCalls.push(updateCourseProgress({
            classId: String(this.selectedClassId || ''),
            courseId,
            lessonId,
            type: String(item.nodeType || ''),
            percent
          }))
        }
        await Promise.all(apiCalls)
      } catch (_) {}
      if (this.selectedCourse) {
        this.fetchCourseDetail(this.selectedCourse.id)
      }

      const collectBase = {
        courseId: this.selectedCourse ? String(this.selectedCourse.id || '') : '',
        lessonId: String(item.id || ''),
        type: String(item.nodeType || ''),
        collectCount: String(item.collectCount || 0),
        historyLessonId: String(item.historyLessonId || ''),
      }
      console.log(item.collectCount,'收藏')
      const initCollected = collectBase.collectCount == 1

      if (videoTypes.includes(item.nodeType)) {
         this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
        this.currentResourceTitle = item.title || '视频播放'
        this.currentAllowMultiple = item.allowMultiple != null ? String(item.allowMultiple) : '2'
        this.currentAllowFastForward = item.allowFastForward != null ? String(item.allowFastForward) : '2'
        console.log(item.allowMultiple,'视频地址')
        
        this.currentVideoUrl = url
        this.currentPlayingItem = item
        this.fromLearningTask = true
        this.currentCollectParams = collectBase
        this.isCollected = initCollected
        this.showVideoDialog = true
      } else if (historyVideoTypes.includes(item.nodeType)) {
        
        this.openVideoPlayer(item, false, true)
      } else if (imageTypes.includes(item.nodeType)) {
        this.currentResourceTitle = item.title || '图片预览'
         this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
        this.currentImageUrl = url
        this.fromLearningTask = true
        this.currentCollectParams = collectBase
        this.isCollected = initCollected
        this.showImageDialog = true
      } else if (audioTypes.includes(item.nodeType)) {
         this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
        this.currentResourceTitle = item.title || '音频播放'
        this.currentAudioUrl = url
        this.fromLearningTask = true
        this.currentCollectParams = collectBase
        this.isCollected = initCollected
        this.showAudioDialog = true
      } else {
        console.log(item,'信息')
        this.currentAllowDownload = item.allowDownload != null ? String(item.allowDownload) : '2'
        this.filePreviewData = { name: item.title || '', path: url }
        this.fromLearningTask = true
        this.currentCollectParams = collectBase
        this.isCollected = initCollected
        this.filePreviewVisible = true
      }
    },
    async closeVideoDialog(percent = 0, viewTime = 0) {
      this.showVideoDialog = false
      this.currentVideoUrl = ''
      this.fromLearningTask = false
      this.isCollected = false
      await this.reportBusinessView(viewTime)
      await this.saveVideoProgress(percent)
    },
    async closeHistoryPlayer(percent = 0) {
      this.playerVisible = false
      this.fromLearningTask = false
      this.isCollected = false
      const skip = this.skipProgressOnClose
      this.skipProgressOnClose = false
      if (!skip) {
        await this.saveVideoProgress(percent)
      }
    },
    /** 上报观看时长（秒） */
    async reportBusinessView(viewTime = 0) {
      const item = this.currentPlayingItem
      if (!item) return
      try {
        await addBusinessView({
          type: '3',
          lessonId: String(item.id || ''),
          contentId: this.selectedCourse ? String(this.selectedCourse.id || '') : '',
          viewTime: String(Math.max(0, Math.round(Number(viewTime) || 0)))
        })
      } catch (_) {}
    },
    async saveVideoProgress(percent) {
      const item = this.currentPlayingItem
      this.currentPlayingItem = null
      if (!item) return
      const newPercent = Math.max(percent, item.progress || 0)
      if (newPercent <= (item.progress || 0)) return
      try {
        const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
        const lessonId = String(item.id || '')
        await updateCourseProgress({
          classId: String(this.selectedClassId || ''),
          courseId,
          lessonId,
          type: String(item.nodeType || ''),
          percent: String(newPercent)
        })
        if (this.selectedCourse) {
          this.fetchCourseDetail(this.selectedCourse.id)
        }
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
        a.href = objectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    closeImageDialog() {
      this.showImageDialog = false
      this.currentImageUrl = ''
      this.fromLearningTask = false
      this.isCollected = false
    },
    onChildCollectChange() {
      if (this.selectedCourse) {
        this.fetchCourseDetail(this.selectedCourse.id)
      }
    },
    async handleCollect() {
      if (this.collecting) return
      this.collecting = true
      try {
        const res = await collectToggle(this.currentCollectParams)
        const collectCount = res?.data?.collectCount
        this.isCollected = collectCount !== undefined ? Number(collectCount) === 1 : !this.isCollected
        this.$message.success(this.isCollected ? '收藏成功' : '已取消收藏')
        if (this.selectedCourse) {
          this.fetchCourseDetail(this.selectedCourse.id)
        }
      } catch (e) {
        this.$message.error('操作失败，请重试')
      } finally {
        this.collecting = false
      }
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
        a.href = objectUrl
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      } catch {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    handleBackToCourseList() {
      this.rightView = 'default'
      this.fetchCourseList()
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
          allowMultiple: String(node.allowMultiple || '1'),
          allowFastForward: String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          children: (node.children || []).map(child => this._mapDetailNode(child)),
          collectCount:node.collectCount
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
          allowMultiple: String(node.allowMultiple || '1'),
          allowFastForward: String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          collectCount:node.collectCount,
          historyLessonId:live.historyLessonId || ''
        }
      } else {
        // 3=历史课程 4=视频 5=图片 6=音频 7=资料
        console.log(node,'node')
        const res = node.resource || node.historyLesson || {}
        const history = node.historyLesson || {}
        const sizeStr = res.size ? `${res.size}` : ''
        return {
          id: node.id || node.lessonId||  '',
          type: 'resource',
          nodeType: node.type,
          title: node.name || res.name || res.fileName || '',
          size: sizeStr,
          date: '',
          isRecent: res.isRecentStudy === '1',
          progress: Math.round(parseFloat(node.percent)) || 0,
          resourceUrl: res.resourceUrl || res.url || '',
          filePath: res.fileList && res.fileList.length !== 0 ? res.fileList[0].filePath : res.filePath,
          allowMultiple: String(node.allowMultiple || '1'),
          allowFastForward: String(node.allowFastForward || '1'),
          allowDownload: String(node.allowDownload || '2'),
          collectCount:node.collectCount,
          historyLessonId:node.type=='3'?history.historyLessonId:"",
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
          if (map[item.id] !== undefined) {
            this.$set(item, 'expanded', map[item.id])
          }
          if (item.children) this._restoreExpandedState(item.children, map)
        }
      })
    },
    async fetchCourseDetail(courseId) {
      if (!courseId) return
      this.courseDetailLoading = true
      const expandedMap = this._saveExpandedState(this.courseDetail.items || [])
      try {
        const params = { courseId }
        if (this.selectedClassId) params.classId = this.selectedClassId
        const res = await getCourseDetail(params)
        const data = res.data || {}
        this.courseDetail = {
          taskCount: data.totalLessons || 0,
          items: (data.detailTree || []).map(node => this._mapDetailNode(node))
        }
        this._restoreExpandedState(this.courseDetail.items, expandedMap)
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
    async openVideoPlayer(item, updateRecent = false, fromTask = false, skipProgress = false) {
      if (updateRecent) {
        try {
          const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
          const lessonId = String(item.id || '')
          await updateRecentStudy({ courseId, lessonId,type:'3' })
          if (this.selectedCourse) {
            this.fetchCourseDetail(this.selectedCourse.id)
          }
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
          collectCount: String(item.collectCount || 0)
        }
      } else {
        this.currentCollectParams = {}
      }
      console.log(this.currentAllowMultiple,'currentAllowMultiple')
      this.skipProgressOnClose = skipProgress
      this.playerVisible = true
    },
    async enterLiveRoom(item) {
      console.log(item)
      if (item.isFinish == 1 && item.liveStatus == '已结束已开播') {
        this.openVideoPlayer(item, true, true)
        return
      }
      if (item.isFinish == 1 && item.liveStatus == '已结束未开播') {
        this.$message.warning('该课程暂无回放地址')
        return
      }

        console.log(2222,'halo')
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
      // 更新最近学习记录
      try {
        const courseId = this.selectedCourse ? String(this.selectedCourse.id || '') : ''
        const lessonId = String(item.id || '')
        await updateRecentStudy({ courseId, lessonId,type:'2' })
        if (this.selectedCourse) {
          this.fetchCourseDetail(this.selectedCourse.id)
        }
      } catch (_) {}

      const { userId, realName, role } = getUserInfo()
      const token = getToken()
      const liveId = item.liveId
      const roleNumber = role === 'STUDENT' ? 0 : 1
    console.log(roleNumber,'adadwadwa')
      if (role === 'STUDENT') {
        try {
          const res = await checkTempStudentLiveRecord(liveId)
          if (res.data==false) {
             this.$message.warning(res.message)
            return
          }
        } catch (_) {}
      }

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
  justify-content: space-between;
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
  width: 300px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: center;
  background: #FFFFFF;
}
.app_container_box_left_top{
    width: 300px;
  height: 68px;
background: #FFFFFF;
display: flex;
justify-content: center;
align-items: center;
gap: 8px;
cursor: pointer;
border-bottom: 1px solid #F3F4F8;
}
.app_top_left_text{
  font-weight: bold;
font-size: 16px;
color: #333333;
}
.app_top_left_count{
  font-weight: normal;
  font-size: 14px;
  color: #999999;
  margin-left: 4px;
}
.app_top_left_icon{
  width: 16px;
  height: 16px;
}
.app_container_box_left_search_box{
  width: 100%;
  margin-top: 20px;
  padding: 0 16px ;
  box-sizing: border-box;
}
.app_container_box_left_search_box_top{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 36px;
background: #FFFFFF;
border-radius: 28px 28px 28px 28px;
border: 1px solid #999999;
gap: 8px;
padding: 0 14px;
box-sizing: border-box;
cursor: pointer;
}
.app_container_box_left_search_box_top_icon{
  width: 16px;
  height: 16px;
}
.app_container_box_left_search_box_top_text{
  font-weight: 400;
font-size: 14px;
color: #D9D9D9;
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
.app_container_box_left_search_box_center{
  width: 100%;
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
}
.app_container_box_left_search_box_center_left{
width: 215px;
height: 36px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #999999;
}
.app_container_box_left_search_box_center_right{
  width: 36px;
height: 36px;
border-radius: 4px 4px 4px 4px;
border: 1px solid #999999;
display: flex;
justify-content: center;
align-items: center;
  cursor: pointer;
}
.app_container_box_left_search_box_center_right_img{
  width: 16px;
  height: 16px;
}
.sort-active {
  color: #0049FF !important;
  font-weight: 600;
}
.app_container_box_left_list{
  margin-top: 20px;
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
}
.app_container_box_left_list_detail{
  width: 300px;
height: 68px;
background: #FFFFFF;
border-radius: 0px 0px 0px 0px;
padding: 9px 30px 9px 16px;
box-sizing: border-box;
position: relative;
cursor: pointer;
display: flex;
flex-direction: column;
justify-content: center;
}

.app_container_box_left_list_detail2{
  width: 300px;

background: #FFFFFF;
border-radius: 0px 0px 0px 0px;
padding: 20px 30px 20px 16px;
box-sizing: border-box;
position: relative;
cursor: pointer;
}

.app_container_box_left_list_detail2:hover{
  background: #F0F3F6!important;
}
.app_container_box_left_list_detail_active{
  background: #CAD9FF!important;
}
.app_container_box_left_list_detail:hover{
  background: #F0F3F6!important;
}
.app_container_box_left_list_detail_title{
  font-weight: 400;
  width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
font-size: 14px;
color: #333333;
}
.app_container_box_left_list_detail_count{
  font-weight: 400;
font-size: 14px;
color: #666666;
margin-top: 9px;
}
.app_container_box_left_list_detail_chooseIcon{
  position: absolute;
  right: 2px;
  top: 2px;
  width: 14px;
  height: 14px;
}
.app_container_box_right{
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}
.app_container_box_right_empty{
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #FFFFFF;
  border-left: 1px solid #F3F4F8;
}
.app_container_box_right_top{
  width: 100%;
  padding: 21px 43px 2px 20px;
  box-sizing: border-box;
  border-left: 1px solid #F3F4F8;
  background: #FFFFFF;
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
font-size: 16px;
color: #333333;
}
.app_container_box_right_top_top_realname{
  font-weight: 400;
  font-size: 12px;
  color: #999999;
  line-height: 1.2;
  word-break: break-all;
}
.app_container_box_right_top_top_tag{
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border-radius: 16px;
  background: #FFEDED;
  border: 1px solid #FF2E00;
  font-weight: 400;
  font-size: 14px;
  color: #FF2E00;
  padding: 0 9px;
  box-sizing: border-box;
  &.is-expired {
    background: #F5F5F5;
    border-color: #CCCCCC;
    color: #999999;
  }
}
.app_container_box_right_top_top_right{
  display: flex;
  justify-content: flex-end;
  gap: 23px;
  align-items: center;
}
.app_container_box_right_top_top_right_rl{
  cursor: pointer;
  width: 20px;
  height: 18px;
}
.app_container_box_right_top_top_right_options{
  width: 20px;
  height: 4px;
  cursor: pointer;
}
.app_container_box_right_top_mess{
  margin-top: 22px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  font-weight: 400;
font-size: 14px;
color: #999999;
}
.app_container_box_right_top_choose{
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 40px;
  margin-top: 20px;
}
.app_container_box_right_top_choose_detail{
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}
.app_container_box_right_top_choose_detail_text{
  font-weight: bold;
font-size: 16px;
color: #666666;
}
.app_container_box_right_top_choose_detail_hx{
  width: 31px;
  height: 3px;
}
.app_container_box_right_top_choose_detail_text_active{
  color: #333333!important;
}
.app_container_box_right_last{
  flex: 1;
  height: 0;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  background: #F0F3F6;
  padding: 20px;
  box-sizing: border-box;
}
.app_container_box_right_last_top_search{
  display: flex;
  justify-content:flex-start;
  align-items: center;
   width: 268px;
   height:36px;
   background: #FFFFFF;
border-radius: 28px 28px 28px 28px;
border: 1px solid #999999;
gap: 8px;
padding: 0 14px;
box-sizing: border-box;
}
.app_container_box_right_last_top{
 width: 100%;
 display: flex;
  justify-content: space-between;
  align-items: center;


}
.app_container_box_right_last_top_num{
font-weight: 400;
font-size: 14px;
color: #666666;
}
.app_container_box_right_last_list{
  width: 100%;
  flex: 1;
  height: 0;
  overflow: auto;
  margin-top: 17px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 16px;
}
.app_container_box_right_last_list_detail{
  width: 190px;
background: #FFFFFF;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
display: flex;
flex-direction: column;
justify-content: space-between;
}
.app_container_box_right_last_list_detail_top{
  padding: 0 15px 15px 15px;
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
}
.app_container_box_right_last_list_detail_top_options{
  width: 36px;
  height: 36px;
  cursor: pointer;
}
.app_container_box_right_last_list_detail_top_mess{
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}
.app_container_box_right_last_list_detail_top_mess_icon{
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
}
.app_container_box_right_last_list_detail_top_mess_icon_placeholder{
  background-color: #0049FF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
}
.app_container_box_right_last_list_detail_top_mess_mess{
  flex: 1;
  width: 0;
  font-weight: bold;
font-size: 14px;
color: #333333;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 超出几行省略 */
  overflow: hidden;
  line-height: 22px;

}
.app_container_box_right_last_list_detail_last{
  width: 100%;
height: 36px;
background: #CAD9FF;
border-radius: 0px 0px 8px 8px;
padding-left: 12px;
line-height: 36px;
font-weight: 400;
font-size: 14px;
color: #666666;
}

.app_container_box_right_last_list_detailCourse{
  width: 190px;
background: #FFFFFF;
padding: 6px;
box-sizing: border-box;
box-shadow: 0px 0px 8px 0px rgba(0,73,255,0.1);
border-radius: 8px 8px 8px 8px;
display: flex;
flex-direction: column;
justify-content: flex-start;
position: relative;
}
.app_container_box_right_last_list_detailCourse_options{
  position: absolute;
  top: 13px;
  right: 13px;
}
.app_container_box_right_last_list_detailCourse_options_box{
  width: 34px;
height: 12px;
background: #0049FF;
border-radius: 7px 7px 7px 7px;
display: flex;
justify-content: center;
align-items: center;
cursor: pointer;
}
.app_container_box_right_last_list_detailCourse_options_icon{
  width: 20px;
  height: 4px;
}
.app_container_box_right_last_list_detailCourse_fm{
  width: 100%;
  height: 108px;
  border-radius: 4px 4px 4px 4px;
}
.app_container_box_right_last_list_detailCourse_name{
font-weight: 400;
font-size: 14px;
color: #333333;
width: 100%;
margin-top: 10px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
.app_container_box_right_last_list_detailCourse_task{
  margin-top: 8px;
  font-weight: 400;
font-size: 12px;
color: #666666;
}
.app_container_box_right_last_list_detailCourse_jd{
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}
.app_container_box_right_last_list_detailCourse_jd_box{
  flex: 1;
  width: 0;
  background: #F3F4F8;
  height: 4px;
  border-radius: 2px;
}
.app_container_box_right_last_list_detailCourse_jd_box_now{
  border-radius: 2px;
  height: 4px;
  background: #71A0FF;
}
.app_container_box_right_last_list_detailCourse_jd_num{
  width: 34px;
  text-align: center;
  font-size: 400;
  color:#666666 ;
  font-size: 12px;
  

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
  flex-wrap: wrap;
}
.cdi-file-meta {
  font-size: 13px;
  color: #999999;
  margin-right: 5px;
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

/* ─── 班级详情抽屉 ──────────────────────────────────────── */
.class-detail-fade-enter-active {
  animation: maskFadeIn 0.3s ease;
}
.class-detail-fade-leave-active {
  animation: maskFadeOut 0.3s ease;
}
@keyframes maskFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes maskFadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.class-detail-fade-enter-active .class-detail-drawer {
  animation: drawerSlideIn 0.3s ease;
}
.class-detail-fade-leave-active .class-detail-drawer {
  animation: drawerSlideOut 0.3s ease;
}
@keyframes drawerSlideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes drawerSlideOut {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}
.class-detail-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(51, 51, 51, 0.60);
  z-index: 2001;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
}
.class-detail-drawer {
  width: 560px;
  height: 100%;
  background: #fff;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.class-detail-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #F3F4F8;
}
.class-detail-drawer__title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
.class-detail-drawer__back {
  width: 7px;
  height: 14px;
  cursor: pointer;
  flex-shrink: 0;
}
.class-detail-drawer__close {
  width: 20px;
  height: 20px;
  cursor: pointer;
  opacity: 0.6;
  flex-shrink: 0;
  &:hover { opacity: 1; }
}
.class-detail-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.class-detail-drawer__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.class-detail-drawer__label {
  font-size: 13px;
  color: #999;
}
.class-detail-drawer__value {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
}
.class-detail-drawer__value--bold {
  font-weight: 600;
}

/* 课后测筛选栏 */
.after-test-filter {
  display: flex;
  align-items: center;
  height: 49px;
  background: #ffffff;
  border-radius: 4px;
  padding: 0 20px;
  box-sizing: border-box;
  margin-bottom: 0;
  flex-shrink: 0;
}
.after-test-filter__group {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 100%;
  &:first-child { padding-left: 0; }
}
.after-test-filter__divider {
  width: 1px;
  height: 20px;
  background: #d9d9d9;
  flex-shrink: 0;
}
.after-test-filter__select {
  width: 130px;
  ::v-deep .el-input__inner {
    border: none;
    box-shadow: none;
    background: transparent;
    font-size: 14px;
    color: #333333;
    padding-left: 0;
    &:focus { border: none; box-shadow: none; }
  }
  ::v-deep .el-input.is-focus .el-input__inner { border: none; box-shadow: none; }
  ::v-deep .el-select__caret { color: #999; }
  ::v-deep .el-select__input { margin-left: 0 !important; }
}
.after-test-filter__datepicker {
  width: auto !important;
  ::v-deep .el-range-editor {
    width: auto !important;
    border: none;
    box-shadow: none;
    padding: 0;
    height: auto;
    background: transparent;
    &:hover, &.is-active { border: none; box-shadow: none; }
  }
  ::v-deep .el-range-input {
    font-size: 14px;
    color: #333333;
    background: transparent;
    width: 130px;
  }
  ::v-deep .el-range-separator {
    font-size: 14px;
    color: #333333;
    padding: 0 4px;
    line-height: 2;
  }
  ::v-deep .el-range__icon { display: none; }
  ::v-deep .el-range__close-icon { font-size: 14px; }
}

/* 课后测列表 */
.quiz-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  overflow-y: auto;
}
.quiz-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.07);
  padding: 0 16px 0 0;
  gap: 16px;
  min-height: 100px;
}
.quiz-item-left {
  position: relative;
  flex-shrink: 0;
  width: 178px;
  height: 100px;
  border-radius: 8px 0 0 8px;
  overflow: hidden;
}
.quiz-item-cover {
  width: 100%;
  height: 100%;
  display: block;
}
.quiz-item-play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.18);
}
.quiz-play-btn {
  width: 40px;
  height: 40px;
}
.quiz-item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.quiz-item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.quiz-item-name {
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.quiz-item-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}
.quiz-status-done {
  background: #e6f0ff;
  color: #0049FF;
}
.quiz-status-todo {
  background: #fff0f0;
  color: #f44;
}
.quiz-item-date {
  font-size: 12px;
  color: #666666;
  white-space: nowrap;
}
.quiz-item-meta-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.quiz-item-meta {
  font-size: 12px;
  color: #666666;
}
.quiz-score-done {
  color: #0049FF;
  font-weight: 700;
}
.quiz-score-none {
  color: #aaa;
}
.quiz-item-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.quiz-btn-primary {
  width: 79px;
  height: 34px;
  background: #0049FF;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.2s;
}
.quiz-btn-primary:hover {
  background: #003acc;
}
.quiz-btn-outline {
  width: 79px;
  height: 34px;
  background: #fff;
  color: #0049FF;
  border: 1px solid #0049FF;
  box-sizing: border-box;
  border-radius: 6px;
  font-size: 13px;
 font-weight: 400;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.quiz-btn-outline:hover {
  background: #e6f0ff;
}


</style>
