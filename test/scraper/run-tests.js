'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const runScraperContractTests = require('./contract.test')

function readJsonFixture(root, filename) {
  const fixturePath = path.join(root, 'test', 'scraper', 'fixtures', filename)
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
}

module.exports = async function runScraperTests(root, manifest) {
  const searchFixture = readJsonFixture(root, 'search.json')
  const detail = readJsonFixture(root, 'book-detail.json')
  const chapter = readJsonFixture(root, 'chapter.json')
  const html = fs.readFileSync(path.join(root, 'test', 'scraper', 'fixtures', 'chapter.html'), 'utf8')
  assert.equal(manifest.icon, './public/icon.png')
  assert.ok(manifest.permissions.includes('network'))
  assert.ok(manifest.permissions.includes('reader'))
  assert.ok(Array.isArray(manifest.network?.allowedHosts) && manifest.network.allowedHosts.length > 0)
  assert.equal(
    manifest.network.allowedHosts.includes(new URL(manifest.contributes.scraper.site.baseUrl).hostname),
    true
  )
  assert.deepEqual(manifest.contributes.scraper.capabilities, ['search', 'getBookDetail', 'getChapter'])

  async function smokeBundle(filename) {
    const entryPath = path.join(root, 'dist', filename)
    assert.ok(fs.existsSync(entryPath), `${filename} must be built before testing`)
    delete require.cache[require.resolve(entryPath)]
    const extension = require(entryPath)
    const logs = []
    const requests = []
    let handlers

    const mockNovel = {
      version: '1.0.0',
      extension: { id: manifest.name },
      logger: {
        info: async value => logs.push(value),
        warn: async () => undefined,
        error: async () => undefined
      },
      network: {
        fetchJson: async url => {
          requests.push(url)
          const requestUrl = new URL(url)
          const pathname = requestUrl.pathname
          if (pathname === '/api/books') {
            if (requestUrl.searchParams.get('query') === 'invalid') {
              return { ...searchFixture, items: [{ ...searchFixture.items[0], id: 0 }] }
            }
            if (requestUrl.searchParams.get('query') === 'data-image') {
              return {
                ...searchFixture,
                items: [{ ...searchFixture.items[0], image: 'data:image/png;base64,aGVsbG8=' }]
              }
            }
            if (requestUrl.searchParams.get('query') === 'rate-limited') {
              throw new Error('Source request failed with HTTP 429.')
            }
            return searchFixture
          }
          if (pathname === '/api/books/101') return detail
          if (pathname === '/api/chapters/301') return chapter
          if (pathname === '/api/chapters/invalid') return { ...chapter, paragraphs: ['  '] }
          throw new Error(`Unexpected fixture request: ${url}`)
        }
      },
      scraper: { register: async registered => { handlers = registered } },
      settings: { register: async () => undefined },
      storage: {
        get: async key => (key === 'models/voice.onnx' ? { name: 'voice.onnx' } : null),
        set: async () => undefined,
        remove: async () => undefined,
        createAssetUrl: async path => (path === 'models/voice.onnx' ? 'novel-ext://mock-token/voice.onnx' : null)
      }
    }
    await extension.activate(mockNovel)

    assert.equal(await mockNovel.storage.createAssetUrl('models/voice.onnx'), 'novel-ext://mock-token/voice.onnx')
    assert.deepEqual(logs, [`Activated ${manifest.name}`])
    assert.deepEqual(extension.extractArticleParagraphs(html, '.chapter-content'), [
      'First HTML fixture paragraph.',
      'Second HTML fixture paragraph.'
    ])
    assert.deepEqual(
      extension.extractArticleParagraphs('<article class="chapter-content">One<br>Two</article>', '.chapter-content'),
      ['One', 'Two']
    )
    assert.deepEqual(Object.keys(handlers).sort(), manifest.contributes.scraper.capabilities.slice().sort())
    const searchResult = await handlers.search({ filters: { query: 'fixture' }, page: 2, pageSize: 20 })
    assert.equal(searchResult.items[0].book_id, 101)
    assert.equal(new URL(requests[0]).searchParams.get('query'), 'fixture')
    const dataImageResult = await handlers.search({ filters: { query: 'data-image' }, page: 1, pageSize: 20 })
    assert.equal(dataImageResult.items[0].book_image, 'data:image/png;base64,aGVsbG8=')
    assert.equal((await handlers.getBookDetail({ bookRef: '101' })).volumes[0].chapters[0].chapter_id, 301)
    assert.equal((await handlers.getChapter({ chapterRef: '301' })).content.length, 2)
    await assert.rejects(
      () => handlers.search({ filters: { query: 'invalid' }, page: 1, pageSize: 20 }),
      /search\.items\[0\]\.id/
    )
    await assert.rejects(
      () => handlers.getChapter({ chapterRef: 'invalid' }),
      /chapter\.paragraphs\[0\]/
    )
    await assert.rejects(
      () => handlers.search({ filters: { query: 'rate-limited' }, page: 1, pageSize: 20 }),
      /HTTP 429/
    )

    await runScraperContractTests(root, manifest, handlers)
    await extension.deactivate()
  }

  try {
    await Promise.all([smokeBundle('index.js'), smokeBundle('browser.js')])
    console.log(`[${manifest.displayName}] Scraper profile tests passed`)
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}