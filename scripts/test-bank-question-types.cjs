const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { transformSync } = require('@babel/core')

const filename = 'src/views/teacher/publishTest/index.vue'
const source = fs.readFileSync(path.resolve(__dirname, '..', filename), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]
const code = transformSync(source, {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
}).code

function setup(subjectRows) {
  const requests = []
  const templates = [{ id: 'template-1', name: '单选题', questType: '1' }]
  const api = {
    async getTeachingCloudOptions(url, params) {
      requests.push({ url, params })
      if (url === '/home/getCompulsorySubjectList') return [{ name: '小学', subjectList: [
        { id: 101, name: '语文', otherName: '小学语文', questType: '1,2,3,4,5' }
      ] }]
      if (url === '/home/getCompulsorySubjectAll') return subjectRows
      if (url === '/questTypeTemplate/getAll') return templates
      return []
    }
  }
  const exports = {}
  vm.runInNewContext(code, {
    exports, require: id => id === '@/api/quizBuilder' ? api : {},
    localStorage: { getItem: key => key === 'teaching_cloud_institution_id' ? 'institution-1' : '' },
    console, setTimeout, clearTimeout
  }, { filename })
  const page = {
    ...exports.default.methods,
    sourceTab: '云端题库', usesK12TopicOptions: false, usesZsbTopicOptions: false,
    isK12ChineseSubject: false, filterOptionsLoading: 0,
    k12: { subjectPath: ['小学', '101'], questType: 'old-template' },
    zsb: { subjectId: '201', questType: 'old-template' },
    subjectOptions: [{ id: '201', name: '高等数学', questType: '1,2,3,4,5' }],
    captureFilterRequest: () => () => true,
    normalizeFlatTree: rows => rows,
    normalizeTree: rows => rows
  }
  return { page, requests, templates }
}

async function run() {
  for (const rows of [[], [{ id: 999, name: '其他科目' }], [{ id: 101, name: '语文' }], [{ id: 101, questType: null }]]) {
    const { page, requests, templates } = setup(rows)
    await page.loadK12Base()
    assert.equal(page.k12SubjectOptions[0].children[0].questType, '1,2,3,4,5')
    await page.handleK12SubjectChange(['小学', '101'])
    const request = requests.find(item => item.url === '/questTypeTemplate/getAll')
    assert.ok(request, 'K9K12 选择科目后应根据树中的题型配置调用题型接口')
    assert.deepEqual({ ...request.params }, { id: '1,2,3,4,5', isHome: 1, institutionId: 'institution-1' })
    assert.equal(page.k12QuestTypeOptions, templates)
    assert.equal(page.k12.questType, '', '更换科目须清空旧题型选择')
    const count = requests.length
    await page.handleK12SubjectChange([])
    assert.equal(requests.length, count, '清空科目不得请求题型')
    assert.equal(page.k12QuestTypeOptions.length, 0)
    assert.equal(page.filterOptionsLoading, 0)
  }
  console.log('PASS K9K12 明细缺行 / 缺字段时从科目树补齐题型配置并请求模板')

  const { page, requests, templates } = setup([{ id: 101, questType: '1,5' }])
  await page.loadK12Base()
  await page.handleK12SubjectChange(['小学', '101'])
  assert.equal(requests.find(item => item.url === '/questTypeTemplate/getAll').params.id, '1,5')
  requests.length = 0
  await page.handleZsbSubjectChange('201')
  assert.equal(requests.find(item => item.url === '/questTypeTemplate/getAll').params.id, '1,2,3,4,5')
  assert.equal(page.questTypeOptions, templates)
  page.sourceTab = '自有题库'
  requests.length = 0
  await page.handleK12SubjectChange(['小学', '101'])
  assert.equal(requests.find(item => item.url === '/questTypeTemplate/getAll').params.isHome, 0)
  console.log('PASS 两类科目共用题型接口，明细有效配置与题库参数保留')
}

run().catch(error => { console.error(error); process.exitCode = 1 })
