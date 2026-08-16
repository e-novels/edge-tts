'use strict'

const assert = require('node:assert/strict')
const { enforceContract } = require('../contractValidator')

module.exports = async function runTTSContractTests(root, manifest, handlers) {
  console.log('  Running TTS Contract Enforcement Tests...')

  // 1. Positive Tests
  if (handlers) {
    if (typeof handlers.getVoices === 'function') {
      const res = await handlers.getVoices()
      assert.doesNotThrow(() => {
        enforceContract('tts', 'getVoices', res.voices || res)
      })
    }
  }

  // 2. Negative Contract Tests
  assert.throws(
    () => enforceContract('tts', 'getVoices', 'not-an-array'),
    /must be an array of voice objects/,
    'TTS.getVoices must reject non-array'
  )
  assert.throws(
    () => enforceContract('tts', 'getVoices', [{ id: '' }]),
    /must contain "id" and "name" strings/,
    'TTS.getVoices must reject missing voice name'
  )
  assert.throws(
    () => enforceContract('tts', 'synthesize', null),
    /must not be null or undefined/,
    'TTS.synthesize must reject null'
  )

  console.log('  [PASS] All TTS Contract Enforcement Tests passed successfully.')
}
