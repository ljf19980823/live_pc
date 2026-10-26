const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const babelRequire = createRequire(require.resolve('@vue/cli-plugin-babel/package.json'))
const babel = babelRequire('@babel/core')
const compiler = require('vue/compiler-sfc')
const root = path.resolve(__dirname, '..')
const coursewarePath = 'src/components/ClassroomCourseware/index.vue'
const tick = () => new Promise(resolve => setImmediate(resolve))
const plain = value => JSON.parse(JSON.stringify(value))
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function loadModule(filename, mocks = {}, globals = {}) {
  let source = fs.readFileSync(path.join(root, filename), 'utf8')
  if (filename.endsWith('.vue')) source = compiler.parseComponent(source).script.content
  const { code } = babel.transformSync(source, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [babelRequire.resolve('@babel/plugin-transform-modules-commonjs')]
  })
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module, exports: module.exports, FormData, File, Blob, URL, setTimeout,
    console: { log() {}, error() {}, warn() {} },
    require(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      if (id.endsWith('.png')) return id
      if (id.endsWith('.vue')) return {}
      throw new Error('Unexpected import: ' + id)
    },
    ...globals
  }, { filename })
  return module.exports
}

const resource = loadModule('src/utils/resource.js')

function componentInstance(definition, props = {}, extras = {}) {
  const instance = { ...extras }
  for (const [name, config] of Object.entries(definition.props || {})) instance[name] = config.default
  Object.assign(instance, props, definition.data.call(instance))
  for (const [name, method] of Object.entries(definition.methods)) instance[name] = method.bind(instance)
  for (const [name, getter] of Object.entries(definition.computed || {})) {
    Object.defineProperty(instance, name, { get: () => getter.call(instance) })
  }
  return instance
}

function harness({ role = 'TEACHER', props = {}, implementations = {}, globals = {} } = {}) {
  const calls = []
  const messages = []
  const api = {}
  for (const name of ['getSharedResourceList', 'uploadSharedResource', 'updateSharedResource', 'deleteSharedResource', 'updateCourseProgress']) {
    api[name] = async (...args) => {
      calls.push({ name, args })
      if (implementations[name]) return implementations[name](...args)
      return name === 'getSharedResourceList' ? { data: { list: [], total: 0 } } : { data: true }
    }
  }
  const definition = loadModule(coursewarePath, {
    '@/utils/auth': { getUserInfo: () => ({ role }) },
    '@/utils/resource': resource,
    '@/api/modules/resource': api,
    '@/api/modules/teacher': { updateCourseProgress: api.updateCourseProgress }
  }, { fetch() { throw new Error('Unexpected download') }, window: {}, ...globals }).default
  const instance = componentInstance(definition, { historyLessonId: 'history-1', active: true, ...props }, {
    $store: { state: { user: { userInfo: { role } } } },
    $message: Object.fromEntries(['success', 'warning', 'error'].map(name => [name, text => messages.push({ name, text })])),
    $refs: {},
    $nextTick: fn => fn()
  })
  return { instance, definition, calls, messages }
}

test('resource IDs are exclusive, history takes precedence, and liveLessonId is never used', () => {
  assert.deepEqual(plain(resource.getResourceAssociation({ historyLessonId: ' h ', liveId: 'l' })), { historyLessonId: 'h' })
  assert.deepEqual(plain(resource.getResourceAssociation({ liveId: 123 })), { liveId: '123' })
  assert.equal(resource.getResourceAssociation({ liveLessonId: 'lesson-only' }), null)
  assert.equal(resource.getResourceAssociation({ liveId: ['ambiguous'] }), null)
})

