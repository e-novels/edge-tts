const path = require('node:path')
const fs = require('node:fs')
const { build } = require('esbuild')

const root = __dirname
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension.json'), 'utf8'))
const extensionKind = manifest.starter?.kind

async function bundle(outfile, platform) {
  await build({
    entryPoints: [path.join(root, 'src/index.ts')],
    outfile: path.join(root, outfile),
    bundle: true,
    format: 'cjs',
    platform,
    mainFields: platform === 'browser' ? ['browser', 'module', 'main'] : ['module', 'main'],
    target: 'es2022',
    legalComments: 'none',
    minify: false,
    define: {
      __NOVEL_EXTENSION_KIND__: JSON.stringify(extensionKind)
    }
  })
}

Promise.all([
  bundle('dist/index.js', 'neutral'),
  bundle('dist/browser.js', 'browser')
]).catch(error => {
  console.error(error)
  process.exitCode = 1
})