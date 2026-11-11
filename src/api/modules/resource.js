import { get, post, upload } from '@/utils/request'

// Shared resources belong to a livebroadcast or a historical classroom (exactly one ID).
// 课件资源列表
export const getSharedResourceList = params => get('/edu/resource/list', params)
// 签名地址即将过期时，可用原件 ID 单独刷新访问地址。
export const getSharedResourceDetail = resourceId => get('/edu/resource/detail', { resourceId })
// 上传课件资源
export const uploadSharedResource = (formData, onProgress) => upload('/edu/resource/upload', formData, onProgress)
// 修改课件资源
export const updateSharedResource = formData => post('/edu/resource/update', formData)
// 删除课件资源
export const deleteSharedResource = data => post('/edu/resource/delete', data)

// 仅上传付费资料；业务保存时使用 data.bucket + '/' + data.objectKey，访问使用 data.filePath。
export const uploadPaidResource = (formData, onProgress) => upload('/edu/minio/upload?scene=PAID_RESOURCE', formData, onProgress)
