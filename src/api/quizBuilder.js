import axios from 'axios'

import request, { getRequestErrorMessage, showNetworkErrorAlert } from '@/utils/t1Request'
import liveRequest from '@/utils/request'

// 与直播端 AfterClassTest 保持同一套教研云地址。开发环境继续连接测试库，
// 生产环境默认连接正式库；如需临时切换可通过环境变量覆盖。
const TEACHING_CLOUD_BASE_URL = process.env.VUE_APP_TEACHING_CLOUD_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://www.fjlsjy123.com/appBack'
    : 'https://www.fjlsjy123.com/appTest')
const LEGACY_TEACHING_CLOUD_BASE_URL = `${TEACHING_CLOUD_BASE_URL}/t1`

const teachingCloud = axios.create({
  baseURL: TEACHING_CLOUD_BASE_URL,
  timeout: 30000
})

// 纠错、资源篮等扩展功能不在直播端课后测接口中，仍沿用原 /t1 路径。
const legacyTeachingCloud = axios.create({
  baseURL: LEGACY_TEACHING_CLOUD_BASE_URL,
  timeout: 30000
})

function attachTeachingCloudToken(config) {
  const token = localStorage.getItem('teaching_cloud_token')

  config.headers = config.headers || {}

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

teachingCloud.interceptors.request.use(attachTeachingCloudToken)
legacyTeachingCloud.interceptors.request.use(attachTeachingCloudToken)

function handleTeachingCloudError(error) {
  showNetworkErrorAlert(error)
  error.message = getRequestErrorMessage(error)
  return Promise.reject(error)
}

teachingCloud.interceptors.response.use(
  response => response,
  handleTeachingCloudError
)
legacyTeachingCloud.interceptors.response.use(
  response => response,
  handleTeachingCloudError
)

function unwrapCloudData(payload) {
  if (Array.isArray(payload)) {
    return payload
  }
  return payload && (payload.data || payload.rows) ? payload.data || payload.rows : []
}

export async function getTeachingCloudOptions(url, params) {
  const response = await teachingCloud.get(url, { params })
  return unwrapCloudData(response.data)
}

export async function getTeachingCloudQuestions(url, params) {
  const response = await teachingCloud.get(url, { params })
  const payload = response.data || {}
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.rows)
      ? payload.rows
      : Array.isArray(payload.data)
        ? payload.data
        : []

  return {
    rows,
    total: Number(payload.total || rows.length)
  }
}

function unwrapLiveData(payload) {
  return payload && payload.data !== undefined ? payload.data : payload
}

/**
 * 与直播端一致：先换取教研云 token 和机构 ID，再访问教研云题库。
 */
export async function getAfterQuizIntehubToken() {
  const response = await liveRequest.get('/edu/after/quiz/intehub/getToken')
  const data = unwrapLiveData(response) || {}
  const token = String(data.token || '')
  const institutionId = String(data.institutionId || '')

  if (token) localStorage.setItem('teaching_cloud_token', token)
  if (institutionId) localStorage.setItem('teaching_cloud_institution_id', institutionId)

  return { token, institutionId }
}

/** 直播端专升本科目树。 */
export function getTeachingCloudUpgradeSubjectList(params) {
  return getTeachingCloudOptions('/home/getUnCompulsorySubjectList', params)
}

/** 提交云题库题目纠错 */
export async function addTeachingCloudError(data) {
  const response = await legacyTeachingCloud.post('/addTeachingCloudError', data)
  const payload = response.data || {}

  if (
    payload &&
    typeof payload === 'object' &&
    'code' in payload &&
    !['0', '200'].includes(String(payload.code))
  ) {
    throw new Error(payload.message || payload.msg || '提交纠错失败')
  }

  return payload
}

function normalizeTopicList(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.rows)) return payload.rows
  if (payload && Array.isArray(payload.records)) return payload.records
  if (payload && Array.isArray(payload.list)) return payload.list
  return []
}

export function getTopicAreaBusiness() {
  return request({
    url: '/v1/topic/getAreaBusiness',
    method: 'get'
  })
}

/** 获取展示中的业务赛道及 standardType，不包含科目子树。 */
export function getBusinessSubjectTree() {
  return request({
    url: '/v1/topic/getBusinessTracks',
    method: 'get'
  })
}

export function getBusinessSubjects(businessId) {
  return request({
    url: `/v1/topic/${encodeURIComponent(businessId)}/getSubjectTree`,
    method: 'get'
  })
}

