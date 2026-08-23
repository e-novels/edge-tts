import { CloudBridge } from './cloudMode/bridge'

export async function activateTTS(novel: NovelExtensionApi): Promise<void> {
  if (!novel.tts) return

  const bridge = new CloudBridge(novel)
  await novel.tts.register({
    getVoices: async () => bridge.getVoices(),
    speak: async (params: ExtensionTTSSpeakRequest) => bridge.speak(params),
    stop: async () => bridge.stop()
  })
}
