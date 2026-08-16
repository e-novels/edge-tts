'use strict'

const assert = require('node:assert/strict')
const { enforceContract } = require('../contractValidator')

module.exports = async function runScraperContractTests(root, manifest, handlers) {
  console.log('  Running Scraper Contract Enforcement Tests...')

  // 1. Positive Tests (Data from valid handlers must pass contract)
  if (handlers) {
    if (typeof handlers.search === 'function') {
      const searchRes = await handlers.search({ filters: { query: 'test' }, page: 1, pageSize: 20 })
      assert.doesNotThrow(() => {
        enforceContract('scraper', 'search', searchRes)
      }, 'Valid search handler output must pass search contract')
    }

    if (typeof handlers.getBookDetail === 'function') {
      const bookRes = await handlers.getBookDetail({ bookRef: '101' })
      assert.doesNotThrow(() => {
        enforceContract('scraper', 'getBookDetail', bookRes)
      }, 'Valid getBookDetail handler output must pass bookDetail contract')
    }

    if (typeof handlers.getChapter === 'function') {
      const chapterRes = await handlers.getChapter({ chapterRef: '301', bookRef: '101' })
      assert.doesNotThrow(() => {
        enforceContract('scraper', 'getChapter', chapterRes)
      }, 'Valid getChapter handler output must pass chapter contract')
    }

    if (typeof handlers.download === 'function') {
      const downloadRes = await handlers.download({ book_id: '101' })
      assert.doesNotThrow(() => {
        enforceContract('scraper', 'download', downloadRes)
      }, 'Valid download handler output must pass download contract')
    }
  }

  // 2. Negative Contract Tests: Strict Type & Value Invariants

  // A. Search Contract Violations
  assert.throws(
    () => enforceContract('scraper', 'search', { items: 'not-an-array', pagination: {} }),
    /items.*must be an array/,
    'Search must reject non-array items'
  )
  assert.throws(
    () => enforceContract('scraper', 'search', { items: [{ book_name: '' }], pagination: { page: 1, pageSize: 20 } }),
    /book_name.*must not be empty/,
    'Search must reject empty book_name'
  )
  assert.throws(
    () => enforceContract('scraper', 'search', { items: [], pagination: { page: 0, pageSize: 20 } }),
    /pagination\.page.*must be >= 1/,
    'Search must reject page < 1'
  )
  assert.throws(
    () => enforceContract('scraper', 'search', { items: [], pagination: { page: 1, pageSize: 20, totalItems: 'invalid' } }),
    /pagination\.totalItems.*must be a valid number/,
    'Search must reject non-numeric totalItems'
  )

  // B. BookDetail Contract Violations
  assert.throws(
    () => enforceContract('scraper', 'getBookDetail', { book_name: '', volumes: [] }),
    /book_name.*must not be empty/,
    'BookDetail must reject empty book_name'
  )
  assert.throws(
    () => enforceContract('scraper', 'getBookDetail', { book_name: 'Novel', authors: 'not-array' }),
    /authors.*must be an array/,
    'BookDetail must reject non-array authors'
  )
  assert.throws(
    () => enforceContract('scraper', 'getBookDetail', { book_name: 'Novel', volumes: 'not-array' }),
    /volumes.*must be an array/,
    'BookDetail must reject non-array volumes'
  )

  // C. Chapter Contract Violations
  assert.throws(
    () => enforceContract('scraper', 'getChapter', { chapter_name: 'Chap 1', chapter_number: 1, content: [] }),
    /content.*must not be empty/,
    'Chapter must reject empty content array'
  )
  assert.throws(
    () => enforceContract('scraper', 'getChapter', { chapter_name: 'Chap 1', chapter_number: 1, content: 'raw string' }),
    /content.*must be an array of paragraph strings/,
    'Chapter must reject string content (must be string[])'
  )

  // D. Download Contract Violations (Strict ID Hierarchy & Full Content)
  assert.throws(
    () => enforceContract('scraper', 'download', { book_id: '', book_name: 'Novel', volumes: [] }),
    /book_id.*must be a non-empty string or positive number/,
    'Download must reject empty book_id'
  )
  assert.throws(
    () => enforceContract('scraper', 'download', {
      book_id: 101,
      book_name: 'Novel',
      volumes: [
        {
          volume_id: '',
          volume_name: 'Vol 1',
          volume_number: 1,
          chapters: [{ chapter_id: 301, chapter_name: 'Ch 1', chapter_number: 1, content: ['P1'] }]
        }
      ]
    }),
    /volume_id.*must be a non-empty string or positive number/,
    'Download must reject empty volume_id'
  )
  assert.throws(
    () => enforceContract('scraper', 'download', {
      book_id: 101,
      book_name: 'Novel',
      volumes: [
        {
          volume_id: 201,
          volume_name: 'Vol 1',
          volume_number: 1,
          chapters: [{ chapter_id: '', chapter_name: 'Ch 1', chapter_number: 1, content: ['P1'] }]
        }
      ]
    }),
    /chapter_id.*must be a non-empty string or positive number/,
    'Download must reject empty chapter_id'
  )
  assert.throws(
    () => enforceContract('scraper', 'download', {
      book_id: 101,
      book_name: 'Novel',
      volumes: [
        {
          volume_id: 201,
          volume_name: 'Vol 1',
          volume_number: 1,
          chapters: [{ chapter_id: 301, chapter_name: 'Ch 1', chapter_number: 1, content: [] }]
        }
      ]
    }),
    /content.*must be a non-empty array of strings/,
    'Download must reject chapter with empty content array'
  )

  console.log('  [PASS] All Scraper Contract Enforcement Tests passed successfully.')
}
