const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')
const { createRequire } = require('node:module')
const babelRequire = createRequire(require.resolve('@vue/cli-plugin-babel/package.json'))
const parser = babelRequire('@babel/parser')
const generate = babelRequire('@babel/generator').default
const root = path.resolve(__dirname, '..')

// Execute the real main-process exit handlers without starting network or classroom services.
// Also shared by the native Electron smoke check, which supplies real BrowserWindows.
function getExitSource(mainPath = path.join(root, 'electron/main.js')) {
  const ast = parser.parse(fs.readFileSync(mainPath, 'utf8'))
  const nodes = []
  const windowHandlers = []
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.property.name === 'on') {
      const object = node.callee.object.name
      const event = node.arguments[0]?.value
      if ((object === 'app' && ['activate', 'before-quit', 'will-quit', 'window-all-closed'].includes(event)) ||
          (object === 'ipcMain' && event === 'install-update')) nodes.push(generate(node).code + ';')
      if (object === 'mainWindow' && ['close', 'closed'].includes(event)) windowHandlers.push(generate(node).code + ';')
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  for (const node of ast.program.body) {
    if (node.type === 'VariableDeclaration') {
      const declarations = node.declarations.filter(item => ['mainWindow', 'exitConfirmWindow', 'isQuitting'].includes(item.id.name))
      if (declarations.length) nodes.push(generate({ ...node, declarations }).code)
    }
    if (node.type === 'FunctionDeclaration' && ['quitApplication', 'showExitConfirmDialog'].includes(node.id.name)) nodes.push(generate(node).code)
  }
  visit(ast.program)
  nodes.push(`function bindMainWindowExitHandlers(win) { mainWindow = win; ${windowHandlers.join('\n')} }`)
  nodes.push('globalThis.exitHandlers = { bindMainWindowExitHandlers, showExitConfirmDialog };')
  return nodes.join('\n')
}

const preventable = () => ({ defaultPrevented: false, preventDefault() { this.defaultPrevented = true } })

function createHarness(platform = 'darwin') {
  const app = new EventEmitter()
  const ipcMain = new EventEmitter()
  const windows = new Set()
  const created = []
  const logs = []
  let closingForQuit = false
  let stopCalls = 0
  let activateCreates = 0
  let context

  class FakeWindow extends EventEmitter {
    constructor(options = {}) {
      super()
      this.options = options
      this.destroyed = false
      this.focusCalls = 0
      this.webContents = {}
      windows.add(this)
      created.push(this)
    }
    getBounds() { return { width: 1320, height: 720, x: 0, y: 0 } }
    setBounds() {}
    loadFile() { return Promise.resolve() }
    show() { assert.equal(this.destroyed, false) }
    focus() { this.focusCalls++ }
    isDestroyed() { return this.destroyed }
    close() {
      const event = preventable()
      this.emit('close', event)
      if (!event.defaultPrevented && !this.vetoUnload) this.destroy()
    }
    destroy() {
      if (this.destroyed) return
      for (const win of [...windows]) if (win.options.parent === this) win.destroy()
      this.destroyed = true
      windows.delete(this)
      this.emit('closed')
      if (!windows.size && !closingForQuit) app.emit('window-all-closed')
    }
    static getAllWindows() { return [...windows] }
  }
  app.getVersion = () => 'test'
  app.quitCalls = 0
  app.exited = false
  app.quit = () => {
    app.quitCalls++
    const event = preventable()
    app.emit('before-quit', event)
    if (event.defaultPrevented) return
    closingForQuit = true
    for (const win of [...windows]) {
      win.close()
      if (!win.isDestroyed()) { closingForQuit = false; return }
    }
    const willQuit = preventable()
    app.emit('will-quit', willQuit)
    app.exited = !willQuit.defaultPrevented
    closingForQuit = false
  }
  context = vm.createContext({
    app, ipcMain, BrowserWindow: FakeWindow, path, process: { platform },
    __dirname: path.join(root, 'electron'),
    appendCrashLog: (_, details) => logs.push(details.type),
    markRunStateExited: reason => logs.push(reason + ':recorded'),
    stopScreenGuard: () => { stopCalls++ },
    shell: { openPath: async () => '' },
    setTimeout,
    createWindow: () => {
      activateCreates++
      context.exitHandlers.bindMainWindowExitHandlers(new FakeWindow())
    }
  })
  vm.runInContext(getExitSource(), context)
  const main = new FakeWindow()
  context.exitHandlers.bindMainWindowExitHandlers(main)
  return {
    app, ipcMain, main, logs, windows, created, FakeWindow, context,
    get stopCalls() { return stopCalls },
    get activateCreates() { return activateCreates },
    dialog: () => [...windows].find(win => win.options.modal),
    confirm: () => ipcMain.emit('exit-dialog-confirm'),
    cancel: () => ipcMain.emit('exit-dialog-cancel')
  }
}

