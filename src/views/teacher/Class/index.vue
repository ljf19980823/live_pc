<template>
  <div class="page-placeholder">
    <div class="app_container_box_left">
      <div class="app_container_box_left_top">
        <div class="app_top_left_text">我的班级</div>
        <img src="@/assets/images/home/add.png" class="app_top_left_icon" alt="">
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
            v-model="liveStatus"
            placeholder="请选择状态"
            clearable
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
          <div class="app_container_box_left_search_box_center_right">
            <img src="@/assets/images/class/sx.png" class="app_container_box_left_search_box_center_right_img" alt="">
          </div>
        </div>
      </div>
      <div  class="app_container_box_left_search_box" v-if="isOpenSearch==true">
        <div class="app_container_box_left_search_box_topBox">
           <div class="app_container_box_left_search_box_topBox_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <input ref="searchInput" v-model="leftSearchText" type="text" :placeholder="searchType === 'class' ? '搜索班级' : '搜索学生'">
            </div>
          </div>
          <div class="app_container_box_left_search_box_topBox_cancel" @click="isOpenSearch=false">取消</div>
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
          <img v-if="selectedClassIndex === index" src="@/assets/images/class/chooseYes.png" class="app_container_box_left_list_detail_chooseIcon" alt="">
          <div class="app_container_box_left_list_detail_title">{{ item.name }}</div>
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
       
        >
          <div class="app_container_box_left_list_detail_title"><span class="app_container_box_left_list_detail_title_textCompare">铂金</span>班</div>
          <div class="app_container_box_left_list_detail_count" v-if="searchType === 'student'"><span class="app_container_box_left_list_detail_title_textCompare">图图</span>老师</div>
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
            <div class="app_container_box_right_top_top_name">{{ currentClass.name }}</div>
            <div class="app_container_box_right_top_top_tag">剩余{{ currentClass.remainDays }}天</div>
          </div>
          <div class="app_container_box_right_top_top_right">
            <img src="@/assets/images/class/rl.png" class="app_container_box_right_top_top_right_rl" alt="">
            <img src="@/assets/images/class/options.png" class="app_container_box_right_top_top_right_options" alt="">
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
              <input type="text" placeholder="姓名/用户名/手机号">
            </div>
          </div>
          <div class="app_container_box_right_last_top_num">共{{ studentList.length }}个学生</div>
        </div>
        <div class="app_container_box_right_last_list">
          <div class="app_container_box_right_last_list_detail" v-for="(item, index) in studentList" :key="index">
            <div class="app_container_box_right_last_list_detail_top">
              <img src="@/assets/images/class/options.png" class="app_container_box_right_last_list_detail_top_options" alt="">
              <div class="app_container_box_right_last_list_detail_top_mess">
                <img src="@/assets/images/class/such.png" class="app_container_box_right_last_list_detail_top_mess_icon" alt="">
                <div class="app_container_box_right_last_list_detail_top_mess_mess">{{ item.name }}</div>
              </div>
            </div>
            <div class="app_container_box_right_last_list_detail_last">进班日期：{{ item.joinDate }}</div>
          </div>
        </div>
      </div>
      <!-- 课程tab列表 -->
      <div class="app_container_box_right_last" v-if="rightTab === 'course'">
        <div class="app_container_box_right_last_top">
          <div class="app_container_box_right_last_top_search">
            <img src="@/assets/images/class/s_icon.png" class="app_container_box_left_search_box_top_icon" alt="">
            <div class="app_container_box_left_search_box_top_input">
              <input type="text" placeholder="搜索课程">
            </div>
          </div>
          <div class="app_container_box_right_last_top_num">共{{ courseList.length }}个课程</div>
        </div>
        <div class="app_container_box_right_last_list">
          <div class="app_container_box_right_last_list_detailCourse" v-for="(item, index) in courseList" :key="index">
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
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script>
export default { 
  name: 'Class' ,
  data(){
    return {
      liveStatus:'',
      isOpenSearch: false,
      searchType: 'class',
      rightTab: 'student',
      selectedClassIndex: 0,
      classList: [
        {
          name: '中国近现代史',
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
      searchList:[],
      leftSearchText:''
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
.app_container_box_left_search_box_top_input input{
  width: 100%;
  color: #333333;
  font-size: 14px;
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
}
.app_container_box_left_search_box_center_right_img{
  width: 16px;
  height: 16px;
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
</style>
