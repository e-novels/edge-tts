'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { initialize, parseOptions } = require('../init')

const root = path.join(__dirname, '..')
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enovel-extension-init-'))

function createTemplate(target) {
  fs.mkdirSync(path.join(target, 'src', 'scraper'), { recursive: true })
  fs.copyFileSync(path.join(root, 'extension.json'), path.join(target, 'extension.json'))
  fs.copyFileSync(path.join(root, 'src', 'scraper', 'index.ts'), path.join(target, 'src', 'scraper', 'index.ts'))
}

try {
  const scraperRoot = path.join(tempRoot, 'scraper')
  createTemplate(scraperRoot)
  const scraper = initialize(scraperRoot, parseOptions([
    '--name', 'library-source',
    '--display-name', 'Library Source',
    '--publisher', 'independent-dev',
    '--kind', 'scraper',
    '--base-url', 'https://books.example.org/'
  ]))
  assert.equal(scraper.name, 'library-source')
  assert.deepEqual(scraper.network.allowedHosts, ['books.example.org'])
  assert.equal(scraper.contributes.scraper.site.baseUrl, 'https://books.example.org')
  assert.match(fs.readFileSync(path.join(scraperRoot, 'src', 'scraper', 'index.ts'), 'utf8'), /https:\/\/books\.example\.org/)
  assert.throws(() => initialize(scraperRoot, parseOptions([
    '--name', 'other-source', '--display-name', 'Other Source', '--publisher', 'independent-dev', '--kind', 'theme'
  ])), /Refusing to replace/)
  assert.throws(() => initialize(scraperRoot, parseOptions([
    '--name', 'unsafe-source', '--display-name', 'Unsafe Source', '--publisher', 'independent-dev', '--kind', 'scraper',
    '--base-url', 'https://reader:secret@books.example.org'
  ])), /must not include credentials/)
  assert.throws(() => initialize(scraperRoot, parseOptions([
    '--name', 'local-source', '--display-name', 'Local Source', '--publisher', 'independent-dev', '--kind', 'scraper',
    '--base-url', 'http://127.0.0.1:8080'
  ])), /must not use localhost or a private network address/)

  const themeRoot = path.join(tempRoot, 'theme')
  createTemplate(themeRoot)
  const theme = initialize(themeRoot, parseOptions([
    '--name', 'paper-theme',
    '--display-name', 'Paper Theme',
    '--publisher', 'independent-dev',
    '--kind', 'theme'
  ]))
  assert.deepEqual(theme.permissions, ['ui.theme'])
  assert.deepEqual(theme.contributes, {})
  assert.equal(theme.network, undefined)

  const translatorRoot = path.join(tempRoot, 'translator')
  createTemplate(translatorRoot)
  const translator = initialize(translatorRoot, parseOptions([
    '--name', 'ai-translator',
    '--display-name', 'AI Translator',
    '--publisher', 'independent-dev',
    '--kind', 'translator'
  ]))
  assert.deepEqual(translator.permissions, ['translate', 'network', 'storage'])
  assert.equal(translator.contributes.translator.name, 'AI Translator')
  assert.deepEqual(translator.contributes.translator.targetLanguages, ['en', 'vi'])

  const ttsProcessRoot = path.join(tempRoot, 'tts-process')
  createTemplate(ttsProcessRoot)
  const ttsProcess = initialize(ttsProcessRoot, parseOptions([
    '--name', 'my-tts-service',
    '--display-name', 'My TTS Service',
    '--publisher', 'independent-dev',
    '--kind', 'tts',
    '--tts-mode', 'process'
  ]))
  assert.deepEqual(ttsProcess.permissions, ['tts', 'storage'])
  assert.equal(ttsProcess.contributes.tts.mode, 'process')
  assert.deepEqual(ttsProcess.contributes.tts.capabilities, ['getVoices', 'speak', 'stop'])

  const ttsCloudRoot = path.join(tempRoot, 'tts-cloud')
  createTemplate(ttsCloudRoot)
  const ttsCloud = initialize(ttsCloudRoot, parseOptions([
    '--name', 'my-cloud-tts',
    '--display-name', 'My Cloud TTS',
    '--publisher', 'independent-dev',
    '--kind', 'tts',
    '--tts-mode', 'cloud'
  ]))
  assert.deepEqual(ttsCloud.permissions, ['tts', 'network', 'storage'])
  assert.equal(ttsCloud.contributes.tts.mode, 'cloud')

  const ttsWasmRoot = path.join(tempRoot, 'tts-wasm')
  createTemplate(ttsWasmRoot)
  const ttsWasm = initialize(ttsWasmRoot, parseOptions([
    '--name', 'my-wasm-tts',
    '--display-name', 'My WASM TTS',
    '--publisher', 'independent-dev',
    '--kind', 'tts',
    '--tts-mode', 'wasm'
  ]))
  assert.deepEqual(ttsWasm.permissions, ['tts', 'storage'])
  assert.equal(ttsWasm.contributes.tts.mode, 'wasm')

  console.log('Initializer tests passed')
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true })
}