if (require.main === module) {
  for (const platform of ['darwin', 'win32', 'linux']) {
    test(`${platform}: one window-close confirmation exits the entire app`, () => {
      const h = createHarness(platform)
      h.main.close()
      assert.ok(h.dialog())
      assert.equal(h.app.exited, false)
      h.confirm()
      assert.equal(h.app.exited, true)
      assert.equal(h.app.quitCalls, 1)
      assert.equal(h.windows.size, 0)
      assert.equal(h.stopCalls, 1)
      assert.equal(h.logs.filter(type => type === 'will-quit').length, 1)
      assert.equal(h.ipcMain.listenerCount('exit-dialog-confirm'), 0)
      assert.equal(h.ipcMain.listenerCount('exit-dialog-cancel'), 0)
    })
  }

  test('Dock/Cmd+Q/system quit waits for one confirmation, then reaches will-quit', () => {
    const h = createHarness()
    h.app.quit()
    assert.ok(h.dialog())
    assert.equal(h.main.isDestroyed(), false)
    assert.equal(h.app.exited, false)
    h.confirm()
    assert.equal(h.app.exited, true)
    assert.equal(h.created.filter(win => win.options.modal).length, 1)
  })

  test('cancelling quit preserves all windows and permits a later confirmed quit', () => {
    const h = createHarness()
    const preview = new h.FakeWindow()
    h.app.quit()
    h.cancel()
    assert.equal(h.app.exited, false)
    assert.equal(h.main.isDestroyed(), false)
    assert.equal(preview.isDestroyed(), false)
    assert.equal(h.stopCalls, 0)
    assert.equal(h.main.listenerCount('move'), 0)
    assert.equal(h.main.listenerCount('resize'), 0)
    assert.equal(h.ipcMain.listenerCount('exit-dialog-confirm'), 0)
    h.main.close()
    h.confirm()
    assert.equal(h.app.exited, true)
  })

  test('repeated window and application quit requests reuse one dialog and one IPC listener', () => {
    const h = createHarness()
    h.main.close()
    const dialog = h.dialog()
    h.main.close()
    h.app.quit()
    h.app.quit()
    assert.equal(h.dialog(), dialog)
    assert.equal(h.created.filter(win => win.options.modal).length, 1)
    assert.equal(h.ipcMain.listenerCount('exit-dialog-confirm'), 1)
    assert.equal(h.ipcMain.listenerCount('exit-dialog-cancel'), 1)
    h.confirm()
    assert.equal(h.app.exited, true)
    assert.equal(h.logs.filter(type => type === 'user-confirm').length, 1)
  })

  test('externally closing the dialog cleans listeners and allows another quit request', () => {
    const h = createHarness()
    h.main.close()
    const first = h.dialog()
    first.destroy()
    assert.equal(h.main.listenerCount('move'), 0)
    assert.equal(h.ipcMain.listenerCount('exit-dialog-confirm'), 0)
    h.main.close()
    assert.notEqual(h.dialog(), first)
    h.cancel()
    first.emit('ready-to-show')
    assert.equal(h.app.exited, false)
  })

  test('confirmed exit also closes previews and cannot be vetoed by classroom beforeunload', () => {
    const h = createHarness()
    const preview = new h.FakeWindow()
    h.main.vetoUnload = true
    preview.vetoUnload = true
    h.main.close()
    h.confirm()
    assert.equal(h.app.exited, true)
    assert.equal(h.windows.size, 0)
    assert.equal(preview.isDestroyed(), true)
  })

  test('Dock activation cannot recreate windows after confirmed exit', () => {
    const h = createHarness()
    h.main.close()
    h.confirm()
    h.app.emit('activate')
    assert.equal(h.activateCreates, 0)
    assert.equal(h.windows.size, 0)
  })

  test('normal Dock activation still recreates a window when not quitting', () => {
    const h = createHarness()
    h.main.destroy()
    h.app.emit('activate')
    assert.equal(h.activateCreates, 1)
    assert.equal(h.windows.size, 1)
  })

  test('install update waits for the installer handoff and exits without another confirmation', async () => {
    const h = createHarness()
    let finishOpening
    h.context.shell.openPath = () => new Promise(resolve => { finishOpening = resolve })
    const handler = h.ipcMain.listeners('install-update')[0]
    const pending = handler({}, '/tmp/update.dmg')
    assert.equal(h.main.isDestroyed(), false)
    finishOpening('')
    await pending
    assert.equal(h.app.exited, true)
    assert.equal(h.windows.size, 0)
    assert.equal(h.created.filter(win => win.options.modal).length, 0)
  })
}

module.exports = { getExitSource }
