const assert = require('node:assert/strict')
const { test } = require('node:test')
const { UUID } = require('builder-util-runtime')
const { prepareMacInstallation } = require('../electron/mac-installation')
const { build } = require('../package.json')

function createHarness (options = {}) {
  const messages = []
  const moves = []
  const app = {
    isPackaged: options.isPackaged ?? true,
    isInApplicationsFolder: () => options.installed ?? false,
    moveToApplicationsFolder (moveOptions) {
      moves.push(moveOptions)
      if (options.moveError) throw options.moveError
      if (options.conflict && !moveOptions.conflictHandler(options.conflict)) return false
      return options.moveResult ?? true
    }
  }
  const dialog = {
    async showMessageBox (message) {
      messages.push(message)
      return { response: options.response ?? 0 }
    },
    showMessageBoxSync (message) {
      messages.push(message)
      return 0
    }
  }
  return {
    messages,
    moves,
    run: () => prepareMacInstallation({ app, dialog, platform: options.platform ?? 'darwin' })
  }
}

test('Windows upgrade GUID matches the ID generated for previously released installers', () => {
  const historicalId = UUID.v5('com.lisheng.live.pc', UUID.parse('50e065bc-3134-11e6-9bab-38c9862bdaf3'))
  assert.equal(build.appId, 'com.lisheng.live.pc')
  assert.equal(build.nsis.guid, historicalId)
})

for (const options of [
  { platform: 'win32' },
  { platform: 'linux' },
  { isPackaged: false },
  { installed: true }
]) {
  test(`existing installations and development bypass the macOS install prompt: ${JSON.stringify(options)}`, async () => {
    const h = createHarness(options)
    assert.equal(await h.run(), true)
    assert.equal(h.moves.length, 0)
    assert.equal(h.messages.length, 0)
  })
}

test('macOS custom installation directories can still run without moving the App', async () => {
  const h = createHarness({ response: 1 })
  assert.equal(await h.run(), true)
  assert.equal(h.moves.length, 0)
})

test('closing or cancelling the macOS install prompt does not start an extra copy', async () => {
  const h = createHarness({ response: 2 })
  assert.equal(await h.run(), false)
  assert.equal(h.moves.length, 0)
  assert.equal(h.messages[0].cancelId, 2)
})

test('macOS installation moves the App and leaves startup to the installed copy', async () => {
  const h = createHarness()
  assert.equal(await h.run(), false)
  assert.equal(h.moves.length, 1)
})

test('macOS replaces an existing, stopped App instead of creating a versioned copy', async () => {
  const h = createHarness({ conflict: 'exists' })
  assert.equal(await h.run(), false)
  assert.equal(h.moves[0].conflictHandler('exists'), true)
  assert.equal(h.messages.length, 1)
})

test('a running old macOS App blocks replacement instead of being mistaken for the new version', async () => {
  const h = createHarness({ conflict: 'existsAndRunning' })
  assert.equal(await h.run(), false)
  assert.equal(h.messages.length, 2)
  assert.equal(h.messages[1].title, '请先退出旧版本')
})

test('cancelled macOS authorization does not continue to run the uninstalled copy', async () => {
  const h = createHarness({ moveResult: false })
  assert.equal(await h.run(), false)
})

test('macOS copy errors display recovery instructions and stop startup', async () => {
  const h = createHarness({ moveError: new Error('Permission denied') })
  assert.equal(await h.run(), false)
  assert.equal(h.messages[1].type, 'error')
  assert.match(h.messages[1].detail, /替换/)
  assert.match(h.messages[1].detail, /Permission denied/)
})