test('shared icons preserve legacy precedence and support names and signed file URLs', () => {
  const icon = item => path.basename(resource.getResourceTypeIcon(item))
  assert.equal(icon({ title: 'old.pdf', resourceUrl: 'new.docx' }), 'PDF.png')
  assert.equal(icon({ title: 'unknown.foo', fileList: [{ fileName: '课件.DOCX' }] }), 'Doc.png')
  assert.equal(icon({ name: '课件.PPTX' }), 'PPT.png')
  assert.equal(icon({ fileUrl: 'https://files.test/%E8%AF%BE%E4%BB%B6.PDF?token=x#page=2' }), 'PDF.png')
  assert.equal(icon(null), 'other.png')
  assert.equal(icon({ resourceUrl: 'file.zip' }), 'Zip.png')
  assert.equal(resource.getFileExtension('https://files.test/file?token=a.pdf'), '')
})

test('progress accepts numeric values and clamps malformed or out-of-range values', () => {
  for (const [input, expected] of [[0, 0], [35.6, 36], ['88.2', 88], [100, 100], [123, 100], [-5, 0], [undefined, 0], ['NaN', 0]]) {
    assert.equal(resource.normalizeResourceProgress(input), expected)
  }
})

test('API adapters retain multipart data and use the four documented paths/methods', async () => {
  const calls = []
  const request = Object.fromEntries(['get', 'post', 'upload'].map(method => [method, (...args) => { calls.push({ method, args }); return Promise.resolve({}) }]))
  const api = loadModule('src/api/modules/resource.js', { '@/utils/request': request })
  const data = new FormData()
  data.append('name', '课件')
  await api.getSharedResourceList({ liveId: 'live-1', pageNum: 1, pageSize: 20 })
  await api.uploadSharedResource(data, () => {})
  await api.updateSharedResource(data)
  await api.deleteSharedResource({ historyLessonId: 'history-1', resourceId: 'r1' })
  assert.deepEqual(calls.map(call => [call.method, call.args[0]]), [
    ['get', '/edu/resource/list'], ['upload', '/edu/resource/upload'], ['post', '/edu/resource/update'], ['post', '/edu/resource/delete']
  ])
  assert.equal(calls[1].args[1], data)
  assert.equal(calls[2].args[1], data)
})

test('list reads paginated data and sends exactly one classroom ID', async () => {
  const { instance: page, calls } = harness({ props: { liveId: 'live-1' }, implementations: {
    getSharedResourceList: () => ({ data: { list: [{ id: 'r1', progressPercent: 67 }], total: 21 } })
  } })
  await page.fetchResources(2)
  assert.deepEqual(plain(calls[0].args[0]), { historyLessonId: 'history-1', pageNum: 2, pageSize: 20 })
  assert.equal(page.resources[0].progressPercent, 67)
  assert.equal(page.total, 21)
  assert.equal(page.loading, false)
})

test('student and visitor roles cannot invoke upload, rename, delete, or download directly', async () => {
  for (const role of ['STUDENT', 'VISITOR']) {
    const { instance: page, calls } = harness({ role })
    const item = { id: 'r1', name: '课件.pdf', fileUrl: 'https://files.test/file.pdf' }
    const file = new File(['content'], '课件.pdf')
    page.handleCommand('rename', item)
    page.openRename(item)
    page.renameTarget = item
    page.renameValue = '强制改名'
    page.deleteTarget = item
    await Promise.all([page.uploadFile(file), page.confirmRename(), page.confirmDelete(), page.downloadResource(item)])
    assert.equal(calls.length, 0)
    assert.equal(page.renameVisible, false)
    assert.equal(page.deleteVisible, false)
    assert.equal(page.isStudent, role === 'STUDENT')
  }
})

test('missing classroom information does not issue requests or enable management', async () => {
  const { instance: page, calls } = harness({ props: { historyLessonId: '', liveId: '' } })
  await page.fetchResources()
  await page.uploadFile(new File(['content'], '课件.pdf'))
  assert.equal(page.canManage(), false)
  assert.equal(calls.length, 0)
})

