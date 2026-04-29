import { get, post, upload } from '@/utils/request'

/**
 * 公共接口
 */

// 文件上传（单文件）
export const uploadFile = (formData, onProgress) => upload('/common/upload', formData, onProgress)

// 获取 OSS 上传签名
export const getOssSign = params => get('/common/oss/sign', params)

// 获取系统配置
export const getSystemConfig = () => get('/common/config')

// 获取省市区数据
export const getRegionData = params => get('/common/region', params)

// 发送通知
export const sendNotice = data => post('/common/notice', data)

// 获取轮播图列表
export const getCarouselList = () => get('/edu/carousel/list')
