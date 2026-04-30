import { get, post } from '@/utils/request'

/**
 * 教师端接口
 */

// 获取教师消息列表
export const getTeacherNoticeList = params => get('/edu/notice/information', params)

// 获取班级列表
export const getClassList = params => get('/edu/class/list', params)

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

// 获取课程详情（目录树）
export const getCourseDetail = params => get('/edu/course/detail', params)

// 重置学生密码
export const resetStudentPassword = data => post('/edu/class/students/resetPassword', data)

// 获取课时学习进度列表
export const getLessonProgress = params => get('/edu/course/lesson/progress', params)

// 获取课程维度学习进度列表（班级内所有学生对该课程的进度）
export const getCourseProgress = (courseId, classId) => get(`/edu/course/${courseId}/class/${classId}/students/progress`)