test('newest list request wins within a classroom and across classroom changes', async () => {
  const pending = []
  const { instance: page, definition } = harness({ implementations: {
    getSharedResourceList: () => { const request = deferred(); pending.push(request); return request.promise }
  } })
  const first = page.fetchResources(1)
  const second = page.fetchResources(2)
  pending[1].resolve({ data: { list: [{ id: 'page-2' }], total: 21 } })
  await second
  pending[0].resolve({ data: { list: [{ id: 'stale-page-1' }], total: 40 } })
  await first
  assert.equal(page.resources[0].id, 'page-2')
  const oldClass = page.fetchResources(1)
  page.historyLessonId = 'history-2'
  definition.watch.contextKey.call(page)
  assert.equal(page.resources.length, 0)
  pending[3].resolve({ data: { list: [{ id: 'new-class' }], total: 1 } })
  await tick()
  pending[2].resolve({ data: { list: [{ id: 'old-class' }], total: 1 } })
  await oldClass
  assert.equal(page.resources[0].id, 'new-class')
  assert.equal(page.loading, false)
})

test('list failures support retry and entering the tab refreshes the first page', async () => {
  let fail = true
  const { instance: page, definition, calls } = harness({ implementations: {
    getSharedResourceList: () => { if (fail) throw new Error('offline'); return { data: { list: [], total: 0 } } }
  } })
  await page.fetchResources()
  assert.equal(page.loadError, true)
  assert.equal(page.loading, false)
  fail = false
  definition.watch.active.handler.call(page, true)
  await tick()
  assert.equal(page.loadError, false)
  assert.equal(calls.at(-1).args[0].pageNum, 1)
})

test('multi-file uploads keep failed files for retry and use file + association only', async () => {
  const pending = []
  const { instance: page, calls } = harness({ implementations: {
    uploadSharedResource: (data, onProgress) => { const request = deferred(); pending.push(request); onProgress(45); return request.promise }
  } })
  const first = page.uploadFile(new File(['one'], '第一份.pdf'))
  const second = page.uploadFile(new File(['two'], '第二份.docx'))
  assert.equal(page.uploading, true)
  assert.equal(page.uploadQueue[0].percent, 45)
  assert.deepEqual([...calls[0].args[0].keys()], ['file', 'historyLessonId'])
  assert.equal(page.beforeUpload({ size: 600 * 1024 * 1024 + 1 }), false)
  pending[0].resolve({ data: { id: 'r1' } })
  await first
  pending[1].reject(new Error('failed'))
  await second
  await tick()
  assert.equal(page.uploading, false)
  assert.equal(page.uploadQueue.length, 1)
  const failed = page.uploadQueue[0]
  assert.equal(failed.file.name, '第二份.docx')
  assert.equal(failed.status, 'error')
  assert.equal(calls.at(-1).args[0].pageNum, 1)
  const retry = page.uploadFile(failed.file, failed)
  await page.uploadFile(failed.file, failed)
  assert.equal(pending.length, 3)
  pending[2].resolve({ data: { id: 'r2' } })
  await retry
  assert.equal(page.uploadQueue.length, 0)
})

test('rename trims the title, preserves an existing extension, blocks duplicate saves, and retains failed edits', async () => {
  const request = deferred()
  const { instance: page, calls } = harness({ implementations: { updateSharedResource: () => request.promise } })
  page.openRename({ id: 'r1', name: '原名.PDF', fileUrl: 'https://files.test/file.pdf?signature=1' })
  page.renameValue = '   新课件   '
  const save = page.confirmRename()
  await page.confirmRename()
  const update = calls.find(call => call.name === 'updateSharedResource').args[0]
  assert.deepEqual([...update.entries()], [['resourceId', 'r1'], ['name', '新课件.PDF'], ['historyLessonId', 'history-1']])
  assert.equal(calls.length, 1)
  request.reject(new Error('failed'))
  await save
  assert.equal(page.renameVisible, true)
  assert.equal(page.renameValue, '   新课件   ')
  assert.equal(page.renaming, false)
  page.openRename({ id: 'r2', name: '接口默认无后缀名称', fileUrl: 'https://files.test/file.pdf' })
  assert.equal(page.renameSuffix, '')
  page.renameValue = '   '
  await page.confirmRename()
  assert.equal(calls.length, 1)
})

