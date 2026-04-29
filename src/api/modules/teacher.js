import { get } from '@/utils/request'

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
