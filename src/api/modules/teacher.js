import axios from 'axios'
import { get, post, put, del } from '@/utils/request'
import { getToken } from '@/utils/auth'

/**
 * 教师端接口
 */

// 获取教师消息列表
export const getTeacherNoticeList = params => get('/edu/notice/information', params)

// 获取班级列表
export const getClassList = params => get('/edu/class/list', params)

// 获取直播班级列表
export const getLiveClassList = params => get('/edu/class/liveList', params)

// 获取班级详情
export const getClassDetail = classId => get(`/edu/class/detail/${classId}`)

// 获取班级学生列表
export const getClassStudents = (classId, params) => get(`/edu/class/${classId}/students`, params)

// 获取班级课程列表
export const getClassCourses = (classId, params) => get(`/edu/class/${classId}/courses`, params)

// 搜索学生（跨班级）
export const searchStudents = params => get('/edu/class/searchStudents', params)

// 获取班级公告列表
export const getClassNotices = classId => get(`/edu/class/${classId}/notices`)

// 班级置顶 / 取消置顶
export const toggleClassTop = classId => post(`/edu/class/${classId}/top`)

// 设置班级别名
export const setClassAlias = (classId, alias) => post(`/edu/class/${classId}/alias`, {}, { params: { alias } })

// 获取学生详情
export const getStudentDetail = (classId, studentId, params) => get(`/edu/class/${classId}/students/${studentId}`, params)

// 添加/更新学生备注
export const saveStudentNote = (classId, studentId, content) => post(`/edu/class/${classId}/students/${studentId}/note`, { content })

// 获取实时课堂列表
export const getLiveList = params => get('/edu/live/list', params)

// 获取历史课堂列表
export const getHistoryList = params => get('/edu/history/list', params)

// 创建班级
export const createClass = params => post('/edu/class/create', params)

// 修改班级信息（className / beginTime / endTime / describe 均可选）
export const updateClass = (classId, data) => put(`/edu/class/${classId}`, data)

// 删除班级
export const deleteClass = classId => post('/edu/class/remove', {}, { params: { classId } })

// 获取课程详情（目录树）
export const getCourseDetail = params => get('/edu/course/detail', params)

// 重置学生密码
export const resetStudentPassword = data => post('/edu/class/students/resetPassword', data)

// 创建课堂
export const createLiveClass = params => post('/edu/live/create', params)

// 创建阿里云互动课堂（固定域名）
export const createAliyunClass = params =>
  axios.post('https://live.fjlsjy123.com/api/v2/class/create', params, {
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Authorization': `Bearer ${getToken()}`
    }
  }).then(res => res.data)

// 获取课时学习进度列表
export const getLessonProgress = params => get('/edu/course/lesson/progress', params)

// 获取课程维度学习进度列表（班级内所有学生对该课程的进度）
export const getCourseProgress = (courseId, classId) => get(`/edu/course/${courseId}/class/${classId}/students/progress`)

// 获取课表列表
export const getScheduleList = params => get('/edu/schedule/list', params)

// 删除课堂
export const deleteLiveClass = liveId => del(`/edu/live/${liveId}`)

// 获取消息接收人列表（type: '0' 老师，'1' 学生）
export const getNoticeReceivers = params => get('/edu/notice/pc/receivers', params)

// 创建消息通知（multipart/form-data）
export const createNotice = data => post('/edu/notice/pc/create', data)

// 删除消息记录（type: '1' 已收消息，'2' 已发消息）
export const removeNotice = params => post('/edu/notice/remove', {}, { params })

// 获取直播详情
export const getLiveDetail = liveId => get(`/edu/live/detail/${liveId}`)

// 获取直播分享链接
export const getLiveShare = liveId => get(`/edu/live/share/${liveId}`)

// 更新直播信息（ifShare: '1' 开启分享, '2' 关闭分享）
export const updateLive = (liveId, data) => put(`/edu/live/${liveId}`, data)

// 获取我的教研组统计（groupCount / memberCount）
export const getTeachingGroupStats = () => get('/edu/teaching-group/my/stats')

// 获取我的教研组列表
export const getTeachingGroupList = () => get('/edu/teaching-group/my/list')

// 获取教研组详情
export const getTeachingGroupDetail = groupId => get(`/edu/teaching-group/detail/${groupId}`)

// 获取当前用户信息
export const getSsoInfo = () => get('/edu/sso/info')

// 更新当前用户信息（multipart/form-data）
export const updateSsoInfo = params => {
  const formData = new FormData()
  Object.keys(params).forEach(key => formData.append(key, params[key]))
  return post('/edu/sso/updateInfo', formData)
}

// 修改密码（跳过全局错误提示，由页面自行展示失败状态）
export const updatePassword = data => post('/edu/sso/updatePassword', data, { skipErrorMessage: true })

// 获取协议内容（type: user_agreement 用户协议 | privacy_policy 隐私协议）
export const getAgreement = type => get('/edu/recentView/getConfig', { type })

// 发送验证码（type: 3 修改手机号）
export const sendCode = data => post('/edu/sso/sendCode', data)

// 修改手机号
export const updatePhone = data => post('/edu/sso/updatePhone', data)

// 移除班级学生
export const removeClassStudent = (classId, studentId) => del(`/edu/class/${classId}/students/${studentId}`)

export const joinClass = params => post('/edu/class/join', {}, { params })

// 更新课时最近学习
export const updateRecentStudy = data => post('/edu/course/recentStudy', data)

// 更新课时学习进度
export const updateCourseProgress = data => post('/edu/course/progress', data)

// 获取教师课后测列表
export const getAfterQuizTeacherList = params => get('/edu/after/quiz/teacher/list', params)
// 获取课后测列表
export const getAfterQuizList = params => get('/edu/after/quiz/list', params)

// 获取考试题目详情（Path 参数 examId）
export const getExamDetail = examId => get(`/edu/after/quiz/quests/${examId}`)

// 提交单题答案（过程保存）
export const saveExamAnswer = data => post('/edu/after/quiz/answer/save', data)

// 提交考试（最终提交）
export const submitExam = data => post('/edu/after/quiz/submit', data)

// 课后测判分提交
export const gradeExam = data => post('/edu/after/quiz/grade', data)

// 获取课后测考试记录列表
export const getAfterQuizRecordList = params => get('/edu/after/quiz/record/list', params)

// 获取课后测做题记录详情（Path 参数 recordId）
export const getAfterQuizRecordDetail = recordId => get(`/edu/after/quiz/record/detail/${recordId}`)

// 获取课后测学生做题排行榜（Path 参数 examConfigId, classId）
export const getAfterQuizLeaderboard = (examConfigId, classId) => get(`/edu/after/quiz/leaderboard/${examConfigId}/${classId}`)

// 获取课后测未提交学生列表（Path 参数 examConfigId, classId）
export const getAfterQuizUnSubmitList = (examConfigId, classId) => get(`/edu/after/quiz/student/unSubmit/list/${examConfigId}/${classId}`)

// 收藏/取消收藏切换
export const collectToggle = data => post('/edu/recentView/collect/toggle', data)

// 获取资料列表（type: '1' 个人资料 '2' 教研组资料）
export const getBusinessFileList = params => get('/edu/businessFile/list', params)

// 新建文件夹 / 上传资料（multipart/form-data）
export const uploadBusinessFile = formData => post('/edu/businessFile/upload', formData)

// 重命名资料
export const renameBusinessFile = (id, name) => post('/edu/businessFile/rename', {}, { params: { id, name } })

// 删除资料
export const deleteBusinessFile = id => post('/edu/businessFile/delete', {}, { params: { id } })