test('successful rename refreshes the current page without sending unrelated fields', async () => {
  const { instance: page, calls } = harness()
  page.pageNum = 2
  page.openRename({ id: 'r1', name: '原名', resourceUrl: 'file.docx' })
  page.renameValue = '新名'
  await page.confirmRename()
  assert.equal(page.renameVisible, false)
  assert.deepEqual([...calls[0].args[0].entries()], [['resourceId', 'r1'], ['name', '新名'], ['historyLessonId', 'history-1']])
  assert.equal(calls[1].args[0].pageNum, 2)
})

test('delete uses JSON and goes back one page when removing the final item', async () => {
  const request = deferred()
  const { instance: page, calls } = harness({ implementations: { deleteSharedResource: () => request.promise } })
  page.resources = [{ id: 'r21' }]
  page.pageNum = 2
  page.handleCommand('delete', page.resources[0])
  const remove = page.confirmDelete()
  await page.confirmDelete()
  assert.equal(calls.length, 1)
  assert.deepEqual(plain(calls[0].args[0]), { historyLessonId: 'history-1', resourceId: 'r21' })
  request.resolve({ data: true })
  await remove
  assert.equal(page.deleteVisible, false)
  assert.equal(calls[1].args[0].pageNum, 1)
})

test('delete false results keep the confirmation open and do not remove the item', async () => {
  const { instance: page, calls } = harness({ implementations: { deleteSharedResource: () => ({ data: false }) } })
  page.resources = [{ id: 'r1' }]
  page.handleCommand('delete', page.resources[0])
  await page.confirmDelete()
  assert.equal(page.deleteVisible, true)
  assert.equal(page.resources.length, 1)
  assert.equal(page.deleting, false)
  assert.equal(calls.length, 1)
})

test('late upload and rename completions cannot update a different classroom', async () => {
  const upload = deferred(), rename = deferred()
  const { instance: page, definition, calls, messages } = harness({ props: { active: false }, implementations: {
    uploadSharedResource: () => upload.promise,
    updateSharedResource: () => rename.promise
  } })
  const uploading = page.uploadFile(new File(['content'], '原课堂.pdf'))
  page.openRename({ id: 'r1', name: '原课件' })
  page.renameValue = '新名称'
  const renaming = page.confirmRename()
  page.historyLessonId = 'history-2'
  definition.watch.contextKey.call(page)
  upload.resolve({ data: { id: 'old-resource' } })
  rename.resolve({ data: {} })
  await Promise.all([uploading, renaming])
  assert.equal(page.uploadQueue.length, 0)
  assert.equal(page.resources.length, 0)
  assert.equal(messages.length, 0)
  assert.equal(calls.length, 2)
})

test('preview uses fileUrl and routes documents, images, videos, audio, and unsupported files', async () => {
  const { instance: page } = harness({ role: 'STUDENT' })
  for (const [type, extension, expected] of [['1', 'pdf', 'document'], ['2', 'mp4', 'video'], ['3', 'mp3', 'audio'], ['4', 'png', 'image'], ['5', 'zip', 'document']]) {
    const fileUrl = `https://files.test/课件.${extension}?token=1`
    await page.openResource({ id: 'r1', type, name: '课件', fileUrl, resourceUrl: 'wrong-url' })
    assert.equal(page.previewKind, expected)
    assert.equal(page.previewFile.path, fileUrl)
    assert.equal(page.previewFile.extension, extension)
    assert.equal(page.previewFile.name, '课件.' + extension)
    page.closePreview()
    assert.equal(page.previewFile, null)
  }
})

test('student non-video previews report completion with independent resource IDs and mapped lesson types', async () => {
  for (const [type, mappedType, extension] of [['1', '7', 'pdf'], ['3', '6', 'mp3'], ['4', '5', 'png'], ['5', '7', 'zip'], ['6', '8', 'html']]) {
    const { instance: page, calls } = harness({ role: 'STUDENT', globals: {
      window: { electronAPI: { openInAppUrl: async () => true } }
    } })
    const item = { id: 'resource-' + type, type, name: '课件', fileUrl: 'https://files.test/file.' + extension, progressPercent: 0 }
    page.resources = [item]
    await page.openResource(item)
    const reports = calls.filter(call => call.name === 'updateCourseProgress')
    assert.equal(reports.length, 1)
    assert.deepEqual(plain(reports[0].args[0]), { lessonId: item.id, type: mappedType, percent: '100' })
    assert.equal(calls[1].name, 'getSharedResourceList')
    assert.deepEqual(plain(calls[1].args[0]), { historyLessonId: 'history-1', pageNum: 1, pageSize: 20 })
  }
})

