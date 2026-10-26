import { get, post, upload } from '@/utils/request'

// Shared resources belong to a livebroadcast or a historical classroom (exactly one ID).
// 课件资源列表
export const getSharedResourceList = params => get('/edu/resource/list', params)
// 上传课件资源
export const uploadSharedResource = (formData, onProgress) => upload('/edu/resource/upload', formData, onProgress)
// 修改课件资源
export const updateSharedResource = formData => post('/edu/resource/update', formData)
// 删除课件资源
export const deleteSharedResource = data => post('/edu/resource/delete', data)