export function getBusinessChapters(subjectId) {
  return request({ url: `/v1/topic/${encodeURIComponent(subjectId)}/chapters`, method: 'get' })
}

export function getBusinessKnowledgePoints(subjectId) {
  return request({ url: `/v1/topic/${encodeURIComponent(subjectId)}/knowledge-points`, method: 'get' })
}

export function getTopicTypeListByBusiness(businessId) {
  return request({
    url: `/v1/topic/${businessId}/getTypeListByBusiness`,
    method: 'get'
  })
}

export function getTopicSubjectListByType(typeId) {
  return request({
    url: `/v1/topic/${typeId}/getSubjectListByType`,
    method: 'get'
  })
}

export function getTopicSubjectPointTree(subjectId) {
  return request({
    url: `/v1/topic/${subjectId}/getSubjectPointTree`,
    method: 'get'
  })
}

export function getTopicSubjectPointList(subjectId) {
  return request({
    url: `/v1/topic/${subjectId}/getSubjectPointList`,
    method: 'get'
  })
}

export function getTopicKnowledgeList(subjectId, pointId) {
  return request({
    url: `/v1/topic/${subjectId}/${pointId}/getKnowledgeList`,
    method: 'get'
  })
}

export function getTopicQuestTypeTemplates(questType) {
  return request({
    url: `/v1/topic/${questType}/getQuestTypeTemplateList`,
    method: 'get'
  })
}

export function getTopicDictItemList(dictId) {
  return request({
    url: `/v1/topic/${dictId}/getDictItemList`,
    method: 'get'
  })
}

export function getTopicCompulsorySubjectList() {
  return request({
    url: '/v1/topic/getCompulsorySubjectList',
    method: 'get'
  })
}

export function getTopicUnCompulsorySubjectList() {
  return request({
    url: '/v1/topic/getUnCompulsorySubjectList',
    method: 'get'
  })
}

export function getTopicBookList(subjectId) {
  return request({
    url: `/v1/topic/${subjectId}/getBookList`,
    method: 'get'
  })
}

export function getTopicTypeList(typeId) {
  return request({
    url: `/v1/topic/${typeId}/getTypeList`,
    method: 'get'
  })
}

export function getTopicTypeListByBook(subjectId, bookId) {
  return request({
    url: `/v1/topic/${subjectId}/${bookId}/getTypeListByBook`,
    method: 'get'
  })
}

export function getTopicSubjectPointCompulsoryList(subjectId, level, bookId) {
  return request({
    url: `/v1/topic/${subjectId}/${level}/${bookId}/getSubjectPointCompulsoryList`,
    method: 'get'
  })
}

export function getTopicKnowledgeCompulsoryList(subjectId) {
  return request({
    url: `/v1/topic/${subjectId}/getKnowledgeCompulsoryList`,
    method: 'get'
  })
}

export async function getTopicQuestList(params) {
  const payload = await request({
    url: '/v1/topic/questList',
    method: 'get',
    params
  })
  const rows = normalizeTopicList(payload)

  return {
    rows,
    total: Number((payload && (payload.total || payload.totalCount)) || rows.length)
  }
}

/** 通用业务自有题库；章节使用 pointId 精确筛选，不复用专升本 treeId。 */
export async function getTopicGeneralQuestList(params) {
  const payload = await request({ url: '/v1/topic/getGeneralQuestList', method: 'get', params })
  const rows = normalizeTopicList(payload)
  const total = payload && (payload.total ?? payload.totalCount)
  return { rows, total: Number(total ?? rows.length) }
}

export async function getTopicCompulsoryQuestList(params) {
  const payload = await request({
    url: '/v1/topic/getCompulsoryQuestList',
    method: 'get',
    params
  })
  const rows = normalizeTopicList(payload)

  return {
    rows,
    total: Number((payload && (payload.total || payload.totalCount)) || rows.length)
  }
}

