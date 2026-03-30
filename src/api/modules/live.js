import { get, post, put, del } from '@/utils/request'

/**
 * 直播间相关接口
 */

// 获取直播间列表
export const getLiveList = params => get('/live/list', params)

// 获取直播间详情
export const getLiveDetail = id => get(`/live/detail/${id}`)

// 创建直播间
export const createLive = data => post('/live/create', data)

// 更新直播间信息
export const updateLive = (id, data) => put(`/live/${id}`, data)

// 删除直播间
export const deleteLive = id => del(`/live/${id}`)

// 开始直播
export const startLive = id => post(`/live/${id}/start`)

// 结束直播
export const stopLive = id => post(`/live/${id}/stop`)

// 获取直播推流地址
export const getLivePushUrl = id => get(`/live/${id}/push-url`)

// 获取直播拉流地址
export const getLivePullUrl = id => get(`/live/${id}/pull-url`)

// 获取直播统计数据
export const getLiveStats = (id, params) => get(`/live/${id}/stats`, params)

// 获取观看记录
export const getWatchHistory = params => get('/live/watch/history', params)
