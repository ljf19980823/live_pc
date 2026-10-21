const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { transformSync } = require('@babel/core')
const Vue = require('vue')

const root = path.resolve(__dirname, '..')
const compiled = new Map()
function load(file, dependencies, storage) {
  if (!compiled.has(file)) {
    const contents = fs.readFileSync(path.join(root, file), 'utf8')
    const source = file.endsWith('.vue') ? contents.match(/<script>([\s\S]*?)<\/script>/)[1] : contents
    compiled.set(file, transformSync(source, {
      babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
    }).code)
  }
  const exports = {}
  vm.runInNewContext(compiled.get(file), {
    exports, require: id => dependencies[id] || {}, localStorage: storage,
    process: { env: { NODE_ENV: 'test' } }, console, setTimeout, clearTimeout
  }, { filename: file })
  return exports
}

function setup({ respond = async () => ({ code: 0 }), institutionId = 'cloud-institution', authInstitutionId = 'auth-institution' } = {}) {
  const requests = [], messages = [], editors = []
  const storage = { getItem: key => key === 'teaching_cloud_institution_id' ? institutionId : '' }
  const api = load('src/api/quizBuilder.js', {
    axios: {
      create: () => ({
        interceptors: { request: { use() {} }, response: { use() {} } },
        post: async (url, data, config) => {
          requests.push({ url, data: { ...data }, config })
          return { data: await respond() }
        }
      })
    }
  }, storage)
  const component = load('src/views/teacher/publishTest/index.vue', {
    '@/api/quizBuilder': api,
    '@/utils/auth': { getAuthInfo: () => ({ institutionId: authInstitutionId }) }
  }, storage).default
  const page = new Vue({
    data: () => ({
      sourceTab: '云端题库', bankAddVisible: false, bankAddSubjectPath: [], bankAddQuestion: null, bankAddSaving: false,
      cloudSubjectPath: ['k12:小学', 'source-subject'], eduTypes: ['K9K12', '专升本'],
      k12SubjectOptions: [{ value: '小学', label: '小学', children: [
        { value: 'source-subject', label: '原科目' }, { value: 'target-k12', label: '目标科目' }
      ] }],
      zsbSubjectOptions: [{ value: 'category', label: '类别', children: [{ id: 'target-zsb', value: 'target-zsb', label: '目标科目' }] }]
    }),
    computed: {
      cloudSubjectOptions: component.computed.cloudSubjectOptions,
      bankAddSubject: component.computed.bankAddSubject
    },
    methods: {
      saveToSmartBank: component.methods.saveToSmartBank,
      closeCloudBankAdd: component.methods.closeCloudBankAdd,
      confirmCloudBankAdd: component.methods.confirmCloudBankAdd,
      openQuestionEditor: (...args) => editors.push(args)
    }
  })
  page.$message = Object.fromEntries(['success', 'warning', 'error'].map(type => [type, message => messages.push({ type, message })]))
  return { page, requests, messages, editors }
}

async function run() {
  for (const selection of [['k12:小学', 'target-k12'], ['zsb', 'zsb:category', 'target-zsb']]) {
    let complete
    const { page, requests, editors } = setup({ respond: () => new Promise(resolve => { complete = resolve }) })
    const question = { id: 'question-1', questId: 'legacy-id', subjectId: 'source-subject', name: '题干' }
    page.saveToSmartBank(question)
    assert.equal(page.bankAddVisible, true)
    assert.equal(page.bankAddSubjectPath.length, 0)
    assert.equal(editors.length, 0, '云端入库应打开科目选择弹窗')
    assert.equal(requests.length, 0, '点击入口不能直接发起入库')
    for (const invalid of [[], selection.slice(0, -1), ['k12:小学', 'missing-subject']]) {
      page.bankAddSubjectPath = invalid
      assert.equal(page.bankAddSubject, null)
      await page.confirmCloudBankAdd()
      assert.equal(requests.length, 0, '必须选择有效的最后一级科目')
    }
    page.bankAddSubjectPath = selection
    const pending = page.confirmCloudBankAdd()
    await page.confirmCloudBankAdd()
    let closed = false
    page.closeCloudBankAdd(() => { closed = true })
    assert.equal(closed, false, '提交时禁止关闭弹窗')
    assert.equal(requests.length, 1, '提交时防止重复请求')
    assert.equal(requests[0].url, '/home/addQuestByIntehub')
    assert.equal(requests[0].config.headers['Content-Type'], 'application/json')
    assert.deepEqual(requests[0].data, { institutionId: 'cloud-institution', subjectId: selection[selection.length - 1], id: 'question-1' })
    assert.equal(question._bankLoading, true)
    complete({ success: 'true' })
    await pending
    assert.equal(question._banked, true)
    assert.equal(question.hasJoin, '1')
    assert.equal(question._bankLoading, false)
    assert.equal(page.bankAddVisible, false)
    assert.equal(page.bankAddSubjectPath.length, 0)
    assert.deepEqual([...page.cloudSubjectPath], ['k12:小学', 'source-subject'], '弹窗选择不得改变列表筛选')
    page.saveToSmartBank(question)
    assert.equal(page.bankAddVisible, false, '已入库题目不能再次提交')
    page.$destroy()
  }
  console.log('PASS K9K12 / 专升本选择、精确 JSON 参数、重复提交保护及成功状态')

  for (const response of [{ code: 500, msg: '入库失败' }, { success: 'false', msg: '入库失败' }]) {
    const { page, requests, messages } = setup({ respond: async () => response })
    const question = { id: 'question-2' }
    page.saveToSmartBank(question)
    page.bankAddSubjectPath = ['k12:小学', 'target-k12']
    await page.confirmCloudBankAdd()
    assert.equal(requests.length, 1)
    assert.equal(page.bankAddVisible, true)
    assert.equal(page.bankAddSubject.value, 'target-k12')
    assert.equal(page.bankAddSaving, false)
    assert.equal(Boolean(question._banked), false)
    assert.equal(messages[messages.length - 1].message, '入库失败')
    page.closeCloudBankAdd()
    page.saveToSmartBank({ id: 'question-3' })
    assert.equal(page.bankAddSubjectPath.length, 0)
    page.$destroy()
  }
  console.log('PASS 失败保留弹窗供重试，重新打开清空科目选择')

  for (const authInstitutionId of ['', 'auth-institution']) {
    const { page, requests } = setup({ institutionId: '', authInstitutionId })
    page.saveToSmartBank({ id: 'question-4' })
    page.bankAddSubjectPath = ['k12:小学', 'target-k12']
    await page.confirmCloudBankAdd()
    assert.equal(requests.length, authInstitutionId ? 1 : 0)
    if (authInstitutionId) assert.equal(requests[0].data.institutionId, authInstitutionId)
    page.$destroy()
  }
  const { page, requests, editors } = setup()
  page.saveToSmartBank({ name: '缺少 ID' })
  page.bankAddSubjectPath = ['k12:小学', 'target-k12']
  await page.confirmCloudBankAdd()
  assert.equal(requests.length, 0)
  page.closeCloudBankAdd()
  page.sourceTab = 'AI出题'
  page.saveToSmartBank({ name: 'AI 题目', _questionContext: {} })
  assert.equal(page.bankAddVisible, false)
  assert.equal(editors[0][1], 'aiBank')
  assert.equal('_questionContext' in editors[0][0], false)
  page.$destroy()
  console.log('PASS 机构 / 题目 ID 校验及 AI 入库入口保持原流程')
}

run().catch(error => { console.error(error); process.exitCode = 1 })