export async function addTopic(data) {
  if (!data || !data.institutionId) throw new Error('未获取到当前机构，请刷新页面后重试')

  const formData = new FormData()
  Object.keys(data || {}).forEach(key => {
    const value = data[key]
    if (value !== undefined && value !== null) formData.append(key, value)
  })

  const response = await teachingCloud.post('/quest/add', formData)
  const payload = response.data
  if (payload && typeof payload === 'object' && 'code' in payload && ![0, 200].includes(Number(payload.code))) {
    throw new Error(payload.message || payload.msg || '新增题目失败')
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export function addTopicByAi(data) {
  return request({
    url: '/v1/topic/addTopicByAi',
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 批量入库；接口请求体直接是 TopicDTO 数组。 */
export function addTopicByTeachingBatch(questions, { signal } = {}) {
  return request({
    url: '/v1/topic/addTopicByTeachingBatch',
    method: 'post',
    data: questions,
    signal,
    skipErrorMessage: true
  })
}

export async function addQuestByIntehub({ institutionId, subjectId, id }) {
  if (!institutionId) throw new Error('未获取到当前机构，请刷新页面后重试')
  if (!subjectId) throw new Error('请选择学段及科目至最后一级')
  if (!id) throw new Error('当前题目缺少题目 ID，无法加入自有题库')

  const response = await teachingCloud.post('/home/addQuestByIntehub', { institutionId, subjectId, id }, {
    headers: { 'Content-Type': 'application/json' }
  })
  const payload = response.data
  if (payload && typeof payload === 'object' && (
    ('code' in payload && ![0, 200].includes(Number(payload.code))) ||
    payload.success === false || payload.success === 'false'
  )) {
    throw new Error(payload.message || payload.msg || '题目加入自有题库失败')
  }
  return payload
}

export async function getTopicDetail(id) {
  if (!id) throw new Error('缺少题目 ID，无法获取题目详情')

  const response = await teachingCloud.get('/quest/getById', { params: { id } })
  const payload = response.data
  if (payload && typeof payload === 'object') {
    if (
      ('code' in payload && ![0, 200].includes(Number(payload.code))) ||
      payload.success === false || payload.success === 'false'
    ) {
      throw new Error(payload.message || payload.msg || '获取题目详情失败')
    }
    // /quest/getById 的详情放在 obj 中，统一解包后交给编辑器回显。
    if ('obj' in payload) return payload.obj
    if ('data' in payload) return payload.data
  }
  return payload
}

export async function updateTopic(data) {
  if (!data || !data.id) throw new Error('缺少题目 ID，无法编辑')
  if (!data.institutionId) throw new Error('未获取到当前机构，请刷新页面后重试')

  const formData = new FormData()
  Object.keys(data).forEach(key => {
    const value = data[key]
    if (value !== undefined && value !== null) formData.append(key, value)
  })

  const response = await teachingCloud.post('/quest/edit', formData)
  const payload = response.data
  if (payload && typeof payload === 'object' && 'code' in payload && ![0, 200].includes(Number(payload.code))) {
    throw new Error(payload.message || payload.msg || '编辑题目失败')
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export async function deleteTopic(data) {
  const id = data && data.id
  if (!id) throw new Error('缺少题目 ID，无法删除')

  const response = await teachingCloud.post('/quest/delete', { id }, {
    headers: { 'Content-Type': 'application/json' }
  })
  const payload = response.data
  if (payload && typeof payload === 'object' && 'code' in payload && ![0, 200].includes(Number(payload.code))) {
    throw new Error(payload.message || payload.msg || '删除题目失败')
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

// 旧组卷页保留原 GET 下载方式；业务导入弹框使用下方带目录快照的 POST 封装。
export function downloadTopicTemplate() {
  return request({ url: '/v1/topic/template', method: 'get', responseType: 'blob' })
}

export function downloadTopicCompulsoryTemplate(subjectId) {
  return request({ url: '/v1/topic/templateCompulsory', method: 'get', params: { subjectId }, responseType: 'blob' })
}

export function downloadTopicTemplateWithCatalog(data) {
  return request({
    url: '/v1/topic/template',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

export function downloadTopicCompulsoryTemplateWithCatalog(data) {
  return request({
    url: '/v1/topic/templateCompulsory',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

export function importTopicQuestions(data, params) {
  return request({
    url: '/v1/topic/import',
    method: 'post',
    data,
    params
  })
}

export function importTopicCompulsoryQuestions(data, params) {
  return request({
    url: '/v1/topic/importCompulsory',
    method: 'post',
    data,
    params
  })
}

export function downloadTopicGeneralTemplate(data) {
  return request({ url: '/v1/topic/templateWithoutType', method: 'post', data, responseType: 'blob' })
}

export function importTopicGeneralQuestions(data, params) {
  return request({ url: '/v1/topic/importWithoutType', method: 'post', data, params })
}

async function uploadLearnClassQuestions(url, formData) {
  const response = await teachingCloud.post(url, formData)
  const payload = response.data
  if (payload && typeof payload === 'object' && 'code' in payload && ![0, 200].includes(Number(payload.code))) {
    throw new Error(payload.message || payload.msg || '题目导入失败')
  }
  return payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
}

export function uploadNonCompulsoryLearnClassQuestions(formData) {
  return uploadLearnClassQuestions('/quest/uploadLearnClass', formData)
}

export function uploadCompulsoryLearnClassQuestions(formData) {
  return uploadLearnClassQuestions('/quest/uploadCompulsoryLearnClass', formData)
}

export function getQuestImportTemplateUrl({ fileName, downName }) {
  const query = new URLSearchParams({ fileName, downName }).toString()
  return `${TEACHING_CLOUD_BASE_URL.replace(/\/+$/, '')}/file/down?${query}`
}

export async function uploadTopicImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await teachingCloud.post('/file/uploadImg', formData)
  const payload = response.data
  if (payload && typeof payload === 'object' && (
    ('code' in payload && ![0, 200].includes(Number(payload.code))) ||
    payload.success === false || payload.success === 'false'
  )) {
    throw new Error(payload.message || payload.msg || '图片上传失败')
  }
  const result = payload && typeof payload === 'object'
    ? payload.obj ?? payload.data ?? payload
    : payload
  const imageUrl = typeof result === 'string'
    ? result
    : result && (result.src || result.url || result.data)

  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    throw new Error('图片上传接口未返回图片地址')
  }
  return imageUrl
}

export async function updateTeacherOneResource(data) {
  const response = await legacyTeachingCloud.get('/addTeacherOneResource', { params: data })
  const payload = response.data || {}

  if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 200 && payload.code !== 0) {
    throw new Error(payload.message || payload.msg || '资源篮操作失败')
  }

  return payload
}

/** 云题库资源篮数量 */
export async function getTeacherOneResourceTotal(params) {
  const response = await legacyTeachingCloud.get('/getTeacherOneResourceTotal', { params })
  const payload = response.data || {}

  if (payload && typeof payload === 'object' && 'code' in payload && payload.code !== 200 && payload.code !== 0) {
    throw new Error(payload.message || payload.msg || '获取资源篮数量失败')
  }

  const count = payload.count != null
    ? payload.count
    : (payload.data && typeof payload.data === 'object' ? payload.data.count : payload.data)

  return Number(count) || 0
}

/** 智能题库加入/取消资源篮：type 1 加入，0 取消 */
export function updateTopicResource(data) {
  return request({
    url: '/v1/topic/topicResource',
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 智能题库资源篮数量 */
export function getTopicResourceTotal() {
  return request({
    url: '/v1/topic/selectTopicResourceTotal',
    method: 'get'
  })
}

export function generateQuizQuestions(data) {
  return liveRequest({
    url: '/edu/after/quiz/generateQuest',
    method: 'post',
    timeout: 120000,
    data
  }).then(unwrapLiveData)
}

export function generatePartQuest(data) {
  return request({
    url: '/v1/topic/generatePartQuest',
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data
  })
}

/** 教师课后测 AI 出题（仅返回草稿，不发布、不落库） */
export function generateAfterQuizQuestions(data) {
  return liveRequest({
    url: '/edu/after/quiz/generateQuest',
    method: 'post',
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json'
    },
    skipErrorMessage: true,
    data
  }).then(unwrapLiveData)
}

/** 获取当前听记对应的科目，用于课后测 AI 出题条件回显 */
export function getMinutesSubject(minutesId) {
  return request({
    baseURL: process.env.VUE_APP_T1_AI_BASE_URL || process.env.VUE_APP_API_BASE_URL,
    url: `/v1/t1-ai/minutes/${encodeURIComponent(minutesId)}/subject`,
    method: 'get',
    skipErrorMessage: true
  })
}

export function getQuestListByKnowledge(data) {
  return teachingCloud.post('/home/getQuestListByKnowledge', data).then(response => {
    const payload = response.data || {}
    const result = payload && payload.data !== undefined ? payload.data : payload
    if (Array.isArray(result)) return result
    if (!result || typeof result !== 'object') return []
    return Object.keys(result).map(uniqueId => ({ uniqueId, questList: result[uniqueId] || [] }))
  })
}

export function getQuestListByKnowledgeByUpgrade(data) {
  return getQuestListByKnowledge(data)
}

export function publishAfterQuiz(data) {
  return liveRequest({
    url: '/edu/after/quiz/publish',
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    data
  }).then(unwrapLiveData)
}
