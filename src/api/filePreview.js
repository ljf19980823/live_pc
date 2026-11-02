import axios from 'axios'

const FILE_PREVIEW_API_URL = 'https://www.fjlsjy123.com/upgrade/file/fileView'

/** 永中在线预览：提交文件地址，取 obj 数组中的第一个预览链接。 */
export async function getFilePreviewUrl({ downloadUrl, fileName }, { signal } = {}) {
  const formData = new FormData()
  formData.append('downloadUrl', downloadUrl)
  formData.append('fileName', fileName || '立升教育')

  // 第三方接口使用独立请求，不携带直播端 Token 或套用直播端响应拦截器。
  const { data } = await axios.post(FILE_PREVIEW_API_URL, formData, {
    signal,
    timeout: 120000
  })

  if (!data || ![0, '0'].includes(data.code) || data.success === false) {
    throw new Error(data?.msg || '文件预览失败，请稍后重试')
  }

  const previewUrl = Array.isArray(data.obj) && typeof data.obj[0] === 'string'
    ? data.obj[0].trim()
    : ''

  try {
    if (!['http:', 'https:'].includes(new URL(previewUrl).protocol)) throw new Error()
  } catch (_) {
    throw new Error('未获取到有效的文件预览地址')
  }

  // 链接包含服务端签名，直接使用返回值，避免修改参数使签名失效。
  return previewUrl
}
