'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')

module.exports = async function runUtilitiesTests(root) {
  const entryPath = path.join(root, 'dist', 'index.js')
  assert.ok(fs.existsSync(entryPath), 'dist/index.js must be built before testing utilities')
  
  delete require.cache[require.resolve(entryPath)]
  const extension = require(entryPath)

  assert.ok(typeof extension.initExtensionApi === 'function', 'initExtensionApi should be exported')
  assert.ok(typeof extension.logger === 'object', 'logger should be exported')
  assert.ok(typeof extension.network === 'object', 'network should be exported')
  assert.ok(typeof extension.storage === 'object', 'storage should be exported')
  assert.ok(typeof extension.env === 'object', 'env should be exported')

  // Before activation, accessing getNovelApi should throw an error
  assert.throws(
    () => extension.getNovelApi(),
    /Extension API context is not initialized/
  )

  const logs = []
  const requests = []
  const mockNovel = {
    version: '1.2.3',
    platform: 'darwin',
    extension: { id: 'test-extension', manifest: { name: 'Test' } },
    logger: {
      info: async value => { logs.push(['info', value]) },
      warn: async value => { logs.push(['warn', value]) },
      error: async value => { logs.push(['error', value]) }
    },
    network: {
      fetchJson: async url => {
        requests.push(url)
        return { ok: true }
      },
      fetchText: async () => 'hello',
      fetchDataUrl: async () => 'data:text/plain;base64,aGVsbG8='
    },
    storage: {
      get: async key => (key === 'token' ? 'secret' : null),
      set: async () => undefined,
      remove: async () => undefined,
      createAssetUrl: async path => `novel-ext://${path}`
    },
    scraper: { register: async () => undefined },
    settings: { register: async () => undefined }
  }

  // Initialize
  extension.initExtensionApi(mockNovel)
  assert.equal(extension.isNovelApiInitialized(), true)
  assert.equal(extension.getNovelApi(), mockNovel)
  assert.equal(extension.env.version, '1.2.3')
  assert.equal(extension.env.platform, 'darwin')
  assert.equal(extension.env.extensionId, 'test-extension')

  // Test logger utility
  await extension.logger.info('test info')
  await extension.logger.warn('test warn')
  await extension.logger.error('test error')
  assert.deepEqual(logs, [
    ['info', 'test info'],
    ['warn', 'test warn'],
    ['error', 'test error']
  ])

  // Test network utility
  const jsonRes = await extension.network.fetchJson('https://api.example.com/data')
  assert.deepEqual(jsonRes, { ok: true })
  assert.equal(requests[0], 'https://api.example.com/data')
  assert.equal(await extension.network.fetchText('https://example.com'), 'hello')

  // Test storage utility
  assert.equal(await extension.storage.get('token'), 'secret')
  assert.equal(await extension.storage.createAssetUrl('test.png'), 'novel-ext://test.png')

  // Test missing network permission error handling
  const noNetworkNovel = {
    ...mockNovel,
    network: undefined
  }
  extension.initExtensionApi(noNetworkNovel)
  assert.throws(
    () => extension.network.fetchJson('https://example.com'),
    /requires the network permission/
  )

  // Reset
  extension.resetExtensionApiForTest()
  assert.equal(extension.isNovelApiInitialized(), false)

  console.log('[Utilities] SDK Utilities unit tests passed')
}

if (require.main === module) {
  const root = path.join(__dirname, '..')
  module.exports(root).catch(err => {
    console.error(err)
    process.exitCode = 1
  })
}
