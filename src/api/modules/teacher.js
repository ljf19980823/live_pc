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
