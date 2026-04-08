import { get } from '@/utils/request'

/**
 * 学生端接口
 */

// 获取学生消息列表
export const getStudentNoticeList = () => get('/edu/notice/information', { type: 1 })
