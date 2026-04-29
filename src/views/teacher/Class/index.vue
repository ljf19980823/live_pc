<template>
  <div class="page-placeholder">
    <div class="app_container_box_left">
      <div class="app_container_box_left_top">
        <div class="app_top_left_text">我的班级</div>
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
          <div class="app_container_box_left_list_detail_count">{{ item.count }}人</div>
        </div>
        <EmptyState v-if="!classListLoading && classList.length === 0" description="暂无班级数据" />
      </div>

      <!-- 查询时的左边列表 -->
      <div class="app_container_box_left_list" v-if="isOpenSearch==true">
        <div class="search_tips" v-if="!leftSearchText &&searchType === 'class'">输入关键词查找班级</div>
        <div class="search_tips" v-if="!leftSearchText &&searchType === 'student'">输入学生姓名/用户名/手机号查找学生所在班级</div>
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
          <div class="cdetail-task-count">{{ courseDetailMock.taskCount }}个学习任务</div>
        </div>
        <div class="cdetail-list">
          <template v-for="(item, idx) in courseDetailMock.items">
            <!-- 直播课 -->
            <div v-if="item.type === 'live'" class="cdi-card"  :key="idx">
              <div class="cdi-main">
                <img src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                <div class="cdi-info">
                  <div class="cdi-name">{{ item.title }}</div>
                  <div class="cdi-status-row">
                    <template v-if="item.status === 'ended'">
                      <div class="cdi-status-text">已结束</div>
                    </template>
                    <template v-else-if="item.status === 'streaming'">
                      <div class="cdi-status-text">已直播 <span class="yzb_text">{{ item.streamedMinutes }}</span> 分钟</div>
                      <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                    </template>
                    <template v-else-if="item.status === 'upcoming'">
                      <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ item.countdownMinutes }}</span> 分钟</div>
                     <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                    </template>
                     <span class="cdi-date-row">{{ item.date }}&nbsp;&nbsp;{{ item.timeStart }} - {{ item.timeEnd }}</span>
                  </div>
                 
                </div>
              </div>
              <div class="cdi-actions">
                <el-progress type="circle" :percentage="item.progress" :width="36" :stroke-width="2" color="#71A0FF"></el-progress>
                <img src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
              </div>
            </div>

            <!-- PDF / 文件 -->
            <div v-else-if="item.type === 'pdf'" class="cdi-card" :key="idx">
              <div class="cdi-main">
                <img src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                <div class="cdi-info">
                  <div class="cdi-name">{{ item.title }}</div>
                  <div class="cdi-file-row">
                    <span class="cdi-file-meta">{{ item.size }}</span>
                    <span class="cdi-file-meta">{{ item.date }}</span>
                    <img v-if="item.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                   
                  </div>
                </div>
              </div>
              <div class="cdi-actions">
                <img  src="@/assets/images/class/percent.png" class="percentImg" alt="">
                <img src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
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
                </div>
                <!-- 二级分组展开后的三级内容 -->
                <template v-if="child.type === 'group' && child.expanded">
                  <div v-for="(grandchild, gi) in child.children" :key="`grandchild-${idx}-${ci}-${gi}`"
                    class="cdi-card cdi-card-in-group cdi-card-in-subgroup">
                    <div class="cdi-main">
                      <img v-if="grandchild.type === 'live'" src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                      <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                      <div class="cdi-info">
                        <div class="cdi-name">{{ grandchild.title }}</div>
                        <div v-if="grandchild.type === 'live'" class="cdi-status-row">
                          <template v-if="grandchild.status === 'ended'">
                            <div class="cdi-status-text">已结束</div>
                          </template>
                          <template v-else-if="grandchild.status === 'streaming'">
                            <div class="cdi-status-text">已直播 <span class="yzb_text">{{ grandchild.streamedMinutes }}</span> 分钟</div>
                            <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                          </template>
                          <template v-else-if="grandchild.status === 'upcoming'">
                            <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ grandchild.countdownMinutes }}</span> 分钟</div>
                            <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                          </template>
                          <span class="cdi-date-row">{{ grandchild.date }}&nbsp;&nbsp;{{ grandchild.timeStart }} - {{ grandchild.timeEnd }}</span>
                        </div>
                        <div v-else class="cdi-file-row">
                          <span class="cdi-file-meta">{{ grandchild.size }}</span>
                          <span class="cdi-file-meta">{{ grandchild.date }}</span>
                          <img v-if="grandchild.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                        </div>
                      </div>
                    </div>
                    <div class="cdi-actions">
                      <el-progress v-if="grandchild.type === 'live'" type="circle" :percentage="grandchild.progress" :width="36" :stroke-width="2" color="#71A0FF"></el-progress>
                      <img  v-else src="@/assets/images/class/percent.png" class="percentImg" alt="">
                     
                      <img src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
                    </div>
                  </div>
                </template>
                <!-- 一级分组下的普通内容（pdf / live） -->
                <div v-if="child.type !== 'group'" :key="`child-${idx}-${ci}`" class="cdi-card cdi-card-in-group">
                  <div class="cdi-main">
                    <img v-if="child.type === 'live'" src="@/assets/images/class/liveIcon.png" class="cdi-type-icon" alt="" />
                    <img v-else src="@/assets/images/class/fileIcon.png" class="cdi-type-icon" alt="" />
                    <div class="cdi-info">
                      <div class="cdi-name">{{ child.title }}</div>
                      <div v-if="child.type === 'live'" class="cdi-status-row">
                        <template v-if="child.status === 'ended'">
                          <div class="cdi-status-text">已结束</div>
                        </template>
                        <template v-else-if="child.status === 'streaming'">
                          <div class="cdi-status-text">已直播 <span class="yzb_text">{{ child.streamedMinutes }}</span> 分钟</div>
                          <img src="@/assets/images/class/zbz.png" class="zbzClass" alt="">
                        </template>
                        <template v-else-if="child.status === 'upcoming'">
                          <div class="cdi-status-text">距离直播还有 <span class="jlzb_text">{{ child.countdownMinutes }}</span> 分钟</div>
                          <img src="@/assets/images/class/zbwks.png" class="zbwksClass" alt="">
                        </template>
                        <span class="cdi-date-row">{{ child.date }}&nbsp;&nbsp;{{ child.timeStart }} - {{ child.timeEnd }}</span>
                      </div>
                      <div v-else class="cdi-file-row">
                        <span class="cdi-file-meta">{{ child.size }}</span>
                        <span class="cdi-file-meta">{{ child.date }}</span>
                        <img v-if="child.isRecent" src="@/assets/images/class/zjxx.png" class="zjxxIcon" alt="">
                      </div>
                    </div>
                  </div>
                  <div class="cdi-actions">
                    <el-progress v-if="child.type === 'live'" type="circle" :percentage="child.progress" :width="36" :stroke-width="2" color="#71A0FF"></el-progress>
                    <img  v-else src="@/assets/images/class/percent.png" class="percentImg" alt="">
                    <img src="@/assets/images/class/options2.png" class="cdi-options-dot" alt="">
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
            <div class="app_container_box_right_top_top_name">{{ currentClass.alias || currentClass.name }}</div>
            <div class="app_container_box_right_top_top_tag">剩余{{ currentClass.remainDays }}天</div>
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
                  <el-dropdown-item command="alias">设置别名</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <div class="app_container_box_right_top_mess">
          <div>{{ currentClass.count }}人</div>
          <div>{{ currentClass.startDate }}  ~  {{ currentClass.endDate }}</div>
          <div>{{ currentClass.source }}</div>
        </div>
        <div class="app_container_box_right_top_choose">
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'student'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'student' }">学生</div>
            <img v-if="rightTab === 'student'" src="@/assets/images/class/hx.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
          <div class="app_container_box_right_top_choose_detail" @click="rightTab = 'course'">
            <div class="app_container_box_right_top_choose_detail_text" :class="{ 'app_container_box_right_top_choose_detail_text_active': rightTab === 'course' }">课程</div>
            <img v-if="rightTab === 'course'" src="@/assets/images/class/hx.png" class="app_container_box_right_top_choose_detail_hx" alt="">
          </div>
        </div>
      </div>
      <!-- 学生tab列表 -->
      <div class="app_container_box_right_last" v-if="rightTab === 'student'">
        <div class="app_container_box_right_last_top">
          <div class="app_container_box_right_last_top_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <el-input v-model="rightStudentSearch" placeholder="姓名/用户名/手机号" clearable />
            </div>
          </div>
          <div class="app_container_box_right_last_top_num">共{{ filteredStudentList.length }}个学生</div>
        </div>
        <div class="app_container_box_right_last_list" v-loading="studentListLoading">
          <div class="app_container_box_right_last_list_detail" v-for="(item, index) in filteredStudentList" :key="index" @click="handleStudentDetail(item)">
            <div class="app_container_box_right_last_list_detail_top">
              <el-dropdown trigger="click" @command="(cmd) => handleStudentOptionsCommand(cmd, item)">
                <img  @click.stop src="@/assets/images/class/options.png" class="app_container_box_right_last_list_detail_top_options" alt="">
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                    <el-dropdown-item command="studentDetail">学生详情</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div class="app_container_box_right_last_list_detail_top_mess">
                <img :src="item.avatar || require('@/assets/images/class/such.png')" class="app_container_box_right_last_list_detail_top_mess_icon" alt="">
                <div class="app_container_box_right_last_list_detail_top_mess_mess">{{ item.name }}</div>
              </div>
            </div>
            <div class="app_container_box_right_last_list_detail_last">进班日期：{{ item.joinDate ? item.joinDate.slice(0, 10) : '' }}</div>
          </div>
          <EmptyState v-if="!studentListLoading && filteredStudentList.length === 0" :description="rightStudentSearch ? '无搜索结果' : '暂无学生数据'" style="width: 100%;" />
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
          </div>
          <EmptyState v-if="!courseListLoading && filteredCourseList.length === 0" :description="rightCourseSearch ? '无搜索结果' : '暂无课程数据'" style="width: 100%;" />
        </div>
      </div>
      </template>
      </template>
    </div>
    <!-- 重置密码弹窗 -->
    <DialogCustome width="616px" height="366px" :visible="showResetPasswordDialog" confirmText="确定并复制密码" title="重置密码" @cancel="onDialogCancel" @confirm="onDialogConfirm" @close="onDialogCancel">
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

  </div>

  