test('preview opens without waiting for progress persistence and a stale list cannot undo confirmed progress', async () => {
  const request = deferred()
  const item = { id: 'r1', type: '1', name: '课件', fileUrl: 'https://files.test/file.pdf', progressPercent: 20 }
  const { instance: page } = harness({ role: 'STUDENT', implementations: {
    updateCourseProgress: () => request.promise,
    getSharedResourceList: () => ({ data: { list: [item], total: 1 } })
  } })
  page.resources = [item]
  const opening = page.openResource(item)
  assert.equal(page.previewKind, 'document')
  assert.equal(page.resources[0].progressPercent, 20)
  request.resolve({ data: true })
  await opening
  assert.equal(page.resources[0].progressPercent, 100)
})

test('PDF progress success with an empty data payload refreshes the list and marks completion', async () => {
  for (const response of [{ code: 200, message: '更新成功', data: null }, { code: 200, message: '更新成功' }]) {
    const request = deferred()
    const item = { id: 'pdf-1', type: '1', name: '普通PDF.pdf', fileUrl: 'https://files.test/file.pdf', progressPercent: 0 }
    const { instance: page, calls, messages } = harness({ role: 'STUDENT', implementations: {
      updateCourseProgress: () => request.promise,
      getSharedResourceList: () => ({ data: { list: [{ ...item, name: '刷新后的PDF.pdf' }], total: 21 } })
    } })
    page.resources = [item]
    page.pageNum = 2
    const opening = page.openResource(item)
    assert.equal(page.previewKind, 'document')
    request.resolve(response)
    await opening
    assert.deepEqual(calls.map(call => call.name), ['updateCourseProgress', 'getSharedResourceList'])
    assert.deepEqual(plain(calls[0].args[0]), { lessonId: 'pdf-1', type: '7', percent: '100' })
    assert.equal(calls[1].args[0].pageNum, 2)
    assert.equal(page.resources[0].name, '刷新后的PDF.pdf')
    assert.equal(page.resources[0].progressPercent, 100)
    assert.equal(messages.length, 0)
    page.closePreview()
    await page.openResource(page.resources[0])
    assert.equal(calls.length, 2)
  }
})

test('videos report only on close, keep fractional saved progress, and never lower it', async () => {
  const item = { id: 'video-1', type: '2', name: '视频', fileUrl: 'https://files.test/file.mp4', progressPercent: 70.75 }
  const { instance: page, calls } = harness({ role: 'STUDENT', implementations: {
    getSharedResourceList: () => ({ data: { list: [item], total: 1 } })
  } })
  page.resources = [item]
  await page.openResource(item)
  assert.equal(calls.length, 0)
  await page.closeVideoPreview(70.6, 10)
  assert.equal(calls.length, 0)
  await page.openResource(item)
  await page.closeVideoPreview(80.555, 20)
  assert.deepEqual(plain(calls[0].args[0]), { lessonId: 'video-1', type: '4', percent: '80.56' })
  assert.equal(page.resources[0].progressPercent, 80.56)
  assert.equal(page.previewFile, null)
  await page.closeVideoPreview(90)
  assert.equal(calls.filter(call => call.name === 'updateCourseProgress').length, 1)
})

