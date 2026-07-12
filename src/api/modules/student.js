import { get, post } from '@/utils/request'

/**
 * 学生端接口
 */

// 获取学生消息列表
export const getStudentNoticeList = () => get('/edu/notice/information', { type: 1 })

// 获取错题练习题目列表
export const getErrorExercises = (recordId) => get(`/edu/after/quiz/errorExercises/${recordId}`)

// 校验临时学生直播观看次数
export const checkTempStudentLiveRecord = (liveId) => post('/edu/sso/checkEnterLive', null, { params: { liveId } })

// 获取课后测验排行榜
export const getQuizLeaderboard = (examConfigId, classId) => get(`/edu/after/quiz/leaderboard/${examConfigId}/${classId}`)

// 获取全部课程列表
export const getAllCourseList = (params) => get('/edu/recentView/courses', params)

// 获取最近学习课程列表
export const getRecentCourseList = (params) => get('/edu/recentView/recent', params)

// 获取最近观看列表
export const getRecentViewList = (params) => get('/edu/recentView/view', params)
