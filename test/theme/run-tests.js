'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

module.exports = async function runThemeTests(root, manifest) {
  assert.equal(manifest.icon, './public/icon.png')
  assert.deepEqual(manifest.permissions, ['ui.theme'])
  assert.equal(manifest.contributes?.scraper, undefined)

  async function smokeBundle(filename) {
    const entryPath = path.join(root, 'dist', filename)
    assert.ok(fs.existsSync(entryPath), `${filename} must be built before testing`)
    delete require.cache[require.resolve(entryPath)]
    const extension = require(entryPath)
    const logs = []
    let themeVariables

    await extension.activate({
      version: '1.0.0',
      extension: { id: manifest.name },
      logger: {
        info: async value => logs.push(value),
        warn: async () => undefined,
        error: async () => undefined
      },
      scraper: { register: async () => { throw new Error('Theme profile must not register a scraper.') } },
      settings: { register: async () => undefined },
      ui: { applyTheme: async variables => { themeVariables = variables } }
    })

    assert.deepEqual(logs, [`Activated ${manifest.name}`])
    assert.equal(themeVariables['color-bg-base'], '#f4f7f9')
    assert.equal(themeVariables['color-brand'], '#126782')
    await extension.deactivate()
  }

  try {
    await Promise.all([smokeBundle('index.js'), smokeBundle('browser.js')])
    console.log(`[${manifest.displayName}] Theme profile tests passed`)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}