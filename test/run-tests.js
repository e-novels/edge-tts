'use strict'

const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension.json'), 'utf8'))

const runners = {
  scraper: './scraper/run-tests',
  theme: './theme/run-tests',
  translator: './translator/run-tests',
  tts: './tts/run-tests'
}
const runner = runners[manifest.starter?.kind]

if (!runner) {
  throw new Error('extension.json starter.kind must be "scraper", "theme", "translator", or "tts".')
}

require(runner)(root, manifest)