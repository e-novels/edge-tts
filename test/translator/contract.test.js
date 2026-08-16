'use strict'

const assert = require('node:assert/strict')
const { enforceContract } = require('../contractValidator')

module.exports = async function runTranslatorContractTests(root, manifest, handlers) {
  console.log('  Running Translator Contract Enforcement Tests...')

  // 1. Positive Tests
  if (handlers) {
    if (typeof handlers.translate === 'function') {
      const res = await handlers.translate({ text: 'Hello' })
      assert.doesNotThrow(() => {
        enforceContract('translator', 'translate', res.translatedText || res)
      })
    }
  }

  // 2. Negative Contract Tests
  assert.throws(
    () => enforceContract('translator', 'translate', ''),
    /translate response must be a non-empty string/,
    'Translator.translate must reject empty string'
  )
  assert.throws(
    () => enforceContract('translator', 'translate', { invalid: true }),
    /translate response must be a non-empty string/,
    'Translator.translate must reject objects'
  )
  assert.throws(
    () => enforceContract('translator', 'translateBatch', ['T1'], { expectedBatchCount: 2 }),
    /returned 1 items, expected exactly 2/,
    'Translator.translateBatch must reject length mismatch'
  )

  console.log('  [PASS] All Translator Contract Enforcement Tests passed successfully.')
}
