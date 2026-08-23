import { initExtensionApi, logger } from './utilities'
import { activateTTS } from './tts'
import { edgeTTSClient } from './tts/core/client'

export * from './utilities'

export async function activate(novel: NovelExtensionApi): Promise<void> {
  initExtensionApi(novel)
  await activateTTS(novel)
  await logger.info(`Activated ${novel.extension.id}`)
}

export async function deactivate(): Promise<void> {
  await edgeTTSClient.stop()
}