test('unplayed videos do not report and video percentages stay in the documented range', async () => {
  const item = { id: 'video', type: '2', fileUrl: 'https://files.test/file.mp4', progressPercent: 0 }
  const { instance: page, calls } = harness({ role: 'STUDENT' })
  for (const percent of [undefined, -5, NaN, Infinity]) {
    await page.openResource(item)
    await page.closeVideoPreview(percent)
  }
  assert.equal(calls.length, 0)
  await page.openResource(item)
  await page.closeVideoPreview(120)
  assert.equal(calls[0].args[0].percent, '100')
})

test('teachers and visitors can preview every type without sending progress requests', async () => {
  for (const role of ['TEACHER', 'VISITOR']) {
    const { instance: page, calls } = harness({ role, globals: { window: { open() {} } } })
    for (const type of ['1', '2', '3', '4', '5', '6']) {
      await page.openResource({ id: 'r' + type, type, fileUrl: 'https://files.test/file', progressPercent: 0 })
      await page.closeVideoPreview(60)
    }
    assert.equal(calls.length, 0)
  }
})

test('missing IDs/addresses, unknown resource types, and completed resources do not report progress', async () => {
  const { instance: page, calls } = harness({ role: 'STUDENT' })
  for (const item of [
    { type: '1', fileUrl: 'https://files.test/file.pdf' },
    { id: 'r1', type: '1' },
    { id: 'r2', type: 'unknown', fileUrl: 'https://files.test/file.pdf' },
    { id: 'r3', type: '1', fileUrl: 'https://files.test/file.pdf', progressPercent: 100 }
  ]) await page.openResource(item)
  assert.equal(calls.length, 0)
})

test('links report only after valid opening; rejected, failed, and obsolete opens do not report', async () => {
  const item = { id: 'link-1', type: '6', fileUrl: 'https://files.test/link', progressPercent: 0 }
  for (const openInAppUrl of [async () => false, async () => { throw new Error('failed') }]) {
    const { instance: page, calls } = harness({ role: 'STUDENT', globals: { window: { electronAPI: { openInAppUrl } } } })
    await page.openResource(item)
    await page.openResource({ ...item, fileUrl: 'javascript:invalid' })
    assert.equal(calls.length, 0)
  }
  const opening = deferred()
  const { instance: page, definition, calls } = harness({ role: 'STUDENT', props: { active: false }, globals: {
    window: { electronAPI: { openInAppUrl: () => opening.promise } }
  } })
  const viewing = page.openResource(item)
  page.historyLessonId = 'history-2'
  definition.watch.contextKey.call(page)
  opening.resolve(true)
  await viewing
  assert.equal(calls.length, 0)
})

test('duplicate previews share a serial queue and persist a completed resource only once', async () => {
  const request = deferred()
  const item = { id: 'r1', type: '1', fileUrl: 'https://files.test/file.pdf', progressPercent: 0 }
  const { instance: page, calls } = harness({ role: 'STUDENT', implementations: { updateCourseProgress: () => request.promise } })
  const first = page.openResource(item)
  const second = page.openResource(item)
  await tick()
  assert.equal(calls.length, 1)
  request.resolve({ data: true })
  await Promise.all([first, second])
  assert.equal(calls.filter(call => call.name === 'updateCourseProgress').length, 1)
})

test('increasing video updates serialize and a queued lower progress cannot overwrite them', async () => {
  const pending = []
  const item = { id: 'r1', type: '2', fileUrl: 'https://files.test/file.mp4', progressPercent: 0 }
  const { instance: page, calls } = harness({ role: 'STUDENT', implementations: {
    updateCourseProgress: () => { const request = deferred(); pending.push(request); return request.promise }
  } })
  const first = page.reportResourceProgress(item, 30)
  const second = page.reportResourceProgress(item, 50)
  const third = page.reportResourceProgress(item, 40)
  await tick()
  assert.equal(pending.length, 1)
  pending[0].resolve({ data: true })
  await first
  await tick()
  assert.equal(pending.length, 2)
  pending[1].resolve({ data: true })
  await Promise.all([second, third])
  assert.deepEqual(calls.filter(call => call.name === 'updateCourseProgress').map(call => call.args[0].percent), ['30', '50'])
})

