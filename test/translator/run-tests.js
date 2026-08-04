'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

module.exports = async function runTranslatorTests(root, manifest) {
  assert.equal(manifest.icon, './public/icon.png')
  assert.ok(manifest.permissions.includes('translate'))
  assert.equal(manifest.contributes?.scraper, undefined)

  async function smokeBundle(filename) {
    const entryPath = path.join(root, 'dist', filename)
    assert.ok(fs.existsSync(entryPath), `${filename} must be built before testing`)
    delete require.cache[require.resolve(entryPath)]
    const extension = require(entryPath)
    const logs = []
    let registeredTranslator = null

    await extension.activate({
      version: '1.0.0',
      extension: { id: manifest.name },
      logger: {
        info: async value => logs.push(value),
        warn: async () => undefined,
        error: async () => undefined
      },
      scraper: { register: async () => { throw new Error('Translator profile must not register a scraper.') } },
      settings: { register: async () => undefined },
      translator: {
        register: async handlers => {
          registeredTranslator = handlers
        }
      }
    })

    assert.ok(registeredTranslator !== null, 'Translator handlers should be registered')
    assert.equal(typeof registeredTranslator.translate, 'function')

    const getLanguagesRes = await registeredTranslator.getLanguages()
    assert.deepEqual(getLanguagesRes.targetLanguages, ['en', 'vi'])

    const translateRes = await registeredTranslator.translate({
      paragraphs: ['Hello world', 'Second paragraph']
    })
    assert.equal(translateRes.translatedParagraphs.length, 2)
    assert.equal(translateRes.translatedParagraphs[0], '[AI Translated] Hello world')

    await extension.deactivate()
  }

  try {
    await Promise.all([smokeBundle('index.js'), smokeBundle('browser.js')])
    console.log(`[${manifest.displayName}] Translator profile tests passed`)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}
