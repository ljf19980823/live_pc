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
          <div class="app_container_box_left_search_box_center_left">
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
          </div>
          <div class="app_container_box_left_search_box_center_left">
              <el-select
            v-model="liveStatus"
            placeholder="状态"
            style="width: 100%;"
          >
            <el-option
            
              key="1"
              label="未过期"
              value="1"
            />
             <el-option
            
              key="2"
              label="已过期"
              value="2"
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
      <div class="app_container_box_left_list" v-if="isOpenSearch==false">
        <div
          class="app_container_box_left_list_detail"
          :class="{ 'app_container_box_left_list_detail_active': selectedClassIndex === index }"
          v-for="(item, index) in classList"
          :key="index"
          @click="selectClass(index)"
        >
          <img v-if="item.pinned" src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">{{  item.name }}</div>
          <div class="app_container_box_left_list_detail_count">{{ item.count }}人</div>
        </div>
        <EmptyState v-if="classList.length === 0" description="暂无班级数据" />
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
      <!-- 无班级时空状态 -->
      <div v-if="classList.length === 0" class="app_container_box_right_empty">
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
        <div class="app_container_box_right_last_list">
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
                <img src="@/assets/images/class/such.png" class="app_container_box_right_last_list_detail_top_mess_icon" alt="">
                <div class="app_container_box_right_last_list_detail_top_mess_mess">{{ item.name }}</div>
              </div>
            </div>
            <div class="app_container_box_right_last_list_detail_last">进班日期：{{ item.joinDate }}</div>
          </div>
          <EmptyState v-if="filteredStudentList.length === 0" :description="rightStudentSearch ? '无搜索结果' : '暂无学生数据'" style="width: 100%;" />
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
        <div class="app_container_box_right_last_list">
          <div class="app_container_box_right_last_list_detailCourse" v-for="(item, index) in filteredCourseList" :key="index">
            <img src="@/assets/images/class/such.png" class="app_container_box_right_last_list_detailCourse_fm" alt="">
            <div class="app_container_box_right_last_list_detailCourse_name">{{ item.name }}</div>
            <div class="app_container_box_right_last_list_detailCourse_task">{{ item.taskCount }}个学习任务</div>
            <div class="app_container_box_right_last_list_detailCourse_jd">
              <div class="app_container_box_right_last_list_detailCourse_jd_box">
                <div class="app_container_box_right_last_list_detailCourse_jd_box_now" :style="{ width: item.progress + '%' }"></div>
              </div>
              <div class="app_container_box_right_last_list_detailCourse_jd_num">{{ item.progress }}%</div>
            </div>
          </div>
          <EmptyState v-if="filteredCourseList.length === 0" :description="rightCourseSearch ? '无搜索结果' : '暂无课程数据'" style="width: 100%;" />
        </div>
      </div>
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

    <StudentDetail :visible="showStudentDetail" :studentId="currentStudentId" @close="showStudentDetail = false" />



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
export default { 
  name: 'Class' ,
  data(){
    return {
      year:'',
      liveStatus:'1',
      isOpenSearch: false,
      showStudentDetail: false,
      currentStudentId: null,
      searchType: 'class',
      rightTab: 'student',
      selectedClassIndex: 0,
      classList: [
        {
          name: '中国近现代史',
          pinned: false,
          count: 657,
          remainDays: 30,
          startDate: '2025-06-09',
          endDate: '2026-03-30',
          source: '后台创建',
          students: [
            { name: '张伟', joinDate: '2025-03-26' },
            { name: '李娜娜', joinDate: '2025-04-01' },
            { name: '王小明', joinDate: '2025-04-10' },
            { name: '刘晓燕', joinDate: '2025-05-15' },
            { name: '陈思远', joinDate: '2025-06-02' },
            { name: '赵雨涵', joinDate: '2025-06-18' },
          ],
          courses: [
            { name: '立升备课-中国近现代史', taskCount: 12, progress: 55 },
            { name: '立升备课-马克思主义基本原理', taskCount: 10, progress: 80 },
            { name: '立升备课-大学语文', taskCount: 7, progress: 100 },
          ]
        },
        {
          name: '管理学精讲班',
          pinned: false,
          count: 312,
          remainDays: 120,
          startDate: '2025-09-01',
          endDate: '2026-06-30',
          source: '教师创建',
          students: [
            { name: '孙浩然', joinDate: '2025-07-07' },
            { name: '周婷婷', joinDate: '2025-08-20' },
            { name: '吴思琪', joinDate: '2025-09-01' },
            { name: '郑凯文', joinDate: '2025-09-05' },
          ],
          courses: [
            { name: '立升备课-管理学', taskCount: 8, progress: 20 },
            { name: '立升备课-思想道德与法治', taskCount: 9, progress: 40 },
          ]
        },
        {
          name: '马原理强化班',
          pinned: false,
          count: 98,
          remainDays: 5,
          startDate: '2024-12-01',
          endDate: '2025-06-01',
          source: '后台创建',
          students: [
            { name: '王芳', joinDate: '2024-12-01' },
            { name: '李强', joinDate: '2024-12-10' },
          ],
          courses: [
            { name: '立升备课-马克思主义基本原理', taskCount: 10, progress: 80 },
            { name: '立升备课-毛泽东思想概论', taskCount: 6, progress: 0 },
          ]
        },
        {
          name: '思想道德提升班',
          pinned: false,
          count: 455,
          remainDays: 200,
          startDate: '2025-10-15',
          endDate: '2026-09-15',
          source: '教师创建',
          students: [
            { name: '刘浩宇', joinDate: '2025-10-15' },
            { name: '陈晓雪', joinDate: '2025-10-20' },
            { name: '杨帆', joinDate: '2025-11-01' },
            { name: '黄晨曦', joinDate: '2025-11-08' },
            { name: '林子涵', joinDate: '2025-11-20' },
          ],
          courses: [
            { name: '立升备课-思想道德与法治', taskCount: 9, progress: 40 },
            { name: '立升备课-大学语文', taskCount: 7, progress: 100 },
          ]
        },
      ],
      leftSearchText: '',
      rightStudentSearch: '',
      rightCourseSearch: '',
      sortType: '',
      aliasDialogVisible: false,
      aliasInput: '',
      showResetPasswordDialog:false,
      resetPasswordValue: '',
      showAddClassDialog:false,
      addClassStep: 1,
      newClassName: '',
      newClassDesc: '',
      newClassStartDate: new Date(),
      newClassEndDate: new Date()
    }
  },
  computed: {
    currentClass() {
      return this.classList[this.selectedClassIndex]
    },
    studentList() {
      return this.currentClass ? this.currentClass.students : []
    },
    courseList() {
      return this.currentClass ? this.currentClass.courses : []
    },
    searchList() {
      if (!this.leftSearchText) return []
      const keyword = this.leftSearchText.toLowerCase()
      if (this.searchType === 'class') {
        return this.classList
          .filter(item => item.name.toLowerCase().includes(keyword))
          .map(item => ({ name: item.name, count: item.count }))
      } else {
        const results = []
        this.classList.forEach(cls => {
          cls.students.forEach(stu => {
            if (stu.name.toLowerCase().includes(keyword)) {
              results.push({ studentName: stu.name, className: cls.name })
            }
          })
        })
        return results
      }
    },
    filteredStudentList() {
      if (!this.rightStudentSearch) return this.studentList
      const keyword = this.rightStudentSearch.toLowerCase()
      return this.studentList.filter(item => item.name.toLowerCase().includes(keyword))
    },
    filteredCourseList() {
      if (!this.rightCourseSearch) return this.courseList
      const keyword = this.rightCourseSearch.toLowerCase()
      return this.courseList.filter(item => item.name.toLowerCase().includes(keyword))
    }
  },
  methods:{
    openSearch(){
      this.isOpenSearch = true
      this.$nextTick(() => {
        this.$refs.searchInput && this.$refs.searchInput.focus()
      })
    },
    selectClass(index) {
      this.selectedClassIndex = index
      this.rightTab = 'student'
      this.rightStudentSearch = ''
      this.rightCourseSearch = ''
    },
    selectSearchResult(item) {
      const keyword = this.leftSearchText
      if (this.searchType === 'class') {
        const idx = this.classList.findIndex(cls => cls.name === item.name)
        if (idx !== -1) this.selectedClassIndex = idx
        this.rightStudentSearch = ''
        this.rightCourseSearch = ''
      } else {
        const idx = this.classList.findIndex(cls => cls.name === item.className)
        if (idx !== -1) this.selectedClassIndex = idx
        this.rightTab = 'student'
        this.rightStudentSearch = keyword
        this.rightCourseSearch = ''
      }
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
    },
    cancelSearch() {
      this.isOpenSearch = false
      this.leftSearchText = ''
      this.searchType = 'class'
    },
    highlightKeyword(text, keyword) {
      if (!keyword || !text) return text
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const reg = new RegExp(`(${escaped})`, 'gi')
      return text.replace(reg, '<span style="color:#0049FF;">$1</span>')
    },
    handleOptionsCommand(command) {
      if (command === 'pin') {
        const cls = this.classList[this.selectedClassIndex]
        cls.pinned = !cls.pinned
        const pinnedList = this.classList.filter(item => item.pinned)
        const unpinnedList = this.classList.filter(item => !item.pinned)
        const newList = [...pinnedList, ...unpinnedList]
        const currentName = cls.name
        this.classList = newList
        this.selectedClassIndex = newList.findIndex(item => item.name === currentName)
        this.$message.success(cls.pinned ? '已置顶' : '已取消置顶')
      } else if (command === 'alias') {
        this.aliasInput = this.classList[this.selectedClassIndex].alias || ''
        this.aliasDialogVisible = true
      }
    },
    onDialogCancelAlias() {
      this.aliasDialogVisible = false
      this.aliasInput = ''
    },
    onDialogConfirmAlias() {
      this.classList[this.selectedClassIndex].alias = this.aliasInput.trim() || ''
      this.aliasDialogVisible = false
      this.$message.success(this.aliasInput.trim() ? '别名设置成功' : '别名已清除')
      this.aliasInput = ''
    },
    confirmAlias() {
      this.classList[this.selectedClassIndex].alias = this.aliasInput
      this.aliasDialogVisible = false
      this.$message.success('别名设置成功')
    },
    handleStudentOptionsCommand(command, student) {
      if (command === 'resetPassword') {
        this.showResetPasswordDialog = true
      } else if (command === 'studentDetail') {
        this.currentStudentId = student.id
        this.showStudentDetail = true
      }
    },
    handleStudentDetail(student){
       this.currentStudentId = student.id
        this.showStudentDetail = true
    },
    handleSortCommand(command) {
      this.sortType = command
      const list = [...this.classList]
      if (command === 'name_asc') {
        list.sort((a, b) => a.name.localeCompare(b.name))
      } else if (command === 'name_desc') {
        list.sort((a, b) => b.name.localeCompare(a.name))
      } else if (command === 'time_asc') {
        list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      } else if (command === 'time_desc') {
        list.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      }
      this.classList = list
      this.selectedClassIndex = 0
    },
    handleToAnnouncement(){
      this.$router.push('/announcement')
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
      // 模拟接口调用
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
    handleAddClass(){
      this.showAddClassDialog = true
    },
    onDialogCancelAdd(){
      if (this.addClassStep === 2) {
        this.addClassStep = 1
      } else {
        this._resetAddClassDialog()
      }
    },
    onDialogConfirmAdd(){
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
        const fmt = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''
        const startDate = fmt(this.newClassStartDate)
        const endDate = fmt(this.newClassEndDate)
        console.log('创建班级', { name: this.newClassName, desc: this.newClassDesc, startDate, endDate })
        this.$message.success('班级创建成功')
        this._resetAddClassDialog()
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
    onDialogCloseAdd(){
      this._resetAddClassDialog()
    },
    _resetAddClassDialog(){
      this.showAddClassDialog = false
      this.addClassStep = 1
      this.newClassName = ''
      this.newClassDesc = ''
      this.newClassStartDate = new Date()
      this.newClassEndDate = new Date()
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
</style>