test('failed progress saves leave preview usable and can be retried on the next view', async () => {
  for (const failure of [false, new Error('offline')]) {
    let fail = true
    const item = { id: 'r1', type: '1', fileUrl: 'https://files.test/file.pdf', progressPercent: 20 }
    const { instance: page, calls } = harness({ role: 'STUDENT', implementations: {
      updateCourseProgress: () => {
        if (fail && failure instanceof Error) throw failure
        return { data: fail ? failure : true }
      },
      getSharedResourceList: () => ({ data: { list: [item], total: 1 } })
    } })
    page.resources = [item]
    await page.openResource(item)
    assert.equal(page.previewKind, 'document')
    assert.equal(page.resources[0].progressPercent, 20)
    assert.equal(calls.length, 1)
    fail = false
    await page.openResource(item)
    assert.equal(page.resources[0].progressPercent, 100)
    assert.equal(calls.filter(call => call.name === 'updateCourseProgress').length, 2)
  }
})

test('successful progress saves refresh the current page and keep pagination intact', async () => {
  const item = { id: 'r21', type: '4', fileUrl: 'https://files.test/file.png', progressPercent: 0 }
  const { instance: page, calls } = harness({ role: 'STUDENT', implementations: {
    getSharedResourceList: () => ({ data: { list: [item], total: 21 } })
  } })
  page.pageNum = 2
  page.resources = [item]
  await page.openResource(item)
  assert.equal(calls[1].args[0].pageNum, 2)
  assert.equal(page.pageNum, 2)
  assert.equal(page.resources[0].progressPercent, 100)
})

test('classroom changes discard pending preview state and queued old progress requests', async () => {
  const request = deferred()
  const old = { id: 'old', type: '1', fileUrl: 'https://files.test/old.pdf', progressPercent: 0 }
  const current = { id: 'new', type: '1', fileUrl: 'https://files.test/new.pdf', progressPercent: 5 }
  const { instance: page, definition, calls } = harness({ role: 'STUDENT', implementations: {
    updateCourseProgress: () => request.promise,
    getSharedResourceList: () => ({ data: { list: [current], total: 1 } })
  } })
  const first = page.openResource(old)
  const second = page.openResource(old)
  await tick()
  page.historyLessonId = 'history-2'
  definition.watch.contextKey.call(page)
  await tick()
  request.resolve({ data: true })
  await Promise.all([first, second])
  assert.equal(page.resources[0].id, 'new')
  assert.equal(page.resources[0].progressPercent, 5)
  assert.equal(calls.filter(call => call.name === 'getSharedResourceList').length, 1)
  assert.equal(calls.filter(call => call.name === 'updateCourseProgress').length, 1)
  await page.openResource({ id: 'video', type: '2', fileUrl: 'https://files.test/file.mp4' })
  page.historyLessonId = 'history-3'
  definition.watch.contextKey.call(page)
  await page.closeVideoPreview(80)
  assert.equal(calls.filter(call => call.name === 'updateCourseProgress').length, 1)
})

test('progress requests for a shared resource remain serialized across classroom changes', async () => {
  const pending = []
  const item = { id: 'shared', type: '2', fileUrl: 'https://files.test/file.mp4', progressPercent: 0 }
  const { instance: page, definition, calls } = harness({ role: 'STUDENT', props: { active: false }, implementations: {
    updateCourseProgress: () => { const request = deferred(); pending.push(request); return request.promise }
  } })
  const first = page.reportResourceProgress(item, 30)
  await tick()
  page.historyLessonId = 'history-2'
  definition.watch.contextKey.call(page)
  const second = page.reportResourceProgress(item, 60)
  await tick()
  assert.equal(pending.length, 1)
  pending[0].resolve({ data: true })
  await first
  await tick()
  assert.equal(pending.length, 2)
  pending[1].resolve({ data: true })
  await second
  assert.deepEqual(calls.filter(call => call.name === 'updateCourseProgress').map(call => call.args[0].percent), ['30', '60'])
})