</template>

<script>
import { getClassList, getClassDetail, getClassStudents, getClassCourses, searchStudents, toggleClassTop, setClassAlias, createClass } from '@/api'

export default { 
  name: 'Class',
  data() {
    return {
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
      showAddClassDialog: false,
      addClassStep: 1,
      newClassName: '',
      newClassDesc: '',
      newClassStartDate: new Date(),
      newClassEndDate: new Date(),
      createClassLoading: false,
      rightView: 'default',
      selectedCourse: null,
      courseDetailMock: {
        taskCount: 4,
        items: [
          {
            type: 'live', title: '管理学备课', status: 'ended',
            date: '2024-05-06', timeStart: '08:05', timeEnd: '13:36', progress: 50
          },
          {
            type: 'live', title: '管理学备课', status: 'streaming', streamedMinutes: 8,
            date: '2024-05-06', timeStart: '08:05', timeEnd: '13:36', progress: 100
          },
          {
            type: 'live', title: '管理学备课', status: 'upcoming', countdownMinutes: 8,
            date: '2024-05-06', timeStart: '08:05', timeEnd: '13:36', progress: 67
          },
          {
            type: 'pdf', title: '大学语文.pdf', size: '136MB',
            date: '2024-05-06', isRecent: true, completed: true
          },
          {
            type: 'group', title: '《钻金班课程》', expanded: true,
            children: [
              {
                type: 'pdf', title: '大学语文.pdf', size: '136MB',
                date: '2024-05-06', isRecent: true, completed: true
              },
              {
                type: 'live', title: '管理学导论', status: 'ended',
                date: '2024-05-07', timeStart: '09:00', timeEnd: '11:00', progress: 100
              },
              {
                type: 'group', title: '第一章：基础理论', expanded: false,
                children: [
                  {
                    type: 'live', title: '基础理论导论课', status: 'ended',
                    date: '2024-05-08', timeStart: '08:00', timeEnd: '10:00', progress: 80
                  },
                  {
                    type: 'pdf', title: '基础理论讲义.pdf', size: '56MB',
                    date: '2024-05-08', isRecent: false, completed: false
                  }
                ]
              },
              {
                type: 'group', title: '第二章：进阶实战', expanded: true,
                children: [
                  {
                    type: 'pdf', title: '进阶实战练习题.pdf', size: '28MB',
                    date: '2024-05-10', isRecent: true, completed: false
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  watch: {
    liveStatus() {
      this.fetchClassList()
    },
    rightTab(val) {
      if (val === 'student') this.fetchStudentList()
      else if (val === 'course') this.fetchCourseList()
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
    }
  },
  mounted() {
    this.fetchClassList()
  },
  methods: {
    _mapClassItem(item) {
      const sourceMap = { '1': '后台管理', '0': '教师自主' }
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
          this.fetchStudentList()
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
          const sourceMap = { '1': '后台管理', '0': '教师自主' }
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
    async fetchStudentList(keyword) {
      if (!this.selectedClassId) return
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
      this.rightStudentSearch = ''
      this.rightCourseSearch = ''
      this.studentList = []
      this.courseList = []
      if (this.selectedClassId) {
        this.fetchClassDetail(this.selectedClassId)
      }
      if (this.rightTab === 'student') {
        this.fetchStudentList()
      } else {
        this.rightTab = 'student'
      }
    },
    selectSearchResult(item) {
      this.selectedClassId = item.classId
      this.rightStudentSearch = ''
      this.rightCourseSearch = ''
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
      this.searchStudentList = []
      this.fetchClassList()
    },
    cancelSearch() {
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
      this.searchClassList = []
      this.searchStudentList = []
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
    handleStudentOptionsCommand(command, student) {
      if (command === 'resetPassword') {
        this.showResetPasswordDialog = true
      } else if (command === 'studentDetail') {
        this.currentStudentId = student.id
        this.showStudentDetail = true
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
      await new Promise(resolve => setTimeout(resolve, 300))
      const text = `您的新密码为${this.resetPasswordValue}`
      try {
        await navigator.clipboard.writeText(text)
        this.$message.success('密码已复制到剪贴板')
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        this.$message.success('密码已复制到剪贴板')
      }
      this.showResetPasswordDialog = false
      this.resetPasswordValue = ''
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
        if (this.newClassEndDate <= this.newClassStartDate) {
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
      if (this.newClassEndDate && val && this.newClassEndDate <= val) {
        this.newClassEndDate = null
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
      this.newClassEndDate = new Date()
    },
    handleCourseClick(item) {
      this.selectedCourse = item
      this.rightView = 'courseDetail'
    },
    toggleGroup(item) {
      this.$set(item, 'expanded', !item.expanded)
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
padding: 9px 30px 0 16px;
box-sizing: border-box;
position: relative;
cursor: pointer;
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
}
.app_container_box_right_top_top_name{
  font-weight: bold;
font-size: 16px;
color: #333333;
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
  padding: 15px;
  box-sizing: border-box;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 5px;
}
.app_container_box_right_last_list_detail_top_options{
  width: 20px;
  height: 4px;
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
  padding: 14px 21px 14px 16px ;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items:center;
  gap: 8px;
}
.cdi-card-in-group {
  background: rgba(202, 217, 255, 0.20);
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
</style>
