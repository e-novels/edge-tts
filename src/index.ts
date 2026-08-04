import { activateScraper } from './scraper'
import { activateTheme } from './theme'
import { activateTTS } from './tts'
import { registerTranslatorProfile } from './translator'

export { extractArticleParagraphs } from './scraper/html'

declare const __NOVEL_EXTENSION_KIND__: 'scraper' | 'theme' | 'tts' | 'translator'

export async function activate(novel: NovelExtensionApi): Promise<void> {
  if (__NOVEL_EXTENSION_KIND__ === 'scraper') {
    await activateScraper(novel)
  } else if (__NOVEL_EXTENSION_KIND__ === 'tts') {
    await activateTTS(novel)
  } else if (__NOVEL_EXTENSION_KIND__ === 'translator') {
    registerTranslatorProfile(novel)
  } else {
    await activateTheme(novel)
  }
  await novel.logger.info(`Activated ${novel.extension.id}`)
}

export async function deactivate(): Promise<void> {
  return
}