test('role changes and component destruction cancel queued reporting and subsequent list updates', async () => {
  for (const stop of ['role', 'destroy']) {
    const request = deferred()
    const item = { id: 'r1', type: '1', fileUrl: 'https://files.test/file.pdf', progressPercent: 0 }
    const { instance: page, definition, calls } = harness({ role: 'STUDENT', implementations: {
      updateCourseProgress: () => request.promise
    } })
    page.resources = [item]
    const first = page.openResource(item)
    const second = page.openResource(item)
    await tick()
    if (stop === 'role') page.$store.state.user.userInfo.role = 'TEACHER'
    else definition.beforeDestroy.call(page)
    request.resolve({ data: true })
    await Promise.all([first, second])
    assert.equal(calls.length, 1)
    assert.equal(page.resources[0].progressPercent, 0)
  }
})

test('teacher downloads preserve the suffix, block duplicates, and fall back for cross-origin storage', async () => {
  const request = deferred()
  const saved = []
  let crossOriginFailure = false
  const { instance: page } = harness({ globals: {
    fetch: () => crossOriginFailure ? Promise.reject(new TypeError('CORS')) : request.promise,
    URL: { createObjectURL: () => 'blob:download', revokeObjectURL() {} },
    setTimeout: fn => fn(),
    document: {
      createElement: () => ({ click() { saved.push({ href: this.href, name: this.download, target: this.target }) }, remove() {} }),
      body: { appendChild() {} }
    }
  } })
  const item = { id: 'r1', name: '课件无后缀', fileUrl: 'https://files.test/file.pdf?token=1' }
  const downloading = page.downloadResource(item)
  await page.downloadResource(item)
  assert.equal(page.downloadingIds.length, 1)
  request.resolve({ ok: true, blob: () => new Blob(['file']) })
  await downloading
  assert.deepEqual(saved, [{ href: 'blob:download', name: '课件无后缀.pdf', target: undefined }])
  crossOriginFailure = true
  await page.downloadResource(item)
  assert.deepEqual(saved[1], { href: item.fileUrl, name: '课件无后缀.pdf', target: '_blank' })
  assert.equal(page.downloadingIds.length, 0)
})

test('playback entrances distinguish history record IDs from livebroadcast IDs', () => {
  const parser = babelRequire('@babel/parser')
  const generate = babelRequire('@babel/generator').default
  for (const filename of ['src/views/teacher/Online/index.vue', 'src/views/Student/Online/index.vue', 'src/views/teacher/LiveClass/index.vue']) {
    const { script } = compiler.parseComponent(fs.readFileSync(path.join(root, filename), 'utf8'))
    const ast = parser.parse(script.content, { sourceType: 'module' })
    const component = ast.program.body.find(node => node.type === 'ExportDefaultDeclaration').declaration
    const methods = component.properties.find(node => node.key.name === 'methods')
    const openVideo = methods.value.properties.find(node => node.key.name === 'openVideoPlayer')
    const fn = vm.runInNewContext('({' + generate(openVideo).code + '}).openVideoPlayer', {
      getUserInfo: () => ({ userId: 'teacher-1' }), console: { log() {} }
    })
    const routes = []
    const page = { $router: { push: route => routes.push(route) } }
    fn.call(page, { id: 'history-record', taskUuid: 'task', liveLessonId: 'lesson' }, true)
    assert.equal(routes[0].query.historyLessonId, 'history-record')
    assert.equal(routes[0].query.liveId, '')
    fn.call(page, { id: 'live-record', taskUuid: 'task', liveLessonId: 'lesson' })
    assert.equal(routes[1].query.liveId, 'live-record')
    assert.equal(routes[1].query.historyLessonId, '')
  }
})

test('courseware and host templates compile with the existing Vue compiler', () => {
  for (const filename of [coursewarePath, 'src/components/AIListening/index.vue', 'src/components/FilePreview/index.vue']) {
    const { template } = compiler.parseComponent(fs.readFileSync(path.join(root, filename), 'utf8'))
    const compiled = compiler.compileTemplate({ source: template.content, filename })
    assert.deepEqual(compiled.errors, [], filename)
  }
})
